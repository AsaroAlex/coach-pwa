// API Module — Anthropic Claude calls with cap protection

// Pricing approximations (in EUR, generous to avoid surprises)
// Claude Sonnet 4: ~$3/M input, $15/M output
// Average chat: ~500 input + 800 output tokens = ~$0.014 = ~€0.013
// Average vision: ~1500 input + 500 output tokens = ~$0.012 = ~€0.011
const COSTS = {
  coach: 0.013,   // average chat call
  vision: 0.012,  // average vision call
};

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

const API = {
  async getKey() {
    const profile = await Storage.getProfile();
    return profile.apiKey;
  },

  async checkCap(type) {
    const profile = await Storage.getProfile();
    const usage = await Storage.getMonthUsage();
    const cap = profile.caps?.[type] || 0;

    // Cap = 0 means unlimited
    if (cap === 0) return { allowed: true, remaining: Infinity };

    const spent = usage[type] || 0;
    return {
      allowed: spent < cap,
      remaining: cap - spent,
      spent,
      cap,
    };
  },

  buildSystemPrompt(profile, recentCheckins, latestWeight) {
    const w = latestWeight?.weight || profile.weight || 78.7;
    const recentSummary = (recentCheckins || []).slice(0, 5)
      .map(c => `${new Date(c.date).toLocaleDateString('it-IT')}: energia ${c.energy}/5, ${c.workout || 'no wo'}, ${c.food?.slice(0, 50) || ''}`)
      .join('; ');

    return `Sei il coach personale di Alex, Assistente Arbitrale calcio Eccellenza Emilia-Romagna.

DATI REALI:
- Peso: ${w}kg, BF 26.8%, BMI 27.9
- HRmax REALE 202bpm (misurato in partita), RHR ~85bpm
- Età: ${profile.age || 25} anni
- Vive a Poggio Renatico (FE), spesa EasyCoop/IperCoop Ferrara
- Si allena a 12:30 pausa pranzo, mangia pranzo dopo
- Usa MacroFactor Workout per i pesi (algoritmo RIR)
- IF 16:8 (solo caffè fino a 12:30)
- Ragazza: Chiara

OBIETTIVI:
- Test Ariet sabato 9 maggio 2026 (1105m al livello 15.1) — passare
- Raduno fine agosto 2026 (stesso test) — superare con 1400m+
- Target: 70kg con addominali entro fine agosto
- Fase 1 (ora→luglio): perdita grasso massima
- Fase 2 (luglio→agosto): performance arbitraggio

ZONE CARDIACHE (Karvonen reali):
- Z2: 155-167 bpm
- Z3: 167-178 bpm
- Z4: 178-190 bpm
- Z5 (sprint): 190-202 bpm

CHECK-IN RECENTI: ${recentSummary || 'nessuno ancora'}

LINEE GUIDA RISPOSTA:
- Italiano sempre, termini tecnici in inglese (HIIT, RPE, Z2, ecc.)
- Diretto, concreto, motivante (no fluff)
- Mai consigli di SARMs/peptidi/doping (rischio antidoping FIGC)
- Se Alex sembra stanco/stressato, prioritizza recupero
- Considera sempre il prossimo evento (test/partita)
- Risposta breve (max 250 parole), ben strutturata`;
  },

  async chat(question) {
    const cap = await this.checkCap('coach');
    if (!cap.allowed) {
      return {
        error: true,
        message: `Cap mensile €${cap.cap} raggiunto (€${cap.spent.toFixed(2)} spesi). Aumenta il limite in Impostazioni o aspetta il mese prossimo.`,
      };
    }

    const apiKey = await this.getKey();
    if (!apiKey) {
      return { error: true, message: 'API key non configurata. Vai in Impostazioni → API Anthropic Claude.' };
    }

    const profile = await Storage.getProfile();
    const recentCheckins = await Storage.getRecentCheckins(7);
    const latestWeight = await Storage.getLatestWeight();
    const systemPrompt = this.buildSystemPrompt(profile, recentCheckins, latestWeight);

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: 'user', content: question }],
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        return { error: true, message: `API Error ${res.status}: ${err.slice(0, 200)}` };
      }

      const data = await res.json();
      const text = data.content?.find(b => b.type === 'text')?.text || 'Errore risposta.';

      // Track usage
      const inputTokens = data.usage?.input_tokens || 500;
      const outputTokens = data.usage?.output_tokens || 800;
      const realCost = (inputTokens * 3 / 1_000_000 + outputTokens * 15 / 1_000_000) * 0.92; // USD→EUR
      await Storage.trackUsage('coach', realCost);

      // Save to history
      await Storage.addCoachConvo(question, text);

      return { error: false, text, cost: realCost };
    } catch (e) {
      return { error: true, message: `Errore rete: ${e.message}` };
    }
  },

  async analyzePhoto(base64Image) {
    const cap = await this.checkCap('vision');
    if (!cap.allowed) {
      return {
        error: true,
        message: `Cap foto mensile €${cap.cap} raggiunto. Imposta cap a 0 in Impostazioni per illimitato.`,
      };
    }

    const apiKey = await this.getKey();
    if (!apiKey) {
      return { error: true, message: 'API key non configurata.' };
    }

    const profile = await Storage.getProfile();
    const w = profile.weight || 78.7;

    const visionPrompt = `Analizza questa foto di un pasto. L'utente è un assistente arbitrale di calcio (${w}kg, target 70kg, in deficit calorico, IF 16:8).

Fornisci la risposta in QUESTO formato esatto, senza variazioni:

**🍽️ Pasto:** [nome breve]

**📊 Macros stimati:**
- Calorie: ~XXX kcal
- Proteine: XXg
- Carboidrati: XXg  
- Grassi: XXg

**🚦 Semaforo:** 🟢/🟡/🔴

**💡 Note:** [1-2 frasi sull'adeguatezza per i suoi obiettivi]

**✅ Verdetto:** [una frase netta: "ok mangialo" / "ok ma..." / "no, scegli altro"]

Sii preciso ma realistico (non sovrastimare). Se la foto non è di un pasto, rispondi "Non vedo cibo in questa foto."`;

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 600,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64Image } },
              { type: 'text', text: visionPrompt },
            ],
          }],
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        return { error: true, message: `API Error ${res.status}: ${err.slice(0, 200)}` };
      }

      const data = await res.json();
      const text = data.content?.find(b => b.type === 'text')?.text || 'Errore.';

      const inputTokens = data.usage?.input_tokens || 1500;
      const outputTokens = data.usage?.output_tokens || 400;
      const realCost = (inputTokens * 3 / 1_000_000 + outputTokens * 15 / 1_000_000) * 0.92;
      await Storage.trackUsage('vision', realCost);

      // Save analysis
      await Storage.addMealPhoto({ analysis: text, image: base64Image.slice(0, 100) /* preview only */ });

      return { error: false, text, cost: realCost };
    } catch (e) {
      return { error: true, message: `Errore rete: ${e.message}` };
    }
  },

  async testConnection(apiKey) {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 50,
          messages: [{ role: 'user', content: 'Rispondi solo "OK" se ricevi questo.' }],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return { ok: true, message: 'Connessione riuscita ✓' };
      } else {
        const err = await res.text();
        return { ok: false, message: `Errore ${res.status}: ${err.slice(0, 100)}` };
      }
    } catch (e) {
      return { ok: false, message: `Errore: ${e.message}` };
    }
  },
};

window.API = API;

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

  buildSystemPrompt(profile, recentCheckins, latestWeight, recentWorkouts) {
    const w = latestWeight?.weight || profile.weight || 78.7;
    const recentSummary = (recentCheckins || []).slice(0, 5)
      .map(c => `${new Date(c.date).toLocaleDateString('it-IT')}: energia ${c.energy}/5, ${c.workout || 'no wo'}, ${c.food?.slice(0, 50) || ''}${c.notes ? ' | nota: ' + c.notes.slice(0, 60) : ''}`)
      .join('; ');

    const workoutSummary = (recentWorkouts || []).slice(0, 7)
      .map(w => `${new Date(w.date).toLocaleDateString('it-IT')}: ${w.type} ${w.duration_min}min RPE${w.rpe || '?'}${w.pain?.length ? ' DOLORE:' + w.pain.join(',') : ''}`)
      .join('; ');

    // Context fase + macros se Science è caricato (browser only)
    let phaseBlock = '';
    try {
      if (typeof Science !== 'undefined' && typeof TEST_DATES !== 'undefined') {
        const { phase, daysToTest } = Science.currentPhase(new Date(), TEST_DATES, []);
        const lbm = Science.calcLBM(w, profile.bf);
        const tdeeRes = Science.calcTDEE(profile, recentWorkouts || []);
        const targetKcal = Science.calcTargetKcal(tdeeRes.tdee, phase, profile.kcalOffset || 0);
        const macros = Science.calcMacros(targetKcal, w, lbm, phase);
        const meso = Science.currentMesocycleWeek(new Date(), profile.mesoAnchor || '2026-04-06');
        phaseBlock = `

CONTESTO DINAMICO OGGI:
- Fase: ${phase}${daysToTest !== null ? ' (T' + (daysToTest >= 0 ? '+' + daysToTest : daysToTest) + ' dal test1)' : ''}
- TDEE: ${tdeeRes.tdee} kcal · target ${targetKcal} kcal
- Macro: ${macros.prot_g}P / ${macros.carb_g}C / ${macros.fat_g}F${macros.breakfast_carbs_g ? ' · colazione test ' + macros.breakfast_carbs_g + 'g carbs' : ''}
- Settimana mesociclo: ${meso}/4${meso === 4 ? ' (DELOAD: volume × 0.6)' : ''}
- Quando dai consigli alimentari/allenamento, COERENZA con la fase corrente.`;
      }
    } catch(_) {}

    return `Sei il coach personale di Alex, Assistente Arbitrale calcio Eccellenza Emilia-Romagna.${phaseBlock}

DATI REALI ALEX:
- Peso: ${w}kg, BF 26.8%, BMI 27.9
- HRmax REALE 202bpm (misurato in partita), RHR ~85bpm
- Età: ${profile.age || 25} anni
- Vive a Poggio Renatico (FE), spesa EasyCoop/IperCoop Ferrara
- Si allena a 12:30 pausa pranzo, mangia pranzo dopo
- Usa MacroFactor + MacroFactor Workout (algoritmo RIR)
- IF 16:8 (solo caffè fino a 12:30)
- Ragazza: Chiara

ATTREZZATURA:
- Tapis NordicTrack T9 + iFit (max 20 km/h, ma vincolo iFit: intervalli MINIMO 1 minuto)
- Pesi regolabili 3-40.5 kg per mano + panca regolabile
- Spazio MOLTO STRETTO (no movimenti ampi: box jumps, slam ball, burpees ampi)

OBIETTIVI:
- Test Ariet sabato 9 maggio 2026 (1105m al livello 15.1) — passare
- Raduno fine agosto 2026 (stesso test) — superare con 1400m+
- Target: 70kg con addominali entro fine agosto
- Fase 1 (ora→luglio): perdita grasso + base aerobica
- Fase 2 (luglio→agosto): performance arbitraggio

ZONE CARDIACHE (Karvonen HRmax 202, RHR 85):
- Z2: 155-167 bpm = 8.5-9.5 km/h tapis pendenza 1-2%
- Z3: 167-178 bpm = 10-11 km/h
- Z4: 178-190 bpm = 12-13 km/h
- Z5: 190-202 bpm = 14 km/h (NON oltre fino a luglio)

VINCOLI ASSOLUTI TAPIS (NON VIOLARE MAI):
- ❌ MAI proporre velocità >14 km/h come target fino a luglio
- ❌ MAI intervalli sotto 1 minuto (limite iFit)
- ❌ MAI riscaldamento sotto 5 minuti
- ❌ MAI partire a 6 km/h come "camminata" (troppo per stinchi sensibili)
- ✅ Riscaldamento 5 min progressivo: 4→5→6→7→8 km/h
- ✅ Cool-down 5 min sempre presente
- ✅ Pendenza 1-2% per ridurre stress tibia
- ✅ Cammino veloce (6.5 km/h pendenza 6%) è alternativa valida a corsa

REGOLE AUTOREGOLAZIONE (applica SEMPRE):
- DOLORE TIBIA/STINCHI segnalato → STOP cardio impatto. Recovery 24-72h. Consiglia ghiaccio + cammino.
- Mangiato poco → riduci workout 30-50% o sostituisci con Z2 leggero
- Sonno <6h → salta HIIT, sostituisci con Z2 25 min
- Riscaldamento doloroso → NON proseguire intensità, switch a recovery
- Workout consecutivi alta intensità → suggerisci giorno extra recupero

SCHEMA SETTIMANALE BASE (no eventi extra):
- LUN: Pesi MF
- MAR: Z2 cardio 35 min
- MER: HIIT tapis 25 min  
- GIO: Pesi MF
- VEN: Z2 lungo 45 min
- SAB: riposo o Z2 30 min
- DOM: partita o lungo Z2

EVENTI EXTRA (gestione):
- Partita arbitrata = vale 2 sessioni HIIT (recupera 48h prima e dopo)
- Bici intensa = sostituisce HIIT settimana
- Padel intenso = sostituisce HIIT settimana
- Raduno tecnico CRA = vedi come partita

CHECK-IN RECENTI ALEX:
${recentSummary || 'nessuno ancora'}

ULTIMI ALLENAMENTI ALEX:
${workoutSummary || 'nessuno tracciato'}

LINEE GUIDA RISPOSTA:
- Italiano sempre, termini tecnici in inglese (HIIT, RPE, Z2, RIR, EPOC)
- Diretto, concreto, motivante (no fluff, no "dipende")
- Risposta BREVE (max 250 parole), ben strutturata con grassetti
- Considera sempre il prossimo evento e gli ultimi workout
- Se Alex segnala dolore/stanchezza → priorità ASSOLUTA al recupero
- Mai velocità tapis >14 km/h come target

VINCOLI ASSOLUTI:
- NO conteggio calorie ossessivo (sistema semaforo)
- NO stretching come consiglio (Alex lo rifiuta)
- NO consigli SARMs/peptidi/doping (antidoping FIGC)
- NO suggerimenti palestra commerciale (kettlebell pesanti, box jump, ecc.)
- NO movimenti ampi (spazio palestra stretto)`;
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
    const recentWorkouts = await Storage.getRecentWorkouts(7);
    const systemPrompt = this.buildSystemPrompt(profile, recentCheckins, latestWeight, recentWorkouts);

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

  async analyzePhoto(base64Image, customPrompt = null) {
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

    const visionPrompt = customPrompt || `Analizza questa foto di un pasto. L'utente è un assistente arbitrale di calcio (${w}kg, target 70kg, in deficit calorico, IF 16:8).

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

      // Save analysis solo se prompt default (pasti). Per custom prompts (es. health screenshot) il chiamante decide cosa salvare.
      if (!customPrompt) {
        await Storage.addMealPhoto({ analysis: text, image: base64Image.slice(0, 100) /* preview only */ });
      }

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

// Health Module — Apple Health integration via Shortcuts/URL scheme
// PWAs can't directly access HealthKit. Workaround: Apple Shortcuts pass data via URL.
// Format: coachalex://weight?value=78.5
//         coachalex://workout?type=hiit&duration=22

const Health = {
  // Parse incoming URL parameters from Shortcut
  parseURL() {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const value = params.get('value');
    const date = params.get('date');

    if (!action) return null;

    return {
      action,
      value: value ? parseFloat(value) : null,
      date: date || new Date().toISOString().split('T')[0],
    };
  },

  // Handle weight from Shortcut
  async handleWeight(value, date) {
    if (!value || isNaN(value)) return false;
    await Storage.addWeight(value, date);

    // Update profile current weight
    const profile = await Storage.getProfile();
    profile.weight = value;
    await Storage.saveProfile(profile);

    return true;
  },

  // Handle workout from Shortcut/Health
  async handleWorkout(type, duration, calories) {
    // Stored as a checkin entry
    const checkin = {
      date: new Date().toISOString(),
      workout: type,
      workoutDuration: duration,
      workoutCalories: calories,
      source: 'shortcut',
    };
    return Storage.addCheckin(checkin);
  },

  // Handle URL-based actions from Shortcut iOS
  async handleIncoming() {
    const data = this.parseURL();
    if (!data) return null;

    switch (data.action) {
      case 'weight':
        if (data.value) {
          await this.handleWeight(data.value, data.date);
          return { type: 'weight', value: data.value };
        }
        break;
      case 'checkin':
        // Open checkin tab
        return { type: 'navigation', target: 'checkin' };
      case 'foto':
        return { type: 'navigation', target: 'dieta' };
    }
    return null;
  },

  // Generate Shortcut import URLs (deeplinks to iOS Shortcuts)
  generateWeightShortcut() {
    // This URL would be a fully constructed iOS Shortcut .shortcut file URL
    // For MVP: instructions only
    return {
      name: 'Log peso veloce',
      steps: [
        'Apri app Comandi Rapidi',
        'Crea nuovo Shortcut',
        'Aggiungi azione "Chiedi numero" → "Quanto pesi?"',
        'Aggiungi azione "Apri URL" → coachalex://weight?value=[Numero]',
        'Salva come "Log peso"',
      ],
    };
  },

  generateHealthSyncShortcut() {
    return {
      name: 'Sync peso da Salute',
      steps: [
        'Apri Comandi Rapidi',
        'Crea nuovo Shortcut',
        'Aggiungi "Trova campioni di salute"',
        'Configura: Tipo=Massa corporea, Limite=1, Ordina per più recente',
        'Aggiungi "Apri URL": coachalex://weight?value=[Risultato.peso]',
        'Salva. Imposta Automazione: ogni mattina alle 09:00',
      ],
    };
  },

  // ── IMPORT SCREENSHOTS via Vision ────────────────────────
  // Estrae dati strutturati (peso, sonno, passi, calorie attive, HR a riposo) da uno
  // screenshot dell'app Salute / Fitness e li salva su IndexedDB.
  // Costo: ~€0.012 per screenshot (cap vision in Impostazioni).
  HEALTH_SCREENSHOT_PROMPT: `Questo è uno screenshot dell'app iOS "Salute" o "Fitness".
Estrai TUTTI i dati numerici visibili. Restituisci SOLO un blocco JSON valido (niente testo extra).

Schema atteso:
{
  "date": "YYYY-MM-DD" (data visibile o data odierna se assente),
  "weight_kg": number | null,
  "sleep_hours": number | null,
  "steps": number | null,
  "active_kcal": number | null,
  "resting_hr": number | null,
  "hrv_ms": number | null,
  "vo2max": number | null,
  "distance_km": number | null,
  "workout": { "type": string, "duration_min": number, "kcal": number } | null,
  "notes": string (qualsiasi insight rilevante in italiano, max 100 char)
}

Regole:
- Solo JSON, niente \`\`\`backtick, niente prefissi.
- Campi assenti = null (non inventare).
- Se la data non è chiara, usa "${new Date().toISOString().split('T')[0]}".
- Numeri puri (no unità, no virgole, usa il punto decimale).`,

  async importScreenshot(base64Image) {
    const result = await window.API.analyzePhoto(base64Image, this.HEALTH_SCREENSHOT_PROMPT);
    if (result.error) return { ok: false, message: result.message };

    let parsed;
    try {
      // Estrai primo blocco JSON dalla risposta (anche se Claude aggiunge testo prima/dopo)
      const match = result.text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('JSON non trovato nella risposta');
      parsed = JSON.parse(match[0]);
    } catch (e) {
      return { ok: false, message: `Parse JSON fallito: ${e.message}`, raw: result.text };
    }

    // Persisti i campi disponibili. Backward compat: estende checkin/weight esistenti.
    const date = parsed.date || new Date().toISOString().split('T')[0];
    const saved = [];

    if (typeof parsed.weight_kg === 'number') {
      await Storage.addWeight(parsed.weight_kg, date);
      saved.push(`peso ${parsed.weight_kg}kg`);
    }

    // Per sleep/steps/HR: salviamo come checkin parziale arricchito (merge se esiste)
    const enriched = {};
    if (typeof parsed.sleep_hours === 'number') {
      // mappa ore → categorie esistenti dello slider check-in
      enriched.sleep = parsed.sleep_hours < 6 ? '<6' : parsed.sleep_hours < 7 ? '6-7' : parsed.sleep_hours < 8 ? '7-8' : '>8';
      enriched.sleep_hours = parsed.sleep_hours;
      saved.push(`sonno ${parsed.sleep_hours}h`);
    }
    if (typeof parsed.steps === 'number') { enriched.steps = parsed.steps; saved.push(`${parsed.steps} passi`); }
    if (typeof parsed.active_kcal === 'number') { enriched.active_kcal = parsed.active_kcal; saved.push(`${parsed.active_kcal} kcal`); }
    if (typeof parsed.resting_hr === 'number') { enriched.resting_hr = parsed.resting_hr; saved.push(`RHR ${parsed.resting_hr}`); }
    if (typeof parsed.hrv_ms === 'number') { enriched.hrv_ms = parsed.hrv_ms; saved.push(`HRV ${parsed.hrv_ms}ms`); }
    if (typeof parsed.vo2max === 'number') { enriched.vo2max = parsed.vo2max; saved.push(`VO2 ${parsed.vo2max}`); }

    if (Object.keys(enriched).length > 0) {
      enriched.date = new Date(date).toISOString();
      enriched.source = 'health-screenshot';
      await Storage.addCheckin(enriched);
    }

    if (parsed.workout && parsed.workout.type) {
      await Storage.addWorkout({
        date: new Date(date).toISOString(),
        type: parsed.workout.type,
        duration_min: parsed.workout.duration_min || null,
        kcal_active: parsed.workout.kcal || null,
        source: 'health-screenshot',
      });
      saved.push(`workout ${parsed.workout.type}`);
    }

    return { ok: true, saved, date, cost: result.cost };
  },
};

window.Health = Health;

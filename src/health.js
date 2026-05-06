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

  // Generate Shortcut "ricette" — restituiscono URL già pronti per l'app Comandi Rapidi.
  // Tutti gli URL usano l'origin reale della PWA (window.location.origin) — non più lo schema custom coachalex://
  // perché la PWA è raggiungibile solo via HTTPS dopo l'install su Home Screen.
  generateWeightShortcut(origin) {
    return {
      id: 'weight-quick',
      name: 'Log peso veloce',
      icon: '⚖️',
      description: 'Chiede il peso, lo salva nell\'app via URL. Usabile con "Hey Siri, log peso".',
      urlTemplate: `${origin}/?action=weight&value=[Numero]`,
      steps: [
        'Apri app Comandi Rapidi',
        'Tap + per nuovo Shortcut',
        'Aggiungi azione "Chiedi input" → tipo Numero, prompt "Quanto pesi?"',
        'Aggiungi azione "Apri URL" e incolla l\'URL qui sotto',
        'Sostituisci [Numero] con la variabile "Risultato Chiedi input" (tap nella casella URL)',
        'Salva come "Log peso"',
      ],
    };
  },

  generateHealthSyncShortcut(origin) {
    return {
      id: 'weight-auto',
      name: 'Sync peso automatico da Salute',
      icon: '🏥',
      description: 'Ogni mattina legge l\'ultimo peso da Apple Salute e lo salva in app.',
      urlTemplate: `${origin}/?action=weight&value=[PesoSalute]`,
      automation: 'Ogni mattina alle 09:00',
      steps: [
        'Apri Comandi Rapidi',
        'Tap + per nuovo Shortcut',
        'Aggiungi "Trova campioni di salute"',
        'Configura: Tipo=Massa corporea · Limite=1 · Ordina=Più recente',
        'Aggiungi azione "Apri URL" e incolla l\'URL qui sotto',
        'Sostituisci [PesoSalute] con la variabile "Massa corporea" (dal risultato della ricerca)',
        'Salva come "Sync peso Salute"',
        'Tab Automazioni → Crea automazione personale → Ora del giorno → 09:00 → Esegui Shortcut',
      ],
    };
  },

  generateWorkoutSyncShortcut(origin) {
    return {
      id: 'workout-sync',
      name: 'Sync ultimo workout',
      icon: '💪',
      description: 'Dopo l\'allenamento Apple Watch: apre il form pre-compilato con tipo/durata/intensità.',
      urlTemplate: `${origin}/?action=workout&type=hiit&duration_min=25&intensity=heavy&rpe=7`,
      steps: [
        'Apri Comandi Rapidi → nuovo Shortcut',
        'Aggiungi "Trova allenamenti" (Salute) · Limite 1 · Ordina più recente',
        'Aggiungi "Apri URL" e incolla l\'URL qui sotto',
        'Sostituisci i parametri con le variabili: type=Tipo allenamento, duration_min=Durata (in min), intensity=heavy/moderate, rpe= valore fisso (es. 7)',
        'Salva come "Sync ultimo workout"',
        'Opzionale: Automazione → Quando termina allenamento Apple Watch → esegui Shortcut',
      ],
    };
  },

  generateQuickCheckinShortcut(origin) {
    return {
      id: 'checkin-quick',
      name: 'Quick check-in serale',
      icon: '🌙',
      description: 'Reminder ogni sera alle 21:00 che apre direttamente la tab Check-in.',
      urlTemplate: `${origin}/?action=checkin`,
      automation: 'Ogni sera alle 21:00',
      steps: [
        'Apri Comandi Rapidi → nuovo Shortcut',
        'Aggiungi azione "Apri URL" e incolla l\'URL qui sotto',
        'Salva come "Check-in Coach"',
        'Tab Automazioni → Crea automazione personale → Ora del giorno → 21:00 → Esegui Shortcut',
        'Disattiva "Chiedi prima di eseguire" per partenza automatica',
      ],
    };
  },

  generateBackupShortcut(origin) {
    return {
      id: 'backup-weekly',
      name: 'Backup iCloud settimanale',
      icon: '💾',
      description: 'Ogni domenica apre la PWA e scarica un export JSON che puoi salvare in iCloud Drive.',
      urlTemplate: `${origin}/?action=export`,
      automation: 'Ogni domenica alle 22:00',
      steps: [
        'Apri Comandi Rapidi → nuovo Shortcut',
        'Aggiungi azione "Apri URL" e incolla l\'URL qui sotto',
        'L\'app produrrà automaticamente il file JSON di backup',
        'Aggiungi (manuale o automatico) "Salva file" → cartella iCloud Drive/Coach Alex Backups',
        'Salva come "Backup Coach Alex"',
        'Tab Automazioni → Domenica 22:00 → esegui Shortcut',
      ],
    };
  },

  // Restituisce tutti gli shortcut in ordine di utilità.
  generateAllShortcuts(origin) {
    return [
      this.generateBulkImportShortcut(origin),
      this.generateDailySyncShortcut(origin),
      this.generateQuickCheckinShortcut(origin),
      this.generateHealthSyncShortcut(origin),
      this.generateWorkoutSyncShortcut(origin),
      this.generateWeightShortcut(origin),
      this.generateBackupShortcut(origin),
    ];
  },

  // ── BULK IMPORT (1-CLICK STORICO APPLE HEALTH) ──────────
  // L'utente costruisce uno Shortcut iOS che legge HealthKit (365gg di default),
  // assembla un JSON e lo copia in clipboard. Poi apre la PWA con ?action=bulk
  // e tappa "Incolla" -> il parser locale fa upsert idempotente.
  generateBulkImportShortcut(origin, days = 365) {
    return {
      id: 'bulk-import',
      name: '📦 Import storico Apple Salute (1-click)',
      icon: '📦',
      description: `Scarica tutto lo storico ${days}gg da Apple Salute in un colpo: peso, sonno, passi, kcal, HR, HRV, VO2max, distanza, workouts. Il primo setup richiede ~5 min, poi ogni esecuzione è istantanea.`,
      urlTemplate: `${origin}/?action=bulk`,
      automation: 'Una tantum + ogni volta che vuoi ri-sincronizzare',
      steps: [
        'Apri Comandi Rapidi → tap + (nuovo Shortcut)',
        `Aggiungi azione "Trova campioni di salute": Tipo=Massa corporea · Periodo=ultimi ${days} giorni`,
        'Ripeti "Trova campioni di salute" per: Frequenza cardiaca, Frequenza cardiaca a riposo, HRV SDNN, VO2 Max, Calorie attive, Passi, Distanza camminata, Sonno (ore)',
        'Aggiungi "Trova allenamenti": Limite=nessuno · Periodo=ultimi ' + days + ' giorni',
        'Aggiungi azione "Testo" e incolla il template JSON dal bottone "📋 Copia template JSON" qui sotto',
        'Nel template, sostituisci ogni [LISTA_X] con la rispettiva variabile dei "Trova campioni"',
        'Aggiungi "Copia negli appunti" → input = Testo precedente',
        'Aggiungi "Apri URL" e incolla l\'URL qui sotto',
        'Salva come "Import storico Coach Alex"',
        'Esegui lo Shortcut → poi torna sulla PWA, tap "📋 Incolla dagli appunti" e "Analizza"',
      ],
    };
  },

  // Sync incrementale 24h (automation iOS giornaliera)
  generateDailySyncShortcut(origin) {
    return {
      id: 'daily-sync',
      name: '🔁 Sync 24h Apple Salute (automatico)',
      icon: '🔁',
      description: 'Variante leggera: legge solo le ultime 24h e fa upsert nella PWA. Da abbinare a un\'Automation "Ogni giorno 22:00".',
      urlTemplate: `${origin}/?action=bulk`,
      automation: 'Ogni giorno alle 22:00',
      steps: [
        'Duplica lo Shortcut "Import storico Coach Alex"',
        'Cambia ogni "Trova campioni" → Periodo=ultime 24 ore',
        'Cambia "Trova allenamenti" → Periodo=ultime 24 ore',
        'Salva come "Sync giornaliero Coach Alex"',
        'Tab Automazioni → Crea automazione personale → Ora del giorno → 22:00 → Esegui Shortcut',
        'Disattiva "Chiedi prima di eseguire" (necessario iOS 15+)',
      ],
    };
  },

  // Template JSON (utente lo incolla nello Shortcut, poi sostituisce variabili)
  bulkJsonTemplate(days = 365) {
    return JSON.stringify({
      version: 1,
      exportedAt: '[DATA_CORRENTE_ISO]',
      days_window: days,
      // Lo Shortcut deve mappare ogni LISTA_* a un array di campioni HealthKit.
      // Ogni campione ha: { date: "YYYY-MM-DD", value: number, unit: string }
      weights:    '[LISTA_PESO]',
      hr:         '[LISTA_HR]',
      resting_hr: '[LISTA_RHR]',
      hrv:        '[LISTA_HRV]',
      vo2max:     '[LISTA_VO2]',
      active_kcal:'[LISTA_KCAL_ATTIVE]',
      steps:      '[LISTA_PASSI]',
      distance:   '[LISTA_DISTANZA_KM]',
      sleep:      '[LISTA_SONNO_ORE]',
      workouts:   '[LISTA_WORKOUTS]',
    }, null, 2);
  },

  // ── PARSE BULK JSON ─────────────────────────────────────
  // Accetta sia lo schema "raw" (LISTE_X, daily aggregates)
  // sia uno schema già normalizzato { days: [...] }.
  parseBulkJSON(jsonString) {
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      throw new Error('JSON non valido: ' + e.message);
    }
    if (!parsed || typeof parsed !== 'object') throw new Error('Atteso oggetto JSON');
    if (parsed.version !== 1) throw new Error('Schema version non supportato (atteso 1)');

    // Normalizza: aggrega i campioni daily per data → days[].
    const dayMap = {};
    const ensureDay = ymd => {
      if (!dayMap[ymd]) dayMap[ymd] = { date: ymd, workouts: [] };
      return dayMap[ymd];
    };

    // Aggrega liste di campioni HealthKit per data (prende ultimo valore del giorno)
    const ingestList = (list, fieldName) => {
      if (!Array.isArray(list)) return;
      for (const s of list) {
        if (!s || s.date == null || s.value == null) continue;
        const ymd = String(s.date).split('T')[0];
        const v = parseFloat(s.value);
        if (isNaN(v)) continue;
        ensureDay(ymd)[fieldName] = v;
      }
    };

    ingestList(parsed.weights,     'weight_kg');
    ingestList(parsed.hr,          'hr_avg');
    ingestList(parsed.resting_hr,  'resting_hr');
    ingestList(parsed.hrv,         'hrv_ms');
    ingestList(parsed.vo2max,      'vo2max');
    ingestList(parsed.active_kcal, 'active_kcal');
    ingestList(parsed.steps,       'steps');
    ingestList(parsed.distance,    'distance_km');
    ingestList(parsed.sleep,       'sleep_hours');

    if (Array.isArray(parsed.workouts)) {
      for (const w of parsed.workouts) {
        if (!w || !w.date) continue;
        const ymd = String(w.date).split('T')[0];
        ensureDay(ymd).workouts.push({
          date: w.date,
          type: w.type || 'altro',
          duration_min: parseFloat(w.duration_min) || null,
          kcal_active: parseFloat(w.kcal_active || w.kcal) || null,
          hr_avg: parseFloat(w.hr_avg) || null,
          hr_max: parseFloat(w.hr_max) || null,
          distance_km: parseFloat(w.distance_km) || null,
          source: 'apple-health',
        });
      }
    }

    // Schema "diretto" (non liste raw): se ha già `days`, usalo.
    if (Array.isArray(parsed.days)) {
      for (const d of parsed.days) {
        if (!d.date) continue;
        const target = ensureDay(d.date);
        for (const k of ['weight_kg', 'hr_avg', 'resting_hr', 'hrv_ms', 'vo2max', 'active_kcal', 'steps', 'distance_km', 'sleep_hours']) {
          if (typeof d[k] === 'number') target[k] = d[k];
        }
        if (Array.isArray(d.workouts)) {
          for (const w of d.workouts) target.workouts.push({ ...w, source: 'apple-health' });
        }
      }
    }

    const days = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));
    return { version: 1, exportedAt: parsed.exportedAt || null, days };
  },

  // ── BULK IMPORT EXECUTOR ────────────────────────────────
  async bulkImport(parsed, onProgress) {
    const result = { added_weights: 0, added_workouts: 0, added_checkins: 0, errors: [], totalDays: 0 };
    if (!parsed || !Array.isArray(parsed.days)) {
      throw new Error('Schema inatteso (manca days[])');
    }
    result.totalDays = parsed.days.length;

    for (let i = 0; i < parsed.days.length; i++) {
      const d = parsed.days[i];
      try {
        if (typeof d.weight_kg === 'number') {
          await Storage.upsertWeight(d.weight_kg, d.date);
          result.added_weights++;
        }

        // Daily checkin aggregato (sleep, steps, kcal, HR, HRV, VO2)
        const checkin = { date: d.date };
        let hasField = false;
        if (typeof d.sleep_hours === 'number') {
          checkin.sleep_hours = d.sleep_hours;
          checkin.sleep = d.sleep_hours < 6 ? '<6' : d.sleep_hours < 7 ? '6-7' : d.sleep_hours < 8 ? '7-8' : '>8';
          hasField = true;
        }
        if (typeof d.steps === 'number') { checkin.steps = d.steps; hasField = true; }
        if (typeof d.active_kcal === 'number') { checkin.active_kcal = d.active_kcal; hasField = true; }
        if (typeof d.resting_hr === 'number') { checkin.resting_hr = d.resting_hr; hasField = true; }
        if (typeof d.hrv_ms === 'number') { checkin.hrv_ms = d.hrv_ms; hasField = true; }
        if (typeof d.vo2max === 'number') { checkin.vo2max = d.vo2max; hasField = true; }
        if (typeof d.distance_km === 'number') { checkin.distance_km = d.distance_km; hasField = true; }
        if (hasField) {
          checkin.source = 'apple-health';
          await Storage.upsertCheckin(checkin);
          result.added_checkins++;
        }

        // Workouts del giorno
        if (Array.isArray(d.workouts)) {
          for (const w of d.workouts) {
            await Storage.upsertWorkoutByNaturalKey({ ...w, source: 'apple-health' });
            result.added_workouts++;
          }
        }
      } catch (e) {
        result.errors.push({ date: d.date, error: e.message });
      }
      if (typeof onProgress === 'function' && (i % 20 === 0 || i === parsed.days.length - 1)) {
        onProgress(i + 1, parsed.days.length);
      }
    }

    // Profile bookkeeping
    try {
      const profile = await Storage.getProfile();
      profile.bulkImportLast = new Date().toISOString();
      await Storage.saveProfile(profile);
    } catch(_) {}

    return result;
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

if (typeof window !== 'undefined') window.Health = Health;
if (typeof module !== 'undefined' && module.exports) module.exports = Health;

// Science Module — pure functions per calcoli fisiologici / nutrizionali / autoregolazione.
// Single user (Alex). Niente side-effect, niente Storage, niente DOM. Testabile in console.
//
// Riferimenti:
//   Mifflin-St Jeor 1990         — BMR equation per adulti
//   Katch-McArdle                — BMR da LBM (più accurato se BF% noto)
//   Burke et al. 2011            — Carbohydrate loading 7-12 g/kg pre-evento
//   Trexler et al. 2014          — Refeed/diet break per leptina/T3
//   Foster et al. 2001           — Session RPE (sRPE) come carico interno
//   Plews & Buchheit 2017        — HRV-guided training
//   Buchheit 2014                — HRV monitoring practical guide
//
// Esposto come window.Science.

const Science = {

  // ── COMPOSIZIONE ────────────────────────────────────────
  calcLBM(weight, bf) {
    if (typeof weight !== 'number' || weight <= 0) return null;
    if (typeof bf !== 'number' || bf <= 0 || bf >= 80) return null;
    return weight * (1 - bf / 100);
  },

  // ── BMR ─────────────────────────────────────────────────
  // Katch-McArdle (preferito se LBM disponibile): BMR = 370 + 21.6 × LBM
  // Mifflin-St Jeor (fallback): BMR = 10w + 6.25h - 5a + s   (s = +5 M, -161 F)
  calcBMR(profile) {
    if (!profile) return 1700;
    const w = profile.weight || 78.7;
    const lbm = this.calcLBM(w, profile.bf);
    if (lbm) return Math.round(370 + 21.6 * lbm);
    const h = profile.height || 175;
    const a = profile.age || 25;
    const sCoeff = (profile.sex === 'F') ? -161 : 5;
    return Math.round(10 * w + 6.25 * h - 5 * a + sCoeff);
  },

  // ── ACTIVITY MULTIPLIER DINAMICO ────────────────────────
  // Calcola moltiplicatore TDEE basato su kcal_active reali ultimi 14gg.
  // Formula: 1.2 (sedentario base) + avgDailyActiveKcal / BMR.
  // Clamp [1.3, 1.9]. Fallback a 1.55 se < 5 workout con kcal noti.
  calcActivityMultiplier(workouts14d, bmr) {
    if (!Array.isArray(workouts14d) || !bmr) return 1.55;
    const withKcal = workouts14d.filter(w => typeof w.kcal_active === 'number' && w.kcal_active > 0);
    if (withKcal.length < 5) return 1.55;
    const sum = withKcal.reduce((a, w) => a + w.kcal_active, 0);
    const avgDaily = sum / 14;
    const mul = 1.2 + avgDaily / bmr;
    return Math.max(1.3, Math.min(1.9, +mul.toFixed(2)));
  },

  // ── TDEE ────────────────────────────────────────────────
  calcTDEE(profile, workouts14d) {
    const bmr = this.calcBMR(profile);
    const mul = this.calcActivityMultiplier(workouts14d || [], bmr);
    return { tdee: Math.round(bmr * mul), bmr, multiplier: mul };
  },

  // ── PHASE DETECTION ─────────────────────────────────────
  // testDates: { test1:Date, test2:Date }
  // events: array da Storage.getEvents (raduno, partita, ...)
  // Restituisce una stringa fase + giorni-al-test per UI.
  currentPhase(now, testDates, events = []) {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayMs = 86400000;

    // Trova test più vicino in futuro o passato recente (entro +2gg).
    const tests = [];
    if (testDates?.test1) tests.push(testDates.test1);
    if (testDates?.test2) tests.push(testDates.test2);
    let nearestTest = null;
    let nearestDelta = Infinity;
    for (const t of tests) {
      const tDay = new Date(t.getFullYear(), t.getMonth(), t.getDate());
      const delta = Math.round((tDay - today) / dayMs);
      if (delta >= -2 && Math.abs(delta) < Math.abs(nearestDelta)) {
        nearestTest = tDay;
        nearestDelta = delta;
      }
    }

    if (nearestTest !== null) {
      if (nearestDelta === 0) return { phase: 'test-day', daysToTest: 0 };
      if (nearestDelta === -1 || nearestDelta === -2) return { phase: 'recovery', daysToTest: nearestDelta };
      if (nearestDelta === 1 || nearestDelta === 2) return { phase: 'glycogen-loading', daysToTest: nearestDelta };
      if (nearestDelta >= 3 && nearestDelta <= 7) return { phase: 'pre-test-loading', daysToTest: nearestDelta };
    }

    // Refeed sabato (slitta a venerdì se sabato è raduno)
    const dow = today.getDay(); // 0=dom..6=sab
    const isSaturday = dow === 6;
    const isFriday = dow === 5;
    const saturdayDate = isSaturday ? today : new Date(today.getTime() + (6 - dow) * dayMs);
    const saturdayHasRaduno = (events || []).some(e => {
      if (e.type !== 'raduno') return false;
      const d = new Date(e.date);
      return d.getFullYear() === saturdayDate.getFullYear() &&
             d.getMonth() === saturdayDate.getMonth() &&
             d.getDate() === saturdayDate.getDate();
    });
    if (isSaturday && !saturdayHasRaduno) return { phase: 'maintenance-refeed', daysToTest: nearestTest ? nearestDelta : null };
    if (isFriday && saturdayHasRaduno) return { phase: 'maintenance-refeed', daysToTest: nearestTest ? nearestDelta : null };

    return { phase: 'cut', daysToTest: nearestTest ? nearestDelta : null };
  },

  // ── KCAL TARGET PER FASE ────────────────────────────────
  // Multiplier vs TDEE per fase. kcalOffset (intero, es. +100/-150) viene sommato.
  PHASE_MULTIPLIERS: {
    'cut':                 0.78,
    'maintenance-refeed':  1.00,
    'pre-test-loading':    0.95,
    'glycogen-loading':    1.00,
    'test-day':            1.00,
    'recovery':            1.05,
  },

  calcTargetKcal(tdee, phase, kcalOffset = 0) {
    const mul = this.PHASE_MULTIPLIERS[phase] ?? 0.78;
    return Math.round(tdee * mul + (kcalOffset || 0));
  },

  // ── MACRO ADATTIVI ──────────────────────────────────────
  // Proteine g/kg per fase. Carbs override per loading (Burke 2011: 7-12 g/kg).
  // Fat clamp ≥ 0.7 g/kg. Carbs in cut: residuo, min 150g.
  PROTEIN_PER_KG: {
    'cut':                 2.4,
    'maintenance-refeed':  1.8,
    'pre-test-loading':    2.0,
    'glycogen-loading':    1.8,
    'test-day':            1.8,
    'recovery':            2.0,
  },

  calcMacros(targetKcal, weight, lbm, phase) {
    const w = weight || 78.7;
    const proteinPerKg = this.PROTEIN_PER_KG[phase] ?? 2.0;
    const prot_g = Math.round(w * proteinPerKg);

    let carb_g, fat_g;

    if (phase === 'glycogen-loading') {
      // Burke: 7 g/kg BW
      carb_g = Math.round(w * 7);
      const remainingKcal = Math.max(0, targetKcal - prot_g * 4 - carb_g * 4);
      fat_g = Math.max(Math.round(w * 0.7), Math.round(remainingKcal / 9));
    } else if (phase === 'test-day') {
      // Colazione + spuntino: 1.5 g/kg LBM (target colazione, non totale)
      const breakfastCarbs = Math.round((lbm || w * 0.73) * 1.5);
      // Totale giorno: 5 g/kg per supportare test + recovery
      carb_g = Math.round(w * 5);
      fat_g = Math.max(Math.round(w * 0.7), Math.round((targetKcal - prot_g * 4 - carb_g * 4) / 9));
      return { prot_g, carb_g, fat_g, water_ml: 0, breakfast_carbs_g: breakfastCarbs };
    } else {
      // cut / maintenance / pre-test-loading / recovery
      fat_g = Math.max(Math.round(w * 0.85), Math.round(w * 0.7));
      const fatKcal = fat_g * 9;
      const protKcal = prot_g * 4;
      carb_g = Math.max(150, Math.round((targetKcal - protKcal - fatKcal) / 4));
    }

    return { prot_g, carb_g, fat_g };
  },

  // ── IDRATAZIONE ─────────────────────────────────────────
  // 35 ml/kg base + 17 ml per minuto di cardio (allinea a sudorazione media).
  calcHydration(weight, plannedCardioMin = 0) {
    const base = Math.round((weight || 78.7) * 35);
    const cardio = Math.round((plannedCardioMin || 0) * 17);
    return { base_ml: base, cardio_ml: cardio, total_ml: base + cardio };
  },

  // ── BASELINE / TREND ────────────────────────────────────
  // Rolling mean su ultimi N giorni di una serie ordinata (recenti per ultimi).
  calcBaseline(values, days = 7) {
    if (!Array.isArray(values) || values.length === 0) return null;
    const v = values.filter(x => typeof x === 'number' && !isNaN(x));
    if (v.length === 0) return null;
    const slice = v.slice(-days);
    const sum = slice.reduce((a, b) => a + b, 0);
    return +(sum / slice.length).toFixed(2);
  },

  // ── HRV DROP DETECTION ──────────────────────────────────
  // Plews & Buchheit: cala >7% vs baseline 7gg → fatica/affaticamento autonomico.
  detectHRVDrop(hrvSeries, sensitivity = 0.07) {
    if (!Array.isArray(hrvSeries) || hrvSeries.length < 4) return { drop: false };
    const recent = hrvSeries[hrvSeries.length - 1];
    const baseline = this.calcBaseline(hrvSeries.slice(0, -1), 7);
    if (!baseline || !recent) return { drop: false };
    const pct = (recent - baseline) / baseline;
    return {
      drop: pct < -sensitivity,
      pct: +(pct * 100).toFixed(1),
      baseline,
      current: recent,
    };
  },

  // ── RHR RISE DETECTION ──────────────────────────────────
  // RHR > baseline +5 bpm → recupero incompleto / inizio malattia.
  detectRHRRise(rhrSeries, deltaBpm = 5) {
    if (!Array.isArray(rhrSeries) || rhrSeries.length < 4) return { rise: false };
    const recent = rhrSeries[rhrSeries.length - 1];
    const baseline = this.calcBaseline(rhrSeries.slice(0, -1), 7);
    if (!baseline || !recent) return { rise: false };
    const delta = recent - baseline;
    return {
      rise: delta >= deltaBpm,
      delta: +delta.toFixed(1),
      baseline,
      current: recent,
    };
  },

  // ── SESSION LOAD (sRPE Foster 2001) ────────────────────
  // AU = Σ (RPE × duration_min) sugli ultimi N giorni.
  // Soglia conservativa per Alex: > 2000 AU/7gg → forza deload.
  calcSessionLoad(workouts, days = 7) {
    if (!Array.isArray(workouts)) return 0;
    const cutoff = Date.now() - days * 86400000;
    return workouts
      .filter(w => new Date(w.date).getTime() > cutoff)
      .reduce((sum, w) => sum + (w.rpe || 5) * (w.duration_min || 0), 0);
  },

  // ── PERIODIZZAZIONE 3+1 ─────────────────────────────────
  // anchor: ISO date string (es. "2026-04-06"), inizio settimana 1 del mesociclo corrente.
  // Ritorna 1..4. Settimana 4 = deload (volume × 0.6).
  currentMesocycleWeek(now, anchor) {
    if (!anchor) anchor = '2026-04-06';
    const a = new Date(anchor);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startWeekDay = new Date(a.getFullYear(), a.getMonth(), a.getDate());
    const weeksElapsed = Math.floor((today - startWeekDay) / (7 * 86400000));
    if (weeksElapsed < 0) return 1;
    return (weeksElapsed % 4) + 1;
  },

  // ── WEIGHT TREND ADVICE ─────────────────────────────────
  // Regressione lineare su weights (oggetti {date, weight}) ultimi N giorni.
  // Restituisce kg/sett e raccomandazione kcal.
  weightTrendAdvice(weights, days = 14, targetRate = 0.5) {
    if (!Array.isArray(weights) || weights.length < 7) {
      return { action: 'hold', reason: 'dati insufficienti', rate: null };
    }
    const cutoff = Date.now() - days * 86400000;
    const series = weights
      .filter(w => new Date(w.date).getTime() > cutoff)
      .map(w => ({ t: new Date(w.date).getTime(), v: w.weight }))
      .sort((a, b) => a.t - b.t);
    if (series.length < 5) return { action: 'hold', reason: 'pochi dati nel range', rate: null };

    // Linear regression: slope in kg/ms
    const n = series.length;
    const meanT = series.reduce((s, p) => s + p.t, 0) / n;
    const meanV = series.reduce((s, p) => s + p.v, 0) / n;
    let num = 0, den = 0;
    for (const p of series) {
      num += (p.t - meanT) * (p.v - meanV);
      den += (p.t - meanT) ** 2;
    }
    if (den === 0) return { action: 'hold', reason: 'serie costante', rate: 0 };
    const slope = num / den; // kg/ms
    const rateKgWeek = slope * 86400000 * 7;

    if (rateKgWeek < -0.7) {
      return { action: '+100', reason: `perdita ${Math.abs(rateKgWeek).toFixed(2)} kg/sett (sopra range, rischio LBM)`, rate: +rateKgWeek.toFixed(2) };
    }
    if (rateKgWeek > -0.1) {
      return { action: '-150', reason: `peso fermo (${rateKgWeek.toFixed(2)} kg/sett)`, rate: +rateKgWeek.toFixed(2) };
    }
    return { action: 'hold', reason: `progressione regolare (${rateKgWeek.toFixed(2)} kg/sett)`, rate: +rateKgWeek.toFixed(2) };
  },

  // ── TAPER VOLUME MULTIPLIER ─────────────────────────────
  // Riduzione graduale volume nei 5 giorni pre-test. Restituisce 0..1.
  taperVolumeMultiplier(daysToTest) {
    if (daysToTest === null || daysToTest === undefined) return 1.0;
    if (daysToTest >= 6) return 1.0;
    if (daysToTest === 5) return 0.9;
    if (daysToTest === 4) return 0.7;
    if (daysToTest === 3) return 0.5;
    if (daysToTest === 2) return 0.2;
    if (daysToTest === 1) return 0.0;
    if (daysToTest === 0) return 0.0;
    if (daysToTest === -1) return 0.0; // recovery: zero strutturato
    return 0.6; // T+2: mini ripresa
  },

  // ── PAIN ALTERNATIVES ───────────────────────────────────
  // Mapping zona dolore → workout alternativi a basso impatto.
  PAIN_ALTERNATIVES: {
    tibia: [
      { type: 'bici_strada', label: '🚲 Bici Z2 30 min', duration_min: 30, intensity: 'moderate' },
      { type: 'altro',       label: '🚣 Vogatore 20 min', duration_min: 20, intensity: 'moderate' },
      { type: 'altro',       label: '🏊 Nuoto 25 min',    duration_min: 25, intensity: 'moderate' },
      { type: 'pesi_libero', label: '🏋️ Pesi upper body', duration_min: 30, intensity: 'moderate' },
    ],
    ginocchio: [
      { type: 'altro',       label: '🏊 Nuoto 25 min',     duration_min: 25, intensity: 'moderate' },
      { type: 'pesi_libero', label: '🏋️ Pesi upper body', duration_min: 30, intensity: 'moderate' },
      { type: 'mobilita',    label: '🧘 Mobilità 15 min',  duration_min: 15, intensity: 'light' },
    ],
    schiena: [
      { type: 'mobilita',    label: '🧘 Mobilità 20 min',     duration_min: 20, intensity: 'light' },
      { type: 'altro',       label: '🏊 Nuoto dorso 20 min',  duration_min: 20, intensity: 'light' },
      { type: 'recovery_cammino', label: '🚶 Cammino 25 min', duration_min: 25, intensity: 'light' },
    ],
    caviglia: [
      { type: 'bici_strada', label: '🚲 Bici Z2 30 min', duration_min: 30, intensity: 'moderate' },
      { type: 'pesi_libero', label: '🏋️ Pesi upper body', duration_min: 30, intensity: 'moderate' },
      { type: 'altro',       label: '🏊 Nuoto 25 min',    duration_min: 25, intensity: 'moderate' },
    ],
  },

  alternativesForPain(painArr) {
    if (!Array.isArray(painArr) || painArr.length === 0) return [];
    const seen = new Set();
    const out = [];
    for (const zone of painArr) {
      const key = String(zone).toLowerCase().split('_')[0];
      const alts = this.PAIN_ALTERNATIVES[key];
      if (!alts) continue;
      for (const a of alts) {
        if (!seen.has(a.label)) { seen.add(a.label); out.push(a); }
      }
    }
    return out;
  },

  // ── CHECKIN FRESHNESS ───────────────────────────────────
  // Se il check-in più recente è > 24h fa, il semaforo va in stato "in attesa".
  isCheckinFresh(checkin, now = new Date()) {
    if (!checkin || !checkin.date) return false;
    const ageMs = now - new Date(checkin.date);
    return ageMs < 36 * 3600 * 1000; // tolleranza 36h
  },
};

if (typeof window !== 'undefined') window.Science = Science;
if (typeof module !== 'undefined' && module.exports) module.exports = Science;

// Coach Alex — Main app logic
// Single-file app controller. Manages state, navigation, rendering.

let appState = {
  profile: null,
  currentTab: 'oggi',
  ciData: {},
};

// ── INITIALIZATION ──────────────────────────────────────
async function init() {
  // Load profile
  appState.profile = await Storage.getProfile();

  // Show onboarding if first run
  if (!appState.profile.onboardingDone) {
    document.getElementById('onboarding').classList.add('show');
    return;
  }

  // Handle URL actions (from Shortcuts)
  await handleURLActions();

  // Show install banner if not installed
  if (!Notifications.isInstalledPWA() && !localStorage.getItem('install_dismissed')) {
    document.getElementById('install-banner').style.display = 'flex';
  }

  // Render initial state
  await renderAll();

  // Schedule evening check-in if enabled
  if (appState.profile.notifications && Notification.permission === 'granted') {
    Notifications.scheduleEveningCheckin();
  }
}

async function handleURLActions() {
  const incoming = await Health.handleIncoming();
  if (incoming) {
    if (incoming.type === 'weight') {
      showToast(`✓ Peso loggato: ${incoming.value} kg`, 'success');
    } else if (incoming.type === 'navigation') {
      navigateTo(incoming.target);
    }
  }

  // Handle ?action=checkin from PWA shortcuts
  const params = new URLSearchParams(window.location.search);
  const action = params.get('action');
  if (action === 'checkin') navigateTo('checkin');
  else if (action === 'weight') quickLogWeight();
  else if (action === 'foto') navigateTo('dieta');
  else if (action === 'workout') {
    navigateTo('workouts');
    setTimeout(() => prefillWorkoutFromURL(params), 300);
  }
  else if (action === 'export') {
    setTimeout(() => exportData(), 500);
  }
}

async function completeOnboarding() {
  const weight = parseFloat(document.getElementById('ob-weight').value) || 78.7;
  appState.profile.weight = weight;
  appState.profile.onboardingDone = true;
  await Storage.saveProfile(appState.profile);
  await Storage.addWeight(weight);
  document.getElementById('onboarding').classList.remove('show');
  await renderAll();
  showToast('Setup completato ✓', 'success');
}

// ── NAVIGATION ──────────────────────────────────────────
function navigateTo(tab) {
  document.querySelectorAll('.pg').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));

  const tabMap = {
    oggi: 'pg-oggi',
    raduno: 'pg-raduno',
    cardio: 'pg-cardio',
    dieta: 'pg-dieta',
    checkin: 'pg-checkin',
    coach: 'pg-coach',
    foto: 'pg-foto',
    prog: 'pg-prog',
    settings: 'pg-settings',
    workouts: 'pg-workouts',
  };

  const pageId = tabMap[tab];
  if (pageId) {
    document.getElementById(pageId).classList.add('active');
    const navBtn = document.querySelector(`[data-tab="${tab}"]`);
    if (navBtn) navBtn.classList.add('active');
    appState.currentTab = tab;

    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Page-specific render
    if (tab === 'oggi') renderOggi();
    if (tab === 'raduno') renderRaduno();
    if (tab === 'cardio') renderCardio();
    if (tab === 'prog') {
      renderProgress();
      drawWeightChart();
    }
    if (tab === 'settings') renderSettings();
    if (tab === 'foto') renderProgressPhotos();
    if (tab === 'coach') renderCoachHistory();
    if (tab === 'workouts') renderWorkouts();
  }
}

// ── RENDER ALL ──────────────────────────────────────────
async function renderAll() {
  const now = new Date();
  const h = now.getHours();
  const greet = h < 12 ? 'Buongiorno' : (h < 18 ? 'Buon pomeriggio' : 'Buonasera');
  document.getElementById('sb-time').textContent = greet;
  document.getElementById('sb-name').textContent = appState.profile.name || 'Alex';

  const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  document.getElementById('dt-day').textContent = `${days[now.getDay()]} · ${now.getDate()} ${['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'][now.getMonth()]}`;

  const checkins = await Storage.getCheckins();
  const streak = computeStreak(checkins);
  document.getElementById('sb-streak').textContent = streak;
  document.getElementById('sv-streak').textContent = streak;

  const latestWeight = await Storage.getLatestWeight();
  const w = latestWeight?.weight || appState.profile.weight;
  document.getElementById('sv-weight').textContent = w ? w.toFixed(1) : '—';

  // Days until tests
  const test1 = new Date('2026-05-09T09:00:00');
  const test2 = new Date('2026-08-25');
  const test1Days = Math.max(0, Math.ceil((test1 - now) / (24 * 3600 * 1000)));
  const aug = new Date('2026-08-15');
  const augWeeks = Math.max(0, Math.round((aug - now) / (7 * 24 * 3600 * 1000)));

  document.getElementById('sv-test-days').textContent = test1Days || '—';
  document.getElementById('sv-aug-weeks').textContent = augWeeks;

  // Macros
  await renderMacros(w);

  // Today plan
  await renderOggi();
}

// ── OGGI ────────────────────────────────────────────────
async function renderOggi() {
  const now = new Date();
  const dow = now.getDay();
  const checkins = await Storage.getCheckins();
  const todayCheckin = checkins.find(c => isSameDay(new Date(c.date), now));
  const yesterdayCheckin = checkins.find(c => {
    const d = new Date(c.date);
    return Math.abs((now - d) / 86400000 - 1) < 0.5;
  });
  const recentWorkouts = await Storage.getRecentWorkouts(5);
  const yesterdayWorkout = recentWorkouts.find(w => {
    const d = new Date(w.date);
    return Math.abs((now - d) / 86400000 - 1) < 0.7;
  });
  const upcomingEvents = await Storage.getUpcomingEvents();
  const test1 = new Date('2026-05-09T09:00:00');
  const test1Days = Math.ceil((test1 - now) / (24 * 3600 * 1000));

  // ── SEMAFORO autoregolazione ──
  let semaforoPunti = 0;
  let semaforoReasons = [];

  if (yesterdayCheckin) {
    if (yesterdayCheckin.sleep === '<6') { semaforoPunti += 3; semaforoReasons.push('sonno <6h'); }
    else if (yesterdayCheckin.sleep === '6-7') { semaforoPunti += 1; }
    if (yesterdayCheckin.energy <= 2) { semaforoPunti += 3; semaforoReasons.push('energia bassa'); }
    else if (yesterdayCheckin.energy === 3) { semaforoPunti += 1; }
  }

  if (yesterdayWorkout?.pain?.length > 0) {
    semaforoPunti += 4;
    semaforoReasons.push('dolore ' + yesterdayWorkout.pain.join(','));
  }
  if (yesterdayWorkout?.intensity === 'max' || yesterdayWorkout?.rpe >= 8) {
    semaforoPunti += 2;
    semaforoReasons.push('ieri intensità alta');
  }

  let semaforo = 'verde';
  if (semaforoPunti >= 4) semaforo = 'rosso';
  else if (semaforoPunti >= 2) semaforo = 'giallo';

  // Coach message
  let msg = '';
  if (test1Days > 0 && test1Days <= 5) {
    msg = `🚨 <strong>${test1Days} giorni al test Ariet.</strong> Oggi segui il protocollo nel tab "Test". Ogni dettaglio conta.`;
  } else if (test1Days <= 0 && test1Days > -7) {
    msg = `✅ <strong>Test 1 superato!</strong> Riposo e poi parte il Fase 1: trasformazione fisica fino ad agosto.`;
  } else {
    msg = streakMessage(checkins);
  }
  document.getElementById('coach-msg').innerHTML = msg;

  // Schema settimanale aggiornato V1.1
  const planMap = {
    0: { icon: '⚽', title: 'Domenica · Partita o Z2 lungo', tag: 'PARTITA/Z2', color: 'var(--yellow)',
         desc: 'Con partita: vale come 2 HIIT. Senza partita: Z2 lungo 45-60 min al tapis.',
         actions: ['Idratati 250ml 30min prima', 'Pre-partita: 5 min mobilità leggera'] },
    1: { icon: '🏋️', title: 'Lunedì · Pesi (MacroFactor)', tag: 'PESI', color: 'var(--blue)',
         desc: 'Sessione MacroFactor Workout. Lascia che MF gestisca progressione.',
         actions: ['Apri MacroFactor', 'Pranzo entro 30 min dopo'] },
    2: { icon: '🌳', title: 'Martedì · Z2 cardio 35 min', tag: 'Z2', color: 'var(--green)',
         desc: 'Recovery attivo da pesi. 8.5-9.5 km/h pendenza 1-2%, BPM 155-167.',
         actions: ['Riscaldamento 5 min progressivo', 'Cool-down 5 min'] },
    3: { icon: '🔥', title: 'Mercoledì · HIIT tapis 25 min', tag: 'HIIT', color: 'var(--acc)',
         desc: 'Schema "Piramide 1×1": 11→14 km/h, intervalli 1 min con recupero 1 min.',
         actions: ['NO se ieri pesi pesante', 'Vedi protocollo nel tab Cardio'] },
    4: { icon: '🏋️', title: 'Giovedì · Pesi (MacroFactor)', tag: 'PESI', color: 'var(--blue)',
         desc: 'Seconda sessione MF della settimana.',
         actions: ['Apri MacroFactor'] },
    5: { icon: '🌳', title: 'Venerdì · Z2 lungo 45 min', tag: 'Z2', color: 'var(--green)',
         desc: 'Sessione più lunga della settimana. 8.5-9 km/h, BPM 155-167.',
         actions: ['Idratati', 'Cool-down progressivo 5 min'] },
    6: { icon: '😴', title: 'Sabato · Riposo o Z2 leggero', tag: 'RIPOSO', color: 'var(--mu)',
         desc: 'Pre-partita domani: riposo. Senza partita: Z2 30 min ok.',
         actions: ['Recupero attivo'] },
  };

  let plan = planMap[dow];

  // Override plan se semaforo rosso
  if (semaforo === 'rosso') {
    plan = {
      icon: '🚨',
      title: 'OGGI · RECOVERY (semaforo rosso)',
      tag: 'RECOVERY',
      color: 'var(--red)',
      desc: 'Sistema in segnalazione rossa. Salta workout intenso. Cammino leggero 20-30 min OK.',
      actions: ['NO HIIT', 'NO velocità >9 km/h', 'Idratazione + pasto regolare', 'Dormi presto stasera'],
    };
  } else if (semaforo === 'giallo' && (plan.tag === 'HIIT' || plan.tag === 'PESI')) {
    plan = {
      ...plan,
      desc: '🟡 Semaforo giallo. ' + plan.desc + ' Riduci intensità −20% (volume o velocità).',
    };
  }

  document.getElementById('today-icon').textContent = plan.icon;
  document.getElementById('today-title').textContent = plan.title;
  document.getElementById('today-tag').textContent = plan.tag;
  document.getElementById('today-tag').style.color = plan.color;

  let content = '';

  // Semaforo banner
  const semColors = {
    verde: { bg: 'rgba(0,255,136,.1)', col: 'var(--green)', em: '🟢', txt: 'OK' },
    giallo: { bg: 'rgba(255,200,0,.12)', col: 'var(--yellow)', em: '🟡', txt: 'Cautela' },
    rosso: { bg: 'rgba(255,59,92,.12)', col: 'var(--red)', em: '🔴', txt: 'Recovery' }
  };
  const sc = semColors[semaforo];
  content += `<div style="background:${sc.bg};border:1px solid ${sc.col};border-radius:11px;padding:10px 12px;margin-bottom:10px">
    <div style="display:flex;align-items:center;gap:8px">
      <span style="font-size:18px">${sc.em}</span>
      <div style="flex:1">
        <strong style="color:${sc.col};font-size:13px">Semaforo: ${sc.txt}</strong>
        <div style="font-size:11px;color:var(--mu);margin-top:1px">${semaforoReasons.length ? semaforoReasons.join(' · ') : 'tutto in ordine'}</div>
      </div>
    </div>
  </div>`;

  content += `<div class="tip orange">${plan.desc}</div>`;

  // Workout di ieri
  if (yesterdayWorkout) {
    const t = (typeof WORKOUT_TYPES !== 'undefined') ? WORKOUT_TYPES.find(t => t.id === yesterdayWorkout.type) : null;
    const painWarn = yesterdayWorkout.pain?.length ? ' ⚠️ dolore ' + yesterdayWorkout.pain.join(',') : '';
    content += `<div class="tip blue">
      <strong>Ieri:</strong> ${t?.icon || '💪'} ${t?.label || yesterdayWorkout.type} · ${yesterdayWorkout.duration_min} min · RPE ${yesterdayWorkout.rpe || '?'}${painWarn}
    </div>`;
  }

  if (todayCheckin) {
    content += `<div class="tip green">✓ <strong>Check-in fatto oggi.</strong> Energia: ${['💀','😫','😐','😄','🔥'][todayCheckin.energy - 1]} · ${todayCheckin.workout || 'no workout'}</div>`;
  }

  content += plan.actions.map(a => `<div class="row"><div class="ri">→</div><div class="rc"><div class="rt">${a}</div></div></div>`).join('');

  // Prossimi eventi (entro 7 giorni)
  const eventsSoon = upcomingEvents.filter(e => {
    const d = new Date(e.date);
    return (d - now) / 86400000 <= 7;
  });
  if (eventsSoon.length > 0) {
    content += '<div style="font-size:10px;color:var(--mu);text-transform:uppercase;font-weight:700;margin:14px 0 6px;letter-spacing:0.5px">Prossimi 7 giorni</div>';
    content += eventsSoon.slice(0, 3).map(e => {
      const t = (typeof EVENT_TYPES !== 'undefined') ? EVENT_TYPES.find(t => t.id === e.type) : null;
      const d = new Date(e.date);
      const days = Math.ceil((d - now) / 86400000);
      return `<div class="row" onclick="navigateTo('workouts')" style="cursor:pointer"><div class="ri">${t?.icon || '📅'}</div><div class="rc"><div class="rt">${t?.label || e.type}</div><div class="rs">tra ${days} gg · ${d.toLocaleDateString('it-IT', { weekday: 'long' })}</div></div></div>`;
    }).join('');
  }

  document.getElementById('today-content').innerHTML = content;

  // Render raduno alert if test1 within 14 days
  const radunoAlert = document.getElementById('raduno-alert');
  if (test1Days > 0 && test1Days <= 14) {
    radunoAlert.innerHTML = `
      <div class="urgent-banner" onclick="navigateTo('raduno')" style="cursor:pointer">
        <div style="display:flex;gap:12px;align-items:center">
          <div style="font-size:28px">🏟️</div>
          <div style="flex:1">
            <div class="ub-title">Raduno tra ${test1Days} giorn${test1Days === 1 ? 'o' : 'i'}</div>
            <div class="ub-sub">Sabato 9 maggio · Bologna · Ariet AA 1105m<br>Tap per protocollo →</div>
          </div>
        </div>
      </div>`;
  } else {
    radunoAlert.innerHTML = '';
  }
}

async function renderMacros(weight) {
  const w = weight || 78.7;
  const tdee = Math.round((10 * w + 6.25 * 175 - 5 * 25 + 5) * 1.55);
  const target = Math.round(tdee * 0.75);
  const prot = Math.round(w * 2.3);
  const fat = Math.round(w * 0.85);
  const carb = Math.round((target - prot * 4 - fat * 9) / 4);

  document.getElementById('prot-target').textContent = `~${prot}g`;
  document.getElementById('prot-sub').textContent = `2.3 g/kg = ${prot}g · in 3 pasti da ${Math.round(prot/3)}g`;
  document.getElementById('carb-target').textContent = `~${Math.max(carb, 150)}g`;
  document.getElementById('fat-target').textContent = `~${fat}g`;
}

// ── RADUNO ──────────────────────────────────────────────
async function renderRaduno() {
  // Countdown for test 1
  const test1 = new Date('2026-05-09T09:00:00');
  const now = new Date();
  const diff = test1 - now;

  if (diff > 0) {
    const days = Math.floor(diff / 86400000);
    const hrs = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    document.getElementById('cd-test1').innerHTML = `
      <div class="cd-item"><div class="cd-num">${days}</div><div class="cd-lbl">Giorni</div></div>
      <div class="cd-item"><div class="cd-num">${hrs}</div><div class="cd-lbl">Ore</div></div>
      <div class="cd-item"><div class="cd-num">${mins}</div><div class="cd-lbl">Min</div></div>
      <div class="cd-item"><div class="cd-num">${secs}</div><div class="cd-lbl">Sec</div></div>`;
  } else {
    document.getElementById('cd-test1').innerHTML = '<div style="font-size:13px;color:var(--green);text-align:center;padding:12px;width:100%">✓ Test passato! Ora obiettivo agosto.</div>';
  }

  // Aug countdown
  const aug = new Date('2026-08-25');
  const augDiff = aug - now;
  const augDays = Math.max(0, Math.ceil(augDiff / 86400000));
  document.getElementById('aug-countdown').textContent = `~${augDays} gg`;

  // Protocol days
  const today = now.getDay();
  const protocolDays = [
    { day: 'Lun 4 Mag — OGGI', icon: '🟢', label: 'Recupero attivo', desc: 'Hai fatto la partita. Solo cammino. Mangia bene: +carbs, +proteine. Dormi 8h+.', tag: 'Recovery', color: 'var(--green)' },
    { day: 'Mar 5 Mag', icon: '🟡', label: 'Attivazione leggera', desc: '25 min Z2 (155-167 bpm) + 4×20m shuttle ritmo moderato per riattivare i pattern.', tag: 'Z2 + shuttle', color: 'var(--yellow)' },
    { day: 'Mer 6 Mag', icon: '🟡', label: 'Simulazione Ariet', desc: '10 min shuttle 20m con accelerazioni progressive. Poi 20 min pesi leggeri (volume −30%).', tag: 'Test sim', color: 'var(--yellow)' },
    { day: 'Gio 7 Mag', icon: '🟠', label: 'Riposo + carbo loading', desc: 'Zero allenamento. +60g carbs (pasta/riso 2 volte). Idratazione 3L.', tag: 'RIPOSO', color: 'var(--acc)' },
    { day: 'Ven 8 Mag', icon: '🔴', label: 'Riposo assoluto', desc: 'Solo mobilità 10 min. Cena: pasta in bianco 150g + petto pollo. Letto 22:30.', tag: 'PRE-TEST', color: 'var(--red)' },
    { day: 'Sab 9 Mag — TEST', icon: '🏆', label: 'Test Ariet 09:00', desc: 'Sveglia 07:00. Colazione: 80g avena + banana + caffè. H-30: banana. Warm-up 5 min.', tag: 'GAME DAY', color: 'var(--green)' },
  ];

  document.getElementById('protocol-days').innerHTML = protocolDays.map(p => `
    <div class="row">
      <div class="ri">${p.icon}</div>
      <div class="rc"><div class="rt">${p.day}</div><div class="rs"><strong>${p.label}.</strong> ${p.desc}</div></div>
      <div class="rv" style="color:${p.color}">${p.tag}</div>
    </div>`).join('');
}

// ── CARDIO ──────────────────────────────────────────────
async function renderCardio() {
  const profile = appState.profile;
  const hrmax = profile.hrmax || 202;
  const rhr = profile.rhr || 85;
  const z = pct => Math.round(rhr + (hrmax - rhr) * pct);

  const zones = [
    { id: 'z2', cls: 'z2', icon: '❤️', name: 'Zona 2 — FatMax', lo: z(0.60), hi: z(0.70), desc: 'Karvonen 60-70%. Massima ossidazione grassi. 80% del volume cardio qui.', kmh: '9.5-11' },
    { id: 'z3', cls: 'z3', icon: '💛', name: 'Zona 3 — Aerobica intensa', lo: z(0.70), hi: z(0.80), desc: 'Cool-down post-HIIT. Non come sessione principale.', kmh: '11-13' },
    { id: 'z4', cls: 'z4', icon: '🔥', name: 'Zona 4 — Soglia anaerobica', lo: z(0.80), hi: z(0.90), desc: 'Interval MAS 4×4 min. Migliora VO2max e resistenza partita.', kmh: '13-15' },
    { id: 'z5', cls: 'z5', icon: '⚡', name: 'Zona 5 — Sprint HIIT', lo: z(0.90), hi: hrmax, desc: '30s sprint HIIT. Attiva fibre veloci, EPOC, fat burn 24h.', kmh: '17-20+' },
  ];

  document.getElementById('zones-content').innerHTML = zones.map(z => `
    <div class="zone ${z.cls}">
      <div class="zi">${z.icon}</div>
      <div class="zn">
        <div class="zname">${z.name}</div>
        <div class="zdesc">${z.desc}</div>
        <div class="zdesc" style="margin-top:2px;font-style:italic">${z.kmh} km/h</div>
      </div>
      <div>
        <div class="zbpm">${z.lo}-${z.hi}</div>
        <div style="font-size:9px;color:var(--mu);text-align:right">bpm</div>
      </div>
    </div>`).join('');
}

// ── COACH ───────────────────────────────────────────────
async function askCoach() {
  const q = document.getElementById('coach-q').value.trim();
  if (!q) {
    showToast('Scrivi una domanda prima', 'error');
    return;
  }

  const ld = document.getElementById('coach-ld');
  const res = document.getElementById('coach-res');
  ld.style.display = 'flex';
  res.innerHTML = '';

  const result = await API.chat(q);
  ld.style.display = 'none';

  if (result.error) {
    res.innerHTML = `<div class="tip red">${result.message}</div>`;
  } else {
    res.innerHTML = `<div class="air">${md(result.text)}</div>`;
    document.getElementById('coach-q').value = '';
    await updateApiUsage();
  }
}

async function renderCoachHistory() {
  const history = await Storage.getCoachHistory(10);
  const el = document.getElementById('coach-history');
  if (history.length === 0) {
    el.innerHTML = '<div style="font-size:12px;color:var(--mu)">Nessuna conversazione ancora.</div>';
    return;
  }
  el.innerHTML = history.map(h => `
    <div style="background:var(--s1);border-radius:9px;padding:10px;margin-bottom:7px">
      <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--mu);margin-bottom:4px">${new Date(h.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
      <div style="font-size:12px;font-weight:600;margin-bottom:6px">Q: ${h.question.slice(0, 100)}${h.question.length > 100 ? '...' : ''}</div>
      <div style="font-size:11px;color:var(--mu);line-height:1.5">${h.answer.slice(0, 200)}${h.answer.length > 200 ? '...' : ''}</div>
    </div>`).join('');
}

async function updateApiUsage() {
  const usage = await Storage.getMonthUsage();
  const profile = await Storage.getProfile();
  document.getElementById('coach-spent').textContent = (usage.coach || 0).toFixed(2);
  document.getElementById('vision-spent').textContent = (usage.vision || 0).toFixed(2);
  document.getElementById('coach-cap-val').textContent = profile.caps?.coach === 0 ? '∞' : profile.caps?.coach || 3;
  document.getElementById('vision-cap').textContent = profile.caps?.vision === 0 ? '∞' : profile.caps?.vision || 5;
  if (document.getElementById('coach-spent-set')) {
    document.getElementById('coach-spent-set').textContent = (usage.coach || 0).toFixed(2);
    document.getElementById('vision-spent-set').textContent = (usage.vision || 0).toFixed(2);
  }
}

// ── PHOTO ANALYSIS ──────────────────────────────────────
async function analyzePhoto(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async e => {
    const fullData = e.target.result;
    const base64 = fullData.split(',')[1];

    // Show preview
    document.getElementById('photo-zone').classList.add('has-image');
    document.getElementById('photo-zone').innerHTML = `<img src="${fullData}" alt="meal">`;

    const ld = document.getElementById('photo-ld');
    const res = document.getElementById('photo-result');
    ld.style.display = 'flex';
    res.innerHTML = '';

    const result = await API.analyzePhoto(base64);
    ld.style.display = 'none';

    if (result.error) {
      res.innerHTML = `<div class="tip red">${result.message}</div>`;
    } else {
      res.innerHTML = `<div class="air">${md(result.text)}</div>`;
      await updateApiUsage();
      showToast(`✓ Analisi completata (€${result.cost.toFixed(3)})`, 'success');
    }
  };
  reader.readAsDataURL(file);
}

// ── MEAL PLANNER ────────────────────────────────────────
async function genMeal() {
  const ctx = document.getElementById('meal-ctx').value.trim() || 'situazione normale';
  const ld = document.getElementById('meal-ld');
  const res = document.getElementById('meal-res');
  ld.style.display = 'flex';
  res.innerHTML = '';

  const q = `Cosa mangio oggi? Situazione: ${ctx}. Dimmi PRANZO + CENA con quantità precise. Considera IF 16:8, target proteine alte, Ariet ${getDaysToTest()} giorni. Non contare le calorie, dammi il "cosa" e "quanto".`;

  const result = await API.chat(q);
  ld.style.display = 'none';

  if (result.error) {
    res.innerHTML = `<div class="tip red">${result.message}</div>`;
  } else {
    res.innerHTML = `<div class="air">${md(result.text)}</div>`;
    await updateApiUsage();
  }
}

// ── CHECK-IN ────────────────────────────────────────────
function ciS(key, value, el) {
  appState.ciData[key] = value;
  const row = el.closest('.ci-row');
  row.querySelectorAll('.cib').forEach(b => b.classList.remove('sel', 'sel-g', 'sel-y', 'sel-m'));
  el.classList.add('sel');
}

function ciW(value) {
  appState.ciData.workout = value;
  const ids = ['cw-gym', 'cw-hiit', 'cw-z2', 'cw-match', 'cw-rest'];
  ids.forEach(id => document.getElementById(id)?.classList.remove('sel-g', 'sel-y', 'sel-m'));
  const map = { gym: 'cw-gym', hiit: 'cw-hiit', z2: 'cw-z2', match: 'cw-match', rest: 'cw-rest' };
  const cls = { gym: 'sel-g', hiit: 'sel-y', z2: 'sel-g', match: 'sel-y', rest: 'sel-m' };
  if (map[value]) document.getElementById(map[value]).classList.add(cls[value]);
}

async function submitCheckin() {
  const w = document.getElementById('ci-w').value;
  if (w) {
    appState.ciData.weight = parseFloat(w);
    await Storage.addWeight(parseFloat(w));
  }
  appState.ciData.food = document.getElementById('ci-f').value;
  appState.ciData.notes = document.getElementById('ci-n').value;
  appState.ciData.date = new Date().toISOString();

  await Storage.addCheckin(appState.ciData);

  // Build feedback
  document.getElementById('ci-fb').style.display = 'block';
  document.getElementById('ci-fb').innerHTML = buildFeedback(appState.ciData);

  showToast('Check-in salvato ✓', 'success');

  await renderAll();
  document.getElementById('ci-fb').scrollIntoView({ behavior: 'smooth' });

  // Reset
  appState.ciData = {};
  document.getElementById('ci-f').value = '';
  document.getElementById('ci-n').value = '';
  document.getElementById('ci-w').value = '';
}

function buildFeedback(d) {
  const e = d.energy || 3;
  const food = (d.food || '').toLowerCase();
  const w = d.weight;
  const wk = d.workout;
  const em = { 1: '💀', 2: '😫', 3: '😐', 4: '😄', 5: '🔥' };
  const hasP = /pollo|bistecca|uov|tonno|salmone|pesce|carne|bresaola|merluzzo|ricotta|yogurt|ceci/i.test(food);
  const testDays = getDaysToTest();

  let html = `<div class="blk"><div class="bh"><div class="bi">${em[e]}</div><div class="bt">Coach feedback</div><div class="tag ${e >= 4 ? 'tg' : e <= 2 ? 'tr2' : 'ty'}">${e >= 4 ? 'OTTIMO' : e <= 2 ? 'DURO' : 'OK'}</div></div><div class="bb">`;

  if (testDays > 0 && testDays <= 5) {
    html += `<div class="tip red"><strong>🚨 ${testDays} giorni al test!</strong> Segui il protocollo nel tab "Test".</div>`;
  }

  const wkLabels = { gym: '🏋️ Pesi fatto', hiit: '🔥 HIIT fatto', z2: '🌳 Zona 2 fatta', match: '⚽ Partita = cardio', rest: '😴 Riposo' };
  if (wk) html += `<div class="row"><div class="ri">✅</div><div class="rc"><div class="rt">${wkLabels[wk] || '—'}</div></div></div>`;

  if (food.length > 3) {
    if (hasP) html += `<div class="tip green">🟢 <strong>Proteina presente</strong> — preservi muscolo durante il deficit.</div>`;
    else html += `<div class="tip orange">⚠️ <strong>Manca proteina forte.</strong> Domani: tonno/uova/pollo ad ogni pasto.</div>`;
  }

  if (d.sleep === '<6') html += `<div class="tip red">😵 <strong>Sonno insufficiente</strong> blocca il fat burning. Letto 30 min prima stasera.</div>`;

  if (w) {
    const profile = appState.profile;
    const target = profile.target || 70;
    const startW = profile.startWeight || 79.7;
    const lost = startW - w;
    const toGo = Math.max(0, w - target);
    html += `<hr><div class="row"><div class="ri">⚖️</div><div class="rc"><div class="rt">${w}kg — ${toGo.toFixed(1)}kg al target</div><div class="rs">${lost > 0 ? `Persi ${lost.toFixed(1)}kg` : 'Punto di partenza'}</div></div></div>`;
  }

  const motiv = [
    'Il test 1 lo passi. Il test 2 è il vero traguardo.',
    `${getDaysToTest() > 0 ? getDaysToTest() + ' giorni al primo test. Concentrato.' : 'Test 1 fatto. Ora fase 2.'}`,
    'HRmax 202. Hai il motore. Costruisci la base.',
    'Le gambe le hai. Il grasso sta sparendo.',
    'Costanza > intensità. Ogni check-in conta.',
  ];
  html += `<div style="margin-top:9px;font-size:11px;color:var(--acc);font-weight:600">"${motiv[Math.floor(Math.random() * motiv.length)]}"</div>`;
  html += '</div></div>';
  return html;
}

// ── PROGRESS PHOTOS ─────────────────────────────────────
async function saveProgressPhoto(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async e => {
    const week = getWeekKey();
    await Storage.addProgressPhoto(week, e.target.result);
    showToast('Foto salvata ✓', 'success');
    renderProgressPhotos();
  };
  reader.readAsDataURL(file);
}

async function renderProgressPhotos() {
  const photos = await Storage.getProgressPhotos();
  const el = document.getElementById('photo-history');

  if (photos.length === 0) {
    el.innerHTML = '<div style="font-size:12px;color:var(--mu)">Nessuna foto ancora. Carica la prima!</div>';
    return;
  }

  el.innerHTML = photos.map(p => `
    <div style="margin-bottom:10px;background:var(--s1);border-radius:10px;overflow:hidden">
      <img src="${p.image}" style="width:100%;display:block">
      <div style="padding:8px 12px;font-size:11px;color:var(--mu)">${p.week} · ${new Date(p.date).toLocaleDateString('it-IT')}</div>
    </div>`).join('');
}

// ── PROGRESS / FORMA ────────────────────────────────────
async function renderProgress() {
  const checkins = await Storage.getCheckins();
  const weights = await Storage.getWeights();

  // Streak
  document.getElementById('big-streak').textContent = computeStreak(checkins);

  // Stats
  await renderStats(checkins, weights);

  // BF roadmap
  document.getElementById('bf-roadmap').innerHTML = `
    <div style="display:flex;gap:11px;padding:8px 0;border-bottom:1px solid rgba(30,32,48,.7)">
      <div style="font-family:'JetBrains Mono',monospace;font-size:17px;color:var(--acc);width:44px">27%</div>
      <div><div style="font-weight:700;font-size:12px;color:var(--acc)">ORA — 78.7 kg</div>
      <div style="font-size:11px;color:var(--mu)">Gambe sviluppate, grasso su addome.</div></div>
    </div>
    <div style="display:flex;gap:11px;padding:8px 0;border-bottom:1px solid rgba(30,32,48,.7)">
      <div style="font-family:'JetBrains Mono',monospace;font-size:17px;color:var(--yellow);width:44px">23%</div>
      <div><div style="font-weight:700;font-size:12px;color:var(--yellow)">~74-75 kg — Raduno agosto</div>
      <div style="font-size:11px;color:var(--mu)">Viso smagrito, addome più piatto. Target.</div></div>
    </div>
    <div style="display:flex;gap:11px;padding:8px 0">
      <div style="font-family:'JetBrains Mono',monospace;font-size:17px;color:var(--green);width:44px">16%</div>
      <div><div style="font-weight:700;font-size:12px;color:var(--green)">~70 kg — Abs visibili</div>
      <div style="font-size:11px;color:var(--mu)">Six-pack visibile a riposo.</div></div>
    </div>`;

  // Weight progress
  const profile = appState.profile;
  const startW = profile.startWeight || 79.7;
  const currW = weights.length > 0 ? weights[weights.length - 1].weight : profile.weight;
  const target = profile.target || 70;
  const lost = startW - currW;
  const pct = Math.max(0, Math.min(100, (lost / (startW - target)) * 100));

  document.getElementById('start-weight').textContent = startW.toFixed(1);
  document.getElementById('curr-weight').textContent = currW.toFixed(1);
  document.getElementById('lost-kg').textContent = lost > 0 ? `−${lost.toFixed(1)}` : '0';
  document.getElementById('weight-bar').style.width = `${pct}%`;

  // Sessions dots
  const wa = new Date();
  wa.setDate(wa.getDate() - 7);
  const recentSessions = checkins.filter(c => new Date(c.date) >= wa && c.workout && c.workout !== 'rest').length;
  let dots = '';
  for (let i = 0; i < 7; i++) {
    dots += `<div style="width:26px;height:26px;border-radius:6px;background:${i < recentSessions ? 'var(--green)' : 'var(--brd)'};display:flex;align-items:center;justify-content:center;font-size:11px">${i < recentSessions ? '✓' : ''}</div>`;
  }
  document.getElementById('session-dots').innerHTML = dots;

  // History
  const em = { 1: '💀', 2: '😫', 3: '😐', 4: '😄', 5: '🔥' };
  const wi = { gym: '🏋️', hiit: '🔥', z2: '🌳', match: '⚽', rest: '😴' };
  const recent = checkins.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  document.getElementById('checkin-history').innerHTML = recent.length ? recent.map(h => {
    const d = new Date(h.date).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
    return `<div style="background:var(--s1);border-radius:9px;padding:9px 12px;margin-bottom:6px">
      <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--mu);margin-bottom:3px">${d}</div>
      <div style="display:flex;gap:12px;font-size:12px;flex-wrap:wrap">
        <span>${em[h.energy] || '😐'} ${h.energy || '?'}/5</span>
        <span>${wi[h.workout] || '—'}</span>
        ${h.weight ? `<span>⚖️ ${h.weight}kg</span>` : ''}
      </div>
    </div>`;
  }).join('') : '<div style="font-size:12px;color:var(--mu)">Nessun check-in ancora.</div>';
}

async function renderStats(checkins, weights) {
  const stats = [];

  // Weight trend
  if (weights.length >= 2) {
    const last7 = weights.slice(-7);
    const trend = last7[last7.length - 1].weight - last7[0].weight;
    stats.push({
      icon: trend < 0 ? '📉' : '📈',
      label: 'Trend peso 7gg',
      value: `${trend > 0 ? '+' : ''}${trend.toFixed(1)} kg`,
      color: trend < 0 ? 'var(--green)' : 'var(--red)',
    });
  }

  // Average energy last 7 days
  const recent = checkins.filter(c => {
    const d = new Date(c.date);
    return (Date.now() - d) < 7 * 86400000 && c.energy;
  });
  if (recent.length > 0) {
    const avgE = recent.reduce((a, c) => a + (c.energy || 0), 0) / recent.length;
    stats.push({
      icon: avgE >= 4 ? '🔥' : avgE >= 3 ? '😄' : '😫',
      label: 'Energia media 7gg',
      value: `${avgE.toFixed(1)}/5`,
      color: avgE >= 4 ? 'var(--green)' : avgE >= 3 ? 'var(--yellow)' : 'var(--red)',
    });
  }

  // Workout frequency
  const wks = checkins.filter(c => {
    const d = new Date(c.date);
    return (Date.now() - d) < 7 * 86400000 && c.workout && c.workout !== 'rest';
  });
  stats.push({
    icon: '💪',
    label: 'Allenamenti 7gg',
    value: `${wks.length}/7`,
    color: wks.length >= 5 ? 'var(--green)' : wks.length >= 3 ? 'var(--yellow)' : 'var(--red)',
  });

  // Sleep quality
  const sleeps = recent.filter(c => c.sleep);
  if (sleeps.length > 0) {
    const goodSleep = sleeps.filter(c => c.sleep === '7-8' || c.sleep === '>8').length;
    stats.push({
      icon: '😴',
      label: 'Sonno buono 7gg',
      value: `${goodSleep}/${sleeps.length}`,
      color: goodSleep >= sleeps.length * 0.7 ? 'var(--green)' : 'var(--yellow)',
    });
  }

  document.getElementById('stats-content').innerHTML = stats.length === 0
    ? '<div style="font-size:12px;color:var(--mu)">Servono almeno 2-3 check-in per vedere statistiche.</div>'
    : stats.map(s => `
      <div class="row">
        <div class="ri">${s.icon}</div>
        <div class="rc"><div class="rt">${s.label}</div></div>
        <div class="rv" style="color:${s.color};font-size:13px">${s.value}</div>
      </div>`).join('');
}

async function drawWeightChart() {
  const canvas = document.getElementById('weightChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth || 300;
  const H = 120;
  canvas.width = W * 2; canvas.height = H * 2;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  ctx.scale(2, 2);

  const weights = await Storage.getWeights();
  if (weights.length < 2) {
    ctx.fillStyle = '#525470';
    ctx.font = '12px Syne';
    ctx.textAlign = 'center';
    ctx.fillText('Servono almeno 2 pesi per il grafico', W / 2, H / 2);
    return;
  }

  const vals = weights.map(d => d.weight);
  const minV = Math.min(...vals) - 0.5;
  const maxV = Math.max(...vals) + 0.5;
  const toY = v => H - ((v - minV) / (maxV - minV)) * (H - 16) - 4;
  const toX = i => 16 + i * (W - 32) / (vals.length - 1);

  ctx.clearRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = 'rgba(30,32,48,.8)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const y = H * i / 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // Gradient fill
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(255,95,31,.3)');
  grad.addColorStop(1, 'rgba(255,95,31,.0)');
  ctx.beginPath();
  ctx.moveTo(toX(0), toY(vals[0]));
  vals.forEach((v, i) => i > 0 && ctx.lineTo(toX(i), toY(v)));
  ctx.lineTo(toX(vals.length - 1), H);
  ctx.lineTo(toX(0), H);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.strokeStyle = 'rgba(255,95,31,.8)';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  vals.forEach((v, i) => i === 0 ? ctx.moveTo(toX(i), toY(v)) : ctx.lineTo(toX(i), toY(v)));
  ctx.stroke();

  // Min point
  const minIdx = vals.indexOf(Math.min(...vals));
  ctx.fillStyle = '#00e596';
  ctx.beginPath();
  ctx.arc(toX(minIdx), toY(vals[minIdx]), 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(100,110,140,.9)';
  ctx.font = '9px JetBrains Mono';
  ctx.fillText(`${vals[minIdx]} min`, toX(minIdx) + 6, toY(vals[minIdx]) + 4);

  // Latest
  ctx.fillStyle = '#ff5f1f';
  ctx.beginPath();
  ctx.arc(toX(vals.length - 1), toY(vals[vals.length - 1]), 4, 0, Math.PI * 2);
  ctx.fill();
}

// ── SETTINGS ────────────────────────────────────────────
async function renderSettings() {
  const profile = await Storage.getProfile();
  document.getElementById('set-weight').value = profile.weight || 78.7;
  document.getElementById('set-age').value = profile.age || 25;
  document.getElementById('set-hrmax').value = profile.hrmax || 202;
  document.getElementById('set-target').value = profile.target || 70;
  document.getElementById('cap-coach').value = profile.caps?.coach ?? 3;
  document.getElementById('cap-vision').value = profile.caps?.vision ?? 5;
  document.getElementById('api-key').value = profile.apiKey || '';
  await updateApiUsage();

  // Notification toggle state
  if (Notification.permission === 'granted') {
    document.getElementById('toggle-notif').classList.add('on');
  }
}

async function saveAPI() {
  const key = document.getElementById('api-key').value.trim();
  appState.profile.apiKey = key;
  await Storage.saveProfile(appState.profile);
  showToast('API key salvata ✓', 'success');
}

async function testAPI() {
  const key = document.getElementById('api-key').value.trim();
  if (!key) {
    showToast('Inserisci una API key prima', 'error');
    return;
  }
  showToast('Testando...', 'success');
  const result = await API.testConnection(key);
  showToast(result.message, result.ok ? 'success' : 'error');
}

async function saveCaps() {
  const coach = parseFloat(document.getElementById('cap-coach').value) || 0;
  const vision = parseFloat(document.getElementById('cap-vision').value) || 0;
  appState.profile.caps = { coach, vision };
  await Storage.saveProfile(appState.profile);
  showToast(`Cap salvati (€${coach}/€${vision})`, 'success');
  await updateApiUsage();
}

async function toggleNotifications(el) {
  if (el.classList.contains('on')) {
    el.classList.remove('on');
    appState.profile.notifications = false;
  } else {
    const result = await Notifications.requestPermission();
    if (result.ok) {
      el.classList.add('on');
      appState.profile.notifications = true;
      showToast('Notifiche attivate ✓', 'success');
      Notifications.scheduleEveningCheckin();
    } else {
      showToast(result.message || 'Permesso negato', 'error');
    }
  }
  await Storage.saveProfile(appState.profile);
}

function toggleTheme(el) {
  // Always dark for now
  showToast('Tema scuro (consigliato)', 'success');
}

function toggleProgressPhoto(el) {
  el.classList.toggle('on');
  appState.profile.progressPhotoReminder = el.classList.contains('on');
  Storage.saveProfile(appState.profile);
}

function setupReminders() {
  const list = Notifications.generateRemindersList();
  alert(`Crea questi 4 promemoria nell'app Promemoria iOS:\n\n${list.map((r, i) => `${i + 1}. "${r.name}"\n   ${r.time}\n   ${r.body}`).join('\n\n')}\n\nApro l'app Promemoria...`);
  setTimeout(() => Notifications.openReminders(), 500);
}

function showHealthGuide() {
  document.getElementById('health-modal').classList.add('show');
}

function showInstallGuide() {
  document.getElementById('install-modal').classList.add('show');
}

function showShortcut() {
  document.getElementById('shortcut-modal').classList.add('show');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('show');
  if (id === 'install-modal') {
    localStorage.setItem('install_dismissed', '1');
    document.getElementById('install-banner').style.display = 'none';
  }
}

// ── BACKUP ──────────────────────────────────────────────
async function exportData() {
  const data = await Storage.exportAll();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `coach-alex-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Backup scaricato ✓', 'success');
}

async function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async e => {
      try {
        const data = JSON.parse(e.target.result);
        await Storage.importAll(data);
        showToast('Backup importato ✓', 'success');
        await renderAll();
      } catch (err) {
        showToast('File non valido', 'error');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

async function clearData() {
  if (!confirm('Sei sicuro? Cancellerai TUTTI i dati. Operazione irreversibile.')) return;
  await Storage.clearAll();
  localStorage.clear();
  location.reload();
}

// ── QUICK LOG WEIGHT ────────────────────────────────────
async function quickLogWeight() {
  const w = prompt('Peso (kg)?', '78.7');
  if (!w) return;
  await quickLogWeightValue(parseFloat(w));
}

async function quickLogWeightValue(w) {
  if (isNaN(w) || w < 30 || w > 200) {
    showToast('Valore non valido', 'error');
    return;
  }
  await Storage.addWeight(w);
  appState.profile.weight = w;
  await Storage.saveProfile(appState.profile);
  showToast(`✓ Peso loggato: ${w} kg`, 'success');
  await renderAll();
}

// ── HELPERS ─────────────────────────────────────────────
function computeStreak(checkins) {
  if (!checkins || checkins.length === 0) return 0;
  const sorted = checkins.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < sorted.length; i++) {
    const d = new Date(sorted[i].date);
    const exp = new Date();
    exp.setDate(today.getDate() - i);
    if (isSameDay(d, exp)) streak++;
    else break;
  }
  return streak;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}

function getWeekKey() {
  const now = new Date();
  const onejan = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil((((now - onejan) / 86400000) + onejan.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function getDaysToTest() {
  const test1 = new Date('2026-05-09T09:00:00');
  return Math.max(0, Math.ceil((test1 - new Date()) / (24 * 3600 * 1000)));
}

function streakMessage(checkins) {
  const streak = computeStreak(checkins);
  if (streak === 0) return '👋 <strong>Fai il check-in stasera</strong> — anche se il giorno è andato male. Streak inizia.';
  if (streak >= 30) return `🔥🔥 <strong>${streak} giorni!</strong> Sei una macchina.`;
  if (streak >= 7) return `🔥 <strong>${streak} giorni di fila.</strong> Stai costruendo l'abitudine.`;
  return `Streak <strong>${streak} giorni.</strong> Stasera check-in per mantenerla.`;
}

function showToast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.className = `toast ${type} show`;
  el.textContent = msg;
  setTimeout(() => el.classList.remove('show'), 3000);
}

function md(t) {
  return t
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

// ── WORKOUTS LOG ────────────────────────────────────────

const WORKOUT_TYPES = [
  { id: 'pesi_mf', icon: '🏋️', label: 'Pesi MF' },
  { id: 'z2_cardio', icon: '🌳', label: 'Z2 cardio' },
  { id: 'z2_lungo', icon: '🌳', label: 'Z2 lungo' },
  { id: 'hiit_tapis', icon: '🔥', label: 'HIIT tapis' },
  { id: 'tempo_run', icon: '⏱️', label: 'Tempo run' },
  { id: 'simulazione_ariet', icon: '🎯', label: 'Sim Ariet' },
  { id: 'partita', icon: '⚽', label: 'Partita' },
  { id: 'bici', icon: '🚲', label: 'Bici' },
  { id: 'padel', icon: '🎾', label: 'Padel' },
  { id: 'recovery', icon: '🚶', label: 'Recovery' },
  { id: 'altro', icon: '🏃', label: 'Altro' },
];

const EVENT_TYPES = [
  { id: 'partita', icon: '⚽', label: 'Partita' },
  { id: 'raduno', icon: '🏟️', label: 'Raduno' },
  { id: 'bici', icon: '🚲', label: 'Bici' },
  { id: 'padel', icon: '🎾', label: 'Padel' },
  { id: 'altro', icon: '📅', label: 'Altro' },
];

let workoutFormData = {};
let eventFormData = {};

async function renderWorkouts() {
  const workouts = await Storage.getWorkouts();
  const weeklyW = await Storage.getWeeklyWorkouts();
  const events = await Storage.getUpcomingEvents();

  // Stats settimana
  const totalMin = weeklyW.reduce((s, w) => s + (w.duration_min || 0), 0);
  const rpes = weeklyW.filter(w => w.rpe).map(w => w.rpe);
  const avgRPE = rpes.length ? (rpes.reduce((a, b) => a + b, 0) / rpes.length).toFixed(1) : '—';

  // Calcolo carico (TSS-like)
  const intFactor = { light: 0.4, moderate: 0.7, heavy: 1.0, max: 1.4 };
  const load = weeklyW.reduce((s, w) => s + (w.duration_min || 0) * (intFactor[w.intensity] || 0.7), 0);
  const loadLabel = load < 200 ? 'leggero' : load < 400 ? 'medio' : load < 600 ? 'alto' : 'molto alto';
  const loadColor = load < 200 ? 'var(--blue)' : load < 400 ? 'var(--green)' : load < 600 ? 'var(--yellow)' : 'var(--red)';

  document.getElementById('ws-count').textContent = weeklyW.length;
  document.getElementById('ws-min').textContent = totalMin;
  document.getElementById('ws-rpe').textContent = avgRPE;
  document.getElementById('ws-load').textContent = loadLabel;
  document.getElementById('ws-load').style.color = loadColor;

  // Lista workouts (ultimi 30)
  const list = document.getElementById('workouts-list');
  document.getElementById('workouts-count-tag').textContent = workouts.length;

  if (workouts.length === 0) {
    list.innerHTML = '<div style="font-size:12px;color:var(--mu);text-align:center;padding:14px">Nessun allenamento loggato.<br>Tap "Logga allenamento" sopra per iniziare.</div>';
  } else {
    list.innerHTML = workouts.slice(0, 30).map(w => {
      const type = WORKOUT_TYPES.find(t => t.id === w.type) || WORKOUT_TYPES[WORKOUT_TYPES.length - 1];
      const d = new Date(w.date);
      const dateStr = d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
      const intensityColor = { light: 'var(--blue)', moderate: 'var(--green)', heavy: 'var(--yellow)', max: 'var(--red)' };
      const painBadge = w.pain?.length ? `<span style="background:rgba(255,59,92,.15);color:var(--red);padding:2px 6px;border-radius:6px;font-size:9px;font-weight:700;margin-left:4px">⚠️ ${w.pain.join(',')}</span>` : '';

      return `<div style="background:var(--s1);border-radius:9px;padding:10px 12px;margin-bottom:6px;cursor:pointer" onclick="deleteWorkoutConfirm('${w.id}')">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <span style="font-size:16px">${type.icon}</span>
          <strong style="font-size:13px;flex:1">${type.label}</strong>
          ${w.rpe ? `<span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:${intensityColor[w.intensity] || 'var(--mu)'}">RPE ${w.rpe}</span>` : ''}
        </div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--mu)">
          ${dateStr} · ${w.duration_min} min${w.distance_km ? ` · ${w.distance_km} km` : ''}${w.hr_avg ? ` · ${w.hr_avg} bpm` : ''}${painBadge}
        </div>
        ${w.notes ? `<div style="font-size:11px;color:var(--mu);margin-top:5px;font-style:italic">${w.notes.slice(0, 100)}${w.notes.length > 100 ? '...' : ''}</div>` : ''}
      </div>`;
    }).join('');
  }

  // Eventi futuri
  const evList = document.getElementById('events-list');
  if (events.length === 0) {
    evList.innerHTML = '<div style="font-size:12px;color:var(--mu);text-align:center;padding:14px">Nessun evento programmato.</div>';
  } else {
    evList.innerHTML = events.slice(0, 10).map(e => {
      const type = EVENT_TYPES.find(t => t.id === e.type) || EVENT_TYPES[EVENT_TYPES.length - 1];
      const d = new Date(e.date);
      const dateStr = d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
      const daysAway = Math.ceil((d - new Date()) / 86400000);
      return `<div style="background:var(--s1);border-radius:9px;padding:10px 12px;margin-bottom:6px;cursor:pointer" onclick="deleteEventConfirm('${e.id}')">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:16px">${type.icon}</span>
          <div style="flex:1">
            <strong style="font-size:13px">${type.label}</strong>
            <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--mu)">${dateStr}${e.time ? ` · ${e.time}` : ''} · tra ${daysAway} gg</div>
          </div>
          ${e.intensity ? `<span class="tag t${e.intensity === 'heavy' ? 'h' : e.intensity === 'light' ? 'g' : 'y'}">${e.intensity}</span>` : ''}
        </div>
        ${e.notes ? `<div style="font-size:11px;color:var(--mu);margin-top:5px">${e.notes}</div>` : ''}
      </div>`;
    }).join('');
  }
}

function openWorkoutForm() {
  workoutFormData = { pain: [] };
  document.getElementById('workout-modal').classList.add('show');

  // Render type grid
  document.getElementById('wo-type-grid').innerHTML = WORKOUT_TYPES.map(t => `
    <div class="opt" data-type="${t.id}" onclick="selectWoType('${t.id}',this)" style="text-align:center;padding:8px 4px;font-size:10px">
      <div style="font-size:18px">${t.icon}</div>
      <div>${t.label}</div>
    </div>`).join('');
}

function closeWorkoutForm() {
  document.getElementById('workout-modal').classList.remove('show');
}

function selectWoType(id, el) {
  workoutFormData.type = id;
  document.querySelectorAll('#wo-type-grid .opt').forEach(o => o.classList.remove('sel'));
  el.classList.add('sel');
}

function selectInt(intensity, el) {
  workoutFormData.intensity = intensity;
  document.querySelectorAll('#wo-intensity-row .cib').forEach(o => {
    o.classList.remove('sel-g', 'sel-y', 'sel-m');
  });
  const cls = { light: 'sel-g', moderate: 'sel-g', heavy: 'sel-y', max: 'sel-m' };
  el.classList.add(cls[intensity] || 'sel-y');
}

function togglePain(zone, el) {
  if (!workoutFormData.pain) workoutFormData.pain = [];
  const idx = workoutFormData.pain.indexOf(zone);
  if (idx >= 0) {
    workoutFormData.pain.splice(idx, 1);
    el.classList.remove('sel');
  } else {
    workoutFormData.pain.push(zone);
    el.classList.add('sel');
  }
}

async function saveWorkout() {
  const dur = parseInt(document.getElementById('wo-duration').value);
  if (!workoutFormData.type) { showToast('Seleziona tipo', 'error'); return; }
  if (!dur) { showToast('Inserisci durata', 'error'); return; }

  const workout = {
    type: workoutFormData.type,
    duration_min: dur,
    intensity: workoutFormData.intensity || 'moderate',
    rpe: parseInt(document.getElementById('wo-rpe').value) || null,
    distance_km: parseFloat(document.getElementById('wo-distance').value) || null,
    hr_avg: parseInt(document.getElementById('wo-hr-avg').value) || null,
    hr_max: parseInt(document.getElementById('wo-hr-max').value) || null,
    kcal_active: parseInt(document.getElementById('wo-kcal').value) || null,
    pain: workoutFormData.pain || [],
    notes: document.getElementById('wo-notes').value || null,
    source: 'manual',
  };

  await Storage.addWorkout(workout);
  showToast('Allenamento salvato ✓', 'success');
  closeWorkoutForm();

  // Reset form
  ['wo-duration', 'wo-rpe', 'wo-distance', 'wo-hr-avg', 'wo-hr-max', 'wo-kcal', 'wo-notes'].forEach(id => {
    document.getElementById(id).value = '';
  });
  workoutFormData = {};

  // Avviso se dolore segnalato
  if (workout.pain.length > 0) {
    setTimeout(() => {
      showToast(`⚠️ Dolore segnalato: il piano di domani sarà ridotto`, 'error');
    }, 1500);
  }

  renderWorkouts();
}

async function deleteWorkoutConfirm(id) {
  if (!confirm('Eliminare questo allenamento?')) return;
  await Storage.deleteWorkout(id);
  showToast('Eliminato', 'success');
  renderWorkouts();
}

function prefillWorkoutFromURL(params) {
  openWorkoutForm();
  const type = params.get('type');
  if (type) {
    const opt = document.querySelector(`#wo-type-grid .opt[data-type="${type}"]`);
    if (opt) selectWoType(type, opt);
  }
  const dur = params.get('duration');
  if (dur) document.getElementById('wo-duration').value = dur;
  const dist = params.get('distance');
  if (dist) document.getElementById('wo-distance').value = dist;
  const hr = params.get('hr');
  if (hr) document.getElementById('wo-hr-avg').value = hr;
  const kcal = params.get('kcal');
  if (kcal) document.getElementById('wo-kcal').value = kcal;
}

// ── EVENTS ──────────────────────────────────────────────
function openEventForm() {
  eventFormData = {};
  document.getElementById('event-modal').classList.add('show');
  document.getElementById('ev-type-grid').innerHTML = EVENT_TYPES.map(t => `
    <div class="opt" data-type="${t.id}" onclick="selectEvType('${t.id}',this)" style="text-align:center;padding:8px 4px;font-size:10px">
      <div style="font-size:18px">${t.icon}</div>
      <div>${t.label}</div>
    </div>`).join('');
  // Default date = tomorrow
  const tom = new Date();
  tom.setDate(tom.getDate() + 1);
  document.getElementById('ev-date').value = tom.toISOString().split('T')[0];
}

function closeEventForm() {
  document.getElementById('event-modal').classList.remove('show');
}

function selectEvType(id, el) {
  eventFormData.type = id;
  document.querySelectorAll('#ev-type-grid .opt').forEach(o => o.classList.remove('sel'));
  el.classList.add('sel');
}

function selectEvInt(intensity, el) {
  eventFormData.intensity = intensity;
  el.parentElement.querySelectorAll('.cib').forEach(o => o.classList.remove('sel-g', 'sel-y', 'sel-m'));
  const cls = { light: 'sel-g', moderate: 'sel-g', heavy: 'sel-y' };
  el.classList.add(cls[intensity] || 'sel-y');
}

async function saveEvent() {
  const date = document.getElementById('ev-date').value;
  if (!eventFormData.type) { showToast('Seleziona tipo', 'error'); return; }
  if (!date) { showToast('Inserisci data', 'error'); return; }

  const event = {
    type: eventFormData.type,
    date: new Date(date).toISOString(),
    time: document.getElementById('ev-time').value || null,
    intensity: eventFormData.intensity || 'moderate',
    notes: document.getElementById('ev-notes').value || null,
  };

  await Storage.addEvent(event);
  showToast('Evento salvato ✓', 'success');
  closeEventForm();
  renderWorkouts();
}

async function deleteEventConfirm(id) {
  if (!confirm('Eliminare questo evento?')) return;
  await Storage.deleteEvent(id);
  showToast('Eliminato', 'success');
  renderWorkouts();
}

// ── INIT ON LOAD ────────────────────────────────────────
window.addEventListener('load', init);

// Expose to global for HTML onclick
window.navigateTo = navigateTo;
window.completeOnboarding = completeOnboarding;
window.askCoach = askCoach;
window.analyzePhoto = analyzePhoto;
window.genMeal = genMeal;
window.ciS = ciS;
window.ciW = ciW;
window.submitCheckin = submitCheckin;
window.saveProgressPhoto = saveProgressPhoto;
window.saveAPI = saveAPI;
window.testAPI = testAPI;
window.saveCaps = saveCaps;
window.toggleNotifications = toggleNotifications;
window.toggleTheme = toggleTheme;
window.toggleProgressPhoto = toggleProgressPhoto;
window.setupReminders = setupReminders;
window.showHealthGuide = showHealthGuide;
window.showInstallGuide = showInstallGuide;
window.showShortcut = showShortcut;
window.closeModal = closeModal;
window.exportData = exportData;
window.importData = importData;
window.clearData = clearData;
window.quickLogWeight = quickLogWeight;
window.quickLogWeightValue = quickLogWeightValue;
window.drawWeightChart = drawWeightChart;
window.openWorkoutForm = openWorkoutForm;
window.closeWorkoutForm = closeWorkoutForm;
window.selectWoType = selectWoType;
window.selectInt = selectInt;
window.togglePain = togglePain;
window.saveWorkout = saveWorkout;
window.deleteWorkoutConfirm = deleteWorkoutConfirm;
window.openEventForm = openEventForm;
window.closeEventForm = closeEventForm;
window.selectEvType = selectEvType;
window.selectEvInt = selectEvInt;
window.saveEvent = saveEvent;
window.deleteEventConfirm = deleteEventConfirm;

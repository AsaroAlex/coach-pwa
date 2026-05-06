# TODO.md — Roadmap per Claude Code

> Lista delle cose ancora da fare. Aggiornata 5 mag 2026 dopo V1.1.

---

## 🔴 ALTA PRIORITÀ (prima del test del 9 mag)

Tutti i task in alta priorità sono stati completati il 6 maggio 2026. Vedi sezione COMPLETATI.

---

## 🟡 MEDIA PRIORITÀ (entro fine maggio)

- [ ] **Database alimenti italiani in Dieta**
  - 50-100 cibi più comuni Coop con macros
  - Tap → aggiunge a check-in pasti
  - No conteggio calorie (semaforo + proteine totali)

- [ ] **Confronto foto progresso side-by-side**
  - In tab Forma: 2 foto affiancate (oggi vs settimana 1)
  - Slider per scorrere settimane

- [ ] **Predizione tempo Ariet basata su trend cardio**
  - Da workout HIIT registrati → stima distanza Ariet teorica
  - Mostrare in tab Test

---

## 🟢 BASSA PRIORITÀ (entro luglio 2026)

- [ ] **Push notifications native (iOS 16.4+ PWA)**
  - Reminder check-in serale 21:00
  - Reminder pesata mattina 07:00
  - Test su iPhone reale

- [ ] **Export PDF settimanale**
  - "Genera report settimana" → PDF con grafici
  - Da condividere via Mail/Messaggi

---

## 🔵 V2.0 — Conversione SwiftUI nativa (luglio 2026)

**Trigger:** PWA usata >5×/giorno per 60 giorni consecutivi.

- [ ] Setup Xcode project con stessi colori/fonts
- [ ] HealthKit completo (peso, allenamenti, sonno, BPM)
- [ ] Apple Watch app dedicata
- [ ] Widget Home Screen + Lock Screen
- [ ] Siri Shortcuts native

**Costo ricorrente:** $99/anno Apple Developer.

---

## 🐛 BUG NOTI

- [x] ~~Service Worker non sempre aggiornato dopo deploy~~ — risolto 6 mag (cache v2 + try/catch init)
- [x] ~~Header tagliato sotto Dynamic Island su iPhone moderni~~ — risolto 6 mag (safe-area-inset su .statusbar)
- [ ] Foto progresso pesano in IndexedDB → comprimere base64 a 60% qualità
- [ ] Tab bar overflow su iPhone SE/Mini → testare e ridurre padding

---

## 📚 DEBITI TECNICI

- [ ] `src/app.js` ormai supera 1000 righe → splittare in moduli (`renderers.js`, `forms.js`, `workouts.js`)
- [ ] Mancano test automatici → almeno smoke test (apri ogni tab senza errori console)
- [ ] CSS inline in HTML → estrarre in `style.css` per cachability migliore

---

## 🚫 IDEE RIFIUTATE (non riproporre)

- Quiz IFAB (RIMOSSO 4 mag — usa app dedicate)
- Sign in with Apple ($99/anno + backend, sostituito da iCloud backup)
- Conteggio calorie ossessivo (Alex usa MacroFactor per quello)
- Stretching come consiglio (Alex lo rifiuta)
- Velocità tapis >14 km/h come target fino a luglio
- Backend / server (single-user, non serve)

---

## ✅ COMPLETATI

### 6 maggio 2026 (V1.3)
- ✅ Apple Shortcuts hub in Setup: 5 ricette accordion con bottone "Copia URL" (sync peso, sync auto da Salute, sync workout, quick check-in serale, backup iCloud settimanale)
- ✅ Pattern detection rule-based locale (0€): dolore post-HIIT, energia bassa post-sonno scarso, peso più basso giorno settimana, sovraccarico RPE
- ✅ Pattern detection AI opzionale (€0.013/call, throttle 1×/settimana = ≤€0.68/anno) con cache risultato in profile
- ✅ Helper `copyToClipboard()` con fallback Safari < 13.4

### 6 maggio 2026 (V1.2)
- ✅ Semaforo autoregolazione completo (sleep/energy/foodLevel/pain) allineato a `docs/AUTOREGULATION.md`
- ✅ Toggle "PASTO PRINCIPALE OGGI" (Saltato/Ridotto/Normale) nel form check-in
- ✅ Banner rosso recovery per workout di ieri con dolore (protocollo 24-72h)
- ✅ Fix PWA iOS: bump cache SW v1→v2, try/catch difensivo in init, manifest "id"
- ✅ Fix safe-area Dynamic Island (statusbar `padding-top:calc(8px + safe-top)`)
- ✅ Centralizzazione `WEEKLY_PLAN` e `TEST_DATES` in `src/app.js` — source of truth condivisa tra Oggi, Cardio, Allena, Test
- ✅ Schema settimanale dinamico in tab Cardio (rimosso HTML hardcoded)
- ✅ Vista piano settimanale in tab Allena (con evidenziazione "OGGI")
- ✅ Allineamento `WEEKLY_PLAN` a `docs/TRAINING_WEEKLY.md` (domenica = "Partita o riposo")
- ✅ Adattamento estate automatico (giu-ago: idratazione + orario mattina/sera)
- ✅ Upload multiplo foto pasto (Dieta) con loop e cap-aware
- ✅ Importatore screenshot Apple Salute (Setup → Vision estrae peso/sonno/passi/HR/HRV/VO2max)

### 5 maggio 2026 (V1.1)
- ✅ Documentazione completa per Claude Code (`CLAUDE.md` + `docs/*.md`)
- ✅ Schema cardio realistico (no più 17 km/h, vincoli iFit/tapis)
- ✅ Tab "Allenamenti" con form workout/event
- ✅ Storage v2 con `workouts` ed `events`
- ✅ URL scheme handler `?action=workout&type=...`
- ✅ Tab bar a 7 sezioni
- ✅ System prompt AI aggiornato con vincoli e workout history
- ✅ Sezione safety/red flags in Cardio

### 4 maggio 2026 (V1.0)
- ✅ MVP PWA installabile completa
- ✅ AI Coach + Vision (Anthropic API)
- ✅ Cap spesa configurabile
- ✅ IndexedDB storage
- ✅ Backup JSON manuale
- ✅ Quiz IFAB rimosso (decisione finale)
- ✅ Sign in with Apple rifiutato

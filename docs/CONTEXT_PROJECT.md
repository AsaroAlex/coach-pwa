# CONTEXT_PROJECT.md — Architettura e decisioni tecniche

## Stack scelto

| Layer | Tech | Perché |
|-------|------|--------|
| Frontend | HTML/CSS/JS vanilla | Zero dipendenze, manutenzione semplice, Alex modifica da solo |
| Storage | IndexedDB (no localStorage) | Robusto, supporta blob/foto, capacità GB |
| Offline | Service Worker | Cache-first per asset, network-first per HTML |
| AI | Anthropic Claude API diretta | No backend, no costi server, risposta diretta da iPhone |
| PWA | Manifest + iOS meta tags | Installabile come app vera su iOS 16.4+ |
| Hosting | GitHub Pages / Netlify | Gratuito, deploy automatico da git push |
| Sync dati | iCloud Drive backup via Shortcut | Gratis, no account, no backend |

## Stack RIFIUTATO (e perché)

| Tech proposta | Motivo del rifiuto |
|--------------|---------------------|
| App nativa SwiftUI | $99/anno Apple Developer + 4-8 settimane sviluppo. Rimandata a luglio se PWA validata. |
| React/Vue | Overkill per single-user, complica manutenzione |
| Backend (Supabase, Firebase) | Costi mensili, complica architettura, non serve per single-user |
| Sign in with Apple | Richiede Apple Developer + backend OAuth. Sostituito da iCloud backup. |
| Tailwind CSS | Build step extra, vanilla CSS basta |
| TypeScript | Build step, complica flusso |
| HealthKit nativo | Non disponibile in PWA. Workaround: Shortcuts iOS + URL scheme. |

## Decisioni storiche importanti

### 4 maggio 2026 — Quiz IFAB rimosso
**Motivo:** Alex voleva auto-update da fonte ufficiale (theifab.com). IFAB non ha API pubbliche, solo PDF stagionali. Costruire un quiz manuale + aggiornarlo = manutenzione costosa. Esistono app dedicate (AIA Refbook, Le Regole del Calcio).
**Decisione:** rimuovere completamente la sezione quiz dall'app.
**NON riaggiungere senza esplicita richiesta**.

### 4 maggio 2026 — Sign in with Apple rifiutato
**Motivo:** richiede $99/anno Apple Developer + backend OAuth + 2-3 giorni di setup. Vs iCloud Drive backup: gratis, automatico via Shortcut, zero dipendenze.
**Decisione:** backup automatico settimanale su iCloud Drive (vedi `ICLOUD_BACKUP.md`).
**Eventuale upgrade:** dopo 60 giorni di uso reale, se Alex passa a iPad/Mac e vuole sync real-time.

### 4 maggio 2026 — Cap mensile API rimovibile
**Motivo:** Alex vuole proteggersi da bollette inattese ma non vuole limiti rigidi.
**Decisione:** cap configurabile in Setup. **cap=0 significa illimitato.**
**Default:** €3 coach, €5 vision.

### 4 maggio 2026 — MacroFactor NON sostituito
**Motivo:** algoritmo TDEE adattivo proprietario, DB 1M+ alimenti, 5+ anni di sviluppo. Non replicabile gratis al 100%.
**Decisione:** affiancare MacroFactor (resta abbonato), l'app non duplica la nutrizione precisa, fa altre cose (semaforo, foto AI, coach AI).

### 5 maggio 2026 — Workout cardio NON aggressivi
**Trigger:** allenamento del 5 mag con dolore tibia, 17 km/h irrealistico, 2 min warm-up insufficienti.
**Decisione:** ricalibrare TUTTI i target velocità tapis. Vedi `docs/TRAINING_TAPIS.md`. Mai sprint sopra 14 km/h fino a luglio.

## File principali — cosa fa ognuno

### `index.html`
- 8 pagine in tab nav
- Onboarding modale prima apertura
- Status bar persistente con greeting + streak
- Bottom tab bar iOS-style (safe-area aware)
- Tutto inline tranne JS modulare

### `src/app.js`
- Stato globale (`appState`)
- Routing tra tab (`navigateTo`)
- Render handlers per ogni pagina
- Form handlers (check-in, foto, etc.)
- Helpers (computeStreak, formatDate, etc.)
- **Funzioni esposte a window per onclick HTML**

### `src/api.js`
- Wrapper Anthropic Claude API
- `chat()` per coach generale
- `analyzePhoto()` per foto piatto (Vision)
- Cap protection: `checkCap()` blocca se mese pieno
- Tracking spesa per chiamata
- Build system prompt con context Alex

### `src/storage.js`
- Wrapper IndexedDB con 7 store:
  - `profile` — dati utente (singleton)
  - `checkins` — check-in giornalieri
  - `weights` — storico peso
  - `photos` — foto progresso settimanali (base64)
  - `mealPhotos` — analisi foto piatto
  - `coachHistory` — conversazioni AI
  - `apiUsage` — tracking spesa mensile
- API alto livello: `Storage.addCheckin()`, `Storage.exportAll()`, etc.

### `src/health.js`
- Parser URL parameters da Apple Shortcuts
- Format URL: `https://APP/?action=weight&value=78.5`
- Salva in IndexedDB e aggiorna profile

### `src/notifications.js`
- Web Push (limitato iOS, solo PWA installata)
- Generatore istruzioni per Promemoria nativi
- Open scheme `x-apple-reminderkit://`

### `sw.js`
- Service Worker con strategia mista:
  - HTML: network-first (per update veloci)
  - Asset statici: cache-first
  - API Anthropic: SEMPRE network, mai cache
- Cache `coach-alex-v1`
- Push notification handler

## Sistema di costo Claude API

**Costi (1 maggio 2026):**
- Claude Sonnet 4: $3/M input + $15/M output token

**Costi medi per chiamata:**
- Coach chat: ~500 input + 800 output = $0.014 = €0.013
- Photo vision: ~1500 input + 500 output = $0.012 = €0.011

**Stime mensili realistiche:**
- 3 chat/giorno = ~90/mese = €1.20
- 2 foto/giorno = ~60/mese = €0.66
- **Totale realistico: €2-5/mese** (cap default €8 = ampia sicurezza)

## URL scheme custom — coachalex://

Funziona SOLO se la PWA è installata su Home Screen (da Safari).

| Action | URL | Effetto |
|--------|-----|---------|
| Log peso | `?action=weight&value=78.5` | Salva peso + aggiorna profile |
| Check-in | `?action=checkin` | Apre tab check-in |
| Foto | `?action=foto` | Apre tab dieta |
| Workout | `?action=workout&type=hiit&duration=22` | Salva workout completato |

**NB:** lo schema `coachalex://` mostrato nella documentazione iniziale era ridondante. Va usato **solo l'URL HTTPS della PWA** con query parameters. Più affidabile, no errori "app not installed".

## Roadmap evolutiva

### V1.0 — Completato (4 mag 2026)
- ✅ PWA installabile
- ✅ 8 sezioni
- ✅ AI Coach + Vision
- ✅ Cap spesa
- ✅ Storage IndexedDB
- ✅ Backup JSON

### V1.1 — In corso (5 mag 2026)
- 🔄 Workout reali tapis (no più 17 km/h)
- 🔄 Sezione "Workout log" con import
- 🔄 Sistema "Eventi extra" (partite/bici/padel)
- 🔄 Regole autoregolazione tibia
- 🔄 Documentazione completa per Claude Code

### V1.2 — Maggio-Giugno 2026
- [ ] Push notifications native (test iOS 16.4+)
- [ ] Database alimenti italiani per check-in pasti rapidi
- [ ] Confronto foto progresso side-by-side
- [ ] Predizione tempo Ariet basata su trend cardio

### V2.0 — Luglio 2026 (in tempo per agosto)
- [ ] Conversione SwiftUI nativa
- [ ] HealthKit completo
- [ ] Apple Watch app con BPM live
- [ ] Widget Home Screen + Lock Screen
- [ ] Solo se PWA usata >5x/giorno per 60 giorni

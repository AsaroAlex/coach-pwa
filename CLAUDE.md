# CLAUDE.md — Istruzioni per Claude Code

> **Repository:** Coach Alex PWA — app personale di coaching per Alex, Assistente Arbitrale calcio Eccellenza Emilia-Romagna.
> **Single user:** non è un prodotto pubblico. Tutte le decisioni sono ottimizzate per Alex, non per "utente generico".

---

## 🎯 Cosa è questo progetto

PWA installabile su iPhone che aiuta Alex a:
1. **Superare il test Ariet del 9 maggio 2026** (test 1 — più vicino, ma con 5gg di prep)
2. **Trasformazione fisica** (78.7→70 kg con addominali) entro fine agosto 2026
3. **Superare il secondo test Ariet di fine agosto** con performance significativamente migliore
4. **Mantenersi ai test arbitrali Eccellenza** ed eventualmente promozione categoria

Stack: HTML/CSS/JS vanilla, IndexedDB, Service Worker, Anthropic Claude API diretta dal browser.

---

## 📚 Documenti chiave da leggere PRIMA di modificare

Quando ti chiedo modifiche, **leggi sempre questi file in ordine**:

1. **`docs/CONTEXT_USER.md`** — chi è Alex, suoi dati, obiettivi, vincoli
2. **`docs/CONTEXT_PROJECT.md`** — architettura tecnica e decisioni di design
3. **`docs/TRAINING_TAPIS.md`** — vincoli reali del tapis NordicTrack T 9 + iFit (CRITICO)
4. **`docs/AUTOREGULATION.md`** — regole di sicurezza (dolori tibia, alimentazione, fatica)
5. **`docs/TRAINING_WEEKLY.md`** — schema settimanale palestra+corsa+sport extra
6. **`docs/AI_PROMPTS.md`** — prompt usati nel Coach AI (devono essere coerenti)

---

## ⚠️ Regole non negoziabili

### 1. **Sicurezza prima della performance**
Se Alex riferisce dolore (specialmente tibia/stinchi), il piano DEVE ridurre carico. Mai pushare per "completare la sessione". Vedi `docs/AUTOREGULATION.md`.

### 2. **Realismo tapis NordicTrack T 9 + iFit**
- Velocità max tapis: 20 km/h (ma sopra 14 km/h Alex non è ancora pronto)
- Intervalli iFit: minimo 1 minuto (no 30/30 sprint)
- Riscaldamento minimo: 5 minuti progressivi
- Vedi `docs/TRAINING_TAPIS.md`

### 3. **Mai fabbricare dati**
Non inventare zone cardiache, calorie, "studi dimostrano". I dati reali sono:
- HRmax 202 bpm (misurato in partita 3 mag 2026)
- RHR 85 bpm
- Peso oscilla 77.3-79.7 in aprile/maggio
- BF 26.8% (DEXA o smart scale)

### 4. **Italiano sempre, termini tecnici inglesi OK**
HIIT, RPE, Z2, EPOC sono ok. Ma "warm-up" → "riscaldamento", "workout" → "allenamento" o "sessione".

### 5. **Niente quiz IFAB nell'app**
Decisione del 4 maggio: rimosso. Non aggiungere mai una sezione quiz a meno che non venga ri-richiesta esplicitamente.

### 6. **Cap di spesa API obbligatorio**
Default: €3/mese coach, €5/mese vision. Mai fare chiamate API senza aver controllato il cap. L'utente può impostare cap=0 per illimitato.

### 7. **Niente account/login**
Decisione del 4 maggio: backup su iCloud Drive via Shortcut, non Sign in with Apple. Non aggiungere flow di autenticazione.

---

## 🛠️ Workflow tipico per modifiche

### Quando l'utente chiede una nuova feature:

1. **Leggi i docs rilevanti** prima di toccare codice
2. **Chiedi conferma** se la richiesta tocca un'area "non negoziabile"
3. **Fai la modifica minima** che risolve il problema (no over-engineering)
4. **Aggiorna la documentazione** se cambi comportamento o aggiungi feature
5. **Testa che la PWA funzioni offline** (verifica che SW non sia rotto)
6. **Commit con messaggio chiaro** in italiano

### Quando l'utente segnala un bug:

1. **Riproduci** mentalmente il flow
2. **Identifica root cause** (non patch superficiale)
3. **Fix + test edge cases**
4. **Aggiorna docs se la causa era una decisione ambigua**

### Convenzioni di commit

```
fix: [area] descrizione breve
feat: [area] nuova feature
docs: aggiornata sezione X
style: cambio CSS/UI
refactor: ristrutturazione senza cambio comportamento
```

Aree comuni: `oggi`, `raduno`, `cardio`, `dieta`, `coach`, `checkin`, `foto`, `forma`, `setup`, `api`, `storage`, `health`, `sw`.

---

## 📂 Struttura repo

```
coach-pwa/
├── CLAUDE.md                    # ← Questo file (entry point per Claude Code)
├── README.md                    # Setup deploy per umani
├── ICLOUD_BACKUP.md             # Setup backup iCloud
├── TODO.md                      # Roadmap aperta + bug noti
│
├── index.html                   # Entry PWA + UI completa (8 tab)
├── manifest.json                # PWA config
├── sw.js                        # Service Worker (offline + cache)
│
├── src/
│   ├── app.js                   # State, navigation, render, handlers
│   ├── api.js                   # Anthropic Claude API + cap protection
│   ├── storage.js               # IndexedDB wrapper
│   ├── health.js                # Apple Health URL scheme integration
│   └── notifications.js         # Web Push + Reminders
│
├── assets/                      # Icone PWA + splash
│
└── docs/
    ├── CONTEXT_USER.md          # Tutto su Alex (dati, obiettivi, vincoli)
    ├── CONTEXT_PROJECT.md       # Architettura tecnica + decisioni storiche
    ├── CONTEXT_SCIENCE.md       # Ricerca scientifica usata (peer-reviewed)
    ├── TRAINING_TAPIS.md        # Vincoli NordicTrack T 9 + iFit
    ├── TRAINING_WEEKLY.md       # Schema settimanale palestra+corsa+extra
    ├── WORKOUT_TYPES.md         # Tipi di sessioni adattate
    ├── AUTOREGULATION.md        # Sicurezza: dolore, alimentazione, fatica
    ├── IMPORT_WORKOUTS.md       # Sistema registrazione allenamenti
    └── AI_PROMPTS.md            # Prompt sistema dell'AI Coach
```

---

## 🚀 Quick start per Claude Code

Se è la prima volta che vedi questa repo:

```bash
# 1. Leggi i context principali
cat CLAUDE.md
cat docs/CONTEXT_USER.md
cat docs/CONTEXT_PROJECT.md

# 2. Vedi cosa è da fare
cat TODO.md

# 3. Studia il codice
cat src/app.js | head -100
cat src/api.js
```

**Comando di test in locale:**
```bash
# Serve la PWA su localhost (Python deve essere installato)
python3 -m http.server 8000
# Apri http://localhost:8000 in Safari su iPhone (stesso WiFi)
```

---

## 🤝 Tone con l'utente

Alex preferisce:
- **Diretto**, no fluff, no preamboli infiniti
- **Pragmatico**, no over-engineering
- **Onesto** sui limiti tecnici (es. "Sign in with Apple costerebbe $99/anno + 3gg")
- **Italiano** ma termini tecnici in inglese (HIIT, PWA, API, RIR)
- **Comparativo** quando ci sono trade-off: "puoi fare X (gratis ma limitato) o Y (€10/mese ma completo)"
- **Compatto** > minimale (preferisce vedere più info insieme)
- **Niente emoji** nel codice, ma ok nelle UI e nei messaggi conversazionali

Alex NON tollera:
- Risposte vaghe del tipo "dipende"
- Troppi "facciamo X?" → propone direttamente
- Promesse di feature non implementabili
- Ricalcolo costante di calorie (no calorie counter, sì semaforo)

---

## 📞 In caso di dubbio

**Default:** chiedi conferma prima di:
- Cambiare l'architettura (aggiungere framework, backend, db esterno)
- Aggiungere abbonamenti / costi mensili
- Toccare le zone cardiache (i numeri sono basati su HRmax reale misurato)
- Aggiungere conteggio calorie (Alex lo rifiuta)
- Aggiungere stretching (Alex lo rifiuta)
- Aggiungere quiz (rimosso il 4 maggio)

**Default:** procedi senza chiedere se:
- Bug fix evidente
- Miglioramento UI senza cambio funzionalità
- Aggiungere safety check
- Migliorare error handling
- Aggiungere log/feedback all'utente
- Aggiornare documentazione

---

**Ultima revisione:** 5 maggio 2026 — dopo allenamento del giorno con problema tibia

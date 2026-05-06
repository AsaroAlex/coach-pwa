# Coach Alex — PWA V1.1

> **App personale per il raduno di sabato 9 maggio 2026 e la trasformazione fisica fino ad agosto.**
> PWA installabile su iPhone con sync Apple Health (via Shortcuts), foto piatto AI, coach AI personalizzato, **workout log + eventi extra**, **semaforo autoregolazione**.

> 📚 **Per modificare il codice con Claude Code:** leggi `CLAUDE.md` prima di iniziare.

---

## 📱 Cosa fa questa app

- **Dashboard "Oggi"** — piano del giorno + **semaforo autoregolazione** (verde/giallo/rosso) basato su sonno/energia/dolore di ieri
- **Tab "Allenamenti"** — log di ogni sessione (pesi, cardio, partite, bici, padel) + eventi futuri
- **Protocollo raduno** — countdown live + protocollo pre-test
- **Zone cardiache** calcolate sul HRmax reale 202 bpm
- **Schemi cardio realistici** per NordicTrack T9 + iFit (max 14 km/h, intervalli ≥1 min)
- **Dieta semaforo** — niente conteggio calorie
- **Foto piatto → Macros** — AI vision con cap mensile
- **Coach AI** che ricorda i tuoi ultimi 7 workout e i check-in
- **Check-in serale** 60 secondi
- **Foto progresso settimanali**
- **Backup iCloud Drive** via Shortcut

## 🚀 Setup e deploy (15 minuti)

### Opzione A: Deploy su Netlify (consigliato)

1. **Crea account gratuito** su [netlify.com](https://netlify.com) (login con email/Apple)

2. **Carica i file:**
   - Vai su Netlify dashboard
   - Trascina la cartella `coach-pwa/` nell'area "Drag and drop your site"
   - Aspetta deploy (~30 sec)
   - URL generato: `https://random-name.netlify.app`

3. **Personalizza dominio** (opzionale):
   - Site settings → Change site name → `coach-alex`
   - URL finale: `https://coach-alex.netlify.app`

4. **Apri su iPhone Safari:**
   - Vai a `https://coach-alex.netlify.app`
   - Tap su "Condividi" (☐↑) → "Aggiungi a Home"
   - L'icona appare sul Home Screen come app vera

### Opzione B: Deploy su Vercel

```bash
cd coach-pwa
npx vercel
# Segui il wizard, accetta default
```

### Opzione C: GitHub Pages (gratis ma più lento)

```bash
cd coach-pwa
git init
git add .
git commit -m "Initial"
# Push su repo GitHub privato
# Settings → Pages → Source: main branch → /
# URL: https://username.github.io/coach-pwa
```

---

## 🔑 Setup API Anthropic (€5/mese)

1. Vai su [console.anthropic.com](https://console.anthropic.com)
2. Registrati (login con email)
3. Aggiungi €10 di credito iniziale (sufficiente per ~2 mesi a uso normale)
4. Vai su **API Keys** → **Create Key** → copia
5. Apri la PWA → tab **Setup** → incolla la API key
6. Tap **Testa connessione** per verificare
7. Tap **Salva**

### Cap di sicurezza

L'app monitora la spesa mensile e si ferma al cap che imposti:
- **Coach AI** (chat): default €3/mese (~230 messaggi)
- **Vision** (foto piatto): default €5/mese (~450 foto)
- **Cap = 0** = illimitato

Il contatore si resetta il 1° del mese.

---

## 🍎 Setup Apple Shortcuts (10 minuti)

### 1. Sync peso da Salute → App

Crea questo Shortcut iOS per sincronizzare il peso ogni mattina:

1. Apri **Comandi Rapidi** (app nativa iOS)
2. **+** → Nuovo Comando Rapido
3. Aggiungi azione: **"Trova campioni di salute"**
   - Tipo: **Massa corporea**
   - Limite: **1**
   - Ordina per: **data più recente**
4. Aggiungi azione: **"Apri URL"**
   - URL: `https://coach-alex.netlify.app/?action=weight&value=` + tap su "Risultati di Trova campioni" (Magic Variable)
   - Espandi → **Peso** (trascina nel campo URL dopo `value=`)
5. Salva come **"Sync peso Coach"**
6. Tap **Automazioni** (in basso) → **+** → Crea automazione personale → **Ora del giorno** → 09:00 → Esegui Shortcut "Sync peso Coach"

### 2. Quick log peso vocale

1. Comandi Rapidi → **+**
2. Azione: **"Chiedi input"** → Tipo: **Numero** → Domanda: "Quanto pesi?"
3. Azione: **"Apri URL"** → `https://coach-alex.netlify.app/?action=weight&value=` + variabile **"Input fornito"**
4. Salva come **"Log peso"**
5. Aggiungi a Siri → "Hey Siri, log peso"

### 3. Quick check-in

1. Comandi Rapidi → **+**
2. Azione: **"Apri URL"** → `https://coach-alex.netlify.app/?action=checkin`
3. Salva come **"Check-in Coach"**
4. Aggiungi widget Home Screen → tap singolo per aprire

### 4. 🆕 Sync ultimo allenamento da Apple Watch

**Come funziona:** dopo ogni allenamento sull'Apple Watch, lancia uno Shortcut che importa i dati nella tab "Allenamenti" della PWA.

1. Comandi Rapidi → **+**
2. Azione **"Trova allenamenti"** (HealthKit) — Limite: 1, ordina per più recente
3. Azione **"Apri URL"** → `https://coach-alex.netlify.app/?action=workout&type=z2_cardio&duration=[Durata]&distance=[Distanza]&hr=[FC media]&kcal=[Energia attiva]`
   - Tap sui placeholder `[...]` e inserisci le variabili dal "Trova allenamenti"
4. Salva come **"Sync workout"**
5. Aggiungi all'app **Comandi Rapidi sull'Apple Watch** per tap rapido post-allenamento

**Limitazioni:**
- Il `type` (z2_cardio / hiit_tapis / pesi_mf / partita / bici / padel...) va deciso a mano. Crea Shortcut separati se vuoi tipi diversi.
- RPE e dolore vanno aggiunti dopo nel form.
- Tipi disponibili: `pesi_mf`, `z2_cardio`, `z2_lungo`, `hiit_tapis`, `tempo_run`, `simulazione_ariet`, `partita`, `bici`, `padel`, `recovery`, `altro`

### 5. 🆕 Aggiungi evento futuro

1. Comandi Rapidi → **+**
2. Azione **"Apri URL"** → `https://coach-alex.netlify.app/#workouts`
3. Salva come **"Pianifica evento"**

---

## 🔔 Setup Promemoria nativi iOS

Apri l'app **Promemoria** e crea questi 4 reminder ricorrenti:

| Promemoria | Quando | Note |
|-----------|--------|------|
| **Pesati Coach Alex** | 08:00 ogni giorno | A digiuno, dopo bagno |
| **Check-in serale Coach** | 21:00 ogni giorno | 2 minuti — apri app |
| **Creatina giornaliera** | 15:00 ogni giorno | 5g monoidrato |
| **Foto progresso settimanale** | Lunedì 09:00 | Frontale + laterale, stessa luce |

L'app stessa offre un pulsante "Crea promemoria" in Setup che apre l'app Promemoria.

---

## 📂 Struttura file

```
coach-pwa/
├── index.html            # Entry point + UI
├── manifest.json         # PWA config (icone, colore tema)
├── sw.js                 # Service Worker (offline + cache)
├── src/
│   ├── storage.js        # IndexedDB wrapper (storage robusto)
│   ├── api.js            # Anthropic Claude API + cap protection
│   ├── health.js         # Apple Health integration
│   ├── notifications.js  # Web Push + Reminders
│   └── app.js            # State management + navigation + render
├── assets/
│   ├── icon-180.png      # iOS Home Screen
│   ├── icon-192.png      # PWA standard
│   ├── icon-512.png      # PWA maskable
│   └── splash.png        # iOS splash screen
└── README.md
```

---

## 💾 Backup dei dati

L'app salva tutto in **IndexedDB locale** del browser. Per evitare perdita dati:

1. **Backup manuale settimanale:**
   - Setup → Backup & Dati → **Esporta tutti i dati (JSON)**
   - Salva su iCloud Drive o invia via email
2. **Restore:** Setup → **Importa backup** → seleziona file `.json`

Considera di settare un Promemoria settimanale "Backup Coach Alex" la domenica.

---

## 🛡️ Privacy

- **Tutti i dati restano sul tuo telefono** (IndexedDB locale)
- **API Anthropic:** chiamata diretta dal tuo telefono ai server Anthropic, nessun server intermedio
- **API key:** salvata solo in IndexedDB locale, mai trasmessa altrove
- **Foto:** non vengono salvate in cloud, solo l'analisi testuale viene salvata localmente
- **Backup:** solo manuale, su tua scelta

---

## 🎯 Roadmap

### V1.0 (current MVP) — completato
- [x] PWA installabile iOS
- [x] 8 sezioni complete
- [x] AI Coach + Vision
- [x] Cap spesa mensile
- [x] Storage IndexedDB
- [x] URL scheme per Shortcuts
- [x] Backup/restore JSON

### V1.1 (4-6 settimane di uso reale)
- [ ] Migliora prompt AI Coach con più context
- [ ] Database alimenti italiani per check-in pasti rapidi
- [ ] Workout log integrato (se MacroFactor non basta)
- [ ] Push notifications reali (test su iOS 16.4+)
- [ ] Widget Lock Screen (richiede passaggio nativo)

### V2.0 (luglio 2026, in tempo per agosto)
- [ ] Conversione SwiftUI nativa
- [ ] HealthKit completo (no Shortcuts manuali)
- [ ] Apple Watch app con BPM live
- [ ] Widget Home Screen
- [ ] Push notifications native
- [ ] Background sync

---

## 🐛 Troubleshooting

### "L'app non si installa su iPhone"
- Apri in **Safari** (non Chrome o altri browser)
- Versione iOS minima: **15.0**
- Tap "Condividi" → scorri → "Aggiungi a Home"

### "Le foto piatto non si analizzano"
- Verifica API key in Setup
- Tap "Testa connessione"
- Controlla cap mensile (Setup → Cap mensili)

### "Il peso non si aggiorna automaticamente"
- Le PWA non hanno accesso diretto a HealthKit
- Devi configurare lo Shortcut iOS (vedi sopra)
- In alternativa: inserimento manuale nel check-in

### "Notifiche non funzionano"
- Su iOS, le PWA supportano push solo se installate (non in Safari)
- Versione iOS minima: 16.4
- Alternativa: usa Promemoria nativi

---

## 📞 Domande?

Sono io — Claude. Apri l'app, vai su tab Coach, chiedi pure.

Tutto è pensato attorno a te:
- I tuoi dati reali (peso, HRmax, BF)
- I tuoi obiettivi (raduno + 70kg)
- Il tuo contesto (Chiara, Poggio Renatico, IF 16:8, MacroFactor)

Buon raduno sabato 9 maggio. 🏆

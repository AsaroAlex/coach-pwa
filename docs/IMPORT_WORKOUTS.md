# IMPORT_WORKOUTS.md — Sistema registrazione allenamenti

> Risponde alla domanda: "Come registro/importo gli allenamenti svolti?"

---

## Realtà tecnica (cosa è possibile e cosa no)

### ❌ Cosa NON è possibile (PWA)

- **Auto-import da Apple Health:** le PWA non hanno HealthKit API
- **Auto-import da iFit:** iFit non espone API pubbliche per terze parti
- **Auto-import da MacroFactor:** MF non ha API pubbliche
- **Auto-import da Strava:** richiederebbe OAuth + backend (rifiutato)

### ✅ Cosa È possibile

1. **Inserimento manuale** in app (form veloce, 30 sec)
2. **Import via Apple Shortcut** (workaround per Apple Health)
3. **Inferenza da check-in serale** (campo "workout fatto")
4. **Import da CSV export** (Apple Health → CSV → import)
5. **Foto schermata + AI vision** che estrae i dati (sperimentale, costo API)

---

## Sistema proposto (V1.1)

### Tab "Allenamenti" (nuova sezione)

#### Vista principale
```
ALLENAMENTI                                    [+ Aggiungi]

🔥 Mar 5 mag · HIIT tapis · 28 min · RPE 7 ⚠️
   3.25 km · 146 bpm avg · 269 kcal
   Note: dolore tibia durante warm-up

🌳 Lun 4 mag · Z2 cardio · 35 min · RPE 4
   5.2 km · 152 bpm avg · 298 kcal

🏋️ Dom 3 mag · Pesi MF (full body) · 35 min · RPE 7
   5 esercizi · vedi MacroFactor

⚽ Sab 2 mag · PARTITA · 90 min · RPE 8
   13.4 km · 168 bpm avg · 1247 kcal

[Vedi tutti i 23 allenamenti del mese →]
```

#### Aggiungere un allenamento (form rapido)

```
TIPO
[ 🏋️ Pesi ]  [ 🌳 Z2 ]  [ 🔥 HIIT ]  [ ⚽ Partita ]  [ 🚲 Bici ]  [ 🎾 Padel ]  [ 🏃 Altro ]

DURATA
[__] minuti

INTENSITÀ
[ 🟢 Light ]  [ 🟡 Moderate ]  [ 🟠 Heavy ]  [ 🔴 Massimale ]

RPE (1-10)
[__]

OPZIONALE:
- Distanza (km): [__]
- BPM medio: [__]
- BPM max: [__]
- Calorie: [__]
- Note: [_________________________]

[Salva]
```

### Auto-fill da Apple Watch (via Shortcut)

**Setup utente** (vedi `ICLOUD_BACKUP.md` style guide):

1. Crea Shortcut "Sync ultimo allenamento"
2. Azione "Trova allenamenti" (HealthKit)
3. Limite: 1, ordina più recente
4. Apri URL: `https://APP/?action=workout&type=...&duration=...&distance=...&hr=...&kcal=...`
5. Esegui dopo ogni allenamento

L'app riceve i dati e:
- Pre-compila il form
- Chiede solo "Tipo workout" e "RPE" (gli unici dati Apple Health non ha)

---

## Schema dati workout

```json
{
  "id": "uuid-v4",
  "date": "2026-05-05T19:46:00Z",
  "type": "hiit_tapis",       // pesi_mf, z2_cardio, hiit_tapis, partita, bici, padel, altro
  "duration_min": 28,
  "intensity": "heavy",        // light, moderate, heavy, max
  "rpe": 7,
  "distance_km": 3.25,
  "hr_avg": 146,
  "hr_max": 178,
  "kcal_active": 269,
  "kcal_total": 317,
  "cadence_avg": 122,
  "pace_avg": "8'47\"/km",
  "splits": [
    { "min": 7.2, "pace": "7'12\"", "hr": 135 },
    { "min": 7.95, "pace": "7'57\"", "hr": 148 }
  ],
  "source": "apple_watch",     // manual, apple_watch, ifit, shortcut
  "pain": ["tibia_dx"],         // array di zone
  "notes": "Dolore tibia durante warm-up. 17 km/h irrealistico.",
  "weather": null,
  "location": "tapis"           // tapis, outdoor, palestra, campo, padel_club
}
```

---

## Tipi di workout standardizzati

| Codice | Etichetta | Esempi |
|--------|-----------|--------|
| `pesi_mf` | 🏋️ Pesi (MacroFactor) | Sessione pesi tracciata in MF Workout |
| `pesi_libero` | 🏋️ Pesi (free) | Sessione pesi non tracciata |
| `z2_cardio` | 🌳 Z2 cardio | Cammino veloce, jog leggero |
| `z2_lungo` | 🌳 Z2 lungo (45+ min) | Sessione base aerobica lunga |
| `hiit_tapis` | 🔥 HIIT tapis | Intervalli su tapis con iFit |
| `hiit_outdoor` | 🔥 HIIT outdoor | Sprint outdoor |
| `tempo_run` | ⏱️ Tempo run | Corsa continua a soglia |
| `simulazione_ariet` | 🎯 Simulazione Ariet | Specifico per test |
| `partita` | ⚽ Partita arbitrata | Eccellenza/altra cat |
| `partita_amatoriale` | ⚽ Partita amatoriale | Calcetto con amici |
| `bici_strada` | 🚲 Bici strada | Pianura/lungo |
| `bici_intensa` | 🚲 Bici intensa | Salite, gara |
| `padel` | 🎾 Padel | 60-90 min |
| `recovery_cammino` | 🚶 Recovery cammino | Defaticante |
| `mobilita` | 🧘 Mobilità | Stretching/foam roll |
| `altro` | 🏃 Altro | Custom con note |

---

## Come l'app USA i dati allenamento

### Calcolo carico settimanale
```
TSS settimanale = Σ (durata × intensità_factor)

Dove intensità_factor:
- light: 0.4
- moderate: 0.7
- heavy: 1.0
- max: 1.4
```

Mostra in tab "Forma":
- Carico questa settimana vs scorsa (verde se +5-15%, rosso se +30%+)
- Distribuzione tipologie (% pesi vs cardio vs HIIT)
- Trend RPE medio

### Modifiche al piano basate su workout svolti

**Logiche:**

1. **Se HIIT fatto ieri → mai HIIT oggi**
2. **Se partita ieri → recovery oggi (no intensità)**
3. **Se pesi heavy ieri → cardio leggero oggi (Z2 30 min max)**
4. **Se 5 sessioni intense in 7 giorni → suggerisci giorno extra di riposo**
5. **Se 3 giorni consecutivi senza workout → motivazione, non rimprovero**

### Pattern detection (V1.2+)

L'app può imparare:
- "Dopo HIIT tu hai dolore tibia → suggerisci ridurre velocità target"
- "Dopo partita tu sei sotto 3/5 energia per 2 giorni → blocca cardio per 48h"
- "Funziona meglio con 2 giorni pesi spaziati → suggerisci lun+gio fisso"

---

## Workflow dopo allenamento (UX flow)

1. **Termina allenamento sul tapis/Apple Watch**
2. **iPhone vibra** (notifica): "Allenamento completato — registra in Coach Alex (30 sec)"
3. **Tap notifica** → apre app su tab Allenamenti, form pre-compilato
4. **Aggiungi RPE + note** (5 sec)
5. **Salva**
6. **App suggerisce** se serve recovery domani

---

## TODO implementazione (per Claude Code)

### MVP (subito)
- [ ] Aggiungere store IndexedDB `workouts` in `src/storage.js`
- [ ] Aggiungere tab "Allenamenti" nella nav
- [ ] Form add workout (sezioni essenziali)
- [ ] Lista workouts ordinata per data
- [ ] URL scheme handler per `?action=workout&...`
- [ ] Aggiornare prompt AI Coach con storico workout (ultime 7 sessioni)

### V1.2
- [ ] Calcolo TSS settimanale
- [ ] Auto-suggest piano modificato in base a workout svolti
- [ ] Pattern detection con AI (correlazione dolore-tipo workout)
- [ ] Export CSV per analisi esterna

### V2.0 (nativo SwiftUI)
- [ ] HealthKit auto-import senza Shortcut
- [ ] Workout intent (Siri "log allenamento")
- [ ] Apple Watch app dedicata che logga in real-time

# TRAINING_WEEKLY.md — Schema settimanale palestra + corsa + sport extra

> Risponde alla domanda: "Quando palestra, quando corsa, doppia seduta sì o no, cosa salto se ho poco tempo?"

---

## Schema settimanale BASE (no eventi extra)

| Giorno | Mattina | Sera/Pranzo | Note |
|--------|---------|-------------|------|
| **LUN** | Riposo | 🏋️ Pesi MF (full body o upper) | Inizio settimana |
| **MAR** | Riposo | 🌳 Z2 cardio 35 min | Recupero attivo da pesi |
| **MER** | Riposo | 🔥 HIIT tapis 25 min | Sessione qualità |
| **GIO** | Riposo | 🏋️ Pesi MF (full body o lower) | |
| **VEN** | Riposo | 🌳 Z2 cardio 45 min (lungo) | Volume settimanale |
| **SAB** | Riposo | 🌳 Z2 30 min OR riposo | Pre-partita o partita |
| **DOM** | ⚽ Partita o riposo | — | Partita = cardio Z4-5 vero |

**Ratio settimana base:**
- 2 sessioni pesi (MF Workout)
- 3 sessioni cardio (2 Z2 + 1 HIIT)
- 1 partita o lungo Z2
- 1 giorno riposo completo

**Volume settimanale stimato:** ~150-180 min cardio + 90 min pesi.

---

## Doppia seduta: SI o NO?

**Default: NO.** Una sessione/giorno per i prossimi 3 mesi.

**Eccezioni:**
- 1 mattina pesi + 1 pomeriggio cardio leggero (30 min Z2 cammino) — ok occasionale
- Mai 2 sessioni di intensità nello stesso giorno
- Mai HIIT + Pesi nello stesso giorno (rischio sovraccarico)

**Quando ha senso doppia:**
- Prossimo a un test e si sente fresco → +1 sessione Z2 leggera
- Settimana scarica (post-partita doppia) → ok
- Mai per "compensare" un giorno saltato (vedi sotto)

---

## Cosa salto se ho POCO TEMPO

**Priorità da rispettare in ORDINE (1 = mai saltare):**

| Priorità | Cosa | Perché |
|----------|------|--------|
| 1 | Check-in serale (60 sec) | Costruisce dati e abitudine |
| 2 | Pesi MF (2×/sett) | Preserva muscolo durante deficit |
| 3 | 1 sessione Z2 cardio (45 min) | Base aerobica |
| 4 | 1 sessione HIIT (25 min) | VO2max + EPOC |
| 5 | Foto progresso settimanale | Tracking trasformazione |
| 6 | Z2 secondario | Volume aggiuntivo |
| 7 | Stretching | Non lo fai comunque |

**In sintesi:**
- Se hai **15 min:** check-in + camminata 10 min
- Se hai **30 min:** check-in + pesi MF (sessione veloce)
- Se hai **45 min:** check-in + cardio Z2
- Se hai **60+ min:** sessione completa secondo piano

---

## Cosa fare se SALTO una seduta

**Regola:** mai recuperare la sessione saltata aggiungendola ad un altro giorno.

| Saltato | Recupero |
|---------|----------|
| Pesi lunedì | Sposta a martedì (e martedì cardio diventa riposo) |
| HIIT mercoledì | Salta. Settimana avrà 2 cardio invece di 3. |
| Z2 venerdì | Sposta a sabato se possibile, altrimenti salta |
| Tutta la settimana saltata | Reset domenica, riparti lunedì |

**Mai aggiungere intensità per "recuperare".** Costanza > intensità.

---

## Eventi EXTRA — come gestirli

### ⚽ Partita arbitrata (Eccellenza)

**Volume reale:** ~12-15 km, BPM medio 155-175, alcuni picchi >190. Pari a 2 sessioni HIIT.

**Settimana con partita domenica:**

| Giorno | Workout |
|--------|---------|
| LUN | Riposo COMPLETO (no cardio, no pesi) |
| MAR | Z2 leggero 30 min OR pesi LIGHT (volume −30%) |
| MER | Pesi MF normale |
| GIO | Z2 35 min |
| VEN | Riposo o pesi LIGHT |
| SAB | Riposo (pre-partita) |
| DOM | ⚽ PARTITA |

**Settimana con partita sabato:** sposta tutto un giorno indietro.

### 🚲 Uscita in bici

**Cardio leggero (1-2h spianata):** vale come Z2.
**Bici intensa (salite, gara):** vale come HIIT, salta HIIT della settimana.

**Esempio settimana con bici sabato 2h:**

| LUN | Pesi |
| MAR | Z2 30 min |
| MER | HIIT |
| GIO | Pesi |
| VEN | Riposo |
| SAB | 🚲 Bici 2h (sostituisce Z2 lungo) |
| DOM | Riposo o partita |

### 🎾 Padel

**60-90 min padel intenso:** vale come HIIT (intervallato, alta intensità).
**Casual con amici:** vale come Z2.

**Se padel intenso al posto di HIIT:** ok 1×/settimana, salta HIIT del piano.

### 🏃 Raduno o test atletico

**Settimana del raduno (fine agosto):** fase **TAPER** (vedi `docs/TRAINING_TAPIS.md` sezione "Protocollo 5 giorni").

```
LUN: Z2 leggero 30 min
MAR: Pesi LIGHT (50% volume)
MER: Simulazione Ariet 10 min
GIO: Riposo + carb-loading
VEN: Mobilità 10 min, riposo
SAB: TEST (mattina)
```

### 🏃 Altri allenamenti collettivi (CRA, raduno tecnico)

Se la sessione del CRA è già intensa:
- Mattina sessione CRA → giornata = "speso"
- Salta cardio del giorno
- Pesi solo se ti senti fresco la sera

---

## Come INSERIRE eventi extra nell'app

> Questa sezione descrive funzionalità da implementare nell'app (vedi `TODO.md`).

**Flow proposto:**

1. Tab "Oggi" → tap "Aggiungi evento" (icona +)
2. Scegli tipo: Partita / Bici / Padel / Raduno / Altro
3. Inserisci durata stimata + intensità (light/medium/heavy)
4. L'app:
   - Marca il giorno come "evento attivo"
   - Suggerisce di saltare/spostare workout pianificati
   - Aggiusta automaticamente il piano dei 2-3 giorni successivi (recovery)

**Per ora (V1):** inserisci nel campo "note" del check-in serale (es. "partita domenica 13 km") e chiedi al Coach AI che fare il giorno dopo.

---

## Volume settimanale realistico per fase

### Fase 1 (5 mag → 31 lug): Trasformazione
**Focus:** deficit calorico + base aerobica + preservazione muscolo

| Tipologia | Volume/settimana |
|-----------|------------------|
| Pesi MF | 2 sessioni × 30 min = 60 min |
| Cardio Z2 | 2-3 × 35-45 min = 90-130 min |
| Cardio HIIT | 1 × 25 min = 25 min |
| Eventi extra | Variabile |
| **Totale cardio** | **115-180 min/settimana** |

### Fase 2 (1 ago → 25 ago): Pre-test
**Focus:** performance Ariet + mantenimento massa

| Tipologia | Volume/settimana |
|-----------|------------------|
| Pesi MF | 1-2 sessioni × 25 min |
| Cardio Z2 | 2 × 30-40 min |
| HIIT specifico Ariet | 1-2 × 20-25 min |
| Simulazione shuttle | 1 × 15 min (settimana del test) |
| **Totale** | **120-150 min/settimana** |

### Fase 3 (post-test agosto): Mantenimento
Decisione dopo il test 2.

---

## Regola d'oro finale

> **Costanza per 12 settimane batte intensità per 2 settimane.**

Meglio 4 sessioni "ok" alla settimana per 12 settimane che 7 sessioni "perfette" per 2 settimane e poi burnout.

L'app esiste per **mantenerti attaccato al piano**, non per spingerti oltre i limiti.

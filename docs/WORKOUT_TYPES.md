# WORKOUT_TYPES.md — Tipi di sessioni standardizzati

Codifica usata in `Storage.workouts.type`. Questi codici sono usati ovunque nell'app (form, AI prompt, statistiche).

| Codice | Icona | Etichetta breve | Uso tipico | Intensità tipica |
|--------|-------|----------------|------------|------------------|
| `pesi_mf` | 🏋️ | Pesi MF | Sessione MacroFactor Workout completa | moderate-heavy |
| `pesi_libero` | 🏋️ | Pesi (free) | Sessione palestra non tracciata in MF | moderate-heavy |
| `z2_cardio` | 🌳 | Z2 cardio | 30-40 min Z2 al tapis o outdoor | light-moderate |
| `z2_lungo` | 🌳 | Z2 lungo | 45+ min Z2 (sessione settimanale lunga) | moderate |
| `hiit_tapis` | 🔥 | HIIT tapis | Schema "Piramide 1×1" o "Cammino-corsa" | heavy |
| `hiit_outdoor` | 🔥 | HIIT outdoor | Sprint outdoor (raro per Alex) | heavy |
| `tempo_run` | ⏱️ | Tempo run | Corsa continua a soglia | heavy |
| `simulazione_ariet` | 🎯 | Sim Ariet | Sessione specifica per test (settimana del test) | moderate-heavy |
| `partita` | ⚽ | Partita | Partita Eccellenza arbitrata (~12-15 km) | heavy-max |
| `partita_amatoriale` | ⚽ | Calcetto | Partita amatoriale con amici | moderate-heavy |
| `bici_strada` | 🚲 | Bici strada | Pianura/lungo, &lt;3h | light-moderate |
| `bici_intensa` | 🚲 | Bici intensa | Salite, gara, tempo run in bici | heavy |
| `padel` | 🎾 | Padel | 60-90 min padel intenso | moderate-heavy |
| `recovery_cammino` | 🚶 | Recovery cammino | Cammino lento defaticante | light |
| `mobilita` | 🧘 | Mobilità | Foam roll, esercizi mobilità (raro) | light |
| `altro` | 🏃 | Altro | Custom con note (es. nuoto, escursione) | variabile |

## Equivalenze in TSS-like (intensity factor)

Per il calcolo del carico settimanale in tab Allenamenti:

```
load = duration_min × intensity_factor

intensity_factor:
  light     = 0.4
  moderate  = 0.7
  heavy     = 1.0
  max       = 1.4
```

Esempi:
- 25 min HIIT @ heavy = 25 × 1.0 = **25**
- 90 min partita @ heavy = 90 × 1.0 = **90**
- 35 min Z2 @ moderate = 35 × 0.7 = **24.5**
- 40 min recovery @ light = 40 × 0.4 = **16**

## Regole di sostituzione tra tipi

Quando un evento extra cade in settimana, sostituisce un workout pianificato:

| Evento | Sostituisce |
|--------|-------------|
| Partita arbitrata | 1 HIIT + 1 Z2 lungo (dato il volume) |
| Bici intensa (>1h) | 1 HIIT |
| Padel intenso (>60 min) | 1 HIIT |
| Bici strada lunga (>2h) | 1 Z2 lungo |
| Calcetto amatoriale | 1 Z2 cardio |

## Note specifiche per Alex

- **Pesi:** sempre `pesi_mf` (Alex usa solo MacroFactor Workout)
- **Outdoor:** raro, ma se accade meglio specificarlo nelle note
- **Partita:** è automaticamente cardio Z4-5 vero, conta come 2 sessioni
- **Padel/Bici:** intensità varia molto, registrare onestamente RPE

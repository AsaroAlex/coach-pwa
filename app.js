# TRAINING_TAPIS.md — Vincoli REALI tapis NordicTrack T 9 + iFit

> **Documento critico.** Tutti i workout cardio dell'app DEVONO rispettare questi vincoli. Modificare il piano ignorando questi vincoli ha causato dolore tibia il 5 maggio 2026.

---

## Vincoli hardware

| Parametro | Valore | Note |
|-----------|--------|------|
| Marca/modello | NordicTrack T Series 9 | |
| Velocità minima | 1 km/h | |
| Velocità massima | **20 km/h** | Reale, ma vedi sotto |
| Pendenza min | 0% | |
| Pendenza max | ~12% | |
| Display | iFit (touchscreen integrato) | |

## Vincoli iFit (app del tapis)

⚠️ **CRITICO:** quando crei workout custom in iFit, **gli intervalli devono essere ≥1 minuto**.

Questo significa:
- ❌ NO 30s sprint + 30s recovery (classic Tabata)
- ❌ NO 20s/40s
- ❌ NO 15s sprint
- ✅ SÌ 1min/1min, 2min/1min, 1min/2min, 3min/2min, etc.
- ✅ SÌ blocchi di Z2 lunghi (5+ minuti)

## Capacità reale di Alex (5 maggio 2026)

Basato sui dati Apple Watch + display NordicTrack del 5 mag:

| Velocità | Sensazione attesa | Stato Alex |
|----------|-------------------|------------|
| 4 km/h | Camminata lenta | Comoda |
| 5 km/h | Camminata normale | Comoda |
| 6 km/h | Camminata veloce | **Già stressante per stinchi** |
| 7 km/h | Jog lento | Limite di camminata |
| 8 km/h | Jog facile | Cadenza ~145 ppm |
| 9 km/h | Corsa lenta | Sostenibile 10-15 min |
| 10 km/h | Corsa moderata | Sostenibile 5-10 min |
| 12 km/h | Corsa veloce | Sostenibile 2-4 min |
| 14 km/h | Corsa rapida | Sostenibile 1-2 min |
| 16 km/h | Sprint contenuto | **Sostenibile 30-60 sec** |
| 18 km/h | Sprint vero | **Sostenibile 10-30 sec** (rischio caduta) |
| 20 km/h | Sprint elite | **NON usare**, rischio infortunio |

**Decisione operativa:** fino a luglio 2026 (dopo test 1 + base aerobica più solida):
- Velocità sprint massima nei workout proposti: **14 km/h**
- Tempo a 14 km/h: 30-60 secondi MAX (con 1 min di intervallo)
- Mai proporre 16-20 km/h come "target" nei workout iFit

---

## RISCALDAMENTO — REGOLA NUMERO 1

❌ **MAI** iniziare a 6 km/h "come camminata"
❌ **MAI** riscaldamento di 2 minuti

✅ **Riscaldamento standard: 5 minuti progressivi**

```
Min 0-1: 4 km/h (mobilità articolare)
Min 1-2: 5 km/h
Min 2-3: 6 km/h
Min 3-4: 7 km/h
Min 4-5: 8 km/h (jog leggero)
```

✅ **Riscaldamento giorni "stinchi sensibili" o post-fastidio: 8 minuti**

```
Min 0-2: 4 km/h
Min 2-4: 5 km/h  
Min 4-6: 6 km/h
Min 6-8: 7 km/h
```

Se durante riscaldamento compare fastidio tibia → **STOP, switch a Z2 cammino, vedi `AUTOREGULATION.md`**.

---

## COOL-DOWN — Sempre presente

**5 minuti minimo, MAI saltare.**

```
Min 0-2: dimezza velocità ultima del workout
Min 2-3: 7 km/h
Min 3-4: 6 km/h
Min 4-5: 5 km/h
```

---

## WORKOUT TYPES — versioni adattate

### TIPO 1: Z2 LISS (Low Intensity Steady State)
**Quando:** 2-3×/settimana, base aerobica

```
- Riscaldamento progressivo: 5 min
- BLOCCO PRINCIPALE: 30-45 min a 8.5-9.5 km/h
  → Target BPM: 155-167 (zona 2)
  → Pendenza: 1-2% (simula outdoor, riduce stress tibia)
- Cool-down: 5 min progressivo
TOTALE: 40-55 min
```

**Note:**
- Pendenza 1-2% riduce impatto e ricrea simulato outdoor
- Se BPM sopra 170, rallenta a 8 km/h
- Se BPM sotto 150, aumenta a 10 km/h
- Cammino veloce (6.5-7 km/h) con pendenza 6-8% è **alternativa valida** se stinchi danno fastidio

### TIPO 2: HIIT realistico per Alex (con vincolo iFit ≥1min)
**Quando:** 1-2×/settimana, mai consecutive

**SCHEMA A — "1×1 Pyramid" (≈25 min totali)**

```
Riscaldamento: 5 min progressivo (4→8 km/h)

BLOCCO INTERVALLI:
- 1 min @ 11 km/h | 1 min @ 6 km/h cammino
- 1 min @ 12 km/h | 1 min @ 6 km/h
- 1 min @ 13 km/h | 1 min @ 6 km/h
- 1 min @ 14 km/h | 1 min @ 6 km/h  ← picco
- 1 min @ 13 km/h | 1 min @ 6 km/h
- 1 min @ 12 km/h | 1 min @ 6 km/h
- 1 min @ 11 km/h | 1 min @ 6 km/h
TOTALE intervalli: 14 min

Cool-down: 5 min progressivo (8→4 km/h)

TOTALE: ~25 min
```

**SCHEMA B — "Tempo Run lungo" (≈22 min)**

```
Riscaldamento: 5 min progressivo
2 min @ 10 km/h
3 min @ 11 km/h
2 min @ 10 km/h
3 min @ 11.5 km/h
Cool-down: 5 min progressivo

TOTALE: 20 min
```

**SCHEMA C — "Cammino-corsa" (per stinchi sensibili, ≈25 min)**

```
Riscaldamento: 8 min progressivo
1 min jog 9 km/h | 2 min cammino veloce 6 km/h
1 min jog 9 km/h | 2 min cammino veloce 6 km/h
1 min jog 9.5 km/h | 2 min cammino veloce 6.5 km/h
1 min jog 10 km/h | 2 min cammino veloce 6.5 km/h
1 min jog 10 km/h | 2 min cammino veloce 7 km/h
Cool-down: 5 min

TOTALE: 26 min
```

### TIPO 3: Simulazione Ariet (specifica raduno)
**Quando:** 1-2×/settimana fino al test, poi smetti

⚠️ **NON è realmente un Ariet** — il vero Ariet è uno shuttle 20m con cambio direzione. Sul tapis simuliamo lo sforzo cardio.

```
Riscaldamento: 5 min progressivo

SIMULAZIONE LIVELLI ARIET (tapis):
- 2 min @ 9 km/h (livelli 1-3)
- 2 min @ 10 km/h (livelli 4-6)
- 2 min @ 11 km/h (livelli 7-9)
- 2 min @ 12 km/h (livelli 10-12)
- 1 min @ 13 km/h (livelli 13-14)
- 1 min @ 14 km/h (livello 15.1 — target)

Cool-down: 5 min

TOTALE: 20 min
```

**Importante:** sul tapis non puoi simulare l'inversione di marcia ogni 20m. Aggiungi shuttle reali la settimana del test (vedi `WORKOUT_TYPES.md`).

### TIPO 4: Recovery cammino (giorni post-partita o post-HIIT)

```
30 min costanti @ 6 km/h
Pendenza 0-2%
NO intervalli
NO accelerazioni
Obiettivo: BPM 110-130 (sotto soglia Z2)
```

---

## ALTRI CONSIGLI PRATICI

### Calzature
Se non l'hai già, **scarpe da running ammortizzate** sono critiche per evitare shin splints sul tapis. Brand consigliati con buon prezzo: ASICS Gel-Contend, Brooks Ghost, Nike Pegasus. Spesa una tantum €60-100.

### Posizione del piede
Cerca di atterrare con **mid-foot** (mezzo piede), non con tallone. Questo riduce stress sulla tibia.

### Cadenza target
Punta a **160-170 ppm** in corsa. Sotto 150 = passi troppo lunghi (più impatto). Apple Watch mostra "Cadenza media" in metriche post-allenamento.

### Idratazione
**Bevi 250 ml acqua 30 min prima.** Sul tapis sudi più che outdoor. Borraccia a portata di mano.

### Pendenza 1-2% sempre
Anche per Z2: simula outdoor (resistenza aria), riduce impatto sulla tibia, brucia leggermente di più.

---

## RED FLAGS — Quando fermarti SUBITO

| Sintomo | Azione |
|---------|--------|
| Dolore acuto davanti tibia | STOP. Ghiaccio 15 min. Riposo cardio 2-3 giorni. |
| Dolore al ginocchio | STOP. Verifica scarpe. Se persiste 48h → fisio. |
| Capogiri / vista offuscata | STOP. Probabilmente glicemia bassa (hai mangiato poco?). |
| BPM sopra 195 sostenuto | Riduci velocità. HRmax 202, 195+ = fuori zona allenamento. |
| Respiro corto + petto pesante | STOP. Idratati. Riposa 5 min. Se persiste → cardiologo. |
| Crampo polpaccio | STOP. Stretch leggero. Bevi acqua + sale. |

**Regola d'oro:** se hai un dubbio, FERMATI e CAMMINA 5 minuti. Riprendi solo se passa.

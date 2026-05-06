# Backup automatico su iCloud Drive

Setup di uno Shortcut iOS che salva i tuoi dati sull'iCloud Drive ogni domenica.

## Perché iCloud invece di "Login Apple ID"

Implementare "Sign in with Apple" in una PWA richiederebbe:
- Apple Developer account ($99/anno)
- Backend serverless (Supabase/Cloudflare)
- 2-3 giorni di sviluppo

Con iCloud Drive ottieni lo stesso risultato gratis:
- ✅ Sync automatico tra i tuoi dispositivi (iCloud lo fa di default)
- ✅ Backup persistente
- ✅ Zero costi, zero account terzi
- ✅ Tu controlli i file

## Setup (10 minuti, una volta sola)

### 1. Crea cartella su iCloud Drive

1. Apri app **File** sull'iPhone
2. Tocca **iCloud Drive**
3. Tocca tre puntini (...) → **Nuova cartella**
4. Nome: **Coach Alex Backup**

### 2. Crea Shortcut "Backup Coach Alex"

1. Apri **Comandi Rapidi**
2. Tocca **+** (in alto a destra)
3. Aggiungi queste azioni in ordine:

   **Azione 1: Apri URL**
   - URL: `https://TUO-DOMINIO.netlify.app/?action=export`
   - (questo apre l'app sulla pagina di export)

   **Azione 2: Aspetta**
   - 5 secondi (per dare tempo all'app di generare il JSON)

   **Azione 3: Ottieni file più recente da Download**
   - Cartella: Download
   - (l'app salva il backup nella cartella Download del telefono)

   **Azione 4: Salva file**
   - Destinazione: **iCloud Drive / Coach Alex Backup**
   - Nome file: `coach-backup-` + Data corrente + `.json`
   - Sovrascrivere: **Sì**

4. Nome Shortcut: **Backup Coach Alex**
5. **Aggiungi al Home Screen** per accesso rapido

### 3. Automazione settimanale

1. In Comandi Rapidi → tab **Automazione** → **+**
2. **Crea automazione personale**
3. **Ora del giorno** → Domenica 22:00
4. Aggiungi azione: **Esegui Comando Rapido** → "Backup Coach Alex"
5. Disattiva "Chiedi prima di eseguire" (se vuoi automatico)

## Restore (cambio telefono o reset)

1. Apri PWA su nuovo dispositivo
2. Setup → Backup & Dati → **Importa backup**
3. App File → iCloud Drive → Coach Alex Backup → seleziona JSON più recente
4. Conferma import
5. Tutti i tuoi dati (peso, check-in, foto, conversazioni Coach) tornano

## Sync tra iPhone e iPad

Se installi la PWA anche su iPad:
1. Esegui "Backup Coach Alex" su iPhone
2. Su iPad apri PWA → Importa backup → seleziona ultimo JSON
3. iPad ora ha gli stessi dati

(Non è "real-time" come iCloud nativo, ma per uso pratico è sufficiente)

## Alternative

Se proprio vuoi sync nativo Apple ID + backend, possiamo aggiungerlo in V2:
- Costo: $99/anno Apple Developer + ~3 giorni dev
- Tempo realistico: dopo aver validato che usi davvero la PWA per 60 giorni

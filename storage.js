// Health Module — Apple Health integration via Shortcuts/URL scheme
// PWAs can't directly access HealthKit. Workaround: Apple Shortcuts pass data via URL.
// Format: coachalex://weight?value=78.5
//         coachalex://workout?type=hiit&duration=22

const Health = {
  // Parse incoming URL parameters from Shortcut
  parseURL() {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const value = params.get('value');
    const date = params.get('date');

    if (!action) return null;

    return {
      action,
      value: value ? parseFloat(value) : null,
      date: date || new Date().toISOString().split('T')[0],
    };
  },

  // Handle weight from Shortcut
  async handleWeight(value, date) {
    if (!value || isNaN(value)) return false;
    await Storage.addWeight(value, date);

    // Update profile current weight
    const profile = await Storage.getProfile();
    profile.weight = value;
    await Storage.saveProfile(profile);

    return true;
  },

  // Handle workout from Shortcut/Health
  async handleWorkout(type, duration, calories) {
    // Stored as a checkin entry
    const checkin = {
      date: new Date().toISOString(),
      workout: type,
      workoutDuration: duration,
      workoutCalories: calories,
      source: 'shortcut',
    };
    return Storage.addCheckin(checkin);
  },

  // Handle URL-based actions from Shortcut iOS
  async handleIncoming() {
    const data = this.parseURL();
    if (!data) return null;

    switch (data.action) {
      case 'weight':
        if (data.value) {
          await this.handleWeight(data.value, data.date);
          return { type: 'weight', value: data.value };
        }
        break;
      case 'checkin':
        // Open checkin tab
        return { type: 'navigation', target: 'checkin' };
      case 'foto':
        return { type: 'navigation', target: 'dieta' };
    }
    return null;
  },

  // Generate Shortcut import URLs (deeplinks to iOS Shortcuts)
  generateWeightShortcut() {
    // This URL would be a fully constructed iOS Shortcut .shortcut file URL
    // For MVP: instructions only
    return {
      name: 'Log peso veloce',
      steps: [
        'Apri app Comandi Rapidi',
        'Crea nuovo Shortcut',
        'Aggiungi azione "Chiedi numero" → "Quanto pesi?"',
        'Aggiungi azione "Apri URL" → coachalex://weight?value=[Numero]',
        'Salva come "Log peso"',
      ],
    };
  },

  generateHealthSyncShortcut() {
    return {
      name: 'Sync peso da Salute',
      steps: [
        'Apri Comandi Rapidi',
        'Crea nuovo Shortcut',
        'Aggiungi "Trova campioni di salute"',
        'Configura: Tipo=Massa corporea, Limite=1, Ordina per più recente',
        'Aggiungi "Apri URL": coachalex://weight?value=[Risultato.peso]',
        'Salva. Imposta Automazione: ogni mattina alle 09:00',
      ],
    };
  },
};

window.Health = Health;

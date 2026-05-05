// Notifications Module — Web Push (limited iOS) + iOS Reminders deep-links

const Notifications = {
  isSupported() {
    return 'Notification' in window && 'serviceWorker' in navigator;
  },

  // iOS 16.4+ supports web push only for installed PWAs
  isInstalledPWA() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  },

  async requestPermission() {
    if (!this.isSupported()) {
      return { ok: false, reason: 'browser_unsupported' };
    }

    if (!this.isInstalledPWA()) {
      return { ok: false, reason: 'not_installed', message: 'Per le notifiche su iOS, devi prima installare l\'app (Aggiungi a Home)' };
    }

    const permission = await Notification.requestPermission();
    return { ok: permission === 'granted', permission };
  },

  // Show local notification (works once permission granted)
  async show(title, body, options = {}) {
    if (Notification.permission !== 'granted') return false;

    const reg = await navigator.serviceWorker.ready;
    return reg.showNotification(title, {
      body,
      icon: 'assets/icon-192.png',
      badge: 'assets/icon-192.png',
      tag: options.tag || 'coach-default',
      requireInteraction: options.persistent || false,
      ...options,
    });
  },

  // Schedule local notification (workaround: setTimeout for short-term, can't truly schedule on web)
  async scheduleEveningCheckin() {
    if (Notification.permission !== 'granted') return false;

    const now = new Date();
    const target = new Date();
    target.setHours(21, 0, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);

    const ms = target - now;
    if (ms < 24 * 3600 * 1000) {
      setTimeout(() => {
        this.show('🌙 Check-in serale', 'Apri l\'app per il check-in giornaliero — 2 minuti.', {
          tag: 'evening-checkin',
        });
      }, ms);
      return true;
    }
    return false;
  },

  // Better approach for iOS: deep-link to Reminders.app
  // x-apple-reminderkit:// can create reminders, but limited.
  // Instead: provide instructions for manual setup
  generateRemindersList() {
    return [
      {
        name: 'Check-in serale Coach Alex',
        time: '21:00 ogni giorno',
        body: 'Apri Coach Alex per check-in giornaliero',
      },
      {
        name: 'Pesati Coach Alex',
        time: '08:00 ogni giorno',
        body: 'A digiuno, dopo bagno',
      },
      {
        name: 'Creatina giornaliera',
        time: '15:00 ogni giorno',
        body: '5g monoidrato con acqua o caffè',
      },
      {
        name: 'Foto progresso settimanale',
        time: 'Lunedì 09:00',
        body: 'A digiuno, frontale + laterale',
      },
    ];
  },

  // Open iOS Reminders app to create reminders manually
  openReminders() {
    // x-callback-url could create one at a time, but UX isn't great
    // Better: open Reminders.app and let user create from list
    window.location.href = 'x-apple-reminderkit://';
  },
};

window.Notifications = Notifications;

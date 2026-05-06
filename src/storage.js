// Storage Module — IndexedDB wrapper
// Robust local storage for check-ins, photos, settings

const DB_NAME = 'CoachAlexDB';
const DB_VERSION = 2;

// Stores schema:
// - profile: user profile (single object)
// - checkins: daily check-ins (timestamp-keyed)
// - weights: weight history from Apple Health (date-keyed)
// - photos: progress photos (week-keyed, base64)
// - mealPhotos: meal photo analyses (timestamp-keyed)
// - coachHistory: AI coach conversations
// - apiUsage: track monthly Claude API spending

let dbInstance = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('profile')) db.createObjectStore('profile', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('checkins')) db.createObjectStore('checkins', { keyPath: 'date' });
      if (!db.objectStoreNames.contains('weights')) db.createObjectStore('weights', { keyPath: 'date' });
      if (!db.objectStoreNames.contains('photos')) db.createObjectStore('photos', { keyPath: 'week' });
      if (!db.objectStoreNames.contains('mealPhotos')) db.createObjectStore('mealPhotos', { keyPath: 'date' });
      if (!db.objectStoreNames.contains('coachHistory')) db.createObjectStore('coachHistory', { keyPath: 'date' });
      if (!db.objectStoreNames.contains('apiUsage')) db.createObjectStore('apiUsage', { keyPath: 'month' });
      if (!db.objectStoreNames.contains('workouts')) db.createObjectStore('workouts', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('events')) db.createObjectStore('events', { keyPath: 'id' });
    };
    req.onsuccess = e => { dbInstance = e.target.result; resolve(dbInstance); };
    req.onerror = e => reject(e);
  });
}

async function dbPut(storeName, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(value);
    req.onsuccess = () => resolve(value);
    req.onerror = e => reject(e);
  });
}

async function dbGet(storeName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e);
  });
}

async function dbGetAll(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = e => resolve(e.target.result || []);
    req.onerror = e => reject(e);
  });
}

async function dbDelete(storeName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).delete(key);
    req.onsuccess = () => resolve(true);
    req.onerror = e => reject(e);
  });
}

async function dbClear(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).clear();
    req.onsuccess = () => resolve(true);
    req.onerror = e => reject(e);
  });
}

// High-level API
const Storage = {
  // Profile
  async getProfile() {
    const p = await dbGet('profile', 'main');
    return p || {
      id: 'main',
      name: 'Alex',
      weight: 78.7,
      age: 25,
      hrmax: 202,
      rhr: 85,
      target: 70,
      bf: 26.8,
      onboardingDone: false,
      apiKey: '',
      caps: { coach: 3, vision: 5 },
      notifications: false,
      progressPhotoReminder: true,
    };
  },
  async saveProfile(p) {
    p.id = 'main';
    return dbPut('profile', p);
  },

  // Check-ins
  async addCheckin(checkin) {
    if (!checkin.date) checkin.date = new Date().toISOString();
    return dbPut('checkins', checkin);
  },
  async getCheckins() { return dbGetAll('checkins'); },
  async getRecentCheckins(n = 30) {
    const all = await dbGetAll('checkins');
    return all.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, n);
  },

  // Weights
  async addWeight(weight, date = null) {
    const d = date || new Date().toISOString().split('T')[0];
    return dbPut('weights', { date: d, weight: parseFloat(weight) });
  },
  async getWeights() {
    const all = await dbGetAll('weights');
    return all.sort((a, b) => new Date(a.date) - new Date(b.date));
  },
  async getLatestWeight() {
    const weights = await this.getWeights();
    return weights.length > 0 ? weights[weights.length - 1] : null;
  },

  // Progress photos
  async addProgressPhoto(weekKey, base64) {
    return dbPut('photos', { week: weekKey, image: base64, date: new Date().toISOString() });
  },
  async getProgressPhotos() {
    const all = await dbGetAll('photos');
    return all.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  // Meal photos
  async addMealPhoto(analysis) {
    analysis.date = new Date().toISOString();
    return dbPut('mealPhotos', analysis);
  },
  async getMealPhotos(n = 20) {
    const all = await dbGetAll('mealPhotos');
    return all.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, n);
  },

  // Coach history
  async addCoachConvo(question, answer) {
    return dbPut('coachHistory', {
      date: new Date().toISOString(),
      question,
      answer,
    });
  },
  async getCoachHistory(n = 10) {
    const all = await dbGetAll('coachHistory');
    return all.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, n);
  },

  // API usage tracking
  async trackUsage(type, costEur) {
    const month = new Date().toISOString().slice(0, 7); // YYYY-MM
    let usage = await dbGet('apiUsage', month) || { month, coach: 0, vision: 0 };
    usage[type] = (usage[type] || 0) + costEur;
    return dbPut('apiUsage', usage);
  },
  async getMonthUsage() {
    const month = new Date().toISOString().slice(0, 7);
    return await dbGet('apiUsage', month) || { month, coach: 0, vision: 0 };
  },

  // Workouts (training log)
  async addWorkout(w) {
    if (!w.id) w.id = `w_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    if (!w.date) w.date = new Date().toISOString();
    return dbPut('workouts', w);
  },
  async getWorkouts() {
    const all = await dbGetAll('workouts');
    return all.sort((a, b) => new Date(b.date) - new Date(a.date));
  },
  async getRecentWorkouts(n = 10) {
    const all = await this.getWorkouts();
    return all.slice(0, n);
  },
  async getWeeklyWorkouts() {
    const all = await this.getWorkouts();
    const weekAgo = Date.now() - 7 * 86400000;
    return all.filter(w => new Date(w.date).getTime() > weekAgo);
  },
  async deleteWorkout(id) {
    return dbDelete('workouts', id);
  },

  // Events extra (matches, bike rides, padel, raduni)
  async addEvent(e) {
    if (!e.id) e.id = `e_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    if (!e.date) e.date = new Date().toISOString();
    return dbPut('events', e);
  },
  async getEvents() {
    const all = await dbGetAll('events');
    return all.sort((a, b) => new Date(a.date) - new Date(b.date));
  },
  async getUpcomingEvents() {
    const all = await this.getEvents();
    const now = Date.now();
    return all.filter(e => new Date(e.date).getTime() >= now);
  },
  async deleteEvent(id) {
    return dbDelete('events', id);
  },

  // Backup / Restore
  async exportAll() {
    return {
      version: 2,
      exportedAt: new Date().toISOString(),
      profile: await this.getProfile(),
      checkins: await dbGetAll('checkins'),
      weights: await dbGetAll('weights'),
      photos: await dbGetAll('photos'),
      mealPhotos: await dbGetAll('mealPhotos'),
      coachHistory: await dbGetAll('coachHistory'),
      apiUsage: await dbGetAll('apiUsage'),
      workouts: await dbGetAll('workouts'),
      events: await dbGetAll('events'),
    };
  },
  async importAll(data) {
    if (data.profile) await dbPut('profile', data.profile);
    for (const c of (data.checkins || [])) await dbPut('checkins', c);
    for (const w of (data.weights || [])) await dbPut('weights', w);
    for (const p of (data.photos || [])) await dbPut('photos', p);
    for (const m of (data.mealPhotos || [])) await dbPut('mealPhotos', m);
    for (const h of (data.coachHistory || [])) await dbPut('coachHistory', h);
    for (const u of (data.apiUsage || [])) await dbPut('apiUsage', u);
    for (const w of (data.workouts || [])) await dbPut('workouts', w);
    for (const e of (data.events || [])) await dbPut('events', e);
    return true;
  },

  async clearAll() {
    await dbClear('profile');
    await dbClear('checkins');
    await dbClear('weights');
    await dbClear('photos');
    await dbClear('mealPhotos');
    await dbClear('coachHistory');
    await dbClear('apiUsage');
    await dbClear('workouts');
    await dbClear('events');
    return true;
  },
};

window.Storage = Storage;

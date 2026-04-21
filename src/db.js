import { openDB } from 'idb';

// Polyfill: crypto.randomUUID() requires secure context + Safari 15.4+
// Older iPhones crash silently without this fallback
function _uuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try { return crypto.randomUUID(); } catch(e) { /* fall through */ }
  }
  // Fallback using crypto.getRandomValues (Safari 11+)
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
    (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16)
  );
}

const DB_NAME = 'medicatrack_db';
const DB_VERSION = 2;

let dbPromise;

export function initDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('medications')) {
          const medStore = db.createObjectStore('medications', { keyPath: 'id' });
          medStore.createIndex('by_barcode', 'barcode');
        }
        if (!db.objectStoreNames.contains('logs')) {
          const logStore = db.createObjectStore('logs', { keyPath: 'id' });
          logStore.createIndex('by_med_id', 'medicationId');
          logStore.createIndex('by_date', 'timestamp');
        }
        if (!db.objectStoreNames.contains('metrics')) {
          const metricsStore = db.createObjectStore('metrics', { keyPath: 'id' });
          metricsStore.createIndex('by_type', 'type');
          metricsStore.createIndex('by_date', 'timestamp');
        }
        if (!db.objectStoreNames.contains('plans')) {
          const planStore = db.createObjectStore('plans', { keyPath: 'id' });
          planStore.createIndex('by_med_id', 'medicationId');
        }
      },
    });
  }
  return dbPromise;
}

// Data Helper Functions
export const API = {
  // --- Medications ---
  async getMedications() {
    const db = await initDB();
    return db.getAll('medications');
  },
  async getMedication(id) {
    const db = await initDB();
    return db.get('medications', id);
  },
  async getMedicationByBarcode(barcode) {
    const db = await initDB();
    return db.getFromIndex('medications', 'by_barcode', barcode);
  },
  async addMedication(med) {
    const db = await initDB();
    med.id = med.id || _uuid();
    await db.put('medications', med);
    return med;
  },
  async deleteMedication(id) {
    const db = await initDB();
    await db.delete('medications', id);
  },

  // --- Logs ---
  async getLogs() {
    const db = await initDB();
    return db.getAllFromIndex('logs', 'by_date');
  },
  async addLog(log) {
    const db = await initDB();
    log.id = log.id || _uuid();
    log.timestamp = log.timestamp || Date.now();
    await db.put('logs', log);
    return log;
  },

  // --- Metrics ---
  async getMetrics(type) {
    const db = await initDB();
    if (type) {
        return db.getAllFromIndex('metrics', 'by_type', type);
    }
    return db.getAllFromIndex('metrics', 'by_date');
  },
  async addMetric(metric) {
    const db = await initDB();
    metric.id = metric.id || _uuid();
    metric.timestamp = metric.timestamp || Date.now();
    await db.put('metrics', metric);
    return metric;
  },

  // --- Plans ---
  async getPlans() {
    const db = await initDB();
    return db.getAll('plans');
  },
  async addPlan(plan) {
    const db = await initDB();
    plan.id = plan.id || _uuid();
    await db.put('plans', plan);
    return plan;
  },
  async deletePlan(id) {
    const db = await initDB();
    await db.delete('plans', id);
  },

  // --- Backup/Restore ---
  async exportData() {
    const db = await initDB();
    const data = {
      medications: await db.getAll('medications'),
      logs: await db.getAll('logs'),
      metrics: await db.getAll('metrics'),
      plans: await db.getAll('plans')
    };
    return JSON.stringify(data);
  },
  async importData(jsonString) {
    const data = JSON.parse(jsonString);
    const db = await initDB();
    const tx = db.transaction(['medications', 'logs', 'metrics', 'plans'], 'readwrite');
    
    // clear existing data
    await tx.objectStore('medications').clear();
    await tx.objectStore('logs').clear();
    await tx.objectStore('metrics').clear();
    await tx.objectStore('plans').clear();

    // insert new data
    for (const med of data.medications || []) {
      await tx.objectStore('medications').put(med);
    }
    for (const log of data.logs || []) {
      await tx.objectStore('logs').put(log);
    }
    for (const metric of data.metrics || []) {
      await tx.objectStore('metrics').put(metric);
    }
    for (const plan of data.plans || []) {
      await tx.objectStore('plans').put(plan);
    }
    await tx.done;
  },

  // --- Deletion ---
  async clearAllData() {
    const db = await initDB();
    const tx = db.transaction(['medications', 'logs', 'metrics', 'plans'], 'readwrite');
    await tx.objectStore('medications').clear();
    await tx.objectStore('logs').clear();
    await tx.objectStore('metrics').clear();
    await tx.objectStore('plans').clear();
    await tx.done;
  },
  async clearLogs() {
    const db = await initDB();
    const tx = db.transaction(['logs', 'metrics'], 'readwrite');
    await tx.objectStore('logs').clear();
    await tx.objectStore('metrics').clear();
    await tx.done;
  },
  async clearTodayLogs() {
    const db = await initDB();
    const today = new Date().setHours(0,0,0,0);
    const tx = db.transaction(['logs'], 'readwrite');
    const logs = await tx.objectStore('logs').getAll();
    for (const log of logs) {
      if (new Date(log.timestamp).setHours(0,0,0,0) === today) {
        await tx.objectStore('logs').delete(log.id);
      }
    }
    await tx.done;
  },
  async clearTestData() {
    const db = await initDB();
    const tx = db.transaction(['logs', 'metrics'], 'readwrite');
    const logs = await tx.objectStore('logs').getAll();
    for (const log of logs) {
      if (log.isTestData) await tx.objectStore('logs').delete(log.id);
    }
    const metrics = await tx.objectStore('metrics').getAll();
    for (const m of metrics) {
      if (m.isTestData) await tx.objectStore('metrics').delete(m.id);
    }
    await tx.done;
  }
};

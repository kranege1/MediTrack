import { openDB } from 'idb';

const DB_NAME = 'medicatrack_db';
const DB_VERSION = 1;

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
    med.id = med.id || crypto.randomUUID();
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
    log.id = log.id || crypto.randomUUID();
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
    metric.id = metric.id || crypto.randomUUID();
    metric.timestamp = metric.timestamp || Date.now();
    await db.put('metrics', metric);
    return metric;
  },

  // --- Backup/Restore ---
  async exportData() {
    const db = await initDB();
    const data = {
      medications: await db.getAll('medications'),
      logs: await db.getAll('logs'),
      metrics: await db.getAll('metrics')
    };
    return JSON.stringify(data);
  },
  async importData(jsonString) {
    const data = JSON.parse(jsonString);
    const db = await initDB();
    const tx = db.transaction(['medications', 'logs', 'metrics'], 'readwrite');
    
    // clear existing data
    await tx.objectStore('medications').clear();
    await tx.objectStore('logs').clear();
    await tx.objectStore('metrics').clear();

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
    await tx.done;
  }
};

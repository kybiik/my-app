import { openDB } from 'idb';

const DB_NAME = 'taskflow-db';
const DB_VERSION = 1;
let databasePromise = null;

export function getDatabase() {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('Цей браузер не підтримує IndexedDB.'));
  }
  if (!databasePromise) {
    databasePromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('tasks')) db.createObjectStore('tasks', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('projects')) db.createObjectStore('projects', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('metadata')) db.createObjectStore('metadata');
      },
      blocking() {
        // Release an older connection when another tab upgrades the schema.
        databasePromise?.then(db => db.close());
        databasePromise = null;
      },
      terminated() { databasePromise = null; },
    }).catch(error => {
      databasePromise = null;
      throw error;
    });
  }
  return databasePromise;
}

export async function readSnapshot() {
  const db = await getDatabase();
  const tx = db.transaction(['tasks', 'projects', 'metadata'], 'readonly');
  const [tasks, projects, initialized, nextProjectId, lastSavedAt] = await Promise.all([
    tx.objectStore('tasks').getAll(),
    tx.objectStore('projects').getAll(),
    tx.objectStore('metadata').get('initialized'),
    tx.objectStore('metadata').get('nextProjectId'),
    tx.objectStore('metadata').get('lastSavedAt'),
    tx.done,
  ]);
  return { tasks, projects, initialized: initialized === true, nextProjectId, lastSavedAt };
}

export async function writeSnapshot(snapshot) {
  const db = await getDatabase();
  const tx = db.transaction(['tasks', 'projects', 'metadata'], 'readwrite');
  const tasks = tx.objectStore('tasks');
  const projects = tx.objectStore('projects');
  const metadata = tx.objectStore('metadata');
  const lastSavedAt = new Date().toISOString();
  const requests = [tx.done];
  // Queue all requests synchronously. Only IndexedDB requests are awaited.
  // All three stores commit together, or the complete transaction rolls back.
  try {
    requests.push(tasks.clear(), projects.clear());
    for (const task of snapshot.tasks) requests.push(tasks.put(task));
    for (const project of snapshot.projects) requests.push(projects.put(project));
    requests.push(
      metadata.put(true, 'initialized'),
      metadata.put(snapshot.nextProjectId, 'nextProjectId'),
      metadata.put(lastSavedAt, 'lastSavedAt'),
    );
    await Promise.all(requests);
  } catch (error) {
    // A synchronous cloning/key error must not commit the preceding clear().
    try { tx.abort(); } catch { /* Transaction may already have aborted. */ }
    await Promise.allSettled(requests);
    throw error;
  }
  return lastSavedAt;
}

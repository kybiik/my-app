import { reactive } from 'vue';
import { useTasksStore } from '../store/tasks.js';
import { useProjectsStore } from '../store/projects.js';
import { readSnapshot, writeSnapshot } from './database.js';

// A factory keeps the save queue scoped to one app and allows meaningful tests
// of delayed writes and storage failures without changing browser globals.
export function createPersistence(storage = { readSnapshot, writeSnapshot }) {
  const state = reactive({ status: 'loading', error: '', canRetry: false, lastSavedAt: null });
  let taskStore;
  let projectStore;
  let enabled = false;
  let writing = null;
  let revision = 0;
  let savedRevision = 0;
  let fingerprint = '';
  let scheduled = false;
  const subscriptions = [];

  const makeSnapshot = () => JSON.parse(JSON.stringify({
    tasks: taskStore.tasks,
    projects: projectStore.projects,
    nextProjectId: projectStore.nextProjectId,
  }));

  async function flushChanges() {
    if (!enabled) return;
    if (writing) return writing;
    writing = (async () => {
      while (savedRevision < revision) {
        const targetRevision = revision;
        const snapshot = makeSnapshot();
        try {
          const savedAt = await storage.writeSnapshot(snapshot);
          savedRevision = targetRevision;
          state.lastSavedAt = savedAt ?? new Date().toISOString();
        } catch {
          state.status = 'error';
          state.error = 'Не вдалося зберегти зміни. Вони поки що залишилися лише в пам’яті.';
          state.canRetry = true;
          return;
        }
      }
      state.status = 'saved';
      state.error = '';
      state.canRetry = false;
    })();
    try { await writing; } finally { writing = null; }
  }

  function requestSave(force = false) {
    if (!enabled) return;
    const nextFingerprint = JSON.stringify(makeSnapshot());
    if (!force && nextFingerprint === fingerprint) return writing;
    fingerprint = nextFingerprint;
    revision += 1;
    state.status = 'saving';
    state.error = '';
    state.canRetry = false;
    return flushChanges();
  }

  function onStoreChanged() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      void requestSave();
    });
  }

  async function initialize(pinia) {
    if (enabled) return;
    taskStore = useTasksStore(pinia);
    projectStore = useProjectsStore(pinia);
    try {
      const snapshot = await storage.readSnapshot();
      if (snapshot.initialized) {
        if (!Array.isArray(snapshot.tasks) || !Array.isArray(snapshot.projects)) {
          throw new Error('Некоректний формат локальних даних.');
        }
        const calculatedNextId = Math.max(0, ...snapshot.projects.map(project => {
          const match = /^project-(\d+)$/.exec(String(project.id));
          return match ? Number(match[1]) : 0;
        })) + 1;
        projectStore.$patch({
          projects: snapshot.projects,
          nextProjectId: Number.isSafeInteger(snapshot.nextProjectId) && snapshot.nextProjectId >= calculatedNextId
            ? snapshot.nextProjectId : calculatedNextId,
        });
        taskStore.$patch({ tasks: snapshot.tasks });
        state.lastSavedAt = snapshot.lastSavedAt ?? null;
      } else {
        state.lastSavedAt = await storage.writeSnapshot(makeSnapshot());
      }
      fingerprint = JSON.stringify(makeSnapshot());
      enabled = true;
      state.status = 'saved';
      state.error = '';
      subscriptions.push(
        taskStore.$subscribe(onStoreChanged, { detached: true, flush: 'sync' }),
        projectStore.$subscribe(onStoreChanged, { detached: true, flush: 'sync' }),
      );
    } catch {
      state.status = 'error';
      state.error = 'Не вдалося відкрити або відновити локальні дані. Працює лише тимчасовий стан; наявну базу не перезаписано.';
      state.canRetry = false;
    }
  }

  return {
    state,
    initialize,
    retrySave: () => enabled && state.status === 'error' ? requestSave(true) : undefined,
    async waitForSave() {
      await Promise.resolve();
      await writing;
    },
    dispose() {
      enabled = false;
      subscriptions.splice(0).forEach(unsubscribe => unsubscribe());
    },
  };
}

const persistence = createPersistence();
export const persistenceState = persistence.state;
export const initializePersistence = persistence.initialize;
export const retrySave = persistence.retrySave;

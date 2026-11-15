import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createPinia, setActivePinia } from 'pinia';
import { useTasksStore } from '../src/store/tasks.js';
import { useProjectsStore } from '../src/store/projects.js';
import { createPersistence } from '../src/services/persistence.js';

let pinia;
beforeEach(() => { pinia = createPinia(); setActivePinia(pinia); });
const clone = value => JSON.parse(JSON.stringify(value));
function initialSnapshot() {
  return { initialized: true, tasks: clone(useTasksStore().tasks), projects: clone(useProjectsStore().projects), nextProjectId: 1, lastSavedAt: '2026-11-15T10:00:00.000Z' };
}
function memoryStorage(snapshot) {
  const storage = {
    snapshot, writes: [],
    async readSnapshot() { return clone(storage.snapshot); },
    async writeSnapshot(value) {
      storage.writes.push(clone(value));
      storage.snapshot = { ...clone(value), initialized: true, lastSavedAt: '2026-11-15T11:00:00.000Z' };
      return storage.snapshot.lastSavedAt;
    },
  };
  return storage;
}

test('first launch seeds once and records the real saved timestamp', async () => {
  const storage = memoryStorage({ initialized: false, tasks: [], projects: [] });
  const persistence = createPersistence(storage);
  await persistence.initialize(pinia);
  assert.equal(storage.writes.length, 1);
  assert.equal(storage.snapshot.tasks.length, 10);
  assert.equal(storage.snapshot.projects.length, 3);
  assert.equal(persistence.state.status, 'saved');
  assert.equal(persistence.state.lastSavedAt, storage.snapshot.lastSavedAt);
  persistence.dispose();
  const second = createPersistence(storage);
  await second.initialize(pinia);
  assert.equal(storage.writes.length, 1);
  second.dispose();
});

test('hydration preserves an intentionally empty task list without reseeding', async () => {
  const snapshot = initialSnapshot(); snapshot.tasks = [];
  const storage = memoryStorage(snapshot);
  const persistence = createPersistence(storage);
  await persistence.initialize(pinia);
  assert.equal(useTasksStore().totalTasks, 0);
  assert.equal(storage.writes.length, 0);
  assert.equal(persistence.state.lastSavedAt, snapshot.lastSavedAt);
  persistence.dispose();
});

test('restoration repairs stale project counters using stored project IDs', async () => {
  const snapshot = initialSnapshot();
  snapshot.projects.push({ id: 'project-12', title: 'Збережений проєкт' });
  snapshot.nextProjectId = 2;
  const persistence = createPersistence(memoryStorage(snapshot));
  await persistence.initialize(pinia);
  assert.equal(useProjectsStore().nextProjectId, 13);
  assert.equal(useProjectsStore().addProject('Наступний проєкт').id, 'project-13');
  await persistence.waitForSave(); persistence.dispose();
});

test('search, filters, sorting and selection do not write persisted data', async () => {
  const storage = memoryStorage(initialSnapshot());
  const persistence = createPersistence(storage);
  await persistence.initialize(pinia);
  useTasksStore().$patch({ searchText: 'новий текст', selectedStatus: 'done', selectedPriority: 'high', selectedProject: 'study', sortOrder: 'title', onlyIncomplete: true });
  await persistence.waitForSave();
  assert.equal(storage.writes.length, 0);
  assert.equal(persistence.state.status, 'saved');
  persistence.dispose();
});

test('synchronous actions in both stores save a single plain coherent snapshot', async () => {
  const storage = memoryStorage(initialSnapshot());
  const persistence = createPersistence(storage);
  await persistence.initialize(pinia);
  const project = useProjectsStore().addProject('Лабораторні');
  useTasksStore().updateTask({ ...useTasksStore().tasks[0], projectId: project.id });
  useTasksStore().setTaskStatus({ id: 1, status: 'done' });
  await persistence.waitForSave();
  assert.equal(storage.writes.length, 1);
  assert.equal(storage.writes[0].tasks[0].projectId, project.id);
  assert.equal(storage.writes[0].tasks[0].status, 'done');
  assert.ok(!('selectedProject' in storage.writes[0]));
  assert.doesNotThrow(() => structuredClone(storage.writes[0]));
  persistence.dispose();
});

test('save queue serializes slow transactions and only reports saved after the latest commit', async () => {
  const storage = memoryStorage(initialSnapshot());
  const pending = []; const snapshots = [];
  storage.writeSnapshot = snapshot => { snapshots.push(clone(snapshot)); return new Promise(resolve => pending.push(resolve)); };
  const persistence = createPersistence(storage); await persistence.initialize(pinia);
  useTasksStore().setTaskStatus({ id: 1, status: 'done' });
  await Promise.resolve();
  assert.equal(pending.length, 1); assert.equal(persistence.state.status, 'saving');
  useTasksStore().deleteTask(2);
  await Promise.resolve(); assert.equal(pending.length, 1);
  pending[0]('2026-11-15T11:00:00Z');
  for (let i = 0; i < 10 && pending.length < 2; i++) await Promise.resolve();
  assert.equal(pending.length, 2); assert.equal(persistence.state.status, 'saving');
  assert.equal(snapshots[1].tasks.length, 9);
  pending[1]('2026-11-15T11:00:01Z');
  await persistence.waitForSave(); assert.equal(persistence.state.status, 'saved');
  assert.equal(persistence.state.lastSavedAt, '2026-11-15T11:00:01Z');
  persistence.dispose();
});

test('failed write keeps memory and existing data intact and retry saves the latest state', async () => {
  const storage = memoryStorage(initialSnapshot()); const write = storage.writeSnapshot;
  let fail = true;
  storage.writeSnapshot = async snapshot => { if (fail) throw new Error('QuotaExceededError'); return write(snapshot); };
  const persistence = createPersistence(storage); await persistence.initialize(pinia);
  useTasksStore().deleteTask(1); await persistence.waitForSave();
  assert.equal(useTasksStore().totalTasks, 9);
  assert.equal(storage.snapshot.tasks.length, 10);
  assert.equal(persistence.state.status, 'error'); assert.equal(persistence.state.canRetry, true);
  useTasksStore().searchText = 'фільтр'; await persistence.waitForSave();
  assert.equal(persistence.state.status, 'error');
  fail = false; await persistence.retrySave();
  assert.equal(storage.snapshot.tasks.length, 9);
  assert.equal(persistence.state.status, 'saved'); assert.equal(persistence.state.canRetry, false);
  persistence.dispose();
});

test('unavailable or malformed database starts in memory and never overwrites old data', async () => {
  for (const badRead of [async () => { throw new Error('blocked'); }, async () => ({ initialized: true, tasks: null, projects: [] })]) {
    let writes = 0;
    const persistence = createPersistence({ readSnapshot: badRead, writeSnapshot: async () => { writes++; } });
    await persistence.initialize(pinia);
    assert.equal(persistence.state.status, 'error'); assert.equal(persistence.state.canRetry, false);
    useTasksStore().deleteTask(3); await persistence.waitForSave();
    await persistence.retrySave(); assert.equal(writes, 0);
    persistence.dispose();
  }
});

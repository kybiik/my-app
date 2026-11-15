import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createPinia, setActivePinia, storeToRefs } from 'pinia';
import { useTasksStore } from '../src/store/tasks.js';
import { useProjectsStore } from '../src/store/projects.js';

beforeEach(() => setActivePinia(createPinia()));
const taskData = overrides => ({
  title: 'Перевірити Pinia', description: 'Тестування спільного стану',
  status: 'todo', priority: 'high', category: 'study',
  dueDate: '2099-12-31', projectId: 'general', ...overrides,
});

test('demo tasks and initial statistics survive migration', () => {
  const store = useTasksStore();
  assert.equal(store.totalTasks, 10);
  assert.equal(store.completedTasks, 3);
  assert.equal(store.progressTasks, 3);
  assert.equal(store.plannedTasks, 4);
  assert.equal(store.completionPercent, 30);
  assert.ok(store.tasks.every(task => task.projectId === 'general' && task.category === 'study'));
});

test('project names are trimmed, unique without case, and 3–40 characters long', () => {
  const store = useProjectsStore();
  assert.equal(store.projectCount, 3);
  const project = store.addProject(' Лабораторні ');
  assert.equal(project.title, 'Лабораторні');
  for (const invalid of ['', 'ab', 'a'.repeat(41), 'лабораторні', ' НАВЧАННЯ ']) {
    assert.equal(store.addProject(invalid), null);
  }
  assert.equal(store.projectCount, 4);
  assert.equal(store.projectTitle(project.id), 'Лабораторні');
  assert.equal(store.projectTitle('missing'), 'Загальні');
});

test('CRUD preserves task project and category and validates duplicate names', () => {
  const store = useTasksStore();
  const project = useProjectsStore().addProject('Лабораторні');
  const task = store.addTask(taskData({ projectId: project.id, category: 'work' }));
  assert.equal(store.totalTasks, 11);
  assert.equal(task.projectId, project.id);
  assert.equal(store.addTask(taskData({ title: ' перевірити PINIA ' })), null);
  assert.ok(store.updateTask({ ...task, title: 'Оновлене завдання', projectId: 'personal' }));
  assert.equal(task.projectId, 'personal');
  assert.equal(task.category, 'work');
  assert.ok(store.deleteTask(task.id));
  assert.equal(store.totalTasks, 10);
  assert.equal(store.deleteTask(task.id), false);
  assert.equal(store.updateTask({ id: -1 }), null);
});

test('invalid project ID falls back to general', () => {
  const task = useTasksStore().addTask(taskData({ projectId: 'missing' }));
  assert.equal(task.projectId, 'general');
});

test('existing date and category validation remains effective', () => {
  const store = useTasksStore();
  for (const data of [
    { title: 'ab' }, { title: 'x'.repeat(81) }, { description: 'x'.repeat(301) },
    { dueDate: '2099-02-30' }, { dueDate: '2000-01-01' }, { category: 'missing' },
    { status: 'missing' }, { priority: 'missing' },
  ]) assert.equal(store.addTask(taskData(data)), null);
  // Editing demonstration tasks must allow retaining their original past date.
  assert.ok(store.updateTask({ ...store.tasks[0], projectId: 'study' }));
});

test('combined project, status, priority, text and incomplete filters use AND', () => {
  const store = useTasksStore();
  const project = useProjectsStore().addProject('Лабораторні');
  const target = store.addTask(taskData({ projectId: project.id }));
  store.addTask(taskData({ title: 'Інше завдання', projectId: project.id, priority: 'low' }));
  store.selectedProject = project.id;
  store.selectedStatus = 'todo'; store.selectedPriority = 'high';
  store.searchText = ' СПІЛЬНОГО '; store.onlyIncomplete = true;
  assert.deepEqual(store.visibleTasks.map(task => task.id), [target.id]);
  store.selectedStatus = 'done';
  assert.equal(store.visibleTasks.length, 0);
  store.resetFilters();
  assert.equal(store.visibleTasks.length, 12);
  assert.equal(store.selectedProject, 'all');
  assert.equal(store.onlyIncomplete, false);
});

test('all six sorting modes keep source array order intact', () => {
  const store = useTasksStore();
  const sourceOrder = store.tasks.map(task => task.id);
  for (const mode of ['newest', 'title', 'priority', 'status', 'dueDate', 'dueDateDesc']) {
    store.sortOrder = mode;
    const result = store.visibleTasks;
    assert.equal(result.length, 10);
    if (mode === 'newest') assert.equal(result[0].id, 10);
    if (mode === 'priority') assert.equal(result[0].priority, 'high');
    if (mode === 'status') assert.equal(result[0].status, 'progress');
    if (mode === 'dueDate') assert.equal(result[0].id, 1);
    if (mode === 'dueDateDesc') assert.equal(result[0].id, 10);
    if (mode === 'title') assert.ok(result.every((task, i) => i === 0 || result[i - 1].title.localeCompare(task.title, 'uk-UA') <= 0));
    assert.deepEqual(store.tasks.map(task => task.id), sourceOrder);
  }
  assert.equal(store.activeTasks.length, 3);
  assert.ok(store.activeTasks.every(task => task.status !== 'done'));
  assert.deepEqual(store.tasks.map(task => task.id), sourceOrder);
});

test('storeToRefs and both project statistics react to actions', () => {
  const store = useTasksStore();
  const { totalTasks, completedTasks } = storeToRefs(store);
  const projects = useProjectsStore();
  const task = store.addTask(taskData({ projectId: 'study' }));
  assert.equal(totalTasks.value, 11);
  assert.equal(projects.projectStats.find(p => p.id === 'study').incompleteCount, 1);
  store.setTaskStatus({ id: task.id, status: 'done' });
  assert.equal(completedTasks.value, 4);
  assert.equal(projects.projectStats.find(p => p.id === 'study').completionPercent, 100);
  store.setTaskPriority({ id: task.id, priority: 'low' });
  assert.equal(task.priority, 'low');
  store.setTaskStatus({ id: task.id, status: 'invalid' });
  assert.equal(task.status, 'done');
});

test('empty state does not divide by zero and a fresh Pinia restores demo data', () => {
  const store = useTasksStore();
  for (const task of [...store.tasks]) store.deleteTask(task.id);
  assert.equal(store.completionPercent, 0);
  assert.equal(store.activeTasks.length, 0);
  assert.ok(useProjectsStore().projectStats.every(p => p.completionPercent === 0));
  useProjectsStore().addProject('Тимчасовий');
  setActivePinia(createPinia());
  assert.equal(useTasksStore().totalTasks, 10);
  assert.equal(useProjectsStore().projectCount, 3);
});

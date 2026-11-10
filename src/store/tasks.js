import { reactive } from 'vue';
import initialTasks from '../data/tasks.js';

const allowedStatuses = ['todo', 'progress', 'done'];
const allowedPriorities = ['low', 'medium', 'high'];
const allowedCategories = ['study', 'work', 'personal'];

export const taskState = reactive({
  tasks: initialTasks.map(task => ({
    ...task,
    category: task.category ?? 'study',
  })),
});

function formatLocalDate(date) {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function validDate(value) {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const date = new Date(`${value}T12:00:00`);

  return (
    !Number.isNaN(date.getTime()) &&
    formatLocalDate(date) === value
  );
}

function normalizeTitle(value) {
  return value.trim().toLocaleLowerCase('uk-UA');
}

/*
 * Спільна перевірка для сховища та форми.
 * originalTask = null означає створення.
 * Об’єкт originalTask означає редагування.
 */
export function getTaskErrors(data, originalTask = null) {
  const errors = {};

  if (!data || typeof data !== 'object') {
    return {
      title: 'Дані завдання не визначені.',
    };
  }

  const title =
    typeof data.title === 'string'
      ? data.title.trim()
      : '';

  const description =
    typeof data.description === 'string'
      ? data.description.trim()
      : '';

  if (!title) {
    errors.title = 'Вкажіть назву завдання.';
  } else if (title.length < 3) {
    errors.title = 'Назва має містити щонайменше 3 символи.';
  } else if (title.length > 80) {
    errors.title = 'Максимальна довжина — 80 символів.';
  }

  // Перевіряємо унікальність лише під час створення.
  if (!errors.title && originalTask === null) {
    const duplicateExists = taskState.tasks.some(task => {
      return normalizeTitle(task.title) === normalizeTitle(title);
    });

    if (duplicateExists) {
      errors.title = 'Завдання з такою назвою вже існує.';
    }
  }

  if (description.length > 300) {
    errors.description =
      'Опис не повинен перевищувати 300 символів.';
  }

  if (!allowedStatuses.includes(data.status)) {
    errors.status = 'Оберіть коректний статус.';
  }

  if (!allowedPriorities.includes(data.priority)) {
    errors.priority = 'Оберіть коректний пріоритет.';
  }

  if (!allowedCategories.includes(data.category)) {
    errors.category = 'Оберіть коректну категорію.';
  }

  if (!validDate(data.dueDate)) {
    errors.dueDate = 'Укажіть коректну дату завершення.';
  } else {
    const today = formatLocalDate(new Date());

    const keepsOriginalDate =
      originalTask !== null &&
      data.dueDate === originalTask.dueDate;

    if (data.dueDate < today && !keepsOriginalDate) {
      errors.dueDate =
        'Дата завершення не може бути в минулому.';
    }
  }

  return errors;
}

function normalizeTaskData(data, originalTask = null) {
  const errors = getTaskErrors(data, originalTask);

  if (Object.keys(errors).length > 0) {
    return null;
  }

  return {
    title: data.title.trim(),
    description:
      typeof data.description === 'string'
        ? data.description.trim()
        : '',
    status: data.status,
    priority: data.priority,
    category: data.category,
    dueDate: data.dueDate,
  };
}

export function addTask(data) {
  const normalized = normalizeTaskData(data);

  if (!normalized) {
    return null;
  }

  const nextId = taskState.tasks.reduce(
    (maxId, task) => Math.max(maxId, task.id),
    0
  ) + 1;

  const newTask = {
    id: nextId,
    ...normalized,
  };

  taskState.tasks.push(newTask);

  return newTask;
}

export function updateTask({ id, ...data }) {
  const task = taskState.tasks.find(
    item => item.id === id
  );

  if (!task) {
    return null;
  }

  const normalized = normalizeTaskData(data, task);

  if (!normalized) {
    return null;
  }

  Object.assign(task, normalized);

  return task;
}

export function setTaskStatus({ id, status }) {
  if (!allowedStatuses.includes(status)) {
    return;
  }

  const task = taskState.tasks.find(
    item => item.id === id
  );

  if (task) {
    task.status = status;
  }
}

export function setTaskPriority({ id, priority }) {
  if (!allowedPriorities.includes(priority)) {
    return;
  }

  const task = taskState.tasks.find(
    item => item.id === id
  );

  if (task) {
    task.priority = priority;
  }
}

export function deleteTask(id) {
  const index = taskState.tasks.findIndex(
    task => task.id === Number(id)
  );

  if (index === -1) {
    return false;
  }

  taskState.tasks.splice(index, 1);

  return true;
}
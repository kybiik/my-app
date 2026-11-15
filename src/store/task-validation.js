const allowedStatuses = ['todo', 'progress', 'done'];
const allowedPriorities = ['low', 'medium', 'high'];
const allowedCategories = ['study', 'work', 'personal'];

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
export function getTaskErrors(data, originalTask = null, existingTasks = []) {
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
    const duplicateExists = existingTasks.some(task => {
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


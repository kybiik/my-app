<script setup>
import { computed, nextTick, ref } from 'vue';

import AppTabbar from '../components/AppTabbar.vue';
import TaskCard from '../components/TaskCard.vue';
import TaskForm from '../components/TaskForm.vue';
import TaskListControls from '../components/TaskListControls.vue';

import {
  taskState,
  addTask,
  updateTask,
  deleteTask,
  setTaskStatus,
  setTaskPriority,
} from '../store/tasks.js';

import '../css/task-components.css';
import '../css/task-form.css';

const selectedStatus = ref('all');
const selectedPriority = ref('all');
const searchQuery = ref('');
const sortOrder = ref('newest');
const onlyIncomplete = ref(false);
const selectedTaskId = ref(null);

const formVisible = ref(false);
const editingId = ref(null);
const formAnchor = ref(null);
const feedback = ref('');
const feedbackIsError = ref(false);

const filteredTasks = computed(() => {
  const query = searchQuery.value
    .trim()
    .toLocaleLowerCase('uk-UA');

  const priorityOrder = {
    high: 0,
    medium: 1,
    low: 2,
  };

  const statusOrder = {
    progress: 0,
    todo: 1,
    done: 2,
  };

  // filter() створює окремий масив.
  const result = taskState.tasks.filter(task => {
    const matchesStatus =
      selectedStatus.value === 'all' ||
      task.status === selectedStatus.value;

    const matchesPriority =
      selectedPriority.value === 'all' ||
      task.priority === selectedPriority.value;

    const searchableText =
      `${task.title} ${task.description ?? ''}`
        .toLocaleLowerCase('uk-UA');

    const matchesSearch = searchableText.includes(query);

    const matchesIncomplete =
      !onlyIncomplete.value ||
      task.status !== 'done';

    return (
      matchesStatus &&
      matchesPriority &&
      matchesSearch &&
      matchesIncomplete
    );
  });

  // Сортується лише результат фільтрації.
  return result.sort((a, b) => {
    if (sortOrder.value === 'title') {
      return (
        a.title.localeCompare(b.title, 'uk-UA') ||
        b.id - a.id
      );
    }

    if (sortOrder.value === 'priority') {
      return (
        priorityOrder[a.priority] - priorityOrder[b.priority] ||
        b.id - a.id
      );
    }

    if (sortOrder.value === 'status') {
      return (
        statusOrder[a.status] - statusOrder[b.status] ||
        b.id - a.id
      );
    }

    if (
      sortOrder.value === 'dueDate' ||
      sortOrder.value === 'dueDateDesc'
    ) {
      // Порожні дати в обох режимах залишаються наприкінці.
      if (!a.dueDate && !b.dueDate) {
        return b.id - a.id;
      }

      if (!a.dueDate) {
        return 1;
      }

      if (!b.dueDate) {
        return -1;
      }

      const dateComparison = a.dueDate.localeCompare(b.dueDate);

      return (
        (
          sortOrder.value === 'dueDateDesc'
            ? -dateComparison
            : dateComparison
        ) ||
        b.id - a.id
      );
    }

    return b.id - a.id;
  });
});

const filteredCompletionPercent = computed(() => {
  if (filteredTasks.value.length === 0) {
    return 0;
  }

  const completed = filteredTasks.value.filter(
    task => task.status === 'done'
  ).length;

  return Math.round(
    (completed / filteredTasks.value.length) * 100
  );
});

const editingTask = computed(() => {
  return taskState.tasks.find(
    task => task.id === editingId.value
  ) ?? null;
});

const selectedTask = computed(() => {
  return taskState.tasks.find(
    task => task.id === selectedTaskId.value
  ) ?? null;
});

function handleStatusChange(payload) {
  setTaskStatus(payload);
}

function handlePriorityChange(payload) {
  setTaskPriority(payload);
}

function handleTaskSelect(id) {
  selectedTaskId.value = id;
}

function clearSelection() {
  selectedTaskId.value = null;
}

function resetFilters() {
  selectedStatus.value = 'all';
  selectedPriority.value = 'all';
  searchQuery.value = '';
  sortOrder.value = 'newest';
  onlyIncomplete.value = false;
}

async function scrollToForm() {
  await nextTick();

  formAnchor.value?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
}

async function createTask() {
  formVisible.value = false;
  await nextTick();

  editingId.value = null;
  feedback.value = '';
  feedbackIsError.value = false;
  formVisible.value = true;

  await scrollToForm();
}

async function editTask(id) {
  const taskExists = taskState.tasks.some(
    task => task.id === id
  );

  if (!taskExists) {
    feedback.value = 'Завдання для редагування не знайдено.';
    feedbackIsError.value = true;
    return;
  }

  formVisible.value = false;
  await nextTick();

  editingId.value = id;
  feedback.value = '';
  feedbackIsError.value = false;
  formVisible.value = true;

  await scrollToForm();
}

function cancelForm() {
  formVisible.value = false;
  editingId.value = null;
}

function saveTask(data) {
  const isEditing = editingId.value !== null;

  const saved = isEditing
    ? updateTask({
        ...data,
        id: editingId.value,
      })
    : addTask(data);

  if (!saved) {
    feedback.value =
      'Не вдалося зберегти завдання. Перевірте дані форми.';
    feedbackIsError.value = true;
    return;
  }

  feedback.value = isEditing
    ? `Завдання «${saved.title}» оновлено.`
    : `Завдання «${saved.title}» створено.`;

  feedbackIsError.value = false;

  cancelForm();
  resetFilters();
}

function handleDelete(id) {
  const task = taskState.tasks.find(
    item => item.id === id
  );

  if (!task) {
    feedback.value = 'Завдання для видалення не знайдено.';
    feedbackIsError.value = true;
    return;
  }

  const confirmed = window.confirm(
    `Видалити завдання «${task.title}»?`
  );

  if (!confirmed) {
    return;
  }

  const title = task.title;
  const deleted = deleteTask(id);

  if (!deleted) {
    feedback.value = 'Не вдалося видалити завдання.';
    feedbackIsError.value = true;
    return;
  }

  if (editingId.value === id) {
    cancelForm();
  }

  if (selectedTaskId.value === id) {
    clearSelection();
  }

  feedback.value = `Завдання «${title}» видалено.`;
  feedbackIsError.value = false;
}
</script>

<template>
  <f7-page name="tasks" class="tf3-page">
    <f7-navbar title="Мої завдання" />

    <div class="tf3-container">
      <section class="tf3-hero">
        <div class="tf3-eyebrow">
          TASKFLOW / TASK MANAGER
        </div>

        <h1>Мої завдання</h1>

        <p>
          Створюйте, знаходьте, сортуйте та видаляйте завдання.
        </p>

        <button
          type="button"
          class="tf4-new-task"
          @click="createTask"
        >
          + Додати завдання
        </button>
      </section>

      <p
        v-if="feedback"
        class="tf4-feedback"
        :class="{ 'tf4-feedback--error': feedbackIsError }"
        role="status"
      >
        {{ feedback }}
      </p>

      <section
        v-if="formVisible"
        ref="formAnchor"
        class="tf4-form-section"
      >
        <TaskForm
          :key="editingId ?? 'new'"
          :task="editingTask"
          @save="saveTask"
          @cancel="cancelForm"
        />
      </section>

      <TaskListControls
        v-model:search="searchQuery"
        v-model:status="selectedStatus"
        v-model:priority="selectedPriority"
        v-model:sort="sortOrder"
        v-model:only-incomplete="onlyIncomplete"
        @reset="resetFilters"
      />

      <section
        v-if="selectedTask"
        class="tf3-selection"
        aria-live="polite"
      >
        <div class="tf3-eyebrow">
          Вибране завдання
        </div>

        <h2>{{ selectedTask.title }}</h2>

        <p>
          {{ selectedTask.description || 'Без опису' }}
        </p>

        <button
          type="button"
          class="tf3-action"
          @click="clearSelection"
        >
          Скасувати вибір
        </button>
      </section>

      <section class="tf3-section">
        <div class="tf3-section-heading">
          <div>
            <div class="tf3-eyebrow">
              TASK LIST
            </div>

            <h2>Список завдань</h2>
          </div>

          <div
            class="tf5-results"
            role="status"
            aria-live="polite"
          >
            <span>
              Знайдено: {{ filteredTasks.length }}
              із {{ taskState.tasks.length }}
            </span>

            <span>
              Виконано серед знайдених:
              {{ filteredCompletionPercent }}%
            </span>
          </div>
        </div>

        <div
          v-if="taskState.tasks.length === 0"
          class="tf3-empty"
        >
          <h3>Список завдань порожній</h3>

          <p>
            Наразі немає жодного завдання.
            Натисніть «Додати завдання», щоб створити нове.
          </p>

          <button
            type="button"
            class="tf3-action tf3-action--primary"
            @click="createTask"
          >
            + Додати завдання
          </button>
        </div>

        <div
          v-else-if="filteredTasks.length"
          class="tf3-task-grid"
        >
          <TaskCard
            v-for="task in filteredTasks"
            :key="task.id"
            :task="task"
            :editable="true"
            @status-change="handleStatusChange"
            @priority-change="handlePriorityChange"
            @task-select="handleTaskSelect"
            @edit="editTask"
            @delete="handleDelete"
          />
        </div>

        <div v-else class="tf3-empty">
          <p>
            За обраними фільтрами та пошуком
            завдань не знайдено.
          </p>

          <button
            type="button"
            class="tf3-action"
            @click="resetFilters"
          >
            Показати всі завдання
          </button>
        </div>
      </section>
    </div>

    <AppTabbar active="tasks" />
  </f7-page>
</template>

<style scoped>
.tf5-results {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  color: #c9dbef;
  font-size: 14px;
}

.tf3-empty h3 {
  margin-top: 0;
}

.tf3-empty .tf3-action {
  margin-top: 12px;
}

@media (max-width: 680px) {
  .tf5-results {
    flex-direction: column;
  }
}
</style>
<script setup>
import { computed, nextTick, ref } from 'vue';

import AppTabbar from '../components/AppTabbar.vue';
import TaskCard from '../components/TaskCard.vue';
import TaskForm from '../components/TaskForm.vue';

import {
  taskState,
  addTask,
  updateTask,
  setTaskStatus,
  setTaskPriority,
} from '../store/tasks.js';

import '../css/task-components.css';
import '../css/task-form.css';

const selectedStatus = ref('all');
const selectedPriority = ref('all');
const searchQuery = ref('');
const selectedTaskId = ref(null);

const formVisible = ref(false);
const editingId = ref(null);
const formAnchor = ref(null);
const feedback = ref('');
const feedbackIsError = ref(false);

const statusOptions = [
  { value: 'all', label: 'Усі' },
  { value: 'todo', label: 'Заплановано' },
  { value: 'progress', label: 'У роботі' },
  { value: 'done', label: 'Виконано' },
];

const priorityOptions = [
  { value: 'all', label: 'Усі' },
  { value: 'low', label: 'Низький' },
  { value: 'medium', label: 'Середній' },
  { value: 'high', label: 'Високий' },
];

const filteredTasks = computed(() => {
  const priorityOrder = {
    high: 0,
    medium: 1,
    low: 2,
  };

  const query = searchQuery.value
    .trim()
    .toLocaleLowerCase('uk-UA');

  return taskState.tasks
    .filter(task => {
      const matchesStatus =
        selectedStatus.value === 'all' ||
        task.status === selectedStatus.value;

      const matchesPriority =
        selectedPriority.value === 'all' ||
        task.priority === selectedPriority.value;

      const matchesSearch = task.title
        .toLocaleLowerCase('uk-UA')
        .includes(query);

      return (
        matchesStatus &&
        matchesPriority &&
        matchesSearch
      );
    })
    .sort((a, b) => {
      return (
        priorityOrder[a.priority] - priorityOrder[b.priority] ||
        a.id - b.id
      );
    });
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
        id: editingId.value,
        ...data,
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
          Керуйте завданнями, статусами та пріоритетами.
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

      <section class="tf3-filters">
        <div class="tf4-field">
          <label for="tf4-search">
            Пошук за назвою
          </label>

          <input
            id="tf4-search"
            v-model="searchQuery"
            type="search"
            placeholder="Введіть частину назви…"
            aria-describedby="tf4-search-hint"
          />

          <small id="tf4-search-hint">
            Список оновлюється під час введення.
          </small>
        </div>

        <div class="tf3-filter-group">
          <div class="tf3-filter-title">
            Фільтр за статусом
          </div>

          <div class="tf3-filter-buttons">
            <button
              v-for="option in statusOptions"
              :key="option.value"
              type="button"
              class="tf3-filter-button"
              :class="{
                'is-active': selectedStatus === option.value,
              }"
              :aria-pressed="selectedStatus === option.value"
              @click="selectedStatus = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <div class="tf3-filter-group">
          <div class="tf3-filter-title">
            Фільтр за пріоритетом
          </div>

          <div class="tf3-filter-buttons">
            <button
              v-for="option in priorityOptions"
              :key="option.value"
              type="button"
              class="tf3-filter-button"
              :class="{
                'is-active': selectedPriority === option.value,
              }"
              :aria-pressed="selectedPriority === option.value"
              @click="selectedPriority = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <div>
          <button
            type="button"
            class="tf3-action"
            @click="resetFilters"
          >
            Скинути фільтри та пошук
          </button>
        </div>
      </section>

      <section
        v-if="selectedTask"
        class="tf3-selection"
        aria-live="polite"
      >
        <div class="tf3-eyebrow">
          Вибране завдання
        </div>

        <h2>{{ selectedTask.title }}</h2>
        <p>{{ selectedTask.description }}</p>

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

          <div class="tf3-counter" role="status">
            Знайдено: {{ filteredTasks.length }}
          </div>
        </div>

        <div
          v-if="filteredTasks.length"
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
          />
        </div>

        <div v-else class="tf3-empty">
          За обраними фільтрами та пошуком завдань не знайдено.
        </div>
      </section>
    </div>

    <AppTabbar active="tasks" />
  </f7-page>
</template>
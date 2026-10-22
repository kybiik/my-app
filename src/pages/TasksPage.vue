<script setup>
import { ref, computed } from 'vue';

import AppTabbar from '../components/AppTabbar.vue';
import TaskCard from '../components/TaskCard.vue';

import {
  taskState,
  setTaskStatus,
  setTaskPriority,
} from '../store/tasks.js';

import '../css/task-components.css';

const selectedStatus = ref('all');
const selectedPriority = ref('all');

const statusOptions = [
  { value: 'all', label: 'Усі' },
  { value: 'todo', label: 'Заплановано' },
  { value: 'progress', label: 'У роботі' },
  { value: 'done', label: 'Виконано' },
];

const selectedTaskId = ref(null);

const selectedTask = computed(() => {
  return taskState.tasks.find(
    task => task.id === selectedTaskId.value
  ) || null;
});

function handleTaskSelect(id) {
  selectedTaskId.value = id;
}

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

  return taskState.tasks
    .filter(task => {
      const matchesStatus =
        selectedStatus.value === 'all' ||
        task.status === selectedStatus.value;

      const matchesPriority =
        selectedPriority.value === 'all' ||
        task.priority === selectedPriority.value;

      return matchesStatus && matchesPriority;
    })
    .sort((a, b) => {
      return (
        priorityOrder[a.priority] - priorityOrder[b.priority] ||
        a.id - b.id
      );
    });
});

function handleStatusChange(payload) {
  setTaskStatus(payload);
}

function handlePriorityChange(payload) {
  setTaskPriority(payload);
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
      </section>

      <section class="tf3-filters">
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
      </section>

      <section class="tf3-section">
        <div class="tf3-section-heading">
          <div>
            <div class="tf3-eyebrow">
              TASK LIST
            </div>
            <h2>Список завдань</h2>
          </div>

          <div class="tf3-counter">
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
            @status-change="handleStatusChange"
            @priority-change="handlePriorityChange"
            @task-select="handleTaskSelect"
          />
        </div>

        <div v-else class="tf3-empty">
          За обраними фільтрами завдань не знайдено.
        </div>
      </section>
      <section
  v-if="selectedTask"
  class="tf3-selection"
  aria-live="polite"
>
  <div class="tf3-eyebrow">Вибране завдання</div>

  <h2>{{ selectedTask.title }}</h2>
  <p>{{ selectedTask.description }}</p>

  <button
    type="button"
    class="tf3-action"
    @click="selectedTaskId = null"
  >
    Скасувати вибір
  </button>
</section>
    </div>

    <AppTabbar active="tasks" />
  </f7-page>
</template>
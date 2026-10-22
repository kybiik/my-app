<script setup>
import { computed, ref } from 'vue';

import AppTabbar from '../components/AppTabbar.vue';
import TaskCard from '../components/TaskCard.vue';
import TaskCounter from '../components/TaskCounter.vue';

import {
  taskState,
  setTaskStatus,
  setTaskPriority,
} from '../store/tasks.js';

import '../css/task-components.css';

const selectedTaskId = ref(null);

const totalTasks = computed(() => {
  return taskState.tasks.length;
});

const completedTasks = computed(() => {
  return taskState.tasks.filter(
    task => task.status === 'done'
  ).length;
});

const progressTasks = computed(() => {
  return taskState.tasks.filter(
    task => task.status === 'progress'
  ).length;
});

const plannedTasks = computed(() => {
  return taskState.tasks.filter(
    task => task.status === 'todo'
  ).length;
});

const completionPercent = computed(() => {
  if (totalTasks.value === 0) return 0;

  return Math.round(
    (completedTasks.value / totalTasks.value) * 100
  );
});

const activeTasks = computed(() => {
  const priorityOrder = {
    high: 0,
    medium: 1,
    low: 2,
  };

  return taskState.tasks
    .filter(task => task.status !== 'done')
    .sort((a, b) => {
      return (
        priorityOrder[a.priority] - priorityOrder[b.priority] ||
        a.id - b.id
      );
    })
    .slice(0, 3);
});

const selectedTask = computed(() => {
  return taskState.tasks.find(
    task => task.id === selectedTaskId.value
  ) || null;
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
</script>

<template>
  <f7-page name="home" class="tf3-page">
    <f7-navbar title="TaskFlow">
      <f7-nav-right>
        <f7-link href="/about/">
          Про застосунок
        </f7-link>
      </f7-nav-right>
    </f7-navbar>

    <div class="tf3-container">
      <section class="tf3-hero">
        <div class="tf3-eyebrow">
          TASKFLOW / DASHBOARD
        </div>

        <h1>Панель керування</h1>

        <p>
          Контролюйте виконання завдань та їхні пріоритети.
        </p>
      </section>

      <section class="tf3-stat-grid">
        <div class="tf3-stat">
          <span class="tf3-stat-label">
            Усього завдань
          </span>

          <TaskCounter :count="totalTasks" />
        </div>

        <div class="tf3-stat">
          <span class="tf3-stat-label">
            У роботі
          </span>

          <TaskCounter :count="progressTasks" />
        </div>

        <div class="tf3-stat">
          <span class="tf3-stat-label">
            Виконано
          </span>

          <TaskCounter :count="completedTasks" />
        </div>

        <div class="tf3-stat">
          <span class="tf3-stat-label">
            Заплановано
          </span>

          <TaskCounter :count="plannedTasks" />
        </div>
      </section>

      <section class="tf3-completion">
        <div class="tf3-completion-heading">
          <span>Прогрес виконання</span>
          <strong>{{ completionPercent }}%</strong>
        </div>

        <div
          class="tf3-progress-track"
          role="progressbar"
          aria-label="Відсоток виконаних завдань"
          :aria-valuenow="completionPercent"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div
            class="tf3-progress-fill"
            :style="{ width: completionPercent + '%' }"
          ></div>
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
              PRIORITY TASKS
            </div>

            <h2>Актуальні завдання</h2>
          </div>

          <f7-button href="/tasks/" outline small>
            Переглянути всі
          </f7-button>
        </div>

        <div
          v-if="activeTasks.length"
          class="tf3-task-grid"
        >
          <TaskCard
            v-for="task in activeTasks"
            :key="task.id"
            :task="task"
            @status-change="handleStatusChange"
            @priority-change="handlePriorityChange"
            @task-select="handleTaskSelect"
          />
        </div>

        <div v-else class="tf3-empty">
          Наразі всі завдання виконані.
        </div>
      </section>
    </div>

    <AppTabbar active="home" />
  </f7-page>
</template>
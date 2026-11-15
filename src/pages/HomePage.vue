<script setup>
import { computed, ref } from 'vue';

import AppTabbar from '../components/AppTabbar.vue';
import TaskCard from '../components/TaskCard.vue';
import TaskCounter from '../components/TaskCounter.vue';

import { storeToRefs } from 'pinia';
import { useTasksStore } from '../store/tasks.js';
import { useProjectsStore } from '../store/projects.js';

const taskStore = useTasksStore();
const projectStore = useProjectsStore();
const { tasks, totalTasks, completedTasks, progressTasks, plannedTasks,
  completionPercent, activeTasks } = storeToRefs(taskStore);
const { projectStats } = storeToRefs(projectStore);

import '../css/task-components.css';
import '../css/task-list.css';

const selectedTaskId = ref(null);

const selectedTask = computed(() => {
  return tasks.value.find(
    task => task.id === selectedTaskId.value
  ) || null;
});

function handleStatusChange(payload) {
  taskStore.setTaskStatus(payload);
}

function handlePriorityChange(payload) {
  taskStore.setTaskPriority(payload);
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

      <section class="tf6-project-panel" aria-label="Статистика проєктів">
        <h2>Проєкти</h2>
        <div class="tf6-project-list">
          <span v-for="project in projectStats" :key="project.id" class="tf6-project-pill">
            {{ project.title }} <strong>{{ project.incompleteCount }} невиконаних</strong>
            <small>Виконано {{ project.completionPercent }}%</small>
          </span>
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
            :project-title="projectStore.projectTitle(task.projectId)"
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

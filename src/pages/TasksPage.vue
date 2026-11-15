<script setup>
import { computed, nextTick, ref } from 'vue';

import AppTabbar from '../components/AppTabbar.vue';
import TaskCard from '../components/TaskCard.vue';
import TaskForm from '../components/TaskForm.vue';
import TaskListControls from '../components/TaskListControls.vue';

import { storeToRefs } from 'pinia';
import { useTasksStore } from '../store/tasks.js';
import { useProjectsStore } from '../store/projects.js';

const taskStore = useTasksStore();
const projectStore = useProjectsStore();
const { tasks, visibleTasks: filteredTasks, searchText: searchQuery, selectedStatus,
  selectedPriority, selectedProject, sortOrder, onlyIncomplete } = storeToRefs(taskStore);
const { projects, projectStats } = storeToRefs(projectStore);
const newProjectTitle = ref('');
const newProjectError = ref('');

function createProject() {
  const project = projectStore.addProject(newProjectTitle.value);
  if (!project) {
    newProjectError.value = 'Назва має містити 3–40 символів і не повторювати наявні проєкти.';
    return;
  }
  newProjectTitle.value = '';
  newProjectError.value = '';
  selectedProject.value = project.id;
}

import '../css/task-components.css';
import '../css/task-form.css';
import '../css/task-list.css';

const selectedTaskId = ref(null);

const formVisible = ref(false);
const editingId = ref(null);
const formAnchor = ref(null);
const feedback = ref('');
const feedbackIsError = ref(false);

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
  return tasks.value.find(
    task => task.id === editingId.value
  ) ?? null;
});

const selectedTask = computed(() => {
  return tasks.value.find(
    task => task.id === selectedTaskId.value
  ) ?? null;
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

function resetFilters() { taskStore.resetFilters(); }

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
  const taskExists = tasks.value.some(
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
    ? taskStore.updateTask({
        ...data,
        id: editingId.value,
      })
    : taskStore.addTask(data);

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
  const task = tasks.value.find(
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
  const deleted = taskStore.deleteTask(id);

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

      <section class="tf6-project-panel" aria-label="Мої проєкти">
        <h2>Мої проєкти</h2>
        <div class="tf6-project-list">
          <span v-for="project in projectStats" :key="project.id" class="tf6-project-pill">
            {{ project.title }} <strong>{{ project.taskCount }}</strong>
            <small>Виконано {{ project.completionPercent }}%</small>
          </span>
        </div>
        <form class="tf6-project-form" @submit.prevent="createProject">
          <label>Назва нового проєкту
            <input v-model="newProjectTitle" maxlength="40" placeholder="Наприклад: Лабораторні" @input="newProjectError = ''" />
          </label>
          <button type="submit" class="tf3-action tf3-action--primary">Створити проєкт</button>
        </form>
        <p v-if="newProjectError" class="tf6-error" role="alert">{{ newProjectError }}</p>
      </section>

      <section
        v-if="formVisible"
        ref="formAnchor"
        class="tf4-form-section"
      >
        <TaskForm
          :key="editingId ?? 'new'"
          :task="editingTask"
          :projects="projects"
          :existing-tasks="tasks"
          @save="saveTask"
          @cancel="cancelForm"
        />
      </section>

      <TaskListControls
        v-model:search="searchQuery"
        v-model:status="selectedStatus"
        v-model:priority="selectedPriority"
        v-model:project="selectedProject"
        :projects="projects"
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
              із {{ tasks.length }}
            </span>

            <span>
              Виконано серед знайдених:
              {{ filteredCompletionPercent }}%
            </span>
          </div>
        </div>

        <div
          v-if="tasks.length === 0"
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
            :project-title="projectStore.projectTitle(task.projectId)"
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
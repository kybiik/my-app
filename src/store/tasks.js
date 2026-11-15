import { defineStore } from 'pinia';
import initialTasks from '../data/tasks.js';
import { useProjectsStore } from './projects.js';
import { getTaskErrors } from './task-validation.js';

const allowedStatuses = ['todo', 'progress', 'done'];
const allowedPriorities = ['low', 'medium', 'high'];

function normalizeTaskData(data, originalTask = null, existingTasks = []) {
  const errors = getTaskErrors(data, originalTask, existingTasks);

  if (Object.keys(errors).length > 0) {
    return null;
  }

  return {
    projectId: useProjectsStore().projects.some(project => project.id === data.projectId)
      ? data.projectId : 'general',
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

export const useTasksStore = defineStore('tasks', {
  state: () => ({
    tasks: initialTasks.map(task => ({ ...task, category: task.category ?? 'study', projectId: task.projectId ?? 'general' })),
    searchText: '', selectedStatus: 'all', selectedPriority: 'all',
    selectedProject: 'all', sortOrder: 'newest', onlyIncomplete: false,
  }),
  getters: {
    totalTasks: state => state.tasks.length,
    completedTasks: state => state.tasks.filter(task => task.status === 'done').length,
    progressTasks: state => state.tasks.filter(task => task.status === 'progress').length,
    plannedTasks: state => state.tasks.filter(task => task.status === 'todo').length,
    completionPercent() { return this.totalTasks ? Math.round(this.completedTasks / this.totalTasks * 100) : 0; },
    activeTasks: state => {
      const rank = { high: 3, medium: 2, low: 1 };
      return state.tasks.filter(task => task.status !== 'done')
        .sort((a, b) => rank[b.priority] - rank[a.priority] || b.id - a.id).slice(0, 3);
    },
    visibleTasks: state => {
      const query = state.searchText
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
      const result = state.tasks.filter(task => {
        const matchesStatus =
          state.selectedStatus === 'all' ||
          task.status === state.selectedStatus;

        const matchesPriority =
          state.selectedPriority === 'all' ||
          task.priority === state.selectedPriority;

        const searchableText =
          `${task.title} ${task.description ?? ''}`
            .toLocaleLowerCase('uk-UA');

        const matchesSearch = searchableText.includes(query);

        const matchesIncomplete =
          !state.onlyIncomplete ||
          task.status !== 'done';

        return (
          (state.selectedProject === 'all' || task.projectId === state.selectedProject) &&
          matchesStatus &&
          matchesPriority &&
          matchesSearch &&
          matchesIncomplete
        );
      });

      // Сортується лише результат фільтрації.
      return result.sort((a, b) => {
        if (state.sortOrder === 'title') {
          return (
            a.title.localeCompare(b.title, 'uk-UA') ||
            b.id - a.id
          );
        }

        if (state.sortOrder === 'priority') {
          return (
            priorityOrder[a.priority] - priorityOrder[b.priority] ||
            b.id - a.id
          );
        }

        if (state.sortOrder === 'status') {
          return (
            statusOrder[a.status] - statusOrder[b.status] ||
            b.id - a.id
          );
        }

        if (
          state.sortOrder === 'dueDate' ||
          state.sortOrder === 'dueDateDesc'
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
              state.sortOrder === 'dueDateDesc'
                ? -dateComparison
                : dateComparison
            ) ||
            b.id - a.id
          );
        }

        return b.id - a.id;
      });
    },
  },
  actions: {
    addTask(data) {
      const normalized = normalizeTaskData(data, null, this.tasks);

      if (!normalized) {
        return null;
      }

      const nextId = this.tasks.reduce(
        (maxId, task) => Math.max(maxId, task.id),
        0
      ) + 1;

      const newTask = {
        id: nextId,
        ...normalized,
      };

      this.tasks.push(newTask);

      return newTask;
    },

    updateTask({ id, ...data }) {
      const task = this.tasks.find(
        item => item.id === id
      );

      if (!task) {
        return null;
      }

      const normalized = normalizeTaskData(data, task, this.tasks);

      if (!normalized) {
        return null;
      }

      Object.assign(task, normalized);

      return task;
    },

    setTaskStatus({ id, status }) {
      if (!allowedStatuses.includes(status)) {
        return;
      }

      const task = this.tasks.find(
        item => item.id === id
      );

      if (task) {
        task.status = status;
      }
    },

    setTaskPriority({ id, priority }) {
      if (!allowedPriorities.includes(priority)) {
        return;
      }

      const task = this.tasks.find(
        item => item.id === id
      );

      if (task) {
        task.priority = priority;
      }
    },

    deleteTask(id) {
      const index = this.tasks.findIndex(
        task => task.id === Number(id)
      );

      if (index === -1) {
        return false;
      }

      this.tasks.splice(index, 1);

      return true;
    },
    resetFilters() {
      this.searchText = ''; this.selectedStatus = 'all'; this.selectedPriority = 'all';
      this.selectedProject = 'all'; this.sortOrder = 'newest'; this.onlyIncomplete = false;
    },
  },
});

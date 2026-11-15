import { defineStore } from 'pinia';
import { useTasksStore } from './tasks.js';

export const useProjectsStore = defineStore('projects', {
  state: () => ({
    projects: [
      { id: 'general', title: 'Загальні' },
      { id: 'study', title: 'Навчання' },
      { id: 'personal', title: 'Особисті' },
    ],
    nextProjectId: 1,
  }),
  getters: {
    projectCount: state => state.projects.length,
    projectTitle: state => id => state.projects.find(project => project.id === id)?.title ?? 'Загальні',
    projectStats(state) {
      // Access the task store lazily, after both stores have been initialized.
      const tasks = useTasksStore().tasks;
      return state.projects.map(project => {
        const records = tasks.filter(task => task.projectId === project.id);
        const completed = records.filter(task => task.status === 'done').length;
        return { ...project, taskCount: records.length, incompleteCount: records.length - completed,
          completionPercent: records.length ? Math.round(completed / records.length * 100) : 0 };
      });
    },
  },
  actions: {
    addProject(rawTitle) {
      const title = String(rawTitle ?? '').trim();
      if (title.length < 3 || title.length > 40 || this.projects.some(project =>
        project.title.toLocaleLowerCase('uk-UA') === title.toLocaleLowerCase('uk-UA'))) return null;
      const project = { id: `project-${this.nextProjectId++}`, title };
      this.projects.push(project);
      return project;
    },
  },
});

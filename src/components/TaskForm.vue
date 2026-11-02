<script setup>
import { computed, reactive, ref } from 'vue';

import { getTaskErrors } from '../store/tasks.js';

const props = defineProps({
  task: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['save', 'cancel']);

function createDefaultForm() {
  return {
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    category: 'study',
    dueDate: '',
  };
}

const form = reactive({
  title: props.task?.title ?? '',
  description: props.task?.description ?? '',
  status: props.task?.status ?? 'todo',
  priority: props.task?.priority ?? 'medium',
  category: props.task?.category ?? 'study',
  dueDate: props.task?.dueDate ?? '',
});

const showErrors = ref(false);

const isEditing = computed(() => {
  return props.task !== null;
});

const titleRemaining = computed(() => {
  return Math.max(0, 80 - form.title.length);
});

const descriptionRemaining = computed(() => {
  return Math.max(0, 300 - form.description.length);
});

const errors = computed(() => {
  return getTaskErrors(form, props.task);
});

const statusLabels = {
  todo: 'Заплановано',
  progress: 'У роботі',
  done: 'Виконано',
};

const priorityLabels = {
  low: 'Низький',
  medium: 'Середній',
  high: 'Високий',
};

const categoryLabels = {
  study: 'Навчання',
  work: 'Робота',
  personal: 'Особисте',
};

function clearForm() {
  if (isEditing.value) {
    return;
  }

  Object.assign(form, createDefaultForm());
  showErrors.value = false;
}

function submitForm() {
  showErrors.value = true;

  if (Object.keys(errors.value).length > 0) {
    return;
  }

  emit('save', {
    title: form.title.trim(),
    description: form.description.trim(),
    status: form.status,
    priority: form.priority,
    category: form.category,
    dueDate: form.dueDate,
  });
}
</script>

<template>
  <div class="tf4-form-panel">
    <div class="tf4-form-heading">
      <div>
        <div class="tf3-eyebrow">
          TASKFLOW / FORM
        </div>

        <h2>
          {{ isEditing ? 'Редагування завдання' : 'Нове завдання' }}
        </h2>
      </div>

      <button
        type="button"
        class="tf4-close"
        @click="emit('cancel')"
      >
        Закрити
      </button>
    </div>

    <p class="tf4-required-note">
      Поля із зірочкою (*) обов’язкові.
    </p>

    <form
      class="tf4-form"
      novalidate
      @submit.prevent="submitForm"
    >
      <div class="tf4-field tf4-field--wide">
        <label for="tf4-title">
          Назва завдання
          <span class="tf4-required" aria-hidden="true">*</span>
        </label>

        <input
          id="tf4-title"
          v-model.trim="form.title"
          type="text"
          placeholder="Наприклад: Підготувати звіт"
          maxlength="80"
          required
          :aria-invalid="showErrors && !!errors.title"
          :aria-describedby="
            showErrors && errors.title
              ? 'tf4-title-hint tf4-title-error'
              : 'tf4-title-hint'
          "
        />

        <small id="tf4-title-hint">
          Від 3 до 80 символів.
          Залишилося: {{ titleRemaining }}.
        </small>

        <p
          v-if="showErrors && errors.title"
          id="tf4-title-error"
          class="tf4-error"
          role="alert"
        >
          {{ errors.title }}
        </p>
      </div>

      <div class="tf4-field tf4-field--wide">
        <label for="tf4-description">
          Опис
        </label>

        <textarea
          id="tf4-description"
          v-model.trim="form.description"
          placeholder="Що потрібно зробити?"
          rows="3"
          maxlength="300"
          :aria-invalid="showErrors && !!errors.description"
          :aria-describedby="
            showErrors && errors.description
              ? 'tf4-description-hint tf4-description-error'
              : 'tf4-description-hint'
          "
        ></textarea>

        <small id="tf4-description-hint">
          Необов’язкове поле.
          Залишилося: {{ descriptionRemaining }} символів.
        </small>

        <p
          v-if="showErrors && errors.description"
          id="tf4-description-error"
          class="tf4-error"
          role="alert"
        >
          {{ errors.description }}
        </p>
      </div>

      <div class="tf4-field">
        <label for="tf4-status">
          Статус
          <span class="tf4-required" aria-hidden="true">*</span>
        </label>

        <select
          id="tf4-status"
          v-model="form.status"
          required
          :aria-invalid="showErrors && !!errors.status"
          :aria-describedby="
            showErrors && errors.status
              ? 'tf4-status-error'
              : undefined
          "
        >
          <option value="todo">Заплановано</option>
          <option value="progress">У роботі</option>
          <option value="done">Виконано</option>
        </select>

        <p
          v-if="showErrors && errors.status"
          id="tf4-status-error"
          class="tf4-error"
          role="alert"
        >
          {{ errors.status }}
        </p>
      </div>

      <div class="tf4-field">
        <label for="tf4-priority">
          Пріоритет
          <span class="tf4-required" aria-hidden="true">*</span>
        </label>

        <select
          id="tf4-priority"
          v-model="form.priority"
          required
          :aria-invalid="showErrors && !!errors.priority"
          :aria-describedby="
            showErrors && errors.priority
              ? 'tf4-priority-error'
              : undefined
          "
        >
          <option value="low">Низький</option>
          <option value="medium">Середній</option>
          <option value="high">Високий</option>
        </select>

        <p
          v-if="showErrors && errors.priority"
          id="tf4-priority-error"
          class="tf4-error"
          role="alert"
        >
          {{ errors.priority }}
        </p>
      </div>

      <div class="tf4-field tf4-field--wide">
        <label for="tf4-category">
          Категорія
          <span class="tf4-required" aria-hidden="true">*</span>
        </label>

        <select
          id="tf4-category"
          v-model="form.category"
          required
          :aria-invalid="showErrors && !!errors.category"
          :aria-describedby="
            showErrors && errors.category
              ? 'tf4-category-error'
              : undefined
          "
        >
          <option value="study">Навчання</option>
          <option value="work">Робота</option>
          <option value="personal">Особисте</option>
        </select>

        <p
          v-if="showErrors && errors.category"
          id="tf4-category-error"
          class="tf4-error"
          role="alert"
        >
          {{ errors.category }}
        </p>
      </div>

      <div class="tf4-field tf4-field--wide">
        <label for="tf4-date">
          Дата завершення
          <span class="tf4-required" aria-hidden="true">*</span>
        </label>

        <input
          id="tf4-date"
          v-model="form.dueDate"
          type="date"
          required
          :aria-invalid="showErrors && !!errors.dueDate"
          :aria-describedby="
            showErrors && errors.dueDate
              ? 'tf4-date-hint tf4-date-error'
              : 'tf4-date-hint'
          "
        />

        <small id="tf4-date-hint">
          {{
            isEditing
              ? 'Можна залишити початкову дату. Нова дата — сьогодні або пізніше.'
              : 'Оберіть сьогоднішню або майбутню дату.'
          }}
        </small>

        <p
          v-if="showErrors && errors.dueDate"
          id="tf4-date-error"
          class="tf4-error"
          role="alert"
        >
          {{ errors.dueDate }}
        </p>
      </div>

      <div
        class="tf4-preview tf4-field--wide"
        aria-live="polite"
      >
        <strong>Попередній перегляд</strong>

        <p>
          {{ form.title || 'Назва нового завдання' }}
        </p>

        <span>
          {{ statusLabels[form.status] }}
          ·
          {{ priorityLabels[form.priority] }}
          ·
          {{ categoryLabels[form.category] }}
        </span>
      </div>

      <div class="tf4-actions tf4-field--wide">
        <button type="submit" class="tf4-save">
          {{ isEditing ? 'Зберегти зміни' : 'Створити завдання' }}
        </button>

        <button
          v-if="!isEditing"
          type="button"
          class="tf4-cancel"
          @click="clearForm"
        >
          Очистити форму
        </button>

        <button
          type="button"
          class="tf4-cancel"
          @click="emit('cancel')"
        >
          Скасувати
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.tf4-required-note {
  margin: 0 0 18px;
  color: #b5c9df;
  font-size: 12px;
}

.tf4-required {
  margin-left: 3px;
  color: #ff9fad;
}
</style>
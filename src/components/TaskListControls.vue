<script setup>
defineProps({
  search: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    default: 'all',
  },
  priority: {
    type: String,
    default: 'all',
  },
  sort: {
    type: String,
    default: 'newest',
  },
  onlyIncomplete: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  'update:search',
  'update:status',
  'update:priority',
  'update:sort',
  'update:onlyIncomplete',
  'reset',
]);
</script>

<template>
  <section
    class="tf5-controls"
    aria-label="Пошук, фільтрація та сортування завдань"
  >
    <h2>Пошук і впорядкування</h2>

    <div class="tf5-controls-grid">
      <label class="tf5-search">
        <span>Пошук за назвою та описом</span>

        <input
          type="search"
          :value="search"
          placeholder="Введіть слово або частину тексту…"
          @input="emit('update:search', $event.target.value)"
        />

        <small>Пошук працює незалежно від регістру літер.</small>
      </label>

      <label>
        <span>Статус</span>

        <select
          :value="status"
          @change="emit('update:status', $event.target.value)"
        >
          <option value="all">Усі статуси</option>
          <option value="todo">Заплановано</option>
          <option value="progress">У роботі</option>
          <option value="done">Виконано</option>
        </select>
      </label>

      <label>
        <span>Пріоритет</span>

        <select
          :value="priority"
          @change="emit('update:priority', $event.target.value)"
        >
          <option value="all">Усі пріоритети</option>
          <option value="high">Високий</option>
          <option value="medium">Середній</option>
          <option value="low">Низький</option>
        </select>
      </label>

      <label class="tf5-sort">
        <span>Сортування</span>

        <select
          :value="sort"
          @change="emit('update:sort', $event.target.value)"
        >
          <option value="newest">Спочатку нові</option>
          <option value="title">За назвою (А–Я)</option>
          <option value="priority">За пріоритетом — високий перший</option>
          <option value="status">За статусом — у роботі першими</option>
          <option value="dueDate">За терміном — найближчі першими</option>
          <option value="dueDateDesc">За терміном — найдальші першими</option>
        </select>
      </label>
    </div>

    <div class="tf5-controls-actions">
      <button
        type="button"
        class="tf5-control-button"
        :class="{ 'is-active': onlyIncomplete }"
        :aria-pressed="onlyIncomplete"
        @click="emit('update:onlyIncomplete', !onlyIncomplete)"
      >
        Тільки невиконані
      </button>

      <button
        v-if="search.length > 0"
        type="button"
        class="tf5-control-button"
        @click="emit('update:search', '')"
      >
        Очистити пошук
      </button>

      <button
        type="button"
        class="tf5-control-button"
        @click="emit('reset')"
      >
        Скинути фільтри
      </button>
    </div>
  </section>
</template>

<style scoped>
.tf5-controls {
  margin: 22px 0;
  padding: 20px;
  border: 1px solid #28435f;
  border-radius: 16px;
  background: #13243a;
  color: #edf4ff;
}

.tf5-controls h2 {
  margin: 0 0 18px;
  color: #ffffff;
  font-size: 20px;
}

.tf5-controls-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.tf5-controls-grid label {
  display: grid;
  align-content: start;
  gap: 8px;
  min-width: 0;
  color: #d7e4f5;
  font-size: 14px;
  font-weight: 600;
}

.tf5-search,
.tf5-sort {
  grid-column: 1 / -1;
}

.tf5-controls-grid input,
.tf5-controls-grid select {
  box-sizing: border-box;
  display: block;
  width: 100%;
  min-width: 0;
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid #39526f;
  border-radius: 9px;
  background: #0c1728;
  color: #f0f7ff;
  font: inherit;
  color-scheme: dark;
}

.tf5-controls-grid input:focus-visible,
.tf5-controls-grid select:focus-visible,
.tf5-control-button:focus-visible {
  outline: 2px solid #62cfff;
  outline-offset: 3px;
}

.tf5-controls-grid small {
  color: #a9bdd6;
  font-size: 12px;
  font-weight: 400;
}

.tf5-controls-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.tf5-control-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 10px 14px;
  border: 1px solid #526c8c;
  border-radius: 9px;
  background: #203550;
  color: #eff7ff;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.tf5-control-button:hover {
  filter: brightness(1.12);
}

.tf5-control-button.is-active {
  border-color: #39afe0;
  background: #087da7;
  color: #ffffff;
}

@media (max-width: 680px) {
  .tf5-controls {
    padding: 16px;
  }

  .tf5-controls-grid {
    grid-template-columns: 1fr;
  }

  .tf5-search,
  .tf5-sort {
    grid-column: auto;
  }

  .tf5-control-button {
    width: 100%;
  }
}
</style>
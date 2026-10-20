<template>
  <f7-page name="help">
    <f7-navbar title="Допомога" back-link="Назад" />

    <div class="app-content">
      <div class="page-heading">
        <h1>Як користуватися TaskFlow</h1>
        <p>Основні правила роботи</p>
      </div>

      <div class="info-card">
        <h3>Головна</h3>
        <p>
          Переглядайте загальну кількість завдань,
          кількість виконаних та останні завдання.
        </p>
      </div>

      <div class="info-card">
        <h3>Завдання</h3>
        <p>
          Переглядайте повний список, описи та стани.
          Зелена галочка позначає виконане завдання.
        </p>
      </div>

      <div class="info-card">
        <h3>Навігація</h3>
        <p>
          Використовуйте нижню панель для переходів
          між головною сторінкою, завданнями
          та інформацією про застосунок.
        </p>
      </div>

      <div class="info-card">
        <h3>Навчальна версія</h3>
        <p>
          Завдання демонстраційні. Їх створення,
          редагування та видалення поки не реалізовані.
        </p>
      </div>
    </div>

    <AppTabbar active="about" />
  </f7-page>
</template>

<script setup>
import AppTabbar from '../components/AppTabbar.vue';
</script>
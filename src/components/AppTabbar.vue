<template>
  <f7-toolbar bottom tabbar icons class="app-tabbar">
    <f7-link
      href="/"
      :class="{ 'app-link-active': active === 'home' }"
    >
      <span class="tf-tab-content">
        <f7-icon f7="house_fill" />
        <span class="tf-tab-text">Головна</span>
      </span>
    </f7-link>

    <f7-link
      href="/tasks/"
      :class="{ 'app-link-active': active === 'tasks' }"
    >
      <span class="tf-tab-content">
        <f7-icon f7="square_list_fill" />
        <span class="tf-tab-text">Завдання</span>
      </span>
    </f7-link>

    <f7-link
      href="/about/"
      :class="{ 'app-link-active': active === 'about' }"
    >
      <span class="tf-tab-content">
        <f7-icon f7="info_circle_fill" />
        <span class="tf-tab-text">Про застосунок</span>
      </span>
    </f7-link>
  </f7-toolbar>
</template>

<script setup>
defineProps({
  active: {
    type: String,
    required: true,
  },
});
</script>
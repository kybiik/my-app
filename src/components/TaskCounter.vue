<script setup>
defineProps({
  count: {
    type: Number,
    required: true,
  },
});
</script>

<template>
  <strong class="tf3-task-counter">{{ count }}</strong>
</template>
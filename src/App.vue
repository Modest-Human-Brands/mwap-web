<script setup lang="ts">
import AppTopBar from '@/components/layout/AppTopBar.vue'
</script>

<template>
  <div class="min-h-screen">
    <AppTopBar v-if="!$route.meta.bare" />
    <RouterView />
  </div>
</template>
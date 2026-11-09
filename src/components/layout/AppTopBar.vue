<script setup lang="ts">
import UiButton from '@/components/ui/UiButton.vue'
</script>

<template>
  <header class="flex items-center justify-between gap-3 px-8 py-4">
    <RouterLink to="/" class="flex items-center gap-2">
      <span
        class="flex size-6 items-center justify-center rounded-sm bg-white text-xs font-semibold text-midnight"
        >M</span
      >
      <span class="text-sm font-medium">MWap</span>
    </RouterLink>

    <nav class="flex items-center gap-6">
      <RouterLink
        :to="$route.name === 'analytics' ? '/' : '/analytics'"
        class="text-sm text-text-2 transition-colors hover:text-white"
      >
        {{ $route.name === 'analytics' ? 'Sites' : 'Analytics' }}
      </RouterLink>
      <RouterLink to="/brand" class="text-sm text-text-2 transition-colors hover:text-white">
        Brand
      </RouterLink>
      <UiButton to="/new">New site</UiButton>
    </nav>
  </header>
</template>
<script setup lang="ts">
import IconLink from '~icons/lucide/link'

defineProps<{ address: string; meta: string }>()
</script>

<template>
  <div class="flex items-center gap-4 rounded-lg border border-divider p-4">
    <span class="flex size-10 items-center justify-center rounded-md bg-divider">
      <IconLink class="size-5" />
    </span>
    <div class="min-w-0">
      <p class="truncate text-sm font-medium">{{ address }}</p>
      <p class="text-xs text-text-2">{{ meta }}</p>
    </div>
  </div>
</template>
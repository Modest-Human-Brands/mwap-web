<script setup lang="ts">
import { RANGES, type Range } from '@/mock/analytics'

const range = defineModel<Range>({ required: true })
</script>

<template>
  <div class="flex rounded-md border border-divider p-0.5" role="group" aria-label="Date range">
    <button
      v-for="r in RANGES"
      :key="r"
      type="button"
      class="cursor-pointer rounded-sm px-3 py-1 text-sm transition-colors"
      :class="range === r ? 'bg-divider font-medium text-white' : 'text-text-2 hover:text-white'"
      :aria-pressed="range === r"
      @click="range = r"
    >
      {{ r }} days
    </button>
  </div>
</template>
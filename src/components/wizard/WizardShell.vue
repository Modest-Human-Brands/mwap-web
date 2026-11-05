<script setup lang="ts">
import { useRoute } from 'vue-router'

import { STEPS } from '@/stores/wizard'

withDefaults(defineProps<{ title?: string; subtitle?: string; showStepper?: boolean }>(), {
  showStepper: true,
})
defineSlots<{ default(): unknown; footer(): unknown; preview(): unknown }>()

const route = useRoute()
const current = () => STEPS.findIndex((s) => s.path === route.path)
</script>

<template>
  <div class="grid min-h-screen grid-cols-[minmax(0,620px)_1fr] gap-x-12 px-11 py-9">
    <div class="flex h-[calc(100vh-72px)] flex-col">
      <header class="flex items-center justify-between">
        <RouterLink to="/" class="flex items-center gap-2">
          <span
            class="flex size-6 items-center justify-center rounded-sm bg-white text-xs font-semibold text-midnight"
            >M</span
          >
          <span class="text-sm font-medium">MWap</span>
        </RouterLink>
        <RouterLink to="/" class="text-sm text-text-2 transition-colors hover:text-white">
          {{ showStepper ? 'Cancel' : 'Close' }}
        </RouterLink>
      </header>

      <ol v-if="showStepper" class="mt-8 flex gap-3" aria-label="Steps">
        <li v-for="(step, i) in STEPS" :key="step.path" class="flex-1">
          <div class="h-1 rounded-full" :class="i <= current() ? 'bg-electric' : 'bg-divider'" />
          <span
            class="mt-2 block text-xs"
            :class="i === current() ? 'font-medium text-white' : 'text-text-2'"
            :aria-current="i === current() ? 'step' : undefined"
          >
            {{ i < current() ? '✓ ' : i === current() ? `${i + 1} ` : '' }}{{ step.label }}
          </span>
        </li>
      </ol>

      <div class="mt-9 min-h-0 flex-1 overflow-y-auto pr-1">
        <h1 v-if="title" class="text-xl font-medium">{{ title }}</h1>
        <p v-if="subtitle" class="mt-1 text-sm text-text-2">{{ subtitle }}</p>
        <div class="mt-5"><slot /></div>
      </div>

      <footer class="mt-4 flex items-center justify-between gap-3 border-t border-divider pt-5">
        <slot name="footer" />
      </footer>
    </div>

    <aside class="pt-1"><slot name="preview" /></aside>
  </div>
</template>
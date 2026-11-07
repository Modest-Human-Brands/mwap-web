<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import UiButton from '@/components/ui/UiButton.vue'
import UiDialog from '@/components/ui/UiDialog.vue'
import { STEPS, useWizardStore } from '@/stores/wizard'

const props = withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    showStepper?: boolean
    /** Unsaved changes: leaving asks for confirmation first. */
    dirty?: boolean
    /** Where Cancel goes. */
    leaveTo?: string
  }>(),
  { showStepper: true, leaveTo: '/' },
)
defineSlots<{ default(): unknown; footer(): unknown; preview(): unknown }>()

const route = useRoute()
const router = useRouter()
const wizard = useWizardStore()
const current = () => STEPS.findIndex((s) => s.path === route.path)

const confirming = ref(false)

function leave() {
  confirming.value = false
  if (props.leaveTo === '/') wizard.reset()
  router.push(props.leaveTo)
}
</script>

<template>
  <div
    class="grid min-h-screen grid-cols-1 gap-x-12 gap-y-8 px-6 py-9 xl:grid-cols-[minmax(0,620px)_1fr] xl:px-11"
  >
    <div class="flex h-[calc(100vh-72px)] flex-col">
      <header class="flex items-center justify-between">
        <RouterLink to="/" class="flex items-center gap-2">
          <span
            class="flex size-6 items-center justify-center rounded-sm bg-white text-xs font-semibold text-midnight"
            >M</span
          >
          <span class="text-sm font-medium">MWap</span>
        </RouterLink>
        <button
          type="button"
          class="cursor-pointer text-sm text-text-2 transition-colors hover:text-white"
          @click="dirty ? (confirming = true) : leave()"
        >
          {{ showStepper ? 'Cancel' : 'Close' }}
        </button>
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

    <aside class="h-[calc(100vh-72px)] min-w-0"><slot name="preview" /></aside>

    <UiDialog v-if="confirming" title="Discard your changes?" @close="confirming = false">
      Your changes have not been saved and will be lost.
      <template #actions>
        <UiButton variant="ghost" class="border-0" @click="confirming = false"
          >Keep editing</UiButton
        >
        <UiButton @click="leave">Discard</UiButton>
      </template>
    </UiDialog>
  </div>
</template>
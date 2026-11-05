<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

defineProps<{ title: string }>()
const emit = defineEmits<{ close: [] }>()

const onKey = (e: KeyboardEvent) => e.key === 'Escape' && emit('close')
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      @click.self="emit('close')"
    >
      <div
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        class="flex w-full max-w-[440px] flex-col gap-2 rounded-xl border border-divider bg-slate p-6"
      >
        <h2 class="text-lg font-medium">{{ title }}</h2>
        <div class="text-sm text-text-2"><slot /></div>
        <div class="mt-4 flex items-center justify-end gap-3"><slot name="actions" /></div>
      </div>
    </div>
  </Teleport>
</template>
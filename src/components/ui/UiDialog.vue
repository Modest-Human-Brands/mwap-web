<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'

defineProps<{ title: string }>()
const emit = defineEmits<{ close: [] }>()

const panel = ref<HTMLElement>()
const opener = document.activeElement as HTMLElement | null

const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape') emit('close')
  // Keep Tab inside the dialog.
  if (e.key === 'Tab' && panel.value) {
    const items = [...panel.value.querySelectorAll<HTMLElement>('button, a[href], input, select')]
    const first = items[0]
    const last = items[items.length - 1]
    const wrapTo = e.shiftKey
      ? document.activeElement === first && last
      : document.activeElement === last && first
    if (wrapTo) {
      e.preventDefault()
      wrapTo.focus()
    }
  }
}

onMounted(async () => {
  window.addEventListener('keydown', onKey)
  await nextTick()
  panel.value?.querySelector<HTMLElement>('button')?.focus()
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  opener?.focus?.()
})
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      @click.self="emit('close')"
    >
      <div
        ref="panel"
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
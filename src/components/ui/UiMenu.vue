<script setup lang="ts">
import { ref } from 'vue'
import { onClickOutside } from '@vueuse/core'

export interface MenuItem {
  label: string
  onSelect: () => void
}

defineProps<{ items: MenuItem[]; label: string }>()

const open = ref(false)
const root = ref<HTMLElement>()
onClickOutside(root, () => (open.value = false))

function select(item: MenuItem) {
  open.value = false
  item.onSelect()
}
</script>

<template>
  <div ref="root" class="relative" @keydown.esc="open = false">
    <button
      type="button"
      :aria-label="label"
      aria-haspopup="menu"
      :aria-expanded="open"
      class="flex size-4 cursor-pointer items-center justify-center"
      @click.stop="open = !open"
    >
      <slot />
    </button>
    <ul
      v-if="open"
      role="menu"
      class="absolute top-6 right-0 z-20 w-44 overflow-hidden rounded-md border border-divider bg-divider py-1 shadow-lg"
    >
      <li v-for="item in items" :key="item.label" role="none">
        <button
          type="button"
          role="menuitem"
          class="w-full cursor-pointer px-4 py-2 text-left text-sm text-white hover:bg-white/8"
          @click="select(item)"
        >
          {{ item.label }}
        </button>
      </li>
    </ul>
  </div>
</template>
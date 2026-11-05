<script setup lang="ts">
import { pageLabel } from '@/domain/pages'

defineProps<{ pages: string[] }>()
const page = defineModel<string>({ required: true })
</script>

<template>
  <nav
    class="flex flex-col items-center rounded-xl border border-divider bg-slate/90 px-3 py-3 backdrop-blur"
    aria-label="Pages"
  >
    <template v-for="(key, i) in pages" :key="key">
      <span v-if="i" class="my-1.5 h-3 w-px bg-divider" aria-hidden="true" />
      <button
        type="button"
        class="group flex cursor-pointer flex-col items-center gap-1.5 rounded-md px-1"
        :aria-pressed="page === key"
        :aria-label="pageLabel(key)"
        @click="page = key"
      >
        <span
          class="flex h-10 w-8 flex-col gap-1 rounded-sm border-2 bg-white px-1.5 pt-2 transition-colors"
          :class="page === key ? 'border-electric' : 'border-transparent group-hover:border-nickel'"
          aria-hidden="true"
        >
          <i class="h-0.5 rounded-full bg-electric" />
          <i class="h-0.5 rounded-full bg-stroke" />
          <i class="h-0.5 w-2/3 rounded-full bg-stroke" />
        </span>
        <span
          class="font-mono text-[10px] leading-none tracking-wider uppercase"
          :class="page === key ? 'text-white' : 'text-text-2'"
          >{{ pageLabel(key) }}</span
        >
      </button>
    </template>
  </nav>
</template>
<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ values: number[]; label: string; tall?: boolean }>()
const max = computed(() => Math.max(...props.values, 1))
</script>

<template>
  <div
    :class="tall ? 'h-[140px]' : 'h-[60px]'"
    class="flex items-end gap-1"
    role="img"
    :aria-label="label"
  >
    <span
      v-for="(v, i) in values"
      :key="i"
      class="min-w-px flex-1 rounded-t-sm bg-electric transition-colors hover:bg-vite"
      :style="{ height: `${Math.max(12, (v / max) * 100)}%` }"
      :title="`${i === values.length - 1 ? 'Today' : `${values.length - 1 - i}d ago`}: ${v.toLocaleString()}`"
    />
  </div>
</template>
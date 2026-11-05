<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ values: number[]; label: string }>()
const max = computed(() => Math.max(...props.values, 1))
</script>

<template>
  <div class="flex h-[60px] items-end gap-1" role="img" :aria-label="label">
    <span
      v-for="(v, i) in values"
      :key="i"
      class="min-w-px flex-1 rounded-t-sm bg-electric"
      :style="{ height: `${Math.max(12, (v / max) * 100)}%` }"
      :title="`${v}`"
    />
  </div>
</template>
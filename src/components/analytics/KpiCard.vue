<script setup lang="ts">
import type { Kpi } from '@/mock/analytics'

defineProps<{ kpi: Kpi; comparison?: string }>()
const fmt = new Intl.NumberFormat('en-US')
</script>

<template>
  <div class="rounded-lg border border-divider p-3">
    <p class="text-xs text-text-2">{{ kpi.label }}</p>
    <p class="mt-1 text-xl font-medium">{{ fmt.format(kpi.value) }}</p>
    <p class="mt-1 text-xs text-[#3fcf8e]">
      +{{ kpi.delta }}{{ kpi.unit }}{{ comparison ? ` ${comparison}` : '' }}
    </p>
  </div>
</template>
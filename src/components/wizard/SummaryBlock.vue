<script setup lang="ts">
defineProps<{ title: string; rows: [label: string, value: string][] }>()
</script>

<template>
  <section class="flex flex-col gap-2">
    <h2 class="text-xs tracking-wide text-text-2 uppercase">{{ title }}</h2>
    <dl
      class="grid grid-cols-[96px_1fr] gap-x-4 gap-y-1 rounded-lg border border-divider p-4 text-sm"
    >
      <template v-for="[label, value] in rows" :key="label">
        <dt class="text-text-2">{{ label }}</dt>
        <dd class="min-w-0 break-words">{{ value }}</dd>
      </template>
    </dl>
  </section>
</template>
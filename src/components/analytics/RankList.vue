<script setup lang="ts">
defineProps<{ title: string; rows: [string, number][] }>()
const fmt = new Intl.NumberFormat('en-US')
</script>

<template>
  <section class="rounded-lg border border-divider p-3">
    <h3 class="mb-3 text-sm font-medium">{{ title }}</h3>
    <ul class="flex flex-col gap-2 text-sm">
      <li v-for="[name, value] in rows" :key="name" class="flex justify-between">
        <span class="text-text-2">{{ name }}</span>
        <span>{{ fmt.format(value) }}</span>
      </li>
    </ul>
  </section>
</template>
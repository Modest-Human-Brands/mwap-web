<script setup lang="ts">
defineProps<{ label: string; for: string; error?: string; hint?: string }>()
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label :for="$props.for" class="text-sm font-medium">{{ label }}</label>
    <slot />
    <p v-if="error" role="alert" class="text-xs text-error">{{ error }}</p>
    <p v-else-if="hint" class="text-xs text-text-2">{{ hint }}</p>
  </div>
</template>
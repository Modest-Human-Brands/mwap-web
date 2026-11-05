<script setup lang="ts">
import UiButton from '@/components/ui/UiButton.vue'

defineProps<{ searching: boolean }>()
const emit = defineEmits<{ clear: [] }>()
</script>

<template>
  <div
    class="flex h-[342px] flex-col items-center justify-center gap-2 rounded-xl border border-divider text-center"
  >
    <h2 class="text-lg font-medium">
      {{ searching ? 'No sites match your search' : 'No sites yet' }}
    </h2>
    <p class="text-sm text-text-2">
      {{
        searching
          ? 'Check the spelling or try a shorter search.'
          : 'Pick a template, add your details and publish in a few minutes.'
      }}
    </p>
    <UiButton v-if="searching" class="mt-1" @click="emit('clear')">Clear search</UiButton>
    <UiButton v-else to="/new" class="mt-1">New site</UiButton>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue'
import IconLayout from '~icons/lucide/layout-template'

const props = defineProps<{
  /** Absolute URL of the template's static picture. */
  src?: string
}>()

const failed = ref(false)
watch(
  () => props.src,
  () => (failed.value = false),
)
</script>

<template>
  <span
    class="relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-md bg-divider"
    aria-hidden="true"
  >
    <img
      v-if="src && !failed"
      :src="src"
      alt=""
      loading="lazy"
      decoding="async"
      class="size-full object-cover object-top"
      @error="failed = true"
    />
    <IconLayout v-else class="size-10 text-text-2" />
  </span>
</template>
<script setup lang="ts">
import { RouterLink, type RouteLocationRaw } from 'vue-router'

withDefaults(
  defineProps<{
    variant?: 'primary' | 'ghost' | 'accent'
    to?: RouteLocationRaw
  }>(),
  { variant: 'primary' },
)

const styles = {
  primary: 'bg-white text-midnight hover:bg-stroke',
  ghost: 'border border-divider text-white hover:bg-white/8',
  accent: 'bg-electric text-white hover:bg-electric-600',
} as const
</script>

<template>
  <component
    :is="to ? RouterLink : 'button'"
    :to="to"
    class="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md px-6 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
    :class="styles[variant]"
  >
    <slot />
  </component>
</template>
<script setup lang="ts">
import IconPlus from '~icons/lucide/plus'

import { STATUS_DOT, STATUS_LABEL, type SiteCard, type SiteStatus } from '@/domain/site'
import SiteCardItem from './SiteCardItem.vue'

defineProps<{ status: SiteStatus; sites: SiteCard[] }>()
const emit = defineEmits<{ archive: [site: SiteCard]; delete: [site: SiteCard] }>()
</script>

<template>
  <section class="flex w-64 shrink-0 flex-col gap-3" :aria-label="STATUS_LABEL[status]">
    <header class="flex h-10 items-center gap-2 rounded-full bg-divider px-2.5">
      <span class="size-2 rounded-full" :class="STATUS_DOT[status]" />
      <h2 class="flex-1 text-sm font-medium">{{ STATUS_LABEL[status] }}</h2>
      <RouterLink to="/new" :aria-label="`New ${STATUS_LABEL[status]} site`" class="text-stroke">
        <IconPlus class="size-4" />
      </RouterLink>
    </header>
    <SiteCardItem
      v-for="site in sites"
      :key="site.slug"
      :site="site"
      @archive="emit('archive', $event)"
      @delete="emit('delete', $event)"
    />
    <p
      v-if="!sites.length"
      class="rounded-lg border border-dashed border-divider px-4 py-6 text-center text-xs text-text-2"
    >
      No sites here
    </p>
  </section>
</template>
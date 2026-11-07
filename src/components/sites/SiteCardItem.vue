<script setup lang="ts">
import { useRouter } from 'vue-router'
import IconClock from '~icons/lucide/clock'
import IconFile from '~icons/lucide/file-text'
import IconLink from '~icons/lucide/link'
import IconMore from '~icons/lucide/ellipsis-vertical'

import UiMenu, { type MenuItem } from '@/components/ui/UiMenu.vue'
import {
  STATUS_BADGE,
  STATUS_LABEL,
  formatDay,
  formatPages,
  siteUrl,
  type SiteCard,
} from '@/domain/site'

const props = defineProps<{ site: SiteCard }>()
const emit = defineEmits<{ archive: [site: SiteCard]; delete: [site: SiteCard] }>()

const router = useRouter()
const open = (hash = '') => router.push({ name: 'site', params: { slug: props.site.slug }, hash })

const menu: MenuItem[] = [
  { label: 'Edit site', onSelect: () => open() },
  { label: 'Preview', onSelect: () => open() },
  { label: 'Analytics', onSelect: () => open('#analytics') },
  { label: 'Copy link', onSelect: () => navigator.clipboard?.writeText(siteUrl(props.site.slug)) },
  ...(props.site.status === 'archived'
    ? []
    : [{ label: 'Archive', onSelect: () => emit('archive', props.site) }]),
  { label: 'Delete', onSelect: () => emit('delete', props.site) },
]
</script>

<template>
  <article class="relative overflow-hidden rounded-lg border border-divider bg-slate">
    <RouterLink :to="{ name: 'site', params: { slug: site.slug } }" class="block">
      <div class="relative flex h-[183px] flex-col gap-1.5 bg-white px-3.5 pt-[30px]">
        <span class="text-right text-[13px] leading-[18px] font-medium text-electric uppercase">
          {{ site.category }}
        </span>
        <span class="text-[13px] leading-[18px] font-medium text-midnight">{{ site.name }}</span>
        <span class="h-[5px] rounded-sm bg-stroke" />
        <span class="h-[5px] rounded-sm bg-stroke" />
        <span class="h-[5px] rounded-sm bg-stroke" />
        <span
          class="absolute top-2 left-2 rounded-md bg-midnight px-1.5 py-0.5 text-xs leading-4 font-medium"
        >
          #{{ site.index }}
        </span>
        <span
          class="absolute top-[104px] left-2 rounded-md bg-midnight px-1.5 py-0.5 text-xs leading-4 font-medium"
        >
          WEB
        </span>
      </div>
    </RouterLink>

    <div class="absolute top-2 right-2 text-midnight">
      <UiMenu :items="menu" label="Site actions">
        <IconMore class="size-4" />
      </UiMenu>
    </div>

    <div class="flex flex-col gap-2 px-2.5 py-3">
      <div class="flex h-6 items-center gap-2">
        <h3 class="flex-1 truncate text-sm font-medium">{{ site.name }}</h3>
        <span
          class="rounded-full px-2 py-0.5 text-xs leading-4 font-medium"
          :class="STATUS_BADGE[site.status]"
        >
          {{ STATUS_LABEL[site.status] }}
        </span>
      </div>
      <p class="line-clamp-2 min-h-8 text-xs leading-4 text-text-2">{{ site.description }}</p>
      <div class="flex items-center gap-2 text-xs leading-4 text-text-2">
        <span class="flex items-center gap-[3px]">
          <IconClock class="size-3" />{{ formatDay(site.updatedAt) }}
        </span>
        <span class="flex items-center gap-[3px]">
          <IconFile class="size-3" />{{ formatPages(site.pages) }}
        </span>
      </div>
    </div>

    <div class="flex items-center justify-between border-t border-divider px-3 py-2">
      <div class="flex">
        <span
          v-for="c in site.collaborators"
          :key="c.initial"
          class="-ml-1.5 flex size-6 items-center justify-center rounded-full border border-slate bg-divider text-xs leading-4 font-medium first:ml-0"
        >
          {{ c.initial }}
        </span>
      </div>
      <a
        :href="siteUrl(site.slug)"
        target="_blank"
        rel="noopener"
        class="flex items-center gap-1 rounded-md bg-electric px-2.5 py-1 text-xs leading-4 font-medium transition-colors hover:bg-electric-600"
      >
        <IconLink class="size-3" />Open site
      </a>
    </div>
  </article>
</template>
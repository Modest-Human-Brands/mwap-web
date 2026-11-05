<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import IconPlus from '~icons/lucide/plus'
import IconClose from '~icons/lucide/x'

import { ApiError, sitesApi, type Site } from '@/api'
import BarChart from '@/components/analytics/BarChart.vue'
import KpiCard from '@/components/analytics/KpiCard.vue'
import RangeTabs from '@/components/analytics/RangeTabs.vue'
import RankList from '@/components/analytics/RankList.vue'
import UiButton from '@/components/ui/UiButton.vue'
import SitePreview from '@/components/wizard/SitePreview.vue'
import { config } from '@/config'
import { SITE_STATUSES, STATUS_LABEL, formatPages, siteUrl, type SiteStatus } from '@/domain/site'
import { siteAddress, sitePages } from '@/domain/wizard'
import { siteActivity, siteAnalytics, type Range } from '@/mock/analytics'
import { getSiteMeta, setSiteMeta } from '@/mock/siteMeta'
import { useSitesStore } from '@/stores/sites'

const route = useRoute()
const router = useRouter()
const sites = useSitesStore()

const slug = computed(() => String(route.params.slug))
const site = ref<Site>()
const error = ref('')
const status = ref<SiteStatus>('published')
const description = ref('')
const range = ref<Range>(30)
const page = ref<string>()

async function load() {
  site.value = undefined
  error.value = ''
  page.value = undefined
  try {
    const s = await sitesApi.get(slug.value)
    site.value = s
    if (config.useMocks) {
      const meta = getSiteMeta(s.slug, s.brand.name)
      status.value = meta.status
      description.value = meta.description
    }
  } catch (e) {
    error.value =
      e instanceof ApiError && e.status === 404
        ? 'This site does not exist.'
        : e instanceof ApiError
          ? `${e.status}: ${e.message}`
          : 'Could not reach the MWap service'
  }
}
watch(slug, load, { immediate: true })

const pages = computed(() => (site.value ? sitePages(site.value) : []))
const analytics = computed(() => siteAnalytics(slug.value, range.value, pages.value))
const activity = computed(() =>
  siteActivity(site.value?.templateId ?? '', status.value === 'published'),
)
const published = computed(() =>
  site.value?.updatedAt
    ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(
        new Date(site.value.updatedAt),
      )
    : '',
)
const label = (key: string) => key.charAt(0).toUpperCase() + key.slice(1)

/** Backend gap: no status endpoint, so this only updates the mock. */
function changeStatus() {
  if (!site.value) return
  setSiteMeta(site.value.slug, { status: status.value }, site.value.brand.name)
  const card = sites.sites.find((s) => s.slug === slug.value)
  if (card) card.status = status.value
}
</script>

<template>
  <div v-if="error" class="flex flex-col items-start gap-3 p-8">
    <p role="alert" class="text-sm text-text-2">{{ error }}</p>
    <UiButton to="/">Back to Sites</UiButton>
  </div>
  <p v-else-if="!site" class="p-8 text-sm text-text-2">Loading…</p>
  <div v-else class="grid h-screen grid-cols-[200px_1fr_440px]">
    <nav
      class="flex flex-col items-center gap-4 overflow-y-auto border-r border-divider py-4"
      aria-label="Pages"
    >
      <button type="button" aria-label="Close" class="cursor-pointer" @click="router.push('/')">
        <IconClose class="size-6" />
      </button>
      <button
        v-for="key in pages"
        :key="key"
        type="button"
        class="flex cursor-pointer flex-col items-center gap-2 text-xs text-text-2"
        :aria-pressed="(page ?? pages[0]) === key"
        @click="page = key"
      >
        <span
          class="flex h-[152px] w-[120px] flex-col gap-1.5 rounded-sm border-2 bg-white p-3"
          :class="(page ?? pages[0]) === key ? 'border-electric' : 'border-transparent'"
        >
          <i class="h-1 rounded-sm bg-stroke" /><i class="h-1 rounded-sm bg-stroke" /><i
            class="h-1 w-2/3 rounded-sm bg-stroke"
          />
        </span>
        {{ label(key) }}
      </button>
    </nav>

    <main class="min-w-0 p-6">
      <SitePreview
        v-model:page="page"
        fill
        :show-rail="false"
        :address="siteAddress(site.slug)"
        :template-id="site.templateId"
        :brand="site.brand"
        :data="site.data"
        :pages="pages"
      />
    </main>

    <aside class="flex flex-col gap-5 overflow-y-auto border-l border-divider p-6">
      <header class="flex items-start justify-between gap-3">
        <h1 class="text-xl font-medium">{{ site.brand.name }}</h1>
        <select
          v-if="config.useMocks"
          v-model="status"
          aria-label="Status"
          class="h-8 cursor-pointer rounded-full border border-divider bg-slate px-3 text-sm"
          @change="changeStatus"
        >
          <option v-for="s in SITE_STATUSES" :key="s" :value="s">{{ STATUS_LABEL[s] }}</option>
        </select>
      </header>
      <p v-if="description" class="text-sm text-text-2">{{ description }}</p>
      <p class="text-xs text-text-2">
        {{ siteAddress(site.slug) }} · Published {{ published }} · {{ formatPages(pages.length) }}
      </p>

      <template v-if="config.useMocks">
        <section id="analytics" class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-medium">Analytics</h2>
            <RangeTabs v-model="range" />
          </div>
          <div class="grid grid-cols-3 gap-2">
            <KpiCard v-for="k in analytics.kpis" :key="k.label" :kpi="k" />
          </div>
          <BarChart :values="analytics.daily" label="Visitors per day" />
          <div class="grid grid-cols-2 gap-2">
            <RankList title="Top pages" :rows="analytics.topPages.slice(0, 3)" />
            <RankList title="Traffic sources" :rows="analytics.sources" />
          </div>
        </section>

        <section class="flex flex-col gap-3 border-t border-divider pt-5" aria-label="Activity">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-medium">Activity</h2>
            <span class="text-xs text-text-2">{{ activity.length }}</span>
          </div>
          <ul class="flex flex-col gap-3">
            <li v-for="e in activity" :key="e.title" class="flex items-center gap-3">
              <span class="flex size-8 items-center justify-center rounded-full bg-divider">
                <IconPlus class="size-3.5" />
              </span>
              <div class="flex-1 text-sm">
                <p class="font-medium">{{ e.title }}</p>
                <p class="text-xs text-text-2">{{ e.note }}</p>
              </div>
              <span class="text-xs text-text-2">{{ e.when }}</span>
            </li>
          </ul>
        </section>
      </template>

      <div class="mt-auto flex items-center justify-end gap-3 pt-2">
        <a
          :href="siteUrl(site.slug)"
          target="_blank"
          rel="noopener"
          class="px-3 text-sm text-text-2 transition-colors hover:text-white"
          >Open site</a
        >
        <UiButton :to="{ name: 'site-edit', params: { slug: site.slug } }">Edit site</UiButton>
      </div>
    </aside>
  </div>
</template>
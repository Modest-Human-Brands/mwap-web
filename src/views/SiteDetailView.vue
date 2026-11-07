<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import IconPlus from '~icons/lucide/plus'
import IconClose from '~icons/lucide/x'

import { ApiError, sitesApi, templatesApi, type Site } from '@/api'
import BarChart from '@/components/analytics/BarChart.vue'
import KpiCard from '@/components/analytics/KpiCard.vue'
import RangeTabs from '@/components/analytics/RangeTabs.vue'
import RankList from '@/components/analytics/RankList.vue'
import DeleteSiteDialog from '@/components/sites/DeleteSiteDialog.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import PageRail from '@/components/wizard/PageRail.vue'
import SitePreview from '@/components/wizard/SitePreview.vue'
import { config } from '@/config'
import { pageLabel } from '@/domain/pages'
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
const templateLabel = ref('')
const page = ref<string>()
const deleting = ref(false)

async function load() {
  site.value = undefined
  error.value = ''
  page.value = undefined
  try {
    const s = await sitesApi.get(slug.value)
    site.value = s
    templatesApi
      .list()
      .then((all) => (templateLabel.value = all.find((t) => t.id === s.templateId)?.label ?? ''))
      .catch(() => {})
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
  siteActivity(templateLabel.value || 'Site', status.value === 'published'),
)
const published = computed(() =>
  site.value?.updatedAt
    ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(
        new Date(site.value.updatedAt),
      )
    : '',
)

/** Backend gap: no status endpoint, so this only updates the mock. */
const statusOptions = SITE_STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] }))

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
      <PageRail
        :model-value="page ?? pages[0]!"
        :pages="pages"
        @update:model-value="page = $event"
      />
    </nav>

    <main class="min-h-0 min-w-0 p-6">
      <SitePreview
        v-model:page="page"
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
        <UiSelect
          v-if="config.useMocks"
          v-model="status"
          label="Status"
          variant="pill"
          align="right"
          :options="statusOptions"
          @update:model-value="changeStatus"
        />
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
        <button
          type="button"
          class="cursor-pointer px-3 text-sm text-error transition-colors hover:text-white"
          @click="deleting = true"
        >
          Delete
        </button>
        <UiButton :to="{ name: 'site-edit', params: { slug: site.slug } }">Edit site</UiButton>
      </div>
    </aside>
    <DeleteSiteDialog
      v-if="deleting"
      :name="site.brand.name"
      :slug="site.slug"
      @close="deleting = false"
      @deleted="(sites.remove(site.slug), router.push('/'))"
    />
  </div>
</template>
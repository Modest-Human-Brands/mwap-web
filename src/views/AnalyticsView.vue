<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import BarChart from '@/components/analytics/BarChart.vue'
import KpiCard from '@/components/analytics/KpiCard.vue'
import RangeTabs from '@/components/analytics/RangeTabs.vue'
import RankList from '@/components/analytics/RankList.vue'
import { config } from '@/config'
import { overallAnalytics, type Range } from '@/mock/analytics'
import { useSitesStore } from '@/stores/sites'

const store = useSitesStore()
const range = ref<Range>(30)

onMounted(() => {
  if (!store.loaded) store.load()
})

const data = computed(() =>
  overallAnalytics(
    store.sites.filter((s) => s.status !== 'archived').map((s) => ({ slug: s.slug, name: s.name })),
    range.value,
  ),
)
</script>

<template>
  <main class="flex flex-col gap-5 p-8">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h1 class="text-xl font-medium">Analytics</h1>
        <p class="text-sm text-text-2">All sites · Last {{ range }} days</p>
      </div>
      <RangeTabs v-model="range" />
    </div>

    <p v-if="!config.useMocks" class="text-sm text-text-2">
      Analytics is not available yet: the service does not collect it.
    </p>
    <p v-else-if="store.error" role="alert" class="text-sm text-text-2">
      {{ store.error }}
      <button class="ml-2 cursor-pointer underline" @click="store.load()">Retry</button>
    </p>
    <p v-else-if="!store.loaded" class="text-sm text-text-2">Loading…</p>
    <template v-else>
      <div class="grid grid-cols-3 gap-4">
        <KpiCard
          v-for="k in data.kpis"
          :key="k.label"
          :kpi="k"
          :comparison="`vs previous ${range} days`"
        />
      </div>

      <section class="rounded-lg border border-divider p-5">
        <h2 class="mb-5 text-sm font-medium">Visitors per day, all sites</h2>
        <BarChart :values="data.daily" label="Visitors per day, all sites" tall />
      </section>

      <div class="grid grid-cols-4 gap-4">
        <RankList title="Top sites" :rows="data.topSites" />
        <RankList title="Traffic sources" :rows="data.sources" />
        <RankList title="Devices" :rows="data.devices" suffix="%" />
        <RankList title="Countries" :rows="data.countries" />
      </div>
    </template>
  </main>
</template>
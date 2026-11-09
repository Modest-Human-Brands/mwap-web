<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import UiButton from '@/components/ui/UiButton.vue'
import AddressCard from '@/components/wizard/AddressCard.vue'
import SitePreview from '@/components/wizard/SitePreview.vue'
import SummaryBlock from '@/components/wizard/SummaryBlock.vue'
import WizardShell from '@/components/wizard/WizardShell.vue'
import { enabledSections, labelFor, pageKeys, type JsonSchema } from '@/domain/schema'
import { buildBrand, buildData, siteAddress, templatePages } from '@/domain/wizard'
import { formatPages } from '@/domain/site'
import { useWizardStore } from '@/stores/wizard'

const store = useWizardStore()
const router = useRouter()

if (!store.details) router.replace('/new')

const d = computed(() => store.details)
const tpl = computed(() => store.backendTemplate)
/** One row per page: the sections switched on. */
const pageRows = computed<[string, string][]>(() => {
  const data = d.value?.data
  const schema = (tpl.value?.schema ?? {}) as JsonSchema
  if (!data) return []
  const pages = (schema.properties?.pages as JsonSchema | undefined)?.properties ?? {}
  return pageKeys(data).map((p) => [
    labelFor(p, pages[p] ?? {}),
    enabledSections(data, p, schema)
      .map(([, label]) => label)
      .join(' · ') || 'No sections',
  ])
})
const pageCount = computed(() => (tpl.value ? templatePages(tpl.value).length : 0))

async function publish() {
  if (await store.publish()) router.push('/new/published')
}
</script>

<template>
  <WizardShell
    title="Review and publish"
    :dirty="store.dirty"
    subtitle="This is exactly what goes live. Go back to change anything."
  >
    <div v-if="d && store.template" class="flex flex-col gap-5">
      <AddressCard
        :address="siteAddress(d.slug)"
        :meta="`${formatPages(pageCount)} · ${store.template.label}`"
      />
      <p v-if="store.submitError" role="alert" class="text-sm text-error">
        {{ store.submitError }}
      </p>
      <SummaryBlock
        title="Site"
        :rows="[
          ['Site name', d.name],
          ['Address', siteAddress(d.slug)],
          ['Template', store.template.label],
          ['Pages', formatPages(pageCount)],
        ]"
      />
      <SummaryBlock
        title="Brand"
        :rows="[
          ['Logo', d.logoUrl],
          ['Colours', `${d.primary} · ${d.accent}`],
          ['Font', d.fontFamily],
        ]"
      />
      <SummaryBlock
        title="Page content"
        :rows="[
          ...pageRows,
          ...(d.googleAnalyticsId
            ? [['Google Analytics', d.googleAnalyticsId] as [string, string]]
            : []),
        ]"
      />
    </div>

    <template #footer>
      <span class="text-xs text-text-2">Ready to publish</span>
      <div class="flex items-center gap-3">
        <UiButton variant="ghost" class="border-0" @click="router.push('/new/details')"
          >Back</UiButton
        >
        <UiButton :disabled="store.publishing" @click="publish">
          {{ store.publishing ? 'Publishing…' : 'Publish site' }}
        </UiButton>
      </div>
    </template>

    <template #preview>
      <SitePreview
        v-if="tpl && d"
        title="Final preview"
        :address="siteAddress(d.slug)"
        :template-id="tpl.id"
        :brand="buildBrand(tpl, d)"
        :data="buildData(tpl, d)"
        :pages="templatePages(tpl)"
      />
    </template>
  </WizardShell>
</template>
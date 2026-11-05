<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import UiButton from '@/components/ui/UiButton.vue'
import AddressCard from '@/components/wizard/AddressCard.vue'
import SitePreview from '@/components/wizard/SitePreview.vue'
import SummaryBlock from '@/components/wizard/SummaryBlock.vue'
import WizardShell from '@/components/wizard/WizardShell.vue'
import { ACCENTS } from '@/domain/templates'
import { buildBrand, buildData, siteAddress, templatePages } from '@/domain/wizard'
import { formatPages } from '@/domain/site'
import { useWizardStore } from '@/stores/wizard'

const store = useWizardStore()
const router = useRouter()

if (!store.details) router.replace('/new')

const d = computed(() => store.details)
const tpl = computed(() => store.backendTemplate)
const pageCount = computed(() => (tpl.value ? templatePages(tpl.value).length : 0))
const accentName = computed(
  () =>
    ACCENTS.find((a) => a.value.toLowerCase() === d.value?.accent.toLowerCase())?.label ??
    d.value?.accent ??
    '',
)

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
          ['Accent colour', accentName],
          ['Font', d.fontFamily],
        ]"
      />
      <SummaryBlock
        title="Page content"
        :rows="[
          ['Headline', d.headline],
          ['Short bio', d.bio],
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
        :data="buildData(d)"
        :pages="templatePages(tpl)"
      />
    </template>
  </WizardShell>
</template>
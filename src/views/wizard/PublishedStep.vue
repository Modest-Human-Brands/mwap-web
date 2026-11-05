<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import UiButton from '@/components/ui/UiButton.vue'
import AddressCard from '@/components/wizard/AddressCard.vue'
import SitePreview from '@/components/wizard/SitePreview.vue'
import SummaryBlock from '@/components/wizard/SummaryBlock.vue'
import WizardShell from '@/components/wizard/WizardShell.vue'
import { formatPages, siteUrl } from '@/domain/site'
import { siteAddress, templatePages } from '@/domain/wizard'
import { useWizardStore } from '@/stores/wizard'

const store = useWizardStore()
const router = useRouter()

if (!store.published) router.replace('/new')

const site = computed(() => store.published)
const tpl = computed(() => store.backendTemplate)
const pages = computed(() => (tpl.value ? templatePages(tpl.value) : []))
const published = computed(() =>
  new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    site.value?.updatedAt ? new Date(site.value.updatedAt) : new Date(),
  ),
)

function done() {
  store.reset()
  router.push('/')
}
</script>

<template>
  <WizardShell
    v-if="site && store.template"
    title="Your site is live"
    subtitle="Anyone with the link can see it now. You can edit it any time."
    :show-stepper="false"
  >
    <div class="flex flex-col gap-5">
      <AddressCard
        :address="siteAddress(site.slug)"
        :meta="`${formatPages(pages.length)} · ${store.template.label}`"
      />
      <SummaryBlock
        title="Live site"
        :rows="[
          ['Address', siteAddress(site.slug)],
          ['Status', 'Published'],
          ['Published', published],
          ['Pages', formatPages(pages.length)],
        ]"
      />
      <SummaryBlock
        title="Next steps"
        :rows="[
          ['Share', 'Copy the link from Sites and send it'],
          ['Edit', 'Change details or pages any time'],
          ['Preview', 'Check changes before they go live'],
        ]"
      />
    </div>

    <template #footer>
      <span class="text-xs text-text-2">Published {{ published }}</span>
      <div class="flex items-center gap-3">
        <UiButton variant="ghost" class="border-0" @click="done">Back to Sites</UiButton>
        <a
          :href="siteUrl(site.slug)"
          target="_blank"
          rel="noopener"
          class="inline-flex h-9 items-center rounded-md bg-white px-6 text-sm font-medium text-midnight hover:bg-stroke"
          >Open site</a
        >
      </div>
    </template>

    <template #preview>
      <SitePreview
        v-if="tpl"
        title="Live site"
        :address="siteAddress(site.slug)"
        :template-id="tpl.id"
        :brand="site.brand"
        :data="site.data"
        :pages="pages"
      />
    </template>
  </WizardShell>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import UiButton from '@/components/ui/UiButton.vue'
import DetailsForm from '@/components/wizard/DetailsForm.vue'
import SitePreview from '@/components/wizard/SitePreview.vue'
import WizardShell from '@/components/wizard/WizardShell.vue'
import { buildBrand, buildData, siteAddress, templatePages } from '@/domain/wizard'
import { useWizardStore } from '@/stores/wizard'

const store = useWizardStore()
const router = useRouter()

if (!store.details) router.replace('/new')

const d = computed(() => store.details)
const tpl = computed(() => store.backendTemplate)

function next() {
  if (store.validate()) router.push('/new/review')
}
</script>

<template>
  <WizardShell
    title="Site details"
    subtitle="Your site updates live as you type."
    :dirty="store.dirty"
  >
    <DetailsForm
      v-if="d"
      :details="d"
      :errors="store.errors"
      @name="store.setName"
      @slug="store.setSlug"
      @submit="next"
    />

    <template #footer>
      <span class="text-xs text-text-2">Draft kept while you edit</span>
      <div class="flex items-center gap-3">
        <UiButton variant="ghost" class="border-0" @click="router.push('/new')">Back</UiButton>
        <UiButton @click="next">Review &amp; publish</UiButton>
      </div>
    </template>

    <template #preview>
      <SitePreview
        v-if="tpl && d"
        title="Live preview"
        :address="siteAddress(d.slug || 'your-site')"
        :template-id="tpl.id"
        :brand="buildBrand(tpl, d)"
        :data="buildData(d)"
        :pages="templatePages(tpl)"
      />
    </template>
  </WizardShell>
</template>
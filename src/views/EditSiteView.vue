<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ApiError, sitesApi, type Site } from '@/api'
import UiButton from '@/components/ui/UiButton.vue'
import DetailsForm from '@/components/wizard/DetailsForm.vue'
import SitePreview from '@/components/wizard/SitePreview.vue'
import WizardShell from '@/components/wizard/WizardShell.vue'
import {
  applyDetails,
  detailsFromSite,
  fieldForServiceError,
  siteAddress,
  sitePages,
  validateDetails,
  type DetailsErrors,
  type SiteDetails,
} from '@/domain/wizard'
import { useSitesStore } from '@/stores/sites'

const route = useRoute()
const router = useRouter()
const slug = String(route.params.slug)

const site = ref<Site>()
const details = ref<SiteDetails>()
const errors = ref<DetailsErrors>({})
const loadError = ref('')
const submitError = ref('')
const saving = ref(false)
const initial = ref('')

onMounted(async () => {
  try {
    site.value = await sitesApi.get(slug)
    details.value = detailsFromSite(site.value)
    initial.value = JSON.stringify(details.value)
  } catch (e) {
    loadError.value =
      e instanceof ApiError && e.status === 404
        ? 'This site does not exist.'
        : 'Could not load the site'
  }
})

// The preview shows the stored site with the edits laid over it.
const draft = computed(() =>
  site.value && details.value ? applyDetails(site.value, details.value) : undefined,
)
const back = () => router.push({ name: 'site', params: { slug } })

async function save() {
  if (!site.value || !details.value) return
  errors.value = validateDetails(details.value)
  if (Object.keys(errors.value).length) return
  saving.value = true
  submitError.value = ''
  try {
    await sitesApi.replace(slug, applyDetails(site.value, details.value))
    useSitesStore().loaded = false
    await back()
  } catch (e) {
    if (e instanceof ApiError) {
      const next: DetailsErrors = {}
      for (const err of e.errors) {
        const field = fieldForServiceError(err.field)
        if (field) next[field] = err.message
      }
      errors.value = next
      submitError.value =
        e.status === 401
          ? 'The service rejected the API key (dev setup: set VITE_MWAP_API_KEY).'
          : e.status === 404
            ? 'This site is read-only or belongs to another organization.'
            : Object.keys(next).length
              ? 'Fix the highlighted fields.'
              : e.message
    } else {
      submitError.value = 'Could not reach the MWap service'
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <WizardShell
    :show-stepper="false"
    :dirty="!!details && JSON.stringify(details) !== initial"
    :leave-to="`/sites/${slug}`"
    title="Edit site"
    subtitle="Your site updates live as you type. Changes go live when you save."
  >
    <p v-if="loadError" role="alert" class="text-sm text-text-2">{{ loadError }}</p>
    <p v-else-if="!details" class="text-sm text-text-2">Loading…</p>
    <template v-else>
      <p v-if="submitError" role="alert" class="mb-4 text-sm text-error">{{ submitError }}</p>
      <DetailsForm
        :details="details"
        :errors="errors"
        slug-locked
        @name="details.name = $event"
        @slug="() => {}"
        @submit="save"
      />
    </template>

    <template #footer>
      <span class="text-xs text-text-2">{{ siteAddress(slug) }}</span>
      <div class="flex items-center gap-3">
        <UiButton variant="ghost" class="border-0" @click="back">Cancel</UiButton>
        <UiButton :disabled="saving || !details" @click="save">
          {{ saving ? 'Saving…' : 'Save changes' }}
        </UiButton>
      </div>
    </template>

    <template #preview>
      <SitePreview
        v-if="site && draft"
        title="Live preview"
        :address="siteAddress(slug)"
        :template-id="site.templateId"
        :brand="draft.brand"
        :data="draft.data"
        :pages="sitePages(site)"
      />
    </template>
  </WizardShell>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import UiButton from '@/components/ui/UiButton.vue'
import UiField from '@/components/ui/UiField.vue'
import SitePreview from '@/components/wizard/SitePreview.vue'
import WizardShell from '@/components/wizard/WizardShell.vue'
import { ACCENTS, FONTS } from '@/domain/templates'
import { buildBrand, buildData, siteAddress, templatePages } from '@/domain/wizard'
import { config } from '@/config'
import { useWizardStore } from '@/stores/wizard'

const store = useWizardStore()
const router = useRouter()

if (!store.details) router.replace('/new')

const d = computed(() => store.details)
const tpl = computed(() => store.backendTemplate)
const brand = computed(() => (tpl.value && d.value ? buildBrand(tpl.value, d.value) : undefined))
const accents = computed(() =>
  !d.value || ACCENTS.some((a) => a.value.toLowerCase() === d.value!.accent.toLowerCase())
    ? ACCENTS
    : [{ label: `Template colour ${d.value.accent}`, value: d.value.accent }, ...ACCENTS],
)
const suffix = computed(() => (config.siteDomain ? `.${config.siteDomain}` : ''))

const input =
  'h-10 w-full rounded-md border bg-white/8 px-3 text-sm text-white placeholder:text-grey focus:border-electric focus:outline-none'
const border = (field: keyof NonNullable<typeof d.value>) =>
  store.errors[field] ? 'border-error' : 'border-transparent'

function next() {
  if (store.validate()) router.push('/new/review')
}
</script>

<template>
  <WizardShell title="Site details" subtitle="Your site updates live as you type.">
    <form v-if="d" class="flex flex-col gap-5" novalidate @submit.prevent="next">
      <fieldset class="flex flex-col gap-4">
        <legend class="mb-1 text-xs text-text-2">Site</legend>
        <div class="grid grid-cols-2 gap-3">
          <UiField label="Site name" for="name" :error="store.errors.name">
            <input
              id="name"
              :value="d.name"
              :class="[input, border('name')]"
              autocomplete="off"
              @input="store.setName(($event.target as HTMLInputElement).value)"
            />
          </UiField>
          <UiField label="Site address" for="slug" :error="store.errors.slug">
            <div class="relative">
              <input
                id="slug"
                :value="d.slug"
                :class="[input, border('slug'), suffix && 'pr-24']"
                autocomplete="off"
                @input="store.setSlug(($event.target as HTMLInputElement).value)"
              />
              <span
                v-if="suffix"
                class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-text-2"
                >{{ suffix }}</span
              >
            </div>
          </UiField>
        </div>
      </fieldset>

      <fieldset class="flex flex-col gap-4">
        <legend class="mb-1 text-xs text-text-2">Brand</legend>
        <div class="grid grid-cols-3 gap-3">
          <UiField label="Logo URL" for="logo" :error="store.errors.logoUrl">
            <input id="logo" v-model="d.logoUrl" :class="[input, border('logoUrl')]" />
          </UiField>
          <UiField label="Accent colour" for="accent" :error="store.errors.accent">
            <select id="accent" v-model="d.accent" :class="[input, border('accent')]">
              <option v-for="a in accents" :key="a.value" :value="a.value">{{ a.label }}</option>
            </select>
          </UiField>
          <UiField label="Font" for="font" :error="store.errors.fontFamily">
            <select id="font" v-model="d.fontFamily" :class="[input, border('fontFamily')]">
              <option v-for="f in FONTS" :key="f" :value="f">{{ f }}</option>
            </select>
          </UiField>
        </div>
      </fieldset>

      <fieldset class="flex flex-col gap-4">
        <legend class="mb-1 text-xs text-text-2">Page content</legend>
        <UiField label="Headline" for="headline" :error="store.errors.headline">
          <input id="headline" v-model="d.headline" :class="[input, border('headline')]" />
        </UiField>
        <UiField label="Short bio" for="bio" :error="store.errors.bio">
          <textarea
            id="bio"
            v-model="d.bio"
            rows="3"
            :class="[input, border('bio'), 'h-auto resize-none py-2']"
          />
        </UiField>
      </fieldset>
      <button type="submit" class="hidden" aria-hidden="true" tabindex="-1" />
    </form>

    <template #footer>
      <span class="text-xs text-text-2">Draft kept while you edit</span>
      <div class="flex items-center gap-3">
        <UiButton variant="ghost" class="border-0" @click="router.push('/new')">Back</UiButton>
        <UiButton @click="next">Review &amp; publish</UiButton>
      </div>
    </template>

    <template #preview>
      <SitePreview
        v-if="tpl && d && brand"
        title="Live preview"
        :address="siteAddress(d.slug || 'your-site')"
        :template-id="tpl.id"
        :brand="brand"
        :data="buildData(d)"
        :pages="templatePages(tpl)"
      />
    </template>
  </WizardShell>
</template>
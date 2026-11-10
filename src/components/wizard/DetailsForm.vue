<script setup lang="ts">
import { computed } from 'vue'
import IconPlus from '~icons/lucide/plus'
import IconX from '~icons/lucide/x'

import UiField from '@/components/ui/UiField.vue'
import { config } from '@/config'
import SchemaForm from '@/components/wizard/SchemaForm.vue'
import type { JsonSchema } from '@/domain/schema'
import { MAX_DOMAINS, siteAddress, type DetailsErrors, type SiteDetails } from '@/domain/wizard'

const props = defineProps<{
  /** The template's `data` schema: the content fields are generated from it. */
  schema: JsonSchema
  details: SiteDetails
  errors: DetailsErrors
  /** Failing content fields, by path. */
  contentErrors: Record<string, string>
  /** The address of a published site cannot change. */
  slugLocked?: boolean
}>()
const emit = defineEmits<{
  name: [value: string]
  slug: [value: string]
  submit: []
}>()

const brandError = computed(
  () => props.errors.logoUrl ?? props.errors.fontFamily ?? props.errors.accent,
)

const autoAddress = computed(() =>
  config.siteDomain && props.details.slug ? siteAddress(props.details.slug) : '',
)
const suffix = computed(() => (config.siteDomain ? `.${config.siteDomain}` : ''))

const input =
  'h-10 w-full rounded-md border bg-slate px-3 text-sm text-white placeholder:text-grey hover:border-divider focus:border-electric focus:outline-none disabled:opacity-50'
const border = (field: keyof SiteDetails) =>
  props.errors[field] ? 'border-error' : 'border-transparent'
</script>

<template>
  <form class="flex flex-col gap-5" novalidate @submit.prevent="emit('submit')">
    <fieldset class="flex flex-col gap-4">
      <legend class="mb-1 text-xs text-text-2">Site</legend>
      <div class="grid grid-cols-2 gap-3">
        <UiField label="Site name" for="name" :error="errors.name">
          <input
            id="name"
            :value="details.name"
            placeholder="Nova Marek"
            :class="[input, border('name')]"
            autocomplete="off"
            @input="emit('name', ($event.target as HTMLInputElement).value)"
          />
        </UiField>
        <UiField
          label="Site address"
          for="slug"
          :error="errors.slug"
          :hint="slugLocked ? 'The address cannot change once published.' : undefined"
        >
          <div class="relative">
            <input
              id="slug"
              :value="details.slug"
              placeholder="nova-marek"
              :disabled="slugLocked"
              :class="[input, border('slug'), suffix && 'pr-24']"
              autocomplete="off"
              @input="emit('slug', ($event.target as HTMLInputElement).value)"
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

    <p v-if="brandError" role="alert" class="text-xs text-error">
      {{ brandError }} Fix it under Change branding.
    </p>

    <fieldset class="flex flex-col gap-3">
      <legend class="mb-1 text-xs text-text-2">Domains</legend>
      <p v-if="autoAddress" class="text-xs text-text-2">
        Always served at <span class="text-white">{{ autoAddress }}</span
        >.
      </p>
      <div v-for="(_, i) in details.domains" :key="i" class="flex items-center gap-2">
        <input
          v-model="details.domains[i]"
          :aria-label="`Domain ${i + 1}`"
          placeholder="example.com"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          :class="[input, border('domains')]"
        />
        <button
          type="button"
          class="shrink-0 cursor-pointer rounded p-2 text-text-2 hover:text-white"
          :aria-label="`Remove domain ${i + 1}`"
          @click="details.domains.splice(i, 1)"
        >
          <IconX class="size-4" />
        </button>
      </div>
      <p v-if="errors.domains" role="alert" class="text-xs text-error">{{ errors.domains }}</p>
      <button
        v-if="details.domains.length < MAX_DOMAINS"
        type="button"
        class="flex cursor-pointer items-center gap-1.5 self-start text-sm text-vite hover:text-white"
        @click="details.domains.push('')"
      >
        <IconPlus class="size-4" /> Add your own domain
      </button>
      <p class="text-xs text-text-2">
        Use a name such as example.com, without www. Point its DNS at the service so it can serve
        the site.
      </p>
    </fieldset>

    <SchemaForm
      :schema="schema"
      :data="details.data"
      :errors="contentErrors"
      @update:data="details.data = $event"
    />

    <fieldset class="flex flex-col gap-4">
      <legend class="mb-1 text-xs text-text-2">Analytics</legend>
      <UiField
        label="Google Analytics ID (optional)"
        for="ga"
        :error="errors.googleAnalyticsId"
        hint="GA4 measurement id. The site reports only to your own property."
      >
        <input
          id="ga"
          v-model="details.googleAnalyticsId"
          placeholder="G-ABC123XYZ"
          :class="[input, border('googleAnalyticsId')]"
        />
      </UiField>
    </fieldset>
    <button type="submit" class="hidden" aria-hidden="true" tabindex="-1" />
  </form>
</template>
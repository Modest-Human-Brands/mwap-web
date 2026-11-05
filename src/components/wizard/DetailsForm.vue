<script setup lang="ts">
import { computed } from 'vue'

import UiField from '@/components/ui/UiField.vue'
import { config } from '@/config'
import { ACCENTS, FONTS } from '@/domain/templates'
import type { DetailsErrors, SiteDetails } from '@/domain/wizard'

const props = defineProps<{
  details: SiteDetails
  errors: DetailsErrors
  /** The address of a published site cannot change. */
  slugLocked?: boolean
}>()
const emit = defineEmits<{ name: [value: string]; slug: [value: string]; submit: [] }>()

const accents = computed(() =>
  ACCENTS.some((a) => a.value.toLowerCase() === props.details.accent.toLowerCase())
    ? ACCENTS
    : [
        { label: `Template colour ${props.details.accent}`, value: props.details.accent },
        ...ACCENTS,
      ],
)
const suffix = computed(() => (config.siteDomain ? `.${config.siteDomain}` : ''))

const input =
  'h-10 w-full rounded-md border bg-white/8 px-3 text-sm text-white placeholder:text-grey focus:border-electric focus:outline-none disabled:opacity-50'
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
            :class="[input, border('name')]"
            autocomplete="off"
            @input="emit('name', ($event.target as HTMLInputElement).value)"
          />
        </UiField>
        <UiField label="Site address" for="slug" :error="errors.slug">
          <div class="relative">
            <input
              id="slug"
              :value="details.slug"
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

    <fieldset class="flex flex-col gap-4">
      <legend class="mb-1 text-xs text-text-2">Brand</legend>
      <div class="grid grid-cols-3 gap-3">
        <UiField label="Logo URL" for="logo" :error="errors.logoUrl">
          <input id="logo" v-model="details.logoUrl" :class="[input, border('logoUrl')]" />
        </UiField>
        <UiField label="Accent colour" for="accent" :error="errors.accent">
          <select id="accent" v-model="details.accent" :class="[input, border('accent')]">
            <option v-for="a in accents" :key="a.value" :value="a.value">{{ a.label }}</option>
          </select>
        </UiField>
        <UiField label="Font" for="font" :error="errors.fontFamily">
          <select id="font" v-model="details.fontFamily" :class="[input, border('fontFamily')]">
            <option v-for="f in FONTS" :key="f" :value="f">{{ f }}</option>
          </select>
        </UiField>
      </div>
    </fieldset>

    <fieldset class="flex flex-col gap-4">
      <legend class="mb-1 text-xs text-text-2">Page content</legend>
      <UiField label="Headline" for="headline" :error="errors.headline">
        <input id="headline" v-model="details.headline" :class="[input, border('headline')]" />
      </UiField>
      <UiField label="Short bio" for="bio" :error="errors.bio">
        <textarea
          id="bio"
          v-model="details.bio"
          rows="3"
          :class="[input, border('bio'), 'h-auto resize-none py-2']"
        />
      </UiField>
    </fieldset>
    <button type="submit" class="hidden" aria-hidden="true" tabindex="-1" />
  </form>
</template>
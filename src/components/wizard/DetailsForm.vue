<script setup lang="ts">
import { computed } from 'vue'

import UiField from '@/components/ui/UiField.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import { config } from '@/config'
import { ACCENTS, FONTS } from '@/domain/templates'
import { profileFor } from '@/domain/content'
import type { DetailsErrors, SiteDetails } from '@/domain/wizard'

const props = defineProps<{
  /** Which template's content fields to show. */
  templateId: string
  details: SiteDetails
  errors: DetailsErrors
  /** The address of a published site cannot change. */
  slugLocked?: boolean
}>()
const emit = defineEmits<{ name: [value: string]; slug: [value: string]; submit: [] }>()

const accents = computed(() =>
  (ACCENTS.some((a) => a.value.toLowerCase() === props.details.accent.toLowerCase())
    ? ACCENTS
    : [
        { label: `Template colour ${props.details.accent}`, value: props.details.accent },
        ...ACCENTS,
      ]
  ).map((a) => ({ ...a, swatch: a.value })),
)
const profile = computed(() => profileFor(props.templateId))
const fonts = FONTS.map((f) => ({ value: f, label: f }))
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

    <fieldset class="flex flex-col gap-4">
      <legend class="mb-1 text-xs text-text-2">Brand</legend>
      <div class="grid grid-cols-2 gap-3">
        <UiField label="Logo URL" for="logo" :error="errors.logoUrl" class="col-span-2">
          <input
            id="logo"
            v-model="details.logoUrl"
            placeholder="https://…"
            :class="[input, border('logoUrl')]"
          />
        </UiField>
        <UiField label="Accent colour" for="accent" :error="errors.accent">
          <UiSelect
            id="accent"
            v-model="details.accent"
            :options="accents"
            :invalid="!!errors.accent"
          />
        </UiField>
        <UiField label="Font" for="font" :error="errors.fontFamily">
          <UiSelect
            id="font"
            v-model="details.fontFamily"
            :options="fonts"
            :invalid="!!errors.fontFamily"
          />
        </UiField>
      </div>
    </fieldset>

    <template v-if="profile.supported">
      <fieldset class="flex flex-col gap-4">
        <legend class="mb-1 text-xs text-text-2">Hero</legend>
        <UiField :label="profile.headlineLabel" for="headline" :error="errors.headline">
          <textarea
            v-if="profile.headlineMultiline"
            id="headline"
            v-model="details.headline"
            :rows="profile.headlineMaxLines"
            placeholder="Your name or title"
            :class="[input, border('headline'), 'h-auto resize-none py-2']"
          />
          <input
            v-else
            id="headline"
            v-model="details.headline"
            placeholder="Your name or title"
            :class="[input, border('headline')]"
          />
        </UiField>
        <UiField :label="profile.bioLabel" for="bio" :error="errors.bio">
          <textarea
            id="bio"
            v-model="details.bio"
            rows="3"
            placeholder="One line about you"
            :class="[input, border('bio'), 'h-auto resize-none py-2']"
          />
        </UiField>
      </fieldset>

      <fieldset class="flex flex-col gap-4">
        <legend class="mb-1 text-xs text-text-2">Contact</legend>
        <div class="grid gap-3" :class="profile.phone ? 'grid-cols-2' : 'grid-cols-1'">
          <UiField label="Email" for="email" :error="errors.email">
            <input
              id="email"
              v-model="details.email"
              type="email"
              placeholder="hello@example.com"
              :class="[input, border('email')]"
            />
          </UiField>
          <UiField v-if="profile.phone" label="Phone (optional)" for="phone" :error="errors.phone">
            <input
              id="phone"
              v-model="details.phone"
              type="tel"
              placeholder="+91 00000 00000"
              :class="[input, border('phone')]"
            />
          </UiField>
        </div>
      </fieldset>

      <fieldset v-if="profile.rowsMax" class="flex flex-col gap-3">
        <legend class="mb-1 text-xs text-text-2">{{ profile.rowsLabel }}</legend>
        <div v-for="(m, i) in details.rows" :key="i" class="flex items-center gap-2">
          <input
            v-model="m.label"
            :aria-label="`${profile.rowsLabel} ${i + 1} name`"
            :placeholder="profile.rowLabelPlaceholder"
            :class="[input, border('rows')]"
          />
          <input
            v-model="m.value"
            :aria-label="`${profile.rowsLabel} ${i + 1} value`"
            :placeholder="profile.rowValuePlaceholder"
            :class="[input, border('rows')]"
          />
          <button
            type="button"
            class="cursor-pointer px-2 text-sm text-text-2 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            :aria-label="`Remove ${profile.rowsLabel} ${i + 1}`"
            :disabled="details.rows.length <= profile.rowsMin"
            @click="details.rows.splice(i, 1)"
          >
            ✕
          </button>
        </div>
        <p v-if="errors.rows" class="text-xs text-error" role="alert">{{ errors.rows }}</p>
        <button
          v-if="details.rows.length < profile.rowsMax"
          type="button"
          class="cursor-pointer self-start text-sm text-text-2 hover:text-white"
          @click="details.rows.push({ label: '', value: '' })"
        >
          + Add row
        </button>
      </fieldset>

      <fieldset v-if="profile.statsMax" class="flex flex-col gap-3">
        <legend class="mb-1 text-xs text-text-2">{{ profile.statsLabel }}</legend>
        <div v-for="(s, i) in details.stats" :key="i" class="flex items-center gap-2">
          <input
            v-model="s.value"
            :aria-label="`Stat ${i + 1} value`"
            placeholder="120K"
            :class="[input, border('stats')]"
          />
          <input
            v-model="s.label"
            :aria-label="`Stat ${i + 1} label`"
            placeholder="Followers"
            :class="[input, border('stats')]"
          />
          <button
            type="button"
            class="cursor-pointer px-2 text-sm text-text-2 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            :aria-label="`Remove stat ${i + 1}`"
            :disabled="details.stats.length <= profile.statsMin"
            @click="details.stats.splice(i, 1)"
          >
            ✕
          </button>
        </div>
        <p v-if="errors.stats" class="text-xs text-error" role="alert">{{ errors.stats }}</p>
        <button
          v-if="details.stats.length < profile.statsMax"
          type="button"
          class="cursor-pointer self-start text-sm text-text-2 hover:text-white"
          @click="details.stats.push({ value: '', label: '' })"
        >
          + Add stat
        </button>
      </fieldset>
    </template>

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
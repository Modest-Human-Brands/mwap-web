<script setup lang="ts">
import { computed } from 'vue'

import UiField from '@/components/ui/UiField.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import { config } from '@/config'
import { ACCENTS, FONTS } from '@/domain/templates'
import { MAX_MEASUREMENTS, MAX_STATS, type DetailsErrors, type SiteDetails } from '@/domain/wizard'

const props = defineProps<{
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

    <fieldset class="flex flex-col gap-4">
      <legend class="mb-1 text-xs text-text-2">Cover</legend>
      <UiField label="Headline" for="headline" :error="errors.headline">
        <input
          id="headline"
          v-model="details.headline"
          placeholder="Your name or title"
          :class="[input, border('headline')]"
        />
      </UiField>
      <UiField label="Tagline" for="bio" :error="errors.bio">
        <textarea
          id="bio"
          v-model="details.bio"
          placeholder="One line about you"
          rows="3"
          :class="[input, border('bio'), 'h-auto resize-none py-2']"
        />
      </UiField>
    </fieldset>

    <fieldset class="flex flex-col gap-3">
      <legend class="mb-1 text-xs text-text-2">Comp card measurements</legend>
      <div v-for="(m, i) in details.measurements" :key="i" class="flex items-center gap-2">
        <input
          v-model="m.label"
          :aria-label="`Measurement ${i + 1} name`"
          placeholder="Height"
          :class="[input, border('measurements')]"
        />
        <input
          v-model="m.value"
          :aria-label="`Measurement ${i + 1} value`"
          placeholder="178 cm"
          :class="[input, border('measurements')]"
        />
        <button
          type="button"
          class="cursor-pointer px-2 text-sm text-text-2 hover:text-white disabled:opacity-40"
          :aria-label="`Remove measurement ${i + 1}`"
          :disabled="details.measurements.length <= 1"
          @click="details.measurements.splice(i, 1)"
        >
          ✕
        </button>
      </div>
      <p v-if="errors.measurements" class="text-xs text-error" role="alert">
        {{ errors.measurements }}
      </p>
      <button
        v-if="details.measurements.length < MAX_MEASUREMENTS"
        type="button"
        class="cursor-pointer self-start text-sm text-text-2 hover:text-white"
        @click="details.measurements.push({ label: '', value: '' })"
      >
        + Add measurement
      </button>
    </fieldset>

    <fieldset class="flex flex-col gap-3">
      <legend class="mb-1 text-xs text-text-2">Comp card stats</legend>
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
          class="cursor-pointer px-2 text-sm text-text-2 hover:text-white"
          :aria-label="`Remove stat ${i + 1}`"
          @click="details.stats.splice(i, 1)"
        >
          ✕
        </button>
      </div>
      <p v-if="errors.stats" class="text-xs text-error" role="alert">{{ errors.stats }}</p>
      <button
        v-if="details.stats.length < MAX_STATS"
        type="button"
        class="cursor-pointer self-start text-sm text-text-2 hover:text-white"
        @click="details.stats.push({ value: '', label: '' })"
      >
        + Add stat
      </button>
    </fieldset>
    <button type="submit" class="hidden" aria-hidden="true" tabindex="-1" />
  </form>
</template>
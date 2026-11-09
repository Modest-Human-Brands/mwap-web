<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import IconChevron from '~icons/lucide/chevron-down'

import FontDialog from '@/components/brand/FontDialog.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiDialog from '@/components/ui/UiDialog.vue'
import UiField from '@/components/ui/UiField.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import SitePreview from '@/components/wizard/SitePreview.vue'
import WizardShell from '@/components/wizard/WizardShell.vue'
import { loadFont } from '@/composables/useFontLoader'
import {
  bankSummary,
  contactSummary,
  ENTITY_TYPES,
  FALLBACK_FONT,
  normalizeHex,
  siteBrand,
  SOCIAL_KEYS,
  socialsSummary,
  TRADE_RELATIONSHIPS,
  type BrandErrors,
  type OrgBrand,
} from '@/domain/brand'
import { siteAddress, templatePages } from '@/domain/wizard'
import { useBrandStore } from '@/stores/brand'
import { useWizardStore } from '@/stores/wizard'

const route = useRoute()
const router = useRouter()
const store = useBrandStore()
const wizard = useWizardStore()

const clone = (b: OrgBrand) => JSON.parse(JSON.stringify(b)) as OrgBrand
/** Where "Save & continue" and Close go: the screen that sent the user here, if it is one of ours. */
const from = computed(() => {
  const f = typeof route.query.from === 'string' ? route.query.from : ''
  return f.startsWith('/') && !f.startsWith('//') ? f : '/'
})

const draft = ref<OrgBrand>(clone(store.brand))
const initial = ref(JSON.stringify(draft.value))
const dirty = computed(() => JSON.stringify(draft.value) !== initial.value)
const errors = ref<BrandErrors>({})
const open = ref<Record<'bank' | 'contact' | 'socials', boolean>>({
  bank: false,
  contact: false,
  socials: false,
})
const dialog = ref<'font' | 'unavailable' | null>(null)
const pendingFont = ref('')

onMounted(() => {
  void store.migrate()
  void wizard.loadCatalog()
})
// A brand carried over from an existing site arrives after load: show it unless the user already typed.
watch(
  () => store.brand,
  (b) => {
    if (dirty.value) return
    draft.value = clone(b)
    initial.value = JSON.stringify(draft.value)
  },
)

const entityOptions = [
  { value: '', label: 'Not set' },
  ...ENTITY_TYPES.map((v) => ({ value: v as string, label: v })),
]
const relationshipOptions = [
  { value: '', label: 'Not set' },
  ...TRADE_RELATIONSHIPS.map((v) => ({ value: v as string, label: v })),
]
const SOCIAL_LABEL: Record<(typeof SOCIAL_KEYS)[number], string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
}

const input =
  'h-10 w-full rounded-md border bg-slate px-3 text-sm text-white placeholder:text-grey hover:border-divider focus:border-electric focus:outline-none'
const border = (key: string) => (errors.value[key] ? 'border-error' : 'border-transparent')

const logoName = computed(() => {
  const url = draft.value.logoUrl.trim()
  if (!url) return 'No logo'
  try {
    return decodeURIComponent(new URL(url).pathname.split('/').filter(Boolean).pop() ?? url)
  } catch {
    return url
  }
})
const logoBroken = ref(false)
watch(
  () => draft.value.logoUrl,
  () => (logoBroken.value = false),
)

/** A valid colour keeps its swatch; a half-typed one shows the last good one. */
const swatch = (v: string) => normalizeHex(v) ?? '#000000'

async function useFont(family: string) {
  dialog.value = null
  if (await loadFont(family)) {
    draft.value.fontFamily = family
    return
  }
  pendingFont.value = family
  dialog.value = 'unavailable'
}
function useFallback() {
  draft.value.fontFamily = FALLBACK_FONT
  dialog.value = null
}

const tpl = computed(() => wizard.backendTemplate)
const previewBrand = computed(() =>
  siteBrand(draft.value, draft.value.businessName.trim() || 'Your brand'),
)

function save() {
  errors.value = store.save(draft.value)
  const keys = Object.keys(errors.value)
  if (keys.length) {
    // Open every collapsed group that holds an error, so none stays hidden.
    for (const k of keys) {
      if (k.startsWith('bank.')) open.value.bank = true
      else if (k === 'website' || k.startsWith('socials.')) open.value.socials = true
      else if (['contactEmail', 'billingEmail', 'phone', 'whatsapp'].includes(k))
        open.value.contact = true
    }
    return
  }
  initial.value = JSON.stringify(draft.value)
  void router.push(from.value)
}
</script>

<template>
  <WizardShell
    :show-stepper="false"
    :dirty="dirty"
    :leave-to="from"
    title="Brand"
    subtitle="Set it once. Every site you create uses it."
  >
    <form class="flex flex-col gap-5" novalidate @submit.prevent="save">
      <section
        class="flex items-center gap-3 rounded-md border border-divider p-3"
        aria-label="Logo"
      >
        <span
          class="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white"
        >
          <img
            v-if="draft.logoUrl.trim() && !logoBroken"
            :src="draft.logoUrl"
            alt=""
            class="size-full object-contain"
            @error="logoBroken = true"
          />
        </span>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium">{{ logoName }}</p>
          <p class="text-xs text-text-2">
            {{
              logoBroken ? 'No preview for this link.' : 'Link to an SVG, PNG, JPG or WebP image'
            }}
          </p>
        </div>
      </section>
      <UiField label="Logo link" for="logo" :error="errors.logoUrl" hint="Square works best.">
        <input
          id="logo"
          v-model="draft.logoUrl"
          placeholder="https://…"
          inputmode="url"
          autocomplete="off"
          :class="[input, border('logoUrl')]"
        />
      </UiField>

      <div class="grid grid-cols-2 gap-3">
        <UiField label="Business name" for="bname" class="col-span-2">
          <input
            id="bname"
            v-model="draft.businessName"
            placeholder="Modest Human Brands"
            autocomplete="organization"
            :class="[input, border('businessName')]"
          />
        </UiField>
        <UiField label="Legal name" for="lname" class="col-span-2">
          <input
            id="lname"
            v-model="draft.legalName"
            placeholder="Modest Human Brands LLP"
            :class="[input, border('legalName')]"
          />
        </UiField>
        <UiField label="Address" for="address" class="col-span-2">
          <textarea
            id="address"
            v-model="draft.address"
            rows="2"
            autocomplete="street-address"
            :class="[input, 'h-auto resize-y py-2']"
          />
        </UiField>
        <UiField label="Entity" for="entity">
          <UiSelect id="entity" v-model="draft.entity" :options="entityOptions" />
        </UiField>
        <UiField label="Trade relationship" for="trade">
          <UiSelect id="trade" v-model="draft.tradeRelationship" :options="relationshipOptions" />
        </UiField>
        <UiField label="Founded" for="founded" :error="errors.foundedYear">
          <input
            id="founded"
            v-model="draft.foundedYear"
            inputmode="numeric"
            placeholder="2025"
            :class="[input, border('foundedYear')]"
          />
        </UiField>
        <UiField label="PAN" for="pan" :error="errors.pan">
          <input
            id="pan"
            v-model="draft.pan"
            placeholder="ABCDE0123F"
            autocomplete="off"
            :class="[input, border('pan'), 'uppercase']"
          />
        </UiField>
        <UiField label="GSTIN" for="gstin" :error="errors.gstin" class="col-span-2">
          <input
            id="gstin"
            v-model="draft.gstin"
            placeholder="Not registered"
            autocomplete="off"
            :class="[input, border('gstin'), 'uppercase']"
          />
        </UiField>
      </div>
      <p class="-mt-2 text-xs text-text-2">
        Legal details, bank and contact stay in this browser. They never reach a published site.
      </p>

      <div class="grid grid-cols-2 gap-3">
        <UiField label="Primary colour" for="primary" :error="errors.primary">
          <div class="relative">
            <input
              id="primary"
              v-model="draft.primary"
              maxlength="7"
              autocomplete="off"
              :class="[input, border('primary'), 'pl-11 uppercase']"
            />
            <input
              type="color"
              :value="swatch(draft.primary)"
              aria-label="Pick the primary colour"
              class="absolute top-1.5 left-2 size-7 cursor-pointer rounded border-0 bg-transparent p-0"
              @input="draft.primary = ($event.target as HTMLInputElement).value.toUpperCase()"
            />
          </div>
        </UiField>
        <UiField label="Accent" for="accent" :error="errors.accent">
          <div class="relative">
            <input
              id="accent"
              v-model="draft.accent"
              maxlength="7"
              autocomplete="off"
              :class="[input, border('accent'), 'pl-11 uppercase']"
            />
            <input
              type="color"
              :value="swatch(draft.accent)"
              aria-label="Pick the accent colour"
              class="absolute top-1.5 left-2 size-7 cursor-pointer rounded border-0 bg-transparent p-0"
              @input="draft.accent = ($event.target as HTMLInputElement).value.toUpperCase()"
            />
          </div>
        </UiField>
        <UiField label="Font" for="font" :error="errors.fontFamily" class="col-span-2">
          <button
            id="font"
            type="button"
            :class="[
              input,
              border('fontFamily'),
              'flex cursor-pointer items-center justify-between text-left',
            ]"
            @click="dialog = 'font'"
          >
            <span class="truncate">{{ draft.fontFamily }}</span>
            <span class="text-xs text-text-2">Change</span>
          </button>
        </UiField>
      </div>

      <!-- Collapsed groups: a summary line stands in for the fields -->
      <section class="rounded-md border border-divider">
        <button
          type="button"
          class="flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-left"
          :aria-expanded="open.bank"
          @click="open.bank = !open.bank"
        >
          <IconChevron
            class="size-4 text-text-2 transition-transform"
            :class="open.bank ? '' : '-rotate-90'"
          />
          <span class="flex-1 text-sm font-medium">Bank details</span>
          <span class="text-xs text-text-2">{{ bankSummary(draft) }}</span>
        </button>
        <div v-show="open.bank" class="grid grid-cols-2 gap-3 border-t border-divider p-3">
          <UiField label="Account name" for="acc-name" class="col-span-2">
            <input
              id="acc-name"
              v-model="draft.bank.accountName"
              :class="[input, 'border-transparent']"
            />
          </UiField>
          <UiField label="Bank" for="bank-name">
            <input
              id="bank-name"
              v-model="draft.bank.bankName"
              :class="[input, 'border-transparent']"
            />
          </UiField>
          <UiField label="IFSC" for="ifsc" :error="errors['bank.ifscCode']">
            <input
              id="ifsc"
              v-model="draft.bank.ifscCode"
              placeholder="HDFC0001234"
              :class="[input, border('bank.ifscCode'), 'uppercase']"
            />
          </UiField>
          <UiField
            label="Account number"
            for="acc-no"
            :error="errors['bank.accountNumber']"
            class="col-span-2"
          >
            <input
              id="acc-no"
              v-model="draft.bank.accountNumber"
              inputmode="numeric"
              autocomplete="off"
              :class="[input, border('bank.accountNumber')]"
            />
          </UiField>
        </div>
      </section>

      <section class="rounded-md border border-divider">
        <button
          type="button"
          class="flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-left"
          :aria-expanded="open.contact"
          @click="open.contact = !open.contact"
        >
          <IconChevron
            class="size-4 text-text-2 transition-transform"
            :class="open.contact ? '' : '-rotate-90'"
          />
          <span class="flex-1 text-sm font-medium">Contact</span>
          <span class="text-xs text-text-2">{{ contactSummary(draft) }}</span>
        </button>
        <div v-show="open.contact" class="grid grid-cols-2 gap-3 border-t border-divider p-3">
          <UiField label="Contact email" for="c-mail" :error="errors.contactEmail">
            <input
              id="c-mail"
              v-model="draft.contactEmail"
              type="email"
              :class="[input, border('contactEmail')]"
            />
          </UiField>
          <UiField label="Billing email" for="b-mail" :error="errors.billingEmail">
            <input
              id="b-mail"
              v-model="draft.billingEmail"
              type="email"
              :class="[input, border('billingEmail')]"
            />
          </UiField>
          <UiField label="Phone" for="phone" :error="errors.phone">
            <input
              id="phone"
              v-model="draft.phone"
              type="tel"
              placeholder="+91 …"
              :class="[input, border('phone')]"
            />
          </UiField>
          <UiField label="WhatsApp" for="wa" :error="errors.whatsapp">
            <input
              id="wa"
              v-model="draft.whatsapp"
              type="tel"
              placeholder="+91 …"
              :class="[input, border('whatsapp')]"
            />
          </UiField>
        </div>
      </section>

      <section class="rounded-md border border-divider">
        <button
          type="button"
          class="flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-left"
          :aria-expanded="open.socials"
          @click="open.socials = !open.socials"
        >
          <IconChevron
            class="size-4 text-text-2 transition-transform"
            :class="open.socials ? '' : '-rotate-90'"
          />
          <span class="flex-1 text-sm font-medium">Website &amp; socials</span>
          <span class="text-xs text-text-2">{{ socialsSummary(draft) }}</span>
        </button>
        <div v-show="open.socials" class="flex flex-col gap-3 border-t border-divider p-3">
          <UiField label="Website" for="website" :error="errors.website">
            <input
              id="website"
              v-model="draft.website"
              placeholder="https://…"
              inputmode="url"
              :class="[input, border('website')]"
            />
          </UiField>
          <UiField
            v-for="k in SOCIAL_KEYS"
            :key="k"
            :label="SOCIAL_LABEL[k]"
            :for="`social-${k}`"
            :error="errors[`socials.${k}`]"
          >
            <input
              :id="`social-${k}`"
              v-model="draft.socials[k]"
              placeholder="https://…"
              inputmode="url"
              :class="[input, border(`socials.${k}`)]"
            />
          </UiField>
        </div>
      </section>
      <button type="submit" class="hidden" aria-hidden="true" tabindex="-1" />
    </form>

    <UiDialog v-if="dialog === 'unavailable'" title="Font unavailable" @close="dialog = null">
      We couldn’t load “{{ pendingFont }}” for your site.
      <p class="mt-2 text-xs">
        Falls back to {{ FALLBACK_FONT }}. Pick another font or continue with the fallback.
      </p>
      <template #actions>
        <UiButton variant="ghost" class="border-0" @click="dialog = 'font'">Pick another</UiButton>
        <UiButton @click="useFallback">Use fallback</UiButton>
      </template>
    </UiDialog>
    <FontDialog
      v-if="dialog === 'font'"
      :current="draft.fontFamily"
      @close="dialog = null"
      @use="useFont"
    />

    <template #footer>
      <span class="text-xs text-text-2">Saved to your organisation</span>
      <div class="flex items-center gap-3">
        <UiButton variant="ghost" class="border-0" :to="from">Cancel</UiButton>
        <UiButton @click="save">Save &amp; continue</UiButton>
      </div>
    </template>

    <template #preview>
      <SitePreview
        v-if="tpl"
        title="Preview · Branded"
        :address="siteAddress('your-site')"
        :template-id="tpl.id"
        :brand="previewBrand"
        :data="{}"
        :pages="templatePages(tpl)"
      />
    </template>
  </WizardShell>
</template>
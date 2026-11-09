<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import IconCheck from '~icons/lucide/check'

import UiButton from '@/components/ui/UiButton.vue'
import SitePreview from '@/components/wizard/SitePreview.vue'
import TemplateThumb from '@/components/wizard/TemplateThumb.vue'
import WizardShell from '@/components/wizard/WizardShell.vue'
import { categoriesOf } from '@/domain/templates'
import { buildBrand, defaultsFromTemplate, siteAddress, templatePages } from '@/domain/wizard'
import { useBrandStore } from '@/stores/brand'
import { useWizardStore } from '@/stores/wizard'

const store = useWizardStore()
const brandStore = useBrandStore()
const router = useRouter()
const filter = ref<string>('All')

onMounted(() => store.loadCatalog())

const filters = computed(() => [
  { label: 'All', count: store.catalog.length },
  ...categoriesOf(store.catalog).map((c) => ({
    label: c,
    count: store.catalog.filter((t) => t.category === c).length,
  })),
])
const visible = computed(() =>
  filter.value === 'All' ? store.catalog : store.catalog.filter((t) => t.category === filter.value),
)

const tpl = computed(() => store.backendTemplate)
</script>

<template>
  <WizardShell
    title="Start from a template"
    subtitle="Pick one to preview it. You can switch any time before filling details."
  >
    <p
      v-if="!brandStore.isSet"
      class="mb-4 rounded-md border border-divider p-3 text-sm text-text-2"
    >
      Set your brand once and every site uses it.
      <RouterLink
        :to="{ name: 'brand', query: { from: '/new' } }"
        class="ml-1 text-electric hover:underline"
        >Set up branding</RouterLink
      >
    </p>
    <p v-if="store.catalogError" role="alert" class="text-sm text-text-2">
      {{ store.catalogError }}
      <button class="ml-2 cursor-pointer underline" @click="store.loadCatalog()">Retry</button>
    </p>
    <p v-else-if="!store.catalog.length" class="text-sm text-text-2">Loading…</p>
    <template v-else>
      <div class="flex flex-wrap gap-2" role="group" aria-label="Filter templates">
        <button
          v-for="f in filters"
          :key="f.label"
          type="button"
          class="h-8 cursor-pointer rounded-md border px-3 text-xs font-medium transition-colors"
          :class="
            filter === f.label
              ? 'border-white bg-white text-midnight'
              : 'border-divider text-white hover:bg-white/8'
          "
          :aria-pressed="filter === f.label"
          @click="filter = f.label"
        >
          {{ f.label }} {{ f.count }}
        </button>
      </div>

      <ul class="mt-5 grid grid-cols-3 gap-3">
        <li v-for="t in visible" :key="t.id">
          <button
            type="button"
            class="relative flex w-full cursor-pointer flex-col gap-2 rounded-md border p-3 text-left transition-colors"
            :class="
              store.templateId === t.id
                ? 'border-electric bg-electric/10'
                : 'border-divider hover:border-nickel'
            "
            :aria-pressed="store.templateId === t.id"
            @click="store.selectTemplate(t.id)"
          >
            <TemplateThumb :src="t.thumbnail" />
            <span class="text-sm font-medium">{{ t.label }}</span>
            <span class="text-xs text-text-2">{{ t.category }}</span>
            <span
              v-if="store.templateId === t.id"
              class="absolute top-5 right-5 flex size-5 items-center justify-center rounded-full bg-electric"
            >
              <IconCheck class="size-3" />
            </span>
          </button>
        </li>
      </ul>
    </template>

    <template #footer>
      <span class="text-xs text-text-2">
        {{ store.template ? `${store.template.label} selected` : 'Choose a template' }}
      </span>
      <UiButton :disabled="!store.template" @click="router.push('/new/details')">Continue</UiButton>
    </template>

    <template #preview>
      <SitePreview
        v-if="tpl && store.template"
        :title="`Preview · ${store.template.label}`"
        :address="siteAddress('your-site')"
        :template-id="tpl.id"
        :brand="buildBrand(tpl, defaultsFromTemplate(tpl, brandStore.brand))"
        :data="{}"
        :pages="templatePages(tpl)"
      />
    </template>
  </WizardShell>
</template>
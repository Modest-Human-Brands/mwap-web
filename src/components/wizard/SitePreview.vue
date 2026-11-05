<script setup lang="ts">
import { ref, watch } from 'vue'
import { useDebounceFn, useElementSize } from '@vueuse/core'

import { ApiError, templatesApi, type Brand, type SiteData } from '@/api'

const props = defineProps<{
  title: string
  address: string
  templateId: string
  brand: Brand
  data: SiteData
  pages: string[]
}>()

const DESKTOP_WIDTH = 1440

const page = ref(props.pages[0] ?? 'home')
const html = ref('')
const error = ref('')
const loading = ref(false)

const viewport = ref<HTMLElement>()
const { width, height } = useElementSize(viewport)
const scale = () => (width.value ? width.value / DESKTOP_WIDTH : 0.375)

let controller: AbortController | undefined
const render = useDebounceFn(async () => {
  controller?.abort()
  controller = new AbortController()
  loading.value = true
  try {
    const res = await templatesApi.preview(
      { templateId: props.templateId, page: page.value, brand: props.brand, data: props.data },
      controller.signal,
    )
    html.value = res.html
    error.value = ''
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return
    error.value =
      e instanceof ApiError && e.errors.length
        ? e.errors.map((x) => x.message).join(', ')
        : 'Preview unavailable'
  } finally {
    loading.value = false
  }
}, 400)

watch(() => [props.templateId, props.brand, props.data, page.value], render, {
  deep: true,
  immediate: true,
})
watch(
  () => props.pages,
  (pages) => {
    if (!pages.includes(page.value)) page.value = pages[0] ?? 'home'
  },
)

const label = (key: string) => key.charAt(0).toUpperCase() + key.slice(1)
</script>

<template>
  <section class="flex h-full flex-col gap-4" aria-label="Site preview">
    <h2 class="px-1 text-sm font-medium text-text-2">{{ title }}</h2>
    <div class="flex items-start gap-6">
      <div
        class="flex h-[640px] min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-divider bg-slate"
      >
        <div class="flex h-10 shrink-0 items-center gap-3 px-3.5">
          <span class="flex gap-1.5" aria-hidden="true">
            <i v-for="n in 3" :key="n" class="size-2.5 rounded-full bg-divider" />
          </span>
          <span class="flex-1 truncate rounded-full bg-divider px-3 py-1 text-xs text-text-2">
            {{ address }}
          </span>
        </div>
        <div ref="viewport" class="relative flex-1 overflow-hidden bg-midnight">
          <iframe
            v-if="html"
            :srcdoc="html"
            sandbox="allow-same-origin"
            title="Site preview"
            class="absolute top-0 left-0 origin-top-left border-0 bg-white transition-opacity"
            :class="loading ? 'opacity-60' : 'opacity-100'"
            :style="{
              width: `${DESKTOP_WIDTH}px`,
              height: `${height / scale()}px`,
              transform: `scale(${scale()})`,
            }"
          />
          <p
            v-if="error"
            role="alert"
            class="absolute inset-x-0 top-1/2 text-center text-sm text-text-2"
          >
            {{ error }}
          </p>
        </div>
      </div>

      <nav
        v-if="pages.length"
        class="flex flex-col gap-1 rounded-xl border border-divider bg-slate p-2"
        aria-label="Preview pages"
      >
        <button
          v-for="key in pages"
          :key="key"
          type="button"
          class="cursor-pointer rounded-md px-3 py-2 font-mono text-xs tracking-wider uppercase transition-colors"
          :class="page === key ? 'bg-electric text-white' : 'text-text-2 hover:text-white'"
          :aria-pressed="page === key"
          @click="page = key"
        >
          {{ label(key) }}
        </button>
      </nav>
    </div>
  </section>
</template>
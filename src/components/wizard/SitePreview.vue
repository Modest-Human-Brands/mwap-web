<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useDebounceFn, useElementSize } from '@vueuse/core'
import IconFit from '~icons/lucide/scan'
import IconOpen from '~icons/lucide/external-link'
import IconZoomIn from '~icons/lucide/zoom-in'
import IconZoomOut from '~icons/lucide/zoom-out'

import { ApiError, templatesApi, type Brand, type SiteData } from '@/api'
import PageRail from './PageRail.vue'

const props = withDefaults(
  defineProps<{
    title?: string
    address: string
    templateId: string
    brand: Brand
    data: SiteData
    pages: string[]
    /** Show the floating page switcher (the detail screen has its own). */
    showRail?: boolean
  }>(),
  { showRail: true },
)

const DESKTOP_WIDTH = 1440

const page = defineModel<string>('page')
const current = () => page.value ?? props.pages[0] ?? 'home'

const html = ref('')
const error = ref('')
const loading = ref(false)

/** The frame is an A4 landscape sheet that fits the space left above the toolbar. */
const A4 = Math.SQRT2
const CHROME = 40
const TOOLBAR = 64

const stage = ref<HTMLElement>()
const { width: stageW, height: stageH } = useElementSize(stage)
/** Room kept on the right for the floating page rail. */
const gutter = computed(() => (props.showRail && props.pages.length ? 104 : 0))
const frameW = computed(() =>
  Math.max(0, Math.min(stageW.value - gutter.value, (stageH.value - TOOLBAR) * A4)),
)
const frameH = computed(() => frameW.value / A4)
const viewW = computed(() => frameW.value - 2)
const viewH = computed(() => Math.max(0, frameH.value - CHROME - 2))

const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5, 2]
const zoom = ref(1)
const step = (dir: 1 | -1) => {
  const i = ZOOMS.indexOf(zoom.value) + dir
  zoom.value = ZOOMS[Math.min(ZOOMS.length - 1, Math.max(0, i))]!
}
/** 100% fits the page width into the frame. */
const scale = computed(() => (viewW.value ? (viewW.value / DESKTOP_WIDTH) * zoom.value : 0.3))

function openInTab() {
  const url = URL.createObjectURL(new Blob([html.value], { type: 'text/html' }))
  window.open(url, '_blank', 'noopener')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

let controller: AbortController | undefined
const render = useDebounceFn(async () => {
  controller?.abort()
  controller = new AbortController()
  loading.value = true
  try {
    const res = await templatesApi.preview(
      { templateId: props.templateId, page: current(), brand: props.brand, data: props.data },
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
</script>

<template>
  <section class="flex h-full min-h-0 flex-col gap-3 overflow-hidden" aria-label="Site preview">
    <h2 v-if="title" class="px-1 text-sm font-medium text-text-2">{{ title }}</h2>
    <div ref="stage" class="relative flex min-h-0 flex-1 flex-col items-center justify-center">
      <div
        class="flex w-full justify-center overflow-hidden"
        :style="{ paddingRight: `${gutter}px` }"
      >
        <div
          class="flex flex-col overflow-hidden rounded-xl border border-divider bg-slate"
          :style="{ width: `${frameW}px`, height: `${frameH}px` }"
        >
          <div class="flex shrink-0 items-center gap-3 px-3.5" :style="{ height: `${CHROME}px` }">
            <span class="flex gap-1.5" aria-hidden="true">
              <i v-for="n in 3" :key="n" class="size-2.5 rounded-full bg-divider" />
            </span>
            <span class="flex-1 truncate rounded-full bg-divider px-3 py-1 text-xs text-text-2">
              {{ address }}
            </span>
          </div>
          <div class="relative flex-1 overflow-x-auto overflow-y-hidden bg-midnight">
            <div class="relative h-full" :style="{ width: `${DESKTOP_WIDTH * scale}px` }">
              <iframe
                v-if="html"
                :srcdoc="html"
                sandbox="allow-same-origin"
                title="Site preview"
                class="absolute top-0 left-0 origin-top-left border-0 bg-white transition-opacity"
                :class="loading ? 'opacity-60' : 'opacity-100'"
                :style="{
                  width: `${DESKTOP_WIDTH}px`,
                  height: `${viewH / scale}px`,
                  transform: `scale(${scale})`,
                }"
              />
            </div>
            <p
              v-if="error"
              role="alert"
              class="absolute inset-x-0 top-1/2 text-center text-sm text-text-2"
            >
              {{ error }}
            </p>
          </div>
        </div>
      </div>

      <div
        class="flex shrink-0 items-center gap-1 self-center rounded-full border border-divider bg-slate/90 p-1.5 backdrop-blur"
        role="toolbar"
        aria-label="Preview controls"
        style="margin-top: 16px"
      >
        <button
          type="button"
          class="flex size-9 cursor-pointer items-center justify-center rounded-full text-text-2 hover:text-white disabled:opacity-40"
          aria-label="Zoom out"
          :disabled="zoom <= ZOOMS[0]!"
          @click="step(-1)"
        >
          <IconZoomOut class="size-4" />
        </button>
        <span class="w-12 text-center text-xs font-medium tabular-nums" aria-live="polite"
          >{{ Math.round(zoom * 100) }}%</span
        >
        <button
          type="button"
          class="flex size-9 cursor-pointer items-center justify-center rounded-full text-text-2 hover:text-white disabled:opacity-40"
          aria-label="Zoom in"
          :disabled="zoom >= ZOOMS[ZOOMS.length - 1]!"
          @click="step(1)"
        >
          <IconZoomIn class="size-4" />
        </button>
        <button
          type="button"
          class="flex size-9 cursor-pointer items-center justify-center rounded-full text-text-2 hover:text-white"
          aria-label="Fit to width"
          @click="zoom = 1"
        >
          <IconFit class="size-4" />
        </button>
        <button
          type="button"
          class="flex size-9 cursor-pointer items-center justify-center rounded-full bg-electric text-white hover:bg-electric-600 disabled:opacity-40"
          aria-label="Open preview in a new tab"
          :disabled="!html"
          @click="openInTab"
        >
          <IconOpen class="size-4" />
        </button>
      </div>

      <PageRail
        v-if="showRail && pages.length"
        :model-value="current()"
        :pages="pages"
        class="absolute top-1/2 right-0 -translate-y-1/2"
        @update:model-value="page = $event"
      />
    </div>
  </section>
</template>
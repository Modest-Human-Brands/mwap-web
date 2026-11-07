<script setup lang="ts">
import { useElementSize } from '@vueuse/core'
import { computed, onMounted, ref } from 'vue'

import { templatesApi } from '@/api'
import { DEFAULT_BRAND } from '@/domain/wizard'

const props = defineProps<{ templateId: string; label: string }>()

const DESKTOP_WIDTH = 1280
const box = ref<HTMLElement>()
const { width } = useElementSize(box)
const scale = computed(() => (width.value ? width.value / DESKTOP_WIDTH : 0))
const html = ref('')
const failed = ref(false)

// The service fills every missing field from the template's own sample, so an empty payload shows the template as designed.
onMounted(async () => {
  try {
    const res = await templatesApi.preview({
      templateId: props.templateId,
      brand: { ...DEFAULT_BRAND, name: props.label },
      data: {},
    })
    html.value = res.html
  } catch {
    failed.value = true
  }
})
</script>

<template>
  <span
    ref="box"
    class="relative block aspect-[16/10] w-full overflow-hidden rounded-md bg-divider"
    aria-hidden="true"
  >
    <iframe
      v-if="html && scale"
      :srcdoc="html"
      sandbox="allow-same-origin"
      tabindex="-1"
      title=""
      class="pointer-events-none absolute top-0 left-0 origin-top-left border-0 bg-white"
      :style="{
        width: `${DESKTOP_WIDTH}px`,
        height: `${(width * 10) / 16 / scale}px`,
        transform: `scale(${scale})`,
      }"
    />
    <span
      v-else-if="failed"
      class="absolute inset-0 flex items-center justify-center text-xs text-text-2"
    >
      No preview
    </span>
  </span>
</template>
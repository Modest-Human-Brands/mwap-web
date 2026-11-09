<script setup lang="ts">
import { onMounted, ref, useId, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'

import UiButton from '@/components/ui/UiButton.vue'
import UiDialog from '@/components/ui/UiDialog.vue'
import { loadFont } from '@/composables/useFontLoader'
import { useFonts } from '@/composables/useFonts'

const props = defineProps<{ current: string }>()
const emit = defineEmits<{ close: []; use: [family: string] }>()

const SAMPLE = 'The quick brown fox jumps over the lazy dog'
const { fonts, loading, offline, search } = useFonts()
const query = ref('')
const picked = ref(props.current)
const listId = useId()

const run = useDebounceFn((q: string) => search(q), 250)
watch(query, (q) => run(q))
onMounted(() => search(''))

// Each row shows its own typeface; a row that cannot load keeps the page font.
const available = ref<Record<string, boolean>>({})
watch(
  fonts,
  (list) => {
    for (const { family } of list)
      void loadFont(family).then((ok) => (available.value[family] = ok))
  },
  { immediate: true },
)
</script>

<template>
  <UiDialog title="Choose font" @close="emit('close')">
    Search the font library. Your sites use it for headings and body.
    <input
      v-model="query"
      type="search"
      placeholder="Search fonts…"
      autocomplete="off"
      aria-label="Search fonts"
      :aria-controls="listId"
      class="mt-3 h-10 w-full rounded-md border border-transparent bg-midnight px-3 text-sm text-white placeholder:text-grey hover:border-divider focus:border-electric focus:outline-none"
    />
    <ul :id="listId" class="mt-3 flex max-h-64 flex-col gap-1 overflow-y-auto" role="listbox">
      <li v-if="loading && !fonts.length" class="py-3 text-xs">Searching…</li>
      <li v-else-if="!fonts.length" class="py-3 text-xs">No fonts match “{{ query }}”.</li>
      <li v-for="f in fonts" :key="f.family">
        <button
          type="button"
          role="option"
          :aria-selected="picked === f.family"
          class="flex w-full cursor-pointer flex-col gap-0.5 rounded-md border px-3 py-2 text-left"
          :class="
            picked === f.family
              ? 'border-electric bg-electric/10'
              : 'border-divider hover:border-nickel'
          "
          @click="picked = f.family"
          @dblclick="emit('use', f.family)"
        >
          <span class="truncate text-xs text-text-2">{{ f.family }}</span>
          <span
            class="truncate text-sm text-white"
            :style="available[f.family] ? { fontFamily: `'${f.family}'` } : undefined"
            >{{ f.family }} · {{ SAMPLE }}</span
          >
        </button>
      </li>
    </ul>
    <p v-if="offline" class="mt-2 text-xs">The font library is unreachable. Showing the default.</p>
    <template #actions>
      <UiButton variant="ghost" class="border-0" @click="emit('close')">Cancel</UiButton>
      <UiButton :disabled="!picked" @click="emit('use', picked)">Use font</UiButton>
    </template>
  </UiDialog>
</template>
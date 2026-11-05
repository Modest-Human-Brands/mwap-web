<script setup lang="ts" generic="T extends string | number">
import { computed, nextTick, ref, useId } from 'vue'
import { onClickOutside } from '@vueuse/core'
import IconCheck from '~icons/lucide/check'
import IconChevron from '~icons/lucide/chevron-down'

export interface SelectOption<V> {
  value: V
  label: string
  /** Optional colour dot before the label. */
  swatch?: string
}

const props = defineProps<{
  options: SelectOption<T>[]
  /** Accessible name when no <label for> points at the button. */
  label?: string
  id?: string
  invalid?: boolean
  /** `pill` is the compact rounded variant used in headers. */
  variant?: 'field' | 'pill'
  align?: 'left' | 'right'
}>()
const model = defineModel<T>({ required: true })

const root = ref<HTMLElement>()
const list = ref<HTMLElement>()
const open = ref(false)
const active = ref(0)
const listId = useId()

const selected = computed(() => props.options.find((o) => o.value === model.value))
onClickOutside(root, () => (open.value = false))

async function show() {
  active.value = Math.max(
    0,
    props.options.findIndex((o) => o.value === model.value),
  )
  open.value = true
  await nextTick()
  list.value?.children[active.value]?.scrollIntoView({ block: 'nearest' })
}

function pick(i: number) {
  const option = props.options[i]
  if (option) model.value = option.value
  open.value = false
  root.value?.querySelector('button')?.focus()
}

function move(delta: number) {
  active.value = (active.value + delta + props.options.length) % props.options.length
  list.value?.children[active.value]?.scrollIntoView({ block: 'nearest' })
}

function onKey(e: KeyboardEvent) {
  if (!open.value) {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault()
      show()
    }
    return
  }
  if (e.key === 'ArrowDown') move(1)
  else if (e.key === 'ArrowUp') move(-1)
  else if (e.key === 'Home') active.value = 0
  else if (e.key === 'End') active.value = props.options.length - 1
  else if (e.key === 'Enter' || e.key === ' ') pick(active.value)
  else if (e.key === 'Escape') open.value = false
  else if (e.key === 'Tab') open.value = false
  else return
  if (e.key !== 'Tab') e.preventDefault()
}
</script>

<template>
  <div ref="root" class="relative" @keydown="onKey">
    <button
      :id="id"
      type="button"
      role="combobox"
      :aria-label="id ? undefined : label"
      :aria-expanded="open"
      aria-haspopup="listbox"
      :aria-controls="listId"
      class="flex w-full cursor-pointer items-center gap-2 border bg-slate text-left text-white transition-colors focus:outline-none focus-visible:border-electric"
      :class="[
        variant === 'pill' ? 'h-8 rounded-full px-3 text-sm' : 'h-10 rounded-md px-3 text-sm',
        invalid
          ? 'border-error'
          : open
            ? 'border-electric'
            : 'border-transparent hover:border-divider',
        variant === 'pill' && !invalid && !open && 'border-divider',
      ]"
      @click="open ? (open = false) : show()"
    >
      <i
        v-if="selected?.swatch"
        class="size-3 shrink-0 rounded-full"
        :style="{ background: selected.swatch }"
        aria-hidden="true"
      />
      <span class="min-w-0 flex-1 truncate">{{ selected?.label }}</span>
      <IconChevron
        class="size-4 shrink-0 text-text-2 transition-transform"
        :class="open && 'rotate-180'"
      />
    </button>
    <ul
      v-if="open"
      :id="listId"
      ref="list"
      role="listbox"
      :aria-label="label"
      class="absolute z-30 mt-1 max-h-60 min-w-full overflow-auto rounded-md border border-divider bg-slate p-1 shadow-lg"
      :class="align === 'right' ? 'right-0' : 'left-0'"
    >
      <li
        v-for="(o, i) in options"
        :key="o.value"
        role="option"
        :aria-selected="o.value === model"
        class="flex cursor-pointer items-center gap-2 rounded-sm px-2.5 py-2 text-sm whitespace-nowrap"
        :class="[
          i === active ? 'bg-white/8' : '',
          o.value === model ? 'text-white' : 'text-text-2',
        ]"
        @mouseenter="active = i"
        @click="pick(i)"
      >
        <i
          v-if="o.swatch"
          class="size-3 shrink-0 rounded-full"
          :style="{ background: o.swatch }"
          aria-hidden="true"
        />
        <span class="flex-1">{{ o.label }}</span>
        <IconCheck v-if="o.value === model" class="size-4 text-electric" />
      </li>
    </ul>
  </div>
</template>
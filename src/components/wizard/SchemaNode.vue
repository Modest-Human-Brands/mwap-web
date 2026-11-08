<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import IconChevron from '~icons/lucide/chevron-down'

import UiField from '@/components/ui/UiField.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import {
  asSchema,
  blankFor,
  getIn,
  helpFor,
  labelFor,
  pathKey,
  singular,
  widgetFor,
  type JsonSchema,
  type Path,
} from '@/domain/schema'

const props = withDefaults(
  defineProps<{
    /** Property name; for a list item, its position. */
    name: string
    schema: JsonSchema
    value: unknown
    path: Path
    errors: Record<string, string>
    required?: boolean
    /** Sections start closed unless asked; a section with an error always opens. */
    defaultOpen?: boolean
    /** Replaces the label, e.g. "Item 2" for a list entry. */
    title?: string
  }>(),
  { required: false, defaultOpen: false, title: undefined },
)
const emit = defineEmits<{ change: [path: Path, value: unknown] }>()

const key = computed(() => pathKey(props.path))
const id = computed(() => `f-${key.value.replace(/[^a-zA-Z0-9]+/g, '-')}`)
const label = computed(() => props.title ?? labelFor(props.name, props.schema))
const help = computed(() => helpFor(props.schema))
const error = computed(() => props.errors[key.value])

const issues = computed(
  () =>
    Object.keys(props.errors).filter((k) => k === key.value || k.startsWith(`${key.value}.`))
      .length,
)

const input =
  'h-10 w-full rounded-md border bg-slate px-3 text-sm text-white placeholder:text-grey hover:border-divider focus:border-electric focus:outline-none'
const border = (bad: boolean) => (bad ? 'border-error' : 'border-transparent')

// --- object sections -------------------------------------------------------------------------
const children = computed(() =>
  Object.entries(props.schema.properties ?? {})
    .filter(([k]) => k !== 'enabled')
    .map(([k, child]) => [k, asSchema(child)] as const),
)
const toggle = computed(() => 'enabled' in (props.schema.properties ?? {}))
const enabled = computed(() => getIn(props.value, ['enabled']) !== false)
const open = ref(props.defaultOpen)
watch(issues, (n) => n > 0 && (open.value = true), { immediate: true })

const valueOf = (k: string) => getIn(props.value, [k])

// --- lists -------------------------------------------------------------------------------------
const itemSchema = computed(() => asSchema(props.schema.items))
const list = computed(() => (Array.isArray(props.value) ? (props.value as unknown[]) : []))
const itemsAreObjects = computed(() => itemSchema.value.type === 'object')
const canAdd = computed(
  () => props.schema.maxItems === undefined || list.value.length < props.schema.maxItems,
)
const canRemove = computed(() => list.value.length > (props.schema.minItems ?? 0))
const ITEM_NAME = ['title', 'label', 'name', 'command', 'days', 'question', 'role', 'heading']

function itemTitle(item: unknown, i: number) {
  for (const k of ITEM_NAME) {
    const v = getIn(item, [k])
    if (typeof v === 'string' && v.trim()) return `${i + 1}. ${v.trim()}`
  }
  return `${singular(labelFor(props.name, props.schema))} ${i + 1}`
}

function move(i: number, by: -1 | 1) {
  const next = [...list.value]
  const j = i + by
  if (j < 0 || j >= next.length) return
  ;[next[i], next[j]] = [next[j]!, next[i]!]
  emit('change', props.path, next)
}
const add = () => emit('change', props.path, [...list.value, blankFor(itemSchema.value)])
const remove = (i: number) =>
  emit(
    'change',
    props.path,
    list.value.filter((_, n) => n !== i),
  )

// --- leaf fields -------------------------------------------------------------------------------
const widget = computed(() => widgetFor(props.name, props.schema))
const text = computed(() => (typeof props.value === 'string' ? props.value : ''))
const broken = ref(false)
watch(text, () => (broken.value = false))

/** An emptied optional field is left out of the data; a required one stays as an empty string. */
function setText(v: string) {
  emit('change', props.path, v === '' && !props.required ? undefined : v)
}
function setNumber(v: string) {
  emit('change', props.path, v === '' ? (props.required ? 0 : undefined) : Number(v))
}
const options = computed(() =>
  (props.schema.enum ?? []).map((o) => ({ value: String(o), label: String(o) })),
)
</script>

<template>
  <!-- A group of fields: a page, a section, a block such as contact -->
  <section
    v-if="schema.type === 'object'"
    class="rounded-md border border-divider"
    :class="toggle && !enabled && 'opacity-60'"
  >
    <header class="flex items-center gap-2 px-3 py-2.5">
      <button
        type="button"
        class="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
        :aria-expanded="open"
        :aria-controls="`${id}-body`"
        @click="open = !open"
      >
        <IconChevron
          class="size-4 shrink-0 text-text-2 transition-transform"
          :class="open ? '' : '-rotate-90'"
        />
        <span class="truncate text-sm font-medium">{{ label }}</span>
        <span v-if="issues" class="shrink-0 rounded-full bg-error/15 px-2 py-0.5 text-xs text-error"
          >{{ issues }} to fix</span
        >
      </button>
      <button
        v-if="toggle"
        type="button"
        role="switch"
        :aria-checked="enabled"
        :aria-label="`Show ${label} on the site`"
        class="relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors"
        :class="enabled ? 'bg-electric' : 'bg-divider'"
        @click="emit('change', [...path, 'enabled'], !enabled)"
      >
        <span
          class="absolute top-0.5 left-0.5 size-4 rounded-full bg-white transition-transform"
          :class="enabled ? 'translate-x-4' : ''"
        />
      </button>
    </header>
    <div v-show="open" :id="`${id}-body`" class="flex flex-col gap-4 border-t border-divider p-3">
      <p v-if="help" class="text-xs text-text-2">{{ help }}</p>
      <SchemaNode
        v-for="[k, child] in children"
        :key="k"
        :name="k"
        :schema="child"
        :value="valueOf(k)"
        :path="[...path, k]"
        :errors="errors"
        :required="schema.required?.includes(k)"
        :default-open="false"
        @change="(p, v) => emit('change', p, v)"
      />
    </div>
  </section>

  <!-- A list: rows, with add, remove and reorder -->
  <fieldset v-else-if="schema.type === 'array'" class="flex flex-col gap-2">
    <legend class="mb-1 flex w-full items-baseline justify-between text-sm font-medium">
      <span>{{ label }}</span>
      <span class="text-xs font-normal text-text-2">
        {{ list.length }}{{ schema.maxItems ? ` of ${schema.maxItems}` : '' }}
      </span>
    </legend>
    <p v-if="help" class="text-xs text-text-2">{{ help }}</p>

    <div v-for="(item, i) in list" :key="i" class="flex items-start gap-2">
      <div class="min-w-0 flex-1">
        <SchemaNode
          v-if="itemsAreObjects"
          :name="String(i)"
          :title="itemTitle(item, i)"
          :schema="itemSchema"
          :value="item"
          :path="[...path, i]"
          :errors="errors"
          required
          default-open
          @change="(p, v) => emit('change', p, v)"
        />
        <SchemaNode
          v-else
          :name="name"
          :title="`${singular(labelFor(name, schema))} ${i + 1}`"
          :schema="itemSchema"
          :value="item"
          :path="[...path, i]"
          :errors="errors"
          required
          @change="(p, v) => emit('change', p, v)"
        />
      </div>
      <div class="flex shrink-0 flex-col gap-1 pt-1.5">
        <button
          type="button"
          class="cursor-pointer rounded px-1.5 text-xs text-text-2 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          :aria-label="`Move ${singular(label)} ${i + 1} up`"
          :disabled="i === 0"
          @click="move(i, -1)"
        >
          ↑
        </button>
        <button
          type="button"
          class="cursor-pointer rounded px-1.5 text-xs text-text-2 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          :aria-label="`Move ${singular(label)} ${i + 1} down`"
          :disabled="i === list.length - 1"
          @click="move(i, 1)"
        >
          ↓
        </button>
        <button
          type="button"
          class="cursor-pointer rounded px-1.5 text-xs text-text-2 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          :aria-label="`Remove ${singular(label)} ${i + 1}`"
          :disabled="!canRemove"
          @click="remove(i)"
        >
          ✕
        </button>
      </div>
    </div>

    <p v-if="error" role="alert" class="text-xs text-error">{{ error }}</p>
    <button
      v-if="canAdd"
      type="button"
      class="cursor-pointer self-start text-sm text-text-2 hover:text-white"
      @click="add"
    >
      + Add {{ singular(labelFor(name, schema)).toLowerCase() }}
    </button>
  </fieldset>

  <!-- A single value -->
  <UiField v-else-if="widget === 'toggle'" :label="label" :for="id" :error="error" :hint="help">
    <button
      :id="id"
      type="button"
      role="switch"
      :aria-checked="value === true"
      class="relative h-5 w-9 cursor-pointer rounded-full transition-colors"
      :class="value === true ? 'bg-electric' : 'bg-divider'"
      @click="emit('change', path, value !== true)"
    >
      <span
        class="absolute top-0.5 left-0.5 size-4 rounded-full bg-white transition-transform"
        :class="value === true ? 'translate-x-4' : ''"
      />
    </button>
  </UiField>

  <UiField v-else :label="label" :for="id" :error="error" :hint="help">
    <UiSelect
      v-if="widget === 'select'"
      :id="id"
      :model-value="String(value ?? '')"
      :options="options"
      :invalid="!!error"
      @update:model-value="emit('change', path, $event)"
    />
    <textarea
      v-else-if="widget === 'textarea'"
      :id="id"
      :value="text"
      rows="3"
      :class="[input, border(!!error), 'h-auto resize-y py-2']"
      @input="setText(($event.target as HTMLTextAreaElement).value)"
    />
    <input
      v-else-if="widget === 'number'"
      :id="id"
      type="number"
      :value="typeof value === 'number' ? value : ''"
      :min="schema.minimum"
      :max="schema.maximum"
      :class="[input, border(!!error)]"
      @input="setNumber(($event.target as HTMLInputElement).value)"
    />
    <template v-else>
      <input
        :id="id"
        :type="widget === 'email' ? 'email' : 'text'"
        :value="text"
        :placeholder="
          widget === 'image' || widget === 'video' || widget === 'url' ? 'https://…' : undefined
        "
        :inputmode="widget === 'email' ? 'email' : widget === 'text' ? undefined : 'url'"
        autocomplete="off"
        :class="[input, border(!!error)]"
        @input="setText(($event.target as HTMLInputElement).value)"
      />
      <img
        v-if="widget === 'image' && text && !broken"
        :src="text"
        alt=""
        loading="lazy"
        class="mt-1 h-20 max-w-full self-start rounded-md border border-divider object-cover"
        @error="broken = true"
      />
      <video
        v-else-if="widget === 'video' && text && !broken"
        :src="text"
        muted
        preload="metadata"
        class="mt-1 h-20 max-w-full self-start rounded-md border border-divider"
        @error="broken = true"
      />
      <p
        v-if="(widget === 'image' || widget === 'video') && text && broken"
        class="text-xs text-text-2"
      >
        No preview for this link. It may still work on the site.
      </p>
    </template>
  </UiField>
</template>
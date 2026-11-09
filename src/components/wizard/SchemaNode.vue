<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import IconArrowDown from '~icons/lucide/arrow-down'
import IconArrowUp from '~icons/lucide/arrow-up'
import IconChevron from '~icons/lucide/chevron-down'
import IconPlay from '~icons/lucide/play'
import IconPlus from '~icons/lucide/plus'
import IconX from '~icons/lucide/x'

import UiField from '@/components/ui/UiField.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import {
  asSchema,
  blankFor,
  fileNameOf,
  getIn,
  helpFor,
  labelFor,
  pathKey,
  sectionSummary,
  singular,
  videoPosterOf,
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
    /** Replaces the label, e.g. "Client 2" for a list entry. */
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
const smallButton =
  'h-8 cursor-pointer rounded-md border border-divider px-3 text-xs font-medium text-white transition-colors hover:bg-white/8'

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
const summary = computed(() => sectionSummary(props.schema, props.value))

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
const itemChildren = computed(() =>
  Object.entries(itemSchema.value.properties ?? {})
    .filter(([k]) => k !== 'enabled')
    .map(([k, child]) => [k, asSchema(child)] as const),
)
/** Short single-line fields sit side by side (Client, Project, Year); anything bigger stacks. */
const itemColumns = computed(() => {
  const kids = itemChildren.value
  const short = kids.every(([k, s]) => {
    const w = widgetFor(k, s)
    return (
      s.type !== 'object' &&
      s.type !== 'array' &&
      (w === 'text' || w === 'number' || w === 'select')
    )
  })
  return short && kids.length >= 2 ? Math.min(kids.length, 3) : 1
})
const itemName = computed(() => singular(labelFor(props.name, props.schema)))
/** "2 of 6 used. At least 1 is needed." */
const listNote = computed(() => {
  const { minItems, maxItems } = props.schema
  const used = maxItems ? `${list.value.length} of ${maxItems} used.` : `${list.value.length} used.`
  return minItems ? `${used} At least ${minItems} ${minItems === 1 ? 'is' : 'are'} needed.` : used
})

function itemTitle(item: unknown, i: number) {
  for (const k of ITEM_NAME) {
    const v = getIn(item, [k])
    if (typeof v === 'string' && v.trim()) return `${itemName.value} ${i + 1} · ${v.trim()}`
  }
  return `${itemName.value} ${i + 1}`
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
const isMedia = computed(() => widget.value === 'image' || widget.value === 'video')
const text = computed(() => (typeof props.value === 'string' ? props.value : ''))
const broken = ref(false)
/** Replacing a link shows the field again; an empty or invalid value always shows it. */
const editing = ref(false)
const size = ref('')
watch(text, () => {
  broken.value = false
  size.value = ''
})
const showField = computed(() => !isMedia.value || !text.value || editing.value || !!error.value)
const poster = computed(() => (widget.value === 'video' ? videoPosterOf(text.value) : undefined))
const mediaName = computed(() => fileNameOf(text.value))
const mediaHint = computed(() => {
  if (widget.value === 'video')
    return poster.value ? 'YouTube link · preview loads on the site' : 'Video link'
  return size.value || 'Image link'
})

function onImageLoad(e: Event) {
  const img = e.target as HTMLImageElement
  size.value = img.naturalWidth ? `${img.naturalWidth} × ${img.naturalHeight}` : ''
}

/** An emptied optional field is left out of the data; a required one stays as an empty string. */
function setText(v: string) {
  emit('change', props.path, v === '' && !props.required ? undefined : v)
}
function clear() {
  editing.value = false
  emit('change', props.path, props.required ? '' : undefined)
}
function setNumber(v: string) {
  emit('change', props.path, v === '' ? (props.required ? 0 : undefined) : Number(v))
}
const options = computed(() =>
  (props.schema.enum ?? []).map((o) => ({ value: String(o), label: String(o) })),
)
</script>

<template>
  <!-- A group of fields: a section, a block such as contact -->
  <section
    v-if="schema.type === 'object'"
    class="rounded-md border border-divider"
    :class="toggle && !enabled && 'opacity-60'"
  >
    <header class="flex items-center gap-3 px-4 py-3">
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
        <span class="shrink-0 text-sm font-medium">{{ label }}</span>
        <span class="truncate text-xs text-text-2"
          >{{ name }}{{ summary ? ` · ${summary}` : ''
          }}{{ issues ? ` · ${issues} to fix` : '' }}</span
        >
      </button>
      <span v-if="issues" class="shrink-0 rounded-full bg-error/15 px-2 py-0.5 text-xs text-error"
        >{{ issues }} to fix</span
      >
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
    <div v-show="open" :id="`${id}-body`" class="flex flex-col gap-4 border-t border-divider p-4">
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

  <!-- A list: one card per item, with reorder and remove -->
  <fieldset v-else-if="schema.type === 'array'" class="flex flex-col gap-3">
    <legend class="mb-1 text-sm font-medium">{{ label }}</legend>
    <p v-if="help" class="text-xs text-text-2">{{ help }}</p>

    <div
      v-for="(item, i) in list"
      :key="i"
      class="rounded-md border border-divider p-3"
      :class="!itemsAreObjects && 'flex items-end gap-2'"
    >
      <template v-if="itemsAreObjects">
        <div class="mb-2 flex items-center justify-between gap-2">
          <span class="truncate text-xs text-text-2">{{ itemTitle(item, i) }}</span>
          <span class="flex shrink-0 items-center gap-1">
            <button
              type="button"
              class="cursor-pointer rounded p-1 text-text-2 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              :aria-label="`Move ${itemName} ${i + 1} up`"
              :disabled="i === 0"
              @click="move(i, -1)"
            >
              <IconArrowUp class="size-4" />
            </button>
            <button
              type="button"
              class="cursor-pointer rounded p-1 text-text-2 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              :aria-label="`Move ${itemName} ${i + 1} down`"
              :disabled="i === list.length - 1"
              @click="move(i, 1)"
            >
              <IconArrowDown class="size-4" />
            </button>
            <button
              type="button"
              class="cursor-pointer rounded p-1 text-text-2 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              :aria-label="`Remove ${itemName} ${i + 1}`"
              :disabled="!canRemove"
              @click="remove(i)"
            >
              <IconX class="size-4" />
            </button>
          </span>
        </div>
        <div
          class="grid gap-3"
          :class="
            itemColumns === 3 ? 'grid-cols-3' : itemColumns === 2 ? 'grid-cols-2' : 'grid-cols-1'
          "
        >
          <SchemaNode
            v-for="[k, child] in itemChildren"
            :key="k"
            :name="k"
            :schema="child"
            :value="getIn(item, [k])"
            :path="[...path, i, k]"
            :errors="errors"
            :required="itemSchema.required?.includes(k)"
            @change="(p, v) => emit('change', p, v)"
          />
        </div>
      </template>
      <template v-else>
        <div class="min-w-0 flex-1">
          <SchemaNode
            :name="name"
            :title="`${itemName} ${i + 1}`"
            :schema="itemSchema"
            :value="item"
            :path="[...path, i]"
            :errors="errors"
            required
            @change="(p, v) => emit('change', p, v)"
          />
        </div>
        <span class="flex shrink-0 items-center gap-1 pb-1.5">
          <button
            type="button"
            class="cursor-pointer rounded p-1 text-text-2 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            :aria-label="`Move ${itemName} ${i + 1} up`"
            :disabled="i === 0"
            @click="move(i, -1)"
          >
            <IconArrowUp class="size-4" />
          </button>
          <button
            type="button"
            class="cursor-pointer rounded p-1 text-text-2 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            :aria-label="`Move ${itemName} ${i + 1} down`"
            :disabled="i === list.length - 1"
            @click="move(i, 1)"
          >
            <IconArrowDown class="size-4" />
          </button>
          <button
            type="button"
            class="cursor-pointer rounded p-1 text-text-2 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            :aria-label="`Remove ${itemName} ${i + 1}`"
            :disabled="!canRemove"
            @click="remove(i)"
          >
            <IconX class="size-4" />
          </button>
        </span>
      </template>
    </div>

    <p v-if="error" role="alert" class="text-xs text-error">{{ error }}</p>
    <button
      v-if="canAdd"
      type="button"
      class="flex cursor-pointer items-center gap-1.5 self-start text-sm text-vite hover:text-white"
      @click="add"
    >
      <IconPlus class="size-4" /> Add {{ itemName.toLowerCase() }}
    </button>
    <p class="text-xs text-text-2">{{ listNote }}</p>
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
      rows="4"
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

    <!-- Image and video: a file card once there is a link, a drop-style box to paste one -->
    <template v-else-if="isMedia">
      <div
        v-if="!showField"
        class="flex items-center gap-3 rounded-md bg-slate p-2"
        :aria-label="`${label}: ${mediaName}`"
      >
        <span
          class="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded bg-divider"
        >
          <img
            v-if="widget === 'image' && !broken"
            :src="text"
            alt=""
            loading="lazy"
            class="size-full object-cover"
            @load="onImageLoad"
            @error="broken = true"
          />
          <img
            v-else-if="poster && !broken"
            :src="poster"
            alt=""
            loading="lazy"
            class="size-full object-cover"
            @error="broken = true"
          />
          <IconPlay
            v-if="widget === 'video'"
            class="absolute size-5 rounded-full bg-black/60 p-1 text-white"
          />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block truncate text-sm">{{ mediaName }}</span>
          <span class="block truncate text-xs text-text-2">{{
            broken ? 'No preview for this link. It may still work on the site.' : mediaHint
          }}</span>
        </span>
        <button type="button" :class="smallButton" @click="editing = true">Replace</button>
        <button v-if="!required" type="button" :class="smallButton" @click="clear">Remove</button>
      </div>
      <div
        v-else
        class="flex flex-col gap-2 rounded-md border border-dashed p-3"
        :class="error ? 'border-error' : 'border-divider'"
      >
        <input
          :id="id"
          :value="text"
          :placeholder="
            widget === 'video' ? 'Paste a YouTube or video link' : 'Paste an image link (https://…)'
          "
          inputmode="url"
          autocomplete="off"
          :class="[input, 'bg-midnight', border(!!error)]"
          @input="setText(($event.target as HTMLInputElement).value)"
        />
        <span class="flex items-center justify-between gap-2 text-xs text-text-2">
          <span>{{
            widget === 'video'
              ? `YouTube or video link${required ? '' : ' · optional'}`
              : `JPG, PNG or WebP link${required ? '' : ' · optional'}`
          }}</span>
          <button
            v-if="editing && text"
            type="button"
            :class="smallButton"
            @click="editing = false"
          >
            Done
          </button>
        </span>
      </div>
    </template>

    <input
      v-else
      :id="id"
      :type="widget === 'email' ? 'email' : 'text'"
      :value="text"
      :placeholder="widget === 'url' ? 'https://…' : undefined"
      :inputmode="widget === 'email' ? 'email' : widget === 'text' ? undefined : 'url'"
      autocomplete="off"
      :class="[input, border(!!error)]"
      @input="setText(($event.target as HTMLInputElement).value)"
    />
  </UiField>
</template>
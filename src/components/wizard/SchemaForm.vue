<script setup lang="ts">
import { computed } from 'vue'

import type { SiteData } from '@/api'
import SchemaNode from '@/components/wizard/SchemaNode.vue'
import {
  asSchema,
  getIn,
  humanize,
  labelFor,
  setIn,
  type JsonSchema,
  type Path,
} from '@/domain/schema'

const props = defineProps<{
  /** The template's `data` schema. */
  schema: JsonSchema
  data: SiteData
  /** One message per failing path, see `validateData`. */
  errors: Record<string, string>
}>()
const emit = defineEmits<{ 'update:data': [value: SiteData] }>()

function change(path: Path, value: unknown) {
  emit('update:data', setIn(props.data, path, value))
}

const props_ = computed(() => Object.entries(props.schema.properties ?? {}))
/** Everything outside `pages` (seo, contact, navigation…): site-wide content. */
const siteWide = computed(() => props_.value.filter(([k]) => k !== 'pages'))
const pages = computed(() =>
  Object.entries(asSchema(getIn(props.schema, ['properties', 'pages'])).properties ?? {}),
)
const supported = computed(() => props_.value.length > 0)
</script>

<template>
  <div v-if="supported" class="flex flex-col gap-6">
    <fieldset v-for="[page, pageSchema] in pages" :key="page" class="flex flex-col gap-3">
      <legend class="mb-1 text-xs text-text-2">
        {{
          pages.length > 1 ? `${labelFor(page, pageSchema) || humanize(page)} page` : 'Page content'
        }}
      </legend>
      <SchemaNode
        v-for="[section, sectionSchema] in Object.entries(pageSchema.properties ?? {}).filter(
          ([, s]) => s.type === 'object',
        )"
        :key="section"
        :name="section"
        :schema="sectionSchema"
        :value="getIn(data, ['pages', page, section])"
        :path="['pages', page, section]"
        :errors="errors"
        @change="change"
      />
      <!-- Plain fields of the page itself: its title and description -->
      <SchemaNode
        v-for="[field, fieldSchema] in Object.entries(pageSchema.properties ?? {}).filter(
          ([, s]) => s.type !== 'object',
        )"
        :key="field"
        :name="field"
        :schema="fieldSchema"
        :value="getIn(data, ['pages', page, field])"
        :path="['pages', page, field]"
        :errors="errors"
        :required="pageSchema.required?.includes(field)"
        @change="change"
      />
    </fieldset>

    <fieldset v-if="siteWide.length" class="flex flex-col gap-3">
      <legend class="mb-1 text-xs text-text-2">Site-wide</legend>
      <SchemaNode
        v-for="[key, child] in siteWide"
        :key="key"
        :name="key"
        :schema="child"
        :value="getIn(data, [key])"
        :path="[key]"
        :errors="errors"
        :required="schema.required?.includes(key)"
        @change="change"
      />
    </fieldset>
  </div>
  <p v-else class="text-sm text-text-2">
    This template has no editable content. Only the name, address and brand can change.
  </p>
</template>
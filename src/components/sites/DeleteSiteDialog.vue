<script setup lang="ts">
import { ref } from 'vue'

import { ApiError, sitesApi } from '@/api'
import UiButton from '@/components/ui/UiButton.vue'
import UiDialog from '@/components/ui/UiDialog.vue'
import { clearSiteMeta } from '@/mock/siteMeta'

const props = defineProps<{ name: string; slug: string }>()
const emit = defineEmits<{ close: []; deleted: [] }>()

const deleting = ref(false)
const error = ref('')

async function confirm() {
  deleting.value = true
  error.value = ''
  try {
    await sitesApi.remove(props.slug)
  } catch (e) {
    error.value =
      e instanceof ApiError
        ? e.status === 409
          ? 'This site is not stored through the API (the built-in example or a Notion row), so it cannot be deleted here.'
          : e.status === 401
            ? 'The service rejected the API key (dev setup: set VITE_MWAP_API_KEY).'
            : e.status === 404
              ? 'The service could not find this site, or does not support deleting yet.'
              : e.message
        : 'Could not reach the MWap service'
    deleting.value = false
    return
  }
  clearSiteMeta(props.slug)
  emit('deleted')
}
</script>

<template>
  <UiDialog :title="`Delete &quot;${name}&quot;?`" @close="emit('close')">
    The site and its pages are removed for good, and its custom domains are freed. This cannot be
    undone.
    <p v-if="error" role="alert" class="mt-3 text-error">{{ error }}</p>
    <template #actions>
      <UiButton variant="ghost" class="border-0" @click="emit('close')">Cancel</UiButton>
      <UiButton :disabled="deleting" @click="confirm">
        {{ deleting ? 'Deleting…' : 'Delete site' }}
      </UiButton>
    </template>
  </UiDialog>
</template>
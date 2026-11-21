<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'

import { ApiError } from '@/api'
import { verifyAccess } from '@/api/access'
import UiButton from '@/components/ui/UiButton.vue'
import UiField from '@/components/ui/UiField.vue'
import { accessErrors, loadAccess, safeNext, saveAccess, type Access } from '@/domain/access'

const route = useRoute()

// Only what was saved in this browser is offered back. The runtime and build values are never shown or copied into the form.
const form = reactive<Access>(loadAccess())
const submitted = ref(false)
const busy = ref(false)
const serverError = ref('')

const errors = computed(() => (submitted.value ? accessErrors(form) : {}))

const input =
  'h-10 w-full rounded-md border bg-midnight px-3 text-sm text-white placeholder:text-grey hover:border-divider focus:border-electric focus:outline-none'
const border = (key: keyof Access) => (errors.value[key] ? 'border-error' : 'border-divider')

async function connect() {
  submitted.value = true
  serverError.value = ''
  if (Object.keys(accessErrors(form)).length) return
  busy.value = true
  try {
    await verifyAccess(form)
    saveAccess(form)
    // A full load, so the API client and every store start from the saved details.
    window.location.assign(
      `${import.meta.env.BASE_URL.replace(/\/$/, '')}${safeNext(route.query.next)}`,
    )
  } catch (error) {
    serverError.value =
      error instanceof ApiError ? error.message : 'Could not reach MWap. Try again in a moment.'
    busy.value = false
  }
}
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-midnight p-6">
    <form
      class="flex w-md max-w-full flex-col gap-5 rounded-xl bg-slate p-6"
      aria-labelledby="connect-title"
      novalidate
      @submit.prevent="connect"
    >
      <div class="flex items-center gap-2">
        <span
          class="flex size-6 items-center justify-center rounded-sm bg-white text-xs font-semibold text-midnight"
          aria-hidden="true"
          >M</span
        >
        <span class="text-sm font-medium">MWap</span>
      </div>

      <h1 id="connect-title" class="text-xl">Connect to MWap</h1>
      <p class="text-sm text-text-2">
        The organization scopes what you see. The API key grants access. Details stay in this
        browser.
      </p>

      <UiField label="Organization ID" for="org" :error="errors.organizationId">
        <input
          id="org"
          v-model="form.organizationId"
          placeholder="modest-human-brands"
          autocomplete="organization"
          autocapitalize="off"
          spellcheck="false"
          :class="[input, border('organizationId')]"
        />
      </UiField>
      <UiField label="User ID" for="user" :error="errors.userId">
        <input
          id="user"
          v-model="form.userId"
          placeholder="Your user id"
          autocomplete="username"
          autocapitalize="off"
          spellcheck="false"
          :class="[input, border('userId')]"
        />
      </UiField>
      <UiField label="API key" for="key" :error="errors.apiKey">
        <input
          id="key"
          v-model="form.apiKey"
          type="password"
          placeholder="••••••••••••"
          autocomplete="current-password"
          :class="[input, border('apiKey')]"
        />
      </UiField>

      <p v-if="serverError" role="alert" class="text-sm text-error">{{ serverError }}</p>

      <UiButton type="submit" class="w-full" :disabled="busy">
        {{ busy ? 'Connecting…' : 'Continue' }}
      </UiButton>
    </form>
  </main>
</template>
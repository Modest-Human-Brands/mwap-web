<script setup lang="ts">
import { onMounted, ref } from 'vue'

import SiteColumn from '@/components/sites/SiteColumn.vue'
import SitesEmpty from '@/components/sites/SitesEmpty.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiDialog from '@/components/ui/UiDialog.vue'
import type { SiteCard } from '@/domain/site'
import { useSitesStore } from '@/stores/sites'

const store = useSitesStore()
const archiving = ref<SiteCard>()

onMounted(() => store.load())

function confirmArchive() {
  if (archiving.value) store.setStatus(archiving.value.slug, 'archived')
  archiving.value = undefined
}
</script>

<template>
  <main class="flex flex-col gap-5 p-8">
    <div class="flex h-9 items-center justify-between gap-3">
      <h1 class="text-xl font-medium">Sites</h1>
      <input
        v-model="store.search"
        type="search"
        placeholder="Search sites"
        aria-label="Search sites"
        class="h-9 w-40 rounded-md border border-divider bg-white/8 px-3 text-sm text-white placeholder:text-grey focus:border-electric focus:outline-none"
      />
    </div>

    <p v-if="store.error" role="alert" class="text-sm text-text-2">
      {{ store.error }}
      <button class="ml-2 cursor-pointer underline" @click="store.load()">Retry</button>
    </p>
    <p v-else-if="!store.loaded" class="text-sm text-text-2">Loading…</p>
    <SitesEmpty
      v-else-if="!store.filtered.length"
      :searching="!!store.search.trim()"
      @clear="store.search = ''"
    />
    <div v-else class="flex items-start gap-3 overflow-x-auto pb-4">
      <SiteColumn
        v-for="col in store.columns"
        :key="col.status"
        :status="col.status"
        :sites="col.sites"
        @archive="archiving = $event"
      />
    </div>

    <UiDialog
      v-if="archiving"
      :title="`Archive &quot;${archiving.name}&quot;?`"
      @close="archiving = undefined"
    >
      It moves to Archived and stays there until you restore it.
      <template #actions>
        <UiButton variant="ghost" class="border-0" @click="archiving = undefined">Cancel</UiButton>
        <UiButton @click="confirmArchive">Archive</UiButton>
      </template>
    </UiDialog>
  </main>
</template>
<script setup lang="ts">
import { onMounted } from 'vue'

import AppTopBar from '@/components/layout/AppTopBar.vue'
import { useBrandStore } from '@/stores/brand'

// Earlier sites keep their look: the first visit carries the oldest site's brand over to the organisation.
onMounted(() => void useBrandStore().migrate())
</script>

<template>
  <div class="min-h-screen">
    <AppTopBar v-if="!$route.meta.bare" />
    <RouterView />
  </div>
</template>
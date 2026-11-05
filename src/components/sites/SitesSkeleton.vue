<template>
  <div class="flex items-start gap-3 overflow-hidden" role="status" aria-label="Loading sites">
    <div v-for="col in 4" :key="col" class="flex w-64 shrink-0 animate-pulse flex-col gap-3">
      <div class="h-10 rounded-full bg-divider" />
      <div v-for="card in col % 2 ? 2 : 1" :key="card" class="h-[342px] rounded-lg bg-slate" />
    </div>
  </div>
</template>
<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 36 })
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 64 64" fill="none" aria-hidden="true" class="brand-mark">
    <defs>
      <linearGradient id="brand-mark-gradient" x1="6" y1="4" x2="58" y2="62" gradientUnits="userSpaceOnUse">
        <stop stop-color="#1a8a75" />
        <stop offset="1" stop-color="#0a4a40" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="19" fill="url(#brand-mark-gradient)" />
    <path
      d="M17 24.5C17 21.46 19.46 19 22.5 19h19c3.04 0 5.5 2.46 5.5 5.5v12c0 3.04-2.46 5.5-5.5 5.5H33.6l-7.2 5.1a1 1 0 0 1-1.58-.81V42.6A5.5 5.5 0 0 1 17 37.4V24.5Z"
      fill="#f7f3e8"
    />
    <path d="M25 29h14" stroke="#0e6a5b" stroke-width="2.4" stroke-linecap="round" />
    <path d="M25 35h9" stroke="#0e6a5b" stroke-width="2.4" stroke-linecap="round" opacity="0.62" />
  </svg>
</template>

<style scoped>
.brand-mark {
  display: block;
  flex: none;
}
</style>

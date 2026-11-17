<script setup lang="ts">
import { state } from '../stores/chat'
</script>

<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="state.toast" :key="state.toast.id" class="toast" role="status" aria-live="polite">
        {{ state.toast.text }}
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.toast {
  position: fixed;
  z-index: 120;
  left: 50%;
  bottom: 96px;
  transform: translate(-50%, 0);
  max-width: min(86vw, 420px);
  padding: 10px 18px;
  border-radius: 999px;
  background: #14261f;
  color: #f4f7f2;
  font-size: 12.5px;
  line-height: 1.4;
  text-align: center;
  box-shadow: 0 12px 30px rgba(16, 31, 27, 0.28);
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}
</style>

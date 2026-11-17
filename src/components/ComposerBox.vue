<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps<{ streaming: boolean }>()
const emit = defineEmits<{ send: [text: string]; stop: [] }>()

const draft = ref('')
const textarea = ref<HTMLTextAreaElement | null>(null)

function submit(): void {
  const text = draft.value.trim()
  if (!text || props.streaming) return
  emit('send', text)
  draft.value = ''
  nextTick(() => {
    resize()
    textarea.value?.focus()
  })
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault()
    submit()
  }
}

function resize(): void {
  const element = textarea.value
  if (!element) return
  element.style.height = 'auto'
  element.style.height = `${Math.min(element.scrollHeight, 168)}px`
}

onMounted(() => {
  if (window.innerWidth > 900) {
    textarea.value?.focus()
  }
})
</script>

<template>
  <div class="composer-wrap">
    <div class="composer">
      <textarea
        ref="textarea"
        v-model="draft"
        class="composer-input"
        rows="1"
        placeholder="问点什么，比如：期末缓考怎么申请？"
        aria-label="输入你的问题"
        @keydown="onKeydown"
        @input="resize"
      ></textarea>

      <div class="composer-bar">
        <span class="composer-tip">Enter 发送 · Shift + Enter 换行</span>

        <button
          v-if="streaming"
          class="stop-btn"
          type="button"
          aria-label="停止生成"
          @click="emit('stop')"
        >
          <AppIcon name="stop" :size="13" />
          <span>停止</span>
        </button>

        <button
          v-else
          class="send-btn"
          type="button"
          :disabled="!draft.trim()"
          aria-label="发送问题"
          @click="submit"
        >
          <AppIcon name="send" :size="17" />
        </button>
      </div>
    </div>

    <p class="composer-foot">演示版不发送任何数据到服务器 · 回答来自本地预设</p>
  </div>
</template>

<style scoped>
.composer-wrap {
  flex: none;
  width: 100%;
  max-width: 840px;
  margin: 0 auto;
  padding: 8px 26px 16px;
}

.composer {
  padding: 11px 12px 8px 15px;
  border: 1px solid var(--line-strong);
  border-radius: 16px;
  background: var(--panel);
  box-shadow: 0 2px 10px rgba(26, 37, 30, 0.045);
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.composer:focus-within {
  border-color: rgba(14, 106, 91, 0.45);
  box-shadow: 0 0 0 3px rgba(14, 106, 91, 0.08), 0 6px 20px rgba(26, 37, 30, 0.06);
}

.composer-input {
  display: block;
  width: 100%;
  min-height: 26px;
  max-height: 168px;
  padding: 2px 2px 6px 0;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  color: var(--ink);
  font-size: 14.5px;
  line-height: 1.65;
}

.composer-input::placeholder {
  color: var(--ink-3);
}

.composer-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.composer-tip {
  font-size: 10.5px;
  letter-spacing: 0.01em;
  color: var(--ink-3);
}

.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex: none;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  box-shadow: 0 3px 10px rgba(14, 106, 91, 0.28);
  transition: background 0.16s ease, transform 0.16s ease, box-shadow 0.16s ease;
}

.send-btn:hover:not(:disabled) {
  background: var(--accent-strong);
  transform: translateY(-1px);
  box-shadow: 0 5px 14px rgba(14, 106, 91, 0.3);
}

.send-btn:active:not(:disabled) {
  transform: translateY(0);
}

.send-btn:disabled {
  background: #e3dfd5;
  color: #a49c8e;
  box-shadow: none;
  cursor: not-allowed;
}

.stop-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  background: var(--panel);
  color: var(--ink-2);
  font-size: 12px;
  transition: border-color 0.16s ease, color 0.16s ease;
}

.stop-btn:hover {
  border-color: rgba(179, 69, 62, 0.4);
  color: var(--danger);
}

.composer-foot {
  margin: 8px 0 0;
  text-align: center;
  font-size: 10.5px;
  color: var(--ink-3);
}

@media (max-width: 640px) {
  .composer-wrap {
    padding: 6px 12px 12px;
  }

  .composer {
    padding: 10px 10px 7px 13px;
  }

  .composer-tip {
    display: none;
  }

  .composer-bar {
    justify-content: flex-end;
  }

  .composer-foot {
    font-size: 10px;
    padding-bottom: env(safe-area-inset-bottom);
  }
}
</style>

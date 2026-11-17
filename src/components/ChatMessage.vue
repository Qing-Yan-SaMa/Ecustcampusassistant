<script setup lang="ts">
import { computed } from 'vue'
import BrandMark from './BrandMark.vue'
import AppIcon from './AppIcon.vue'
import type { ChatMessage as ChatMessageModel, SourceRef } from '../types'
import { renderMarkdown } from '../utils/markdown'
import { formatClock } from '../utils/format'
import { showToast } from '../stores/chat'

const props = defineProps<{
  message: ChatMessageModel
  isLast: boolean
}>()

const emit = defineEmits<{
  ask: [question: string]
  'open-source': [source: SourceRef]
  regenerate: []
  feedback: [id: string, value: 'up' | 'down']
}>()

const html = computed(() => renderMarkdown(props.message.content))
const isBusy = computed(
  () => props.message.status === 'pending' || props.message.status === 'streaming',
)
const isStreaming = computed(() => props.message.status === 'streaming')
const answerLabel = computed(() => {
  if (props.message.sources.some((source) => source.tag === '公众号')) return '公众号摘录'
  if (props.message.status === 'done' && !props.message.matched) return '提示'
  return '预设回答'
})

function onContentClick(event: MouseEvent): void {
  openCite(event.target as HTMLElement | null)
}

function onContentKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Enter' && event.key !== ' ') return
  const target = event.target as HTMLElement | null
  if (target?.classList.contains('cite')) {
    event.preventDefault()
    openCite(target)
  }
}

function openCite(target: HTMLElement | null): void {
  const cite = target?.closest<HTMLElement>('.cite')
  if (!cite) return
  const index = Number(cite.dataset.cite) - 1
  const source = props.message.sources[index]
  if (source) emit('open-source', source)
}

async function copy(): Promise<void> {
  const text = props.message.content
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }
  showToast('回答已复制')
}
</script>

<template>
  <div class="msg" :class="message.role">
    <template v-if="message.role === 'user'">
      <div class="user-bubble">{{ message.content }}</div>
      <div class="avatar user-avatar" aria-hidden="true">我</div>
    </template>

    <template v-else>
      <div class="avatar assistant-avatar">
        <BrandMark :size="30" />
      </div>

      <div class="assistant-body">
        <div class="assistant-head">
          <span class="assistant-name">校园助手</span>
          <span class="answer-badge" :class="{ corpus: answerLabel === '公众号摘录' }">
            {{ answerLabel }}
          </span>
          <span v-if="message.status === 'stopped'" class="state-badge">已停止</span>
          <span v-else-if="message.status === 'error'" class="state-badge error">出错了</span>
          <span v-else-if="message.status === 'done' && !message.matched" class="state-badge">
            未命中知识库
          </span>
        </div>

        <div v-if="!message.content && isBusy" class="typing" aria-label="正在生成回答">
          <span></span><span></span><span></span>
        </div>

        <template v-else>
          <div class="answer-card">
            <div
              class="markdown"
              :class="{ 'is-streaming': isStreaming }"
              v-html="html"
              @click="onContentClick"
              @keydown="onContentKeydown"
            ></div>
          </div>

          <div v-if="message.sources.length" class="sources">
            <span class="sources-label">依据</span>
            <button
              v-for="(source, index) in message.sources"
              :key="source.id"
              class="source-chip"
              type="button"
              @click="emit('open-source', source)"
            >
              <span class="source-index">{{ index + 1 }}</span>
              <span class="source-name">{{ source.title }}</span>
              <span class="source-date">{{ source.date }}</span>
            </button>
          </div>

          <div v-if="message.status === 'done' && message.followups.length" class="followups">
            <button
              v-for="question in message.followups"
              :key="question"
              class="followup"
              type="button"
              @click="emit('ask', question)"
            >
              <span>{{ question }}</span>
              <AppIcon name="arrow-right" :size="13" />
            </button>
          </div>

          <div class="actions">
            <button class="icon-btn" type="button" title="复制回答" aria-label="复制回答" @click="copy">
              <AppIcon name="copy" :size="15" />
            </button>
            <button
              v-if="isLast && message.status === 'done'"
              class="icon-btn"
              type="button"
              title="重新生成"
              aria-label="重新生成"
              @click="emit('regenerate')"
            >
              <AppIcon name="refresh" :size="15" />
            </button>
            <button
              class="icon-btn"
              :class="{ 'is-active': message.feedback === 'up' }"
              type="button"
              title="有帮助"
              aria-label="这个回答有帮助"
              :aria-pressed="message.feedback === 'up'"
              @click="emit('feedback', message.id, 'up')"
            >
              <AppIcon name="thumb-up" :size="15" />
            </button>
            <button
              class="icon-btn"
              :class="{ 'is-active': message.feedback === 'down' }"
              type="button"
              title="没帮助"
              aria-label="这个回答没帮助"
              :aria-pressed="message.feedback === 'down'"
              @click="emit('feedback', message.id, 'down')"
            >
              <AppIcon name="thumb-down" :size="15" />
            </button>
            <span class="msg-time">{{ formatClock(message.createdAt) }}</span>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<style scoped>
.msg {
  display: flex;
  gap: 11px;
  animation: msg-in 0.28s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.msg.user {
  justify-content: flex-end;
  align-items: flex-start;
  padding-left: 56px;
}

.avatar {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  margin-top: 2px;
  border-radius: 50%;
}

.user-avatar {
  background: #ddd7c8;
  color: #6a6355;
  font-size: 12px;
  font-weight: 600;
}

.assistant-avatar {
  border-radius: 9px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(10, 74, 64, 0.18);
}

.user-bubble {
  max-width: 78%;
  padding: 11px 15px;
  border-radius: 16px 4px 16px 16px;
  background: var(--accent);
  color: #fff;
  font-size: 14.5px;
  line-height: 1.68;
  white-space: pre-wrap;
  word-break: break-word;
  box-shadow: 0 2px 10px rgba(14, 106, 91, 0.18);
}

.assistant-body {
  flex: 1;
  min-width: 0;
  max-width: 760px;
}

.assistant-head {
  display: flex;
  align-items: center;
  gap: 7px;
  min-height: 30px;
}

.assistant-name {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ink-2);
}

.answer-badge {
  padding: 2px 6px;
  border-radius: 5px;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.answer-badge.corpus {
  background: #e9f4e5;
  color: #2f7d32;
}

.state-badge {
  padding: 2px 6px;
  border-radius: 5px;
  background: #f1eee7;
  color: var(--ink-3);
  font-size: 10px;
}

.state-badge.error {
  background: #fbeaea;
  color: var(--danger);
}

.typing {
  display: flex;
  gap: 4px;
  width: max-content;
  margin-top: 8px;
  padding: 15px 17px;
  border: 1px solid var(--line);
  border-radius: 4px 16px 16px 16px;
  background: var(--panel);
  box-shadow: var(--shadow-sm);
}

.typing span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  opacity: 0.3;
  animation: typing 1.15s ease-in-out infinite;
}

.typing span:nth-child(2) {
  animation-delay: 0.14s;
}

.typing span:nth-child(3) {
  animation-delay: 0.28s;
}

.answer-card {
  margin-top: 8px;
  padding: 15px 18px;
  border: 1px solid var(--line);
  border-radius: 4px 16px 16px 16px;
  background: var(--panel);
  box-shadow: var(--shadow-sm);
}

.sources {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px;
  margin-top: 10px;
}

.sources-label {
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--ink-3);
}

.source-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  max-width: 100%;
  padding: 5px 9px 5px 5px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: var(--panel-2);
  color: var(--ink-2);
  font-size: 11.5px;
  transition: border-color 0.16s ease, background 0.16s ease, transform 0.16s ease;
}

.source-chip:hover {
  border-color: rgba(14, 106, 91, 0.32);
  background: #fff;
  transform: translateY(-1px);
}

.source-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 17px;
  height: 17px;
  border-radius: 5px;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 10px;
  font-weight: 700;
}

.source-name {
  max-width: 250px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.source-date {
  padding-left: 7px;
  border-left: 1px solid var(--line);
  font-size: 10px;
  color: var(--ink-3);
}

.followups {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 11px;
}

.followup {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 11px;
  border: 1px solid rgba(14, 106, 91, 0.2);
  border-radius: 999px;
  background: rgba(14, 106, 91, 0.045);
  color: var(--accent-ink);
  font-size: 12px;
  transition: background 0.16s ease, border-color 0.16s ease;
}

.followup:hover {
  background: var(--accent-soft);
  border-color: rgba(14, 106, 91, 0.36);
}

.actions {
  display: flex;
  align-items: center;
  gap: 1px;
  margin-top: 6px;
  opacity: 0.72;
  transition: opacity 0.16s ease;
}

.msg:hover .actions,
.actions:focus-within {
  opacity: 1;
}

.msg-time {
  margin-left: 6px;
  font-size: 10.5px;
  color: var(--ink-3);
}

@keyframes typing {
  0%,
  60%,
  100% {
    opacity: 0.25;
    transform: translateY(0);
  }
  30% {
    opacity: 0.9;
    transform: translateY(-3px);
  }
}

@keyframes msg-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 640px) {
  .msg.user {
    padding-left: 30px;
  }

  .user-bubble {
    max-width: 88%;
    font-size: 14px;
  }

  .answer-card {
    padding: 13px 14px;
  }

  .source-name {
    max-width: 170px;
  }

  .source-date {
    display: none;
  }
}
</style>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import WelcomeScreen from './WelcomeScreen.vue'
import ChatMessage from './ChatMessage.vue'
import ComposerBox from './ComposerBox.vue'
import { route } from '../router'
import {
  activeSession,
  feedback,
  newChat,
  openSource,
  regenerate,
  send,
  state,
  stop,
} from '../stores/chat'

const scrollRef = ref<HTMLElement | null>(null)
const atBottom = ref(true)
const consumedQuery = ref('')

function onScroll(): void {
  const element = scrollRef.value
  if (!element) return
  atBottom.value = element.scrollHeight - element.scrollTop - element.clientHeight < 96
}

function scrollToBottom(smooth = false): void {
  const element = scrollRef.value
  if (!element) return
  element.scrollTo({ top: element.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
}

async function handleAsk(question: string): Promise<void> {
  atBottom.value = true
  const task = send(question)
  await nextTick()
  scrollToBottom()
  await task
}

watch(
  () => {
    const session = activeSession.value
    if (!session) return ''
    return session.messages
      .map((message) => `${message.id}:${message.status}:${message.content.length}`)
      .join('|')
  },
  async () => {
    if (!atBottom.value) return
    await nextTick()
    scrollToBottom()
  },
)

watch(
  () => activeSession.value?.id,
  async () => {
    atBottom.value = true
    await nextTick()
    scrollToBottom()
  },
)

watch(
  () => [route.name, route.query],
  async ([name, query]) => {
    if (name !== 'assistant' || !query || query === consumedQuery.value) return
    consumedQuery.value = String(query)
    newChat()
    await nextTick()
    await handleAsk(String(query))
  },
  { immediate: true },
)

onMounted(() => {
  if (activeSession.value) scrollToBottom()
})
</script>

<template>
  <div class="assistant-page">
    <div ref="scrollRef" class="chat-scroll" @scroll.passive="onScroll">
      <WelcomeScreen v-if="!activeSession" @ask="handleAsk" />

      <div v-else class="thread">
        <ChatMessage
          v-for="(message, index) in activeSession.messages"
          :key="message.id"
          :message="message"
          :is-last="index === activeSession.messages.length - 1"
          @ask="handleAsk"
          @open-source="openSource"
          @regenerate="regenerate"
          @feedback="feedback"
        />
      </div>
    </div>

    <Transition name="jump">
      <button
        v-if="activeSession && !atBottom"
        class="jump-btn"
        type="button"
        @click="scrollToBottom(true)"
      >
        <span>回到底部</span>
        <AppIcon name="arrow-right" :size="14" />
      </button>
    </Transition>

    <ComposerBox :streaming="state.streaming" @send="handleAsk" @stop="stop" />
  </div>
</template>

<style scoped>
.assistant-page {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 6px 26px 0;
  background:
    radial-gradient(circle at 72% -8%, rgba(14, 106, 91, 0.055), transparent 44%),
    var(--bg);
}

.thread {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 840px;
  margin: 0 auto;
  padding: 26px 0 10px;
}

.jump-btn {
  position: absolute;
  right: 30px;
  bottom: 108px;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 5px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  background: var(--panel);
  color: var(--ink-2);
  font-size: 11.5px;
  box-shadow: var(--shadow-sm);
}

.jump-btn:hover {
  color: var(--accent);
  border-color: rgba(14, 106, 91, 0.35);
}

.jump-btn :deep(svg) {
  transform: rotate(90deg);
}

.jump-enter-active,
.jump-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.jump-enter-from,
.jump-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

@media (max-width: 900px) {
  .chat-scroll {
    padding: 2px 14px 0;
  }

  .thread {
    padding-top: 18px;
  }

  .jump-btn {
    right: 14px;
    bottom: 104px;
  }
}

@media (max-width: 560px) {
  .chat-scroll {
    padding: 0 12px;
  }
}
</style>

import { computed, reactive, watch } from 'vue'
import { streamAnswer } from '../services/answerEngine'
import type { ChatMessage, ChatSession, SourceRef } from '../types'
import { uid } from '../utils/format'

const STORAGE_KEY = 'campus-assistant-demo:sessions:v1'
const MAX_SESSIONS = 30

interface State {
  sessions: ChatSession[]
  activeId: string | null
  streaming: boolean
  source: SourceRef | null
  sidebarOpen: boolean
  toast: { id: number; text: string } | null
}

export const state = reactive<State>({
  sessions: loadSessions(),
  activeId: null,
  streaming: false,
  source: null,
  sidebarOpen: false,
  toast: null,
})

let controller: AbortController | null = null
let runSeq = 0
let saveTimer: number | undefined
let toastTimer: number | undefined

export const activeSession = computed<ChatSession | null>(() => {
  if (!state.activeId) return null
  return state.sessions.find((session) => session.id === state.activeId) ?? null
})

export const hasSessions = computed(() => state.sessions.length > 0)

export function send(text: string): Promise<void> {
  const question = text.trim()
  if (!question || state.streaming) return Promise.resolve()

  const session = ensureSession(question)
  const userMessage: ChatMessage = {
    id: uid('msg'),
    role: 'user',
    content: question,
    sources: [],
    status: 'done',
    feedback: null,
    createdAt: Date.now(),
    followups: [],
    matched: true,
  }
  session.messages.push(userMessage)
  session.updatedAt = Date.now()
  return runAnswer(session, question)
}

export function stop(): void {
  controller?.abort()
  controller = null
  state.streaming = false

  const session = activeSession.value
  const last = session?.messages[session.messages.length - 1]
  if (last && last.role === 'assistant' && (last.status === 'pending' || last.status === 'streaming')) {
    last.status = 'stopped'
    if (!last.content) last.content = '（已停止生成）'
  }
}

export async function regenerate(): Promise<void> {
  const session = activeSession.value
  if (!session || state.streaming) return

  let assistantIndex = -1
  for (let i = session.messages.length - 1; i >= 0; i -= 1) {
    if (session.messages[i].role === 'assistant') {
      assistantIndex = i
      break
    }
  }
  if (assistantIndex <= 0) return

  const userIndex = assistantIndex - 1
  if (session.messages[userIndex]?.role !== 'user') return

  const question = session.messages[userIndex].content
  session.messages.splice(assistantIndex, 1)
  await runAnswer(session, question)
}

export function feedback(messageId: string, value: 'up' | 'down'): void {
  const session = activeSession.value
  const message = session?.messages.find((item) => item.id === messageId)
  if (!message) return

  message.feedback = message.feedback === value ? null : value
  if (message.feedback === 'up') showToast('已记录：这个回答有帮助')
  else if (message.feedback === 'down') showToast('已记录：会继续改进')
  else showToast('已取消反馈')
}

export function newChat(): void {
  stop()
  state.activeId = null
  state.sidebarOpen = false
}

export function selectSession(id: string): void {
  if (state.streaming) stop()
  state.activeId = id
  state.sidebarOpen = false
}

export function deleteSession(id: string): void {
  if (state.activeId === id) {
    stop()
    state.activeId = null
  }
  const index = state.sessions.findIndex((session) => session.id === id)
  if (index >= 0) state.sessions.splice(index, 1)
  showToast('对话已删除')
}

export function clearAllSessions(): void {
  stop()
  state.sessions.splice(0, state.sessions.length)
  state.activeId = null
  showToast('本地记录已清空')
}

export function openSource(source: SourceRef): void {
  state.source = source
}

export function closeSource(): void {
  state.source = null
}

export function toggleSidebar(open?: boolean): void {
  state.sidebarOpen = typeof open === 'boolean' ? open : !state.sidebarOpen
}

export function showToast(text: string): void {
  const id = Date.now() + Math.random()
  state.toast = { id, text }
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => {
    if (state.toast?.id === id) state.toast = null
  }, 2400)
}

async function runAnswer(session: ChatSession, question: string): Promise<void> {
  const draft: ChatMessage = {
    id: uid('msg'),
    role: 'assistant',
    content: '',
    sources: [],
    status: 'pending',
    feedback: null,
    createdAt: Date.now(),
    followups: [],
    matched: true,
  }
  session.messages.push(draft)
  session.updatedAt = Date.now()

  // push 之后从数组里重新取，拿到的是 reactive 代理，后续赋值才能触发更新。
  const message = session.messages[session.messages.length - 1]
  const abortController = new AbortController()
  const runId = ++runSeq
  controller = abortController
  state.streaming = true

  try {
    await streamAnswer(
      question,
      {
        onStatus: (status) => {
          if (status === 'streaming' && message.status === 'pending') {
            message.status = 'streaming'
          }
        },
        onSources: (sources) => {
          message.sources = sources
        },
        onToken: (text) => {
          message.content = text
          message.status = 'streaming'
        },
        onDone: (meta) => {
          message.status = 'done'
          message.matched = meta.matched
          message.followups = meta.followups
        },
      },
      abortController.signal,
    )
  } catch (error) {
    if (isAbortError(error)) {
      message.status = 'stopped'
      if (!message.content) message.content = '（已停止生成）'
    } else {
      message.status = 'error'
      if (!message.content) message.content = '抱歉，生成时出了点问题，请再试一次。'
    }
  } finally {
    if (runId === runSeq) {
      state.streaming = false
      controller = null
    }
    session.updatedAt = Date.now()
  }
}

function ensureSession(firstQuestion: string): ChatSession {
  if (activeSession.value) return activeSession.value

  const now = Date.now()
  const session: ChatSession = {
    id: uid('session'),
    title: truncate(firstQuestion, 26),
    messages: [],
    createdAt: now,
    updatedAt: now,
  }
  state.sessions.unshift(session)
  state.activeId = session.id
  trimSessions()
  return state.sessions[0]
}

function trimSessions(): void {
  if (state.sessions.length > MAX_SESSIONS) {
    state.sessions.splice(MAX_SESSIONS)
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text
}

function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter(
        (item): item is ChatSession =>
          Boolean(item) &&
          typeof item === 'object' &&
          typeof (item as ChatSession).id === 'string' &&
          Array.isArray((item as ChatSession).messages),
      )
      .slice(0, MAX_SESSIONS)
      .map((session) => ({
        ...session,
        messages: session.messages.map((message) => ({
          ...message,
          status:
            message.status === 'pending' || message.status === 'streaming' ? 'stopped' : message.status,
          sources: Array.isArray(message.sources) ? message.sources : [],
          followups: Array.isArray(message.followups) ? message.followups : [],
          feedback: message.feedback ?? null,
        })),
      }))
  } catch {
    return []
  }
}

watch(
  () => state.sessions,
  () => {
    window.clearTimeout(saveTimer)
    saveTimer = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.sessions.slice(0, MAX_SESSIONS)))
      } catch {
        // 存储配额满时静默失败，不影响当前会话使用。
      }
    }, 350)
  },
  { deep: true },
)

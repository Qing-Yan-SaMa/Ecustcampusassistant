<script setup lang="ts">
import BrandMark from './BrandMark.vue'
import AppIcon from './AppIcon.vue'
import {
  clearAllSessions,
  deleteSession,
  hasSessions,
  newChat,
  selectSession,
  state,
} from '../stores/chat'
import { navigate, route } from '../router'
import { formatRelativeTime } from '../utils/format'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const NAV = [
  { id: 'home', label: '首页', icon: 'home', path: '/' },
  { id: 'library', label: '图书馆', icon: 'book', path: '/library' },
  { id: 'college', label: '学院动态', icon: 'building', path: '/college' },
  { id: 'academic', label: '教务学业', icon: 'cap', path: '/academic' },
  { id: 'activity', label: '校园活动', icon: 'calendar', path: '/activity' },
  { id: 'service', label: '校园服务', icon: 'shield', path: '/service' },
] as const

function go(path: string): void {
  navigate(path)
  emit('close')
}

function openAssistant(): void {
  navigate('/assistant')
  emit('close')
}

function startChat(): void {
  newChat()
  navigate('/assistant')
  emit('close')
}

function openSession(id: string): void {
  selectSession(id)
  navigate('/assistant')
  emit('close')
}
</script>

<template>
  <aside class="sidebar" :class="{ open }">
    <div class="side-inner">
      <header class="side-head">
        <button class="brand" type="button" @click="go('/')">
          <BrandMark :size="38" />
          <span class="brand-text">
            <span class="brand-name">校园信息门户</span>
            <span class="brand-sub">ECUST · 演示版</span>
          </span>
        </button>
        <button class="close-btn" type="button" aria-label="关闭侧栏" @click="emit('close')">
          <AppIcon name="close" :size="18" />
        </button>
      </header>

      <nav class="nav" aria-label="全站导航">
        <div class="section-label">逛校园</div>
        <button
          v-for="item in NAV"
          :key="item.id"
          type="button"
          class="nav-item"
          :class="{ active: route.name === 'module' ? route.module === item.id : route.name === item.id }"
          @click="go(item.path)"
        >
          <AppIcon :name="item.icon" :size="17" />
          <span>{{ item.label }}</span>
          <AppIcon
            v-if="route.name === 'module' && route.module === item.id"
            name="chevron-right"
            :size="13"
            class="nav-arrow"
          />
        </button>
      </nav>

      <div class="side-divider"></div>

      <template v-if="route.name === 'assistant'">
        <button class="new-chat" type="button" @click="startChat">
          <AppIcon name="plus" :size="17" />
          <span>新对话</span>
          <span class="new-chat-hint">Ctrl K</span>
        </button>

        <section class="history-block">
          <div class="section-label">
            <span>最近对话</span>
            <span v-if="hasSessions" class="section-count">{{ state.sessions.length }}</span>
          </div>

          <div v-if="!hasSessions" class="empty-history">
            <AppIcon name="book" :size="20" />
            <p>还没有对话记录</p>
            <span>问一个问题，这里会自动保存</span>
          </div>

          <ul v-else class="history">
            <li v-for="session in state.sessions.slice(0, 12)" :key="session.id">
              <div
                class="history-item"
                :class="{ active: session.id === state.activeId }"
                role="button"
                tabindex="0"
                @click="openSession(session.id)"
                @keydown.enter="openSession(session.id)"
              >
                <div class="history-main">
                  <span class="history-title">{{ session.title }}</span>
                  <span class="history-time">{{ formatRelativeTime(session.updatedAt) }}</span>
                </div>
                <button
                  class="history-delete"
                  type="button"
                  aria-label="删除这条对话"
                  @click.stop="deleteSession(session.id)"
                >
                  <AppIcon name="trash" :size="15" />
                </button>
              </div>
            </li>
          </ul>
        </section>
      </template>

      <template v-else>
        <button class="assistant-entry" type="button" @click="openAssistant">
          <span class="assistant-icon">
            <AppIcon name="spark" :size="17" />
          </span>
          <span class="assistant-copy">
            <strong>有具体问题？</strong>
            <span>问「缓考怎么申请」「最近有什么讲座」</span>
          </span>
          <AppIcon name="chevron-right" :size="14" />
        </button>

        <div v-if="hasSessions" class="recent-mini">
          <div class="section-label">
            <span>最近问过</span>
            <span class="section-count">{{ state.sessions.length }}</span>
          </div>
          <button
            v-for="session in state.sessions.slice(0, 3)"
            :key="session.id"
            class="mini-session"
            type="button"
            @click="openSession(session.id)"
          >
            <span>{{ session.title }}</span>
            <span>{{ formatRelativeTime(session.updatedAt) }}</span>
          </button>
        </div>
      </template>

      <footer class="side-foot">
        <div class="demo-note">
          <span class="demo-dot"></span>
          <span>含公众号语料 · 非官方</span>
        </div>
        <div class="side-meta">
          <span>v0.3 门户版</span>
          <button v-if="route.name === 'assistant' && hasSessions" type="button" @click="clearAllSessions">
            清空记录
          </button>
        </div>
      </footer>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  position: relative;
  z-index: 40;
  display: flex;
  width: 268px;
  flex: none;
  height: 100%;
  overflow: hidden;
  background: var(--sidebar);
  color: #e9efe9;
}

.sidebar::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 18% 0%, rgba(26, 138, 117, 0.24), transparent 52%),
    radial-gradient(circle at 90% 100%, rgba(169, 112, 28, 0.12), transparent 46%);
  pointer-events: none;
}

.side-inner {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 20px 14px 16px;
}

.side-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 11px;
  text-align: left;
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brand-name {
  color: #f4f7f2;
  font-size: 14.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.brand-sub {
  color: rgba(233, 239, 233, 0.46);
  font-size: 11px;
  letter-spacing: 0.08em;
}

.close-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  color: rgba(233, 239, 233, 0.62);
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 24px;
}

.nav .section-label {
  margin-bottom: 7px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 38px;
  padding: 0 11px;
  border-radius: 10px;
  color: rgba(233, 239, 233, 0.7);
  font-size: 12.8px;
  text-align: left;
  transition: background 0.15s ease, color 0.15s ease;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.065);
  color: #fff;
}

.nav-item.active {
  background: rgba(26, 138, 117, 0.3);
  box-shadow: inset 2px 0 0 #35a58e;
  color: #fff;
}

.nav-arrow {
  margin-left: auto;
  opacity: 0.6;
}

.side-divider {
  flex: none;
  height: 1px;
  margin: 18px 8px;
  background: var(--sidebar-line);
}

.new-chat {
  display: flex;
  align-items: center;
  gap: 9px;
  height: 40px;
  padding: 0 13px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.07);
  color: #f2f6f1;
  font-size: 13px;
  font-weight: 550;
  transition: background 0.16s ease, border-color 0.16s ease;
}

.new-chat:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.16);
}

.new-chat-hint {
  margin-left: auto;
  color: rgba(233, 239, 233, 0.34);
  font-size: 10.5px;
  letter-spacing: 0.04em;
}

.assistant-entry {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 13px;
  background: linear-gradient(135deg, rgba(26, 138, 117, 0.18), rgba(255, 255, 255, 0.03));
  text-align: left;
  transition: border-color 0.16s ease, background 0.16s ease;
}

.assistant-entry:hover {
  border-color: rgba(53, 165, 142, 0.4);
  background: linear-gradient(135deg, rgba(26, 138, 117, 0.26), rgba(255, 255, 255, 0.04));
}

.assistant-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex: none;
  border-radius: 9px;
  background: rgba(53, 165, 142, 0.2);
  color: #7fd1bb;
}

.assistant-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 2px;
}

.assistant-copy strong {
  color: #f0f6ef;
  font-size: 12px;
  font-weight: 600;
}

.assistant-copy span {
  overflow: hidden;
  color: rgba(233, 239, 233, 0.46);
  font-size: 10px;
  line-height: 1.5;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.assistant-entry > :deep(svg) {
  color: rgba(233, 239, 233, 0.4);
}

.recent-mini {
  margin-top: 22px;
}

.mini-session {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 2px;
  padding: 7px 8px;
  border-radius: 8px;
  text-align: left;
}

.mini-session:hover {
  background: rgba(255, 255, 255, 0.055);
}

.mini-session span:first-child {
  overflow: hidden;
  color: rgba(238, 243, 236, 0.72);
  font-size: 11.5px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.mini-session span:last-child {
  color: rgba(233, 239, 233, 0.3);
  font-size: 9.5px;
}

.history-block {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  margin-top: 18px;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 8px;
  margin-bottom: 8px;
  color: rgba(233, 239, 233, 0.4);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.14em;
}

.section-count {
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(233, 239, 233, 0.5);
  font-size: 10px;
  letter-spacing: 0;
}

.empty-history {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin: 4px 2px;
  padding: 22px 14px;
  border: 1px dashed rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  color: rgba(233, 239, 233, 0.42);
  text-align: center;
}

.empty-history p {
  margin: 4px 0 0;
  color: rgba(233, 239, 233, 0.6);
  font-size: 12.5px;
}

.empty-history span {
  font-size: 11px;
  line-height: 1.5;
}

.history {
  min-height: 0;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
  padding: 9px 8px 9px 10px;
  border-radius: 10px;
  cursor: pointer;
  outline: none;
  transition: background 0.15s ease;
}

.history-item:hover,
.history-item:focus-visible {
  background: rgba(255, 255, 255, 0.06);
}

.history-item.active {
  background: rgba(26, 138, 117, 0.3);
  box-shadow: inset 2px 0 0 #35a58e;
}

.history-main {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 2px;
}

.history-title {
  overflow: hidden;
  color: rgba(238, 243, 236, 0.8);
  font-size: 12.8px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.history-item.active .history-title {
  color: #fff;
}

.history-time {
  color: rgba(233, 239, 233, 0.34);
  font-size: 10.5px;
}

.history-delete {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  flex: none;
  border-radius: 7px;
  color: rgba(233, 239, 233, 0.4);
  opacity: 0;
  transition: opacity 0.15s ease, background 0.15s ease, color 0.15s ease;
}

.history-item:hover .history-delete,
.history-delete:focus-visible {
  opacity: 1;
}

.history-delete:hover {
  background: rgba(179, 69, 62, 0.28);
  color: #ffd9d4;
}

.side-foot {
  flex: none;
  margin: 12px 4px 0;
  padding-top: 14px;
  border-top: 1px solid var(--sidebar-line);
}

.demo-note {
  display: flex;
  align-items: center;
  gap: 7px;
  color: rgba(233, 239, 233, 0.52);
  font-size: 11px;
}

.demo-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #d9a441;
  box-shadow: 0 0 0 3px rgba(217, 164, 65, 0.14);
}

.side-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  color: rgba(233, 239, 233, 0.3);
  font-size: 10.5px;
}

.side-meta button {
  color: rgba(233, 239, 233, 0.38);
  font-size: 10.5px;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.side-meta button:hover {
  color: rgba(255, 214, 208, 0.8);
}

@media (max-width: 900px) {
  .sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    width: 282px;
    transform: translateX(-102%);
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.36);
    transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .close-btn {
    display: inline-flex;
  }
}
</style>

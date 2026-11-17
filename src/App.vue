<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AppSidebar from './components/AppSidebar.vue'
import AppIcon from './components/AppIcon.vue'
import PortalHome from './components/PortalHome.vue'
import ModulePage from './components/ModulePage.vue'
import ArticlePage from './components/ArticlePage.vue'
import SearchPage from './components/SearchPage.vue'
import AssistantPage from './components/AssistantPage.vue'
import SourceDrawer from './components/SourceDrawer.vue'
import ToastHost from './components/ToastHost.vue'
import { activeSession, closeSource, newChat, state, toggleSidebar } from './stores/chat'
import { findArticle, loadPortal, portalState } from './stores/portal'
import { navigate, route } from './router'
import { MODULE_META } from './utils/portal'

const bodyRef = ref<HTMLElement | null>(null)

const pageTitle = computed(() => {
  if (route.name === 'home') return '首页'
  if (route.name === 'module') return route.module ? MODULE_META[route.module].label : '模块'
  if (route.name === 'article') return findArticle(route.articleId || '')?.title || '文章详情'
  if (route.name === 'search') return route.query ? `搜索：${route.query}` : '搜索'
  return activeSession.value?.title || '智能助手'
})

const pageSub = computed(() => {
  if (route.name === 'home') return '近三周校园公众号'
  if (route.name === 'module') {
    const count = portalState.data?.modules.find((item) => item.id === route.module)?.count
    return count ? `${count} 篇 · 来自公众号` : '来自公众号'
  }
  if (route.name === 'article') return '公众号原文摘录'
  if (route.name === 'search') return '全站搜索'
  return '预设问答 + 公众号检索'
})

const stats = computed(() => portalState.data?.stats)

function goAssistant(): void {
  if (route.name === 'assistant') {
    newChat()
    return
  }
  navigate('/assistant')
}

function onGlobalKeydown(event: KeyboardEvent): void {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    goAssistant()
    return
  }
  if (event.key === 'Escape' && state.sidebarOpen) {
    toggleSidebar(false)
  }
}

watch(
  () => [route.name, route.module, route.college, route.articleId, route.query].join('|'),
  async () => {
    const element = bodyRef.value
    if (element) element.scrollTop = 0
  },
)

onMounted(() => {
  window.addEventListener('keydown', onGlobalKeydown)
  loadPortal().catch(() => undefined)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
})
</script>

<template>
  <div class="app-shell">
    <AppSidebar :open="state.sidebarOpen" @close="toggleSidebar(false)" />

    <Transition name="mask">
      <div v-if="state.sidebarOpen" class="sidebar-mask" @click="toggleSidebar(false)"></div>
    </Transition>

    <main class="main">
      <header class="topbar">
        <button class="menu-btn" type="button" aria-label="打开侧栏" @click="toggleSidebar(true)">
          <AppIcon name="menu" :size="19" />
        </button>

        <div class="topbar-title">
          <span class="topbar-name">{{ pageTitle }}</span>
          <span class="topbar-sub">{{ pageSub }}</span>
        </div>

        <div class="topbar-right">
          <span class="mode-chip">
            <span class="mode-dot"></span>
            演示 · {{ stats?.articles || 244 }} 篇推文
          </span>
          <button
            v-if="route.name !== 'assistant'"
            class="ask-top"
            type="button"
            @click="goAssistant"
          >
            <AppIcon name="spark" :size="14" />
            问助手
          </button>
        </div>
      </header>

      <div ref="bodyRef" class="main-body" :class="{ 'is-chat': route.name === 'assistant' }">
        <PortalHome v-if="route.name === 'home'" />

        <ModulePage
          v-else-if="route.name === 'module' && route.module"
          :key="`${route.module}:${route.college || ''}`"
          :module-id="route.module"
          :college="route.college"
        />

        <ArticlePage
          v-else-if="route.name === 'article'"
          :key="route.articleId"
          :article-id="route.articleId || ''"
        />

        <SearchPage
          v-else-if="route.name === 'search'"
          :key="route.query"
          :query="route.query || ''"
        />

        <AssistantPage v-else />
      </div>
    </main>

    <SourceDrawer :source="state.source" @close="closeSource" />
    <ToastHost />
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: var(--bg);
}

.main {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  height: 100%;
}

.topbar {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 12px;
  flex: none;
  height: 62px;
  padding: 0 26px;
  border-bottom: 1px solid var(--line);
  background: rgba(244, 242, 237, 0.88);
  backdrop-filter: blur(10px);
}

.menu-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin-left: -6px;
  border-radius: 10px;
  color: var(--ink-2);
}

.menu-btn:hover {
  background: var(--bg-soft);
}

.topbar-title {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 1px;
}

.topbar-name {
  max-width: 44vw;
  overflow: hidden;
  color: var(--ink);
  font-size: 13.5px;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.topbar-sub {
  color: var(--ink-3);
  font-size: 10.5px;
  letter-spacing: 0.05em;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.mode-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 26px;
  padding: 0 10px;
  border: 1px solid rgba(169, 112, 28, 0.16);
  border-radius: 999px;
  background: rgba(169, 112, 28, 0.075);
  color: #8a5c14;
  font-size: 11px;
  white-space: nowrap;
}

.mode-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #d9a441;
  box-shadow: 0 0 0 2px rgba(217, 164, 65, 0.16);
}

.ask-top {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: var(--accent);
  color: #fff;
  font-size: 11.5px;
  font-weight: 600;
}

.ask-top:hover {
  background: var(--accent-strong);
}

.main-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.main-body.is-chat {
  overflow: hidden;
}

.sidebar-mask {
  position: fixed;
  inset: 0;
  z-index: 35;
  background: rgba(16, 31, 27, 0.38);
  backdrop-filter: blur(1.5px);
}

.mask-enter-active,
.mask-leave-active {
  transition: opacity 0.22s ease;
}

.mask-enter-from,
.mask-leave-to {
  opacity: 0;
}

@media (max-width: 900px) {
  .menu-btn {
    display: flex;
  }

  .topbar {
    padding: 0 14px;
  }

  .topbar-name {
    max-width: 42vw;
  }
}

@media (max-width: 560px) {
  .mode-chip {
    display: none;
  }

  .topbar {
    padding: 0 12px;
  }

  .ask-top {
    height: 28px;
    padding: 0 10px;
  }
}
</style>

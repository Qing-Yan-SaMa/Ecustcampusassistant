<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import { articlePath, navigate } from '../router'
import { loadPortal, portalState } from '../stores/portal'
import { MODULE_META, articleMatches, formatDate } from '../utils/portal'

const props = defineProps<{ query: string }>()

const term = ref(props.query || '')

const results = computed(() =>
  (portalState.data?.articles || [])
    .filter((article) => articleMatches(article, props.query))
    .slice(0, 60),
)

watch(
  () => props.query,
  (value) => {
    term.value = value || ''
  },
)

function submit(): void {
  const value = term.value.trim()
  if (value) navigate(`/search/${encodeURIComponent(value)}`)
}

function openArticle(id: string): void {
  navigate(articlePath(id))
}

onMounted(() => {
  loadPortal().catch(() => undefined)
})
</script>

<template>
  <div class="search-page">
    <header class="search-head">
      <span class="eyebrow">全站搜索</span>
      <h1>{{ query ? `“${query}”` : '搜点什么' }}</h1>
      <form class="search-box" @submit.prevent="submit">
        <AppIcon name="search" :size="18" />
        <input v-model="term" type="search" placeholder="讲座、保研、消防、志愿…" aria-label="搜索" />
        <button type="submit">搜索</button>
      </form>
      <p class="search-count">
        {{ query ? `找到 ${results.length} 条相关内容` : '输入关键词，搜索近三周公众号内容' }}
      </p>
    </header>

    <div v-if="query && !results.length" class="search-empty">
      <AppIcon name="search" :size="26" />
      <p>没有找到「{{ query }}」相关的内容</p>
      <button type="button" @click="navigate('/')">回首页逛逛</button>
    </div>

    <div v-else class="result-list">
      <button
        v-for="article in results"
        :key="article.id"
        class="result-row"
        type="button"
        @click="openArticle(article.id)"
      >
        <span class="result-tag">{{ MODULE_META[article.category].label }}</span>
        <span class="result-main">
          <span class="result-title">{{ article.title }}</span>
          <span class="result-summary">{{ article.summary }}</span>
          <span class="result-meta">{{ article.mp }} · {{ formatDate(article.date) }} · {{ article.college }}</span>
        </span>
        <AppIcon name="chevron-right" :size="15" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.search-page {
  max-width: 940px;
  margin: 0 auto;
  padding: 34px 38px 72px;
}

.eyebrow {
  color: var(--accent);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.12em;
}

.search-head h1 {
  margin: 10px 0 18px;
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: clamp(28px, 3.6vw, 40px);
  font-weight: 600;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 9px;
  height: 48px;
  padding: 0 6px 0 15px;
  border: 1px solid var(--line-strong);
  border-radius: 14px;
  background: var(--panel);
  color: var(--ink-3);
  box-shadow: 0 8px 26px rgba(26, 37, 30, 0.05);
}

.search-box:focus-within {
  border-color: rgba(14, 106, 91, 0.45);
  box-shadow: 0 0 0 4px rgba(14, 106, 91, 0.07);
}

.search-box input {
  min-width: 0;
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--ink);
  font-size: 13.5px;
}

.search-box button {
  height: 36px;
  padding: 0 16px;
  border-radius: 10px;
  background: var(--accent);
  color: #fff;
  font-size: 12.5px;
  font-weight: 600;
}

.search-count {
  margin: 12px 2px 0;
  color: var(--ink-3);
  font-size: 11px;
}

.result-list {
  margin-top: 20px;
  border-top: 1px solid var(--line);
}

.result-row {
  display: flex;
  align-items: flex-start;
  gap: 13px;
  width: 100%;
  padding: 15px 4px;
  border-bottom: 1px solid var(--line);
  text-align: left;
}

.result-row:hover .result-title {
  color: var(--accent);
}

.result-tag {
  flex: none;
  margin-top: 2px;
  padding: 2px 7px;
  border-radius: 999px;
  background: var(--bg-soft);
  color: var(--ink-3);
  font-size: 9.5px;
}

.result-main {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 3px;
}

.result-title {
  color: var(--ink);
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.5;
}

.result-summary {
  display: -webkit-box;
  overflow: hidden;
  color: var(--ink-3);
  font-size: 11px;
  line-height: 1.6;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.result-meta {
  color: var(--ink-3);
  font-size: 10px;
}

.result-row > :deep(svg) {
  margin-top: 3px;
  color: var(--ink-3);
}

.search-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 9px;
  padding: 90px 0;
  color: var(--ink-3);
}

.search-empty p {
  margin: 0;
  font-size: 13px;
}

.search-empty button {
  padding: 7px 16px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  color: var(--ink-2);
  font-size: 11.5px;
}

@media (max-width: 640px) {
  .search-page {
    padding: 22px 16px 48px;
  }
}
</style>

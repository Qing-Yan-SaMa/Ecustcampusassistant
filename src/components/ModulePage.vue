<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import ArticleCard from './ArticleCard.vue'
import { articlePath, navigate } from '../router'
import { loadPortal, portalState } from '../stores/portal'
import type { PortalModuleId } from '../types'
import { MODULE_META } from '../utils/portal'

const props = defineProps<{
  moduleId: PortalModuleId
  college?: string
}>()

const activeTag = ref('')
const visible = ref(18)

const data = computed(() => portalState.data)
const meta = computed(() => MODULE_META[props.moduleId])
const source = computed(
  () => data.value?.articles.filter((article) => article.category === props.moduleId) || [],
)

const tags = computed(() => {
  const counts = new Map<string, number>()
  for (const article of source.value) {
    for (const tag of article.tags) counts.set(tag, (counts.get(tag) || 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 9)
    .map(([tag]) => tag)
})

const filtered = computed(() =>
  source.value.filter((article) => {
    if (props.moduleId === 'college' && props.college && article.college !== props.college) return false
    if (activeTag.value && !article.tags.includes(activeTag.value)) return false
    return true
  }),
)

const shown = computed(() => filtered.value.slice(0, visible.value))
const colleges = computed(() => data.value?.colleges || [])

watch(
  () => [props.moduleId, props.college],
  () => {
    activeTag.value = ''
    visible.value = 18
    if (props.moduleId === 'college' && props.college && !colleges.value.some((item) => item.name === props.college)) {
      navigate('/college')
    }
  },
)

function openArticle(id: string): void {
  navigate(articlePath(id))
}

function selectCollege(name: string): void {
  navigate(name ? `/college/${encodeURIComponent(name)}` : '/college')
}

function selectTag(tag: string): void {
  activeTag.value = activeTag.value === tag ? '' : tag
}

onMounted(() => {
  loadPortal().catch(() => undefined)
})
</script>

<template>
  <div class="module-page">
    <header class="module-head">
      <div class="crumb">
        <button type="button" @click="navigate('/')">首页</button>
        <AppIcon name="chevron-right" :size="12" />
        <span>{{ meta.label }}</span>
        <template v-if="college">
          <AppIcon name="chevron-right" :size="12" />
          <span class="crumb-current">{{ college }}</span>
        </template>
      </div>

      <div class="title-row">
        <span class="module-glyph">
          <AppIcon :name="meta.icon" :size="24" />
        </span>
        <div class="title-text">
          <h1>{{ college || meta.label }}</h1>
          <p>{{ college ? `来自${college}的公众号内容` : meta.description }}</p>
        </div>
        <span class="module-total">{{ filtered.length }} 篇</span>
      </div>

      <div v-if="moduleId === 'college' && colleges.length" class="chip-row">
        <button
          type="button"
          class="filter-chip"
          :class="{ active: !college }"
          @click="selectCollege('')"
        >
          全部学院
        </button>
        <button
          v-for="item in colleges"
          :key="item.name"
          type="button"
          class="filter-chip"
          :class="{ active: college === item.name }"
          @click="selectCollege(item.name)"
        >
          {{ item.name }}
          <em>{{ item.count }}</em>
        </button>
      </div>

      <div v-else class="chip-row">
        <button
          type="button"
          class="filter-chip"
          :class="{ active: !activeTag }"
          @click="activeTag = ''"
        >
          全部
        </button>
        <button
          v-for="tag in tags"
          :key="tag"
          type="button"
          class="filter-chip"
          :class="{ active: activeTag === tag }"
          @click="selectTag(tag)"
        >
          {{ tag }}
        </button>
      </div>
    </header>

    <div v-if="!data && portalState.loading" class="module-state">正在加载…</div>
    <div v-else-if="portalState.error" class="module-state error">{{ portalState.error }}</div>

    <template v-else>
      <div v-if="!filtered.length" class="empty-state">
        <AppIcon name="search" :size="26" />
        <p>这个筛选下还没有内容</p>
        <button type="button" @click="selectCollege(''); activeTag = ''">看全部</button>
      </div>

      <div v-else class="article-grid">
        <ArticleCard
          v-for="article in shown"
          :key="article.id"
          :article="article"
          @open="openArticle"
        />
      </div>

      <button
        v-if="filtered.length > visible"
        class="load-more"
        type="button"
        @click="visible += 18"
      >
        继续加载（还有 {{ filtered.length - visible }} 篇）
      </button>
    </template>
  </div>
</template>

<style scoped>
.module-page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 28px 38px 72px;
}

.module-head {
  padding-bottom: 18px;
  border-bottom: 1px solid var(--line);
}

.crumb {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--ink-3);
  font-size: 10.5px;
}

.crumb button {
  color: var(--ink-3);
}

.crumb button:hover {
  color: var(--accent);
}

.crumb-current {
  max-width: 42vw;
  overflow: hidden;
  color: var(--ink-2);
  white-space: nowrap;
  text-overflow: ellipsis;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 16px;
}

.module-glyph {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  flex: none;
  border-radius: 14px;
  background: var(--accent-soft);
  color: var(--accent);
}

.title-text {
  min-width: 0;
  flex: 1;
}

h1 {
  margin: 0;
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: 30px;
  font-weight: 600;
  line-height: 1.25;
}

.title-text p {
  margin: 4px 0 0;
  color: var(--ink-3);
  font-size: 11.5px;
}

.module-total {
  flex: none;
  padding: 5px 11px;
  border-radius: 999px;
  background: var(--bg-soft);
  color: var(--ink-2);
  font-size: 11px;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 18px;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 11px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--panel);
  color: var(--ink-2);
  font-size: 11px;
  white-space: nowrap;
  transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
}

.filter-chip:hover {
  border-color: rgba(14, 106, 91, 0.28);
  color: var(--accent);
}

.filter-chip.active {
  border-color: var(--accent);
  background: var(--accent);
  color: #fff;
}

.filter-chip em {
  font-style: normal;
  opacity: 0.62;
  font-size: 9.5px;
}

.article-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 15px;
  margin-top: 22px;
}

.module-state {
  padding: 80px 0;
  color: var(--ink-3);
  text-align: center;
  font-size: 12px;
}

.module-state.error {
  color: var(--danger);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 90px 0;
  color: var(--ink-3);
}

.empty-state p {
  margin: 0;
  font-size: 13px;
}

.empty-state button {
  padding: 6px 14px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  color: var(--ink-2);
  font-size: 11.5px;
}

.load-more {
  display: block;
  margin: 28px auto 0;
  padding: 9px 22px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  background: var(--panel);
  color: var(--ink-2);
  font-size: 11.5px;
}

.load-more:hover {
  border-color: rgba(14, 106, 91, 0.35);
  color: var(--accent);
}

@media (max-width: 1040px) {
  .module-page {
    padding: 24px 26px 60px;
  }

  .article-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .module-page {
    padding: 18px 16px 48px;
  }

  h1 {
    font-size: 24px;
  }

  .module-glyph {
    width: 42px;
    height: 42px;
  }

  .module-total {
    display: none;
  }

  .article-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .chip-row {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 4px;
  }
}
</style>

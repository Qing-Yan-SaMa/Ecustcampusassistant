<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppIcon from './AppIcon.vue'
import ArticleCard from './ArticleCard.vue'
import { articlePath, modulePath, navigate } from '../router'
import { loadPortal, portalState } from '../stores/portal'
import { MODULE_META, MODULE_ORDER, formatDate } from '../utils/portal'

const query = ref('')
const heroFailed = ref(false)

const data = computed(() => portalState.data)
const byId = computed(
  () => new Map((data.value?.articles || []).map((article) => [article.id, article])),
)
const hero = computed(() =>
  data.value?.featured[0] ? byId.value.get(data.value.featured[0]) || null : null,
)
const hot = computed(() =>
  (data.value?.featured.slice(1, 5) || [])
    .map((id) => byId.value.get(id))
    .filter((article): article is NonNullable<typeof article> => Boolean(article)),
)
const latest = computed(() =>
  (data.value?.latest || [])
    .map((id) => byId.value.get(id))
    .filter((article): article is NonNullable<typeof article> => Boolean(article)),
)

function submitSearch(): void {
  const value = query.value.trim()
  if (value) navigate(`/search/${encodeURIComponent(value)}`)
}

function openArticle(id: string): void {
  navigate(articlePath(id))
}

function openModule(id: (typeof MODULE_ORDER)[number]): void {
  navigate(modulePath(id))
}

function moduleLatest(id: (typeof MODULE_ORDER)[number]): string {
  const article = data.value?.articles.find((item) => item.category === id)
  return article?.title || '暂无更新'
}

onMounted(() => {
  loadPortal().catch(() => undefined)
})
</script>

<template>
  <div class="home">
    <div v-if="!data && portalState.loading" class="home-state">
      <span class="loading-dot"></span>
      正在整理校园信息…
    </div>

    <div v-else-if="portalState.error" class="home-state error">
      <AppIcon name="info" :size="22" />
      <p>门户数据加载失败：{{ portalState.error }}</p>
      <button type="button" @click="loadPortal">重试</button>
    </div>

    <template v-else-if="data">
      <section class="hero">
        <div class="hero-copy">
          <span class="eyebrow">
            <span class="eyebrow-dot"></span>
            ECUST · 校园信息门户
          </span>
          <h1>校园里，<br /><em>正在发生。</em></h1>
          <p class="hero-lead">
            图书馆的新书、学院的活动、教务的通知——把近三周的校园公众号整理成一张主页，点开就能读原文。
          </p>

          <form class="hero-search" @submit.prevent="submitSearch">
            <AppIcon name="search" :size="18" />
            <input
              v-model="query"
              type="search"
              placeholder="搜一搜：讲座、保研、消防、志愿…"
              aria-label="搜索校园信息"
            />
            <button type="submit">搜索</button>
          </form>

          <div class="hero-meta">
            <span>{{ data.stats.dateMin }} — {{ data.stats.dateMax }}</span>
            <span class="dot-sep"></span>
            <span>{{ data.stats.articles }} 篇推文</span>
            <span class="dot-sep"></span>
            <span>{{ data.stats.accounts }} 个公众号</span>
          </div>
        </div>

        <button v-if="hero" class="hero-cover" type="button" @click="openArticle(hero.id)">
          <img
            v-if="hero.cover && !heroFailed"
            :src="hero.cover"
            :alt="hero.title"
            referrerpolicy="no-referrer"
            @error="heroFailed = true"
          />
          <span class="hero-shade"></span>
          <span class="hero-caption">
            <span class="hero-tag">{{ MODULE_META[hero.category].label }} · 热门</span>
            <span class="hero-title">{{ hero.title }}</span>
            <span class="hero-meta-line">{{ hero.mp }} · {{ formatDate(hero.date) }}</span>
          </span>
          <span class="hero-open">
            阅读
            <AppIcon name="arrow-right" :size="14" />
          </span>
        </button>
      </section>

      <section class="home-section">
        <div class="section-head">
          <div>
            <h2>热门推荐</h2>
            <p>近三周里，最值得点开的几件事</p>
          </div>
          <button class="text-link" type="button" @click="openModule('activity')">
            逛校园活动
            <AppIcon name="arrow-right" :size="14" />
          </button>
        </div>

        <div class="hot-grid">
          <ArticleCard
            v-for="article in hot"
            :key="article.id"
            :article="article"
            @open="openArticle"
          />
        </div>
      </section>

      <section class="home-section">
        <div class="section-head">
          <div>
            <h2>按模块逛</h2>
            <p>直接进入你关心的那一类信息</p>
          </div>
        </div>

        <div class="module-grid">
          <button
            v-for="id in MODULE_ORDER"
            :key="id"
            class="module-tile"
            type="button"
            @click="openModule(id)"
          >
            <span class="module-top">
              <span class="module-icon">
                <AppIcon :name="MODULE_META[id].icon" :size="21" />
              </span>
              <span class="module-count">{{ data.modules.find((m) => m.id === id)?.count || 0 }}</span>
            </span>
            <strong>{{ MODULE_META[id].label }}</strong>
            <span class="module-desc">{{ MODULE_META[id].description }}</span>
            <span class="module-latest">{{ moduleLatest(id) }}</span>
            <span class="module-go">
              进入
              <AppIcon name="chevron-right" :size="13" />
            </span>
          </button>
        </div>
      </section>

      <section class="home-section">
        <div class="section-head">
          <div>
            <h2>最新更新</h2>
            <p>按发布时间排列，共 {{ data.stats.articles }} 篇</p>
          </div>
        </div>

        <div class="latest-list">
          <button
            v-for="article in latest"
            :key="article.id"
            class="latest-row"
            type="button"
            @click="openArticle(article.id)"
          >
            <span class="latest-main">
              <span class="latest-meta">{{ article.mp }} · {{ formatDate(article.date) }}</span>
              <span class="latest-title">{{ article.title }}</span>
            </span>
            <span class="latest-tag">{{ MODULE_META[article.category].label }}</span>
          </button>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.home {
  max-width: 1180px;
  margin: 0 auto;
  padding: 32px 38px 72px;
}

.home-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 52vh;
  color: var(--ink-3);
  font-size: 13px;
}

.home-state.error {
  flex-direction: column;
  color: var(--danger);
}

.home-state.error p {
  margin: 0;
}

.home-state.error button {
  padding: 6px 14px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  color: var(--ink-2);
  font-size: 12px;
}

.loading-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  animation: pulse 1.1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.25; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1); }
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 30px;
  align-items: stretch;
}

.hero-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 6px 0;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--accent);
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.eyebrow-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 4px rgba(14, 106, 91, 0.1);
}

h1 {
  margin: 16px 0 14px;
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: clamp(40px, 4.6vw, 58px);
  font-weight: 600;
  line-height: 1.16;
  letter-spacing: 0.01em;
}

h1 em {
  color: var(--accent);
  font-style: normal;
  background: linear-gradient(transparent 66%, rgba(169, 112, 28, 0.18) 66%);
}

.hero-lead {
  max-width: 440px;
  margin: 0;
  color: var(--ink-2);
  font-size: 13.5px;
  line-height: 1.8;
}

.hero-search {
  display: flex;
  align-items: center;
  gap: 9px;
  height: 48px;
  margin-top: 24px;
  padding: 0 6px 0 15px;
  border: 1px solid var(--line-strong);
  border-radius: 14px;
  background: var(--panel);
  box-shadow: 0 8px 26px rgba(26, 37, 30, 0.06);
  color: var(--ink-3);
}

.hero-search:focus-within {
  border-color: rgba(14, 106, 91, 0.45);
  box-shadow: 0 0 0 4px rgba(14, 106, 91, 0.07), 0 8px 26px rgba(26, 37, 30, 0.06);
}

.hero-search input {
  min-width: 0;
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--ink);
  font-size: 13.5px;
}

.hero-search input::placeholder {
  color: var(--ink-3);
}

.hero-search button {
  height: 36px;
  padding: 0 16px;
  border-radius: 10px;
  background: var(--accent);
  color: #fff;
  font-size: 12.5px;
  font-weight: 600;
}

.hero-search button:hover {
  background: var(--accent-strong);
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 9px;
  margin-top: 14px;
  color: var(--ink-3);
  font-size: 10.5px;
  letter-spacing: 0.02em;
}

.dot-sep {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--line-strong);
}

.hero-cover {
  position: relative;
  display: block;
  overflow: hidden;
  min-height: 336px;
  border-radius: 20px;
  background: linear-gradient(135deg, #234b42, #0e211c);
  text-align: left;
  box-shadow: 0 20px 50px rgba(20, 40, 33, 0.18);
}

.hero-cover img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

.hero-cover:hover img {
  transform: scale(1.035);
}

.hero-shade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(12, 26, 22, 0.02) 32%, rgba(10, 22, 18, 0.82) 100%),
    linear-gradient(90deg, rgba(10, 22, 18, 0.18), transparent 52%);
}

.hero-caption {
  position: absolute;
  right: 24px;
  bottom: 22px;
  left: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #f7f5ee;
}

.hero-tag {
  align-self: flex-start;
  padding: 4px 9px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.05em;
  backdrop-filter: blur(6px);
}

.hero-title {
  display: -webkit-box;
  overflow: hidden;
  font-family: var(--font-serif);
  font-size: clamp(20px, 2vw, 26px);
  font-weight: 600;
  line-height: 1.42;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.hero-meta-line {
  color: rgba(247, 245, 238, 0.7);
  font-size: 11px;
}

.hero-open {
  position: absolute;
  top: 18px;
  right: 18px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 30px;
  padding: 0 11px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  background: rgba(16, 31, 27, 0.26);
  color: #fff;
  font-size: 11px;
  backdrop-filter: blur(8px);
}

.home-section {
  margin-top: 46px;
}

.section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.section-head h2 {
  margin: 0;
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: 22px;
  font-weight: 600;
}

.section-head p {
  margin: 5px 0 0;
  color: var(--ink-3);
  font-size: 11.5px;
}

.text-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--accent);
  font-size: 11.5px;
  font-weight: 600;
}

.text-link:hover {
  color: var(--accent-strong);
}

.hot-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.module-tile {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 7px;
  min-height: 168px;
  padding: 14px 14px 12px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--panel);
  text-align: left;
  transition: border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
}

.module-tile:hover {
  transform: translateY(-2px);
  border-color: rgba(14, 106, 91, 0.3);
  box-shadow: 0 10px 24px rgba(20, 40, 33, 0.07);
}

.module-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.module-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--accent-soft);
  color: var(--accent);
}

.module-count {
  color: var(--ink-3);
  font-size: 10px;
  letter-spacing: 0.04em;
}

.module-tile strong {
  color: var(--ink);
  font-size: 13.5px;
  font-weight: 600;
}

.module-desc {
  color: var(--ink-3);
  font-size: 10.5px;
  line-height: 1.55;
}

.module-latest {
  display: -webkit-box;
  overflow: hidden;
  width: 100%;
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px dashed var(--line);
  color: var(--ink-2);
  font-size: 10.5px;
  line-height: 1.55;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.module-go {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--accent);
  font-size: 10.5px;
  font-weight: 600;
}

.latest-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 26px;
  border-top: 1px solid var(--line);
}

.latest-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 4px;
  border-bottom: 1px solid var(--line);
  text-align: left;
}

.latest-row:hover .latest-title {
  color: var(--accent);
}

.latest-main {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  flex: 1;
}

.latest-meta {
  color: var(--ink-3);
  font-size: 10px;
  letter-spacing: 0.02em;
}

.latest-title {
  overflow: hidden;
  color: var(--ink);
  font-size: 12.5px;
  font-weight: 550;
  line-height: 1.5;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.latest-tag {
  flex: none;
  padding: 2px 7px;
  border-radius: 999px;
  background: var(--bg-soft);
  color: var(--ink-3);
  font-size: 9.5px;
}

@media (max-width: 1080px) {
  .home {
    padding: 28px 26px 64px;
  }

  .hero {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 22px;
  }

  .hot-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .module-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 860px) {
  .hero {
    grid-template-columns: minmax(0, 1fr);
  }

  .hero-cover {
    min-height: 260px;
  }

  .hero-copy {
    padding-top: 2px;
  }

  .module-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .home {
    padding: 20px 16px 48px;
  }

  h1 {
    margin-top: 12px;
    font-size: 38px;
  }

  .hero-lead {
    font-size: 12.5px;
  }

  .hero-cover {
    min-height: 230px;
    border-radius: 16px;
  }

  .hero-caption {
    right: 16px;
    bottom: 16px;
    left: 16px;
  }

  .hero-open {
    display: none;
  }

  .home-section {
    margin-top: 34px;
  }

  .hot-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .module-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .module-tile {
    min-height: 0;
  }

  .latest-list {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>

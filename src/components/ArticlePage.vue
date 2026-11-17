<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import ArticleCard from './ArticleCard.vue'
import { articlePath, navigate } from '../router'
import { findArticle, loadPortal, portalState } from '../stores/portal'
import { MODULE_META, formatFullDate } from '../utils/portal'

const props = defineProps<{ articleId: string }>()

const fullText = ref('')
const loadingText = ref(false)
const textError = ref('')
const coverFailed = ref(false)

const article = computed(() => findArticle(props.articleId))
const related = computed(() => {
  if (!article.value || !portalState.data) return []
  return portalState.data.articles
    .filter((item) => item.category === article.value?.category && item.id !== article.value?.id)
    .slice(0, 3)
})

const paragraphs = computed(() => {
  const text = fullText.value
  if (!text) return []
  const body = article.value && text.startsWith(article.value.title)
    ? text.slice(article.value.title.length).trim()
    : text
  const sentences = body.split(/(?<=[。！？!?])\s*/).filter((sentence) => sentence.trim().length > 3)
  const groups: string[] = []
  for (let index = 0; index < sentences.length; index += 3) {
    const chunk = sentences.slice(index, index + 3).join('').trim()
    if (chunk) groups.push(chunk)
  }
  return groups
})

async function loadText(): Promise<void> {
  await loadPortal().catch(() => undefined)
  if (!article.value) return
  loadingText.value = true
  textError.value = ''
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}articles.json`)
    if (!response.ok) throw new Error(`articles.json ${response.status}`)
    const payload = (await response.json()) as { articles: Record<string, string> }
    fullText.value = payload.articles[props.articleId] || ''
  } catch (error) {
    textError.value = error instanceof Error ? error.message : '全文加载失败'
  } finally {
    loadingText.value = false
  }
}

function openArticle(id: string): void {
  navigate(articlePath(id))
}

function askAssistant(): void {
  if (!article.value) return
  const question = `和这篇推文相关的校园内容还有哪些：${article.value.title}`
  navigate(`/assistant?q=${encodeURIComponent(question)}`)
}

watch(() => props.articleId, loadText, { immediate: true })
onMounted(() => {
  loadPortal().catch(() => undefined)
})
</script>

<template>
  <div class="article-page">
    <div v-if="!portalState.data && portalState.loading" class="article-state">正在加载…</div>

    <div v-else-if="!article" class="article-state">
      <p>没有找到这篇文章，可能链接已经失效。</p>
      <button type="button" @click="navigate('/')">回到首页</button>
    </div>

    <template v-else>
      <div class="crumb">
        <button type="button" @click="navigate(`/${article.category}`)">
          <AppIcon name="arrow-left" :size="14" />
          {{ MODULE_META[article.category].label }}
        </button>
        <span>/</span>
        <span class="crumb-title">{{ article.title }}</span>
      </div>

      <div class="article-layout">
        <article class="article-main">
          <header class="article-head">
            <div class="tag-line">
              <span class="cat-tag" :data-cat="MODULE_META[article.category].label">
                {{ MODULE_META[article.category].label }}
              </span>
              <span v-for="tag in article.tags" :key="tag" class="mini-tag"># {{ tag }}</span>
            </div>
            <h1>{{ article.title }}</h1>
            <div class="article-meta">
              <span>{{ article.mp }}</span>
              <span class="meta-dot"></span>
              <span>{{ formatFullDate(article.date) }}</span>
            </div>
          </header>

          <div v-if="article.cover && !coverFailed" class="article-cover">
            <img
              :src="article.cover"
              :alt="article.title"
              referrerpolicy="no-referrer"
              @error="coverFailed = true"
            />
          </div>

          <div class="article-actions">
            <a class="primary-action" :href="article.url" target="_blank" rel="noopener noreferrer">
              <AppIcon name="external" :size="15" />
              打开公众号原文
            </a>
            <button class="ghost-action" type="button" @click="askAssistant">
              <AppIcon name="search" :size="15" />
              找相关推文
            </button>
          </div>

          <div v-if="loadingText" class="article-loading">正在载入全文…</div>
          <div v-else-if="textError" class="article-loading">{{ textError }}</div>
          <div v-else-if="!paragraphs.length" class="article-loading">
            这篇暂未收录完整正文，请打开公众号原文查看。
          </div>
          <div v-else class="article-body">
            <p v-for="(paragraph, index) in paragraphs" :key="index">{{ paragraph }}</p>
          </div>
        </article>

        <aside class="article-aside">
          <div class="aside-card">
            <h3>关于这篇</h3>
            <dl>
              <div>
                <dt>公众号</dt>
                <dd>{{ article.mp }}</dd>
              </div>
              <div>
                <dt>发布时间</dt>
                <dd>{{ formatFullDate(article.date) }}</dd>
              </div>
              <div>
                <dt>分类</dt>
                <dd>{{ MODULE_META[article.category].label }}</dd>
              </div>
              <div v-if="article.college">
                <dt>学院</dt>
                <dd>{{ article.college }}</dd>
              </div>
            </dl>
            <a :href="article.url" target="_blank" rel="noopener noreferrer" class="aside-link">
              查看原文
              <AppIcon name="external" :size="13" />
            </a>
          </div>

          <div class="aside-note">
            <AppIcon name="info" :size="14" />
            <p>内容来自公众号公开推文，仅供参考；具体安排以原文和学校通知为准。</p>
          </div>
        </aside>
      </div>

      <section v-if="related.length" class="related">
        <div class="related-head">
          <h2>同类内容</h2>
          <button type="button" @click="navigate(`/${article.category}`)">
            查看全部
            <AppIcon name="arrow-right" :size="13" />
          </button>
        </div>
        <div class="related-grid">
          <ArticleCard
            v-for="item in related"
            :key="item.id"
            :article="item"
            variant="row"
            @open="openArticle"
          />
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.article-page {
  max-width: 1080px;
  margin: 0 auto;
  padding: 24px 38px 72px;
}

.article-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 100px 0;
  color: var(--ink-3);
  font-size: 13px;
}

.article-state button {
  padding: 7px 16px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  color: var(--ink-2);
  font-size: 12px;
}

.crumb {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--ink-3);
  font-size: 10.5px;
}

.crumb button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--ink-3);
}

.crumb button:hover {
  color: var(--accent);
}

.crumb-title {
  max-width: 52vw;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.article-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 268px;
  gap: 38px;
  margin-top: 22px;
}

.article-head h1 {
  margin: 12px 0 10px;
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: clamp(28px, 3.4vw, 40px);
  font-weight: 600;
  line-height: 1.42;
}

.tag-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px;
}

.mini-tag {
  color: var(--ink-3);
  font-size: 10px;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--ink-3);
  font-size: 11px;
}

.meta-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--line-strong);
}

.article-cover {
  overflow: hidden;
  max-height: 360px;
  margin-top: 22px;
  border-radius: 16px;
  background: var(--bg-soft);
}

.article-cover img {
  display: block;
  width: 100%;
  height: 100%;
  max-height: 360px;
  object-fit: cover;
}

.article-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 18px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--line);
}

.primary-action,
.ghost-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.primary-action {
  background: var(--accent);
  color: #fff;
}

.primary-action:hover {
  background: var(--accent-strong);
}

.ghost-action {
  border: 1px solid var(--line-strong);
  background: var(--panel);
  color: var(--ink-2);
}

.ghost-action:hover {
  color: var(--accent);
  border-color: rgba(14, 106, 91, 0.35);
}

.article-body {
  padding-top: 22px;
  color: #2c343d;
  font-size: 15px;
  line-height: 1.95;
}

.article-body p {
  margin: 0 0 1.2em;
}

.article-loading {
  padding: 28px 0;
  color: var(--ink-3);
  font-size: 12.5px;
}

.article-aside {
  padding-top: 6px;
}

.aside-card {
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--panel);
}

.aside-card h3 {
  margin: 0 0 14px;
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: 15px;
  font-weight: 600;
}

.aside-card dl {
  margin: 0;
}

.aside-card dl > div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px dashed var(--line);
  font-size: 11px;
}

.aside-card dl > div:last-child {
  border-bottom: none;
}

.aside-card dt {
  color: var(--ink-3);
}

.aside-card dd {
  margin: 0;
  color: var(--ink-2);
  text-align: right;
}

.aside-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 14px;
  color: var(--accent);
  font-size: 11.5px;
  font-weight: 600;
}

.aside-note {
  display: flex;
  gap: 7px;
  margin-top: 14px;
  padding: 12px;
  border: 1px dashed var(--line);
  border-radius: 12px;
  color: var(--ink-3);
}

.aside-note p {
  margin: 0;
  font-size: 10.5px;
  line-height: 1.6;
}

.related {
  margin-top: 54px;
}

.related-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.related-head h2 {
  margin: 0;
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: 20px;
  font-weight: 600;
}

.related-head button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--accent);
  font-size: 11px;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 900px) {
  .article-page {
    padding: 20px 24px 60px;
  }

  .article-layout {
    grid-template-columns: minmax(0, 1fr);
    gap: 22px;
  }

  .article-aside {
    display: none;
  }

  .related-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 640px) {
  .article-page {
    padding: 16px 16px 48px;
  }

  .article-head h1 {
    font-size: 25px;
  }

  .article-body {
    font-size: 14.5px;
  }

  .article-cover {
    max-height: 220px;
  }

  .article-cover img {
    max-height: 220px;
  }
}
</style>

<script setup lang="ts">
import AppIcon from './AppIcon.vue'
import { KNOWLEDGE, WELCOME_CARDS } from '../data/knowledge'
import corpusMeta from '../data/corpus-meta.json'

const latest = corpusMeta.latest.slice(0, 3)

const emit = defineEmits<{ ask: [question: string] }>()
</script>

<template>
  <section class="welcome">
    <div class="hero">
      <div class="eyebrow">
        <span class="pulse-dot"></span>
        <span>校园信息 · 一句话问清</span>
      </div>

      <h1>
        学校的事，<br />
        <span class="accent">问我就好</span><span class="period">。</span>
      </h1>

      <p class="lead">
        办事流程有整理好的答案，校园动态则来自最近三周的公众号推文。每条回答后面都带着出处，点开就能核对原文。
      </p>

      <div class="stats">
        <div class="stat">
          <strong>{{ KNOWLEDGE.length }}</strong>
          <span>条预设问答</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat">
          <strong>{{ corpusMeta.stats.docs }}</strong>
          <span>篇公众号推文</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat">
          <strong>100%</strong>
          <span>回答附出处</span>
        </div>
      </div>
    </div>

    <div class="suggest">
      <div class="suggest-head">
        <span class="suggest-label">试试这样问</span>
        <span class="suggest-sub">点击直接提问 · 预设问答 + 公众号原文</span>
      </div>

      <div class="card-grid">
        <button
          v-for="(card, index) in WELCOME_CARDS"
          :key="card.question"
          class="q-card"
          type="button"
          :style="{ '--i': index }"
          @click="emit('ask', card.question)"
        >
          <span class="q-top">
            <span class="cat-tag" :data-cat="card.category">{{ card.category }}</span>
            <AppIcon name="arrow-right" :size="16" class="q-arrow" />
          </span>
          <span class="q-text">{{ card.question }}</span>
          <span class="q-hint">{{ card.hint }}</span>
        </button>
      </div>
    </div>

    <div class="latest">
      <div class="suggest-head">
        <span class="suggest-label">公众号刚更新</span>
        <span class="suggest-sub">
          {{ corpusMeta.stats.accounts }} 个校园号 · 数据截至 {{ corpusMeta.stats.dateMax }}
        </span>
      </div>

      <div class="latest-grid">
        <button
          v-for="item in latest"
          :key="item.url"
          class="latest-item"
          type="button"
          @click="emit('ask', item.title)"
        >
          <span class="latest-meta">
            <span class="latest-mp">{{ item.mp }}</span>
            <span class="latest-date">{{ item.date.slice(5, 10) }}</span>
          </span>
          <span class="latest-title">{{ item.title }}</span>
          <span class="latest-ask">问这条 <AppIcon name="arrow-right" :size="12" /></span>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.welcome {
  max-width: 900px;
  margin: 0 auto;
  padding: 38px 10px 16px;
}

.hero {
  animation: rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.14em;
  color: var(--accent);
}

.pulse-dot {
  position: relative;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent);
}

.pulse-dot::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 1px solid var(--accent);
  opacity: 0;
  animation: ping 2.6s ease-out infinite;
}

h1 {
  margin: 16px 0 16px;
  font-family: var(--font-serif);
  font-size: clamp(36px, 4.8vw, 54px);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.01em;
  color: #14261f;
}

h1 .accent {
  color: var(--accent);
  background: linear-gradient(transparent 68%, rgba(217, 164, 65, 0.3) 68%);
}

h1 .period {
  color: var(--amber);
}

.lead {
  max-width: 580px;
  margin: 0;
  font-size: 14.5px;
  line-height: 1.8;
  color: var(--ink-2);
}

.stats {
  display: flex;
  align-items: center;
  gap: 22px;
  margin-top: 24px;
}

.stat {
  display: flex;
  align-items: baseline;
  gap: 7px;
}

.stat strong {
  font-family: var(--font-serif);
  font-size: 22px;
  font-weight: 700;
  color: #1d3a30;
}

.stat span {
  font-size: 11.5px;
  letter-spacing: 0.03em;
  color: var(--ink-3);
}

.stat-divider {
  width: 1px;
  height: 18px;
  background: var(--line-strong);
}

.suggest {
  margin-top: 34px;
  animation: rise 0.6s 0.08s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.suggest-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.suggest-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--ink-2);
}

.suggest-sub {
  font-size: 11px;
  color: var(--ink-3);
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.q-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 13px 15px 12px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.72);
  text-align: left;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease,
    background 0.18s ease;
  animation: rise 0.5s both;
  animation-delay: calc(var(--i) * 45ms + 0.1s);
}

.q-card:hover {
  transform: translateY(-2px);
  border-color: rgba(14, 106, 91, 0.28);
  background: #fff;
  box-shadow: var(--shadow-sm);
}

.q-card:focus-visible {
  outline: 2px solid rgba(14, 106, 91, 0.35);
  outline-offset: 2px;
}

.q-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.q-arrow {
  color: var(--accent);
  opacity: 0;
  transform: translateX(-5px);
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.q-card:hover .q-arrow {
  opacity: 1;
  transform: translateX(0);
}

.q-text {
  font-size: 14.5px;
  font-weight: 600;
  line-height: 1.55;
  color: var(--ink);
}

.q-hint {
  font-size: 11px;
  letter-spacing: 0.01em;
  color: var(--ink-3);
}

.latest {
  margin-top: 24px;
  animation: rise 0.6s 0.18s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.latest-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.latest-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-left: 2px solid var(--accent);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.55);
  text-align: left;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.latest-item:hover {
  transform: translateY(-1px);
  background: #fff;
  box-shadow: var(--shadow-sm);
}

.latest-item:focus-visible {
  outline: 2px solid rgba(14, 106, 91, 0.35);
  outline-offset: 2px;
}

.latest-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 10px;
  color: var(--ink-3);
}

.latest-mp {
  overflow: hidden;
  color: var(--accent);
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.latest-date {
  flex: none;
}

.latest-title {
  display: -webkit-box;
  overflow: hidden;
  font-size: 12.8px;
  font-weight: 550;
  line-height: 1.55;
  color: var(--ink);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.latest-ask {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  color: var(--ink-3);
  opacity: 0;
  transition: opacity 0.16s ease, color 0.16s ease;
}

.latest-item:hover .latest-ask {
  color: var(--accent);
  opacity: 1;
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes ping {
  0% {
    opacity: 0.55;
    transform: scale(0.6);
  }
  75%,
  100% {
    opacity: 0;
    transform: scale(1.9);
  }
}

@media (max-width: 980px) {
  .card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .welcome {
    padding-top: 34px;
  }

  h1 {
    font-size: clamp(34px, 10vw, 44px);
  }

  .lead {
    font-size: 14px;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .stat {
    flex-direction: column;
    align-items: flex-start;
    gap: 1px;
  }

  .stat strong {
    font-size: 19px;
  }

  .stat span {
    font-size: 10.5px;
    line-height: 1.4;
  }

  .stat-divider {
    display: none;
  }

  .card-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .latest-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .suggest-head {
    flex-direction: column;
    gap: 4px;
  }
}
</style>

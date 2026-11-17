<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from './AppIcon.vue'
import type { PortalArticle } from '../types'
import { MODULE_META, formatDate, moduleIcon } from '../utils/portal'

const props = withDefaults(
  defineProps<{
    article: PortalArticle
    variant?: 'grid' | 'row' | 'compact'
  }>(),
  { variant: 'grid' },
)

const emit = defineEmits<{ open: [id: string] }>()
const imageOk = ref(true)
const image = computed(() => props.article.texture || props.article.cover)
</script>

<template>
  <button
    class="article-card"
    :class="[`variant-${variant}`, `cat-${article.category}`]"
    type="button"
    @click="emit('open', article.id)"
  >
    <span class="card-visual">
      <img
        v-if="image && imageOk"
        class="card-image"
        :src="image"
        :alt="article.title"
        loading="lazy"
        referrerpolicy="no-referrer"
        @error="imageOk = false"
      />
      <span class="card-shade"></span>
      <span class="card-cat">{{ MODULE_META[article.category].label }}</span>
      <span class="card-icon">
        <AppIcon :name="moduleIcon(article.category)" :size="variant === 'row' ? 22 : 28" />
      </span>
    </span>

    <span class="card-body">
      <span class="card-title">{{ article.title }}</span>
      <span v-if="variant !== 'compact'" class="card-summary">{{ article.summary }}</span>
      <span class="card-meta">
        <span class="card-mp">{{ article.mp }}</span>
        <span>{{ formatDate(article.date) }}</span>
      </span>
    </span>
  </button>
</template>

<style scoped>
.article-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--panel);
  text-align: left;
  box-shadow: 0 1px 2px rgba(26, 37, 30, 0.03);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.article-card:hover {
  transform: translateY(-2px);
  border-color: rgba(14, 106, 91, 0.28);
  box-shadow: 0 12px 28px rgba(20, 40, 33, 0.09);
}

.card-visual {
  position: relative;
  display: block;
  height: 148px;
  flex: none;
  overflow: hidden;
  background-color: #dfe7e1;
}

.card-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

.article-card:hover .card-image {
  transform: scale(1.035);
}

.cat-library {
  --tint: 14, 106, 91;
}

.cat-college {
  --tint: 169, 112, 28;
}

.cat-academic {
  --tint: 52, 91, 132;
}

.cat-activity {
  --tint: 184, 104, 54;
}

.cat-service {
  --tint: 92, 116, 72;
}

.card-shade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(135deg, rgba(var(--tint, 14, 106, 91), 0.2), transparent 52%),
    linear-gradient(180deg, rgba(16, 31, 27, 0.04) 20%, rgba(16, 31, 27, 0.42) 100%);
}

.cat-library .card-visual {
  background-image: linear-gradient(135deg, #e3efe9, #b9d2c5);
}

.cat-college .card-visual {
  background-image: linear-gradient(135deg, #e9e4d5, #c9bda2);
}

.cat-academic .card-visual {
  background-image: linear-gradient(135deg, #e3e8ef, #b7c4d6);
}

.cat-activity .card-visual {
  background-image: linear-gradient(135deg, #f3e6dd, #d8b9a2);
}

.cat-service .card-visual {
  background-image: linear-gradient(135deg, #e8ece0, #c1ccb0);
}

.card-cat {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.84);
  color: #27423a;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  backdrop-filter: blur(6px);
}

.card-icon {
  position: absolute;
  right: 11px;
  bottom: 10px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  backdrop-filter: blur(5px);
}

.card-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 7px;
  padding: 13px 14px 12px;
}

.card-title {
  display: -webkit-box;
  overflow: hidden;
  color: var(--ink);
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.card-summary {
  display: -webkit-box;
  overflow: hidden;
  color: var(--ink-3);
  font-size: 11.5px;
  line-height: 1.6;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
  color: var(--ink-3);
  font-size: 10.5px;
}

.card-mp {
  overflow: hidden;
  max-width: 66%;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.variant-row {
  flex-direction: row;
}

.variant-row .card-visual {
  width: 150px;
  height: auto;
  min-height: 108px;
}

.variant-row .card-body {
  padding: 11px 13px;
}

.variant-row .card-title {
  font-size: 13px;
}

.variant-compact .card-visual {
  height: 120px;
}

@media (max-width: 640px) {
  .card-visual {
    height: 136px;
  }

  .variant-row .card-visual {
    width: 112px;
    min-height: 94px;
  }

  .variant-row .card-title {
    font-size: 12.5px;
  }
}
</style>

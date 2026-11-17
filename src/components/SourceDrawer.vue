<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import type { SourceRef } from '../types'

const props = defineProps<{ source: SourceRef | null }>()
const emit = defineEmits<{ close: [] }>()

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') emit('close')
}

function openOriginal(): void {
  if (!props.source?.url) return
  window.open(props.source.url, '_blank', 'noopener,noreferrer')
}

watch(
  () => props.source,
  (value) => {
    if (value) {
      window.addEventListener('keydown', onKeydown)
      document.body.style.overflow = 'hidden'
    } else {
      window.removeEventListener('keydown', onKeydown)
      document.body.style.overflow = ''
    }
  },
)

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="source" class="drawer-root">
        <div class="drawer-mask" @click="emit('close')"></div>

        <aside class="drawer-panel" role="dialog" aria-modal="true" aria-label="来源详情">
          <header class="drawer-head">
            <div>
              <div class="drawer-eyebrow">依据来源</div>
              <div class="drawer-sub">
                {{ source.url ? '公众号原文 · 点击可跳转' : '演示数据 · 非官方原文' }}
              </div>
            </div>
            <button class="close-btn" type="button" aria-label="关闭来源详情" @click="emit('close')">
              <AppIcon name="close" :size="18" />
            </button>
          </header>

          <div class="drawer-body">
            <span class="cat-tag" :data-cat="source.tag">{{ source.tag }}</span>
            <h2>{{ source.title }}</h2>

            <dl class="meta">
              <div class="meta-row">
                <dt>发布单位</dt>
                <dd>{{ source.department }}</dd>
              </div>
              <div class="meta-row">
                <dt>发布时间</dt>
                <dd>{{ source.date }}</dd>
              </div>
              <div class="meta-row">
                <dt>文档类型</dt>
                <dd>{{ source.tag }}</dd>
              </div>
            </dl>

            <div class="excerpt-label">{{ source.url ? '公众号原文摘录' : '原文摘录' }}</div>
            <blockquote class="excerpt">{{ source.excerpt }}</blockquote>

            <div class="demo-callout">
              <AppIcon name="info" :size="15" />
              <p v-if="source.url">
                摘录只用于快速预览，完整内容、报名方式和时间地点请以公众号原文为准。
              </p>
              <p v-else>这是为演示整理的摘录。接入真实数据后，这里会显示公众号原文链接和发布时间。</p>
            </div>
          </div>

          <footer class="drawer-foot">
            <button class="btn-secondary" type="button" @click="emit('close')">关闭</button>
            <button
              class="btn-primary"
              type="button"
              :disabled="!source.url"
              :title="source.url ? '在新标签页打开公众号原文' : '演示数据暂无原文链接'"
              @click="openOriginal"
            >
              <AppIcon name="external" :size="14" />
              <span>打开原文</span>
            </button>
          </footer>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-root {
  position: fixed;
  inset: 0;
  z-index: 90;
}

.drawer-mask {
  position: absolute;
  inset: 0;
  background: rgba(16, 31, 27, 0.32);
  backdrop-filter: blur(2px);
}

.drawer-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  width: min(440px, 94vw);
  background: var(--panel);
  box-shadow: -18px 0 50px rgba(16, 31, 27, 0.16);
}

.drawer-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 22px 16px;
  border-bottom: 1px solid var(--line);
}

.drawer-eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: var(--accent);
}

.drawer-sub {
  margin-top: 4px;
  font-size: 11px;
  color: var(--ink-3);
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex: none;
  border-radius: 9px;
  color: var(--ink-3);
  transition: background 0.16s ease, color 0.16s ease;
}

.close-btn:hover {
  background: var(--bg-soft);
  color: var(--ink);
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 22px;
}

.drawer-body h2 {
  margin: 12px 0 18px;
  font-size: 19px;
  font-weight: 650;
  line-height: 1.5;
  color: var(--ink);
}

.meta {
  margin: 0 0 22px;
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--panel-2);
}

.meta-row {
  display: flex;
  gap: 14px;
  font-size: 12.5px;
  line-height: 2;
}

.meta-row dt {
  flex: none;
  width: 56px;
  color: var(--ink-3);
}

.meta-row dd {
  margin: 0;
  color: var(--ink-2);
}

.excerpt-label {
  margin-bottom: 8px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--ink-3);
}

.excerpt {
  margin: 0;
  padding: 15px 16px;
  border-left: 3px solid var(--accent);
  border-radius: 0 10px 10px 0;
  background: var(--accent-soft);
  color: #274a40;
  font-size: 13.5px;
  line-height: 1.9;
}

.demo-callout {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 20px;
  padding: 10px 12px;
  border: 1px dashed var(--line-strong);
  border-radius: 10px;
  color: var(--ink-3);
}

.demo-callout :deep(svg) {
  flex: none;
  margin-top: 1px;
}

.demo-callout p {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.65;
}

.drawer-foot {
  display: flex;
  gap: 10px;
  padding: 16px 22px calc(16px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--line);
}

.btn-secondary,
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 42px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 550;
}

.btn-secondary {
  flex: none;
  width: 88px;
  border: 1px solid var(--line-strong);
  background: var(--panel);
  color: var(--ink-2);
}

.btn-secondary:hover {
  border-color: var(--ink-3);
}

.btn-primary {
  flex: 1;
  background: var(--accent);
  color: #fff;
}

.btn-primary:disabled {
  background: #ddd9cf;
  color: #f7f5f0;
  cursor: not-allowed;
}

.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.22s ease;
}

.drawer-enter-active .drawer-panel,
.drawer-leave-active .drawer-panel {
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from .drawer-panel,
.drawer-leave-to .drawer-panel {
  transform: translateX(102%);
}

@media (max-width: 640px) {
  .drawer-panel {
    width: 100%;
  }

  .drawer-body {
    padding: 18px;
  }
}
</style>

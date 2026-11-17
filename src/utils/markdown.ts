import { marked } from 'marked'
import DOMPurify from 'dompurify'

marked.setOptions({
  gfm: true,
  breaks: true,
})

/**
 * 把回答的 Markdown 渲染成安全的 HTML，并把正文里的 [1][2] 变成可点击的来源角标。
 */
export function renderMarkdown(text: string): string {
  if (!text) return ''

  const raw = marked.parse(text, { async: false }) as string
  const clean = DOMPurify.sanitize(raw)
  return clean.replace(
    /\[(\d{1,2})\]/g,
    (_match, n: string) =>
      `<sup class="cite" data-cite="${n}" role="button" tabindex="0" aria-label="查看来源 ${n}">${n}</sup>`,
  )
}

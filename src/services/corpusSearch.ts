import type { SourceRef } from '../types'

export interface CorpusChunk {
  id: string
  docId: string
  mp: string
  title: string
  date: string
  ts: number
  url: string
  chunkIndex: number
  text: string
}

export interface CorpusHit {
  chunk: CorpusChunk
  score: number
  coverage: number
  snippet: string
}

interface IndexedChunk {
  chunk: CorpusChunk
  tf: Map<string, number>
  len: number
  titleSet: Set<string>
}

interface SearchIndex {
  entries: IndexedChunk[]
  df: Map<string, number>
  avgLen: number
  maxTs: number
  size: number
  firstByDoc: Map<string, CorpusChunk>
}

/** 去掉口语化的提问外壳，只留下真正用来检索的词。 */
const STOP_PHRASE =
  /最近|近期|这周|本周|下周|今天|明天|最新|有什么|有哪些|哪些|怎么|如何|请问|一下|帮我|我想|想知道|学校|校园|华东理工|华理|这条|这篇|推文|讲了什么|讲了啥|什么|介绍/g

const K1 = 1.2
const B = 0.75
const TITLE_EXTRA_WEIGHT = 1.8

function tokenize(text: string): string[] {
  const cleaned = text.toLowerCase().replace(/[^\p{Script=Han}a-z0-9]+/gu, ' ')
  const tokens: string[] = []

  for (const part of cleaned.split(' ')) {
    if (!part) continue
    if (/^[a-z0-9]+$/.test(part)) {
      if (part.length > 1) tokens.push(part)
      continue
    }
    const chars = [...part]
    if (chars.length === 1) {
      tokens.push(chars[0])
    } else {
      for (let i = 0; i < chars.length - 1; i += 1) {
        tokens.push(chars[i] + chars[i + 1])
      }
    }
  }

  return tokens
}

function buildIndex(chunks: CorpusChunk[]): SearchIndex {
  const entries = chunks.map((chunk) => {
    const titleTokens = tokenize(chunk.title)
    const tokens = [
      ...titleTokens,
      ...titleTokens,
      ...titleTokens,
      ...tokenize(chunk.text),
    ]
    const tf = new Map<string, number>()
    for (const token of tokens) tf.set(token, (tf.get(token) || 0) + 1)
    return { chunk, tf, len: tokens.length, titleSet: new Set(titleTokens) }
  })

  const df = new Map<string, number>()
  for (const entry of entries) {
    for (const token of entry.tf.keys()) df.set(token, (df.get(token) || 0) + 1)
  }

  const avgLen = entries.reduce((sum, entry) => sum + entry.len, 0) / (entries.length || 1)
  const maxTs = Math.max(...entries.map((entry) => entry.chunk.ts), 0)

  const firstByDoc = new Map<string, CorpusChunk>()
  for (const chunk of chunks) {
    const existing = firstByDoc.get(chunk.docId)
    if (!existing || chunk.chunkIndex < existing.chunkIndex) firstByDoc.set(chunk.docId, chunk)
  }

  return { entries, df, avgLen, maxTs, size: entries.length, firstByDoc }
}

const BOILERPLATE =
  /排版|编辑[:：]|审核[:：]|责编|来源[:：]|供稿|摄影|文案|往期|微信号|扫码|关注|点赞|在看|分享|阅读原文|负责人|校对|美编|海报|点击|长按|识别二维码/

function chineseRatio(text: string): number {
  const cjk = (text.match(/[\u4e00-\u9fff]/g) || []).length
  return cjk / Math.max(text.replace(/\s/g, '').length, 1)
}

function makeSnippet(text: string, terms: string[]): string {
  const sentences = text
    .split(/(?<=[。！？!?；;])|(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 12)

  let best = ''
  let bestScore = -Infinity

  for (const sentence of sentences) {
    const hits = terms.reduce((count, term) => count + (sentence.includes(term) ? 1 : 0), 0)
    const boilerplatePenalty = BOILERPLATE.test(sentence) ? 3 : 0
    const score = hits * 10 + chineseRatio(sentence) * 2 - boilerplatePenalty
    if (score > bestScore || (score === bestScore && best && sentence.length < best.length)) {
      best = sentence
      bestScore = score
    }
  }

  if (!best) best = text

  const hasHit = terms.some((term) => best.toLowerCase().includes(term))
  if (chineseRatio(best) < 0.18 && !hasHit) {
    return '（原文为英文内容，完整信息请点开原文查看）'
  }

  if (best.length > 170) best = `${best.slice(0, 170).trimEnd()}…`
  return best
}

let indexPromise: Promise<SearchIndex> | null = null

function loadIndex(): Promise<SearchIndex> {
  if (!indexPromise) {
    const url = `${import.meta.env.BASE_URL}corpus.json`
    indexPromise = fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error(`语料加载失败：HTTP ${response.status}`)
        return response.json() as Promise<{ chunks: CorpusChunk[] }>
      })
      .then((payload) => buildIndex(payload.chunks))
      .catch((error) => {
        indexPromise = null
        throw error
      })
  }
  return indexPromise
}

export async function searchCorpus(rawQuery: string, limit = 4): Promise<CorpusHit[]> {
  const index = await loadIndex()
  const clean = rawQuery.replace(STOP_PHRASE, ' ')
  const terms = [...new Set(tokenize(clean))]
  if (!terms.length) return []

  const scored = index.entries.map((entry) => {
    let score = 0
    let matched = 0
    let titleHits = 0

    for (const term of terms) {
      const termDf = index.df.get(term) || 0
      if (!termDf) continue
      const idf = Math.log(1 + (index.size - termDf + 0.5) / (termDf + 0.5))
      const tf = entry.tf.get(term) || 0

      if (tf > 0) {
        matched += 1
        score +=
          idf *
          ((tf * (K1 + 1)) / (tf + K1 * (1 - B + B * (entry.len / index.avgLen))))
      }

      if (entry.titleSet.has(term)) {
        titleHits += 1
        score += idf * TITLE_EXTRA_WEIGHT
      }
    }

    const ageDays = Math.max(0, (index.maxTs - entry.chunk.ts) / 86400)
    score *= 1 + 0.18 * Math.exp(-ageDays / 12)

    return { entry, score, titleHits, coverage: matched / terms.length }
  })

  scored.sort((a, b) => b.score - a.score)

  const hits: CorpusHit[] = []
  const seenDocs = new Set<string>()

  for (const item of scored) {
    if (item.score <= 0 || item.titleHits === 0) continue
    if (item.coverage < 0.6 && item.score < 10) continue
    if (seenDocs.has(item.entry.chunk.docId)) continue

    seenDocs.add(item.entry.chunk.docId)
    const snippetChunk = index.firstByDoc.get(item.entry.chunk.docId) ?? item.entry.chunk
    hits.push({
      chunk: item.entry.chunk,
      score: item.score,
      coverage: item.coverage,
      snippet: makeSnippet(snippetChunk.text, terms),
    })
    if (hits.length >= limit) break
  }

  return hits
}

export function corpusHitToSource(hit: CorpusHit): SourceRef {
  return {
    id: `corpus-${hit.chunk.id}`,
    title: hit.chunk.title,
    department: hit.chunk.mp,
    date: hit.chunk.date.slice(0, 10),
    tag: '公众号',
    excerpt: hit.snippet,
    url: hit.chunk.url,
  }
}

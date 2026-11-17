import { matchKnowledge } from './matcher'
import { corpusHitToSource, searchCorpus } from './corpusSearch'
import type { CorpusHit } from './corpusSearch'
import corpusMeta from '../data/corpus-meta.json'
import type { MatchResult, SourceRef } from '../types'

export interface StreamHandlers {
  onStatus?: (status: 'thinking' | 'streaming') => void
  onSources: (sources: SourceRef[]) => void
  onToken: (text: string) => void
  onDone: (meta: { matched: boolean; followups: string[] }) => void
}

interface AnswerPayload {
  answer: string
  sources: SourceRef[]
  followups: string[]
  matched: boolean
}

const FRESH_INTENT = /最近|近期|这周|本周|下周|今天|明天|最新/

const CORPUS_FOLLOWUPS = [
  '这周还有哪些校园活动？',
  '最近有什么讲座？',
  '有没有奖学金相关的通知？',
]

function buildCorpusAnswer(hits: CorpusHit[]): AnswerPayload {
  const lines = [`在校园公众号里找到 ${hits.length} 条相关内容：`, '']

  hits.forEach((hit, index) => {
    lines.push(`**${index + 1}. ${hit.chunk.title}**`)
    lines.push('')
    lines.push(`${hit.chunk.mp} · ${hit.chunk.date.slice(0, 10)}`)
    lines.push('')
    lines.push(`> ${hit.snippet}`)
    lines.push('')
  })

  lines.push('上面是公众号原文摘录。具体时间、地点、报名方式请点下方「依据」查看原文，以推文为准。')

  return {
    answer: lines.join('\n'),
    sources: hits.map(corpusHitToSource),
    followups: CORPUS_FOLLOWUPS,
    matched: true,
  }
}

function fromMatch(match: MatchResult): AnswerPayload {
  return {
    answer: match.answer,
    sources: match.sources,
    followups: match.followups,
    matched: match.kind !== 'fallback',
  }
}

/**
 * 演示用的“假模型”：先用预设问答兜住办事流程，再在公众号语料里做关键词检索，
 * 最后按人打字的速度逐段吐字。不调用任何大模型 API。
 *
 * 之后接真实后端时，只需要替换本文件的 streamAnswer 实现，
 * 保持同样的 handlers 契约（onSources / onToken / onDone / signal）即可。
 */
export async function streamAnswer(
  question: string,
  handlers: StreamHandlers,
  signal: AbortSignal,
): Promise<void> {
  handlers.onStatus?.('thinking')

  const match = matchKnowledge(question)
  const freshIntent = FRESH_INTENT.test(question)
  let hits: CorpusHit[] = []

  if (match.kind === 'fallback' || (match.kind === 'entry' && freshIntent)) {
    try {
      hits = await searchCorpus(question)
    } catch {
      hits = []
    }
  }

  if (signal.aborted) throw abortError()

  const result = hits.length > 0 ? buildCorpusAnswer(hits) : fromMatch(match)

  await sleep(380 + Math.random() * 260, signal)
  handlers.onStatus?.('streaming')

  if (result.sources.length > 0) {
    handlers.onSources(result.sources)
  }

  const text = result.answer
  let cursor = 0

  while (cursor < text.length) {
    if (signal.aborted) throw abortError()
    const step = 2 + Math.floor(Math.random() * 3)
    cursor = Math.min(text.length, cursor + step)
    handlers.onToken(text.slice(0, cursor))
    await sleep(13 + Math.random() * 15, signal)
  }

  handlers.onDone({
    matched: result.matched,
    followups: result.followups,
  })
}

function abortError(): DOMException {
  return new DOMException('Aborted', 'AbortError')
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(abortError())
      return
    }

    const timer = window.setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, ms)

    const onAbort = () => {
      window.clearTimeout(timer)
      reject(abortError())
    }

    signal.addEventListener('abort', onAbort, { once: true })
  })
}

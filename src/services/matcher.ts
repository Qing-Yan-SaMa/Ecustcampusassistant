import { KNOWLEDGE } from '../data/knowledge'
import corpusMeta from '../data/corpus-meta.json'
import type { KnowledgeEntry, MatchResult } from '../types'

const corpusStats = corpusMeta.stats

const PUNCT = /[\s，。！？、；：,.!?;:~～"'“”‘’（）()【】[\]《》<>·\-—_/\\]/g

export function normalize(text: string): string {
  return text.toLowerCase().replace(PUNCT, '')
}

/** 低于这个分数就当作“知识库里没有”，走兜底回答。 */
const MIN_SCORE = 2.0

interface Scored {
  entry: KnowledgeEntry
  score: number
  hits: number
}

function scoreEntry(query: string, entry: KnowledgeEntry): { score: number; hits: number } {
  const q = normalize(query)
  let score = 0
  let hits = 0
  const seen = new Set<string>()

  const consider = (term: string, weight: number) => {
    const t = normalize(term)
    if (!t || seen.has(t)) return
    seen.add(t)
    if (q.includes(t)) {
      score += weight + t.length * 0.55
      hits += 1
    }
  }

  for (const keyword of entry.keywords) consider(keyword, 1.2)
  for (const alias of entry.aliases) consider(alias, 2.6)

  const title = normalize(entry.question)
  if (title === q) {
    score += 12
  } else if (q.length >= 2 && (title.includes(q) || q.includes(title))) {
    score += 3
  }

  return { score, hits }
}

const FALLBACK_FOLLOWUPS = [
  '最近有什么讲座？',
  '这周有哪些校园活动？',
  '补办学生证需要哪些材料？',
]

const GREETING_FOLLOWUPS = ['最近有什么讲座？', '这周有哪些校园活动？', '期末缓考怎么申请？']

const FALLBACK_ANSWER = `这个问题我暂时没在预设问答和公众号语料里找到足够相关的内容。

目前能查两类信息：

- 18 个高频办事问题，比如补办学生证、缓考、校园卡挂失；
- ${corpusStats.docs} 篇校园公众号推文（${corpusStats.accounts} 个号，${corpusStats.dateMin} 至 ${corpusStats.dateMax}），比如「最近有什么讲座」「这周有哪些校园活动」。

可以换一种说法再问，或者直接点下面的推荐问题。公众号内容会附原文链接，具体以推文为准。`

const GREETING_ANSWER = `你好，我是校园智能助手（演示版）。

我可以帮你查办事流程（补办学生证、缓考、校园卡……），也可以翻最近的校园公众号：讲座、活动、评优通知。回答会附上来源，公众号来源能直接跳原文。

试着问我「最近有什么讲座」吧。`

const CAPABILITY_ANSWER = `我现在能做到这些：

- 回答 18 个高频校园办事问题，覆盖教务、学籍、校园生活、奖助、就业和服务；
- 在 ${corpusStats.docs} 篇公众号推文里做关键词检索，回答「最近有什么讲座」「这周有哪些活动」这类时效性问题；
- 回答附「依据」；公众号来源可以点「打开原文」跳转；
- 支持连续追问、复制、重新生成、点赞点踩。

**还没做的**：语义向量检索、大模型 API、账号与历史同步。当前是纯前端演示，回答来自预设问答或公众号原文摘录。`

const THANKS_ANSWER = `不客气。如果还有校园信息方面的问题，随时问我；如果这个回答没帮上忙，可以点「踩」告诉我。`

export function matchKnowledge(rawQuery: string): MatchResult {
  const query = rawQuery.trim()
  if (!query) {
    return {
      kind: 'fallback',
      entry: null,
      answer: FALLBACK_ANSWER,
      sources: [],
      followups: FALLBACK_FOLLOWUPS,
    }
  }

  const scored: Scored[] = KNOWLEDGE.map((entry) => ({ entry, ...scoreEntry(query, entry) }))
    .filter((item) => item.hits > 0 && item.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score || b.hits - a.hits)

  if (scored.length > 0) {
    const entry = scored[0].entry
    return {
      kind: 'entry',
      entry,
      answer: entry.answer,
      sources: entry.sources,
      followups: entry.followups,
    }
  }

  const q = normalize(query)

  if (/你能做什么|你会什么|怎么用|有什么功能|能帮我做什么/.test(q)) {
    return {
      kind: 'capability',
      entry: null,
      answer: CAPABILITY_ANSWER,
      sources: [],
      followups: GREETING_FOLLOWUPS,
    }
  }

  if (/^(你好|您好|hi|hello|嗨|哈喽|在吗|有人吗)/.test(q)) {
    return {
      kind: 'greeting',
      entry: null,
      answer: GREETING_ANSWER,
      sources: [],
      followups: GREETING_FOLLOWUPS,
    }
  }

  if (/^(谢谢|感谢|辛苦了|thx|thanks)/.test(q)) {
    return {
      kind: 'thanks',
      entry: null,
      answer: THANKS_ANSWER,
      sources: [],
      followups: FALLBACK_FOLLOWUPS,
    }
  }

  return {
    kind: 'fallback',
    entry: null,
    answer: FALLBACK_ANSWER,
    sources: [],
    followups: FALLBACK_FOLLOWUPS,
  }
}

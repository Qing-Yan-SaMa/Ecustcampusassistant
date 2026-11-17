export type Category = '教务' | '学籍' | '校园生活' | '奖助' | '就业' | '服务'

export interface SourceRef {
  id: string
  title: string
  department: string
  date: string
  tag: string
  excerpt: string
  url?: string
}

export interface KnowledgeEntry {
  id: string
  category: Category
  question: string
  aliases: string[]
  keywords: string[]
  answer: string
  sources: SourceRef[]
  followups: string[]
}

export type MessageStatus = 'pending' | 'streaming' | 'done' | 'stopped' | 'error'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources: SourceRef[]
  status: MessageStatus
  feedback: 'up' | 'down' | null
  createdAt: number
  followups: string[]
  matched: boolean
}

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

export type MatchKind = 'entry' | 'greeting' | 'capability' | 'thanks' | 'fallback'

export interface MatchResult {
  kind: MatchKind
  entry: KnowledgeEntry | null
  answer: string
  sources: SourceRef[]
  followups: string[]
}

export type PortalModuleId = 'library' | 'college' | 'academic' | 'activity' | 'service'

export interface PortalArticle {
  id: string
  title: string
  mp: string
  date: string
  ts: number
  url: string
  cover: string | null
  coverPhoto: boolean
  texture: string | null
  category: PortalModuleId
  college: string
  tags: string[]
  summary: string
  hotScore: number
}

export interface PortalModule {
  id: PortalModuleId
  label: string
  count: number
}

export interface PortalData {
  generatedAt: string
  source: string
  stats: {
    articles: number
    withCover: number
    withPhoto: number
    accounts: number
    dateMin: string
    dateMax: string
    byCategory: Record<string, number>
  }
  modules: PortalModule[]
  colleges: { name: string; count: number }[]
  featured: string[]
  latest: string[]
  articles: PortalArticle[]
}

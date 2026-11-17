import type { PortalArticle, PortalModuleId } from '../types'

export const MODULE_META: Record<
  PortalModuleId,
  { label: string; short: string; icon: string; description: string }
> = {
  library: {
    label: '图书馆',
    short: '借阅、讲座、新书',
    icon: 'book',
    description: '新书推荐、借阅服务、讲座与阅读活动',
  },
  college: {
    label: '学院动态',
    short: '12 个学院',
    icon: 'building',
    description: '各学院的活动、通知与师生故事',
  },
  academic: {
    label: '教务学业',
    short: '保研、竞赛、就业',
    icon: 'cap',
    description: '保研考研、科研竞赛、实习就业与学业通知',
  },
  activity: {
    label: '校园活动',
    short: '讲座、志愿、晚会',
    icon: 'calendar',
    description: '讲座沙龙、志愿服务、文体活动与社团招新',
  },
  service: {
    label: '校园服务',
    short: '安全、后勤、生活',
    icon: 'shield',
    description: '校园安全、后勤保障与生活服务信息',
  },
}

export const MODULE_ORDER: PortalModuleId[] = [
  'library',
  'college',
  'academic',
  'activity',
  'service',
]

export function moduleIcon(category: PortalModuleId): string {
  return MODULE_META[category]?.icon || 'book'
}

export function formatDate(date: string): string {
  if (!date) return ''
  const [, month, day] = date.split('-')
  return `${Number(month)}月${Number(day)}日`
}

export function formatFullDate(date: string): string {
  if (!date) return ''
  const [year, month, day] = date.split('-')
  return `${year}年${Number(month)}月${Number(day)}日`
}

export function coverStyle(article: PortalArticle): Record<string, string> {
  const image = article.texture || article.cover
  return image ? { backgroundImage: `url("${image}")` } : {}
}

export function articleMatches(article: PortalArticle, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return [article.title, article.summary, article.mp, article.college, ...article.tags]
    .join(' ')
    .toLowerCase()
    .includes(needle)
}

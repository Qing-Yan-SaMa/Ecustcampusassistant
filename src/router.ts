import { reactive } from 'vue'
import type { PortalModuleId } from './types'

export interface RouteState {
  name: 'home' | 'module' | 'article' | 'assistant' | 'search'
  module?: PortalModuleId
  college?: string
  articleId?: string
  query?: string
}

const MODULE_IDS: PortalModuleId[] = ['library', 'college', 'academic', 'activity', 'service']

function decode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function parse(): RouteState {
  const raw = window.location.hash.replace(/^#/, '') || '/'
  const [pathPart, queryPart] = raw.split('?')
  const params = new URLSearchParams(queryPart || '')
  const parts = pathPart.split('/').filter(Boolean).map(decode)
  const first = parts[0]

  if (!first) return { name: 'home' }
  if (first === 'assistant') return { name: 'assistant', query: params.get('q') || '' }
  if (first === 'search') return { name: 'search', query: parts.slice(1).join('/') }
  if (first === 'article') return { name: 'article', articleId: parts[1] || '' }
  if (MODULE_IDS.includes(first as PortalModuleId)) {
    return {
      name: 'module',
      module: first as PortalModuleId,
      college: first === 'college' ? parts[1] || '' : undefined,
    }
  }
  return { name: 'home' }
}

export const route = reactive<RouteState>(parse())

function apply(next: RouteState): void {
  for (const key of Object.keys(route)) delete (route as Record<string, unknown>)[key]
  Object.assign(route, next)
}

window.addEventListener('hashchange', () => apply(parse()))

export function navigate(path: string): void {
  const clean = path.startsWith('/') ? path : `/${path}`
  const next = `#${clean}`
  if (window.location.hash === next) {
    apply(parse())
    return
  }
  window.location.hash = clean
}

export function articlePath(id: string): string {
  return `/article/${encodeURIComponent(id)}`
}

export function modulePath(module: PortalModuleId, college = ''): string {
  return college ? `/${module}/${encodeURIComponent(college)}` : `/${module}`
}

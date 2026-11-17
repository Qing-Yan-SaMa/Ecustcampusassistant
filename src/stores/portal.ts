import { reactive } from 'vue'
import type { PortalArticle, PortalData } from '../types'

export const portalState = reactive<{
  data: PortalData | null
  loading: boolean
  error: string
}>({
  data: null,
  loading: false,
  error: '',
})

let inflight: Promise<PortalData> | null = null

export async function loadPortal(): Promise<PortalData> {
  if (portalState.data) return portalState.data
  if (inflight) return inflight

  portalState.loading = true
  portalState.error = ''
  inflight = fetch(`${import.meta.env.BASE_URL}portal.json`)
    .then((response) => {
      if (!response.ok) throw new Error(`portal.json ${response.status}`)
      return response.json() as Promise<PortalData>
    })
    .then((data) => {
      portalState.data = data
      return data
    })
    .catch((error: unknown) => {
      portalState.error = error instanceof Error ? error.message : '门户数据加载失败'
      throw error
    })
    .finally(() => {
      portalState.loading = false
      inflight = null
    })

  return inflight
}

export function findArticle(id: string): PortalArticle | null {
  return portalState.data?.articles.find((article) => article.id === id) || null
}

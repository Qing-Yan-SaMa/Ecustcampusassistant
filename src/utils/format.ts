export function uid(prefix = 'id'): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36)
  return `${prefix}_${random}`
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const date = new Date(timestamp)
  const today = new Date(now)
  const isSameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()

  if (diff < 60_000) return '刚刚'
  if (isSameDay) {
    return `今天 ${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()

  if (isYesterday) {
    return `昨天 ${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  if (date.getFullYear() === today.getFullYear()) {
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

export function formatClock(timestamp: number): string {
  const date = new Date(timestamp)
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

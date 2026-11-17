import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourcePath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(projectRoot, '..', 'ecust-rag-kb', 'data', 'corpus', 'chunks.jsonl')

if (!fs.existsSync(sourcePath)) {
  console.error(`找不到语料文件：${sourcePath}`)
  console.error('用法：npm run import-corpus -- [chunks.jsonl 路径]')
  process.exit(1)
}

function cleanText(value) {
  return String(value || '')
    .replace(/[\u200b-\u200d\ufeff]/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

const rawLines = fs
  .readFileSync(sourcePath, 'utf8')
  .split(/\r?\n/)
  .filter((line) => line.trim())

const chunks = []
const docs = new Map()
const accountCount = new Map()

for (const line of rawLines) {
  let item
  try {
    item = JSON.parse(line)
  } catch {
    continue
  }

  const text = cleanText(item.text)
  if (text.length < 30) continue

  const chunk = {
    id: item.chunk_id,
    docId: item.doc_id,
    mp: item.mp_name,
    title: cleanText(item.title),
    date: item.publish_time,
    ts: item.publish_ts,
    url: item.url,
    chunkIndex: Number(item.chunk_index) || 0,
    text,
  }
  chunks.push(chunk)

  if (!docs.has(chunk.docId)) {
    docs.set(chunk.docId, {
      docId: chunk.docId,
      title: chunk.title,
      mp: chunk.mp,
      date: chunk.date,
      ts: chunk.ts,
      url: chunk.url,
    })
  }
  accountCount.set(chunk.mp, (accountCount.get(chunk.mp) || 0) + 1)
}

chunks.sort((a, b) => b.ts - a.ts)

const dates = chunks.map((chunk) => chunk.date.slice(0, 10)).sort()
const accounts = [...accountCount.entries()]
  .map(([name, count]) => ({ name, count }))
  .sort((a, b) => b.count - a.count)
const latest = [...docs.values()].sort((a, b) => b.ts - a.ts).slice(0, 6)
const stats = {
  docs: docs.size,
  chunks: chunks.length,
  accounts: accounts.length,
  dateMin: dates[0],
  dateMax: dates[dates.length - 1],
}

const payload = {
  generatedAt: new Date().toISOString(),
  source: 'ecust-rag-kb/data/corpus/chunks.jsonl',
  stats,
  accounts,
  latest,
  chunks,
}

const meta = {
  generatedAt: payload.generatedAt,
  stats,
  accounts,
  latest,
}

const publicDir = path.join(projectRoot, 'public')
const dataDir = path.join(projectRoot, 'src', 'data')
fs.mkdirSync(publicDir, { recursive: true })
fs.mkdirSync(dataDir, { recursive: true })

const corpusPath = path.join(publicDir, 'corpus.json')
const metaPath = path.join(dataDir, 'corpus-meta.json')
fs.writeFileSync(corpusPath, JSON.stringify(payload), 'utf8')
fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n', 'utf8')

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`
console.log(`语料来源：${sourcePath}`)
console.log(
  `文章 ${stats.docs} 篇 / 切块 ${stats.chunks} 块 / 公众号 ${stats.accounts} 个 / ${stats.dateMin} ~ ${stats.dateMax}`,
)
console.log(`已写入 ${corpusPath}（${kb(fs.statSync(corpusPath).size)}）`)
console.log(`已写入 ${metaPath}（${kb(fs.statSync(metaPath).size)}）`)

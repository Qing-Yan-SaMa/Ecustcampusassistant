import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.argv[2] || process.cwd())
const kbRoot = path.resolve(process.argv[3] || path.join(root, '..', 'ecust-rag-kb'))

const documentsPath = path.join(kbRoot, 'data/corpus/documents.jsonl')
const cachePath = path.join(kbRoot, 'data/content-cache.json')

const documents = fs
  .readFileSync(documentsPath, 'utf8')
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line))

const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'))

const COLLEGE_MAP = {
  '社想': '社会与公共管理学院',
  'iConnect信院互联': '信息科学与工程学院',
  '华理材院': '材料科学与工程学院',
  '华理法学院': '法学院',
  '华理体育': '体育科学与工程学院',
  '机动小齿轮': '机械与动力工程学院',
  '华理外语': '外国语学院',
  '花梨心晴': '心理健康教育中心',
  '谈百草': '药学院',
  '华理艺设': '艺术设计与传媒学院',
  '华理物院': '物理学院',
  '华理数学学院': '数学学院',
  '化工青年集结地': '化工学院',
  '华理小蜜蜂': '校园服务',
  '华东理工大学图书馆': '图书馆',
  '平安华理': '保卫处',
}

const CATEGORY_RULES = [
  ['library', /图书馆|借阅|书香|BOOK思驿|读在潮头|数据库|文献|馆藏|阅读/],
  [
    'service',
    /校医院|献血|消防|安全|反诈|诈骗|后勤|食堂|宿舍|校园卡|快递|班车|维修|门诊|健康|防骗|交通|失物|保卫|医保|急救/,
  ],
  [
    'academic',
    /保研|考研|科研|大创|竞赛|奖学金|就业|招聘|学业|培养|课程|考试|教务|转专业|辅修|学分|论文|答辩|实习|生涯|职业|规划|招生|推免|留学|四六级|英语考试/,
  ],
  [
    'activity',
    /讲座|活动|晚会|比赛|沙龙|分享会|招募|志愿|社团|迎新|联谊|市集|展览|演出|运动|体育|心理|茶话会|工作坊|训练营|夏令营|冬令营|节|大赛/,
  ],
]

const CATEGORY_LABEL = {
  library: '图书馆',
  college: '学院动态',
  academic: '教务学业',
  activity: '校园活动',
  service: '校园服务',
}

const TAG_RULES = [
  ['讲座', '讲座'],
  ['保研', '保研'],
  ['考研', '考研'],
  ['就业', '就业'],
  ['招聘', '招聘'],
  ['志愿', '志愿'],
  ['竞赛', '竞赛'],
  ['体育', '体育'],
  ['心理', '心理'],
  ['消防', '消防'],
  ['阅读', '阅读'],
  ['迎新', '迎新'],
  ['晚会', '晚会'],
  ['科研', '科研'],
  ['大创', '大创'],
  ['实习', '实习'],
  ['奖学金', '奖学金'],
]

function cleanText(value) {
  return String(value || '')
    .replace(/[\u200b\ufeff]/g, '')
    .replace(/\r/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseDate(value) {
  const match = String(value || '').match(/(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[1]}-${match[2]}-${match[3]}` : ''
}

function pickTexture(html) {
  const images = [...String(html || '').matchAll(/<img[^>]+src="([^"]+)"[^>]*>/g)]
    .map((match) => {
      const widthMatch = match[0].match(/width:\s*(\d+)px/)
      return {
        url: match[1].replace(/^http:/, 'https:'),
        width: widthMatch ? Number(widthMatch[1]) : 0,
        photo: /mmbiz_jpg|wx_fmt=jpe?g/.test(match[1]),
        gif: /wx_fmt=gif/.test(match[1]),
      }
    })
    .filter((item) => item.url.includes('mmbiz.qpic.cn') && !item.photo && !item.gif)
  return images.filter((item) => item.width >= 400).sort((a, b) => b.width - a.width)[0]?.url || null
}

function pickCover(html) {
  const images = [...String(html || '').matchAll(/<img[^>]+src="([^"]+)"[^>]*>/g)]
    .map((match) => {
      const tag = match[0]
      const widthMatch = tag.match(/width:\s*(\d+)px/)
      const formatMatch = match[1].match(/wx_fmt=([a-z]+)/)
      return {
        url: match[1].replace(/^http:/, 'https:'),
        width: widthMatch ? Number(widthMatch[1]) : 0,
        format: formatMatch ? formatMatch[1] : '',
        photo: /mmbiz_jpg|wx_fmt=jpe?g/.test(match[1]),
      }
    })
    .filter((item) => item.url.includes('mmbiz.qpic.cn'))

  if (!images.length) return { cover: null, photo: false }

  const photos = images.filter((item) => item.photo && item.width >= 360)
  if (photos.length) {
    return { cover: photos.sort((a, b) => b.width - a.width)[0].url, photo: true }
  }

  const still = images.filter((item) => item.format !== 'gif')
  const pool = still.filter((item) => item.width >= 400)
  const fallback = still.filter((item) => item.width >= 240)
  const list = pool.length ? pool : fallback.length ? fallback : still.length ? still : images
  return { cover: list.sort((a, b) => b.width - a.width)[0].url, photo: false }
}

function pickCategory(title, account) {
  for (const [category, pattern] of CATEGORY_RULES) {
    if (pattern.test(title)) return category
  }
  if (account === '华东理工大学图书馆') return 'library'
  if (account === '华理小蜜蜂' || account === '平安华理') return 'service'
  return 'college'
}

function pickTags(title, category) {
  const tags = []
  for (const [keyword, label] of TAG_RULES) {
    if (title.includes(keyword) && !tags.includes(label)) tags.push(label)
    if (tags.length >= 3) break
  }
  if (!tags.length) tags.push(CATEGORY_LABEL[category])
  return tags
}

function makeSummary(text, title) {
  let body = cleanText(text)
  if (body.startsWith(title)) body = body.slice(title.length).trim()
  body = body.replace(/^(文案|排版|编辑|审核|来源|供稿|摄影)[：:]\s*\S{0,16}\s*/u, '').trim()
  if (!body) return ''
  return `${body.slice(0, 96)}${body.length > 96 ? '…' : ''}`
}

const maxTs = Math.max(...documents.map((doc) => Number(doc.publish_ts) || 0), 0)

const articles = documents
  .map((doc) => {
    const category = pickCategory(doc.title, doc.mp_name)
    const college = COLLEGE_MAP[doc.mp_name] || ''
    const text = cleanText(doc.text)
    const picked = pickCover(cache[doc.doc_id]?.text)
    const texture = pickTexture(cache[doc.doc_id]?.text)
    const cover = picked.cover
    const ts = Number(doc.publish_ts) || 0
    const ageDays = Math.max(0, (maxTs - ts) / 86400)
    const recency = Math.max(0, 1 - ageDays / 40)
    const categoryBoost =
      category === 'library' ? 8 : category === 'academic' ? 7 : category === 'activity' ? 6 : category === 'service' ? 5 : 2
    const titleBoost = /讲座|保研|消防|树说|志愿|迎新|招聘|阅读|竞赛|晚会/.test(doc.title) ? 6 : 0
    const hotScore = Math.round((recency * 40 + categoryBoost + titleBoost + (cover ? 10 : 0)) * 10) / 10

    return {
      id: doc.doc_id,
      title: doc.title,
      mp: doc.mp_name,
      date: parseDate(doc.publish_time),
      ts,
      url: doc.url,
      cover,
      coverPhoto: picked.photo,
      texture,
      category,
      college,
      tags: pickTags(doc.title, category),
      summary: makeSummary(text, doc.title),
      hotScore,
      text,
    }
  })
  .sort((a, b) => b.ts - a.ts)

const byCategory = {}
for (const article of articles) byCategory[article.category] = (byCategory[article.category] || 0) + 1

const withCover = articles.filter((article) => article.cover)
const used = new Set()
const usedAccounts = new Set()
const featured = []
const coverPool = withCover.filter((article) => article.coverPhoto)

for (const category of ['library', 'academic', 'activity', 'service', 'college']) {
  const candidate = coverPool.find(
    (article) => article.category === category && !used.has(article.id) && !usedAccounts.has(article.mp),
  )
  if (candidate) {
    featured.push(candidate)
    used.add(candidate.id)
    usedAccounts.add(candidate.mp)
  }
}

for (const article of coverPool.sort((a, b) => b.hotScore - a.hotScore)) {
  if (featured.length >= 6) break
  if (used.has(article.id) || usedAccounts.has(article.mp)) continue
  featured.push(article)
  used.add(article.id)
  usedAccounts.add(article.mp)
}

for (const article of withCover.sort((a, b) => b.hotScore - a.hotScore)) {
  if (featured.length >= 6) break
  if (used.has(article.id)) continue
  featured.push(article)
  used.add(article.id)
}

const collegeCounts = {}
for (const article of articles) {
  if (article.category !== 'college' || !article.college) continue
  collegeCounts[article.college] = (collegeCounts[article.college] || 0) + 1
}

const colleges = Object.entries(collegeCounts)
  .map(([name, count]) => ({ name, count }))
  .sort((a, b) => b.count - a.count)

const payload = {
  generatedAt: new Date().toISOString(),
  source: 'ecust-rag-kb/data/corpus/documents.jsonl',
  stats: {
    articles: articles.length,
    withCover: withCover.length,
    withPhoto: withCover.filter((article) => article.coverPhoto).length,
    accounts: new Set(articles.map((article) => article.mp)).size,
    dateMin: articles.length ? articles[articles.length - 1].date : '',
    dateMax: articles.length ? articles[0].date : '',
    byCategory,
  },
  modules: Object.entries(CATEGORY_LABEL).map(([id, label]) => ({
    id,
    label,
    count: articles.filter((article) => article.category === id).length,
  })),
  colleges,
  featured: featured.map((article) => article.id),
  latest: articles.slice(0, 8).map((article) => article.id),
  articles: articles.map(({ text, ...meta }) => meta),
}

const textPayload = {
  generatedAt: payload.generatedAt,
  articles: Object.fromEntries(articles.map((article) => [article.id, article.text])),
}

fs.mkdirSync(path.join(root, 'public'), { recursive: true })
fs.writeFileSync(path.join(root, 'public/portal.json'), JSON.stringify(payload, null, 2))
fs.writeFileSync(path.join(root, 'public/articles.json'), JSON.stringify(textPayload))

console.log(
  [
    `文章 ${payload.stats.articles} 篇 / 有图 ${payload.stats.withCover} 篇 / 公众号 ${payload.stats.accounts} 个`,
    `时间 ${payload.stats.dateMin} ~ ${payload.stats.dateMax}`,
    `分类 ${JSON.stringify(byCategory)}`,
    `学院 ${colleges.length} 个`,
    `featured ${payload.featured.length} 篇`,
    `portal.json ${(fs.statSync(path.join(root, 'public/portal.json')).size / 1024).toFixed(1)} KB`,
    `articles.json ${(fs.statSync(path.join(root, 'public/articles.json')).size / 1024).toFixed(1)} KB`,
  ].join('\n'),
)

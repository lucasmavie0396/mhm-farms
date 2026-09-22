import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { allowRoles, protect } from '../lib/auth'
import { validate, slugify, paramId } from '../lib/utils'
import { newsSchema } from '../lib/schemas'

const router = Router()

router.get('/', async (req, res) => {
  const where: Record<string, unknown> = { active: true }
  if (req.query.limit) {
    const items = await prisma.news.findMany({
      where,
      orderBy: { date: 'desc' },
      take: Number(req.query.limit),
    })
    res.json(items)
    return
  }
  res.json(await prisma.news.findMany({ where, orderBy: { date: 'desc' } }))
})

router.get('/admin/all', protect, allowRoles('ADMIN', 'MANAGER'), async (_req, res) => {
  res.json(await prisma.news.findMany({ orderBy: { date: 'desc' } }))
})

router.post('/', protect, allowRoles('ADMIN', 'MANAGER'), validate(newsSchema), async (req, res) => {
  const { date, ...data } = req.body
  const news = await prisma.news.create({
    data: {
      ...data,
      date: date ? new Date(date) : new Date(),
      slug: `${slugify(data.title)}-${Date.now().toString(36)}`,
    },
  })
  res.status(201).json(news)
})

router.put('/:id', protect, allowRoles('ADMIN', 'MANAGER'), validate(newsSchema), async (req, res) => {
  const { date, slug, ...data } = req.body as typeof req.body & { slug?: string }
  const news = await prisma.news.update({
    where: { id: paramId(req) },
    data: { ...data, date: date ? new Date(date) : undefined, slug: slug || `news-${paramId(req)}` },
  })
  res.json(news)
})

router.patch('/:id/toggle', protect, allowRoles('ADMIN', 'MANAGER'), async (req, res) => {
  const existing = await prisma.news.findUnique({ where: { id: paramId(req) } })
  if (!existing) {
    res.status(404).json({ error: 'Notícia não encontrada.' })
    return
  }
  const news = await prisma.news.update({
    where: { id: paramId(req) },
    data: { active: !existing.active },
  })
  res.json(news)
})

router.delete('/:id', protect, allowRoles('ADMIN', 'MANAGER'), async (req, res) => {
  await prisma.news.delete({ where: { id: paramId(req) } })
  res.json({ ok: true })
})

router.get('/:slug', async (req, res) => {
  const news = await prisma.news.findUnique({ where: { slug: req.params.slug } })
  if (!news || !news.active) {
    res.status(404).json({ error: 'Notícia não encontrada.' })
    return
  }
  res.json(news)
})

export default router
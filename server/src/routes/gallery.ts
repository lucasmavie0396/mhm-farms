import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { allowRoles, protect } from '../lib/auth'
import { validate, paramId } from '../lib/utils'
import { gallerySchema } from '../lib/schemas'

const router = Router()

router.get('/', async (req, res) => {
  const { category } = req.query
  const where: Record<string, unknown> = { active: true }
  if (category && category !== 'todos') where.category = category
  const items = await prisma.galleryItem.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })
  res.json(items)
})

router.get('/categories', async (_req, res) => {
  const items = await prisma.galleryItem.findMany({ select: { category: true } })
  const counts = new Map<string, number>()
  for (const i of items) counts.set(i.category, (counts.get(i.category) || 0) + 1)
  res.json([...counts.entries()].map(([key, count]) => ({ key, label: key, count })))
})

router.get('/admin/all', protect, allowRoles('ADMIN', 'MANAGER'), async (_req, res) => {
  res.json(await prisma.galleryItem.findMany({ orderBy: { createdAt: 'desc' } }))
})

router.post('/', protect, allowRoles('ADMIN', 'MANAGER'), validate(gallerySchema), async (req, res) => {
  const item = await prisma.galleryItem.create({ data: req.body })
  res.status(201).json(item)
})

router.put('/:id', protect, allowRoles('ADMIN', 'MANAGER'), validate(gallerySchema), async (req, res) => {
  const item = await prisma.galleryItem.update({ where: { id: paramId(req) }, data: req.body })
  res.json(item)
})

router.patch('/:id/toggle', protect, allowRoles('ADMIN', 'MANAGER'), async (req, res) => {
  const existing = await prisma.galleryItem.findUnique({ where: { id: paramId(req) } })
  if (!existing) {
    res.status(404).json({ error: 'Item não encontrado.' })
    return
  }
  const item = await prisma.galleryItem.update({
    where: { id: paramId(req) },
    data: { active: !existing.active },
  })
  res.json(item)
})

router.delete('/:id', protect, allowRoles('ADMIN', 'MANAGER'), async (req, res) => {
  await prisma.galleryItem.delete({ where: { id: paramId(req) } })
  res.json({ ok: true })
})

export default router
import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { allowRoles, protect } from '../lib/auth'
import { validate, slugify, paramId } from '../lib/utils'
import { eventSchema } from '../lib/schemas'

const router = Router()

function parseDate(value: string): Date {
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? new Date() : d
}

router.get('/', async (req, res) => {
  const where: Record<string, unknown> = { active: true }
  if (req.query.upcoming === 'true') where.date = { gte: new Date() }
  const events = await prisma.event.findMany({
    where,
    orderBy: { date: 'asc' },
  })
  res.json(events)
})

router.get('/admin/all', protect, allowRoles('ADMIN', 'MANAGER'), async (_req, res) => {
  const events = await prisma.event.findMany({ orderBy: { date: 'asc' } })
  res.json(events)
})

router.post('/', protect, allowRoles('ADMIN', 'MANAGER'), validate(eventSchema), async (req, res) => {
  const { date, ...data } = req.body
  const event = await prisma.event.create({
    data: { ...data, image: data.image ?? '', date: parseDate(date), slug: `${slugify(data.title)}-${Date.now().toString(36)}` },
  })
  res.status(201).json(event)
})

router.put('/:id', protect, allowRoles('ADMIN', 'MANAGER'), validate(eventSchema), async (req, res) => {
  const { date, slug, ...data } = req.body as typeof req.body & { slug?: string }
  const event = await prisma.event.update({
    where: { id: paramId(req) },
    data: { ...data, image: data.image ?? '', date: parseDate(date), slug: slug || `event-${paramId(req)}` },
  })
  res.json(event)
})

router.patch('/:id/toggle', protect, allowRoles('ADMIN', 'MANAGER'), async (req, res) => {
  const existing = await prisma.event.findUnique({ where: { id: paramId(req) } })
  if (!existing) {
    res.status(404).json({ error: 'Evento não encontrado.' })
    return
  }
  const updated = await prisma.event.update({
    where: { id: paramId(req) },
    data: { active: !existing.active },
  })
  res.json(updated)
})

router.delete('/:id', protect, allowRoles('ADMIN', 'MANAGER'), async (req, res) => {
  await prisma.event.delete({ where: { id: paramId(req) } })
  res.json({ ok: true })
})

export default router
import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { allowRoles, protect } from '../lib/auth'
import { validate, paramId } from '../lib/utils'
import { feedbackSchema } from '../lib/schemas'

const router = Router()

router.get('/', async (req, res) => {
  const items = await prisma.feedback.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
    take: Number(req.query.limit || 6),
  })
  res.json(items)
})

router.get('/admin/all', protect, allowRoles('ADMIN', 'MANAGER', 'STAFF'), async (_req, res) => {
  res.json(await prisma.feedback.findMany({ orderBy: { createdAt: 'desc' } }))
})

router.post('/', validate(feedbackSchema), async (req, res) => {
  res.status(201).json(await prisma.feedback.create({ data: req.body }))
})

router.patch('/:id/toggle', protect, allowRoles('ADMIN', 'MANAGER'), async (req, res) => {
  const existing = await prisma.feedback.findUnique({ where: { id: paramId(req) } })
  if (!existing) {
    res.status(404).json({ error: 'Avaliação não encontrada.' })
    return
  }
  res.json(await prisma.feedback.update({ where: { id: paramId(req) }, data: { active: !existing.active } }))
})

router.delete('/:id', protect, allowRoles('ADMIN', 'MANAGER'), async (req, res) => {
  await prisma.feedback.delete({ where: { id: paramId(req) } })
  res.json({ ok: true })
})

export default router
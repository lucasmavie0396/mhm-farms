import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { allowRoles, protect } from '../lib/auth'
import { validate, paramId } from '../lib/utils'
import { faqSchema } from '../lib/schemas'

const router = Router()

router.get('/', async (req, res) => {
  res.json(
    await prisma.faq.findMany({ where: { active: true }, orderBy: [{ category: 'asc' }, { order: 'asc' }] })
  )
})

router.get('/admin/all', protect, allowRoles('ADMIN', 'MANAGER'), async (_req, res) => {
  res.json(await prisma.faq.findMany({ orderBy: { order: 'asc' } }))
})

router.post('/', protect, allowRoles('ADMIN', 'MANAGER'), validate(faqSchema), async (req, res) => {
  res.status(201).json(await prisma.faq.create({ data: req.body }))
})

router.put('/:id', protect, allowRoles('ADMIN', 'MANAGER'), validate(faqSchema), async (req, res) => {
  res.json(await prisma.faq.update({ where: { id: paramId(req) }, data: req.body }))
})

router.patch('/:id/toggle', protect, allowRoles('ADMIN', 'MANAGER'), async (req, res) => {
  const existing = await prisma.faq.findUnique({ where: { id: paramId(req) } })
  if (!existing) {
    res.status(404).json({ error: 'Pergunta não encontrada.' })
    return
  }
  res.json(await prisma.faq.update({ where: { id: paramId(req) }, data: { active: !existing.active } }))
})

router.delete('/:id', protect, allowRoles('ADMIN', 'MANAGER'), async (req, res) => {
  await prisma.faq.delete({ where: { id: paramId(req) } })
  res.json({ ok: true })
})

export default router
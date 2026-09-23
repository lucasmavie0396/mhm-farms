import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { allowRoles, protect } from '../lib/auth'
import { validate, paramId } from '../lib/utils'
import { contactSchema } from '../lib/schemas'

const router = Router()

router.post('/', validate(contactSchema), async (req, res) => {
  const message = await prisma.contactMessage.create({ data: req.body })
  res.status(201).json(message)
})

router.get('/admin/all', protect, allowRoles('ADMIN', 'MANAGER'), async (_req, res) => {
  res.json(await prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } }))
})

router.patch('/:id/status', protect, allowRoles('ADMIN', 'MANAGER'), async (req, res) => {
  const status = String(req.body.status || 'READ')
  if (!['NEW', 'READ', 'ARCHIVED'].includes(status)) {
    res.status(400).json({ error: 'Estado inválido.' })
    return
  }
  const message = await prisma.contactMessage.update({
    where: { id: paramId(req) },
    data: { status: status as never },
  })
  res.json(message)
})

router.delete('/:id', protect, allowRoles('ADMIN', 'MANAGER'), async (req, res) => {
  await prisma.contactMessage.delete({ where: { id: paramId(req) } })
  res.json({ ok: true })
})

export default router
import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { allowRoles, protect } from '../lib/auth'
import { validate, paramId } from '../lib/utils'
import { schoolVisitSchema } from '../lib/schemas'

const router = Router()

router.post('/', validate(schoolVisitSchema), async (req, res) => {
  const { preferredDate, ...data } = req.body
  const visit = await prisma.schoolVisit.create({
    data: { ...data, preferredDate: preferredDate ? new Date(preferredDate) : null },
  })
  res.status(201).json(visit)
})

router.get('/admin/all', protect, allowRoles('ADMIN', 'MANAGER'), async (_req, res) => {
  res.json(await prisma.schoolVisit.findMany({ orderBy: { createdAt: 'desc' } }))
})

router.patch('/:id/status', protect, allowRoles('ADMIN', 'MANAGER'), async (req, res) => {
  const status = String(req.body.status || 'PENDING')
  if (!['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status)) {
    res.status(400).json({ error: 'Estado inválido.' })
    return
  }
  const visit = await prisma.schoolVisit.update({
    where: { id: paramId(req) },
    data: { status: status as never },
  })
  res.json(visit)
})

router.delete('/:id', protect, allowRoles('ADMIN', 'MANAGER'), async (req, res) => {
  await prisma.schoolVisit.delete({ where: { id: paramId(req) } })
  res.json({ ok: true })
})

export default router
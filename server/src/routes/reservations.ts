import { Router } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { allowRoles, protect } from '../lib/auth'
import { validate, generateReservationCode, paramId } from '../lib/utils'
import { reservationSchema, reservationStatusSchema } from '../lib/schemas'
import { generateAndSaveReservationPdf, generateReservationPdf } from '../lib/pdf'
import { buildBreakdown } from '../lib/pricing'

const router = Router()

async function reservationBreakdown(adults: number, children: number, visitType: string, experienceId?: string | null) {
  const experience = experienceId
    ? await prisma.experience.findUnique({
        where: { id: experienceId },
        select: { title: true, price: true },
      })
    : null
  return buildBreakdown({ adults, children, visitType, experience })
}

router.post('/', validate(reservationSchema), async (req, res) => {
  const { date, time, adults, children, visitType, experienceId, name, phone, email, notes } = req.body
  const totalVisitors = adults + children
  const { items, total } = await reservationBreakdown(adults, children, visitType, experienceId)
  const code = await generateReservationCode()
  const reservation = await prisma.reservation.create({
    data: {
      code,
      date: new Date(date),
      time,
      adults,
      children,
      totalVisitors,
      visitType,
      experienceId: experienceId || null,
      name,
      phone,
      email: email.toLowerCase(),
      notes: notes || null,
      totalPrice: total,
      breakdown: items as unknown as Prisma.InputJsonValue,
    },
    include: { experience: true },
  })
  res.status(201).json(reservation)
})

router.get('/lookup', async (req, res) => {
  const code = String(req.query.code || '').toUpperCase()
  if (!code) {
    res.status(400).json({ error: 'Código de reserva em falta.' })
    return
  }
  const reservation = await prisma.reservation.findUnique({
    where: { code },
    include: { experience: true },
  })
  if (!reservation) {
    res.status(404).json({ error: 'Reserva não encontrada.' })
    return
  }
  res.json(reservation)
})

router.get('/admin/all', protect, allowRoles('ADMIN', 'MANAGER'), async (req, res) => {
  const { status, from, to, q } = req.query
  const where: Record<string, unknown> = {}
  if (status && status !== 'todos') where.status = status
  if (from || to) {
    const dateFilter: Record<string, Date> = {}
    if (from) dateFilter.gte = new Date(String(from))
    if (to) dateFilter.lte = new Date(String(to))
    where.date = dateFilter
  }
  if (q) {
    where.OR = [
      { code: { contains: String(q) } },
      { name: { contains: String(q) } },
      { email: { contains: String(q) } },
    ]
  }
  const reservations = await prisma.reservation.findMany({
    where,
    include: { experience: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json(reservations)
})

router.patch('/:id/status', protect, allowRoles('ADMIN', 'MANAGER'), validate(reservationStatusSchema), async (req, res) => {
  const reservation = await prisma.reservation.update({
    where: { id: paramId(req) },
    data: { status: req.body.status },
    include: { experience: true },
  })
  if (req.body.status === 'CONFIRMED') {
    try {
      await generateAndSaveReservationPdf(reservation)
    } catch (err) {
      console.error('Erro ao gerar PDF da reserva:', err)
    }
  }
  res.json(reservation)
})

router.get('/:id/pdf', protect, allowRoles('ADMIN', 'MANAGER'), async (req, res) => {
  const reservation = await prisma.reservation.findUnique({
    where: { id: paramId(req) },
    include: { experience: true },
  })
  if (!reservation) {
    res.status(404).json({ error: 'Reserva não encontrada.' })
    return
  }
  try {
    const buf = await generateReservationPdf(reservation)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="reserva-${reservation.code}.pdf"`
    )
    res.send(buf)
  } catch (err) {
    console.error('Erro ao gerar PDF:', err)
    res.status(500).json({ error: 'Erro ao gerar o PDF da reserva.' })
  }
})

router.put('/:id', protect, allowRoles('ADMIN', 'MANAGER'), validate(reservationSchema), async (req, res) => {
  const { date, time, adults, children, visitType, experienceId, name, phone, email, notes } = req.body
  const totalVisitors = adults + children
  const { items, total } = await reservationBreakdown(adults, children, visitType, experienceId)
  const reservation = await prisma.reservation.update({
    where: { id: paramId(req) },
    data: {
      date: new Date(date),
      time,
      adults,
      children,
      totalVisitors,
      visitType,
      experienceId: experienceId || null,
      name,
      phone,
      email: email.toLowerCase(),
      notes: notes || null,
      totalPrice: total,
      breakdown: items as unknown as Prisma.InputJsonValue,
    },
    include: { experience: true },
  })
  res.json(reservation)
})

router.delete('/:id', protect, allowRoles('ADMIN', 'MANAGER'), async (req, res) => {
  await prisma.reservation.delete({ where: { id: paramId(req) } })
  res.json({ ok: true })
})

export default router
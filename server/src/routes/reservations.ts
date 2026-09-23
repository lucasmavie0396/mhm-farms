import { Router } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { allowRoles, protect } from '../lib/auth'
import { validate, generateReservationCode, paramId } from '../lib/utils'
import { reservationSchema, reservationStatusSchema, reservationPaymentSchema } from '../lib/schemas'
import { generateAndSaveReservationPdf, generateReservationPdf } from '../lib/pdf'
import { buildBreakdown } from '../lib/pricing'

const router = Router()

const RESERVATION_INCLUDE = {
  experience: true,
  payments: { orderBy: { paidAt: 'asc' } },
} as const

const round2 = (v: number) => Math.round(v * 100) / 100

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
  const { date, time, adults, children, visitType, experienceId, name, phone, email, notes, paymentMethod } = req.body
  const totalVisitors = adults + children
  const { items, total } = await reservationBreakdown(adults, children, visitType, experienceId)
  const code = await generateReservationCode()
  const deposit = round2(total * 0.6)
  const reservation = await prisma.$transaction(async (tx) => {
    const created = await tx.reservation.create({
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
    })
    await tx.reservationPayment.create({
      data: {
        reservationId: created.id,
        amount: deposit,
        method: paymentMethod,
        stage: 'SINAL',
        paidAt: new Date(),
      },
    })
    return created.id
  })
  const full = await prisma.reservation.findUnique({
    where: { id: reservation },
    include: RESERVATION_INCLUDE,
  })
  try {
    if (full) await generateAndSaveReservationPdf(full)
  } catch (err) {
    console.error('Erro ao gerar PDF da reserva:', err)
  }
  res.status(201).json(full)
})

router.get('/lookup', async (req, res) => {
  const code = String(req.query.code || '').toUpperCase()
  if (!code) {
    res.status(400).json({ error: 'Código de reserva em falta.' })
    return
  }
  const reservation = await prisma.reservation.findUnique({
    where: { code },
    include: RESERVATION_INCLUDE,
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
    include: RESERVATION_INCLUDE,
    orderBy: { createdAt: 'desc' },
  })
  res.json(reservations)
})

router.patch('/:id/status', protect, allowRoles('ADMIN', 'MANAGER'), validate(reservationStatusSchema), async (req, res) => {
  const reservation = await prisma.reservation.update({
    where: { id: paramId(req) },
    data: { status: req.body.status },
    include: RESERVATION_INCLUDE,
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

router.post('/:id/payments', protect, allowRoles('ADMIN', 'MANAGER', 'STAFF'), validate(reservationPaymentSchema), async (req, res) => {
  const id = paramId(req)
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: RESERVATION_INCLUDE,
  })
  if (!reservation) {
    res.status(404).json({ error: 'Reserva não encontrada.' })
    return
  }
  const paid = round2(reservation.payments.reduce((s, p) => s + p.amount, 0))
  const remaining = round2(reservation.totalPrice - paid)
  if (remaining <= 0.001) {
    res.status(400).json({ error: 'O valor da reserva já está totalmente pago.' })
    return
  }
  const amount = req.body.amount != null ? round2(Number(req.body.amount)) : remaining
  if (amount > remaining + 0.001) {
    res.status(400).json({ error: `Valor superior ao restante (${remaining.toFixed(2)} MT).` })
    return
  }
  const paidAt = req.body.date ? new Date(String(req.body.date)) : new Date()
  const payment = await prisma.$transaction(async (tx) => {
    const created = await tx.reservationPayment.create({
      data: {
        reservationId: id,
        amount,
        method: req.body.method,
        stage: req.body.stage || 'FINAL',
        paidAt,
      },
    })
    const newPaid = round2(paid + amount)
    let status = reservation.status
    if (newPaid >= round2(reservation.totalPrice) - 0.001) {
      status = 'COMPLETED'
    } else if (reservation.status === 'PENDING') {
      status = 'CONFIRMED'
    }
    await tx.reservation.update({ where: { id }, data: { status } })
    return created
  })
  const updated = await prisma.reservation.findUnique({
    where: { id },
    include: RESERVATION_INCLUDE,
  })
  try {
    if (updated) await generateAndSaveReservationPdf(updated)
  } catch (err) {
    console.error('Erro ao gerar PDF da reserva:', err)
  }
  res.status(201).json({ payment, reservation: updated })
})

router.get('/:id/pdf', protect, allowRoles('ADMIN', 'MANAGER'), async (req, res) => {
  const reservation = await prisma.reservation.findUnique({
    where: { id: paramId(req) },
    include: RESERVATION_INCLUDE,
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
    include: RESERVATION_INCLUDE,
  })
  res.json(reservation)
})

router.delete('/:id', protect, allowRoles('ADMIN', 'MANAGER'), async (req, res) => {
  await prisma.reservation.delete({ where: { id: paramId(req) } })
  res.json({ ok: true })
})

export default router
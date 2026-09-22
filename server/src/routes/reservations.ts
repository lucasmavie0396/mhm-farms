import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { allowRoles, protect } from '../lib/auth'
import { validate, generateReservationCode, paramId } from '../lib/utils'
import { reservationSchema, reservationStatusSchema } from '../lib/schemas'

const router = Router()

async function computePrice(adults: number, children: number, visitType: string): Promise<number> {
  const pricesSetting = await prisma.setting.findUnique({ where: { key: 'prices' } })
  if (!pricesSetting) return 0
  let prices: { category: string; price: number }[] = []
  try {
    prices = JSON.parse(pricesSetting.value)
  } catch {
    prices = []
  }
  const adultPrice = prices.find((p) => p.category.toLowerCase().includes('adult'))?.price ?? 0
  const childPrice = prices.find((p) => p.category.toLowerCase().includes('crian'))?.price ?? 0
  let total = adultPrice * adults + childPrice * children
  if (visitType.toLowerCase().includes('familiar') || visitType.toLowerCase().includes('família')) {
    const fam = prices.find((p) => p.category.toLowerCase().includes('famili'))?.price
    if (fam) total = fam
  }
  return total
}

router.post('/', validate(reservationSchema), async (req, res) => {
  const { date, time, adults, children, visitType, experienceId, name, phone, email, notes } = req.body
  const totalVisitors = adults + children
  const totalPrice = await computePrice(adults, children, visitType)
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
      totalPrice,
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
  res.json(reservation)
})

router.put('/:id', protect, allowRoles('ADMIN', 'MANAGER'), validate(reservationSchema), async (req, res) => {
  const { date, time, adults, children, visitType, experienceId, name, phone, email, notes } = req.body
  const totalVisitors = adults + children
  const totalPrice = await computePrice(adults, children, visitType)
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
      totalPrice,
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
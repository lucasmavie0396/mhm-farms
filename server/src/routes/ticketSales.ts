import { Router } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { allowRoles, protect } from '../lib/auth'
import { generateTicketSaleCode, paramId, validate } from '../lib/utils'
import { ticketSaleSchema } from '../lib/schemas'
import { buildTicketOrder } from '../lib/pricing'

const router = Router()

router.post('/', protect, allowRoles('ADMIN', 'MANAGER', 'STAFF'), validate(ticketSaleSchema), async (req, res) => {
  const { items, paymentMethod, customerName, experienceId } = req.body
  const sellerId = req.user?.id
  if (!sellerId) {
    res.status(401).json({ error: 'Não autenticado.' })
    return
  }
  const experience = experienceId
    ? await prisma.experience.findUnique({ where: { id: experienceId }, select: { title: true, price: true } })
    : null
  let saleItems: Awaited<ReturnType<typeof buildTicketOrder>>['items']
  let total: number
  let totalVisitors: number
  try {
    const order = await buildTicketOrder({ items, experience })
    saleItems = order.items
    total = order.total
    totalVisitors = order.totalVisitors
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Dados inválidos.' })
    return
  }
  const code = await generateTicketSaleCode()
  const sale = await prisma.ticketSale.create({
    data: {
      code,
      items: saleItems as unknown as Prisma.InputJsonValue,
      totalPrice: total,
      totalVisitors,
      paymentMethod,
      customerName: customerName || null,
      status: 'PAID',
      sellerId,
    },
    include: { seller: { select: { id: true, name: true } } },
  })
  res.status(201).json(sale)
})

router.get('/', protect, allowRoles('ADMIN', 'MANAGER', 'STAFF'), async (req, res) => {
  const { from, to, method } = req.query
  const where: Record<string, unknown> = {}
  if (from || to) {
    const dateFilter: Record<string, Date> = {}
    if (from) dateFilter.gte = new Date(String(from))
    if (to) dateFilter.lte = new Date(`${String(to)}T23:59:59.999`)
    where.date = dateFilter
  }
  if (method && method !== 'todos') where.paymentMethod = method
  const sales = await prisma.ticketSale.findMany({
    where,
    include: { seller: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  })
  res.json(sales)
})

router.get('/:id', protect, allowRoles('ADMIN', 'MANAGER', 'STAFF'), async (req, res) => {
  const sale = await prisma.ticketSale.findUnique({
    where: { id: paramId(req) },
    include: { seller: { select: { id: true, name: true } } },
  })
  if (!sale) {
    res.status(404).json({ error: 'Venda não encontrada.' })
    return
  }
  res.json(sale)
})

export default router
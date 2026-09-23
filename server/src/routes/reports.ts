import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { allowRoles, protect } from '../lib/auth'
import type { PriceBreakdown } from '../lib/pricing'
import { generateReportPdf } from '../lib/reportPdf'

const router = Router()

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

const MONEY_STATUSES = ['CONFIRMED', 'COMPLETED']

export type RevenueReportData = {
  range: { from: string; to: string; status: string }
  summary: {
    reservations: number
    visitors: number
    revenue: number
    pendingValue: number
    confirmed: number
    completed: number
    cancelled: number
    pending: number
    ticketCount: number
    ticketsSold: number
    ticketRevenue: number
    ticketVisitors: number
  }
  byDay: {
    name: string
    count: number
    revenue: number
    visitors: number
    tickets?: number
    sold?: number
    ticketRevenue?: number
    ticketVisitors?: number
    totalVisitors?: number
  }[]
  byStatus: { name: string; count: number; revenue: number }[]
  byService: { name: string; qty: number; revenue: number }[]
  ticketByMethod: { name: string; count: number; qty: number; revenue: number }[]
  reservations: {
    id: string
    code: string
    date: Date
    time: string
    name: string
    email: string
    phone: string
    visitors: number
    visitType: string
    experience: string | null
    status: string
    totalPrice: number
  }[]
}

async function collectRevenueReport(from: string, to: string, status: string): Promise<RevenueReportData> {
  const where: Record<string, unknown> = {}
  const saleWhere: Record<string, unknown> = { status: 'PAID' }
  if (from) {
    where.date = { ...(where.date as object), gte: new Date(`${from}T00:00:00.000`) }
    saleWhere.date = { ...(saleWhere.date as object), gte: new Date(`${from}T00:00:00.000`) }
  }
  if (to) {
    where.date = { ...(where.date as object), lte: new Date(`${to}T23:59:59.999`) }
    saleWhere.date = { ...(saleWhere.date as object), lte: new Date(`${to}T23:59:59.999`) }
  }
  if (status !== 'todos') where.status = status

  const [reservations, ticketSales] = await Promise.all([
    prisma.reservation.findMany({
      where,
      include: { experience: true },
      orderBy: { date: 'asc' },
    }),
    prisma.ticketSale.findMany({
      where: saleWhere,
      include: { reservation: { select: { code: true } } },
      orderBy: { date: 'asc' },
    }),
  ])

  const byStatus = new Map<string, { count: number; revenue: number; visitors: number }>()
  const byDay = new Map<string, { count: number; revenue: number; visitors: number; tickets?: number; sold?: number; ticketRevenue?: number; ticketVisitors?: number; totalVisitors?: number }>()
  const byService = new Map<string, { qty: number; revenue: number }>()

  for (const r of reservations) {
    const st = (byStatus.get(r.status) ?? { count: 0, revenue: 0, visitors: 0 })
    st.count += 1
    st.visitors += r.totalVisitors
    if (MONEY_STATUSES.includes(r.status)) st.revenue += r.totalPrice
    byStatus.set(r.status, st)

    const key = dayKey(r.date)
    const d = byDay.get(key) ?? { count: 0, revenue: 0, visitors: 0 }
    d.count += 1
    d.visitors += r.totalVisitors
    if (MONEY_STATUSES.includes(r.status)) d.revenue += r.totalPrice
    byDay.set(key, d)

    const breakdown = Array.isArray((r as unknown as { breakdown?: unknown }).breakdown)
      ? ((r as unknown as { breakdown?: PriceBreakdown }).breakdown ?? [])
      : []
    if (breakdown.length) {
      for (const item of breakdown) {
        const s = byService.get(item.service) ?? { qty: 0, revenue: 0 }
        s.qty += item.qty
        if (MONEY_STATUSES.includes(r.status)) s.revenue += item.total
        byService.set(item.service, s)
      }
    } else {
      const s = byService.get(`Entrada geral (${r.visitType})`) ?? { qty: 0, revenue: 0 }
      s.qty += r.totalVisitors
      if (MONEY_STATUSES.includes(r.status)) s.revenue += r.totalPrice
      byService.set(`Entrada geral (${r.visitType})`, s)
    }
  }

  // ---- Vendas de entradas ----
  let ticketRevenue = 0
  let ticketVisitors = 0
  let ticketCount = 0
  let ticketsSold = 0
  const byMethod = new Map<string, { count: number; revenue: number; qty: number }>()
  for (const s of ticketSales) {
    const isReservationSale = !!s.reservationId
    const saleItems = Array.isArray((s as unknown as { items?: unknown }).items)
      ? ((s as unknown as { items: { service: string; qty: number; total: number }[] }).items ?? [])
      : []

    const m = byMethod.get(s.paymentMethod) ?? { count: 0, revenue: 0, qty: 0 }
    m.count += 1
    m.revenue += s.totalPrice
    for (const item of saleItems) m.qty += item.qty
    byMethod.set(s.paymentMethod, m)

    if (isReservationSale) continue

    ticketCount += 1
    ticketRevenue += s.totalPrice
    ticketVisitors += s.totalVisitors
    const key = dayKey(s.date)
    const d = byDay.get(key) ?? { count: 0, revenue: 0, visitors: 0, tickets: 0, sold: 0, ticketRevenue: 0, ticketVisitors: 0 }
    d.tickets = (d.tickets ?? 0) + 1
    d.revenue += s.totalPrice
    d.ticketRevenue = (d.ticketRevenue ?? 0) + s.totalPrice
    d.ticketVisitors = (d.ticketVisitors ?? 0) + s.totalVisitors
    byDay.set(key, d)

    for (const item of saleItems) {
      ticketsSold += item.qty
      if (d.sold !== undefined) d.sold += item.qty
      const svc = byService.get(item.service) ?? { qty: 0, revenue: 0 }
      svc.qty += item.qty
      svc.revenue += item.total
      byService.set(item.service, svc)
    }
  }

  for (const [, d] of byDay) {
    d.totalVisitors = (d.visitors || 0) + (d.ticketVisitors || 0)
  }

  let revenue = 0
  let pendingValue = 0
  let visitors = 0
  for (const r of reservations) {
    visitors += r.totalVisitors
    if (MONEY_STATUSES.includes(r.status)) revenue += r.totalPrice
    else if (r.status === 'PENDING') pendingValue += r.totalPrice
  }

  const toList = <T,>(m: Map<string, T>, sortValue: (v: T) => number) =>
    [...m.entries()].map(([name, value]) => ({ name, ...value })).sort((a, b) => sortValue(b) - sortValue(a))

  return {
    range: { from, to, status },
    summary: {
      reservations: reservations.length,
      visitors,
      revenue,
      pendingValue,
      confirmed: byStatus.get('CONFIRMED')?.count || 0,
      completed: byStatus.get('COMPLETED')?.count || 0,
      cancelled: byStatus.get('CANCELLED')?.count || 0,
      pending: byStatus.get('PENDING')?.count || 0,
      ticketCount,
      ticketsSold,
      ticketRevenue,
      ticketVisitors,
    },
    byDay: [...byDay.entries()]
      .map(([name, value]) => ({ name, ...value }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    byStatus: toList(byStatus, (v) => v.revenue),
    byService: toList(byService, (v) => v.revenue),
    ticketByMethod: toList(byMethod, (v) => v.revenue),
    reservations: reservations.map((r) => ({
      id: r.id,
      code: r.code,
      date: r.date,
      time: r.time,
      name: r.name,
      email: r.email,
      phone: r.phone,
      visitors: r.totalVisitors,
      visitType: r.visitType,
      experience: r.experience?.title || null,
      status: r.status,
      totalPrice: r.totalPrice,
    })),
  }
}

router.get('/revenue', protect, allowRoles('ADMIN', 'MANAGER'), async (req, res) => {
  const from = String(req.query.from || '').slice(0, 10)
  const to = String(req.query.to || '').slice(0, 10)
  const status = String(req.query.status || 'todos')
  const report = await collectRevenueReport(from, to, status)
  res.json(report)
})

router.get('/revenue/pdf', protect, allowRoles('ADMIN', 'MANAGER'), async (req, res) => {
  const from = String(req.query.from || '').slice(0, 10)
  const to = String(req.query.to || '').slice(0, 10)
  const status = String(req.query.status || 'todos')
  try {
    const report = await collectRevenueReport(from, to, status)
    const buf = await generateReportPdf(report)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="relatorio-receitas-${from || 'tudo'}-${to || 'atual'}.pdf"`
    )
    res.send(buf)
  } catch (err) {
    console.error('Erro ao gerar PDF do relatório:', err)
    res.status(500).json({ error: 'Erro ao gerar o PDF do relatório.' })
  }
})

export default router
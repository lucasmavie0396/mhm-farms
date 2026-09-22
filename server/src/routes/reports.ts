import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { allowRoles, protect } from '../lib/auth'
import type { PriceBreakdown } from '../lib/pricing'

const router = Router()

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

const MONEY_STATUSES = ['CONFIRMED', 'COMPLETED']

router.get('/revenue', protect, allowRoles('ADMIN', 'MANAGER', 'STAFF'), async (req, res) => {
  const from = String(req.query.from || '').slice(0, 10)
  const to = String(req.query.to || '').slice(0, 10)
  const status = String(req.query.status || 'todos')

  const where: Record<string, unknown> = {}
  if (from) where.date = { ...(where.date as object), gte: new Date(`${from}T00:00:00.000`) }
  if (to) where.date = { ...(where.date as object), lte: new Date(`${to}T23:59:59.999`) }
  if (status !== 'todos') where.status = status

  const reservations = await prisma.reservation.findMany({
    where,
    include: { experience: true },
    orderBy: { date: 'asc' },
  })

  const byStatus = new Map<string, { count: number; revenue: number; visitors: number }>()
  const byDay = new Map<string, { count: number; revenue: number; visitors: number }>()
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

  const toList = <T,>(m: Map<string, T>, sortValue: (v: T) => number) =>
    [...m.entries()].map(([name, value]) => ({ name, ...value })).sort((a, b) => sortValue(b) - sortValue(a))

  let revenue = 0
  let pendingValue = 0
  let visitors = 0
  for (const r of reservations) {
    visitors += r.totalVisitors
    if (MONEY_STATUSES.includes(r.status)) revenue += r.totalPrice
    else if (r.status === 'PENDING') pendingValue += r.totalPrice
  }

  res.json({
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
    },
    byDay: toList(byDay, (v) => v.revenue),
    byStatus: toList(byStatus, (v) => v.revenue),
    byService: toList(byService, (v) => v.revenue),
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
  })
})

export default router
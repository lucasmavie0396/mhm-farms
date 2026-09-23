import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { allowRoles, protect } from '../lib/auth'

const router = Router()

router.get('/', protect, allowRoles('ADMIN', 'MANAGER'), async (req, res) => {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const fromRaw = String(req.query.from || '').slice(0, 10)
  const toRaw = String(req.query.to || '').slice(0, 10)
  const gte = fromRaw ? new Date(`${fromRaw}T00:00:00.000`) : startOfMonth
  const lte = toRaw ? new Date(`${toRaw}T23:59:59.999`) : endOfDay

  const range = { date: { gte, lte } }

  const [
    inRangeReservations,
    pendingReservations,
    confirmedReservations,
    cancelledReservations,
    totalAnimals,
    totalEvents,
    totalMessages,
    visitPeriod,
    visitToday,
    visitWeek,
    visitMonth,
    totalVisitorsOverall,
    revenue,
    revenuePending,
    monthlyStats,
    topExperiences,
    recent,
    ticketCount,
    ticketRevenue,
    ticketVisitors,
  ] = await Promise.all([
    prisma.reservation.count({ where: range }),
    prisma.reservation.count({ where: { ...range, status: 'PENDING' } }),
    prisma.reservation.count({ where: { ...range, status: 'CONFIRMED' } }),
    prisma.reservation.count({ where: { ...range, status: 'CANCELLED' } }),
    prisma.animal.count(),
    prisma.event.count({ where: { active: true } }),
    prisma.contactMessage.count({ where: { status: 'NEW' } }),
    prisma.reservation.aggregate({ where: range, _sum: { totalVisitors: true } }),
    prisma.reservation.aggregate({
      where: { date: { gte: startOfDay } },
      _sum: { totalVisitors: true },
    }),
    prisma.reservation.aggregate({
      where: { date: { gte: startOfWeek } },
      _sum: { totalVisitors: true },
    }),
    prisma.reservation.aggregate({
      where: { date: { gte: startOfMonth } },
      _sum: { totalVisitors: true },
    }),
    prisma.reservation.aggregate({ _sum: { totalVisitors: true } }),
    prisma.reservation.aggregate({
      where: { ...range, status: { in: ['CONFIRMED', 'COMPLETED'] } },
      _sum: { totalPrice: true },
    }),
    prisma.reservation.aggregate({
      where: { ...range, status: 'PENDING' },
      _sum: { totalPrice: true },
    }),
    prisma.reservation.groupBy({
      by: ['date'],
      where: range,
      _count: true,
      orderBy: { date: 'asc' },
    }),
    prisma.reservation.groupBy({
      by: ['experienceId'],
      where: { ...range, experienceId: { not: null } },
      _count: true,
      orderBy: { _count: { experienceId: 'desc' } },
      take: 5,
    }),
    prisma.reservation.findMany({
      where: range,
      orderBy: { date: 'desc' },
      take: 6,
    }),
    prisma.ticketSale.count({ where: { ...range, status: 'PAID' } }),
    prisma.ticketSale.aggregate({
      where: { ...range, status: 'PAID' },
      _sum: { totalPrice: true },
    }),
    prisma.ticketSale.aggregate({
      where: { ...range, status: 'PAID' },
      _sum: { totalVisitors: true },
    }),
  ])

  const experienceNames: Record<string, string> = {}
  for (const e of topExperiences) {
    if (e.experienceId) {
      const exp = await prisma.experience.findUnique({ where: { id: e.experienceId } })
      experienceNames[e.experienceId] = exp?.title || 'Desconhecida'
    }
  }

  res.json({
    range: { from: fromRaw, to: toRaw },
    visitors: {
      today: visitToday._sum.totalVisitors || 0,
      week: visitWeek._sum.totalVisitors || 0,
      month: visitMonth._sum.totalVisitors || 0,
      period: (visitPeriod._sum.totalVisitors || 0) + (ticketVisitors._sum.totalVisitors || 0),
      overall: totalVisitorsOverall._sum.totalVisitors || 0,
      ticketVisitors: ticketVisitors._sum.totalVisitors || 0,
    },
    reservations: {
      period: inRangeReservations,
      pending: pendingReservations,
      confirmed: confirmedReservations,
      cancelled: cancelledReservations,
      revenue: (revenue._sum.totalPrice || 0) + (ticketRevenue._sum.totalPrice || 0),
      revenuePending: revenuePending._sum.totalPrice || 0,
    },
    sales: {
      period: ticketCount,
      revenue: ticketRevenue._sum.totalPrice || 0,
    },
    content: {
      animals: totalAnimals,
      events: totalEvents,
      messages: totalMessages,
    },
    charts: {
      byDay: monthlyStats.map((m) => ({
        date: m.date.toISOString().slice(0, 10),
        visitors: m._count,
      })),
      topExperiences: topExperiences.map((e) => ({
        id: e.experienceId,
        name: e.experienceId ? experienceNames[e.experienceId] : '—',
        count: e._count,
      })),
    },
    recent,
  })
})

export default router
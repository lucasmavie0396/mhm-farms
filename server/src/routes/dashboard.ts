import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { allowRoles, protect } from '../lib/auth'

const router = Router()

router.get('/', protect, allowRoles('ADMIN', 'MANAGER', 'STAFF'), async (_req, res) => {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    todayReservations,
    pendingReservations,
    confirmedReservations,
    cancelledReservations,
    totalAnimals,
    totalEvents,
    totalVisitorsOverall,
    newMessages,
    reservationsThisMonth,
    monthlyStats,
    revenueConfirmed,
    revenuePending,
  ] = await Promise.all([
    prisma.reservation.count({ where: { date: { gte: startOfDay } } }),
    prisma.reservation.count({ where: { status: 'PENDING' } }),
    prisma.reservation.count({ where: { status: 'CONFIRMED' } }),
    prisma.reservation.count({ where: { status: 'CANCELLED' } }),
    prisma.animal.count(),
    prisma.event.count({ where: { active: true } }),
    prisma.reservation.aggregate({ _sum: { totalVisitors: true } }),
    prisma.contactMessage.count({ where: { status: 'NEW' } }),
    prisma.reservation.aggregate({
      where: { date: { gte: startOfMonth } },
      _sum: { totalPrice: true },
    }),
    prisma.reservation.groupBy({
      by: ['date'],
      where: { date: { gte: startOfMonth } },
      _sum: { totalPrice: true },
      _count: true,
      orderBy: { date: 'asc' },
    }),
    prisma.reservation.aggregate({ where: { status: 'CONFIRMED' }, _sum: { totalPrice: true } }),
    prisma.reservation.aggregate({ where: { status: 'PENDING' }, _sum: { totalPrice: true } }),
  ])

  const visitToday = await prisma.reservation.aggregate({
    where: { date: { gte: startOfDay } },
    _sum: { totalVisitors: true },
  })
  const visitWeek = await prisma.reservation.aggregate({
    where: { date: { gte: startOfWeek } },
    _sum: { totalVisitors: true },
  })
  const visitMonth = await prisma.reservation.aggregate({
    where: { date: { gte: startOfMonth } },
    _sum: { totalVisitors: true },
  })

  const topExperiences = await prisma.reservation.groupBy({
    by: ['experienceId'],
    where: { experienceId: { not: null } },
    _count: true,
    orderBy: { _count: { experienceId: 'desc' } },
    take: 5,
  })
  const experienceNames: Record<string, string> = {}
  for (const e of topExperiences) {
    if (e.experienceId) {
      const exp = await prisma.experience.findUnique({ where: { id: e.experienceId } })
      experienceNames[e.experienceId] = exp?.title || 'Desconhecida'
    }
  }

  res.json({
    visitors: {
      today: visitToday._sum.totalVisitors || 0,
      week: visitWeek._sum.totalVisitors || 0,
      month: visitMonth._sum.totalVisitors || 0,
      overall: totalVisitorsOverall._sum.totalVisitors || 0,
    },
    reservations: {
      today: todayReservations,
      pending: pendingReservations,
      confirmed: confirmedReservations,
      cancelled: cancelledReservations,
      revenueMonth: reservationsThisMonth._sum.totalPrice || 0,
      revenueConfirmed: revenueConfirmed._sum.totalPrice || 0,
      revenuePending: revenuePending._sum.totalPrice || 0,
    },
    content: {
      animals: totalAnimals,
      events: totalEvents,
      messages: newMessages,
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
  })
})

export default router
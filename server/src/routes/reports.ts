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
  ticketSales: {
    id: string
    code: string
    date: Date
    customerName: string | null
    seller: string | null
    paymentMethod: string
    totalVisitors: number
    totalPrice: number
    reservationCode: string | null
    items: { service: string; qty: number; unit: number; total: number }[]
  }[]
}

async function collectRevenueReport(from: string, to: string, status: string): Promise<RevenueReportData> {
  const where: Record<string, unknown> = {}
  const saleWhere: Record<string, unknown> = { status: 'PAID' }
  const payWhereUpTo: Record<string, unknown> = {}
  if (from) {
    where.date = { ...(where.date as object), gte: new Date(`${from}T00:00:00.000`) }
    saleWhere.date = { ...(saleWhere.date as object), gte: new Date(`${from}T00:00:00.000`) }
  }
  if (to) {
    where.date = { ...(where.date as object), lte: new Date(`${to}T23:59:59.999`) }
    saleWhere.date = { ...(saleWhere.date as object), lte: new Date(`${to}T23:59:59.999`) }
    payWhereUpTo.paidAt = { lte: new Date(`${to}T23:59:59.999`) }
  }
  if (status !== 'todos') where.status = status

  const [reservations, ticketSales, reservationPayments] = await Promise.all([
    prisma.reservation.findMany({
      where,
      include: { experience: true },
      orderBy: { date: 'asc' },
    }),
    prisma.ticketSale.findMany({
      where: saleWhere,
      include: {
        reservation: { select: { code: true } },
        seller: { select: { name: true } },
      },
      orderBy: { date: 'asc' },
    }),
    prisma.reservationPayment.findMany({
      where: payWhereUpTo,
      include: { reservation: { select: { status: true } } },
      orderBy: { paidAt: 'asc' },
    }),
  ])

  const byStatus = new Map<string, { count: number; revenue: number; visitors: number }>()
  const byDay = new Map<string, { count: number; revenue: number; visitors: number; tickets?: number; sold?: number; ticketRevenue?: number; ticketVisitors?: number; totalVisitors?: number }>()
  const byService = new Map<string, { qty: number; revenue: number }>()

  // Pagamentos de reservas: agregados até ao fim do período (para não duplicarem
  // receita de reservas pagas antes), e agrupados por dia para os do período
  const fromDate = from ? new Date(`${from}T00:00:00.000`) : null
  const payByDay = new Map<string, number>()
  const paidUpTo = new Map<string, number>()
  for (const p of reservationPayments) {
    if (p.reservation && !MONEY_STATUSES.includes(p.reservation.status)) continue
    paidUpTo.set(p.reservationId, (paidUpTo.get(p.reservationId) || 0) + p.amount)
    if (!fromDate || p.paidAt >= fromDate) {
      const pk = dayKey(p.paidAt)
      payByDay.set(pk, (payByDay.get(pk) || 0) + p.amount)
    }
  }
  const paidTotalOf = (id: string) => paidUpTo.get(id) ?? 0
  const neverPaid = (id: string) => !paidUpTo.has(id)

  for (const r of reservations) {
    const st = (byStatus.get(r.status) ?? { count: 0, revenue: 0, visitors: 0 })
    st.count += 1
    st.visitors += r.totalVisitors
    if (MONEY_STATUSES.includes(r.status)) st.revenue += neverPaid(r.id) ? r.totalPrice : paidTotalOf(r.id)
    byStatus.set(r.status, st)

    const key = dayKey(r.date)
    const d = byDay.get(key) ?? { count: 0, revenue: 0, visitors: 0 }
    d.count += 1
    d.visitors += r.totalVisitors
    if (MONEY_STATUSES.includes(r.status) && neverPaid(r.id)) d.revenue += r.totalPrice
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

  // Receita de reservas contabilizada na data em que cada pagamento foi feito
  for (const [pk, amount] of payByDay) {
    const d = byDay.get(pk) ?? { count: 0, revenue: 0, visitors: 0 }
    d.revenue += amount
    byDay.set(pk, d)
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
      d.sold = (d.sold ?? 0) + item.qty
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
  for (const [, amount] of payByDay) revenue += amount
  for (const r of reservations) {
    visitors += r.totalVisitors
    if (MONEY_STATUSES.includes(r.status) && neverPaid(r.id)) revenue += r.totalPrice
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
    ticketSales: ticketSales.map((s) => {
      const saleItems = Array.isArray((s as unknown as { items?: unknown }).items)
        ? ((s as unknown as { items: { service: string; qty: number; unit: number; total: number }[] }).items ?? [])
        : []
      return {
        id: s.id,
        code: s.code,
        date: s.date,
        customerName: s.customerName,
        seller: s.seller?.name || null,
        paymentMethod: s.paymentMethod,
        totalVisitors: s.totalVisitors,
        totalPrice: s.totalPrice,
        reservationCode: s.reservation?.code || null,
        items: saleItems,
      }
    }),
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

const CSV_METHOD_LABEL: Record<string, string> = {
  CASH: 'Dinheiro',
  MPESA: 'M-Pesa',
  EMOLA: 'e-Mola',
  CARD: 'Cartão / Multicaixa',
  OTHER: 'Outro',
}

router.get('/revenue/csv', protect, allowRoles('ADMIN', 'MANAGER'), async (req, res) => {
  const from = String(req.query.from || '').slice(0, 10)
  const to = String(req.query.to || '').slice(0, 10)
  const status = String(req.query.status || 'todos')
  try {
    const report = await collectRevenueReport(from, to, status)
    const s = report.summary
    const num = (v: number) => v.toFixed(2).replace('.', ',')
    const f = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const out: string[] = []

    out.push('RELATÓRIO DE RECEITAS')
    out.push(['Período', `${from || 'Início'} até ${to || 'Hoje'}`, `Estado: ${status}`].join(';'))
    out.push('')

    out.push('RESUMO')
    out.push(
      ['Reservas', 'Visitantes', 'Receita reservas (MT)', 'A receber (MT)', 'Vendas', 'Bilhetes', 'Receita vendas (MT)', 'Visitantes vendas', 'Receita total (MT)'].join(';')
    )
    out.push(
      [s.reservations, s.visitors, num(s.revenue), num(s.pendingValue), s.ticketCount, s.ticketsSold, num(s.ticketRevenue), s.ticketVisitors, num(s.revenue + s.ticketRevenue)].join(';')
    )
    out.push('')

    if (report.byDay.length > 0) {
      out.push('MOVIMENTAÇÃO DIÁRIA')
      out.push(['Data', 'Reservas', 'Visitantes', 'Receita reservas (MT)', 'Vendas', 'Bilhetes', 'Receita vendas (MT)', 'Visitantes vendas', 'Receita total (MT)'].join(';'))
      for (const d of report.byDay) {
        out.push(
          [
            d.name,
            d.count,
            d.visitors,
            num(d.revenue - (d.ticketRevenue || 0)),
            d.tickets || 0,
            d.sold || 0,
            num(d.ticketRevenue || 0),
            d.ticketVisitors || 0,
            num(d.revenue),
          ].join(';')
        )
      }
      out.push('')
    }

    if (report.ticketByMethod.length > 0) {
      out.push('FORMAS DE PAGAMENTO (VENDAS)')
      out.push(['Método', 'Nº vendas', 'Bilhetes', 'Receita (MT)'].join(';'))
      for (const m of report.ticketByMethod) {
        out.push([f(CSV_METHOD_LABEL[m.name] || m.name), m.count, m.qty, num(m.revenue)].join(';'))
      }
      out.push('')
    }

    if (report.byService.length > 0) {
      out.push('SERVIÇOS')
      out.push(['Serviço', 'Qtd', 'Receita (MT)'].join(';'))
      for (const svc of report.byService) {
        out.push([f(svc.name), svc.qty, num(svc.revenue)].join(';'))
      }
      out.push('')
    }

    if (report.reservations.length > 0) {
      out.push('RESERVAS')
      out.push(['Código', 'Data', 'Hora', 'Nome', 'Email', 'Telefone', 'Visitantes', 'Tipo', 'Experiência', 'Estado', 'Valor (MT)'].join(';'))
      for (const r of report.reservations) {
        out.push(
          [
            f(r.code),
            r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date).slice(0, 10),
            f(r.time),
            f(r.name),
            f(r.email),
            f(r.phone),
            r.visitors,
            f(r.visitType),
            f(r.experience),
            r.status,
            num(r.totalPrice),
          ].join(';')
        )
      }
      out.push('')
    }

    if (report.ticketSales.length > 0) {
      out.push('VENDAS DE ENTRADA')
      out.push(['Código', 'Data', 'Cliente', 'Vendedor', 'Método', 'Visitantes', 'Itens', 'Reserva', 'Valor (MT)'].join(';'))
      for (const t of report.ticketSales) {
        const items = t.items.map((i) => `${i.service} (${i.qty} × ${num(i.total)})`).join(', ')
        out.push(
          [
            f(t.code),
            t.date instanceof Date ? t.date.toISOString().slice(0, 10) : String(t.date).slice(0, 10),
            f(t.customerName),
            f(t.seller),
            f(CSV_METHOD_LABEL[t.paymentMethod] || t.paymentMethod),
            t.totalVisitors,
            f(items),
            f(t.reservationCode),
            num(t.totalPrice),
          ].join(';')
        )
      }
    }

    const csv = '\uFEFF' + out.join('\n')
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="relatorio-receitas-${from || 'tudo'}-${to || 'atual'}.csv"`
    )
    res.send(csv)
  } catch (err) {
    console.error('Erro ao gerar CSV do relatório:', err)
    res.status(500).json({ error: 'Erro ao gerar o CSV do relatório.' })
  }
})

export default router
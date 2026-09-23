import { useCallback, useEffect, useState } from 'react'
import {
  Banknote,
  CalendarCheck,
  Check,
  Coins,
  CreditCard,
  Download,
  FileText,
  MessageSquare,
  Repeat,
  Smartphone,
  Ticket,
  Users,
  X,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api, getToken } from '../../lib/api'
import { usePageMeta } from '../../lib/seo'
import { formatDateShort, formatMoney } from '../../lib/settings'
import { PageHead, Spinner, Notice } from '../../components/admin'
import type { RevenueReport } from '../../lib/types'
import { PAYMENT_METHODS, type PaymentMethod } from '../../lib/types'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Concluída',
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-gold-400/15 text-gold-600',
  CONFIRMED: 'bg-forest-100 text-forest-700',
  CANCELLED: 'bg-red-100 text-red-600',
  COMPLETED: 'bg-moss-100 text-moss-700',
}

const METHOD_META: Record<PaymentMethod, { color: string; soft: string; bar: string }> = {
  CASH: { color: '#1f783c', soft: 'bg-forest-50', bar: 'bg-forest-500' },
  MPESA: { color: '#e0a526', soft: 'bg-gold-400/10', bar: 'bg-gold-500' },
  EMOLA: { color: '#0e7bc4', soft: 'bg-sky-50', bar: 'bg-sky-500' },
  CARD: { color: '#c62848', soft: 'bg-rose-50', bar: 'bg-rose-500' },
  OTHER: { color: '#64748b', soft: 'bg-slate-100', bar: 'bg-slate-500' },
}

const methodIcon = (m: string) => {
  if (m === 'CASH') return Banknote
  if (m === 'MPESA' || m === 'EMOLA') return Smartphone
  if (m === 'CARD') return CreditCard
  return Coins
}

function iso(d: Date) {
  return d.toISOString().slice(0, 10)
}

function monthRange() {
  const now = new Date()
  const first = new Date(now.getFullYear(), now.getMonth(), 1)
  return { from: iso(first), to: iso(now) }
}

const PRESETS = [
  { label: 'Hoje', range: () => { const d = new Date(); return { from: iso(d), to: iso(d) } } },
  { label: '7 dias', range: () => { const now = new Date(); const d = new Date(now.getTime() - 6 * 86400000); return { from: iso(d), to: iso(now) } } },
  { label: 'Este mês', range: monthRange },
  { label: '30 dias', range: () => { const now = new Date(); const d = new Date(now.getTime() - 29 * 86400000); return { from: iso(d), to: iso(now) } } },
  { label: 'Tudo', range: () => ({ from: '', to: '' }) },
]

const compactMoney = (v: number) =>
  new Intl.NumberFormat('pt-PT', { notation: 'compact', maximumFractionDigits: 1 }).format(v) + ' MT'

export default function AdminReports() {
  usePageMeta('Relatórios')
  const [filters, setFilters] = useState(() => ({ ...monthRange(), status: 'todos' }))
  const [report, setReport] = useState<RevenueReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (f = filters) => {
    setLoading(true)
    setError('')
    try {
      const q = new URLSearchParams()
      if (f.from) q.set('from', f.from)
      if (f.to) q.set('to', f.to)
      if (f.status !== 'todos') q.set('status', f.status)
      const data = await api<RevenueReport>(`/reports/revenue?${q}`)
      setReport(data)
      setFilters(f)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar o relatório.')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    load({ ...monthRange(), status: 'todos' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const exportCsv = () => {
    if (!report) return
    const head = ['Código', 'Data', 'Hora', 'Nome', 'Email', 'Telefone', 'Visitantes', 'Tipo', 'Experiência', 'Estado', 'Valor (MT)']
    const rows = report.reservations.map((r) =>
      [
        r.code,
        formatDateShort(r.date),
        r.time,
        `"${r.name}"`,
        r.email,
        r.phone,
        r.visitors,
        `"${r.visitType}"`,
        `"${r.experience || ''}"`,
        STATUS_LABELS[r.status],
        r.totalPrice.toFixed(2).replace('.', ','),
      ].join(';')
    )
    const csv = '\uFEFF' + [head.join(';'), ...rows].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `relatorio-${report.range.from || 'tudo'}-${report.range.to || 'atual'}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const exportPdf = async () => {
    if (!report) return
    try {
      const q = new URLSearchParams()
      if (report.range.from) q.set('from', report.range.from)
      if (report.range.to) q.set('to', report.range.to)
      if (report.range.status !== 'todos') q.set('status', report.range.status)
      const headers: Record<string, string> = {}
      const token = getToken()
      if (token) headers.Authorization = `Bearer ${token}`
      const res = await fetch(`/api/reports/revenue/pdf?${q}`, { headers })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erro ao gerar o PDF.')
      }
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `relatorio-receitas-${report.range.from || 'tudo'}-${report.range.to || 'atual'}.pdf`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar o PDF.')
    }
  }

  const s = report?.summary
  const totalRevenue = (s?.revenue ?? 0) + (s?.ticketRevenue ?? 0)
  const totalVisitors = (s?.visitors ?? 0) + (s?.ticketVisitors ?? 0)

  const kpis = [
    { label: 'Receita total', value: formatMoney(totalRevenue), sub: `${s?.reservations ?? 0} reservas + ${s?.ticketCount ?? 0} vendas`, Icon: Coins, gradient: 'from-forest-600 to-forest-900' },
    { label: 'Entradas vendidas', value: s?.ticketsSold ?? 0, sub: `${s?.ticketCount ?? 0} vendas registadas`, Icon: Ticket, gradient: 'from-gold-500 to-gold-600' },
    { label: 'Visitantes', value: totalVisitors, sub: `${s?.visitors ?? 0} em reservas + ${s?.ticketVisitors ?? 0} em entradas`, Icon: Users, gradient: 'from-moss-500 to-moss-800' },
    { label: 'A receber (pendentes)', value: formatMoney(s?.pendingValue ?? 0), sub: `${s?.pending ?? 0} reservas pendentes`, Icon: Repeat, gradient: 'from-forest-950 to-forest-800' },
  ]

  const miniStats = [
    { label: 'Reservas', value: s?.reservations ?? 0, Icon: CalendarCheck },
    { label: 'Confirmadas', value: s?.confirmed ?? 0, Icon: Check },
    { label: 'Concluídas', value: s?.completed ?? 0, Icon: Check },
    { label: 'Pendentes', value: s?.pending ?? 0, Icon: MessageSquare },
    { label: 'Canceladas', value: s?.cancelled ?? 0, Icon: X },
  ]

  const byDay = (report?.byDay || []).map((d) => ({
    name: d.name.slice(5),
    Reservas: d.revenue - (d.ticketRevenue || 0),
    Entradas: d.ticketRevenue || 0,
    visitReservas: d.visitors,
    visitEntradas: d.ticketVisitors || 0,
  }))
  const byService = (report?.byService || []).slice(0, 8).map((x) => ({
    name: x.name.length > 26 ? x.name.slice(0, 25) + '…' : x.name,
    Receita: x.revenue,
  }))
  const methods = report?.ticketByMethod || []
  const methodTotal = methods.reduce((acc, m) => acc + m.revenue, 0)
  const hasSales = methods.length > 0

  return (
    <div>
      <PageHead title="Relatórios" subtitle="Visão geral de receitas e vendas de entradas por período." />

      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-forest-100">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => {
            const r = p.range()
            const active = r.from === filters.from && r.to === filters.to
            return (
              <button
                key={p.label}
                onClick={() => load({ ...filters, ...r })}
                className={`rounded-full px-4 py-1.5 text-xs font-extrabold transition-colors ${
                  active ? 'bg-forest-700 text-white' : 'bg-forest-50 text-forest-800 hover:bg-forest-100'
                }`}
              >
                {p.label}
              </button>
            )
          })}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="field-label">De</label>
            <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Até</label>
            <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Estado</label>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="todos">Todos</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <button onClick={() => load()} disabled={loading} className="btn-primary !py-2.5">
            {loading ? 'A filtrar…' : 'Filtrar'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4">
          <Notice kind="error">{error}</Notice>
        </div>
      )}

      {!loading && report && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map(({ label, value, sub, Icon, gradient }) => (
              <div key={label} className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-6 text-white shadow-sm`}>
                <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
                <div className="flex items-center justify-between">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-white/70">{label}</p>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <p className="mt-3 font-display text-3xl font-bold">{value}</p>
                <p className="mt-1 text-xs font-semibold text-white/60">{sub}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {miniStats.map(({ label, value, Icon }) => (
              <div key={label} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-forest-100">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-forest-50 text-forest-700">
                  <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                </span>
                <div>
                  <p className="font-display text-lg font-bold leading-tight text-forest-900">{value}</p>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-forest-800/50">{label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-forest-100 lg:col-span-2">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display font-bold text-forest-900">Evolução da receita</h3>
                <div className="flex items-center gap-4 text-xs font-bold text-forest-800/60">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-forest-500" /> Reservas</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-gold-500" /> Entradas</span>
                </div>
              </div>
              {byDay.length === 0 ? (
                <p className="py-10 text-center text-sm text-forest-800/50">Sem movimentações no período.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={byDay} margin={{ left: 4, right: 8 }}>
                    <defs>
                      <linearGradient id="gReservas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1f783c" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#1f783c" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gEntradas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#e0a526" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#e0a526" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef3e9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={compactMoney} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={58} />
                    <Tooltip formatter={(v) => formatMoney(Number(v))} contentStyle={{ borderRadius: 14, border: '1px solid #eef3e9', boxShadow: '0 8px 24px rgba(19,64,34,.08)' }} />
                    <Area type="monotone" dataKey="Reservas" stroke="#1f783c" strokeWidth={2} fill="url(#gReservas)" stackId="1" />
                    <Area type="monotone" dataKey="Entradas" stroke="#e0a526" strokeWidth={2} fill="url(#gEntradas)" stackId="1" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-forest-100">
              <h3 className="mb-2 font-display font-bold text-forest-900">Receita por pagamento</h3>
              <p className="mb-4 text-xs font-semibold text-forest-800/50">Vendas de entradas</p>
              {methods.length === 0 ? (
                <p className="py-10 text-center text-sm text-forest-800/50">Sem vendas de entradas no período.</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={methods} dataKey="revenue" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} strokeWidth={0}>
                        {methods.map((m) => (
                          <Cell key={m.name} fill={METHOD_META[m.name as PaymentMethod]?.color || '#64748b'} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => formatMoney(Number(v))} />
                    </PieChart>
                  </ResponsiveContainer>
                  <ul className="mt-2 space-y-2">
                    {methods.map((m) => (
                      <li key={m.name} className="flex items-center justify-between gap-2 text-sm">
                        <span className="flex items-center gap-2 font-semibold text-forest-900">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: METHOD_META[m.name as PaymentMethod]?.color || '#64748b' }} />
                          {PAYMENT_METHODS[m.name as PaymentMethod] || m.name}
                        </span>
                        <span className="font-bold text-forest-800/70">
                          {methodTotal > 0 ? Math.round((m.revenue / methodTotal) * 100) : 0}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-forest-100">
              <h3 className="mb-4 font-display font-bold text-forest-900">Visitantes por dia</h3>
              {byDay.length === 0 ? (
                <p className="py-10 text-center text-sm text-forest-800/50">Sem visitantes no período.</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={byDay} margin={{ left: 4, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef3e9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={34} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 14, border: '1px solid #eef3e9', boxShadow: '0 8px 24px rgba(19,64,34,.08)' }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v) => (v === 'visitReservas' ? 'Reservas' : 'Entradas')} />
                    <Bar dataKey="visitReservas" stackId="a" fill="#1f783c" radius={[0, 0, 0, 0]} name="Reservas" />
                    <Bar dataKey="visitEntradas" stackId="a" fill="#e0a526" radius={[4, 4, 0, 0]} name="Entradas" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-forest-100">
              <h3 className="mb-4 font-display font-bold text-forest-900">Receita por serviço</h3>
              {byService.length === 0 ? (
                <p className="py-10 text-center text-sm text-forest-800/50">Sem serviços no período.</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={byService} layout="vertical" margin={{ left: 8, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef3e9" horizontal={false} />
                    <XAxis type="number" tickFormatter={compactMoney} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" width={170} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(v) => formatMoney(Number(v))} contentStyle={{ borderRadius: 14, border: '1px solid #eef3e9', boxShadow: '0 8px 24px rgba(19,64,34,.08)' }} />
                    <Bar dataKey="Receita" fill="#e0a526" radius={[0, 6, 6, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {hasSales && (
            <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-forest-100">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-display font-bold text-forest-900">Totais por forma de pagamento</h3>
                  <p className="text-xs font-semibold text-forest-800/50">
                    {methods.length} formas usadas · {s?.ticketsSold ?? 0} entradas vendidas · {s?.ticketCount ?? 0} vendas
                  </p>
                </div>
                <span className="rounded-full bg-forest-50 px-4 py-1.5 text-xs font-extrabold text-forest-800">
                  Total {formatMoney(methodTotal)}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {methods.map((m) => {
                  const meta = METHOD_META[m.name as PaymentMethod] || METHOD_META.OTHER
                  const share = methodTotal > 0 ? (m.revenue / methodTotal) * 100 : 0
                  const Icon = methodIcon(m.name)
                  return (
                    <div key={m.name} className={`rounded-2xl border border-forest-100 p-4 ${meta.soft}`}>
                      <div className="flex items-center justify-between">
                        <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: meta.color }}>
                          <Icon className="h-5 w-5 text-white" />
                        </span>
                        <span className="text-2xl font-extrabold text-forest-800/25">{Math.round(share)}%</span>
                      </div>
                      <p className="mt-3 font-display text-xl font-bold text-forest-900">{formatMoney(m.revenue)}</p>
                      <p className="text-xs font-bold text-forest-800/60">{PAYMENT_METHODS[m.name as PaymentMethod] || m.name}</p>
                      <p className="text-[11px] font-semibold text-forest-800/50">{m.count} venda{m.count === 1 ? '' : 's'} · {m.qty ?? 0} entrada{m.qty === 1 ? '' : 's'}</p>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white">
                        <div className={`h-full rounded-full ${meta.bar}`} style={{ width: `${Math.max(share, 4)}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-forest-100">
              <h3 className="mb-4 font-display font-bold text-forest-900">Por estado</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-forest-100 text-left text-[10px] font-extrabold uppercase tracking-wider text-forest-800/50">
                    <th className="pb-2">Estado</th>
                    <th className="pb-2 text-right">Nº</th>
                    <th className="pb-2 text-right">Receita (MT)</th>
                  </tr>
                </thead>
                <tbody>
                  {report.byStatus.map((st) => (
                    <tr key={st.name} className="border-b border-forest-50">
                      <td className="py-2.5">
                        <span className={`badge ${STATUS_STYLES[st.name] || 'bg-forest-50 text-forest-800'}`}>
                          {STATUS_LABELS[st.name] || st.name}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-bold text-forest-900">{st.count}</td>
                      <td className="py-2.5 text-right text-forest-800/70">{formatMoney(st.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-forest-100 lg:col-span-2">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-display font-bold text-forest-900">
                  {report.reservations.length} reservas no período
                </h3>
                <button onClick={exportCsv} className="btn-outline !px-4 !py-2 !text-xs">
                  <Download className="h-4 w-4" /> Exportar CSV
                </button>
                <button onClick={exportPdf} className="btn-primary !px-4 !py-2 !text-xs">
                  <FileText className="h-4 w-4" /> Exportar PDF
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-forest-100 text-left text-[10px] font-extrabold uppercase tracking-wider text-forest-800/50">
                      <th className="pb-2">Código</th>
                      <th className="pb-2">Data</th>
                      <th className="pb-2">Nome</th>
                      <th className="pb-2">Tipo</th>
                      <th className="pb-2 text-right">Visitantes</th>
                      <th className="pb-2 text-right">Valor (MT)</th>
                      <th className="pb-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.reservations.map((r) => (
                      <tr key={r.id} className="border-b border-forest-50 hover:bg-forest-50/50">
                        <td className="py-2.5 font-mono text-xs font-bold text-forest-700">{r.code}</td>
                        <td className="py-2.5 text-forest-800/70">{formatDateShort(r.date)}</td>
                        <td className="py-2.5 font-semibold text-forest-900">{r.name}</td>
                        <td className="py-2.5 text-forest-800/70">{r.visitType}</td>
                        <td className="py-2.5 text-right text-forest-800/70">{r.visitors}</td>
                        <td className="py-2.5 text-right font-bold text-forest-900">{formatMoney(r.totalPrice)}</td>
                        <td className="py-2.5">
                          <span className={`badge ${STATUS_STYLES[r.status] || 'bg-forest-50 text-forest-800'}`}>
                            {STATUS_LABELS[r.status]}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {report.reservations.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-sm text-forest-800/50">
                          Nenhuma reserva para os filtros escolhidos.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {loading && <div className="mt-8"><Spinner /></div>}
    </div>
  )
}
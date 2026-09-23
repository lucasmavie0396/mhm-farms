import { useCallback, useEffect, useState } from 'react'
import {
  CalendarCheck,
  CalendarDays,
  Coins,
  MessageSquare,
  PawPrint,
  Repeat,
  ShoppingCart,
  Ticket,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react'
import {
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
import { api } from '../../lib/api'
import { usePageMeta } from '../../lib/seo'
import { formatDateShort, formatMoney } from '../../lib/settings'
import { PageHead, Spinner, Notice } from '../../components/admin'
import type { DashboardData } from '../../lib/types'

const PIE_COLORS = ['#1f783c', '#e0a526', '#5c8a3a', '#c68a12', '#134022', '#86cd94']

function iso(d: Date) {
  return d.toISOString().slice(0, 10)
}

function monthRange() {
  const now = new Date()
  const first = new Date(now.getFullYear(), now.getMonth(), 1)
  return { from: iso(first), to: iso(now) }
}

export default function AdminDashoboard() {
  usePageMeta('Dashboard')
  const [filters, setFilters] = useState(monthRange())
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (f = filters) => {
    setLoading(true)
    setError('')
    try {
      const q = new URLSearchParams()
      if (f.from) q.set('from', f.from)
      if (f.to) q.set('to', f.to)
      setData(await api<DashboardData>(`/dashboard?${q}`))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar o dashboard.')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyRange = (from: string, to: string) => {
    const f = { from, to }
    setFilters(f)
    load(f)
  }

  const quickRanges = [
    { label: 'Hoje', range: () => { const d = new Date(); return { from: iso(d), to: iso(d) } } },
    { label: '7 dias', range: () => { const now = new Date(); const d = new Date(now.getTime() - 6 * 86400000); return { from: iso(d), to: iso(now) } } },
    { label: 'Este mês', range: monthRange },
    { label: '30 dias', range: () => { const now = new Date(); const d = new Date(now.getTime() - 29 * 86400000); return { from: iso(d), to: iso(now) } } },
    { label: 'Tudo', range: () => ({ from: '', to: '' }) },
  ]

  if (loading && !data) return <Spinner />

  if (error && !data) {
    return (
      <div>
        <PageHead title="Dashboard" subtitle="Visão geral do desempenho da MHM Farms." />
        <Notice kind="error">{error}</Notice>
      </div>
    )
  }

  const stats = [
    { label: 'Visitantes (período)', value: data?.visitors.period ?? 0, Icon: Users },
    { label: 'Visitantes hoje', value: data?.visitors.today ?? 0, Icon: TrendingUp },
    { label: 'Este mês', value: data?.visitors.month ?? 0, Icon: CalendarDays },
    { label: 'Visitantes totais', value: data?.visitors.overall ?? 0, Icon: Users },
    { label: 'Reservas (período)', value: data?.reservations.period ?? 0, Icon: CalendarCheck },
    { label: 'Pendentes', value: data?.reservations.pending ?? 0, Icon: MessageSquare },
    { label: 'Confirmadas', value: data?.reservations.confirmed ?? 0, Icon: CheckIcon },
    { label: 'Canceladas', value: data?.reservations.cancelled ?? 0, Icon: XCircle },
    { label: 'Receita (período)', value: formatMoney(data?.reservations.revenue ?? 0), Icon: Coins },
    { label: 'Vendas de entradas', value: data?.sales.period ?? 0, Icon: ShoppingCart },
    { label: 'Receita (entradas)', value: formatMoney(data?.sales.revenue ?? 0), Icon: Ticket },
    { label: 'A receber (pendentes)', value: formatMoney(data?.reservations.revenuePending ?? 0), Icon: Repeat },
    { label: 'Animais', value: data?.content.animals ?? 0, Icon: PawPrint },
    { label: 'Mensagens novas', value: data?.content.messages ?? 0, Icon: MessageSquare },
  ]

  const byDay = (data?.charts.byDay || []).map((d) => ({
    name: d.date.slice(5),
    visitantes: d.visitors,
  }))
  const topExp = (data?.charts.topExperiences || []).map((e) => ({
    name: e.name.length > 16 ? e.name.slice(0, 15) + '…' : e.name,
    value: e.count,
  }))

  const periodLabel =
    data?.range.from || data?.range.to
      ? ` (${data.range.from || '…'} → ${data.range.to || '…'})`
      : ''

  return (
    <div>
      <PageHead
        title="Dashboard"
        subtitle="Visão geral do desempenho da MHM Farms."
      />

      <div className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-forest-100">
        <div>
          <label className="field-label">De</label>
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
          />
        </div>
        <div>
          <label className="field-label">Até</label>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
          />
        </div>
        <button
          onClick={() => load()}
          disabled={loading}
          className="btn-primary !py-2.5"
        >
          {loading ? 'A filtrar…' : 'Filtrar'}
        </button>
        <div className="flex flex-wrap gap-2">
          {quickRanges.map((q) => (
            <button
              key={q.label}
              onClick={() => applyRange(q.range().from, q.range().to)}
              className="btn-outline !px-3 !py-2 !text-xs"
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mt-4">
          <Notice kind="error">{error}</Notice>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {stats.map(({ label, value, Icon }) => (
          <div key={label} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-forest-100">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-forest-800/50">{label}</p>
              <Icon className="h-5 w-5 text-gold-600" />
            </div>
            <p className="mt-2 font-display text-2xl font-bold text-forest-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-forest-100">
          <h3 className="mb-4 font-display font-bold text-forest-900">Visitantes por dia{periodLabel}</h3>
          {byDay.length === 0 ? (
            <p className="py-10 text-center text-sm text-forest-800/50">Sem dados no período.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef3e9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="visitantes" fill="#1f783c" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-forest-100">
          <h3 className="mb-4 font-display font-bold text-forest-900">Atividades mais reservadas{periodLabel}</h3>
          {topExp.length === 0 ? (
            <p className="py-10 text-center text-sm text-forest-800/50">Sem reservas de experiências no período.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={topExp} dataKey="value" nameKey="name" outerRadius={95} label>
                  {topExp.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-forest-100">
        <h3 className="mb-4 font-display font-bold text-forest-900">Reservas recentes{periodLabel}</h3>
        {!data || data.recent.length === 0 ? (
          <p className="py-8 text-center text-sm text-forest-800/50">Sem reservas no período.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.recent.map((r) => (
              <div key={r.id} className="rounded-2xl bg-forest-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-forest-700">{r.code}</span>
                  <span className="text-xs font-bold">{r.time}</span>
                </div>
                <p className="mt-1.5 font-semibold text-forest-900">{r.name}</p>
                <p className="text-xs text-forest-800/60">
                  {formatDateShort(r.date)} · {r.adults} adulto(s) · {r.children} criança(s) · {r.visitType}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
    </svg>
  )
}
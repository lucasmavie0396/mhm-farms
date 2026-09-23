import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  CalendarCheck,
  CalendarDays,
  Check,
  Coins,
  Globe,
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

const TILES: Record<string, string> = {
  forest: 'bg-forest-600',
  moss: 'bg-moss-600',
  gold: 'bg-gold-500',
  sky: 'bg-sky-600',
  red: 'bg-red-500',
}

const RECENT_BADGE: Record<string, string> = {
  PENDING: 'bg-gold-400/15 text-gold-600',
  CONFIRMED: 'bg-forest-100 text-forest-700',
  CANCELLED: 'bg-red-100 text-red-600',
  COMPLETED: 'bg-moss-100 text-moss-700',
}

const RECENT_LABEL: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Concluída',
}

function iso(d: Date) {
  return d.toISOString().slice(0, 10)
}

function monthRange() {
  const now = new Date()
  const first = new Date(now.getFullYear(), now.getMonth(), 1)
  return { from: iso(first), to: iso(now) }
}

const pct = (n: number, tot: number) => (tot ? Math.round((n / tot) * 100) : 0)

function StatCard({
  label,
  value,
  Icon,
  tone,
  to,
}: {
  label: string
  value: React.ReactNode
  Icon: React.ComponentType<{ className?: string }>
  tone: keyof typeof TILES
  to: string
}) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(to)}
      className="group relative overflow-hidden rounded-2xl bg-white p-5 text-left shadow-sm ring-1 ring-forest-100 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-forest-300"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-forest-800/50">{label}</p>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${TILES[tone]} text-white shadow-sm transition-transform group-hover:scale-105`}>
          <Icon className="h-4.5 w-4.5" />
        </span>
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-forest-900">{value}</p>
      <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-forest-600 opacity-80 transition-opacity group-hover:opacity-100">
        Ver detalhes
        <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </p>
    </button>
  )
}

export default function AdminDashoboard() {
  usePageMeta('Dashboard')
  const navigate = useNavigate()
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

  const r = data?.reservations
  const s = data?.sales

  const visitorStats = [
    { label: 'Visitantes (período)', value: data?.visitors.period ?? 0, Icon: Users, tone: 'forest', to: '/admin/relatorios' },
    { label: 'Visitantes hoje', value: data?.visitors.today ?? 0, Icon: TrendingUp, tone: 'gold', to: '/admin/reservas' },
    { label: 'Este mês', value: data?.visitors.month ?? 0, Icon: CalendarDays, tone: 'moss', to: '/admin/relatorios' },
    { label: 'Visitantes totais', value: data?.visitors.overall ?? 0, Icon: Globe, tone: 'sky', to: '/admin/relatorios' },
  ] as const

  const reservationStats = [
    { label: 'Reservas (período)', value: r?.period ?? 0, Icon: CalendarCheck, tone: 'forest', to: '/admin/reservas' },
    { label: 'Pendentes', value: r?.pending ?? 0, Icon: MessageSquare, tone: 'gold', to: '/admin/reservas' },
    { label: 'Confirmadas', value: r?.confirmed ?? 0, Icon: Check, tone: 'moss', to: '/admin/reservas' },
    { label: 'Canceladas', value: r?.cancelled ?? 0, Icon: XCircle, tone: 'red', to: '/admin/reservas' },
    { label: 'Receita (período)', value: formatMoney(r?.revenue ?? 0), Icon: Coins, tone: 'forest', to: '/admin/reservas' },
    { label: 'A receber', value: formatMoney(r?.revenuePending ?? 0), Icon: Repeat, tone: 'gold', to: '/admin/reservas' },
  ] as const

  const salesStats = [
    { label: 'Vendas de entradas', value: s?.period ?? 0, Icon: ShoppingCart, tone: 'gold', to: '/admin/venda-entradas' },
    { label: 'Receita (entradas)', value: formatMoney(s?.revenue ?? 0), Icon: Ticket, tone: 'moss', to: '/admin/venda-entradas' },
  ] as const

  const contentStats = [
    { label: 'Animais', value: data?.content.animals ?? 0, Icon: PawPrint, tone: 'forest', to: '/admin/animais' },
    { label: 'Mensagens novas', value: data?.content.messages ?? 0, Icon: MessageSquare, tone: 'sky', to: '/admin/mensagens' },
  ] as const

  const byDay = (data?.charts.byDay || []).map((d) => ({
    name: d.date.slice(5),
    full: d.date,
    visitantes: d.visitors,
  }))
  const dayTotal = byDay.reduce((a, d) => a + d.visitantes, 0)
  const topExp = (data?.charts.topExperiences || []).map((e, i) => ({
    name: e.name.length > 18 ? e.name.slice(0, 17) + '…' : e.name,
    value: e.count,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }))
  const topExpTotal = topExp.reduce((a, e) => a + e.value, 0)

  const resTotal = (r?.pending ?? 0) + (r?.confirmed ?? 0) + (r?.cancelled ?? 0)
  const statuses = [
    { label: 'Pendentes', n: r?.pending ?? 0, color: '#e0a526' },
    { label: 'Confirmadas', n: r?.confirmed ?? 0, color: '#1f783c' },
    { label: 'Canceladas', n: r?.cancelled ?? 0, color: '#ef4444' },
  ]

  const revenueTotal = (r?.revenue ?? 0) + (s?.revenue ?? 0)
  const revenueSplit = [
    { label: 'Reservas', value: r?.revenue ?? 0, color: '#1f783c' },
    { label: 'Entradas', value: s?.revenue ?? 0, color: '#e0a526' },
  ]

  const periodLabel =
    data?.range.from || data?.range.to
      ? ` (${data.range.from || '…'} → ${data.range.to || '…'})`
      : ''

  return (
    <div>
      <PageHead title="Dashboard" subtitle="Visão geral com acesso rápido às áreas de gestão." />

      <div className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-forest-100">
        {quickRanges.map((q) => {
          const ran = q.range()
          const active = ran.from === filters.from && ran.to === filters.to
          return (
            <button
              key={q.label}
              onClick={() => applyRange(ran.from, ran.to)}
              disabled={loading}
              className={`rounded-full px-4 py-1.5 text-xs font-extrabold transition-colors ${
                active ? 'bg-forest-700 text-white' : 'bg-forest-50 text-forest-800 hover:bg-forest-100'
              }`}
            >
              {q.label}
            </button>
          )
        })}
        <div className="ml-auto flex flex-wrap items-end gap-3">
          <div>
            <label className="field-label">De</label>
            <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Até</label>
            <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
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

      <div className="mt-6 space-y-6">
        <section>
          <p className="mb-2.5 px-1 text-[11px] font-extrabold uppercase tracking-widest text-forest-800/40">Visitantes</p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {visitorStats.map(({ label, value, Icon, tone, to }) => (
              <StatCard key={label} label={label} value={value} Icon={Icon} tone={tone} to={to} />
            ))}
          </div>
        </section>

        <section>
          <p className="mb-2.5 px-1 text-[11px] font-extrabold uppercase tracking-widest text-forest-800/40">Reservas</p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {reservationStats.map(({ label, value, Icon, tone, to }) => (
              <StatCard key={label} label={label} value={value} Icon={Icon} tone={tone} to={to} />
            ))}
          </div>
        </section>

        <section>
          <p className="mb-2.5 px-1 text-[11px] font-extrabold uppercase tracking-widest text-forest-800/40">Vendas & conteúdo</p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[...salesStats, ...contentStats].map(({ label, value, Icon, tone, to }) => (
              <StatCard key={label} label={label} value={value} Icon={Icon} tone={tone} to={to} />
            ))}
          </div>
        </section>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-forest-100">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-lg font-bold text-forest-900">Visitantes por dia{periodLabel}</h3>
              <p className="mt-0.5 text-xs font-semibold text-forest-800/50">
                {dayTotal} visitante(s) no período · <span className="text-forest-600">clique numa barra para ver o dia</span>
              </p>
            </div>
          </div>
          {byDay.length === 0 ? (
            <p className="py-10 text-center text-sm text-forest-800/50">Sem dados no período.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byDay} margin={{ left: 0, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="gVis" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1f783c" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#1f783c" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef3e9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={18} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={34} />
                <Tooltip
                  cursor={{ fill: '#effaf0' }}
                  formatter={(v) => [`${v} visitante(s)`, 'Visitantes']}
                  labelFormatter={(l) => `Dia ${l}`}
                  contentStyle={{ borderRadius: 14, border: '1px solid #eef3e9', boxShadow: '0 8px 24px rgba(19,64,34,.08)', fontSize: 12 }}
                />
                <Bar
                  dataKey="visitantes"
                  fill="url(#gVis)"
                  radius={[8, 8, 0, 0]}
                  cursor="pointer"
                  onClick={(entry: any) => {
                    const full = entry?.payload?.full
                    if (full) applyRange(full, full)
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-forest-100">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-lg font-bold text-forest-900">Atividades mais reservadas{periodLabel}</h3>
              <p className="mt-0.5 text-xs font-semibold text-forest-800/50">Clique numa atividade para abrir as reservas</p>
            </div>
          </div>
          {topExp.length === 0 ? (
            <p className="py-10 text-center text-sm text-forest-800/50">Sem reservas de experiências no período.</p>
          ) : (
            <>
              <div className="relative">
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart>
                    <Pie data={topExp} dataKey="value" nameKey="name" innerRadius={60} outerRadius={94} paddingAngle={3} strokeWidth={0} cornerRadius={6}>
                      {topExp.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v} reservas`, '']} contentStyle={{ borderRadius: 14, border: '1px solid #eef3e9', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <p className="font-display text-3xl font-bold text-forest-900">{topExpTotal}</p>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-forest-800/50">reservas</p>
                  </div>
                </div>
              </div>
              <ul className="mt-3 space-y-1.5">
                {topExp.map((e) => (
                  <li key={e.name}>
                    <button
                      onClick={() => navigate('/admin/reservas')}
                      className="group flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-forest-50"
                    >
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: e.color }} />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-forest-900">{e.name}</span>
                      <span className="shrink-0 rounded-full bg-forest-50 px-2.5 py-0.5 text-xs font-bold text-forest-700 group-hover:bg-white">
                        {e.value}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-forest-100">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-lg font-bold text-forest-900">Estado das reservas{periodLabel}</h3>
              <p className="mt-0.5 text-xs font-semibold text-forest-800/50">Distribuição das reservas do período</p>
            </div>
          </div>
          <button onClick={() => navigate('/admin/reservas')} className="group block w-full">
            {resTotal === 0 ? (
              <p className="py-10 text-center text-sm text-forest-800/50">Sem reservas no período.</p>
            ) : (
              <>
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-forest-50">
                  {statuses
                    .filter((x) => x.n > 0)
                    .map((x) => (
                      <div key={x.label} title={`${x.label}: ${x.n}`} style={{ width: `${(x.n / resTotal) * 100}%`, background: x.color }} />
                    ))}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {statuses.map((x) => (
                    <div key={x.label} className="rounded-2xl bg-forest-50/70 px-4 py-3 text-left transition-colors group-hover:bg-forest-50">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ background: x.color }} />
                        <p className="text-[11px] font-bold uppercase tracking-wide text-forest-800/50">{x.label}</p>
                      </div>
                      <p className="mt-1 font-display text-xl font-bold text-forest-900">
                        {x.n}
                        <span className="ml-1.5 text-xs font-semibold text-forest-800/50">{pct(x.n, resTotal)}%</span>
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </button>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-forest-100">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-lg font-bold text-forest-900">Receita do período{periodLabel}</h3>
              <p className="mt-0.5 text-xs font-semibold text-forest-800/50">Reservas vs vendas de entradas</p>
            </div>
          </div>
          <button onClick={() => navigate('/admin/relatorios')} className="group block w-full">
            <div className="mb-4 rounded-2xl bg-gradient-to-br from-forest-600 to-forest-800 p-4 text-white">
              <p className="text-[11px] font-bold uppercase tracking-wider text-white/60">Receita total</p>
              <p className="mt-0.5 font-display text-2xl font-bold">{formatMoney(revenueTotal)}</p>
            </div>
            <div className="space-y-3">
              {revenueSplit.map((x) => (
                <div key={x.label}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-semibold text-forest-900">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: x.color }} />
                      {x.label}
                    </span>
                    <span className="font-bold text-forest-800/70">
                      {formatMoney(x.value)}
                      <span className="ml-1.5 text-xs font-semibold text-forest-800/50">{pct(x.value, revenueTotal)}%</span>
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-forest-50">
                    <div
                      className="h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                      style={{ width: `${pct(x.value, revenueTotal)}%`, background: x.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-forest-100">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-lg font-bold text-forest-900">Reservas recentes{periodLabel}</h3>
            <p className="mt-0.5 text-xs font-semibold text-forest-800/50">Clique numa reserva para abrir a área de reservas</p>
          </div>
        </div>
        {!data || data.recent.length === 0 ? (
          <p className="py-8 text-center text-sm text-forest-800/50">Sem reservas no período.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.recent.map((res) => (
              <button
                key={res.id}
                onClick={() => navigate('/admin/reservas')}
                className="group rounded-2xl bg-forest-50 p-4 text-left transition-colors hover:bg-forest-100"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-forest-700">{res.code}</span>
                  <span className="text-xs font-bold text-forest-800/60">{res.time}</span>
                </div>
                <p className="mt-1.5 font-semibold text-forest-900">{res.name}</p>
                <p className="text-xs text-forest-800/60">
                  {formatDateShort(res.date)} · {res.adults} adulto(s) · {res.children} criança(s) · {res.visitType}
                </p>
                <p className="mt-2 flex items-center gap-1.5">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${RECENT_BADGE[res.status] || 'bg-forest-100 text-forest-700'}`}>
                    {RECENT_LABEL[res.status] || res.status}
                  </span>
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
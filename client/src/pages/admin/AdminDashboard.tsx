import { useEffect, useState } from 'react'
import {
  CalendarCheck,
  CalendarDays,
  Coins,
  MessageSquare,
  PawPrint,
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
import { formatMoney } from '../../lib/settings'
import { PageHead, Spinner } from '../../components/admin'
import type { DashboardData, Reservation } from '../../lib/types'

const PIE_COLORS = ['#1f783c', '#e0a526', '#5c8a3a', '#c68a12', '#134022', '#86cd94']

export default function AdminDashoboard() {
  usePageMeta('Dashboard')
  const [data, setData] = useState<DashboardData | null>(null)
  const [today, setToday] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api<DashboardData>('/dashboard'),
      api<Reservation[]>('/reservations/admin/all'),
    ])
      .then(([d, r]) => {
        setData(d)
        const todayStr = new Date().toDateString()
        setToday(
          r.filter((res) => new Date(res.date).toDateString() === todayStr).slice(0, 6)
        )
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  const stats = [
    { label: 'Visitantes hoje', value: data?.visitors.today ?? 0, Icon: Users },
    { label: 'Esta semana', value: data?.visitors.week ?? 0, Icon: TrendingUp },
    { label: 'Este mês', value: data?.visitors.month ?? 0, Icon: CalendarDays },
    { label: 'Visitantes totais', value: data?.visitors.overall ?? 0, Icon: Users },
    { label: 'Reservas hoje', value: data?.reservations.today ?? 0, Icon: CalendarCheck },
    { label: 'Pendentes', value: data?.reservations.pending ?? 0, Icon: MessageSquare },
    { label: 'Confirmadas', value: data?.reservations.confirmed ?? 0, Icon: CheckIcon },
    { label: 'Canceladas', value: data?.reservations.cancelled ?? 0, Icon: XCircle },
    { label: 'Receita (mês)', value: formatMoney(data?.reservations.revenueMonth ?? 0), Icon: Coins },
    { label: 'Animais', value: data?.content.animals ?? 0, Icon: PawPrint },
  ]

  const byDay = (data?.charts.byDay || []).map((d) => ({
    name: d.date.slice(5),
    visitantes: d.visitors,
  }))
  const topExp = (data?.charts.topExperiences || []).map((e) => ({
    name: e.name.length > 16 ? e.name.slice(0, 15) + '…' : e.name,
    value: e.count,
  }))

  return (
    <div>
      <PageHead
        title="Dashboard"
        subtitle="Visão geral do desempenho da MHM Farms."
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
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
          <h3 className="mb-4 font-display font-bold text-forest-900">Visitantes por dia (mês atual)</h3>
          {byDay.length === 0 ? (
            <p className="py-10 text-center text-sm text-forest-800/50">Sem dados este mês.</p>
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
          <h3 className="mb-4 font-display font-bold text-forest-900">Atividades mais reservadas</h3>
          {topExp.length === 0 ? (
            <p className="py-10 text-center text-sm text-forest-800/50">Sem reservas de experiências.</p>
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
        <h3 className="mb-4 font-display font-bold text-forest-900">Reservas de hoje</h3>
        {today.length === 0 ? (
          <p className="py-8 text-center text-sm text-forest-800/50">Sem reservas para hoje.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {today.map((r) => (
              <div key={r.id} className="rounded-2xl bg-forest-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-forest-700">{r.code}</span>
                  <span className="text-xs font-bold">{r.time}</span>
                </div>
                <p className="mt-1.5 font-semibold text-forest-900">{r.name}</p>
                <p className="text-xs text-forest-800/60">
                  {r.adults} adulto(s) · {r.children} criança(s) · {r.visitType}
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
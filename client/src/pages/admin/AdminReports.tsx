import { useCallback, useEffect, useState } from 'react'
import { Coins, Download, ReceiptText, Repeat, ShoppingCart, Ticket, Users, XCircle } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../../lib/api'
import { usePageMeta } from '../../lib/seo'
import { formatDateShort, formatMoney } from '../../lib/settings'
import { PageHead, Spinner, Notice } from '../../components/admin'
import type { RevenueReport } from '../../lib/types'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Concluída',
}

function defaultRange() {
  const now = new Date()
  const first = new Date(now.getFullYear(), now.getMonth(), 1)
  return { from: first.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10), status: 'todos' }
}

export default function AdminReports() {
  usePageMeta('Relatórios')
  const [filters, setFilters] = useState(defaultRange())
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
      setReport(await api<RevenueReport>(`/reports/revenue?${q}`))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar o relatório.')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    load()
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

  const stats = [
    { label: 'Receita (confirmadas)', value: formatMoney(report?.summary.revenue ?? 0), Icon: Coins },
    { label: 'A receber (pendentes)', value: formatMoney(report?.summary.pendingValue ?? 0), Icon: Repeat },
    { label: 'Receita (entradas)', value: formatMoney(report?.summary.ticketRevenue ?? 0), Icon: Ticket },
    { label: 'Entradas vendidas', value: report?.summary.ticketCount ?? 0, Icon: ShoppingCart },
    { label: 'Reservas', value: report?.summary.reservations ?? 0, Icon: ReceiptText },
    { label: 'Visitantes', value: report?.summary.visitors ?? 0, Icon: Users },
    { label: 'Canceladas', value: report?.summary.cancelled ?? 0, Icon: XCircle },
  ]

  const byDay = (report?.byDay || []).map((d) => ({
    name: d.name.slice(5),
    Receita: d.revenue,
    Reservas: d.count,
    Entradas: d.tickets || 0,
  }))
  const byService = (report?.byService || []).slice(0, 10).map((s) => ({
    name: s.name.length > 28 ? s.name.slice(0, 27) + '…' : s.name,
    Receita: s.revenue,
  }))

  return (
    <div>
      <PageHead
        title="Relatórios"
        subtitle="Movimentações de dinheiro por período."
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
        <div>
          <label className="field-label">Estado</label>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="todos">Todos</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => load()}
          disabled={loading}
          className="btn-primary !py-2.5"
        >
          {loading ? 'A filtrar…' : 'Filtrar'}
        </button>
      </div>

      {error && (
        <div className="mt-4">
          <Notice kind="error">{error}</Notice>
        </div>
      )}

      {!loading && report && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
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
              <h3 className="mb-4 font-display font-bold text-forest-900">Receita por dia</h3>
              {byDay.length === 0 ? (
                <p className="py-10 text-center text-sm text-forest-800/50">Sem movimentações no período.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={byDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef3e9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => formatMoney(Number(v))} />
                    <Bar dataKey="Receita" fill="#1f783c" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Entradas" fill="#e0a526" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-forest-100">
              <h3 className="mb-4 font-display font-bold text-forest-900">Receita por serviço</h3>
              {byService.length === 0 ? (
                <p className="py-10 text-center text-sm text-forest-800/50">Sem movimentações no período.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={byService} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef3e9" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={190} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => formatMoney(Number(v))} />
                    <Bar dataKey="Receita" fill="#e0a526" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

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
                  {report.byStatus.map((s) => (
                    <tr key={s.name} className="border-b border-forest-50">
                      <td className="py-2.5 font-semibold text-forest-900">{STATUS_LABELS[s.name] || s.name}</td>
                      <td className="py-2.5 text-right text-forest-800/70">{s.count}</td>
                      <td className="py-2.5 text-right font-bold text-forest-900">{formatMoney(s.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="lg:col-span-2 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-forest-100">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display font-bold text-forest-900">Receita por serviço</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-forest-100 text-left text-[10px] font-extrabold uppercase tracking-wider text-forest-800/50">
                    <th className="pb-2">Serviço</th>
                    <th className="pb-2 text-right">Qtd.</th>
                    <th className="pb-2 text-right">Receita (MT)</th>
                  </tr>
                </thead>
                <tbody>
                  {report.byService.map((s) => (
                    <tr key={s.name} className="border-b border-forest-50">
                      <td className="py-2.5 font-semibold text-forest-900">{s.name}</td>
                      <td className="py-2.5 text-right text-forest-800/70">{s.qty}</td>
                      <td className="py-2.5 text-right font-bold text-forest-900">{formatMoney(s.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {report.ticketByMethod.length > 0 && (
            <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-forest-100">
              <h3 className="mb-4 font-display font-bold text-forest-900">Vendas de entradas por forma de pagamento</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-forest-100 text-left text-[10px] font-extrabold uppercase tracking-wider text-forest-800/50">
                    <th className="pb-2">Forma de pagamento</th>
                    <th className="pb-2 text-right">Vendas</th>
                    <th className="pb-2 text-right">Receita (MT)</th>
                  </tr>
                </thead>
                <tbody>
                  {report.ticketByMethod.map((m) => (
                    <tr key={m.name} className="border-b border-forest-50">
                      <td className="py-2.5 font-semibold text-forest-900">{m.name}</td>
                      <td className="py-2.5 text-right text-forest-800/70">{m.count}</td>
                      <td className="py-2.5 text-right font-bold text-forest-900">{formatMoney(m.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-forest-100">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display font-bold text-forest-900">{report.reservations.length} movimentações no período</h3>
              <button onClick={exportCsv} className="btn-outline !px-4 !py-2 !text-xs">
                <Download className="h-4 w-4" /> Exportar CSV
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
                        <span className="badge bg-forest-100 text-forest-800">{STATUS_LABELS[r.status]}</span>
                      </td>
                    </tr>
                  ))}
                  {report.reservations.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-sm text-forest-800/50">
                        Nenhuma movimentação para os filtros escolhidos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {loading && <div className="mt-8"><Spinner /></div>}
    </div>
  )
}
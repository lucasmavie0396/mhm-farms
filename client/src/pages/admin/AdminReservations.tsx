import { useEffect, useMemo, useState } from 'react'
import { Banknote, CheckCircle2, Download, Eye, FileDown, Printer, Search, XCircle } from 'lucide-react'
import { api, getToken } from '../../lib/api'
import { usePageMeta } from '../../lib/seo'
import { formatDateShort, formatMoney } from '../../lib/settings'
import { STATUS_LABELS, STATUS_STYLES } from '../../components/ui'
import { ConfirmDelete, Modal, PageHead, Spinner, Table } from '../../components/admin'
import type { Reservation } from '../../lib/types'
import { PAYMENT_METHODS } from '../../lib/types'

const STATUS_OPTIONS = ['todos', 'PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']

export default function AdminReservations() {
  usePageMeta('Gerir Reservas')
  const [items, setItems] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('todos')
  const [query, setQuery] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [view, setView] = useState<Reservation | null>(null)
  const [payForm, setPayForm] = useState({ method: 'CASH', date: new Date().toISOString().slice(0, 10), amount: '' })
  const [paying, setPaying] = useState(false)

  const paidFor = (r: Reservation) => (r.payments || []).reduce((s, p) => s + p.amount, 0)
  const remainingFor = (r: Reservation) => Math.round((r.totalPrice - paidFor(r)) * 100) / 100

  const openView = (r: Reservation) => {
    setView(r)
    setPayForm((f) => ({ ...f, date: new Date().toISOString().slice(0, 10), amount: '' }))
  }

  const load = async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (status !== 'todos') qs.set('status', status)
      if (query) qs.set('q', query)
      if (from) qs.set('from', from)
      if (to) qs.set('to', to)
      setItems(await api<Reservation[]>(`/reservations/admin/all?${qs.toString()}`))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const updateStatus = async (id: string, newStatus: string) => {
    await api(`/reservations/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) })
    if (view) setView({ ...view, status: newStatus as Reservation['status'] })
    await load()
  }

  const remove = async (id: string) => {
    await api(`/reservations/${id}`, { method: 'DELETE' })
    setView(null)
    await load()
  }

  const registerPayment = async () => {
    if (!view) return
    setPaying(true)
    try {
      await api(`/reservations/${view.id}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          method: payForm.method,
          stage: 'FINAL',
          amount: payForm.amount ? Number(payForm.amount) : undefined,
          date: payForm.date || undefined,
        }),
      })
      await load()
      const fresh = items.find((r) => r.id === view.id)
      if (fresh) setView(fresh)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao registar o pagamento.')
    } finally {
      setPaying(false)
    }
  }

  const stageLabel = (stage: string) => {
    if (stage === 'SINAL') return 'Sinal (60%)'
    if (stage === 'FINAL') return 'Restante (40%)'
    return stage
  }

  const [pdfBusy, setPdfBusy] = useState<string | null>(null)

  const openPdf = async (id: string) => {
    if (pdfBusy) return
    setPdfBusy(id)
    try {
      const token = getToken()
      const res = await fetch(`/api/reservations/${id}/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erro ao gerar o PDF.')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const win = window.open(url, '_blank', 'noopener')
      if (!win) {
        const a = document.createElement('a')
        a.href = url
        a.target = '_blank'
        a.rel = 'noopener'
        a.click()
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
      if (win) win.focus()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao gerar o PDF.')
    } finally {
      setPdfBusy(null)
    }
  }

  const exportCsv = () => {
    const header = ['Código', 'Data', 'Hora', 'Adultos', 'Crianças', 'Tipo', 'Nome', 'Email', 'Telefone', 'Estado', 'Valor']
    const rows = items.map((r) =>
      [
        r.code,
        formatDateShort(r.date),
        r.time,
        r.adults,
        r.children,
        r.visitType,
        r.name,
        r.email,
        r.phone,
        STATUS_LABELS[r.status] || r.status,
        r.totalPrice,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(';')
    )
    const csv = [header.join(';'), ...rows].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reservas-mhm-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totals = useMemo(
    () => ({
      total: items.length,
      receita: items.filter((r) => r.status === 'CONFIRMED').reduce((s, r) => s + r.totalPrice, 0),
      visitantes: items.reduce((s, r) => s + r.totalVisitors, 0),
    }),
    [items]
  )

  if (loading && items.length === 0) return <Spinner />

  return (
    <div>
      <PageHead
        title="Gestão de Reservas"
        subtitle={`${totals.total} reservas · ${totals.visitantes} visitantes · Receita confirmada: ${formatMoney(totals.receita)}`}
        action={
          <button onClick={exportCsv} className="btn-outline !py-2.5">
            <Download className="h-4 w-4" /> Exportar CSV
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="relative max-w-xs">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-forest-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} placeholder="Código, nome ou email…" className="!pl-10" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="!w-48">
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s === 'todos' ? 'Todos os estados' : STATUS_LABELS[s] || s}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-xs font-bold text-forest-800">
          De <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="!w-40" />
        </label>
        <label className="flex items-center gap-2 text-xs font-bold text-forest-800">
          Até <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="!w-40" />
        </label>
        <button onClick={load} className="btn-primary !py-2.5 !px-5">Filtrar</button>
      </div>

      <Table head={['Código', 'Data', 'Visitante', 'Tipo', 'Estado', 'Valor', 'Ações']}>
        {items.map((r) => (
          <tr key={r.id} className="hover:bg-forest-50/50">
            <td className="px-4 py-3 font-mono text-xs font-bold text-forest-700">{r.code}</td>
            <td className="px-4 py-3 text-forest-800/70">
              {formatDateShort(r.date)}
              <span className="ml-1 text-xs text-forest-800/50">{r.time}</span>
            </td>
            <td className="px-4 py-3">
              <div className="font-bold text-forest-900">{r.name}</div>
              <div className="text-xs text-forest-800/50">
                {r.adults} adulto(s), {r.children} criança(s)
              </div>
            </td>
            <td className="px-4 py-3 text-forest-800/70">{r.visitType}</td>
            <td className="px-4 py-3">
              <span className={`badge ${STATUS_STYLES[r.status]}`}>{STATUS_LABELS[r.status]}</span>
            </td>
            <td className="px-4 py-3">
              <div className="font-bold text-forest-900">{formatMoney(r.totalPrice)}</div>
              <div className={`text-xs ${remainingFor(r) > 0.001 ? 'text-red-500' : 'text-emerald-600'}`}>
                {remainingFor(r) > 0.001
                  ? `Resta ${formatMoney(remainingFor(r))}`
                  : 'Liquidada'}
              </div>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-1">
                <button onClick={() => openView(r)} className="rounded-lg px-3 py-2 text-forest-700 hover:bg-forest-100" title="Ver">
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => openPdf(r.id)}
                  disabled={pdfBusy === r.id}
                  className="rounded-lg px-3 py-2 text-forest-700 hover:bg-forest-100"
                  title="Reimprimir PDF"
                >
                  {pdfBusy === r.id ? <FileDown className="h-4 w-4 animate-pulse" /> : <Printer className="h-4 w-4" />}
                </button>
                {r.status !== 'CONFIRMED' && (
                  <button
                    onClick={() => updateStatus(r.id, 'CONFIRMED')}
                    className="rounded-lg px-3 py-2 text-forest-700 hover:bg-forest-100"
                    title="Confirmar"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                )}
                {r.status !== 'CANCELLED' && (
                  <button
                    onClick={() => updateStatus(r.id, 'CANCELLED')}
                    className="rounded-lg px-3 py-2 text-red-600 hover:bg-red-50"
                    title="Cancelar"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                )}
                <ConfirmDelete onConfirm={() => remove(r.id)} />
              </div>
            </td>
          </tr>
        ))}
      </Table>

      <Modal open={!!view} onClose={() => setView(null)} title={view?.code || 'Reserva'}>
        {view && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['Data', formatDateShort(view.date)],
                ['Horário', view.time],
                ['Nome', view.name],
                ['Email', view.email],
                ['Telefone', view.phone],
                ['Tipo de visita', view.visitType],
                ['Adultos', String(view.adults)],
                ['Crianças', String(view.children)],
                ['Experiência', view.experience?.title || '—'],
                ['Valor', formatMoney(view.totalPrice)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-forest-50 p-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-forest-800/50">{k}</p>
                  <p className="mt-0.5 text-sm font-semibold text-forest-900">{v}</p>
                </div>
              ))}
            </div>
            {view.breakdown && view.breakdown.length > 0 && (
              <div className="rounded-xl bg-white p-3 ring-1 ring-forest-100">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-forest-800/50">Serviços</p>
                <div className="mt-2 space-y-1">
                  {view.breakdown.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="font-medium text-forest-900">
                        {item.service}
                        <span className="ml-1 text-xs text-forest-700/60">
                          ×{item.qty} · {formatMoney(item.unit)}
                        </span>
                      </span>
                      <span className="font-semibold text-forest-900">{formatMoney(item.total)}</span>
                    </div>
                  ))}
                  <div className="mt-2 flex items-center justify-between border-t border-forest-100 pt-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-forest-800/50">Total a pagar</span>
                    <span className="font-bold text-forest-900">{formatMoney(view.totalPrice)}</span>
                  </div>
                </div>
              </div>
            )}
            {view.notes && (
              <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                <strong>Observações:</strong> {view.notes}
              </div>
            )}
            <div className="rounded-xl bg-white p-3 ring-1 ring-forest-100">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-forest-800/50">Pagamentos</p>
                <div className="flex gap-3 text-xs font-bold">
                  <span className="text-forest-700">Pago: {formatMoney(paidFor(view))}</span>
                  <span className={remainingFor(view) > 0.001 ? 'text-red-500' : 'text-emerald-600'}>
                    Restante: {formatMoney(remainingFor(view))}
                  </span>
                </div>
              </div>
              {view.payments && view.payments.length > 0 ? (
                <div className="mt-2 space-y-1.5">
                  {view.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg bg-forest-50 px-3 py-2 text-sm">
                      <div>
                        <span className="font-bold text-forest-900">{stageLabel(p.stage)}</span>
                        <span className="ml-2 text-xs text-forest-700/60">{formatDateShort(p.paidAt)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-forest-700/70">{PAYMENT_METHODS[p.method] || p.method}</span>
                        <span className="font-semibold text-forest-900">{formatMoney(p.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-forest-700/60">Sem pagamentos registados.</p>
              )}
            </div>
            {remainingFor(view) > 0.001 && (
              <div className="rounded-xl bg-forest-50 p-3">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-forest-800/50">
                  Registar pagamento de entrada (restante)
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <div>
                    <label className="field-label">Método</label>
                    <select
                      value={payForm.method}
                      onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}
                    >
                      {Object.entries(PAYMENT_METHODS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Data</label>
                    <input
                      type="date"
                      value={payForm.date}
                      max={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setPayForm({ ...payForm, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="field-label">Valor (MT)</label>
                    <input
                      type="number"
                      value={payForm.amount}
                      placeholder={String(remainingFor(view))}
                      min={0}
                      onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                    />
                  </div>
                </div>
                <button
                  onClick={registerPayment}
                  disabled={paying}
                  className="btn-primary mt-3 !py-2.5"
                >
                  {paying ? <Spinner /> : <Banknote className="h-4 w-4" />}
                  Registar pagamento
                </button>
              </div>
            )}
            <div className="">
                  <label className="field-label">Alterar estado</label>
                  <div className="flex flex-wrap gap-2">
                    {['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStatus(view.id, s)}
                        className={`rounded-full px-4 py-2 text-xs font-bold uppercase ${
                          view.status === s ? 'bg-forest-700 text-white' : 'bg-forest-50 text-forest-700 ring-1 ring-forest-200'
                        }`}
                      >
                        {STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => openPdf(view.id)}
                  disabled={pdfBusy === view.id}
                  className="btn-outline !py-2.5"
                >
                  {pdfBusy === view.id ? <FileDown className="h-4 w-4 animate-pulse" /> : <Printer className="h-4 w-4" />}
                  Reimprimir PDF
                </button>
          </div>
        )}
      </Modal>
    </div>
  )
}

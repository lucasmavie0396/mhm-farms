import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Banknote,
  CreditCard,
  Minus,
  ReceiptText,
  Plus,
  Printer,
  ShoppingCart,
  Smartphone,
} from 'lucide-react'
import { api } from '../../lib/api'
import { usePageMeta } from '../../lib/seo'
import { useSettings } from '../../lib/settings'
import { formatDateShort, formatMoney } from '../../lib/settings'
import { PageHead, Spinner, Notice } from '../../components/admin'
import { printSaleReceipt } from '../../components/ThermalReceipt'
import type { Experience, TicketSale } from '../../lib/types'
import { PAYMENT_METHODS, type PaymentMethod } from '../../lib/types'

function money(value: number) {
  return formatMoney(value)
}

export default function AdminTicketSales() {
  usePageMeta('Venda de entradas')
  const { settings } = useSettings()
  const [qty, setQty] = useState<Record<string, number>>({})
  const [experience, setExperience] = useState<string>('')
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [customer, setCustomer] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('CASH')
  const [sales, setSales] = useState<TicketSale[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadSales = useCallback(() => {
    return api<TicketSale[]>('/ticket-sales')
      .then(setSales)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar vendas.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadSales()
    api<Experience[]>('/experiences')
      .then((list) => setExperiences(list.filter((e) => e.active)))
      .catch(() => setExperiences([]))
  }, [loadSales])

  const prices = settings.prices || []

  const lines = useMemo(() => {
    const out: { category: string; qty: number; price: number; total: number }[] = []
    for (const p of prices) {
      const q = qty[p.category] || 0
      if (q > 0) out.push({ category: p.category, qty: q, price: p.price, total: p.price * q })
    }
    const exp = experiences.find((e) => e.id === experience)
    if (exp && exp.price > 0) out.push({ category: exp.title, qty: 1, price: exp.price, total: exp.price })
    return out
  }, [prices, qty, experiences, experience])

  const visitors = useMemo(
    () => prices.reduce((s, p) => s + (qty[p.category] || 0), 0),
    [prices, qty]
  )
  const total = lines.reduce((s, l) => s + l.total, 0)
  const hasItems = lines.length > 0

  const setCatQty = (category: string, n: number) => {
    const next = { ...qty }
    if (n <= 0) delete next[category]
    else next[category] = n
    setQty(next)
  }

  const reset = () => {
    setQty({})
    setExperience('')
    setCustomer('')
    setSuccess('')
  }

  const sell = async () => {
    if (!hasItems || total <= 0) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const items = lines.map((l) => ({ category: l.category, qty: l.qty }))
      const expId = experiences.find((e) => e.id === experience) ? experience : null
      const sale = await api<TicketSale>('/ticket-sales', {
        method: 'POST',
        body: JSON.stringify({
          items,
          paymentMethod: method,
          customerName: customer.trim() || null,
          experienceId: expId,
        }),
      })
      setSales((prev) => [sale, ...prev])
      setSuccess(`Venda ${sale.code} registada. A imprimir recibo…`)
      printSaleReceipt(sale, settings)
      reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registar a venda.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div>
      <PageHead
        title="Venda de entradas"
        subtitle="Registe vendas no local e imprima recibos para a impressora térmica."
      />

      {error && (
        <div className="mb-4">
          <Notice kind="error">{error}</Notice>
        </div>
      )}
      {success && (
        <div className="mb-4">
          <Notice kind="success">{success}</Notice>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-forest-100">
            <h3 className="mb-4 font-display font-bold text-forest-900">Entradas</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {prices.map((p) => (
                <div key={p.category} className="rounded-2xl border border-forest-100 p-4">
                  <p className="text-sm font-bold text-forest-900">{p.category}</p>
                  <p className="mt-0.5 text-xs font-semibold text-gold-700">{money(p.price)}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <button
                      onClick={() => setCatQty(p.category, (qty[p.category] || 0) - 1)}
                      className="btn-outline !h-9 !w-9 !p-0"
                      aria-label="Menos"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="text-center font-mono text-lg font-bold text-forest-900">
                      {qty[p.category] || 0}
                    </span>
                    <button
                      onClick={() => setCatQty(p.category, (qty[p.category] || 0) + 1)}
                      className="btn-primary !h-9 !w-9 !p-0"
                      aria-label="Mais"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {prices.length === 0 && (
                <p className="text-sm text-forest-800/60">Sem categorias de preço configuradas em Definições.</p>
              )}
            </div>
          </div>

          {experiences.length > 0 && (
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-forest-100">
              <h3 className="mb-3 font-display font-bold text-forest-900">Experiência opcional</h3>
              <select value={experience} onChange={(e) => setExperience(e.target.value)}>
                <option value="">Sem experiência</option>
                {experiences.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title} — {money(e.price)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-forest-100">
            <h3 className="mb-4 font-display font-bold text-forest-900">Forma de pagamento</h3>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(PAYMENT_METHODS) as PaymentMethod[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                    method === m
                      ? 'border-forest-700 bg-forest-700 text-white'
                      : 'border-forest-200 bg-white text-forest-800 hover:bg-forest-50'
                  }`}
                >
                  {m === 'CASH' && <Banknote className="h-4 w-4" />}
                  {(m === 'MPESA' || m === 'EMOLA') && <Smartphone className="h-4 w-4" />}
                  {m === 'CARD' && <CreditCard className="h-4 w-4" />}
                  {m === 'OTHER' && <ReceiptText className="h-4 w-4" />}
                  {PAYMENT_METHODS[m]}
                </button>
              ))}
            </div>
            <div className="mt-4">
              <label className="field-label">Nome do cliente (opcional)</label>
              <input
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="Ex.: João da Silva"
              />
            </div>
          </div>
        </div>

        <div className="xl:col-span-1">
          <div className="sticky top-24 rounded-3xl bg-forest-950 p-6 text-white shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 font-display font-bold text-gold-400">
              <ShoppingCart className="h-5 w-5" /> Resumo da venda
            </h3>
            {lines.length === 0 ? (
              <p className="text-sm text-white/50">Adicione entradas para começar.</p>
            ) : (
              <ul className="space-y-2">
                {lines.map((l) => (
                  <li key={l.category} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-white/80">{l.category}</span>
                    <span className="text-xs text-white/60">
                      {l.qty} × {money(l.price)}
                    </span>
                    <span className="font-bold">{money(l.total)}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="my-4 border-t border-white/10" />
            <div className="flex items-center justify-between text-sm text-white/70">
              <span>Visitantes</span>
              <span className="font-bold text-white">{visitors}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-display text-lg font-bold">Total</span>
              <span className="font-display text-2xl font-bold text-gold-400">{money(total)}</span>
            </div>
            <button
              onClick={sell}
              disabled={!hasItems || saving || total <= 0}
              className="btn-primary mt-5 w-full !bg-gold-500 !py-3 !text-forest-950 hover:!bg-gold-400 disabled:!opacity-40"
            >
              <Printer className="h-5 w-5" />
              {saving ? 'A registar…' : 'Concluir venda e imprimir recibo'}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-forest-100">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display font-bold text-forest-900">Vendas recentes</h3>
          <span className="text-sm font-semibold text-forest-800/60">{sales.length} vendas</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-forest-100 text-[10px] font-extrabold uppercase tracking-wider text-forest-800/50">
                <th className="pb-2">Código</th>
                <th className="pb-2">Data</th>
                <th className="pb-2">Cliente</th>
                <th className="pb-2 text-right">Visitantes</th>
                <th className="pb-2 text-right">Total</th>
                <th className="pb-2">Pagamento</th>
                <th className="pb-2">Vendedor</th>
                <th className="pb-2 text-right">Recibo</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id} className="border-b border-forest-50 hover:bg-forest-50/50">
                  <td className="py-2.5 font-mono text-xs font-bold text-forest-700">{s.code}</td>
                  <td className="py-2.5 text-forest-800/70">{formatDateShort(s.date)}</td>
                  <td className="py-2.5 font-semibold text-forest-900">{s.customerName || '—'}</td>
                  <td className="py-2.5 text-right text-forest-800/70">{s.totalVisitors}</td>
                  <td className="py-2.5 text-right font-bold text-forest-900">{money(s.totalPrice)}</td>
                  <td className="py-2.5 text-forest-800/70">
                    <span className="badge bg-forest-100 text-forest-800">
                      {PAYMENT_METHODS[s.paymentMethod] || s.paymentMethod}
                    </span>
                  </td>
                  <td className="py-2.5 text-forest-800/70">{s.seller?.name || '—'}</td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() => printSaleReceipt(s, settings)}
                      className="btn-outline !px-3 !py-1.5 !text-xs"
                      title="Reimprimir recibo"
                    >
                      <Printer className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-forest-800/50">
                    Ainda não há vendas registadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  Info,
  Loader2,
} from 'lucide-react'
import { api } from '../lib/api'
import { usePageMeta } from '../lib/seo'
import { formatMoney } from '../lib/settings'
import { PageHero } from '../components/cards'
import type { Experience, PublicSettings } from '../lib/types'

const IMG =
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1500&q=80'

const VISIT_TYPES = [
  { key: 'Visita Livre', label: 'Visita Livre' },
  { key: 'Visita Guiada', label: 'Visita Guiada' },
  { key: 'Dia em Família', label: 'Dia em Família' },
  { key: 'Visita Escolar', label: 'Visita Escolar' },
  { key: 'Evento Especial', label: 'Evento Especial' },
  { key: 'Festa Privada', label: 'Festa Privada' },
]

const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00']

export default function Booking() {
  usePageMeta('Reservar Visita', 'Faça a sua reserva na MHM Farms.')
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const [experiences, setExperiences] = useState<Experience[]>([])
  const [prices, setPrices] = useState<PublicSettings['prices']>([])
  const [step, setStep] = useState(1)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    time: '10:00',
    adults: '2',
    children: '0',
    visitType: 'Visita Guiada',
    experienceId: '',
    name: '',
    phone: '',
    email: '',
    notes: '',
  })

  useEffect(() => {
    api<Experience[]>('/experiences', {}, false).then(setExperiences).catch(() => {})
    api<PublicSettings>('/settings/public', {}, false).then((s) => setPrices(s.prices)).catch(() => {})
  }, [])

  useEffect(() => {
    const expSlug = params.get('experiencia')
    if (expSlug && experiences.length) {
      const exp = experiences.find((e) => e.slug === expSlug || e.title.toLowerCase() === expSlug.toLowerCase())
      if (exp) setForm((f) => ({ ...f, experienceId: exp.id, visitType: 'Visita Guiada' }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experiences])

  const update =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [k]: e.target.value })

  const adults = Number(form.adults) || 0
  const children = Number(form.children) || 0

  const pricing = useMemo(() => {
    const adultPrice = prices?.find((p) => p.category.toLowerCase().includes('adult'))?.price || 0
    const childPrice = prices?.find((p) => p.category.toLowerCase().includes('crian'))?.price || 0
    let total = adultPrice * adults + childPrice * children
    if (form.visitType.toLowerCase().includes('família') || form.visitType.toLowerCase().includes('familiar')) {
      const fam = prices?.find((p) => p.category.toLowerCase().includes('famili'))?.price
      if (fam) total = fam
    }
    const exp = experiences.find((e) => e.id === form.experienceId)
    if (exp) total += exp.price
    return total
  }, [adults, children, form.experienceId, form.visitType, experiences, prices])

  const validateStep1 = () => {
    if (!form.date) return 'Escolha uma data.'
    if (new Date(form.date) < new Date(new Date().toDateString())) return 'A data deve ser hoje ou futura.'
    if (adults + children < 1) return 'Indique pelo menos um visitante.'
    return ''
  }
  const validateStep2 = () => {
    if (form.name.length < 2) return 'Indique o seu nome.'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Indique um email válido.'
    if (form.phone.length < 6) return 'Indique um telefone válido.'
    return ''
  }

  const confirm = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (step === 1) {
      const err = validateStep1()
      if (err) {
        setError(err)
        return
      }
      setStep(2)
      return
    }
    if (step === 2) {
      const err = validateStep2()
      if (err) {
        setError(err)
        return
      }
      setStep(3)
      return
    }
    setSending(true)
    try {
      const res = await api<{ code: string }>(
        '/reservations',
        {
          method: 'POST',
          body: JSON.stringify({
            date: form.date,
            time: form.time,
            adults,
            children,
            visitType: form.visitType,
            experienceId: form.experienceId || null,
            name: form.name,
            phone: form.phone,
            email: form.email,
            notes: form.notes || null,
          }),
        },
        false
      )
      navigate(`/reserva/${res.code}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar a reserva.')
    } finally {
      setSending(false)
    }
  }

  const steps = ['Detalhes', 'Dados Pessoais', 'Confirmação']

  return (
    <div>
      <PageHero
        kicker="Reservas"
        title="Reservar Visita"
        subtitle="Preencha o formulário abaixo e receba o seu número de reserva único."
        image={IMG}
      />

      <section className="py-16">
        <div className="container-page grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="rounded-3xl bg-white p-8 shadow-lg ring-1 ring-forest-100">
              {/* Stepper */}
              <ol className="mb-8 flex items-center gap-2">
                {steps.map((label, i) => {
                  const n = i + 1
                  const done = step > n
                  return (
                    <li key={label} className="flex flex-1 items-center gap-2">
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold ${
                          done ? 'bg-forest-700 text-white' : step === n ? 'bg-gold-500 text-forest-950' : 'bg-forest-100 text-forest-600'
                        }`}
                      >
                        {done ? <CheckCircle2 className="h-5 w-5" /> : n}
                      </span>
                      <span className={`text-xs font-bold uppercase tracking-wide ${step === n ? 'text-forest-900' : 'text-forest-800/50'}`}>
                        {label}
                      </span>
                    </li>
                  )
                })}
              </ol>

              <form onSubmit={confirm} noValidate>
                {error && (
                  <p className="mb-5 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                    <Info className="h-4 w-4 shrink-0" /> {error}
                  </p>
                )}

                {step === 1 && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="field-label">Data *</label>
                      <input type="date" value={form.date} min={new Date().toISOString().slice(0, 10)} onChange={update('date')} />
                    </div>
                    <div>
                      <label className="field-label">Horário *</label>
                      <select value={form.time} onChange={update('time')}>
                        {TIME_SLOTS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="field-label">Adultos *</label>
                      <input type="number" min={0} max={50} value={form.adults} onChange={update('adults')} />
                    </div>
                    <div>
                      <label className="field-label">Crianças</label>
                      <input type="number" min={0} max={50} value={form.children} onChange={update('children')} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="field-label">Tipo de Visita *</label>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {VISIT_TYPES.map((vt) => (
                          <button
                            type="button"
                            key={vt.key}
                            onClick={() => setForm({ ...form, visitType: vt.key })}
                            className={`rounded-xl border-2 px-3 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                              form.visitType === vt.key
                                ? 'border-forest-600 bg-forest-50 text-forest-800'
                                : 'border-forest-100 bg-white text-forest-800/60 hover:border-forest-300'
                            }`}
                          >
                            {vt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="field-label">Experiência (opcional)</label>
                      <select value={form.experienceId} onChange={update('experienceId')}>
                        <option value="">Sem experiência extra</option>
                        {experiences.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.title} — {formatMoney(e.price)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="field-label">Observações</label>
                      <textarea rows={3} value={form.notes} onChange={update('notes')} placeholder="Alguma necessidade especial?" />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="field-label">Nome Completo *</label>
                      <input value={form.name} onChange={update('name')} placeholder="O seu nome" />
                    </div>
                    <div>
                      <label className="field-label">Telefone *</label>
                      <input value={form.phone} onChange={update('phone')} placeholder="+258 84 000 0000" />
                    </div>
                    <div>
                      <label className="field-label">Email *</label>
                      <input type="email" value={form.email} onChange={update('email')} placeholder="email@exemplo.com" />
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="rounded-2xl bg-forest-50 p-6">
                    <h3 className="flex items-center gap-2 font-display text-lg font-bold text-forest-900">
                      <CalendarCheck className="h-5 w-5 text-forest-600" /> Resumo da Reserva
                    </h3>
                    <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                      {[
                        ['Data', new Date(form.date).toLocaleDateString('pt-PT')],
                        ['Horário', form.time],
                        ['Adultos', String(adults)],
                        ['Crianças', String(children)],
                        ['Total de visitantes', String(adults + children)],
                        ['Tipo de visita', form.visitType],
                        ['Experiência', experiences.find((e) => e.id === form.experienceId)?.title || '—'],
                        ['Nome', form.name],
                        ['Email', form.email],
                        ['Telefone', form.phone],
                      ].map(([k, v]) => (
                        <div key={k} className="rounded-xl bg-white p-3">
                          <dt className="text-[10px] font-extrabold uppercase tracking-wider text-forest-800/50">{k}</dt>
                          <dd className="mt-0.5 text-sm font-semibold text-forest-900">{v}</dd>
                        </div>
                      ))}
                    </dl>
                    <div className="mt-5 flex items-center justify-between rounded-xl bg-forest-800 p-4 text-white">
                      <span className="text-sm font-bold uppercase tracking-wide">Valor estimado</span>
                      <span className="font-display text-2xl font-bold text-gold-400">{formatMoney(pricing)}</span>
                    </div>
                    <p className="mt-3 text-xs text-forest-800/60">
                      O valor é estimado; a confirmação final é feita pelo parque. Pagamento poderá ser
                      feito no local ou via M-Pesa/e-Mola (em breve online).
                    </p>
                  </div>
                )}

                <div className="mt-8 flex items-center justify-between">
                  {step > 1 ? (
                    <button type="button" onClick={() => { setStep(step - 1); setError('') }} className="btn-outline !px-5">
                      <ChevronLeft className="h-4 w-4" /> Voltar
                    </button>
                  ) : (
                    <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-forest-700 hover:text-gold-600">
                      <ArrowLeft className="h-4 w-4" /> Cancelar
                    </Link>
                  )}
                  <button type="submit" disabled={sending} className="btn-primary !px-8">
                    {sending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {step < 3 ? (
                      <>
                        Continuar <ArrowRight className="h-4 w-4" />
                      </>
                    ) : (
                      'CONFIRMAR RESERVA'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4 lg:col-span-2">
            <div className="rounded-3xl bg-white p-6 shadow-md ring-1 ring-forest-100">
              <h3 className="font-display text-lg font-bold text-forest-900">Porquê reservar online?</h3>
              <ul className="mt-3 space-y-2 text-sm text-forest-800/70">
                <li>✓ Garante a sua vaga na data desejada</li>
                <li>✓ Recebe um código único de reserva</li>
                <li>✓ Evita filas na entrada</li>
                <li>✓ Acesso prioritário às atividades</li>
              </ul>
            </div>
            <div className="rounded-3xl bg-forest-800 p-6 text-white shadow-md">
              <h3 className="font-display text-lg font-bold">Ingressos</h3>
              <ul className="mt-3 space-y-1.5 text-sm">
                {(prices || []).slice(0, 4).map((p) => (
                  <li key={p.category} className="flex justify-between">
                    <span className="text-white/75">{p.category}</span>
                    <span className="font-bold">{p.price} MT</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border-2 border-dashed border-forest-200 p-6 text-sm text-forest-800/70">
              <p className="font-semibold text-forest-900">Precisa de ajuda a reservar?</p>
              <p className="mt-1">
                Ligue-nos para{' '}
                <a href="tel:+258849999999" className="font-bold text-forest-700">+258 84 999 9999</a> ou
                envie-nos uma mensagem na página de contactos.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}
import { useState } from 'react'
import { BookOpen, CheckCircle2, GraduationCap, Info } from 'lucide-react'
import { api } from '../lib/api'
import { usePageMeta } from '../lib/seo'
import { PageHero } from '../components/cards'

const IMG =
  'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1500&q=80'

const FOCUS = [
  'Visitas guiadas com guias especializados',
  'Educação ambiental em contexto real',
  'Conhecimento das espécies e habitats',
  'Conservação da natureza e sustentabilidade',
  'Atividades práticas por faixa etária',
  'Materiais pedagógicos de apoio',
]

const LEVELS = [
  { title: 'Pré-escolar (3–5 anos)', text: 'Contacto sensorial, brincadeiras educativas e conhecimento dos animais de quinta.' },
  { title: 'Ensino Primário (6–11 anos)', text: 'Fichas de observação, jogos de descoberta e introdução à conservação.' },
  { title: 'Ensino Secundário (12–17 anos)', text: 'Biologia aprofundada, ecossistemas e projetos de investigação.' },
  { title: 'Ensino Superior & Técnico', text: 'Parcerias académicas, estágios e estudos de caso de gestão animal.' },
]

export default function SchoolVisits() {
  usePageMeta('Programa Educativo', 'Visitas escolares e programa educativo da MHM Farms.')
  const [form, setForm] = useState({
    schoolName: '',
    teacherName: '',
    email: '',
    phone: '',
    numStudents: '',
    numTeachers: '',
    schoolLevel: '',
    preferredDate: '',
    message: '',
  })
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.schoolName || !form.teacherName || !form.email || !form.phone || !form.numStudents) {
      setError('Preencha os campos obrigatórios.')
      return
    }
    setSending(true)
    try {
      await api(
        '/school-visits',
        {
          method: 'POST',
          body: JSON.stringify({
            ...form,
            numStudents: Number(form.numStudents) || 0,
            numTeachers: Number(form.numTeachers) || 0,
            preferredDate: form.preferredDate || null,
          }),
        },
        false
      )
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao submeter o pedido.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <PageHero
        kicker="Para escolas e instituições"
        title="Programa Educativo MHM Farms"
        subtitle="Aprender com a natureza é inesquecível. Conheça os nossos programas."
        image={IMG}
      />

      <section className="py-16">
        <div className="container-page grid gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.25em] text-gold-600">
              Educação ambiental
            </p>
            <h2 className="font-display text-3xl font-bold text-forest-900">
              Uma sala de aula ao ar livre
            </h2>
            <p className="mt-4 leading-relaxed text-forest-800/75">
              Criámos um programa educativo que transforma cada visita numa aula viva: os alunos
              interagem com a natureza, tocam nos animais de quinta, observam espécies e aprendem a
              importância da conservação — sempre supervisionados pela nossa equipa.
            </p>

            <div className="mt-8 grid gap-3">
              {FOCUS.map((f, i) => (
                <div key={f} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-forest-100">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-forest-700 font-display font-bold text-gold-500">
                    {i + 1}
                  </span>
                  <span className="text-sm font-semibold text-forest-900">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.25em] text-gold-600">
              Programas por idade
            </p>
            <h2 className="font-display text-3xl font-bold text-forest-900">
              Adaptado a cada nível de ensino
            </h2>
            <div className="mt-6 space-y-4">
              {LEVELS.map((l) => (
                <div key={l.title} className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-forest-100">
                  <GraduationCap className="mt-0.5 h-7 w-7 shrink-0 text-gold-600" />
                  <div>
                    <h3 className="font-bold text-forest-900">{l.title}</h3>
                    <p className="mt-1 text-sm text-forest-800/70">{l.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-forest-100/60 py-16">
        <div className="container-page max-w-3xl">
          <div className="rounded-3xl bg-white p-8 shadow-lg ring-1 ring-forest-100 sm:p-10">
            <BookOpen className="h-10 w-10 text-forest-700" />
            <h2 className="mt-3 font-display text-2xl font-bold text-forest-900">
              Solicitar Visita Escolar
            </h2>
            {sent ? (
              <div className="flex flex-col items-center py-10 text-center">
                <CheckCircle2 className="h-14 w-14 text-forest-600" />
                <h3 className="mt-4 font-display text-xl font-bold text-forest-900">Pedido enviado!</h3>
                <p className="mt-2 text-forest-800/70">
                  A nossa equipa educativa entrará em contacto para confirmar a visita.
                </p>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="mt-6">
                {error && (
                  <p className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                    <Info className="h-4 w-4 shrink-0" /> {error}
                  </p>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="field-label">Nome da Escola *</label>
                    <input value={form.schoolName} onChange={update('schoolName')} placeholder="Escola Secundária…" />
                  </div>
                  <div>
                    <label className="field-label">Nome do Professor Responsável *</label>
                    <input value={form.teacherName} onChange={update('teacherName')} placeholder="Nome completo" />
                  </div>
                  <div>
                    <label className="field-label">Nível de Ensino</label>
                    <select value={form.schoolLevel} onChange={update('schoolLevel')}>
                      <option value="">Selecione…</option>
                      {LEVELS.map((l) => (
                        <option key={l.title} value={l.title}>{l.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Email *</label>
                    <input type="email" value={form.email} onChange={update('email')} placeholder="escola@exemplo.com" />
                  </div>
                  <div>
                    <label className="field-label">Telefone *</label>
                    <input value={form.phone} onChange={update('phone')} placeholder="+258 84 000 0000" />
                  </div>
                  <div>
                    <label className="field-label">Nº de Alunos *</label>
                    <input type="number" min={1} value={form.numStudents} onChange={update('numStudents')} placeholder="30" />
                  </div>
                  <div>
                    <label className="field-label">Nº de Professores</label>
                    <input type="number" min={0} value={form.numTeachers} onChange={update('numTeachers')} placeholder="3" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="field-label">Data Preferida</label>
                    <input type="date" value={form.preferredDate} onChange={update('preferredDate')} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="field-label">Observações</label>
                    <textarea rows={4} value={form.message} onChange={update('message')} placeholder="Objetivos da visita, necessidades especiais…" />
                  </div>
                </div>
                <button type="submit" disabled={sending} className="btn-primary mt-6 w-full sm:w-auto !px-9">
                  {sending ? 'A enviar…' : 'SOLICITAR VISITA ESCOLAR'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
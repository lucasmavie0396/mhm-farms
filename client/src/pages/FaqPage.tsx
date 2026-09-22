import { useEffect, useState } from 'react'
import { HelpCircle, Minus, Plus } from 'lucide-react'
import { api } from '../lib/api'
import { usePageMeta } from '../lib/seo'
import { PageHero } from '../components/cards'
import { Loading } from '../components/ui'
import type { Faq } from '../lib/types'

const IMG =
  'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=1400&q=80'

export default function FaqPage() {
  usePageMeta('Perguntas Frequentes', 'Perguntas frequentes sobre a MHM Farms.')
  const [faqs, setFaqs] = useState<Faq[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState<string | null>(null)

  useEffect(() => {
    api<Faq[]>('/faqs', {}, false)
      .then(setFaqs)
      .finally(() => setLoading(false))
  }, [])

  const grouped = faqs.reduce<Record<string, Faq[]>>((acc, f) => {
    acc[f.category] = acc[f.category] || []
    acc[f.category].push(f)
    return acc
  }, {})

  return (
    <div>
      <PageHero
        kicker="Ajuda"
        title="Perguntas Frequentes"
        subtitle="As respostas às perguntas mais comuns antes da sua visita."
        image={IMG}
      />

      <section className="py-16">
        <div className="container-page max-w-4xl">
          {loading ? (
            <Loading />
          ) : Object.keys(grouped).length === 0 ? (
            <p className="py-16 text-center text-forest-800/60">Sem perguntas disponíveis.</p>
          ) : (
            <div className="space-y-8">
              {Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                  <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold capitalize text-forest-900">
                    <HelpCircle className="h-5 w-5 text-gold-600" /> {category}
                  </h2>
                  <div className="space-y-3">
                    {items.map((f) => {
                      const isOpen = open === f.id
                      return (
                        <div key={f.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-forest-100">
                          <button
                            className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left font-semibold text-forest-900"
                            onClick={() => setOpen(isOpen ? null : f.id)}
                            aria-expanded={isOpen}
                          >
                            {f.question}
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-forest-100 text-forest-700">
                              {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                            </span>
                          </button>
                          {isOpen && (
                            <p className="border-t border-forest-50 px-6 py-4 text-sm leading-relaxed text-forest-800/75">
                              {f.answer}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
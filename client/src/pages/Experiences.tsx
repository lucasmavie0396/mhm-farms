import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Clock, Eye, Users } from 'lucide-react'
import { api } from '../lib/api'
import { usePageMeta } from '../lib/seo'
import { formatMoney } from '../lib/settings'
import { PageHero } from '../components/cards'
import { EmptyState, Loading } from '../components/ui'
import type { Experience } from '../lib/types'

const IMG =
  'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=1400&q=80'

const TYPES = [
  { key: 'todos', label: 'Todas' },
  { key: 'VISITA', label: 'Visitas' },
  { key: 'ALIMENTACAO', label: 'Alimentação' },
  { key: 'PASSEIO', label: 'Passeios' },
  { key: 'EDUCACAO', label: 'Educação' },
  { key: 'FAMILIA', label: 'Família' },
  { key: 'EVENTO', label: 'Eventos' },
  { key: 'AVENTURA', label: 'Aventura' },
]

export default function Experiences() {
  usePageMeta('Experiências', 'Atividades e experiências na MHM Farms.')
  const [params] = useSearchParams()
  const [type, setType] = useState('todos')
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [loading, setLoading] = useState(true)
  const reservarSlug = params.get('reservar')

  useEffect(() => {
    setLoading(true)
    api<Experience[]>(`/experiences${type !== 'todos' ? `?type=${type}` : ''}`, {}, false)
      .then(setExperiences)
      .finally(() => setLoading(false))
  }, [type])

  if (reservarSlug) {
    return (
      <div className="py-24 text-center">
        <div className="font-display text-2xl font-bold text-forest-900">
          Reserve a experiência {reservarSlug}
        </div>
        <p className="mt-2 text-forest-800/70">Continue no formulário de reserva.</p>
        <Link to={`/reservar?experiencia=${encodeURIComponent(reservarSlug)}`} className="btn-primary mt-6">
          Ir para a reserva
        </Link>
      </div>
    )
  }

  return (
    <div>
      <PageHero
        kicker="Aventura e descoberta"
        title="Experiências MHM Farms"
        subtitle="Atividades supervisionadas, educativas e inesquecíveis para toda a família."
        image={IMG}
      />

      <section className="py-16">
        <div className="container-page">
          <div className="mb-10 flex flex-wrap gap-2">
            {TYPES.map((ty) => (
              <button
                key={ty.key}
                onClick={() => setType(ty.key)}
                className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                  type === ty.key
                    ? 'bg-forest-700 text-white shadow'
                    : 'bg-white text-forest-800 ring-1 ring-forest-200 hover:bg-forest-100'
                }`}
              >
                {ty.label}
              </button>
            ))}
          </div>

          {loading ? (
            <Loading />
          ) : experiences.length === 0 ? (
            <EmptyState message="Sem experiências disponíveis nesta categoria." />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {experiences.map((e) => (
                <div
                  key={e.id}
                  className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-md ring-1 ring-forest-100 transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative h-52 overflow-hidden">
                    <img src={e.image} alt={e.title} loading="lazy" className="h-full w-full object-cover" />
                    {!e.availability && (
                      <span className="badge absolute right-3 top-3 bg-red-600 text-white">
                        Esgotada
                      </span>
                    )}
                    {e.featured && (
                      <span className="badge absolute left-3 top-3 bg-gold-500 text-forest-950">
                        Destaque
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h2 className="font-display text-xl font-bold text-forest-900">{e.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-forest-800/70">
                      {e.description || e.shortDesc}
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-forest-800/70">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-gold-600" /> {e.duration}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5 text-gold-600" /> {e.minAge}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-gold-600" /> Todos
                      </span>
                      <span className="font-bold text-forest-900">{formatMoney(e.price)}</span>
                    </div>
                    <div className="mt-5 flex-1" />
                    <Link
                      to={`/reservar?experiencia=${encodeURIComponent(e.slug)}`}
                      className="btn-primary w-full"
                      aria-disabled={!e.availability}
                    >
                      Reservar Experiência
                    </Link>
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
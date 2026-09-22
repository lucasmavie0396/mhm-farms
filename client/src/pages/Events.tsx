import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CalendarDays, MapPin } from 'lucide-react'
import { api } from '../lib/api'
import { usePageMeta } from '../lib/seo'
import { formatDate, formatMoney } from '../lib/settings'
import { PageHero } from '../components/cards'
import { EmptyState, Loading } from '../components/ui'
import type { Event } from '../lib/types'

const IMG =
  'https://images.unsplash.com/photo-1511576661532-b7a1ed73f278?auto=format&fit=crop&w=1400&q=80'

export default function Events() {
  usePageMeta('Eventos', 'Eventos e atividades especiais na MHM Farms.')
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [params] = useSearchParams()
  const reservarSlug = params.get('reservar')

  useEffect(() => {
    api<Event[]>('/events', {}, false).then((data) => {
      setEvents(data)
      setLoading(false)
    })
  }, [])

  if (reservarSlug) {
    return (
      <div className="py-24 text-center">
        <div className="font-display text-2xl font-bold text-forest-900">Evento: {reservarSlug}</div>
        <p className="mt-2 text-forest-800/70">Reserve o seu lugar preenchendo o formulário.</p>
        <Link to={`/reservar?evento=${encodeURIComponent(reservarSlug)}`} className="btn-primary mt-6">
          Ir para a reserva
        </Link>
      </div>
    )
  }

  const [upcoming, past] = [
    events.filter((e) => new Date(e.date) >= new Date()),
    events.filter((e) => new Date(e.date) < new Date()),
  ]

  return (
    <div>
      <PageHero
        kicker="Agenda"
        title="Eventos na MHM Farms"
        subtitle="Dias especiais, workshops e celebrações para toda a família."
        image={IMG}
      />

      <section className="py-16">
        <div className="container-page">
          {loading ? (
            <Loading />
          ) : (
            <>
              <h2 className="mb-6 flex items-center gap-2 font-display text-2xl font-bold text-forest-900">
                <CalendarDays className="h-6 w-6 text-gold-600" /> Próximos Eventos
              </h2>
              {upcoming.length === 0 ? (
                <EmptyState message="Sem eventos agendados. Volte mais tarde!" />
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {upcoming.map((ev) => (
                    <article
                      key={ev.id}
                      className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-md ring-1 ring-forest-100"
                    >
                      <div className="relative h-52 overflow-hidden">
                        <img src={ev.image} alt={ev.title} loading="lazy" className="h-full w-full object-cover" />
                        <span className="badge absolute left-3 top-3 bg-forest-900/80 text-gold-400 backdrop-blur">
                          {formatDate(ev.date)}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col p-6">
                        <h3 className="font-display text-xl font-bold text-forest-900">{ev.title}</h3>
                        <div className="mt-3 space-y-1.5 text-sm text-forest-800/70">
                          <p className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-gold-600" /> {formatDate(ev.date)} · {ev.time}
                          </p>
                          <p className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gold-600" /> {ev.location}
                          </p>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-forest-800/70">{ev.description}</p>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-lg font-extrabold text-forest-800">
                            {ev.price > 0 ? formatMoney(ev.price) : 'Entrada Livre'}
                          </span>
                          {ev.maxParticipants && (
                            <span className="text-xs font-semibold text-forest-800/50">
                              Máx. {ev.maxParticipants} participantes
                            </span>
                          )}
                        </div>
                        <Link to="/reservar" className="btn-primary mt-4 w-full">
                          Reservar Lugar
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {past.length > 0 && (
                <>
                  <h2 className="mb-6 mt-16 flex items-center gap-2 font-display text-2xl font-bold text-forest-900">
                    <CalendarDays className="h-6 w-6 text-forest-500" /> Eventos Recentes
                  </h2>
                  <div className="grid gap-6 md:grid-cols-3">
                    {past.map((ev) => (
                      <article
                        key={ev.id}
                        className="overflow-hidden rounded-3xl bg-white opacity-75 shadow-md ring-1 ring-forest-100"
                      >
                        <div className="relative h-40 overflow-hidden">
                          <img src={ev.image} alt={ev.title} loading="lazy" className="h-full w-full object-cover" />
                        </div>
                        <div className="p-5">
                          <h3 className="font-display font-bold text-forest-900">{ev.title}</h3>
                          <p className="mt-1 text-xs text-forest-800/60">
                            {formatDate(ev.date)} · {ev.location}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}
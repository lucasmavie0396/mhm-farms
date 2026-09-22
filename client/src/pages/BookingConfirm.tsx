import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BadgeCheck, CalendarDays, Clock, Hash, Mail, Phone, Users } from 'lucide-react'
import { api } from '../lib/api'
import { usePageMeta } from '../lib/seo'
import { formatDate, formatMoney } from '../lib/settings'
import { Loading, STATUS_LABELS, STATUS_STYLES } from '../components/ui'
import type { Reservation } from '../lib/types'

export default function BookingConfirm() {
  const { code } = useParams()
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(true)

  usePageMeta('Reserva Confirmada', 'Detalhes da sua reserva.')

  useEffect(() => {
    if (!code) return
    api<Reservation>(`/reservations/lookup?code=${encodeURIComponent(code)}`, {}, false)
      .then(setReservation)
      .catch(() => setReservation(null))
      .finally(() => setLoading(false))
  }, [code])

  if (loading) return <Loading />
  if (!reservation) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="font-display text-3xl font-bold text-forest-900">Reserva não encontrada</h1>
        <p className="mt-2 text-forest-800/70">Verifique o código da reserva e tente novamente.</p>
        <Link to="/reservar" className="btn-primary mt-6">Fazer nova reserva</Link>
      </div>
    )
  }

  return (
    <div className="py-16">
      <div className="container-page max-w-3xl">
        <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-forest-100">
          <div className="bg-gradient-to-br from-forest-700 to-forest-900 p-8 text-center text-white">
            <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gold-500 text-forest-950">
              <BadgeCheck className="h-10 w-10" />
            </span>
            <h1 className="mt-5 font-display text-2xl font-bold sm:text-3xl">Reserva Confirmada!</h1>
            <p className="mt-2 text-white/80">
              Obrigado {reservation.name}. Guarde o seu número de reserva.
            </p>
            <p className="mt-4 inline-block rounded-2xl bg-white/10 px-6 py-3 font-mono text-2xl font-bold tracking-widest text-gold-400">
              {reservation.code}
            </p>
          </div>

          <div className="p-8">
            <h2 className="mb-4 font-display text-lg font-bold text-forest-900">Resumo da Reserva</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { Icon: CalendarDays, label: 'Data', value: formatDate(reservation.date) },
                { Icon: Clock, label: 'Horário', value: reservation.time },
                { Icon: Users, label: 'Visitantes', value: `${reservation.adults} adulto(s), ${reservation.children} criança(s)` },
                { Icon: Hash, label: 'Tipo de Visita', value: reservation.visitType },
                { Icon: Phone, label: 'Contacto', value: `${reservation.phone}` },
                { Icon: Mail, label: 'Email', value: reservation.email },
              ].map(({ Icon, label, value }) => (
                <div key={label} className="rounded-2xl bg-forest-50 p-4">
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-forest-800/50">
                    <Icon className="h-4 w-4 text-forest-600" /> {label}
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-forest-900">{value}</p>
                </div>
              ))}
              {reservation.experience && (
                <div className="rounded-2xl bg-forest-50 p-4">
                  <div className="text-xs font-extrabold uppercase tracking-wide text-forest-800/50">
                    Experiência
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-forest-900">{reservation.experience.title}</p>
                </div>
              )}
              <div className="rounded-2xl bg-forest-800 p-4 text-white">
                <div className="text-xs font-extrabold uppercase tracking-wide text-white/60">
                  Valor estimado
                </div>
                <p className="mt-1.5 text-lg font-bold text-gold-400">{formatMoney(reservation.totalPrice)}</p>
              </div>
              <div className="rounded-2xl bg-forest-50 p-4">
                <div className="text-xs font-extrabold uppercase tracking-wide text-forest-800/50">
                  Estado
                </div>
                <p className={`mt-1.5 badge ${STATUS_STYLES[reservation.status]}`}>
                  {STATUS_LABELS[reservation.status] || reservation.status}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/" className="btn-outline">Voltar ao início</Link>
              <Link to="/horarios" className="btn-primary">Ver horários</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
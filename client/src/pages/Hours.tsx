import { Link } from 'react-router-dom'
import { AlertTriangle, Clock } from 'lucide-react'
import { usePageMeta } from '../lib/seo'
import { useSettings } from '../lib/settings'
import { PageHero } from '../components/cards'
import { Reveal } from '../components/ui'

const IMG =
  'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1400&q=80'

export default function Hours() {
  usePageMeta('Horário de Funcionamento', 'Horário da MHM Farms.')
  const { settings } = useSettings()
  const hours = settings.hours || []

  return (
    <div>
      <PageHero
        kicker="Planeie a visita"
        title="Horário de Funcionamento"
        subtitle="Encontramo-nos à sua espera de terça a domingo."
        image={IMG}
      />

      <section className="py-16">
        <div className="container-page grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-forest-100">
              {hours.length > 0 ? (
                <table className="w-full text-left">
                  <thead className="bg-forest-800 text-white">
                    <tr>
                      <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider">Dia</th>
                      <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider">Horário</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-forest-50">
                    {hours.map((h) => (
                      <tr key={h.day} className="hover:bg-forest-50/50">
                        <td className="px-6 py-4 font-semibold text-forest-900">{h.day}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`font-bold ${
                              h.open.toLowerCase().includes('fechado') ? 'text-red-600' : 'text-forest-800'
                            }`}
                          >
                            {h.open}
                          </span>
                          {h.note && <span className="ml-2 text-xs text-forest-800/50">({h.note})</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="p-8 text-center text-forest-800/60">Horários em atualização.</p>
              )}
            </div>
            {settings.hoursNotice && (
              <div className="mt-5 flex items-start gap-3 rounded-2xl bg-amber-100 p-4 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <p>{settings.hoursNotice}</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="sticky top-28 space-y-4">
              <Reveal>
                <div className="rounded-3xl bg-white p-7 shadow-md ring-1 ring-forest-100">
                  <Clock className="h-8 w-8 text-gold-600" />
                  <h3 className="mt-3 font-display text-lg font-bold text-forest-900">Dica</h3>
                  <p className="mt-2 text-sm leading-relaxed text-forest-800/70">
                    Os melhores horários para visitar são entre as 09:00 e as 14:00, quando os
                    animais estão mais ativos e há menos movimento.
                  </p>
                </div>
              </Reveal>
              <div className="rounded-3xl bg-forest-800 p-7 text-white shadow-md">
                <h3 className="font-display text-lg font-bold">Pronto para visitar?</h3>
                <p className="mt-2 text-sm text-white/75">Não se esqueça de reservar a sua visita.</p>
                <Link to="/reservar" className="btn-gold mt-4 w-full">Reservar agora</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
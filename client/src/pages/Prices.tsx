import { Link } from 'react-router-dom'
import { Check, Info, Ticket } from 'lucide-react'
import { usePageMeta } from '../lib/seo'
import { useSettings } from '../lib/settings'
import { PageHero } from '../components/cards'
import { Reveal } from '../components/ui'

const IMG =
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1400&q=80'

const INCLUDED = [
  'Visita aos recintos dos animais',
  'Áreas de piquenique gratuitas',
  'Parque infantil',
  'Estacionamento gratuito',
  'Acompanhamento de guias nas atividades',
]

export default function Prices() {
  usePageMeta('Ingressos e Preços', 'Preços de entrada e ingressos da MHM Farms.')
  const { settings } = useSettings()
  const prices = settings.prices || []

  return (
    <div>
      <PageHero
        kicker="Ingressos"
        title="Ingressos e Preços"
        subtitle="Preços acessíveis para viver dias inesquecíveis em família."
        image={IMG}
      />

      <section className="py-16">
        <div className="container-page">
          <div className="grid gap-10 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <div className="overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-forest-100">
                <table className="w-full text-left">
                  <thead className="bg-forest-800 text-white">
                    <tr>
                      <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider">Categoria</th>
                      <th className="px-6 py-4 text-right text-xs font-extrabold uppercase tracking-wider">Preço</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-forest-50">
                    {prices.map((p) => (
                      <tr key={p.category} className="hover:bg-forest-50/50">
                        <td className="px-6 py-4 font-semibold text-forest-900">{p.category}</td>
                        <td className="px-6 py-4 text-right font-display text-xl font-bold text-forest-800">
                          {p.price} <span className="text-sm">MT</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 flex items-center gap-2 text-xs text-forest-800/60">
                <Info className="h-4 w-4 text-gold-600" />
                Os preços podem ser atualizados pela administração. Consulte sempre esta página.
              </p>

              <Reveal>
                <div className="mt-8 rounded-3xl bg-forest-100 p-6">
                  <h3 className="flex items-center gap-2 font-display text-lg font-bold text-forest-900">
                    <Check className="h-5 w-5 text-forest-600" /> Incluído na entrada
                  </h3>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {INCLUDED.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-forest-800/75">
                        <Check className="h-4 w-4 shrink-0 text-gold-600" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>

            <div className="lg:col-span-2">
              <div className="sticky top-28 rounded-3xl bg-gradient-to-br from-forest-800 to-forest-900 p-8 text-white shadow-xl">
                <Ticket className="h-10 w-10 text-gold-500" />
                <h3 className="mt-3 font-display text-2xl font-bold">Reserve o seu ingresso</h3>
                <p className="mt-2 text-sm text-white/75">
                  Garanta a sua vaga com antecedência e planeie a sua visita.
                </p>
                <div className="mt-6 space-y-3 text-sm">
                  <p className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-white/70">Crianças até 3 anos</span>
                    <span className="font-bold">Gratuito</span>
                  </p>
                  <p className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-white/70">Reservas de grupos +20</span>
                    <span className="font-bold">Desconto 10%</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-white/70">Pacote família</span>
                    <span className="font-bold">Melhor valor</span>
                  </p>
                </div>
                <div className="mt-7 flex flex-col gap-3">
                  <Link to="/reservar" className="btn-gold w-full">Comprar / Reservar Ingresso</Link>
                  <Link to="/visitas-escolares" className="btn-white w-full">Visitas escolares</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
import { usePageMeta } from '../lib/seo'
import { useSettings } from '../lib/settings'
import { PageHero } from '../components/cards'
import { Reveal, SectionTitle } from '../components/ui'
import { HeartHandshake, Leaf, Rocket, Target } from 'lucide-react'

const IMG =
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80'

export default function About() {
  usePageMeta('Conheça a MHM Farms', 'História, missão e valores da MHM Farms.')
  const { settings } = useSettings()
  const about = settings.about

  return (
    <div>
      <PageHero
        kicker="Sobre nós"
        title="Conheça a MHM Farms"
        subtitle="História, missão, valores e a importância da conservação animal."
        image={IMG}
      />

      <section className="py-20">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div className="grid grid-cols-2 gap-4">
              <img src={IMG} alt="Propriedade" className="h-64 w-full rounded-3xl object-cover shadow-lg" loading="lazy" />
              <img
                src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80"
                alt="Natureza"
                className="mt-8 h-64 w-full rounded-3xl object-cover shadow-lg"
                loading="lazy"
              />
            </div>
          </Reveal>
          <Reveal>
            <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.25em] text-gold-600">
              A nossa história
            </p>
            <h2 className="font-display text-3xl font-bold text-forest-900 sm:text-4xl">
              Como surgiu a MHM Farms
            </h2>
            <p className="mt-5 leading-relaxed text-forest-800/75">
              {about?.intro ||
                'A MHM Farms nasceu do sonho de criar um espaço onde a natureza, os animais e as pessoas se encontram. O que começou como uma pequena quinta familiar transformou-se num destino de turismo, educação e conservação.'}
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-forest-100/60 py-20">
        <div className="container-page">
          <SectionTitle kicker="Propósito" title="Missão, Visão e Valores" />
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { Icon: Target, title: 'Missão', text: about?.mission || 'Proporcionar experiências memoráveis de contacto com a natureza, promovendo a educação ambiental e a conservação das espécies.' },
              { Icon: Rocket, title: 'Visão', text: about?.vision || 'Ser referência nacional em turismo de natureza, bem-estar animal e educação ambiental.' },
              { Icon: HeartHandshake, title: 'Valores', text: about?.values || 'Conservação · Respeito pelos animais · Educação · Família · Sustentabilidade · Comunidade.' },
            ].map(({ Icon, title, text }) => (
              <Reveal key={title}>
                <div className="h-full rounded-3xl bg-white p-8 text-center shadow-md ring-1 ring-forest-100">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-forest-700 text-gold-500">
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="mt-4 font-display text-xl font-bold text-forest-900">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-forest-800/70">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container-page grid items-start gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.25em] text-gold-600">
              Compromisso
            </p>
            <h2 className="font-display text-3xl font-bold text-forest-900">
              Conservação e Educação Ambiental
            </h2>
            <div className="mt-6 space-y-5 text-forest-800/75">
              {[
                ['Conservação animal', 'Trabalhamos diariamente para garantir o bem-estar de cada espécie, com recintos amplos, alimentação equilibrada e cuidados veterinários.' ],
                ['Educação ambiental', 'Acreditamos que conhecer é respeitar. Os nossos programas educativos aproximam as crianças da natureza e do património natural.' ],
                ['Experiência dos visitantes', 'Cada visita é desenhada para criar memórias, ligação emocional e vontade de proteger o mundo natural.' ],
              ].map(([title, text], i) => (
                <div key={title} className="flex gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold-500 font-display font-bold text-forest-950">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-bold text-forest-900">{title}</h3>
                    <p className="mt-1 text-sm">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Reveal>
            <img
              src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80"
              alt="Paisagem natural"
              className="rounded-3xl object-cover shadow-xl"
              loading="lazy"
            />
          </Reveal>
        </div>
      </section>

      <section className="bg-forest-900 py-16">
        <div className="container-page flex flex-col items-center gap-6 text-center">
          <Leaf className="h-10 w-10 text-gold-500" />
          <h2 className="max-w-2xl font-display text-2xl font-bold text-white sm:text-3xl">
            “Onde a Natureza Ganha Vida — venha fazer parte desta história.”
          </h2>
        </div>
      </section>
    </div>
  )
}
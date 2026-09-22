import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Apple,
  Calendar,
  Clock,
  HeartPulse,
  Home,
  Lightbulb,
  Sparkles,
  Users,
} from 'lucide-react'
import { api } from '../lib/api'
import { usePageMeta } from '../lib/seo'
import { CATEGORY_LABELS } from '../lib/settings'
import { Loading } from '../components/ui'
import { Lightbox, type LightboxItem } from '../components/Lightbox'
import type { Animal } from '../lib/types'

export default function AnimalDetail() {
  const { slug } = useParams()
  const [animal, setAnimal] = useState<Animal | null>(null)
  const [loading, setLoading] = useState(true)
  const [lb, setLb] = useState<{ items: LightboxItem[]; index: number } | null>(null)

  usePageMeta(animal ? `${animal.name} — ${animal.species}` : 'Animal', animal?.description)

  useEffect(() => {
    setLoading(true)
    api<Animal>(`/animals/${slug}`, {}, false)
      .then(setAnimal)
      .catch(() => setAnimal(null))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return <Loading />
  if (!animal) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="font-display text-3xl font-bold text-forest-900">Animal não encontrado</h1>
        <Link to="/animais" className="btn-primary mt-6">
          <ArrowLeft className="h-4 w-4" /> Ver todos os animais
        </Link>
      </div>
    )
  }

  const photos: LightboxItem[] = animal.images.map((i) => ({
    url: i.url,
    title: i.alt || animal.name,
  }))

  const facts = [
    { Icon: HeartPulse, label: 'Família', value: animal.family || '—' },
    { Icon: Home, label: 'Habitat', value: animal.habitat || '—' },
    { Icon: Apple, label: 'Alimentação', value: animal.diet || '—' },
    { Icon: Clock, label: 'Expectativa de vida', value: animal.lifeExpectancy || '—' },
    { Icon: Users, label: 'Comportamento', value: animal.behavior || '—' },
    { Icon: Sparkles, label: 'Categoria', value: CATEGORY_LABELS[animal.category] || animal.category },
  ]

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-forest-900">
        <img
          src={animal.mainImage}
          alt={animal.name}
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-950/90 via-forest-900/40 to-transparent" />
        <div className="container-page relative z-10 py-28">
          <nav className="mb-4 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide text-white/70">
            <Link to="/" className="hover:text-gold-400">Início</Link>
            <span>/</span>
            <Link to="/animais" className="hover:text-gold-400">Animais</Link>
            <span>/</span>
            <span className="text-gold-400">{animal.name}</span>
          </nav>
          <h1 className="font-display text-5xl font-extrabold text-white sm:text-6xl">
            {animal.name}
          </h1>
          <p className="mt-2 text-xl font-semibold text-gold-400">{animal.species}</p>
          <Link to="/reservar" className="btn-gold mt-7">
            Visitar este animal
          </Link>
        </div>
      </section>

      {/* Conteúdo */}
      <section className="py-16">
        <div className="container-page grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.25em] text-gold-600">
              Sobre
            </p>
            <h2 className="font-display text-2xl font-bold text-forest-900">Quem é {animal.name}</h2>
            <p className="mt-4 leading-relaxed text-forest-800/75">{animal.description}</p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {facts.map(({ Icon, label, value }) => (
                <div key={label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-forest-100">
                  <div className="flex items-center gap-2 text-forest-700">
                    <Icon className="h-4 w-4 text-gold-600" />
                    <span className="text-xs font-extrabold uppercase tracking-wide">{label}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-forest-900">{value}</p>
                </div>
              ))}
            </div>

            {(animal.curiosity || animal.funFact) && (
              <div className="mt-8 rounded-3xl bg-gold-500/15 p-6 ring-1 ring-gold-500/40">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-gold-600" />
                  <h3 className="font-display text-lg font-bold text-forest-900">Você Sabia?</h3>
                </div>
                <p className="mt-2 leading-relaxed text-forest-900/80">
                  {animal.funFact || animal.curiosity}
                </p>
              </div>
            )}
          </div>

          {/* Galeria + QR */}
          <aside className="lg:col-span-2">
            <h3 className="mb-3 text-xs font-extrabold uppercase tracking-[0.25em] text-gold-600">
              Galeria
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {photos.slice(0, 4).map((p, i) => (
                <button
                  key={p.url}
                  onClick={() => setLb({ items: photos, index: i })}
                  className="group relative overflow-hidden rounded-2xl"
                >
                  <img
                    src={p.url}
                    alt={animal.name}
                    loading="lazy"
                    className="h-36 w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-3xl bg-forest-900 p-6 text-center text-white">
              <Calendar className="mx-auto h-8 w-8 text-gold-500" />
              <h4 className="mt-2 font-display text-lg font-bold">Visite {animal.name}</h4>
              <p className="mt-1 text-sm text-white/70">
                Reserve uma experiência de <strong>{animal.name}</strong>.
              </p>
              <Link to={`/experiencias`} className="btn-gold mt-4 w-full">
                Ver experiências
              </Link>
            </div>

            <div className="mt-4 rounded-3xl border-2 border-dashed border-forest-200 p-5 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-forest-800/60">
                QR Code do animal
              </p>
              <p className="mt-1 text-xs text-forest-800/50">
                Escaneie o QR Code junto ao recinto para ver esta página no telemóvel.
              </p>
            </div>
          </aside>
        </div>
      </section>

      {lb && (
        <Lightbox items={lb.items} index={lb.index} onClose={() => setLb(null)} onNavigate={(i) => setLb((p) => (p ? { ...p, index: i } : p))} />
      )}
    </div>
  )
}
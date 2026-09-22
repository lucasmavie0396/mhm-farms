import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PawPrint, Search } from 'lucide-react'
import { api } from '../lib/api'
import { usePageMeta } from '../lib/seo'
import { AnimalCard, PageHero } from '../components/cards'
import { EmptyState, Loading } from '../components/ui'
import type { Animal } from '../lib/types'

const IMG =
  'https://images.unsplash.com/photo-1547721064-da6cfb341d50?auto=format&fit=crop&w=1400&q=80'

const CATEGORIES = [
  { key: 'todos', label: 'Todos' },
  { key: 'MAMIFERO', label: 'Mamíferos' },
  { key: 'AVE', label: 'Aves' },
  { key: 'REPTIL', label: 'Répteis' },
  { key: 'DOMESTICO', label: 'Animais Domésticos' },
]

export default function Animals() {
  usePageMeta('Animais', 'Conheça todos os animais da MHM Farms.')
  const [params] = useSearchParams()
  const initialCat = ['MAMIFERO', 'AVE', 'REPTIL', 'DOMESTICO'].includes(params.get('categoria') || '')
    ? (params.get('categoria') as string)
    : 'todos'
  const initialQ = params.get('q') || ''
  const [category, setCategory] = useState(initialCat)
  const [query, setQuery] = useState(initialQ)
  const [animals, setAnimals] = useState<Animal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api<Animal[]>(
      `/animals${category !== 'todos' ? `?category=${category}` : ''}`,
      {},
      false
    )
      .then((data) => {
        const filtered = query
          ? data.filter(
              (a) =>
                a.name.toLowerCase().includes(query.toLowerCase()) ||
                a.species.toLowerCase().includes(query.toLowerCase()) ||
                (a.description || '').toLowerCase().includes(query.toLowerCase())
            )
          : data
        setAnimals(filtered)
      })
      .finally(() => setLoading(false))
  }, [category, query])

  return (
    <div>
      <PageHero
        kicker="Os nossos habitantes"
        title="Conheça os Nossos Animais"
        subtitle="De zebras a tartarugas-gigantes: explore o mundo animal da MHM Farms."
        image={IMG}
      />

      <section className="py-16">
        <div className="container-page">
          {/* Filtros */}
          <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                    category === c.key
                      ? 'bg-forest-700 text-white shadow'
                      : 'bg-white text-forest-800 ring-1 ring-forest-200 hover:bg-forest-100'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="relative lg:w-72">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-forest-400" />
              <input
                type="search"
                placeholder="Pesquisar animal…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="!pl-10"
                aria-label="Pesquisar animal"
              />
            </div>
          </div>

          {loading ? (
            <Loading />
          ) : animals.length === 0 ? (
            <EmptyState message="Nenhum animal encontrado com os filtros atuais." />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {animals.map((a) => (
                <AnimalCard key={a.id} animal={a} />
              ))}
            </div>
          )}

          <div className="mt-12 rounded-3xl bg-forest-100 p-8 text-center">
            <PawPrint className="mx-auto h-8 w-8 text-forest-600" />
            <p className="mt-2 font-display text-lg font-bold text-forest-900">
              Sabia que pode visitar os animais de perto?
            </p>
            <p className="mt-1 text-sm text-forest-800/70">
              Reserve uma visita guiada ou uma experiência de alimentação supervisionada.
            </p>
            <a href="/reservar" className="btn-primary mt-4">
              Reservar visita
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
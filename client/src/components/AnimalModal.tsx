import { useEffect, useState } from 'react'
import { Apple, ChevronLeft, ChevronRight, Clock, HeartPulse, Home, Lightbulb, Sparkles, Users, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Animal } from '../lib/types'

const CATEGORY_LABELS: Record<string, string> = {
  MAMIFERO: 'Mamíferos',
  AVE: 'Aves',
  REPTIL: 'Répteis',
  DOMESTICO: 'Animais Domésticos',
  OUTRO: 'Outros',
}

const INFO = [
  { key: 'family', label: 'Família', Icon: Users },
  { key: 'habitat', label: 'Habitat', Icon: Home },
  { key: 'diet', label: 'Alimentação', Icon: Apple },
  { key: 'lifeExpectancy', label: 'Expectativa de vida', Icon: Clock },
  { key: 'behavior', label: 'Comportamento', Icon: HeartPulse },
] as const

export function AnimalModal({
  animals,
  index,
  onClose,
  onNavigate,
}: {
  animals: Animal[]
  index: number
  onClose: () => void
  onNavigate?: (next: number) => void
}) {
  const [idx, setIdx] = useState(index)
  const [image, setImage] = useState('')

  useEffect(() => setIdx(index), [index])

  const animal = animals[idx]

  useEffect(() => setImage(''), [idx])
  useEffect(() => setImage(animal?.mainImage || ''), [animal])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, animals.length])

  const go = (dir: number) => {
    const next = (idx + dir + animals.length) % animals.length
    setIdx(next)
    onNavigate?.(next)
  }

  if (!animal) return null
  const photos = [animal.mainImage, ...animal.images.map((i) => i.url)].filter(
    (u, i, arr) => u && arr.indexOf(u) === i
  )

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-forest-950/90 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-60 shrink-0 bg-forest-100 sm:h-72">
          {image ? (
            <img src={image} alt={animal.name} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-forest-400">
              <Sparkles className="h-10 w-10" />
            </div>
          )}
          <div className="absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-forest-950/70 to-transparent p-4">
            <span className="badge bg-forest-900/80 text-gold-400">{animal.species}</span>
            {animal.featured && <span className="badge bg-gold-500 text-forest-950">Destaque</span>}
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-forest-950/85 to-transparent p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-gold-400">
              {CATEGORY_LABELS[animal.category] || animal.category}
            </p>
            <h3 className="font-display text-2xl font-bold text-white">{animal.name}</h3>
          </div>
        </div>

        <button
          className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-forest-900 shadow hover:bg-white"
          onClick={onClose}
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>
        {animals.length > 1 && (
          <>
            <button
              className="absolute left-3 top-28 z-10 rounded-full bg-white/90 p-2 text-forest-900 shadow hover:bg-white sm:top-32"
              onClick={go.bind(null, -1)}
              aria-label="Anterior"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              className="absolute right-14 top-28 z-10 rounded-full bg-white/90 p-2 text-forest-900 shadow hover:bg-white sm:top-32"
              onClick={go.bind(null, 1)}
              aria-label="Seguinte"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        <div className="overflow-y-auto p-6">
          {animal.description && <p className="leading-relaxed text-forest-800/75">{animal.description}</p>}

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {INFO.map(({ key, label, Icon }) =>
              animal[key] ? (
                <div key={key} className="rounded-2xl bg-forest-50 p-3">
                  <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-forest-800/50">
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-forest-900">{animal[key]}</p>
                </div>
              ) : null
            )}
          </div>

          {(animal.curiosity || animal.funFact) && (
            <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
              <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-700/70">
                <Lightbulb className="h-3.5 w-3.5" /> Sabia que…
              </p>
              <p className="mt-1">{animal.funFact || animal.curiosity}</p>
            </div>
          )}

          {photos.length > 1 && (
            <div className="mt-5">
              <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-forest-800/50">Galeria</p>
              <div className="flex flex-wrap gap-2">
                {photos.map((u, i) => (
                  <button
                    key={`${animal.id}-${i}`}
                    type="button"
                    onClick={() => setImage(u)}
                    className={`h-16 w-16 overflow-hidden rounded-xl ring-2 transition ${
                      image === u ? 'ring-gold-500' : 'ring-transparent hover:ring-forest-200'
                    }`}
                    aria-label={`Foto ${i + 1}`}
                  >
                    <img src={u} alt={`${animal.name} ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-forest-100 pt-4">
            <Link
              to={`/animais/${animal.slug}`}
              onClick={onClose}
              className="btn-primary !py-2.5"
            >
              Ver página completa
            </Link>
            <span className="text-xs font-bold text-forest-800/50">
              {idx + 1} / {animals.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
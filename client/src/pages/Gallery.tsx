import { useEffect, useMemo, useState } from 'react'
import { Image as ImageIcon, PlayCircle } from 'lucide-react'
import { api } from '../lib/api'
import { usePageMeta } from '../lib/seo'
import { PageHero } from '../components/cards'
import { Loading } from '../components/ui'
import { Lightbox, type LightboxItem } from '../components/Lightbox'
import type { GalleryItem } from '../lib/types'

const IMG =
  'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=1600&q=80'

const CATEGORIES = ['todos', 'animais', 'natureza', 'visitantes', 'criancas', 'eventos', 'instalacoes', 'atividades']

export default function Gallery() {
  usePageMeta('Galeria', 'Fotografias e vídeos da MHM Farms.')
  const [items, setItems] = useState<GalleryItem[]>([])
  const [category, setCategory] = useState('todos')
  const [loading, setLoading] = useState(true)
  const [lb, setLb] = useState<{ items: LightboxItem[]; index: number } | null>(null)

  useEffect(() => {
    api<GalleryItem[]>('/gallery', {}, false)
      .then(setItems)
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(
    () => (category === 'todos' ? items : items.filter((i) => i.category === category)),
    [items, category]
  )

  const lightboxItems: LightboxItem[] = filtered.map((i) => ({
    url: i.url,
    title: i.title,
    type: i.type,
    videoUrl: i.videoUrl,
  }))

  return (
    <div>
      <PageHero
        kicker="Memórias"
        title="Galeria MHM Farms"
        subtitle="Fotografias e vídeos dos animais, da natureza e de quem nos visita."
        image={IMG}
      />

      <section className="py-16">
        <div className="container-page">
          <div className="mb-10 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                  category === c
                    ? 'bg-forest-700 text-white shadow'
                    : 'bg-white text-forest-800 ring-1 ring-forest-200 hover:bg-forest-100'
                }`}
              >
                {c === 'todos' ? 'Todas' : c}
                <span className="ml-1 opacity-60">
                  ({c === 'todos' ? items.length : items.filter((i) => i.category === c).length})
                </span>
              </button>
            ))}
          </div>

          {loading ? (
            <Loading />
          ) : filtered.length === 0 ? (
            <p className="py-20 text-center text-forest-800/60">Sem itens nesta categoria.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((item, i) => (
                <button
                  key={item.id}
                  onClick={() => setLb({ items: lightboxItems, index: i })}
                  className="group relative col-span-1 aspect-square overflow-hidden rounded-2xl"
                  aria-label={item.title || 'Abrir imagem'}
                >
                  <img
                    src={item.url}
                    alt={item.title || ''}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {item.type === 'VIDEO' && (
                    <span className="absolute inset-0 grid place-items-center">
                      <PlayCircle className="h-12 w-12 text-white drop-shadow-lg" />
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-forest-950/80 to-transparent p-3 text-left">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <ImageIcon className="h-3.5 w-3.5" /> {item.title || item.category}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {lb && (
        <Lightbox
          items={lb.items}
          index={lb.index}
          onClose={() => setLb(null)}
          onNavigate={(i) => setLb((p) => (p ? { ...p, index: i } : p))}
        />
      )}
    </div>
  )
}
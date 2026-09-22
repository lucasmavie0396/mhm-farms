import { useEffect, useState } from 'react'
import { Newspaper } from 'lucide-react'
import { api } from '../lib/api'
import { usePageMeta } from '../lib/seo'
import { NewsCard, PageHero } from '../components/cards'
import { Loading } from '../components/ui'
import type { News as NewsItem } from '../lib/types'

const IMG =
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1400&q=80'

export default function News() {
  usePageMeta('Notícias', 'Novidades da MHM Farms.')
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<NewsItem[]>('/news', {}, false)
      .then(setNews)
      .finally(() => setLoading(false))
  }, [])

  const [featured, ...rest] = news

  return (
    <div>
      <PageHero
        kicker="Novidades"
        title="Novidades da MHM Farms"
        subtitle="Nascimentos, novos animais, eventos e projetos de conservação."
        image={IMG}
      />

      <section className="py-16">
        <div className="container-page">
          <div className="flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-gold-600" />
            <h2 className="font-display text-2xl font-bold text-forest-900">Últimas publicações</h2>
          </div>
          {loading ? (
            <Loading />
          ) : news.length === 0 ? (
            <p className="py-16 text-center text-forest-800/60">Sem notícias publicadas.</p>
          ) : (
            <>
              {featured && (
                <div className="mt-6 overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-forest-100">
                  <a href={`/noticias/${featured.slug}`} className="grid lg:grid-cols-2">
                    {featured.image && (
                      <img src={featured.image} alt={featured.title} className="h-72 w-full object-cover lg:h-full" loading="lazy" />
                    )}
                    <div className="flex flex-col justify-center p-8">
                      <span className="badge w-fit bg-gold-500 text-forest-950">Destaque</span>
                      <h3 className="mt-4 font-display text-2xl font-bold text-forest-900 sm:text-3xl">
                        {featured.title}
                      </h3>
                      <p className="mt-3 line-clamp-3 text-forest-800/70">{featured.content}</p>
                      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-forest-800/50">
                        {new Date(featured.date).toLocaleDateString('pt-PT')} · {featured.author}
                      </p>
                    </div>
                  </a>
                </div>
              )}
              <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {rest.map((n) => (
                  <NewsCard key={n.id} news={n} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
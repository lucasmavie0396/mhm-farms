import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, User } from 'lucide-react'
import { api } from '../lib/api'
import { usePageMeta } from '../lib/seo'
import { formatDate } from '../lib/settings'
import { Loading } from '../components/ui'
import type { News as NewsItem } from '../lib/types'

export default function NewsDetail() {
  const { slug } = useParams()
  const [news, setNews] = useState<NewsItem | null>(null)
  const [loading, setLoading] = useState(true)

  usePageMeta(news?.title, news?.content?.slice(0, 160))

  useEffect(() => {
    api<NewsItem>(`/news/${slug}`, {}, false)
      .then(setNews)
      .catch(() => setNews(null))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return <Loading />
  if (!news) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="font-display text-3xl font-bold text-forest-900">Notícia não encontrada</h1>
        <Link to="/noticias" className="btn-primary mt-6">Ver todas as notícias</Link>
      </div>
    )
  }

  return (
    <article>
      <section className="relative overflow-hidden bg-forest-900">
        {news.image && (
          <>
            <img src={news.image} alt={news.title} className="absolute inset-0 h-full w-full object-cover opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-t from-forest-950/90 via-forest-900/40 to-transparent" />
          </>
        )}
        <div className="container-page relative z-10 py-28">
          <span className="badge bg-gold-500 text-forest-950">{news.category}</span>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            {news.title}
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-white/75">
            <span className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-gold-500" /> {formatDate(news.date)}
            </span>
            <span className="flex items-center gap-2">
              <User className="h-4 w-4 text-gold-500" /> {news.author}
            </span>
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="container-page max-w-3xl">
          <Link to="/noticias" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-forest-700 hover:text-gold-600">
            <ArrowLeft className="h-4 w-4" /> Voltar às notícias
          </Link>
          {news.image && (
            <img src={news.image} alt={news.title} className="mb-10 w-full rounded-3xl object-cover shadow-lg" loading="lazy" />
          )}
          <div className="prose-slate space-y-4 whitespace-pre-line text-forest-900/85">
            {news.content}
          </div>
        </div>
      </section>
    </article>
  )
}
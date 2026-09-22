import { ArrowRight, Clock, Eye, Heart, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatDateShort, formatMoney } from '../lib/settings'
import type { Animal, Event, Experience, News } from '../lib/types'

export function AnimalCard({ animal }: { animal: Animal }) {
  return (
    <Link
      to={`/animais/${animal.slug}`}
      className="group overflow-hidden rounded-3xl bg-white shadow-md shadow-forest-900/10 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-forest-900/20"
    >
      <div className="relative h-56 overflow-hidden">
        <img
          src={animal.mainImage}
          alt={animal.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <span className="badge absolute left-3 top-3 bg-forest-900/80 text-gold-400 backdrop-blur">
          {animal.species}
        </span>
        {animal.featured && (
          <span className="badge absolute right-3 top-3 bg-gold-500 text-forest-950">Destaque</span>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-display text-xl font-bold text-forest-900 group-hover:text-forest-700">
          {animal.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-forest-800/70">{animal.description}</p>
        <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-forest-700 group-hover:text-gold-600">
          Ver Mais <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  )
}

export function ExperienceCard({ experience }: { experience: Experience }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-md shadow-forest-900/10 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-forest-900/20">
      <div className="relative h-52 overflow-hidden">
        <img
          src={experience.image}
          alt={experience.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <span className="badge absolute left-3 top-3 bg-forest-900/80 text-gold-400 backdrop-blur">
          {experience.type}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-bold text-forest-900">{experience.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-forest-800/70">{experience.shortDesc}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-forest-800/60">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {experience.duration}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" /> {experience.minAge}
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-forest-100 pt-4">
          <span className="text-lg font-extrabold text-forest-800">
            {formatMoney(experience.price)}
          </span>
          <Link
            to={`/experiencias?reservar=${experience.slug}`}
            className="btn-primary !px-4 !py-2 !text-xs"
          >
            Reservar
          </Link>
        </div>
      </div>
    </div>
  )
}

export function EventCard({ event }: { event: Event }) {
  const d = new Date(event.date)
  return (
    <div className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-md shadow-forest-900/10 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-forest-900/20">
      <div className="relative h-52 overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute left-3 top-3 flex flex-col items-center rounded-2xl bg-white/95 px-3 py-1.5 text-center shadow">
          <span className="font-display text-xl font-bold leading-none text-forest-800">
            {d.getDate()}
          </span>
          <span className="text-[10px] font-extrabold uppercase text-gold-600">
            {d.toLocaleDateString('pt-PT', { month: 'short' })}
          </span>
        </div>
        {event.price > 0 && (
          <span className="badge absolute right-3 top-3 bg-gold-500 text-forest-950">
            {formatMoney(event.price)}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-bold text-forest-900">{event.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-forest-800/70">{event.description}</p>
        <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-forest-800/60">
          <MapPin className="h-3.5 w-3.5 text-gold-600" />
          {event.location} · {event.time}
        </div>
        <div className="mt-4 flex-1" />
        <Link to={`/eventos?reservar=${event.slug}`} className="btn-primary w-full !py-2.5 !text-xs">
          Reservar Lugar
        </Link>
      </div>
    </div>
  )
}

export function NewsCard({ news }: { news: News }) {
  return (
    <Link
      to={`/noticias/${news.slug}`}
      className="group overflow-hidden rounded-3xl bg-white shadow-md shadow-forest-900/10 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
    >
      <div className="relative h-48 overflow-hidden">
        {news.image ? (
          <img
            src={news.image}
            alt={news.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="h-full w-full bg-forest-100" />
        )}
        <span className="badge absolute left-3 top-3 bg-forest-900/80 text-gold-400 backdrop-blur">
          {news.category}
        </span>
      </div>
      <div className="p-5">
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-forest-800/50">
          <Heart className="h-3 w-3 text-gold-500" />
          {formatDateShort(news.date)} · {news.author}
        </p>
        <h3 className="mt-2 font-display text-lg font-bold leading-snug text-forest-900 group-hover:text-forest-700">
          {news.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-forest-800/70">{news.content}</p>
      </div>
    </Link>
  )
}

export function PageHero({
  kicker,
  title,
  subtitle,
  image,
}: {
  kicker: string
  title: string
  subtitle?: string
  image?: string
}) {
  return (
    <section className="relative overflow-hidden bg-forest-900">
      {image && (
        <>
          <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-forest-950/60 via-forest-900/50 to-forest-950/80" />
        </>
      )}
      <div className="container-page relative z-10 py-24 text-center">
        <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.3em] text-gold-500">{kicker}</p>
        <h1 className="font-display text-4xl font-bold text-white sm:text-5xl">{title}</h1>
        {subtitle && (
          <p className="mx-auto mt-4 max-w-2xl text-white/80">{subtitle}</p>
        )}
      </div>
    </section>
  )
}
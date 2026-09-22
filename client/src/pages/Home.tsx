import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarDays,
  Clock,
  Compass,
  GraduationCap,
  Leaf,
  MapPin,
  PawPrint,
  Phone,
  Ticket,
  Users,
} from 'lucide-react'
import { api } from '../lib/api'
import { useI18n } from '../lib/i18n'
import { usePageMeta } from '../lib/seo'
import { useSettings } from '../lib/settings'
import { AnimalCard, EventCard, ExperienceCard, NewsCard } from '../components/cards'
import { Loading, Reveal, SectionTitle, Stars } from '../components/ui'
import type { Animal, Event, Experience, Feedback, GalleryItem, News } from '../lib/types'

const IMG_WIDE =
  'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=1920&q=80'

export default function Home() {
  const { t } = useI18n()
  const { settings } = useSettings()
  const [animals, setAnimals] = useState<Animal[]>([])
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [news, setNews] = useState<News[]>([])
  const [gallery, setGallery] = useState<GalleryItem[]>([])
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)

  usePageMeta(undefined, settings.seo?.description)

  useEffect(() => {
    Promise.all([
      api<Animal[]>('/animals?featured=true', {}, false).catch(() => []),
      api<Experience[]>('/experiences', {}, false).catch(() => []),
      api<Event[]>('/events?upcoming=true', {}, false).catch(() => []),
      api<News[]>('/news?limit=3', {}, false).catch(() => []),
      api<GalleryItem[]>('/gallery', {}, false).catch(() => []),
      api<Feedback[]>('/feedback', {}, false).catch(() => []),
    ]).then(([a, e, ev, n, g, f]) => {
      setAnimals(a)
      setExperiences(e)
      setEvents(ev)
      setNews(n)
      setGallery(g)
      setFeedback(f)
      setLoading(false)
    })
  }, [])

  if (loading) return <Loading />

  const hero = settings.home
  const about = settings.about
  const contact = settings.contacts

  return (
    <div>
      {/* ===== HERO ===== */}
      <section className="relative flex min-h-[86vh] items-center overflow-hidden">
        <img
          src={IMG_WIDE}
          alt="Animais da MHM Farms"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-950/85 via-forest-950/60 to-forest-900/20" />
        <div className="container-page relative z-10 py-24">
          <div className="max-w-2xl animate-fade-up">
            <span className="badge mb-5 bg-gold-500 text-forest-950">
              <Leaf className="mr-1 h-3.5 w-3.5" /> Quinta · Zoológico · Educação
            </span>
            <h1 className="font-display text-5xl font-extrabold leading-tight text-white sm:text-6xl lg:text-7xl">
              {hero?.heroTitle || 'MHM Farms'}
            </h1>
            <p className="mt-3 font-display text-2xl font-semibold text-gold-400 sm:text-3xl">
              {hero?.heroSubtitle || 'Onde a Natureza Ganha Vida'}
            </p>
            <p className="mt-5 max-w-xl text-lg text-white/85">
              {hero?.heroText ||
                'Descubra uma experiência única de contacto com animais, natureza e aventura.'}
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link to="/sobre" className="btn-primary !px-8 !py-4 !text-base">
                {t('hero_visit')} <ArrowRight className="h-5 w-5" />
              </Link>
              <Link to="/reservar" className="btn-gold !px-8 !py-4 !text-base">
                <Ticket className="h-5 w-5" /> {t('hero_book')}
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 hidden bg-forest-950/40 py-3 backdrop-blur md:block">
          <div className="container-page flex flex-wrap items-center justify-between gap-4 text-sm text-white/90">
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gold-500" />
              {settings.hours?.[1]?.open
                ? `Ter–Dom: ${settings.hours[1].open}`
                : 'Ter–Dom: 08:00 – 17:00'}
            </span>
            {settings.prices?.[0] && (
              <span className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-gold-500" />
                Entrada: {settings.prices[0].category} — {settings.prices[0].price} MT
              </span>
            )}
            <span className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-gold-500" />
              {contact ? `${contact.city}, ${contact.province}` : 'Boane, Maputo'}
            </span>
          </div>
        </div>
      </section>

      {/* ===== SOBRE ===== */}
      <section className="py-20">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=80"
                alt="Instalações da MHM Farms"
                className="rounded-3xl shadow-2xl shadow-forest-900/20"
                loading="lazy"
              />
              <div className="absolute -bottom-6 -right-4 hidden rounded-3xl bg-forest-700 p-5 text-white shadow-xl sm:block">
                <p className="font-display text-4xl font-bold text-gold-500">{animals.length}+</p>
                <p className="text-xs font-bold uppercase tracking-wider">Espécies amigas</p>
              </div>
            </div>
          </Reveal>
          <Reveal>
            <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.25em] text-gold-600">
              Sobre nós
            </p>
            <h2 className="font-display text-3xl font-bold text-forest-900 sm:text-4xl">
              Conheça a MHM Farms
            </h2>
            <p className="mt-5 leading-relaxed text-forest-800/75">
              {about?.intro ||
                'A MHM Farms é uma quinta de visitação e espaço de conservação animal em Moçambique. Descubra animais, natureza, atividades educativas e um ambiente familiar.'}
            </p>
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {[
                { Icon: PawPrint, title: 'Conservação', text: 'Especies bem tratadas num ambiente natural.' },
                { Icon: GraduationCap, title: 'Educação', text: 'Programas educativos para todas as idades.' },
                { Icon: Users, title: 'Família', text: 'Experiências pensadas para grandes e pequenos.' },
                { Icon: Leaf, title: 'Natureza', text: 'Espaços verdes que inspiram respeito.' },
              ].map(({ Icon, title, text }) => (
                <div key={title} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-forest-100">
                  <Icon className="h-6 w-6 text-gold-600" />
                  <p className="mt-2 font-bold text-forest-900">{title}</p>
                  <p className="text-sm text-forest-800/65">{text}</p>
                </div>
              ))}
            </div>
            <Link to="/sobre" className="btn-outline mt-8">
              Conhecer a nossa história <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ===== ANIMAIS EM DESTAQUE ===== */}
      <section className="bg-forest-100/60 py-20">
        <div className="container-page">
          <SectionTitle
            kicker="Nossos habitantes"
            title="Conheça os Nossos Animais"
            subtitle="Cada residente do MHM Farms tem uma história. Venha conhecê-los de perto."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {animals.slice(0, 4).map((a) => (
              <AnimalCard key={a.id} animal={a} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/animais" className="btn-primary">
              Ver todos os animais <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== EXPERIÊNCIAS ===== */}
      <section className="py-20">
        <div className="container-page">
          <SectionTitle
            kicker="Aventura em família"
            title="Experiências MHM Farms"
            subtitle="Atividades supervisionadas, educativas e memoráveis para toda a família."
          />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {experiences.slice(0, 6).map((e) => (
              <ExperienceCard key={e.id} experience={e} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== PROGRAMA EDUCATIVO ===== */}
      <section className="relative overflow-hidden py-20">
        <img
          src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1920&q=80"
          alt="Crianças em visita escolar"
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-forest-950/75" />
        <div className="container-page relative z-10 text-center">
          <Reveal>
            <GraduationCap className="mx-auto h-12 w-12 text-gold-500" />
            <h2 className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl">
              Programa Educativo MHM Farms
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/85">
              Visitas guiadas para escolas, educação ambiental, conhecimento das espécies e
              conservação da natureza com atividades práticas para cada idade.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link to="/visitas-escolares" className="btn-gold !px-8">
                Solicitar Visita Escolar
              </Link>
              <Link to="/animais" className="btn-white">
                Explorar os animais
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== GALERIA ===== */}
      {gallery.length > 0 && (
        <section className="py-20">
          <div className="container-page">
            <SectionTitle kicker="Galeria" title="Siga as Aventuras da MHM Farms" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {gallery.slice(0, 8).map((g, i) => (
                <Link
                  to="/galeria"
                  key={g.id}
                  className={`group relative overflow-hidden rounded-2xl ${
                    i === 0 ? 'row-span-2 col-span-2' : ''
                  }`}
                >
                  <img
                    src={g.url}
                    alt={g.title || ''}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-forest-950/70 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="text-sm font-bold text-white">{g.title}</span>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link to="/galeria" className="btn-outline">
                Ver galeria completa
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ===== EVENTOS ===== */}
      {events.length > 0 && (
        <section className="bg-forest-100/60 py-20">
          <div className="container-page">
            <SectionTitle
              kicker="Agenda"
              title="Próximos Eventos"
              subtitle="Dias especiais, workshops e celebrações para toda a família."
            />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.slice(0, 3).map((ev) => (
                <EventCard key={ev.id} event={ev} />
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link to="/eventos" className="btn-primary">
                <CalendarDays className="h-4 w-4" /> Ver todos os eventos
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ===== INFORMAÇÕES DE VISITA ===== */}
      <section className="py-20">
        <div className="container-page">
          <SectionTitle
            kicker="Planeie a sua visita"
            title="Informações de Visita"
            subtitle="Tudo o que precisa de saber antes de visitar a MHM Farms."
          />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl bg-white p-7 shadow-md ring-1 ring-forest-100">
              <Clock className="h-8 w-8 text-gold-600" />
              <h3 className="mt-3 font-display text-lg font-bold text-forest-900">Horários</h3>
              <ul className="mt-3 space-y-1.5 text-sm text-forest-800/70">
                {(settings.hours || []).slice(0, 4).map((h) => (
                  <li key={h.day} className="flex justify-between">
                    <span>{h.day}</span>
                    <span className="font-semibold">{h.open}</span>
                  </li>
                ))}
              </ul>
              <Link to="/horarios" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-forest-700 hover:text-gold-600">
                Ver horário completo <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="rounded-3xl bg-white p-7 shadow-md ring-1 ring-forest-100">
              <Ticket className="h-8 w-8 text-gold-600" />
              <h3 className="mt-3 font-display text-lg font-bold text-forest-900">Ingressos</h3>
              <ul className="mt-3 space-y-1.5 text-sm text-forest-800/70">
                {(settings.prices || []).slice(0, 4).map((p) => (
                  <li key={p.category} className="flex justify-between">
                    <span>{p.category}</span>
                    <span className="font-semibold">{p.price} MT</span>
                  </li>
                ))}
              </ul>
              <Link to="/precos" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-forest-700 hover:text-gold-600">
                Ver todos os preços <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="rounded-3xl bg-white p-7 shadow-md ring-1 ring-forest-100">
              <MapPin className="h-8 w-8 text-gold-600" />
              <h3 className="mt-3 font-display text-lg font-bold text-forest-900">Localização</h3>
              <p className="mt-3 text-sm text-forest-800/70">
                {contact
                  ? `${contact.address}, ${contact.city}, ${contact.province}, ${contact.country}`
                  : 'Estrada Nacional 1, KM 24, Boane, Maputo'}
              </p>
              <a
                href={settings.maps?.gmapsUrl || 'https://www.google.com/maps?q=MHM+Farms+Boane'}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-forest-700 hover:text-gold-600"
              >
                Abrir no Google Maps <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===== AVALIAÇÕES ===== */}
      {feedback.length > 0 && (
        <section className="bg-forest-900 py-20">
          <div className="container-page">
            <SectionTitle
              kicker="Quem nos visita"
              title="Avaliações dos Visitantes"
            />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {feedback.map((f) => (
                <Reveal key={f.id}>
                  <figure className="flex h-full flex-col rounded-3xl bg-forest-800 p-6 text-white shadow-lg">
                    <Stars rating={f.rating} className="mb-3" />
                    <blockquote className="flex-1 text-sm leading-relaxed text-white/85">
                      “{f.comment}”
                    </blockquote>
                    <figcaption className="mt-4 text-sm font-bold text-gold-400">{f.name}</figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== NOTÍCIAS ===== */}
      {news.length > 0 && (
        <section className="py-20">
          <div className="container-page">
            <SectionTitle kicker="Novidades" title="Novidades da MHM Farms" />
            <div className="grid gap-6 md:grid-cols-3">
              {news.map((n) => (
                <NewsCard key={n.id} news={n} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== CTAs FINAIS ===== */}
      <section className="py-20">
        <div className="container-page">
          <div className="rounded-[2.5rem] bg-gradient-to-br from-forest-800 to-forest-900 p-10 text-center shadow-2xl sm:p-14">
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
              Pronto para viver a natureza?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-white/80">
              Reserve a sua visita hoje e crie memórias inesquecíveis com a sua família.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link to="/reservar" className="btn-gold !px-9 !py-4 !text-base">
                <Ticket className="h-5 w-5" /> Fazer Reserva
              </Link>
              {contact?.phone && (
                <a href={`tel:${contact.phone}`} className="btn-white !px-9 !py-4 !text-base">
                  <Phone className="h-5 w-5" /> {contact.phone}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
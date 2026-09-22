import { useEffect, useState } from 'react'
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
} from 'react-router-dom'
import {
  CalendarCheck,
  ChevronDown,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Menu,
  Music2,
  Phone,
  X,
  Youtube,
} from 'lucide-react'
import { useI18n } from '../lib/i18n'
import { useSettings } from '../lib/settings'

export const SOCIALS = [
  { key: 'facebook', label: 'Facebook', Icon: Facebook },
  { key: 'instagram', label: 'Instagram', Icon: Instagram },
  { key: 'tiktok', label: 'TikTok', Icon: Music2 },
  { key: 'youtube', label: 'YouTube', Icon: Youtube },
]

function WhatsAppFloat() {
  const { settings } = useSettings()
  const number = settings.contacts?.whatsapp || ''
  const clean = number.replace(/\D/g, '')
  if (!clean) return null
  return (
    <a
      href={`https://wa.me/${clean}?text=${encodeURIComponent('Olá! Gostaria de saber mais sobre a MHM Farms.')}`}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-6 right-5 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-xl shadow-green-900/30 transition-transform hover:scale-105"
      aria-label="Fale Connosco no WhatsApp"
    >
      <svg viewBox="0 0 32 32" className="h-6 w-6 fill-current">
        <path d="M16.004 3C9.383 3 4 8.383 4 15.004c0 2.117.553 4.185 1.605 6.01L3.5 28.5l7.617-2.07a12.02 12.02 0 0 0 4.883 1.004h.004C22.621 27.434 28 22.051 28 15.43 28 8.809 22.621 3 16.004 3Zm0 22.363h-.003a9.97 9.97 0 0 1-5.074-1.39l-.363-.215-4.52 1.23 1.207-4.407-.237-.369A9.96 9.96 0 0 1 5.55 15.03c0-5.488 4.468-9.956 9.957-9.956 2.66 0 5.16 1.035 7.04 2.916a9.94 9.94 0 0 1 2.914 7.04c0 5.488-4.469 9.956-9.957 9.956Zm5.457-7.451c-.3-.15-1.773-.875-2.047-.976-.274-.1-.473-.15-.673.15-.2.3-.773.976-.948 1.176-.175.2-.35.225-.65.075-.3-.15-1.265-.466-2.41-1.487-.89-.794-1.49-1.774-1.665-2.074-.174-.3-.018-.462.132-.612.135-.135.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.672-1.62-.92-2.217-.242-.578-.488-.5-.672-.51l-.572-.01c-.2 0-.524.075-.8.375-.275.3-1.047 1.023-1.047 2.496s1.071 2.897 1.222 3.098c.15.2 2.11 3.222 5.111 4.517.715.308 1.273.491 1.708.628.717.226 1.37.195 1.886.118.575-.086 1.773-.725 2.024-1.425.25-.7.25-1.3.175-1.426-.075-.125-.274-.2-.574-.35Z" />
      </svg>
      <span className="text-sm font-bold">Fale Connosco</span>
    </a>
  )
}

function LanguageSelector() {
  const { lang, setLang } = useI18n()
  return (
    <div className="flex items-center gap-1 text-xs font-bold">
      {(['pt', 'en', 'fr'] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`rounded-md px-1.5 py-0.5 uppercase transition-colors ${
            lang === l ? 'bg-gold-500 text-forest-950' : 'text-white/80 hover:text-white'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  )
}

const NAV_ITEMS = [
  { to: '/', labelKey: 'nav_home', end: true },
  { to: '/sobre', labelKey: 'nav_about' },
  { to: '/animais', labelKey: 'nav_animals' },
  { to: '/experiencias', labelKey: 'nav_experiences' },
  { to: '/eventos', labelKey: 'nav_events' },
  { to: '/precos', labelKey: 'nav_prices' },
  { to: '/galeria', labelKey: 'nav_gallery' },
  { to: '/contactos', labelKey: 'nav_contact' },
]

function Logo() {
  const { settings } = useSettings()
  const logo = settings.branding?.logo
  return (
    <Link to="/" className="flex items-center gap-2.5">
      {logo ? (
        <span className="grid h-11 w-auto max-w-[180px] place-items-center overflow-hidden">
          <img src={logo} alt="MHM Farms" className="max-h-11 w-auto object-contain" />
        </span>
      ) : (
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-forest-700 font-display text-lg font-bold text-gold-500 shadow-md">
          MH
        </span>
      )}
      {!logo && (
        <span className="leading-tight">
          <span className="block font-display text-xl font-bold text-white">MHM Farms</span>
          <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gold-500">
            {settings.home?.heroSubtitle || 'Onde a Natureza Ganha Vida'}
          </span>
        </span>
      )}
    </Link>
  )
}

export default function Layout() {
  const { t } = useI18n()
  const { settings } = useSettings()
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  const contact = settings.contacts

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:text-forest-900"
      >
        Saltar para o conteúdo
      </a>

      {/* Top bar */}
      <div className="bg-forest-950 text-xs text-white/80">
        <div className="container-page flex items-center justify-between py-2">
          <div className="flex items-center gap-4">
            <span className="hidden items-center gap-1.5 sm:flex">
              <Phone className="h-3.5 w-3.5 text-gold-500" />
              {contact?.phone || '+258 84 000 0000'}
            </span>
            <span className="hidden items-center gap-1.5 md:flex">
              <Mail className="h-3.5 w-3.5 text-gold-500" />
              {contact?.email || 'info@mhmfarms.com'}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-gold-500" />
              {contact ? `${contact.city}, ${contact.province}` : 'Boane, Maputo'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              {SOCIALS.map(({ key, label, Icon }) => {
                const url = settings.social?.[key as keyof typeof settings.social]
                if (!url) return null
                return (
                  <a key={key} href={url} target="_blank" rel="noreferrer" aria-label={label} className="transition-colors hover:text-gold-500">
                    <Icon className="h-4 w-4" />
                  </a>
                )
              })}
            </div>
            <LanguageSelector />
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-forest-800/95 shadow-lg shadow-forest-950/10 backdrop-blur">
        <div className="container-page flex items-center justify-between py-3.5">
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Menu principal">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-full px-3.5 py-2 text-[13px] font-bold uppercase tracking-wide transition-colors ${
                    isActive ? 'bg-forest-600 text-gold-400' : 'text-white/90 hover:bg-forest-700 hover:text-white'
                  }`
                }
              >
                {t(item.labelKey)}
              </NavLink>
            ))}
          </nav>
          <div className="hidden lg:block">
            <Link to="/reservar" className="btn-gold !px-5 !py-2.5">
              <CalendarCheck className="h-4 w-4" />
              {t('nav_reserve')}
            </Link>
          </div>
          <button
            className="rounded-lg p-2 text-white lg:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Abrir menu"
            aria-expanded={open}
          >
            {open ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
          </button>
        </div>
        {open && (
          <div className="border-t border-forest-700 bg-forest-900 lg:hidden">
            <nav className="container-page flex flex-col py-3" aria-label="Menu móvel">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2.5 text-sm font-bold uppercase tracking-wide ${
                      isActive ? 'text-gold-400' : 'text-white/90'
                    }`
                  }
                >
                  {t(item.labelKey)}
                </NavLink>
              ))}
              <Link to="/reservar" className="btn-gold mt-3">
                <CalendarCheck className="h-4 w-4" />
                {t('nav_reserve')}
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <Footer />

      {open ? null : <WhatsAppFloat />}
    </div>
  )
}

const FOOTER_LINKS = [
  { labelKey: 'nav_about', to: '/sobre' },
  { labelKey: 'nav_animals', to: '/animais' },
  { labelKey: 'nav_experiences', to: '/experiencias' },
  { labelKey: 'nav_events', to: '/eventos' },
  { labelKey: 'nav_contact', to: '/contactos' },
  { labelKey: 'nav_hours', to: '/horarios' },
  { labelKey: 'nav_prices', to: '/precos' },
  { labelKey: 'nav_gallery', to: '/galeria' },
  { labelKey: 'nav_faq', to: '/perguntas-frequentes' },
  { labelKey: 'nav_news', to: '/noticias' },
]

function Footer() {
  const { t } = useI18n()
  const { settings } = useSettings()
  const contact = settings.contacts

  return (
    <footer className="bg-forest-950 pt-14 text-forest-100">
      <div className="container-page grid gap-10 pb-10 md:grid-cols-4">
        <div>
          <h3 className="font-display text-2xl font-bold text-white">MHM Farms</h3>
          <p className="mt-1 text-sm text-gold-500">Onde a Natureza Ganha Vida</p>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Descubra uma experiência única de contacto com animais, natureza e aventura em
            Moçambique.
          </p>
          <div className="mt-5 flex gap-3">
            {SOCIALS.map(({ key, label, Icon }) => {
              const url = settings.social?.[key as keyof typeof settings.social]
              if (!url) return null
              return (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="grid h-9 w-9 place-items-center rounded-full bg-forest-800 text-white transition-colors hover:bg-gold-500 hover:text-forest-950"
                >
                  <Icon className="h-4 w-4" />
                </a>
              )
            })}
          </div>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-extrabold uppercase tracking-wider text-gold-500">
            Navegação
          </h4>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {FOOTER_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-white/75 transition-colors hover:text-gold-400">
                  {t(l.labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-extrabold uppercase tracking-wider text-gold-500">
            Respaldo Legal
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/termos" className="text-white/75 transition-colors hover:text-gold-400">
                Termos e Condições
              </Link>
            </li>
            <li>
              <Link to="/privacidade" className="text-white/75 transition-colors hover:text-gold-400">
                Política de Privacidade
              </Link>
            </li>
            <li>
              <Link to="/visitas-escolares" className="text-white/75 transition-colors hover:text-gold-400">
                Programa Educativo
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-extrabold uppercase tracking-wider text-gold-500">
            Contactos
          </h4>
          <ul className="space-y-2 text-sm text-white/75">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" />
              {contact
                ? `${contact.address}, ${contact.city}, ${contact.province}, ${contact.country}`
                : 'Estrada Nacional 1, KM 24, Boane, Maputo'}
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-gold-500" />
              {contact?.phone || '+258 84 000 0000'}
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-gold-500" />
              {contact?.email || 'info@mhmfarms.com'}
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-forest-900 py-5 text-center text-xs text-white/50">
        © {new Date().getFullYear()} MHM Farms. Todos os direitos reservados.
        <ChevronDown className="hidden" aria-hidden />
      </div>
    </footer>
  )
}
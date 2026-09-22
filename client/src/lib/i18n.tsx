import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Lang = 'pt' | 'en' | 'fr'

const dict: Record<Lang, Record<string, string>> = {
  pt: {
    nav_home: 'Início',
    nav_about: 'Sobre',
    nav_animals: 'Animais',
    nav_experiences: 'Experiências',
    nav_events: 'Eventos',
    nav_prices: 'Preços',
    nav_gallery: 'Galeria',
    nav_contact: 'Contactos',
    nav_news: 'Notícias',
    nav_hours: 'Horários',
    nav_location: 'Como Chegar',
    nav_faq: 'FAQ',
    nav_school: 'Visitas Escolares',
    nav_reserve: 'Reservar Visita',
    hero_visit: 'Visitar a MHM Farms',
    hero_book: 'Fazer Reserva',
    common_loading: 'A carregar…',
    common_learn_more: 'Ver Mais',
    common_reserve: 'Reservar',
    common_view_all: 'Ver Todos',
    common_close: 'Fechar',
  },
  en: {
    nav_home: 'Home',
    nav_about: 'About',
    nav_animals: 'Animals',
    nav_experiences: 'Experiences',
    nav_events: 'Events',
    nav_prices: 'Prices',
    nav_gallery: 'Gallery',
    nav_contact: 'Contact',
    nav_news: 'News',
    nav_hours: 'Opening Hours',
    nav_location: 'How to Get There',
    nav_faq: 'FAQ',
    nav_school: 'School Visits',
    nav_reserve: 'Book a Visit',
    hero_visit: 'Visit MHM Farms',
    hero_book: 'Make a Reservation',
    common_loading: 'Loading…',
    common_learn_more: 'Learn More',
    common_reserve: 'Book',
    common_view_all: 'View All',
    common_close: 'Close',
  },
  fr: {
    nav_home: 'Accueil',
    nav_about: 'À propos',
    nav_animals: 'Animaux',
    nav_experiences: 'Expériences',
    nav_events: 'Événements',
    nav_prices: 'Tarifs',
    nav_gallery: 'Galerie',
    nav_contact: 'Contact',
    nav_news: 'Actualités',
    nav_hours: 'Horaires',
    nav_location: "Comment s'y rendre",
    nav_faq: 'FAQ',
    nav_school: 'Visites scolaires',
    nav_reserve: 'Réserver',
    hero_visit: 'Visiter MHM Farms',
    hero_book: 'Réserver',
    common_loading: 'Chargement…',
    common_learn_more: 'En savoir plus',
    common_reserve: 'Réserver',
    common_view_all: 'Voir tout',
    common_close: 'Fermer',
  },
}

interface I18nContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'pt',
  setLang: () => {},
  t: (k) => k,
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('pt')

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const t = (key: string) => dict[lang][key] || dict.pt[key] || key

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  return useContext(I18nContext)
}

export function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible')
            obs.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12 }
    )
    els.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])
  return null
}
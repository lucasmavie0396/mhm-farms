import { useEffect } from 'react'
import { useSettings } from './settings'

export function usePageMeta(title?: string, description?: string) {
  const { settings } = useSettings()

  useEffect(() => {
    const base = settings.seo?.title || 'MHM Farms — Quinta e Experiência Animal'
    document.title = title ? `${title} | MHM Farms` : base
    if (description) {
      let el = document.querySelector('meta[name="description"]')
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute('name', 'description')
        document.head.appendChild(el)
      }
      el.setAttribute('content', description)
    }
  }, [title, description, settings.seo?.title])
}
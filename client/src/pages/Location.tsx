import { ExternalLink, Mail, MapPin, Navigation, Phone } from 'lucide-react'
import { usePageMeta } from '../lib/seo'
import { useSettings } from '../lib/settings'
import { PageHero } from '../components/cards'

const IMG =
  'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=1400&q=80'

export default function Location() {
  usePageMeta('Como Chegar', 'Localização da MHM Farms.')
  const { settings } = useSettings()
  const contact = settings.contacts
  const maps = settings.maps

  return (
    <div>
      <PageHero
        kicker="Localização"
        title="Como Chegar"
        subtitle="Encontre-nos facilmente. Estacionamos gratuitamente na entrada."
        image={IMG}
      />

      <section className="py-16">
        <div className="container-page grid gap-10 lg:grid-cols-5">
          <div className="space-y-5 lg:col-span-2">
            <div className="rounded-3xl bg-white p-7 shadow-md ring-1 ring-forest-100">
              <MapPin className="h-8 w-8 text-gold-600" />
              <h3 className="mt-3 font-display text-lg font-bold text-forest-900">Endereço</h3>
              <p className="mt-2 text-forest-800/75">
                {contact
                  ? `${contact.address}, ${contact.city}, ${contact.province}, ${contact.country}`
                  : 'Estrada Nacional 1, KM 24, Boane, Maputo, Moçambique'}
              </p>
              {maps?.latitude && maps.longitude && (
                <p className="mt-3 flex items-center gap-2 rounded-xl bg-forest-50 px-3 py-2 text-xs font-semibold text-forest-800">
                  <Navigation className="h-4 w-4 text-forest-600" />
                  GPS: {maps.latitude}, {maps.longitude}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-3xl bg-white p-5 shadow-md ring-1 ring-forest-100">
                <Phone className="h-6 w-6 text-gold-600" />
                <p className="mt-2 text-xs font-bold uppercase tracking-wide text-forest-800/50">
                  Telefone
                </p>
                <p className="mt-1 text-sm font-semibold text-forest-900">
                  {contact?.phone || '+258 84 000 0000'}
                </p>
              </div>
              <div className="rounded-3xl bg-white p-5 shadow-md ring-1 ring-forest-100">
                <Mail className="h-6 w-6 text-gold-600" />
                <p className="mt-2 text-xs font-bold uppercase tracking-wide text-forest-800/50">
                  Email
                </p>
                <p className="mt-1 break-all text-sm font-semibold text-forest-900">
                  {contact?.email || 'info@mhmfarms.com'}
                </p>
              </div>
            </div>

            <a
              href={maps?.gmapsUrl || 'https://www.google.com/maps/search/?api=1&query=MHM+Farms+Boane+Mozambique'}
              target="_blank"
              rel="noreferrer"
              className="btn-primary flex w-full items-center justify-center gap-2"
            >
              <ExternalLink className="h-4 w-4" /> ABRIR NO GOOGLE MAPS
            </a>
          </div>

          <div className="lg:col-span-3">
            <div className="h-full min-h-[420px] overflow-hidden rounded-3xl shadow-xl ring-1 ring-forest-100">
              <iframe
                title="Mapa da MHM Farms"
                src={maps?.embedUrl || 'https://www.google.com/maps?q=-26.0167,32.2833&z=13&output=embed'}
                className="h-full min-h-[420px] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
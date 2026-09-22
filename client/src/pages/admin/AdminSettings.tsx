import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { api } from '../../lib/api'
import { usePageMeta } from '../../lib/seo'
import { Notice, PageHead, Spinner } from '../../components/admin'
import type { PublicSettings } from '../../lib/types'

type Section = { title: string; key: string }

const SECTIONS: Section[] = [
  { title: 'Preços', key: 'prices' },
  { title: 'Horários', key: 'hours' },
  { title: 'Aviso de Horários', key: 'hoursNotice' },
  { title: 'Contactos', key: 'contacts' },
  { title: 'Redes Sociais', key: 'social' },
  { title: 'Mapas', key: 'maps' },
  { title: 'Página Inicial', key: 'home' },
  { title: 'Sobre Nós', key: 'about' },
  { title: 'SEO', key: 'seo' },
]

export default function AdminSettings() {
  usePageMeta('Definições do Site')
  const [settings, setSettings] = useState<PublicSettings>({})
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      setSettings(await api<PublicSettings>('/settings/admin/all'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const setSection = <K extends keyof PublicSettings>(key: K, value: PublicSettings[K]) =>
    setSettings((s) => ({ ...s, [key]: value }))

  const saveSection = async (key: string) => {
    setSavingKey(key)
    setMsg(null)
    try {
      await api('/settings', { method: 'PUT', body: JSON.stringify({ key, value: settings[key as keyof PublicSettings] }) })
      setMsg({ kind: 'success', text: `"${key}" guardado com sucesso.` })
    } catch (err) {
      setMsg({ kind: 'error', text: err instanceof Error ? err.message : 'Erro ao guardar.' })
    } finally {
      setSavingKey(null)
    }
  }

  const input = (key: keyof PublicSettings, field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const obj = (settings[key] as Record<string, unknown>) || {}
    setSection(key, { ...obj, [field]: e.target.value } as never)
  }

  const priceAt = (i: number, field: 'category' | 'price') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const rows = [...(settings.prices || [])]
    const row = { ...(rows[i] || { category: '', price: 0 }) }
    if (field === 'price') row.price = Number(e.target.value) || 0
    else row.category = e.target.value
    rows[i] = row
    setSection('prices', rows)
  }

  const hourAt = (i: number, field: 'open' | 'note') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const rows = [...(settings.hours || [])]
    const row = { ...(rows[i] || { day: '', open: '', note: '' }) }
    row[field] = e.target.value
    rows[i] = row
    setSection('hours', rows)
  }

  const socialAt = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const obj = { ...((settings.social as Record<string, string>) || {}) }
    obj[key] = e.target.value
    setSection('social', obj as never)
  }

  if (loading) return <Spinner />

  return (
    <div>
      <PageHead title="Definições do Site" subtitle="Preços, horários, contactos, textos e SEO" />

      {msg && (
        <div className="mb-6">
          <Notice kind={msg.kind}>{msg.text}</Notice>
        </div>
      )}

      {SECTIONS.map((sec) => (
        <section key={sec.key} className="mb-6 rounded-3xl border border-forest-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-forest-100 pb-4">
            <h2 className="font-display text-lg font-bold text-forest-900">{sec.title}</h2>
            <button onClick={() => saveSection(sec.key)} disabled={savingKey === sec.key} className="btn-primary !py-2">
              <Save className="h-4 w-4" />
              {savingKey === sec.key ? 'A guardar…' : 'Guardar'}
            </button>
          </div>

          {sec.key === 'prices' && (
            <div>
              <p className="mb-3 text-sm text-forest-800/60">Estes valores alimentam a página de Preços e o cálculo das reservas. A reserva usa o preço de "Adulto", "Criança (3–12 anos)" e "Família".</p>
              {(settings.prices || []).length === 0 && (
                <label className="field-label">Adicione dentro das definições do seed.</label>
              )}
              {(settings.prices || []).map((r, i) => (
                <div key={i} className="mb-2 grid grid-cols-[1fr_120px] gap-3">
                  <input value={r.category} onChange={priceAt(i, 'category')} placeholder="Categoria" />
                  <input type="number" min={0} value={r.price} onChange={priceAt(i, 'price')} placeholder="MT" />
                </div>
              ))}
            </div>
          )}

          {sec.key === 'hours' && (
            <div className="space-y-3">
              {(settings.hours || []).map((r, i) => (
                <div key={i} className="grid gap-3 sm:grid-cols-3">
                  <input value={r.day} readOnly className="font-bold text-forest-800" />
                  <input value={r.open} onChange={hourAt(i, 'open')} placeholder="08:00 – 17:00" />
                  <input value={r.note || ''} onChange={hourAt(i, 'note')} placeholder="Nota (opcional)" />
                </div>
              ))}
            </div>
          )}

          {sec.key === 'hoursNotice' && (
            <textarea
              rows={2}
              value={settings.hoursNotice || ''}
              onChange={(e) => setSection('hoursNotice', e.target.value)}
              className="w-full"
            />
          )}

          {sec.key === 'contacts' && (
            <div className="grid gap-3 sm:grid-cols-2">
              {(['address', 'city', 'province', 'country', 'phone', 'whatsapp', 'email'] as const).map((f) => (
                <div key={f}>
                  <label className="field-label">{f}</label>
                  <input value={settings.contacts?.[f] || ''} onChange={input('contacts', f)} />
                </div>
              ))}
            </div>
          )}

          {sec.key === 'social' && (
            <div className="grid gap-3 sm:grid-cols-2">
              {(['facebook', 'instagram', 'tiktok', 'youtube'] as const).map((f) => (
                <div key={f}>
                  <label className="field-label">{f}</label>
                  <input value={settings.social?.[f] || ''} onChange={socialAt(f)} placeholder="https://…" />
                </div>
              ))}
            </div>
          )}

          {sec.key === 'maps' && (
            <div className="grid gap-3 sm:grid-cols-2">
              {(['embedUrl', 'gmapsUrl'] as const).map((f) => (
                <div key={f} className="sm:col-span-2">
                  <label className="field-label">{f}</label>
                  <input value={settings.maps?.[f] || ''} onChange={input('maps', f)} placeholder="https://…" />
                </div>
              ))}
              <div>
                <label className="field-label">Latitude</label>
                <input value={settings.maps?.latitude || ''} onChange={input('maps', 'latitude')} />
              </div>
              <div>
                <label className="field-label">Longitude</label>
                <input value={settings.maps?.longitude || ''} onChange={input('maps', 'longitude')} />
              </div>
            </div>
          )}

          {sec.key === 'home' && (
            <div className="space-y-3">
              <div>
                <label className="field-label">Título hero</label>
                <input value={settings.home?.heroTitle || ''} onChange={input('home', 'heroTitle')} />
              </div>
              <div>
                <label className="field-label">Subtítulo hero</label>
                <input value={settings.home?.heroSubtitle || ''} onChange={input('home', 'heroSubtitle')} />
              </div>
              <div>
                <label className="field-label">Texto hero</label>
                <textarea rows={3} value={settings.home?.heroText || ''} onChange={input('home', 'heroText')} />
              </div>
            </div>
          )}

          {sec.key === 'about' && (
            <div className="space-y-3">
              {(['intro', 'mission', 'vision', 'values'] as const).map((f) => (
                <div key={f}>
                  <label className="field-label">{f}</label>
                  <textarea rows={f === 'intro' ? 4 : 2} value={settings.about?.[f] || ''} onChange={input('about', f)} />
                </div>
              ))}
            </div>
          )}

          {sec.key === 'seo' && (
            <div className="space-y-3">
              <div>
                <label className="field-label">Title</label>
                <input value={settings.seo?.title || ''} onChange={input('seo', 'title')} />
              </div>
              <div>
                <label className="field-label">Description</label>
                <textarea rows={3} value={settings.seo?.description || ''} onChange={input('seo', 'description')} />
              </div>
            </div>
          )}
        </section>
      ))}
    </div>
  )
}
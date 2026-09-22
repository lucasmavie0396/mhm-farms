import { useState } from 'react'
import { CheckCircle2, Info, Mail, MapPin, Phone, Send } from 'lucide-react'
import { api } from '../lib/api'
import { usePageMeta } from '../lib/seo'
import { useSettings } from '../lib/settings'
import { PageHero } from '../components/cards'

const IMG =
  'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=1400&q=80'

export default function Contact() {
  usePageMeta('Contactos', 'Entre em contacto com a MHM Farms.')
  const { settings } = useSettings()
  const contact = settings.contacts
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.name || !form.email || !form.subject || !form.message) {
      setError('Preencha os campos obrigatórios (Nome, Email, Assunto e Mensagem).')
      return
    }
    setSending(true)
    try {
      await api('/contacts', { method: 'POST', body: JSON.stringify(form) }, false)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar a mensagem.')
    } finally {
      setSending(false)
    }
  }

  const whatsapp = (contact?.whatsapp || '').replace(/\D/g, '')

  return (
    <div>
      <PageHero
        kicker="Fale connosco"
        title="Entre em Contacto"
        subtitle="Estamos disponíveis para responder a todas as suas perguntas."
        image={IMG}
      />

      <section className="py-16">
        <div className="container-page grid gap-10 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            {[
              { Icon: Phone, title: 'Telefone', value: contact?.phone || '+258 84 000 0000', href: `tel:${contact?.phone}` },
              { Icon: Mail, title: 'Email', value: contact?.email || 'info@mhmfarms.com', href: `mailto:${contact?.email}` },
              { Icon: MapPin, title: 'Endereço', value: contact ? `${contact.address}, ${contact.city}` : 'Boane, Maputo' },
            ].map(({ Icon, title, value, href }) => (
              <a key={title} href={href} className="flex items-start gap-4 rounded-3xl bg-white p-6 shadow-md ring-1 ring-forest-100 transition-colors hover:bg-forest-50">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-forest-700 text-gold-500">
                  <Icon className="h-6 w-6" />
                </span>
                <span>
                  <span className="block text-xs font-bold uppercase tracking-wide text-forest-800/50">{title}</span>
                  <span className="mt-1 block font-semibold text-forest-900">{value}</span>
                </span>
              </a>
            ))}
            <div className="flex items-start gap-4 rounded-3xl bg-[#25D366]/10 p-6 ring-1 ring-[#25D366]/40">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#25D366] text-white">
                <svg viewBox="0 0 32 32" className="h-6 w-6 fill-current"><path d="M16.004 3C9.383 3 4 8.383 4 15.004c0 2.117.553 4.185 1.605 6.01L3.5 28.5l7.617-2.07a12.02 12.02 0 0 0 4.883 1.004h.004C22.621 27.434 28 22.051 28 15.43 28 8.809 22.621 3 16.004 3Z" /></svg>
              </span>
              <span>
                <span className="block text-xs font-bold uppercase tracking-wide text-forest-800/50">WhatsApp</span>
                <span className="mt-1 block font-semibold text-forest-900">{contact?.whatsapp || '+258 84 000 0000'}</span>
                {whatsapp && (
                  <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="mt-1 block text-sm font-bold text-[#128C7E] hover:underline">
                    Iniciar conversa →
                  </a>
                )}
              </span>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="rounded-3xl bg-white p-8 shadow-lg ring-1 ring-forest-100">
              {sent ? (
                <div className="flex flex-col items-center py-14 text-center">
                  <CheckCircle2 className="h-14 w-14 text-forest-600" />
                  <h3 className="mt-4 font-display text-2xl font-bold text-forest-900">
                    Mensagem enviada!
                  </h3>
                  <p className="mt-2 max-w-md text-forest-800/70">
                    Obrigado pelo seu contacto. A nossa equipa responderá o mais breve possível.
                  </p>
                  <button className="btn-outline mt-6" onClick={() => setSent(false)}>
                    Enviar outra mensagem
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} noValidate>
                  <h3 className="font-display text-xl font-bold text-forest-900">
                    Envie-nos uma mensagem
                  </h3>
                  {error && (
                    <p className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                      <Info className="h-4 w-4 shrink-0" /> {error}
                    </p>
                  )}
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="field-label">Nome *</label>
                      <input value={form.name} onChange={update('name')} placeholder="O seu nome" />
                    </div>
                    <div>
                      <label className="field-label">Email *</label>
                      <input type="email" value={form.email} onChange={update('email')} placeholder="email@exemplo.com" />
                    </div>
                    <div>
                      <label className="field-label">Telefone</label>
                      <input value={form.phone} onChange={update('phone')} placeholder="+258 84 000 0000" />
                    </div>
                    <div>
                      <label className="field-label">Assunto *</label>
                      <input value={form.subject} onChange={update('subject')} placeholder="Sobre o que nos quer falar?" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="field-label">Mensagem *</label>
                      <textarea rows={5} value={form.message} onChange={update('message')} placeholder="Escreva a sua mensagem…" />
                    </div>
                  </div>
                  <button type="submit" disabled={sending} className="btn-primary mt-6 !px-8">
                    <Send className="h-4 w-4" /> {sending ? 'A enviar…' : 'ENVIAR MENSAGEM'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
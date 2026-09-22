import { useEffect, useState } from 'react'
import { Loader2, Pencil, ToggleLeft, ToggleRight, Upload } from 'lucide-react'
import { api, uploadFile } from '../../lib/api'
import { usePageMeta } from '../../lib/seo'
import { formatDateShort, formatMoney } from '../../lib/settings'
import { AddButton, ConfirmDelete, Modal, Notice, PageHead, Table, Spinner } from '../../components/admin'
import type { Event } from '../../lib/types'

const EMPTY = {
  title: '',
  date: '',
  time: '10:00',
  location: '',
  description: '',
  image: '',
  price: '0',
  maxParticipants: '',
  active: true,
  featured: false,
}

export default function AdminEvents() {
  usePageMeta('Gerir Eventos')
  const [items, setItems] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Event | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      setItems(await api<Event[]>('/events/admin/all'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({
      ...form,
      [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value,
    })

  const openNew = () => {
    setEditing(null)
    setForm({ ...EMPTY })
    setError('')
    setOpen(true)
  }

  const openEdit = (ev: Event) => {
    setEditing(ev)
    setForm({
      title: ev.title,
      date: new Date(ev.date).toISOString().slice(0, 10),
      time: ev.time,
      location: ev.location,
      description: ev.description,
      image: ev.image,
      price: String(ev.price),
      maxParticipants: ev.maxParticipants ? String(ev.maxParticipants) : '',
      active: ev.active,
      featured: ev.featured,
    })
    setError('')
    setOpen(true)
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const url = await uploadFile(file)
      setForm({ ...form, image: url })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar a imagem.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.date || !form.description) {
      setError('Data, título e descrição são obrigatórios.')
      return
    }
    setSaving(true)
    setError('')
    const payload = {
      ...form,
      date: new Date(form.date).toISOString(),
      price: Number(form.price) || 0,
      maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : null,
      image: form.image || undefined,
    }
    try {
      if (editing) await api(`/events/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) })
      else await api('/events', { method: 'POST', body: JSON.stringify(payload) })
      setOpen(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar.')
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (id: string) => {
    await api(`/events/${id}/toggle`, { method: 'PATCH' })
    await load()
  }

  if (loading) return <Spinner />

  return (
    <div>
      <PageHead
        title="Gestão de Eventos"
        subtitle={`${items.length} eventos`}
        action={<AddButton onClick={openNew}>Criar Evento</AddButton>}
      />

      <Table head={['Evento', 'Data', 'Hora', 'Preço', 'Estado', 'Ações']}>
        {items.map((ev) => (
          <tr key={ev.id} className="hover:bg-forest-50/50">
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <img src={ev.image} alt="" className="h-11 w-11 rounded-xl object-cover" loading="lazy" />
                <span className="font-bold text-forest-900">{ev.title}</span>
              </div>
            </td>
            <td className="px-4 py-3 text-forest-800/70">{formatDateShort(ev.date)}</td>
            <td className="px-4 py-3 text-forest-800/70">{ev.time}</td>
            <td className="px-4 py-3 font-bold text-forest-900">
              {ev.price > 0 ? formatMoney(ev.price) : 'Gratuito'}
            </td>
            <td className="px-4 py-3">
              <span className={`badge ${ev.active ? 'bg-forest-100 text-forest-800' : 'bg-stone-100 text-stone-500'}`}>
                {ev.active ? 'Publicado' : 'Desativado'}
              </span>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(ev)} className="rounded-lg px-3 py-2 text-forest-700 hover:bg-forest-100">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => toggle(ev.id)} className="rounded-lg px-3 py-2 text-forest-700 hover:bg-forest-100">
                  {ev.active ? <ToggleRight className="h-5 w-5 text-forest-600" /> : <ToggleLeft className="h-5 w-5 text-stone-400" />}
                </button>
                <ConfirmDelete
                  onConfirm={async () => {
                    await api(`/events/${ev.id}`, { method: 'DELETE' })
                    await load()
                  }}
                />
              </div>
            </td>
          </tr>
        ))}
      </Table>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Editar Evento' : 'Novo Evento'} wide>
        <form onSubmit={save} className="space-y-4">
          {error && <Notice kind="error">{error}</Notice>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="field-label">Título *</label>
              <input value={form.title} onChange={update('title')} />
            </div>
            <div>
              <label className="field-label">Data *</label>
              <input type="date" value={form.date} onChange={update('date')} />
            </div>
            <div>
              <label className="field-label">Hora</label>
              <input value={form.time} onChange={update('time')} placeholder="10:00 – 16:00" />
            </div>
            <div>
              <label className="field-label">Local</label>
              <input value={form.location} onChange={update('location')} />
            </div>
            <div>
              <label className="field-label">Preço (MT)</label>
              <input type="number" min={0} value={form.price} onChange={update('price')} />
            </div>
            <div>
              <label className="field-label">Máx. participantes</label>
              <input type="number" min={1} value={form.maxParticipants} onChange={update('maxParticipants')} />
            </div>
            <div className="sm:col-span-2">
              <label className="field-label">Imagem do evento</label>
              <div className="flex items-start gap-3 rounded-2xl border border-forest-100 p-3">
                <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-forest-50 ring-1 ring-forest-100">
                  {form.image ? (
                    <img src={form.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] font-bold uppercase tracking-wider text-forest-800/40">
                      Sem imagem
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-forest-300 bg-forest-50 px-4 py-2.5 text-sm font-semibold text-forest-800 hover:bg-forest-100">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploading ? 'A enviar…' : 'Carregar do computador'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/bmp"
                      className="hidden"
                      onChange={onFile}
                      disabled={uploading}
                    />
                  </label>
                  <span className="text-[11px] text-forest-800/50">ou use um URL externo</span>
                  <input className="!mt-0" value={form.image} onChange={update('image')} placeholder="https://…" />
                </div>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="field-label">Descrição *</label>
              <textarea rows={4} value={form.description} onChange={update('description')} />
            </div>
          </div>
          <div className="flex flex-wrap gap-6 border-t border-forest-100 pt-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-forest-900">
              <input type="checkbox" checked={form.active} onChange={update('active')} className="!w-4 !p-0" /> Publicado
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-forest-900">
              <input type="checkbox" checked={form.featured} onChange={update('featured')} className="!w-4 !p-0" /> Destaque
            </label>
          </div>
          <div className="flex justify-end gap-3 border-t border-forest-100 pt-4">
            <button type="button" onClick={() => setOpen(false)} className="btn-outline !py-2.5">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary !py-2.5">
              {saving ? 'A guardar…' : 'Guardar Evento'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
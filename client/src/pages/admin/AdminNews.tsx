import { useEffect, useState } from 'react'
import { Pencil, ToggleLeft, ToggleRight } from 'lucide-react'
import { api } from '../../lib/api'
import { usePageMeta } from '../../lib/seo'
import { formatDateShort } from '../../lib/settings'
import { AddButton, ConfirmDelete, Modal, Notice, PageHead, Table, Spinner } from '../../components/admin'
import type { News } from '../../lib/types'

const EMPTY = {
  title: '',
  content: '',
  image: '',
  date: new Date().toISOString().slice(0, 10),
  author: 'Equipa MHM Farms',
  category: 'Novidades',
  active: true,
  featured: false,
}

export default function AdminNews() {
  usePageMeta('Gerir Notícias')
  const [items, setItems] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<News | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      setItems(await api<News[]>('/news/admin/all'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
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

  const openEdit = (n: News) => {
    setEditing(n)
    setForm({
      title: n.title,
      content: n.content,
      image: n.image || '',
      date: new Date(n.date).toISOString().slice(0, 10),
      author: n.author,
      category: n.category,
      active: n.active,
      featured: n.featured,
    })
    setError('')
    setOpen(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.content) {
      setError('Título e conteúdo são obrigatórios.')
      return
    }
    setSaving(true)
    setError('')
    const payload = { ...form, image: form.image || undefined }
    try {
      if (editing) await api(`/news/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) })
      else await api('/news', { method: 'POST', body: JSON.stringify(payload) })
      setOpen(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar.')
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (id: string) => {
    await api(`/news/${id}/toggle`, { method: 'PATCH' })
    await load()
  }

  if (loading) return <Spinner />

  return (
    <div>
      <PageHead
        title="Gestão de Notícias"
        subtitle={`${items.length} publicações`}
        action={<AddButton onClick={openNew}>Nova Notícia</AddButton>}
      />

      <Table head={['Notícia', 'Categoria', 'Data', 'Autor', 'Estado', 'Ações']}>
        {items.map((n) => (
          <tr key={n.id} className="hover:bg-forest-50/50">
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                {n.image && <img src={n.image} alt="" className="h-11 w-11 rounded-xl object-cover" loading="lazy" />}
                <span className="font-bold text-forest-900">{n.title}</span>
              </div>
            </td>
            <td className="px-4 py-3 text-forest-800/70">{n.category}</td>
            <td className="px-4 py-3 text-forest-800/70">{formatDateShort(n.date)}</td>
            <td className="px-4 py-3 text-forest-800/70">{n.author}</td>
            <td className="px-4 py-3">
              <span className={`badge ${n.active ? 'bg-forest-100 text-forest-800' : 'bg-stone-100 text-stone-500'}`}>
                {n.active ? 'Publicada' : 'Desativada'}
              </span>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(n)} className="rounded-lg px-3 py-2 text-forest-700 hover:bg-forest-100">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => toggle(n.id)} className="rounded-lg px-3 py-2 text-forest-700 hover:bg-forest-100">
                  {n.active ? <ToggleRight className="h-5 w-5 text-forest-600" /> : <ToggleLeft className="h-5 w-5 text-stone-400" />}
                </button>
                <ConfirmDelete
                  onConfirm={async () => {
                    await api(`/news/${n.id}`, { method: 'DELETE' })
                    await load()
                  }}
                />
              </div>
            </td>
          </tr>
        ))}
      </Table>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Editar Notícia' : 'Nova Notícia'} wide>
        <form onSubmit={save} className="space-y-4">
          {error && <Notice kind="error">{error}</Notice>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="field-label">Título *</label>
              <input value={form.title} onChange={update('title')} />
            </div>
            <div>
              <label className="field-label">Categoria</label>
              <input value={form.category} onChange={update('category')} placeholder="Novos animais, Eventos…" />
            </div>
            <div>
              <label className="field-label">Autor</label>
              <input value={form.author} onChange={update('author')} />
            </div>
            <div>
              <label className="field-label">Data</label>
              <input type="date" value={form.date} onChange={update('date')} />
            </div>
            <div>
              <label className="field-label">URL da Imagem</label>
              <input value={form.image} onChange={update('image')} placeholder="https://…" />
            </div>
            <div className="sm:col-span-2">
              <label className="field-label">Conteúdo *</label>
              <textarea rows={8} value={form.content} onChange={update('content')} />
            </div>
          </div>
          <div className="flex flex-wrap gap-6 border-t border-forest-100 pt-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-forest-900">
              <input type="checkbox" checked={form.active} onChange={update('active')} className="!w-4 !p-0" /> Publicada
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-forest-900">
              <input type="checkbox" checked={form.featured} onChange={update('featured')} className="!w-4 !p-0" /> Destaque
            </label>
          </div>
          <div className="flex justify-end gap-3 border-t border-forest-100 pt-4">
            <button type="button" onClick={() => setOpen(false)} className="btn-outline !py-2.5">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary !py-2.5">
              {saving ? 'A guardar…' : 'Guardar Notícia'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
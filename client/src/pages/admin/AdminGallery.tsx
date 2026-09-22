import { useEffect, useState } from 'react'
import { Pencil, ToggleLeft, ToggleRight } from 'lucide-react'
import { api } from '../../lib/api'
import { usePageMeta } from '../../lib/seo'
import { AddButton, ConfirmDelete, Modal, Notice, PageHead, Table, Spinner } from '../../components/admin'
import type { GalleryItem } from '../../lib/types'

const CATEGORIES = ['animais', 'natureza', 'visitantes', 'criancas', 'eventos', 'instalacoes', 'atividades']

export default function AdminGallery() {
  usePageMeta('Gerir Galeria')
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<GalleryItem | null>(null)
  const [form, setForm] = useState({ title: '', category: 'animais', type: 'IMAGE', url: '', videoUrl: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      setItems(await api<GalleryItem[]>('/gallery/admin/all'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value })

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.url && !form.videoUrl) {
      setError('Indique o URL da imagem ou do vídeo.')
      return
    }
    setSaving(true)
    setError('')
    const payload = {
      title: form.title || undefined,
      category: form.category,
      type: form.type,
      url: form.url || form.videoUrl,
      videoUrl: form.videoUrl || undefined,
    }
    try {
      if (editing) await api(`/gallery/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) })
      else await api('/gallery', { method: 'POST', body: JSON.stringify(payload) })
      setOpen(false)
      setForm({ title: '', category: 'animais', type: 'IMAGE', url: '', videoUrl: '' })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar.')
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (id: string) => {
    await api(`/gallery/${id}/toggle`, { method: 'PATCH' })
    await load()
  }

  if (loading) return <Spinner />

  return (
    <div>
      <PageHead
        title="Gestão da Galeria"
        subtitle={`${items.length} itens`}
        action={
          <AddButton
            onClick={() => {
              setEditing(null)
              setForm({ title: '', category: 'animais', type: 'IMAGE', url: '', videoUrl: '' })
              setError('')
              setOpen(true)
            }}
          >
            Adicionar Item
          </AddButton>
        }
      />

      <Table head={['Item', 'Categoria', 'Tipo', 'Estado', 'Ações']}>
        {items.map((g) => (
          <tr key={g.id} className="hover:bg-forest-50/50">
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <img src={g.url} alt="" className="h-11 w-11 rounded-xl object-cover" loading="lazy" />
                <span className="font-bold text-forest-900">{g.title || 'Sem título'}</span>
              </div>
            </td>
            <td className="px-4 py-3 text-forest-800/70">{g.category}</td>
            <td className="px-4 py-3 text-forest-800/70">{g.type === 'VIDEO' ? 'Vídeo' : 'Imagem'}</td>
            <td className="px-4 py-3">
              <span className={`badge ${g.active ? 'bg-forest-100 text-forest-800' : 'bg-stone-100 text-stone-500'}`}>
                {g.active ? 'Ativo' : 'Inativo'}
              </span>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setEditing(g)
                    setForm({ title: g.title || '', category: g.category, type: g.type, url: g.url, videoUrl: g.videoUrl || '' })
                    setError('')
                    setOpen(true)
                  }}
                  className="rounded-lg px-3 py-2 text-forest-700 hover:bg-forest-100"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => toggle(g.id)} className="rounded-lg px-3 py-2 text-forest-700 hover:bg-forest-100">
                  {g.active ? <ToggleRight className="h-5 w-5 text-forest-600" /> : <ToggleLeft className="h-5 w-5 text-stone-400" />}
                </button>
                <ConfirmDelete
                  onConfirm={async () => {
                    await api(`/gallery/${g.id}`, { method: 'DELETE' })
                    await load()
                  }}
                />
              </div>
            </td>
          </tr>
        ))}
      </Table>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Editar Item' : 'Novo Item'}>
        <form onSubmit={save} className="space-y-4">
          {error && <Notice kind="error">{error}</Notice>}
          <div>
            <label className="field-label">Título</label>
            <input value={form.title} onChange={update('title')} placeholder="Descreva a foto" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Categoria</label>
              <select value={form.category} onChange={update('category')}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Tipo</label>
              <select value={form.type} onChange={update('type')}>
                <option value="IMAGE">Imagem</option>
                <option value="VIDEO">Vídeo</option>
              </select>
            </div>
          </div>
          <div>
            <label className="field-label">URL da Imagem *</label>
            <input value={form.url} onChange={update('url')} placeholder="https://…" />
            {form.url && <img src={form.url} alt="" className="mt-2 h-32 rounded-xl object-cover" />}
          </div>
          <div>
            <label className="field-label">URL do Vídeo (opcional)</label>
            <input value={form.videoUrl} onChange={update('videoUrl')} placeholder="https://…/video.mp4" />
          </div>
          <div className="flex justify-end gap-3 border-t border-forest-100 pt-4">
            <button type="button" onClick={() => setOpen(false)} className="btn-outline !py-2.5">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary !py-2.5">
              {saving ? 'A guardar…' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
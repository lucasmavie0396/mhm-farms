import { useEffect, useState } from 'react'
import { Pencil, ToggleLeft, ToggleRight } from 'lucide-react'
import { api } from '../../lib/api'
import { usePageMeta } from '../../lib/seo'
import { formatMoney } from '../../lib/settings'
import { AddButton, ConfirmDelete, Modal, Notice, PageHead, Table, Spinner } from '../../components/admin'
import type { Experience } from '../../lib/types'

const TYPES = ['VISITA', 'ALIMENTACAO', 'PASSEIO', 'EDUCACAO', 'FAMILIA', 'EVENTO', 'AVENTURA'] as const

const EMPTY = {
  title: '',
  shortDesc: '',
  description: '',
  image: '',
  type: 'VISITA' as Experience['type'],
  duration: '',
  minAge: 'Todas as idades',
  price: '0',
  availability: true,
  featured: false,
  active: true,
}

export default function AdminExperiences() {
  usePageMeta('Gerir Experiências')
  const [items, setItems] = useState<Experience[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Experience | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      setItems(await api<Experience[]>('/experiences/admin/all'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const update =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
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

  const openEdit = (exp: Experience) => {
    setEditing(exp)
    setForm({
      title: exp.title,
      shortDesc: exp.shortDesc,
      description: exp.description || '',
      image: exp.image,
      type: exp.type as Experience['type'],
      duration: exp.duration,
      minAge: exp.minAge,
      price: String(exp.price),
      availability: exp.availability,
      featured: exp.featured,
      active: exp.active,
    })
    setError('')
    setOpen(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.shortDesc) {
      setError('Título e descrição curta são obrigatórios.')
      return
    }
    setSaving(true)
    setError('')
    const payload = { ...form, price: Number(form.price) || 0, image: form.image || undefined }
    try {
      if (editing) await api(`/experiences/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) })
      else await api('/experiences', { method: 'POST', body: JSON.stringify(payload) })
      setOpen(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar.')
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (id: string) => {
    await api(`/experiences/${id}/toggle`, { method: 'PATCH' })
    await load()
  }

  if (loading) return <Spinner />

  return (
    <div>
      <PageHead
        title="Gestão de Experiências"
        subtitle={`${items.length} experiências`}
        action={<AddButton onClick={openNew}>Adicionar Experiência</AddButton>}
      />

      <Table head={['Experiência', 'Tipo', 'Duração', 'Preço', 'Estado', 'Ações']}>
        {items.map((e) => (
          <tr key={e.id} className="hover:bg-forest-50/50">
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <img src={e.image} alt="" className="h-11 w-11 rounded-xl object-cover" loading="lazy" />
                <span className="font-bold text-forest-900">{e.title}</span>
              </div>
            </td>
            <td className="px-4 py-3 text-forest-800/70">{e.type}</td>
            <td className="px-4 py-3 text-forest-800/70">{e.duration}</td>
            <td className="px-4 py-3 font-bold text-forest-900">{formatMoney(e.price)}</td>
            <td className="px-4 py-3">
              <span className={`badge ${e.active ? 'bg-forest-100 text-forest-800' : 'bg-stone-100 text-stone-500'}`}>
                {e.active ? 'Ativo' : 'Inativo'}
              </span>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(e)} className="rounded-lg px-3 py-2 text-forest-700 hover:bg-forest-100">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => toggle(e.id)} className="rounded-lg px-3 py-2 text-forest-700 hover:bg-forest-100">
                  {e.active ? <ToggleRight className="h-5 w-5 text-forest-600" /> : <ToggleLeft className="h-5 w-5 text-stone-400" />}
                </button>
                <ConfirmDelete
                  onConfirm={async () => {
                    await api(`/experiences/${e.id}`, { method: 'DELETE' })
                    await load()
                  }}
                />
              </div>
            </td>
          </tr>
        ))}
      </Table>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Editar Experiência' : 'Nova Experiência'} wide>
        <form onSubmit={save} className="space-y-4">
          {error && <Notice kind="error">{error}</Notice>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label">Título *</label>
              <input value={form.title} onChange={update('title')} />
            </div>
            <div>
              <label className="field-label">Tipo</label>
              <select value={form.type} onChange={update('type')}>
                {TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="field-label">Descrição curta *</label>
              <input value={form.shortDesc} onChange={update('shortDesc')} />
            </div>
            <div className="sm:col-span-2">
              <label className="field-label">Descrição completa</label>
              <textarea rows={4} value={form.description} onChange={update('description')} />
            </div>
            <div>
              <label className="field-label">URL da Imagem</label>
              <input value={form.image} onChange={update('image')} placeholder="https://…" />
            </div>
            <div>
              <label className="field-label">Duração</label>
              <input value={form.duration} onChange={update('duration')} placeholder="2 horas" />
            </div>
            <div>
              <label className="field-label">Idade recomendada</label>
              <input value={form.minAge} onChange={update('minAge')} />
            </div>
            <div>
              <label className="field-label">Preço (MT)</label>
              <input type="number" min={0} value={form.price} onChange={update('price')} />
            </div>
          </div>
          <div className="flex flex-wrap gap-6 border-t border-forest-100 pt-4">
            {(['availability', 'featured', 'active'] as const).map((k) => (
              <label key={k} className="flex items-center gap-2 text-sm font-semibold text-forest-900">
                <input type="checkbox" checked={form[k]} onChange={update(k)} className="!w-4 !p-0" />
                {k === 'availability' ? 'Disponível' : k === 'featured' ? 'Destaque' : 'Ativo'}
              </label>
            ))}
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
import { useEffect, useState } from 'react'
import { ImagePlus, Pencil, Search, ToggleLeft, ToggleRight } from 'lucide-react'
import { api } from '../../lib/api'
import { usePageMeta } from '../../lib/seo'
import { CATEGORY_LABELS } from '../../lib/settings'
import { AddButton, ConfirmDelete, Modal, Notice, PageHead, Table, Spinner } from '../../components/admin'
import type { Animal } from '../../lib/types'

const EMPTY = {
  name: '',
  slug: '',
  species: '',
  family: '',
  category: 'MAMIFERO' as Animal['category'],
  habitat: '',
  diet: '',
  lifeExpectancy: '',
  description: '',
  curiosity: '',
  funFact: '',
  behavior: '',
  mainImage: '',
  featured: false,
  active: true,
}

export default function AdminAnimals() {
  usePageMeta('Gerir Animais')
  const [items, setItems] = useState<Animal[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Animal | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [images, setImages] = useState<{ url: string; alt?: string }[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [query, setQuery] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      setItems(await api<Animal[]>('/animals/admin/all'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value })

  const openNew = () => {
    setEditing(null)
    setForm({ ...EMPTY })
    setImages([])
    setError('')
    setOpen(true)
  }

  const openEdit = (a: Animal) => {
    setEditing(a)
    setForm({
      name: a.name,
      slug: a.slug,
      species: a.species,
      family: a.family || '',
      category: a.category,
      habitat: a.habitat || '',
      diet: a.diet || '',
      lifeExpectancy: a.lifeExpectancy || '',
      description: a.description,
      curiosity: a.curiosity || '',
      funFact: a.funFact || '',
      behavior: a.behavior || '',
      mainImage: a.mainImage,
      featured: a.featured,
      active: a.active,
    })
    setImages(a.images.map((i) => ({ url: i.url, alt: i.alt || '' })))
    setError('')
    setOpen(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.species || !form.description) {
      setError('Nome, espécie e descrição são obrigatórios.')
      return
    }
    if (!form.mainImage && images.length === 0) {
      setError('Indique pelo menos uma imagem (mainImage).')
      return
    }
    const payload = {
      ...form,
      slug: form.slug || undefined,
      family: form.family || null,
      habitat: form.habitat || null,
      diet: form.diet || null,
      lifeExpectancy: form.lifeExpectancy || null,
      curiosity: form.curiosity || null,
      funFact: form.funFact || null,
      behavior: form.behavior || null,
      mainImage: form.mainImage || images[0]?.url || '',
      images: images.length ? images : undefined,
    }
    setSaving(true)
    setError('')
    try {
      if (editing) await api(`/animals/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) })
      else await api('/animals', { method: 'POST', body: JSON.stringify(payload) })
      setOpen(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar.')
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (id: string) => {
    await api(`/animals/${id}/toggle`, { method: 'PATCH' })
    await load()
  }

  const remove = async (id: string) => {
    await api(`/animals/${id}`, { method: 'DELETE' })
    await load()
  }

  const filtered = items.filter(
    (a) =>
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.species.toLowerCase().includes(query.toLowerCase())
  )

  if (loading) return <Spinner />

  return (
    <div>
      <PageHead
        title="Gestão de Animais"
        subtitle={`${items.length} animais registados`}
        action={<AddButton onClick={openNew}>Adicionar Animal</AddButton>}
      />

      <div className="mb-4 relative max-w-xs">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-forest-400" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pesquisar…" className="!pl-10" />
      </div>

      <Table head={['Animal', 'Espécie', 'Categoria', 'Estado', 'Ações']}>
        {filtered.map((a) => (
          <tr key={a.id} className="hover:bg-forest-50/50">
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <img src={a.mainImage} alt={a.name} className="h-11 w-11 rounded-xl object-cover" loading="lazy" />
                <span className="font-bold text-forest-900">{a.name}</span>
              </div>
            </td>
            <td className="px-4 py-3 text-forest-800/70">{a.species}</td>
            <td className="px-4 py-3 text-forest-800/70">{CATEGORY_LABELS[a.category]}</td>
            <td className="px-4 py-3">
              <span className={`badge ${a.active ? 'bg-forest-100 text-forest-800' : 'bg-stone-100 text-stone-500'}`}>
                {a.active ? 'Ativo' : 'Inativo'}
              </span>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(a)} className="rounded-lg px-3 py-2 text-xs font-bold text-forest-700 hover:bg-forest-100">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => toggle(a.id)} className="rounded-lg px-3 py-2 text-forest-700 hover:bg-forest-100" title="Ativar/desativar">
                  {a.active ? <ToggleRight className="h-5 w-5 text-forest-600" /> : <ToggleLeft className="h-5 w-5 text-stone-400" />}
                </button>
                <ConfirmDelete onConfirm={() => remove(a.id)} />
              </div>
            </td>
          </tr>
        ))}
      </Table>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Editar Animal' : 'Novo Animal'} wide>
        <form onSubmit={save} className="space-y-4">
          {error && <Notice kind="error">{error}</Notice>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label">Nome *</label>
              <input value={form.name} onChange={update('name')} placeholder="Zeke" />
            </div>
            <div>
              <label className="field-label">Espécie *</label>
              <input value={form.species} onChange={update('species')} placeholder="Zebra-das-Planícies" />
            </div>
            <div>
              <label className="field-label">Família</label>
              <input value={form.family} onChange={update('family')} placeholder="Equídeos" />
            </div>
            <div>
              <label className="field-label">Categoria *</label>
              <select value={form.category} onChange={update('category')}>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Habitat</label>
              <input value={form.habitat} onChange={update('habitat')} />
            </div>
            <div>
              <label className="field-label">Alimentação</label>
              <input value={form.diet} onChange={update('diet')} />
            </div>
            <div>
              <label className="field-label">Expectativa de Vida</label>
              <input value={form.lifeExpectancy} onChange={update('lifeExpectancy')} placeholder="25–30 anos" />
            </div>
            <div>
              <label className="field-label">Slug (URL)</label>
              <input value={form.slug} onChange={update('slug')} placeholder="gerado automaticamente" />
            </div>
          </div>
          <div>
            <label className="field-label">Descrição *</label>
            <textarea rows={4} value={form.description} onChange={update('description')} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label">Curiosidade</label>
              <textarea rows={3} value={form.curiosity} onChange={update('curiosity')} />
            </div>
            <div>
              <label className="field-label">Você Sabia? (facto)</label>
              <textarea rows={3} value={form.funFact} onChange={update('funFact')} />
            </div>
            <div>
              <label className="field-label">Comportamento</label>
              <textarea rows={3} value={form.behavior} onChange={update('behavior')} />
            </div>
            <div>
              <label className="field-label">Imagem Principal (URL)</label>
              <input value={form.mainImage} onChange={update('mainImage')} placeholder="https://…" />
              {form.mainImage && (
                <img src={form.mainImage} alt="" className="mt-2 h-24 rounded-xl object-cover" />
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-forest-100 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wide text-forest-800">
                Galeria do animal
              </span>
              <button
                type="button"
                className="btn-outline !py-1.5 !px-3 !text-xs"
                onClick={() => setImages([...images, { url: '' }])}
              >
                <ImagePlus className="h-3.5 w-3.5" /> Adicionar imagem
              </button>
            </div>
            <div className="space-y-2">
              {images.map((img, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={img.url}
                    onChange={(e) => {
                      const next = [...images]
                      next[i] = { ...next[i], url: e.target.value }
                      setImages(next)
                    }}
                    placeholder="URL da imagem"
                  />
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, x) => x !== i))}
                    className="btn !px-3 !py-2 !text-xs !normal-case bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-6 border-t border-forest-100 pt-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-forest-900">
              <input type="checkbox" checked={form.featured} onChange={update('featured')} className="!w-4 !p-0" />
              Destaque
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-forest-900">
              <input type="checkbox" checked={form.active} onChange={update('active')} className="!w-4 !p-0" />
              Ativo
            </label>
          </div>

          <div className="flex justify-end gap-3 border-t border-forest-100 pt-4">
            <button type="button" onClick={() => setOpen(false)} className="btn-outline !py-2.5">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary !py-2.5">
              {saving ? 'A guardar…' : 'Guardar Animal'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
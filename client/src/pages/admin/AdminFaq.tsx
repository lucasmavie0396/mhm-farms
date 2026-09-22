import { useEffect, useState } from 'react'
import { Pencil, ToggleLeft, ToggleRight } from 'lucide-react'
import { api } from '../../lib/api'
import { usePageMeta } from '../../lib/seo'
import { AddButton, ConfirmDelete, Modal, Notice, PageHead, Table, Spinner } from '../../components/admin'
import type { Faq } from '../../lib/types'

const EMPTY = { question: '', answer: '', category: 'geral', order: '0', active: true }

export default function AdminFaq() {
  usePageMeta('Gerir FAQ')
  const [items, setItems] = useState<Faq[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Faq | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      setItems(await api<Faq[]>('/faqs/admin/all'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const update =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
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

  const openEdit = (f: Faq) => {
    setEditing(f)
    setForm({
      question: f.question,
      answer: f.answer,
      category: f.category,
      order: String(f.order),
      active: f.active,
    })
    setError('')
    setOpen(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.question || !form.answer) {
      setError('Pergunta e resposta são obrigatórias.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = { ...form, order: Number(form.order) || 0 }
      if (editing) await api(`/faqs/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) })
      else await api('/faqs', { method: 'POST', body: JSON.stringify(payload) })
      setOpen(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar.')
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (id: string) => {
    await api(`/faqs/${id}/toggle`, { method: 'PATCH' })
    await load()
  }

  if (loading) return <Spinner />

  return (
    <div>
      <PageHead
        title="Gestão de Perguntas Frequentes"
        subtitle={`${items.length} perguntas`}
        action={<AddButton onClick={openNew}>Nova Pergunta</AddButton>}
      />

      <Table head={['Pergunta', 'Resposta', 'Categoria', 'Ordem', 'Estado', 'Ações']}>
        {items.map((f) => (
          <tr key={f.id} className="hover:bg-forest-50/50">
            <td className="max-w-xs px-4 py-3 font-bold text-forest-900">{f.question}</td>
            <td className="max-w-md truncate px-4 py-3 text-forest-800/70">{f.answer}</td>
            <td className="px-4 py-3 text-forest-800/70">{f.category}</td>
            <td className="px-4 py-3 text-forest-800/70">{f.order}</td>
            <td className="px-4 py-3">
              <span className={`badge ${f.active ? 'bg-forest-100 text-forest-800' : 'bg-stone-100 text-stone-500'}`}>
                {f.active ? 'Ativo' : 'Oculto'}
              </span>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(f)} className="rounded-lg px-3 py-2 text-forest-700 hover:bg-forest-100">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => toggle(f.id)} className="rounded-lg px-3 py-2 text-forest-700 hover:bg-forest-100">
                  {f.active ? <ToggleRight className="h-5 w-5 text-forest-600" /> : <ToggleLeft className="h-5 w-5 text-stone-400" />}
                </button>
                <ConfirmDelete
                  onConfirm={async () => {
                    await api(`/faqs/${f.id}`, { method: 'DELETE' })
                    await load()
                  }}
                />
              </div>
            </td>
          </tr>
        ))}
      </Table>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Editar Pergunta' : 'Nova Pergunta'} wide>
        <form onSubmit={save} className="space-y-4">
          {error && <Notice kind="error">{error}</Notice>}
          <div>
            <label className="field-label">Pergunta *</label>
            <input value={form.question} onChange={update('question')} />
          </div>
          <div>
            <label className="field-label">Resposta *</label>
            <textarea rows={5} value={form.answer} onChange={update('answer')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Categoria</label>
              <select value={form.category} onChange={update('category')}>
                {['geral', 'precos', 'educacao', 'eventos', 'visita'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Ordem</label>
              <input type="number" value={form.order} onChange={update('order')} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-forest-900">
            <input type="checkbox" checked={form.active} onChange={update('active')} className="!w-4 !p-0" /> Visível no site
          </label>
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
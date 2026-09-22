import { useEffect, useState } from 'react'
import { Pencil, ToggleLeft, ToggleRight } from 'lucide-react'
import { api } from '../../lib/api'
import { usePageMeta } from '../../lib/seo'
import { ROLE_LABELS } from '../../lib/settings'
import { AddButton, ConfirmDelete, Modal, Notice, PageHead, Table, Spinner } from '../../components/admin'
import type { Role, User } from '../../lib/types'

const EMPTY = { name: '', email: '', phone: '', password: '', role: 'STAFF' as Role }

export default function AdminUsers() {
  usePageMeta('Utilizadores')
  const [items, setItems] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      setItems(await api<User[]>('/users'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value })

  const openNew = () => {
    setEditing(null)
    setForm({ ...EMPTY })
    setError('')
    setOpen(true)
  }

  const openEdit = (u: User) => {
    setEditing(u)
    setForm({ name: u.name, email: u.email, phone: u.phone || '', password: '', role: u.role })
    setError('')
    setOpen(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email) {
      setError('Nome e email são obrigatórios.')
      return
    }
    if (!editing && (!form.password || form.password.length < 6)) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (editing) {
        const payload: Record<string, unknown> = {
          name: form.name,
          email: form.email,
          phone: form.phone || '',
          role: form.role,
        }
        if (form.password) payload.password = form.password
        await api(`/users/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) })
      } else {
        await api('/users', { method: 'POST', body: JSON.stringify(form) })
      }
      setOpen(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar.')
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (id: string) => {
    await api(`/users/${id}/toggle`, { method: 'PATCH' })
    await load()
  }

  if (loading) return <Spinner />

  return (
    <div>
      <PageHead
        title="Utilizadores do Sistema"
        subtitle={`${items.length} contas`}
        action={<AddButton onClick={openNew}>Novo Utilizador</AddButton>}
      />

      <Table head={['Nome', 'Email', 'Função', 'Estado', 'Ações']}>
        {items.map((u) => (
          <tr key={u.id} className="hover:bg-forest-50/50">
            <td className="px-4 py-3 font-bold text-forest-900">{u.name}</td>
            <td className="px-4 py-3 text-forest-800/70">{u.email}</td>
            <td className="px-4 py-3">
              <span
                className={`badge ${
                  u.role === 'ADMIN' ? 'bg-gold-500 text-forest-950' : u.role === 'MANAGER' ? 'bg-forest-100 text-forest-800' : 'bg-stone-100 text-stone-600'
                }`}
              >
                {ROLE_LABELS[u.role]}
              </span>
            </td>
            <td className="px-4 py-3">
              <span className={`badge ${u.active ? 'bg-forest-100 text-forest-800' : 'bg-red-100 text-red-700'}`}>
                {u.active ? 'Ativo' : 'Inativo'}
              </span>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(u)} className="rounded-lg px-3 py-2 text-forest-700 hover:bg-forest-100">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => toggle(u.id)} className="rounded-lg px-3 py-2 text-forest-700 hover:bg-forest-100">
                  {u.active ? <ToggleRight className="h-5 w-5 text-forest-600" /> : <ToggleLeft className="h-5 w-5 text-stone-400" />}
                </button>
                <ConfirmDelete
                  onConfirm={async () => {
                    await api(`/users/${u.id}`, { method: 'DELETE' })
                    await load()
                  }}
                />
              </div>
            </td>
          </tr>
        ))}
      </Table>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Editar Utilizador' : 'Novo Utilizador'}>
        <form onSubmit={save} className="space-y-4">
          {error && <Notice kind="error">{error}</Notice>}
          <div>
            <label className="field-label">Nome *</label>
            <input value={form.name} onChange={update('name')} />
          </div>
          <div>
            <label className="field-label">Email *</label>
            <input type="email" value={form.email} onChange={update('email')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Telefone</label>
              <input value={form.phone} onChange={update('phone')} />
            </div>
            <div>
              <label className="field-label">Função</label>
              <select value={form.role} onChange={update('role')}>
                <option value="ADMIN">Administrador</option>
                <option value="MANAGER">Gestor</option>
                <option value="STAFF">Funcionário</option>
              </select>
            </div>
          </div>
          <div>
            <label className="field-label">{editing ? 'Nova senha (deixe vazio para manter)' : 'Senha *'}</label>
            <input type="password" value={form.password} onChange={update('password')} placeholder="Mínimo 6 caracteres" />
          </div>
          <div className="flex justify-end gap-3 border-t border-forest-100 pt-4">
            <button type="button" onClick={() => setOpen(false)} className="btn-outline !py-2.5">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary !py-2.5">
              {saving ? 'A guardar…' : 'Guardar Utilizador'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
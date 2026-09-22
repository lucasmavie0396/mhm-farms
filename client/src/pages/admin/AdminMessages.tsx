import { useEffect, useState } from 'react'
import { Mail, MailOpen } from 'lucide-react'
import { api } from '../../lib/api'
import { usePageMeta } from '../../lib/seo'
import { formatDateShort } from '../../lib/settings'
import { STATUS_LABELS, STATUS_STYLES } from '../../components/ui'
import { ConfirmDelete, Modal, PageHead, Table, Spinner, Notice } from '../../components/admin'
import type { ContactMessage } from '../../lib/types'

export default function AdminMessages() {
  usePageMeta('Mensagens')
  const [items, setItems] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ContactMessage | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      setItems(await api<ContactMessage[]>('/contacts/admin/all'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const setStatus = async (id: string, status: string) => {
    await api(`/contacts/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
    setView((v) => (v && v.id === id ? { ...v, status: status as ContactMessage['status'] } : v))
    await load()
  }

  const unread = items.filter((m) => m.status === 'NEW').length

  if (loading) return <Spinner />

  return (
    <div>
      <PageHead title="Mensagens Recebidas" subtitle={`${items.length} mensagens · ${unread} não lidas`} />

      <Table head={['Remetente', 'Assunto', 'Data', 'Estado', 'Ações']}>
        {items.map((m) => (
          <tr key={m.id} className="hover:bg-forest-50/50">
            <td className="px-4 py-3">
              <div className="font-bold text-forest-900">{m.name}</div>
              <div className="text-xs text-forest-800/50">{m.email}{m.phone ? ` · ${m.phone}` : ''}</div>
            </td>
            <td className="px-4 py-3 text-forest-800/70">{m.subject}</td>
            <td className="px-4 py-3 text-forest-800/70">{formatDateShort(m.createdAt)}</td>
            <td className="px-4 py-3">
              <span className={`badge ${STATUS_STYLES[m.status]}`}>{STATUS_LABELS[m.status]}</span>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-1">
                <button onClick={() => setView(m)} className="rounded-lg px-3 py-2 text-forest-700 hover:bg-forest-100" title="Ver">
                  <Mail className="h-4 w-4" />
                </button>
                {m.status !== 'READ' && (
                  <button onClick={() => setStatus(m.id, 'READ')} className="rounded-lg px-3 py-2 text-forest-700 hover:bg-forest-100" title="Marcar como lida">
                    <MailOpen className="h-4 w-4" />
                  </button>
                )}
                <ConfirmDelete
                  onConfirm={async () => {
                    await api(`/contacts/${m.id}`, { method: 'DELETE' })
                    await load()
                  }}
                />
              </div>
            </td>
          </tr>
        ))}
      </Table>

      <Modal open={!!view} onClose={() => setView(null)} title={view?.subject || 'Mensagem'}>
        {view && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-forest-50 p-3">
                <p className="text-[10px] font-extrabold uppercase text-forest-800/50">Nome</p>
                <p className="mt-0.5 text-sm font-semibold text-forest-900">{view.name}</p>
              </div>
              <div className="rounded-xl bg-forest-50 p-3">
                <p className="text-[10px] font-extrabold uppercase text-forest-800/50">Email</p>
                <p className="mt-0.5 text-sm font-semibold text-forest-900">{view.email}</p>
              </div>
              <div className="rounded-xl bg-forest-50 p-3">
                <p className="text-[10px] font-extrabold uppercase text-forest-800/50">Telefone</p>
                <p className="mt-0.5 text-sm font-semibold text-forest-900">{view.phone || '—'}</p>
              </div>
              <div className="rounded-xl bg-forest-50 p-3">
                <p className="text-[10px] font-extrabold uppercase text-forest-800/50">Data</p>
                <p className="mt-0.5 text-sm font-semibold text-forest-900">{formatDateShort(view.createdAt)}</p>
              </div>
            </div>
            <div className="rounded-xl border border-forest-100 p-4 text-sm leading-relaxed text-forest-900 whitespace-pre-line">
              {view.message}
            </div>
            <div className="flex justify-end gap-3 border-t border-forest-100 pt-4">
              {view.status !== 'READ' && (
                <button onClick={() => setStatus(view.id, 'READ')} className="btn-outline !py-2.5">Marcar como lida</button>
              )}
              <a href={`mailto:${view.email}?subject=Re: ${view.subject}`} className="btn-primary !py-2.5">
                Responder por email
              </a>
            </div>
            {view.status === 'NEW' && <Notice kind="info">Esta mensagem ainda não foi lida.</Notice>}
          </div>
        )}
      </Modal>
    </div>
  )
}
import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { usePageMeta } from '../../lib/seo'
import { formatDateShort } from '../../lib/settings'
import { ConfirmDelete, PageHead, Table, Spinner } from '../../components/admin'
import type { SchoolVisit } from '../../lib/types'

const STATUS_MAP: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Concluída',
}

export default function AdminSchoolVisits() {
  usePageMeta('Visitas Escolares')
  const [items, setItems] = useState<SchoolVisit[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      setItems(await api<SchoolVisit[]>('/school-visits/admin/all'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const setStatus = async (id: string, status: string) => {
    await api(`/school-visits/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
    await load()
  }

  if (loading) return <Spinner />

  return (
    <div>
      <PageHead title="Visitas Escolares" subtitle={`${items.length} pedidos`} />
      <Table head={['Escola', 'Professor', 'Alunos', 'Data Preferida', 'Nível', 'Estado', 'Ações']}>
        {items.map((v) => (
          <tr key={v.id} className="hover:bg-forest-50/50">
            <td className="px-4 py-3 font-bold text-forest-900">{v.schoolName}</td>
            <td className="px-4 py-3 text-forest-800/70">
              <div>{v.teacherName}</div>
              <div className="text-xs text-forest-800/50">{v.email}</div>
            </td>
            <td className="px-4 py-3 text-forest-800/70">{v.numStudents} + {v.numTeachers}</td>
            <td className="px-4 py-3 text-forest-800/70">{v.preferredDate ? formatDateShort(v.preferredDate) : '—'}</td>
            <td className="px-4 py-3 text-forest-800/70">{v.schoolLevel || '—'}</td>
            <td className="px-4 py-3">
              <select
                value={v.status}
                onChange={(e) => setStatus(v.id, e.target.value)}
                className="!w-40 !py-1.5 !text-xs"
              >
                {Object.entries(STATUS_MAP).map(([k, label]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </select>
            </td>
            <td className="px-4 py-3">
              <ConfirmDelete
                onConfirm={async () => {
                  await api(`/school-visits/${v.id}`, { method: 'DELETE' })
                  await load()
                }}
              />
            </td>
          </tr>
        ))}
      </Table>
    </div>
  )
}
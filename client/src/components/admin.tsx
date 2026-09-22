import { useEffect, useState, type ReactNode } from 'react'
import { AlertTriangle, Plus, Trash2, X } from 'lucide-react'

export function PageHead({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-forest-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-forest-800/60">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} className="btn-primary !py-2.5">
      <Plus className="h-4 w-4" /> {children}
    </button>
  )
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-md ring-1 ring-forest-100">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-forest-800 text-white">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-4 py-3 text-xs font-extrabold uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-forest-50">{children}</tbody>
      </table>
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-forest-950/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`my-8 w-full ${wide ? 'max-w-3xl' : 'max-w-xl'} rounded-3xl bg-white shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-forest-100 px-6 py-4">
          <h2 className="font-display text-lg font-bold text-forest-900">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-forest-600 hover:bg-forest-100" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  )
}

export function ConfirmDelete({ onConfirm, label = 'Eliminar' }: { onConfirm: () => void; label?: string }) {
  const [arm, setArm] = useState(false)
  const [timeoutId, setTimeoutId] = useState<number | null>(null)
  return (
    <button
      onClick={() => {
        if (!arm) {
          setArm(true)
          const id = window.setTimeout(() => {
            setArm(false)
            setTimeoutId(null)
          }, 2500)
          setTimeoutId(id)
        } else {
          if (timeoutId) window.clearTimeout(timeoutId)
          onConfirm()
        }
      }}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
        !arm ? 'text-red-600 hover:bg-red-50' : 'bg-red-600 text-white hover:bg-red-700'
      }`}
      title={!arm ? label : 'Confirmar?'}
    >
      <Trash2 className="h-4 w-4" />
      {!arm ? label : 'Confirmar!'}
    </button>
  )
}

export function Notice({ kind, children }: { kind: 'info' | 'error' | 'success'; children: ReactNode }) {
  const styles = {
    info: 'bg-forest-50 text-forest-800 ring-forest-200',
    error: 'bg-red-50 text-red-700 ring-red-200',
    success: 'bg-forest-100 text-forest-800 ring-forest-200',
  }
  return (
    <p className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ring-1 ${styles[kind]}`}>
      <AlertTriangle className="h-4 w-4 shrink-0" /> {children}
    </p>
  )
}

export function Spinner() {
  return (
    <div className="grid min-h-[30vh] place-items-center text-forest-600">
      <span className="h-9 w-9 animate-spin rounded-full border-4 border-forest-200 border-t-forest-600" />
    </div>
  )
}
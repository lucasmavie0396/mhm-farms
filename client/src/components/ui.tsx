import { type ReactNode, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

export function SectionTitle({
  kicker,
  title,
  subtitle,
  center = true,
}: {
  kicker: string
  title: string
  subtitle?: string
  center?: boolean
}) {
  return (
    <div className={`mb-10 ${center ? 'text-center' : 'text-left'}`}>
      <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.25em] text-gold-600">
        {kicker}
      </p>
      <h2 className="font-display text-3xl font-bold text-forest-900 sm:text-4xl lg:text-[2.6rem] lg:leading-tight">
        {title}
      </h2>
      {subtitle && <p className="mx-auto mt-4 max-w-2xl text-forest-800/70">{subtitle}</p>}
    </div>
  )
}

export function Loading({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-forest-700">
      <Loader2 className="h-10 w-10 animate-spin text-forest-600" />
      <p className="text-sm font-semibold">{label || 'A carregar…'}</p>
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-forest-200 bg-white py-16 text-center">
      <span className="text-4xl">🌿</span>
      <p className="text-sm font-semibold text-forest-800/60">{message}</p>
    </div>
  )
}

export function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal:not(.visible)')
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible')
            obs.unobserve(e.target)
          }
        })
      },
      { threshold: 0.1 }
    )
    els.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])
  return (
    <div className={`reveal ${className}`} style={{ transitionDelay: '80ms' }}>
      {children}
    </div>
  )
}

export function Stars({ rating, className = '' }: { rating: number; className?: string }) {
  return (
    <div className={`flex gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rating ? 'text-gold-500' : 'text-forest-200'}>
          ★
        </span>
      ))}
    </div>
  )
}

export const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-forest-100 text-forest-800',
  CANCELLED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  NEW: 'bg-amber-100 text-amber-800',
  READ: 'bg-forest-100 text-forest-800',
  ARCHIVED: 'bg-stone-200 text-stone-600',
}

export const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Concluída',
  NEW: 'Nova',
  READ: 'Lida',
  ARCHIVED: 'Arquivada',
}
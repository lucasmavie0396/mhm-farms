import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

export interface LightboxItem {
  url: string
  title?: string | null
  type?: 'IMAGE' | 'VIDEO'
  videoUrl?: string | null
}

export function Lightbox({
  items,
  index,
  onClose,
  onNavigate,
}: {
  items: LightboxItem[]
  index: number
  onClose: () => void
  onNavigate?: (next: number) => void
}) {
  const [idx, setIdx] = useState(index)

  useEffect(() => setIdx(index), [index])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [idx, items.length])

  const go = (dir: number) => {
    const next = (idx + dir + items.length) % items.length
    setIdx(next)
    onNavigate?.(next)
  }

  if (items.length === 0) return null
  const item = items[idx]
  const isVideo = item.type === 'VIDEO'

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-forest-950/95 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20"
        onClick={onClose}
        aria-label="Fechar"
      >
        <X className="h-6 w-6" />
      </button>
      <button
        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20"
        onClick={(e) => {
          e.stopPropagation()
          go(-1)
        }}
        aria-label="Anterior"
      >
        <ChevronLeft className="h-7 w-7" />
      </button>
      <button
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20"
        onClick={(e) => {
          e.stopPropagation()
          go(1)
        }}
        aria-label="Seguinte"
      >
        <ChevronRight className="h-7 w-7" />
      </button>
      <figure
        className="max-h-full max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        {isVideo && item.videoUrl ? (
          <video src={item.videoUrl} controls autoPlay className="max-h-[80vh] rounded-2xl" />
        ) : (
          <img
            src={item.url}
            alt={item.title || ''}
            className="max-h-[82vh] max-w-full rounded-2xl object-contain"
          />
        )}
        {item.title && (
          <figcaption className="mt-3 text-center text-sm font-semibold text-white/80">
            {item.title} — {idx + 1} / {items.length}
          </figcaption>
        )}
      </figure>
    </div>
  )
}
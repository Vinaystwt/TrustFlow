'use client'

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, XCircle, Info, Loader2, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'loading'

interface ToastItem {
  id: number
  type: ToastType
  message: string
  href?: string
  hrefLabel?: string
}

interface ToastContextValue {
  toast: (opts: Omit<ToastItem, 'id'>) => number
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const ICONS: Record<ToastType, ReactNode> = {
  success: <CheckCircle2 size={18} className="text-trust-progress" />,
  error: <XCircle size={18} className="text-trust-danger" />,
  info: <Info size={18} className="text-trust-accent" />,
  loading: <Loader2 size={18} className="animate-spin text-trust-accent" />,
}

const BORDER: Record<ToastType, string> = {
  success: 'border-l-trust-progress',
  error: 'border-l-trust-danger',
  info: 'border-l-trust-accent',
  loading: 'border-l-trust-accent',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (opts: Omit<ToastItem, 'id'>) => {
      const id = ++counter.current
      setItems((prev) => [...prev, { ...opts, id }])
      if (opts.type !== 'loading') {
        setTimeout(() => dismiss(id), 5000)
      }
      return id
    },
    [dismiss]
  )

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex w-[min(92vw,360px)] flex-col gap-2">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 24, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.96 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`card card flex items-start gap-3 border-l-2 ${BORDER[t.type]} p-3.5 shadow-lg`}
            >
              <span className="mt-0.5 shrink-0">{ICONS[t.type]}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-trust-text">{t.message}</p>
                {t.href && (
                  <a
                    href={t.href}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block font-mono text-xs text-trust-accent hover:underline"
                  >
                    {t.hrefLabel || 'View transaction →'}
                  </a>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 text-trust-text-dim transition-colors hover:text-trust-text"
                aria-label="Dismiss"
              >
                <X size={15} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

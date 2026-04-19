import { useEffect } from 'react'

export default function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className={`animate-slide-in bg-navy-850 border border-navy-700 rounded-2xl shadow-2xl flex flex-col ${wide ? 'w-full max-w-3xl' : 'w-full max-w-lg'} max-h-[90vh]`}
        style={{ background: '#0d1e35' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-700 flex-shrink-0">
          <h3 className="font-display font-bold text-white text-lg">{title}</h3>
          <button onClick={onClose}
            className="text-slate-500 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-navy-700 transition-colors text-lg">
            ✕
          </button>
        </div>
        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  )
}

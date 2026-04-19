export default function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay">
      <div className="animate-slide-in bg-navy-850 border border-navy-700 rounded-2xl shadow-2xl p-6 w-full max-w-sm"
        style={{ background: '#0d1e35' }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-red-900/30 border border-red-800/50 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-xl">⚠</span>
          </div>
          <h3 className="font-display font-bold text-white text-lg mb-2">Confirm Delete</h3>
          <p className="text-slate-400 text-sm">{message || 'Are you sure you want to delete this record? This action cannot be undone.'}</p>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={onConfirm} className="flex-1 justify-center bg-red-700 hover:bg-red-600 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm flex items-center cursor-pointer">
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

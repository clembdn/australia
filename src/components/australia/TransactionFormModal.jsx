import { useState, useEffect } from 'react'
import { X, Save, Trash2, AlertCircle } from 'lucide-react'
import CategoryBadge, { getCategoryConfig } from './CategoryBadge.jsx'

const CATEGORIES = [
  'housing', 'food', 'transport', 'admin', 'travel',
  'health', 'income', 'leisure', 'emergency', 'other',
]

const EMPTY_FORM = {
  title: '',
  amountEUR: '',
  type: 'expense',
  recurrence: 'one-off',
  category: 'other',
  date: new Date().toISOString().slice(0, 10),
  endDate: '',
  notes: '',
}

export default function TransactionFormModal({ isOpen, onClose, onSave, onDelete, transaction }) {
  const isEditing = !!transaction
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (transaction) {
      setForm({
        title: transaction.title,
        amountEUR: transaction.amountEUR,
        type: transaction.type,
        recurrence: transaction.recurrence,
        category: transaction.category,
        date: transaction.date,
        endDate: transaction.endDate || '',
        notes: transaction.notes || '',
      })
    } else {
      setForm(EMPTY_FORM)
    }
    setErrors({})
    setShowDeleteConfirm(false)
  }, [transaction, isOpen])

  if (!isOpen) return null

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Le titre est requis'
    if (!form.amountEUR || Number(form.amountEUR) <= 0) errs.amountEUR = 'Le montant doit être supérieur à 0'
    if (!form.date) errs.date = 'La date est requise'
    if (form.recurrence === 'monthly' && form.endDate && form.endDate < form.date) {
      errs.endDate = 'La date de fin doit être après la date de début'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    const now = new Date().toISOString()
    const txData = {
      ...(transaction || {}),
      id: transaction?.id || `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: form.title.trim(),
      amountEUR: Number(form.amountEUR),
      type: form.type,
      recurrence: form.recurrence,
      category: form.category,
      date: form.date,
      endDate: form.recurrence === 'monthly' && form.endDate ? form.endDate : null,
      notes: form.notes.trim() || null,
      isActive: transaction?.isActive ?? true,
      createdAt: transaction?.createdAt || now,
      updatedAt: now,
    }
    onSave(txData)
  }

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete(transaction.id)
      onClose()
    } else {
      setShowDeleteConfirm(true)
    }
  }

  const set = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-bg-card border border-border-subtle rounded-2xl shadow-2xl animate-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <h2 className="text-lg font-semibold">
            {isEditing ? 'Modifier la transaction' : 'Nouvelle transaction'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="text-xs text-text-muted mb-1.5 block font-medium uppercase tracking-wider">
              Titre *
            </label>
            <input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Ex : Loyer, Visa, Bourse…"
              className={`h-10 w-full rounded-xl bg-bg-elevated border px-3 text-sm outline-none transition-colors
                ${errors.title ? 'border-danger focus:border-danger' : 'border-border-subtle focus:border-brand'}`}
            />
            {errors.title && (
              <p className="text-xs text-danger mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.title}
              </p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs text-text-muted mb-1.5 block font-medium uppercase tracking-wider">
              Montant (EUR) *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.amountEUR}
              onChange={(e) => set('amountEUR', e.target.value)}
              placeholder="0"
              className={`h-10 w-full rounded-xl bg-bg-elevated border px-3 text-sm outline-none tabular-nums transition-colors
                ${errors.amountEUR ? 'border-danger focus:border-danger' : 'border-border-subtle focus:border-brand'}`}
            />
            {errors.amountEUR && (
              <p className="text-xs text-danger mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.amountEUR}
              </p>
            )}
          </div>

          {/* Type toggle */}
          <div>
            <label className="text-xs text-text-muted mb-1.5 block font-medium uppercase tracking-wider">
              Type
            </label>
            <div className="flex p-0.5 rounded-xl bg-bg-elevated border border-border-subtle">
              <button
                onClick={() => set('type', 'expense')}
                className={`flex-1 h-9 rounded-lg text-sm font-medium transition-all ${
                  form.type === 'expense'
                    ? 'bg-danger/20 text-danger shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Dépense
              </button>
              <button
                onClick={() => set('type', 'income')}
                className={`flex-1 h-9 rounded-lg text-sm font-medium transition-all ${
                  form.type === 'income'
                    ? 'bg-success/20 text-success shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Revenu
              </button>
            </div>
          </div>

          {/* Recurrence toggle */}
          <div>
            <label className="text-xs text-text-muted mb-1.5 block font-medium uppercase tracking-wider">
              Récurrence
            </label>
            <div className="flex p-0.5 rounded-xl bg-bg-elevated border border-border-subtle">
              <button
                onClick={() => set('recurrence', 'one-off')}
                className={`flex-1 h-9 rounded-lg text-sm font-medium transition-all ${
                  form.recurrence === 'one-off'
                    ? 'bg-brand/20 text-brand-glow shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Occasionnel
              </button>
              <button
                onClick={() => set('recurrence', 'monthly')}
                className={`flex-1 h-9 rounded-lg text-sm font-medium transition-all ${
                  form.recurrence === 'monthly'
                    ? 'bg-brand/20 text-brand-glow shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Mensuel
              </button>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs text-text-muted mb-1.5 block font-medium uppercase tracking-wider">
              Catégorie
            </label>
            <div className="grid grid-cols-5 gap-2">
              {CATEGORIES.map((cat) => {
                const config = getCategoryConfig(cat)
                const Icon = config.icon
                const isSelected = form.category === cat
                return (
                  <button
                    key={cat}
                    onClick={() => set('category', cat)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs transition-all ${
                      isSelected
                        ? `${config.bg} ${config.text} ${config.border} ring-1 ring-current/20`
                        : 'border-border-subtle bg-bg-elevated text-text-muted hover:text-text-secondary hover:border-border-strong'
                    }`}
                    title={config.label}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="truncate w-full text-center text-[10px]">{config.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted mb-1.5 block font-medium uppercase tracking-wider">
                {form.recurrence === 'monthly' ? 'Date de début *' : 'Date *'}
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set('date', e.target.value)}
                className={`h-10 w-full rounded-xl bg-bg-elevated border px-3 text-sm outline-none text-text-primary transition-colors
                  ${errors.date ? 'border-danger focus:border-danger' : 'border-border-subtle focus:border-brand'}`}
              />
              {errors.date && (
                <p className="text-xs text-danger mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.date}
                </p>
              )}
            </div>

            {form.recurrence === 'monthly' && (
              <div>
                <label className="text-xs text-text-muted mb-1.5 block font-medium uppercase tracking-wider">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => set('endDate', e.target.value)}
                  className={`h-10 w-full rounded-xl bg-bg-elevated border px-3 text-sm outline-none text-text-primary transition-colors
                    ${errors.endDate ? 'border-danger focus:border-danger' : 'border-border-subtle focus:border-brand'}`}
                />
                {errors.endDate && (
                  <p className="text-xs text-danger mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.endDate}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-text-muted mb-1.5 block font-medium uppercase tracking-wider">
              Notes (optionnel)
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Détails supplémentaires…"
              rows={2}
              className="w-full rounded-xl bg-bg-elevated border border-border-subtle px-3 py-2 text-sm outline-none focus:border-brand resize-none transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border-subtle">
          <div>
            {isEditing && (
              <button
                onClick={handleDelete}
                className={`inline-flex items-center gap-1.5 px-3 h-9 rounded-xl text-sm font-medium transition-all ${
                  showDeleteConfirm
                    ? 'bg-danger text-white'
                    : 'text-danger/70 hover:text-danger hover:bg-danger/10'
                }`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                {showDeleteConfirm ? 'Confirmer la suppression' : 'Supprimer'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 h-9 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary bg-bg-elevated border border-border-subtle hover:border-border-strong transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              className="inline-flex items-center gap-1.5 px-5 h-9 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand/90 shadow-glow transition-all"
            >
              <Save className="h-3.5 w-3.5" />
              {isEditing ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

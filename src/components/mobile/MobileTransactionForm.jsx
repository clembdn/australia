import { useState, useEffect } from 'react'
import { Save, Trash2, AlertCircle, User, ArrowLeftRight } from 'lucide-react'
import { getCategoryConfig } from '../australia/CategoryBadge.jsx'
import { FINAUZI_PEOPLE } from '../../config/people.js'
import { CURRENCY_RATES } from '../../context/CurrencyContext.jsx'

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
  personUid: '',
}

const TRANSACTION_CURRENCIES = ['EUR', 'AUD']
const AUD_RATE = CURRENCY_RATES.AUD.rate

function formatDateFr(dateValue) {
  if (!dateValue) return ''
  const date = new Date(`${dateValue}T00:00:00`)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

/**
 * Mobile-optimized transaction form with person attribution.
 */
export default function MobileTransactionForm({ transaction, onSave, onDelete, onClose, currentUserUid }) {
  const isEditing = !!transaction
  const [form, setForm] = useState(EMPTY_FORM)
  const [amountCurrency, setAmountCurrency] = useState('EUR')
  const [errors, setErrors] = useState({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    const fallbackPersonUid = currentUserUid || FINAUZI_PEOPLE[0]?.uid || ''
    const initialAmount = transaction?.amountEUR != null ? String(transaction.amountEUR) : ''
    if (transaction) {
      setForm({
        title: transaction.title,
        amountEUR: initialAmount,
        type: transaction.type,
        recurrence: transaction.recurrence,
        category: transaction.category,
        date: transaction.date,
        endDate: transaction.endDate || '',
        notes: transaction.notes || '',
        personUid: transaction.personUid || fallbackPersonUid,
      })
    } else {
      setForm({ ...EMPTY_FORM, personUid: fallbackPersonUid, amountEUR: '' })
    }
    setAmountCurrency('EUR')
    setErrors({})
    setShowDeleteConfirm(false)
  }, [transaction, currentUserUid])

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Titre requis'
    if (!form.amountEUR || Number(form.amountEUR) <= 0) errs.amountEUR = 'Montant invalide'
    if (!form.date) errs.date = 'Date requise'
    if (!form.personUid) errs.personUid = 'Personne requise'
    if (form.recurrence === 'monthly' && form.endDate && form.endDate < form.date) {
      errs.endDate = 'Date de fin invalide'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    const parsedAmount = Number(form.amountEUR)
    const amountInEUR = amountCurrency === 'EUR' ? parsedAmount : parsedAmount / AUD_RATE
    const now = new Date().toISOString()
    await onSave({
      ...(transaction || {}),
      id: transaction?.id || undefined,
      title: form.title.trim(),
      amountEUR: Number(amountInEUR.toFixed(2)),
      type: form.type,
      recurrence: form.recurrence,
      category: form.category,
      date: form.date,
      endDate: form.recurrence === 'monthly' && form.endDate ? form.endDate : null,
      notes: form.notes.trim() || null,
      isActive: transaction?.isActive ?? true,
      personUid: form.personUid,
      createdAt: transaction?.createdAt || now,
      updatedAt: now,
    })
  }

  const handleDelete = async () => {
    if (showDeleteConfirm) {
      await onDelete(transaction.id)
    } else {
      setShowDeleteConfirm(true)
    }
  }

  const set = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  const setAmountCurrencyWithConversion = (nextCurrency) => {
    setAmountCurrency((prevCurrency) => {
      if (prevCurrency === nextCurrency) return prevCurrency

      setForm((prevForm) => {
        const raw = Number(prevForm.amountEUR)
        if (!prevForm.amountEUR || Number.isNaN(raw)) return prevForm
        const converted = prevCurrency === 'EUR' ? raw * AUD_RATE : raw / AUD_RATE
        return { ...prevForm, amountEUR: String(Number(converted.toFixed(2))) }
      })

      return nextCurrency
    })
  }

  return (
    <div className="space-y-5 pb-6">
      {/* Title */}
      <div>
        <label className="text-[11px] text-text-muted font-medium uppercase tracking-wider block mb-2">Titre</label>
        <input
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="Ex : Loyer, Visa, Bourse…"
          className={`h-12 w-full rounded-2xl bg-bg-elevated border px-4 text-sm outline-none transition-colors ${
            errors.title ? 'border-rose-500' : 'border-border-subtle focus:border-brand'
          }`}
        />
        {errors.title && <ErrorMsg>{errors.title}</ErrorMsg>}
      </div>

      {/* Amount */}
      <div>
        <label className="text-[11px] text-text-muted font-medium uppercase tracking-wider block mb-2">Montant ({amountCurrency})</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setAmountCurrencyWithConversion(amountCurrency === 'EUR' ? 'AUD' : 'EUR')}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-text-muted hover:text-brand-glow hover:bg-brand/10 transition-colors"
            title="Convertir EUR/AUD"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={form.amountEUR}
            onChange={(e) => set('amountEUR', e.target.value)}
            placeholder="0"
            className={`h-12 w-full rounded-2xl bg-bg-elevated border pl-12 pr-[94px] text-sm outline-none tabular-nums transition-colors ${
              errors.amountEUR ? 'border-rose-500' : 'border-border-subtle focus:border-brand'
            }`}
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1 p-0.5 rounded-lg border border-border-subtle bg-bg-card/80">
            {TRANSACTION_CURRENCIES.map((currency) => (
              <button
                key={currency}
                type="button"
                onClick={() => setAmountCurrencyWithConversion(currency)}
                className={`h-7 px-2 rounded-md text-[10px] font-semibold transition-colors ${
                  amountCurrency === currency
                    ? 'bg-brand/20 text-brand-glow'
                    : 'text-text-muted'
                }`}
              >
                {currency}
              </button>
            ))}
          </div>
        </div>
        {errors.amountEUR && <ErrorMsg>{errors.amountEUR}</ErrorMsg>}
      </div>

      {/* Person selector */}
      <div>
        <label className="text-[11px] text-text-muted font-medium uppercase tracking-wider block mb-2">Personne</label>
        <div className="flex p-1 rounded-2xl bg-bg-elevated border border-border-subtle">
          {FINAUZI_PEOPLE.map(person => (
            <button
              key={person.uid}
              onClick={() => set('personUid', person.uid)}
              className={`flex-1 h-11 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                form.personUid === person.uid
                  ? `${person.bg} ${person.text} shadow-sm`
                  : 'text-text-muted'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              {person.label}
            </button>
          ))}
        </div>
        {errors.personUid && <ErrorMsg>{errors.personUid}</ErrorMsg>}
      </div>

      {/* Type toggle */}
      <div>
        <label className="text-[11px] text-text-muted font-medium uppercase tracking-wider block mb-2">Type</label>
        <div className="flex p-1 rounded-2xl bg-bg-elevated border border-border-subtle">
          <button
            onClick={() => set('type', 'expense')}
            className={`flex-1 h-11 rounded-xl text-sm font-medium transition-all ${
              form.type === 'expense' ? 'bg-rose-500/20 text-rose-400 shadow-sm' : 'text-text-muted'
            }`}
          >
            Dépense
          </button>
          <button
            onClick={() => set('type', 'income')}
            className={`flex-1 h-11 rounded-xl text-sm font-medium transition-all ${
              form.type === 'income' ? 'bg-emerald-500/20 text-emerald-400 shadow-sm' : 'text-text-muted'
            }`}
          >
            Revenu
          </button>
        </div>
      </div>

      {/* Recurrence toggle */}
      <div>
        <label className="text-[11px] text-text-muted font-medium uppercase tracking-wider block mb-2">Récurrence</label>
        <div className="flex p-1 rounded-2xl bg-bg-elevated border border-border-subtle">
          <button
            onClick={() => set('recurrence', 'one-off')}
            className={`flex-1 h-11 rounded-xl text-sm font-medium transition-all ${
              form.recurrence === 'one-off' ? 'bg-brand/20 text-brand-glow shadow-sm' : 'text-text-muted'
            }`}
          >
            Occasionnel
          </button>
          <button
            onClick={() => set('recurrence', 'monthly')}
            className={`flex-1 h-11 rounded-xl text-sm font-medium transition-all ${
              form.recurrence === 'monthly' ? 'bg-brand/20 text-brand-glow shadow-sm' : 'text-text-muted'
            }`}
          >
            Mensuel
          </button>
        </div>
      </div>

      {/* Category chips */}
      <div>
        <label className="text-[11px] text-text-muted font-medium uppercase tracking-wider block mb-2">Catégorie</label>
        <div className="grid grid-cols-5 gap-2">
          {CATEGORIES.map((cat) => {
            const config = getCategoryConfig(cat)
            const Icon = config.icon
            const isSelected = form.category === cat
            return (
              <button
                key={cat}
                onClick={() => set('category', cat)}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-[10px] transition-all active:scale-95 ${
                  isSelected
                    ? `${config.bg} ${config.text} ${config.border} ring-1 ring-current/20`
                    : 'border-border-subtle bg-bg-elevated text-text-muted'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="truncate w-full text-center">{config.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Date fields */}
      <div className={`grid gap-3 ${form.recurrence === 'monthly' ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <div>
          <label className="text-[11px] text-text-muted font-medium uppercase tracking-wider block mb-2">
            {form.recurrence === 'monthly' ? 'Départ' : 'Date'}
          </label>
          <input
            type="date"
            lang="fr-FR"
            value={form.date}
            onChange={(e) => set('date', e.target.value)}
            className={`h-12 w-full rounded-2xl bg-bg-elevated border px-4 text-sm outline-none text-text-primary transition-colors ${
              errors.date ? 'border-rose-500' : 'border-border-subtle focus:border-brand'
            }`}
          />
          {!errors.date && form.date && (
            <p className="text-[11px] text-text-muted mt-1.5 capitalize">{formatDateFr(form.date)}</p>
          )}
          {errors.date && <ErrorMsg>{errors.date}</ErrorMsg>}
        </div>
        {form.recurrence === 'monthly' && (
          <div>
            <label className="text-[11px] text-text-muted font-medium uppercase tracking-wider block mb-2">Retour</label>
            <input
              type="date"
              lang="fr-FR"
              value={form.endDate}
              onChange={(e) => set('endDate', e.target.value)}
              className={`h-12 w-full rounded-2xl bg-bg-elevated border px-4 text-sm outline-none text-text-primary transition-colors ${
                errors.endDate ? 'border-rose-500' : 'border-border-subtle focus:border-brand'
              }`}
            />
            {!errors.endDate && form.endDate && (
              <p className="text-[11px] text-text-muted mt-1.5 capitalize">{formatDateFr(form.endDate)}</p>
            )}
            {errors.endDate && <ErrorMsg>{errors.endDate}</ErrorMsg>}
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="text-[11px] text-text-muted font-medium uppercase tracking-wider block mb-2">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Détails supplémentaires…"
          rows={2}
          className="w-full rounded-2xl bg-bg-elevated border border-border-subtle px-4 py-3 text-sm outline-none focus:border-brand resize-none transition-colors"
        />
      </div>

      {/* Actions */}
      <div className="space-y-2 pt-2">
        <button
          onClick={handleSubmit}
          className="w-full h-12 rounded-2xl bg-brand text-white text-sm font-semibold shadow-glow transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isEditing ? 'Enregistrer' : 'Ajouter la transaction'}
        </button>

        {isEditing && (
          <button
            onClick={handleDelete}
            className={`w-full h-11 rounded-2xl text-sm font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
              showDeleteConfirm
                ? 'bg-rose-500 text-white'
                : 'bg-bg-elevated border border-border-subtle text-rose-400'
            }`}
          >
            <Trash2 className="h-4 w-4" />
            {showDeleteConfirm ? 'Confirmer la suppression' : 'Supprimer'}
          </button>
        )}

        <button
          onClick={onClose}
          className="w-full h-11 rounded-2xl text-sm text-text-muted transition-all active:scale-[0.98]"
        >
          Annuler
        </button>
      </div>
    </div>
  )
}

function ErrorMsg({ children }) {
  return (
    <p className="text-[11px] text-rose-400 mt-1.5 flex items-center gap-1">
      <AlertCircle className="h-3 w-3" /> {children}
    </p>
  )
}

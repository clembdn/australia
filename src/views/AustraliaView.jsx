import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Plane, Calendar, Plus, RefreshCw, ArrowUpDown,
  TrendingUp, Wallet, Timer, ArrowDownCircle,
} from 'lucide-react'
import { useCurrency } from '../context/CurrencyContext.jsx'
import { defaultTransactions } from '../data/defaultTransactions.js'
import {
  getForecastData,
  getMonthlyNetCashflow,
  getRunway,
  getLowestBalance,
  getFinalProjectedCapital,
  getHealthStatus,
} from '../utils/cashflow.js'

import SummaryCard from '../components/australia/SummaryCard.jsx'
import WarningBanner from '../components/australia/WarningBanner.jsx'
import ForecastChart from '../components/australia/ForecastChart.jsx'
import TransactionFormModal from '../components/australia/TransactionFormModal.jsx'
import TransactionRow from '../components/australia/TransactionRow.jsx'
import SafetyBufferControl from '../components/australia/SafetyBufferControl.jsx'

// ─── Constants ───
const TX_STORAGE_KEY = 'atlas_finance_mission_australie_transactions'
const SETTINGS_STORAGE_KEY = 'atlas_finance_mission_australie_settings'
const DEFAULT_INITIAL_CAPITAL = 10000
const DEFAULT_SAFETY_BUFFER = 1500

// ─── Persistence helpers ───
function loadTransactions() {
  try {
    const raw = localStorage.getItem(TX_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

function saveTransactions(txs) {
  try {
    localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(txs))
  } catch {}
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch {}
}

// ─── Main View ───
export default function AustraliaView() {
  const { format } = useCurrency()

  // State: transactions
  const [transactions, setTransactions] = useState(() => {
    return loadTransactions() || [...defaultTransactions]
  })

  // State: settings (safety buffer, initial capital)
  const [settings, setSettings] = useState(() => {
    return loadSettings() || {
      safetyBuffer: DEFAULT_SAFETY_BUFFER,
      initialCapital: DEFAULT_INITIAL_CAPITAL,
    }
  })

  // State: modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTx, setEditingTx] = useState(null)

  // Persist on change
  useEffect(() => saveTransactions(transactions), [transactions])
  useEffect(() => saveSettings(settings), [settings])

  // ─── Transaction CRUD ───
  const handleSave = useCallback((tx) => {
    setTransactions(prev => {
      const idx = prev.findIndex(t => t.id === tx.id)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = tx
        return updated
      }
      return [...prev, tx]
    })
    setModalOpen(false)
    setEditingTx(null)
  }, [])

  const handleDelete = useCallback((id) => {
    setTransactions(prev => prev.filter(t => t.id !== id))
    setModalOpen(false)
    setEditingTx(null)
  }, [])

  const handleTogglePause = useCallback((id) => {
    setTransactions(prev =>
      prev.map(t => t.id === id ? { ...t, isActive: !t.isActive, updatedAt: new Date().toISOString() } : t)
    )
  }, [])

  const openCreateModal = () => {
    setEditingTx(null)
    setModalOpen(true)
  }

  const openEditModal = (tx) => {
    setEditingTx(tx)
    setModalOpen(true)
  }

  // ─── Derived Data ───
  const recurringTxs = useMemo(
    () => transactions.filter(t => t.recurrence === 'monthly').sort((a, b) => {
      // Sort incomes first, then by title
      if (a.type !== b.type) return a.type === 'income' ? -1 : 1
      return a.title.localeCompare(b.title)
    }),
    [transactions]
  )

  const oneOffTxs = useMemo(
    () => transactions.filter(t => t.recurrence === 'one-off').sort((a, b) => {
      return new Date(a.date) - new Date(b.date)
    }),
    [transactions]
  )

  const forecastData = useMemo(
    () => getForecastData(transactions, settings.initialCapital),
    [transactions, settings.initialCapital]
  )

  const monthlyCashflow = useMemo(
    () => getMonthlyNetCashflow(transactions),
    [transactions]
  )

  const runway = useMemo(() => getRunway(forecastData), [forecastData])
  const lowestBalance = useMemo(() => getLowestBalance(forecastData), [forecastData])
  const finalCapital = useMemo(() => getFinalProjectedCapital(forecastData), [forecastData])
  const healthStatus = useMemo(
    () => getHealthStatus(forecastData, settings.safetyBuffer),
    [forecastData, settings.safetyBuffer]
  )

  // ─── Status helpers ───
  const getCashflowStatus = () => {
    if (monthlyCashflow.netCashflow > 0) return 'green'
    if (monthlyCashflow.netCashflow < 0) return 'red'
    return 'neutral'
  }

  const getFinalCapitalStatus = () => {
    if (finalCapital > settings.safetyBuffer) return 'green'
    if (finalCapital > 0) return 'orange'
    return 'red'
  }

  const getRunwayLabel = () => {
    if (runway === null) return '12+ mois'
    if (runway <= 2) return 'Critique'
    return `${runway} mois`
  }

  const getRunwayStatus = () => {
    if (runway === null) return 'green'
    if (runway <= 2) return 'red'
    if (runway <= 5) return 'orange'
    return 'green'
  }

  const getLowestStatus = () => {
    if (lowestBalance.amount > settings.safetyBuffer) return 'green'
    if (lowestBalance.amount > 0) return 'orange'
    return 'red'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Plane className="h-6 w-6 text-brand-glow" /> Mission Australie
          </h1>
          <p className="text-sm text-text-secondary">
            Cashflow prévisionnel et gestion des transactions pour l'année en Australie.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SafetyBufferControl
            value={settings.safetyBuffer}
            onChange={(v) => setSettings(prev => ({ ...prev, safetyBuffer: v }))}
            format={format}
          />
        </div>
      </div>

      {/* ─── Summary Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          icon={ArrowUpDown}
          label="Cashflow Mensuel Net"
          value={monthlyCashflow.netCashflow >= 0
            ? `+${format(monthlyCashflow.netCashflow)}`
            : `−${format(Math.abs(monthlyCashflow.netCashflow))}`
          }
          subtitle={`${format(monthlyCashflow.totalIncome)} revenus — ${format(monthlyCashflow.totalExpenses)} dépenses`}
          status={getCashflowStatus()}
        />
        <SummaryCard
          icon={Wallet}
          label="Capital Projeté Fin d'Année"
          value={format(finalCapital)}
          subtitle={finalCapital > settings.safetyBuffer
            ? 'Au-dessus du seuil de sécurité'
            : finalCapital > 0
              ? 'Sous le seuil de sécurité'
              : 'Capital épuisé'
          }
          status={getFinalCapitalStatus()}
        />
        <SummaryCard
          icon={Timer}
          label="Runway"
          value={getRunwayLabel()}
          subtitle={runway === null
            ? 'Le capital ne s\'épuise pas sur 12 mois'
            : `Capital épuisé au mois ${runway}`
          }
          status={getRunwayStatus()}
        />
        <SummaryCard
          icon={ArrowDownCircle}
          label="Mois le plus bas"
          value={format(lowestBalance.amount)}
          subtitle={lowestBalance.label}
          status={getLowestStatus()}
        />
      </div>

      {/* ─── Warning Banner ─── */}
      <WarningBanner status={healthStatus} />

      {/* ─── Forecast Chart ─── */}
      <section className="card">
        <header className="flex items-center justify-between mb-4">
          <div>
            <p className="stat-label flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" /> Projection sur 12 mois
            </p>
            <p className="text-sm text-text-secondary">
              Capital initial : {format(settings.initialCapital)}
            </p>
          </div>
        </header>
        <ForecastChart
          forecastData={forecastData}
          safetyBuffer={settings.safetyBuffer}
          format={format}
        />
      </section>

      {/* ─── Transaction Manager ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Gestion des transactions</h2>
          <p className="text-sm text-text-secondary">
            {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} au total
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand/90 shadow-glow transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Ajouter une transaction
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ─── List A: Mensualités Actives ─── */}
        <section className="card">
          <header className="flex items-center justify-between mb-4">
            <div>
              <p className="stat-label flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" /> Mensualités Actives
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                {recurringTxs.length} transaction{recurringTxs.length !== 1 ? 's' : ''} récurrente{recurringTxs.length !== 1 ? 's' : ''}
              </p>
            </div>
          </header>

          {recurringTxs.length > 0 ? (
            <div className="space-y-2">
              {recurringTxs.map(tx => (
                <TransactionRow
                  key={tx.id}
                  transaction={tx}
                  onEdit={openEditModal}
                  onDelete={handleDelete}
                  onTogglePause={handleTogglePause}
                  format={format}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              message="Aucune mensualité active."
              hint="Ajoutez votre loyer, abonnements ou revenus récurrents."
            />
          )}
        </section>

        {/* ─── List B: Dépenses/Gains Occasionnels ─── */}
        <section className="card">
          <header className="flex items-center justify-between mb-4">
            <div>
              <p className="stat-label flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Dépenses / Gains Occasionnels
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                {oneOffTxs.length} transaction{oneOffTxs.length !== 1 ? 's' : ''} ponctuelle{oneOffTxs.length !== 1 ? 's' : ''}
              </p>
            </div>
          </header>

          {oneOffTxs.length > 0 ? (
            <div className="space-y-2">
              {oneOffTxs.map(tx => (
                <TransactionRow
                  key={tx.id}
                  transaction={tx}
                  onEdit={openEditModal}
                  onDelete={handleDelete}
                  format={format}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              message="Aucune transaction occasionnelle prévue."
              hint="Ajoutez votre visa, billet d'avion ou frais d'installation."
            />
          )}
        </section>
      </div>

      {/* ─── Transaction Form Modal ─── */}
      <TransactionFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingTx(null) }}
        onSave={handleSave}
        onDelete={handleDelete}
        transaction={editingTx}
      />
    </div>
  )
}

// ─── Empty State ───
function EmptyState({ message, hint }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="h-12 w-12 rounded-2xl bg-bg-elevated border border-border-subtle flex items-center justify-center mb-3">
        <Calendar className="h-5 w-5 text-text-muted" />
      </div>
      <p className="text-sm text-text-secondary">{message}</p>
      <p className="text-xs text-text-muted mt-1">{hint}</p>
    </div>
  )
}

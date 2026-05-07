import {
  Plane, Calendar, Plus, RefreshCw, ArrowUpDown,
  TrendingUp, Wallet, Timer, ArrowDownCircle, Users,
} from 'lucide-react'

import { useAustraliaData } from '../hooks/useAustraliaData.js'
import { useAuth } from '../context/AuthContext.jsx'

import SummaryCard from '../components/australia/SummaryCard.jsx'
import WarningBanner from '../components/australia/WarningBanner.jsx'
import ForecastChart from '../components/australia/ForecastChart.jsx'
import TransactionFormModal from '../components/australia/TransactionFormModal.jsx'
import TransactionRow from '../components/australia/TransactionRow.jsx'
import SafetyBufferControl from '../components/australia/SafetyBufferControl.jsx'
import PersonBreakdown from '../components/australia/PersonBreakdown.jsx'
import MobileAustraliaView from '../components/mobile/MobileAustraliaView.jsx'
import ImportBanner from '../components/migration/ImportBanner.jsx'

export default function AustraliaView() {
  const data = useAustraliaData()

  if (data.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="inline-block h-6 w-6 border-2 border-brand/30 border-t-brand-glow rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      {/* ─── Mobile: shown only on small screens ─── */}
      <div className="lg:hidden -mx-4 sm:-mx-6 -my-6">
        <MobileAustraliaView data={data} />
      </div>

      {/* ─── Desktop: hidden on small screens ─── */}
      <div className="hidden lg:block">
        <DesktopAustraliaView data={data} />
      </div>
    </>
  )
}

// ─── Desktop Dashboard ───
function DesktopAustraliaView({ data }) {
  const { currentUser } = useAuth()
  const {
    format,
    settings,
    modalOpen,
    editingTx,
    transactions,
    recurringTxs,
    oneOffTxs,
    forecastData,
    monthlyCashflow,
    lowestBalance,
    finalCapital,
    healthStatus,
    personBreakdown,
    handleSave,
    handleDelete,
    handleTogglePause,
    openCreateModal,
    openEditModal,
    closeModal,
    setSafetyBuffer,
    getCashflowStatus,
    getFinalCapitalStatus,
    getRunwayLabel,
    getRunwayStatus,
    getLowestStatus,
  } = data

  return (
    <div className="space-y-6">
      {/* Import banner for legacy data */}
      <ImportBanner />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Plane className="h-6 w-6 text-brand-glow" /> FinAuzi
          </h1>
          <p className="text-sm text-text-secondary">
            Notre trésorerie pour l'Australie
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SafetyBufferControl
            value={settings.safetyBuffer}
            onChange={setSafetyBuffer}
            format={format}
          />
        </div>
      </div>

      {/* Summary Cards */}
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
          subtitle={data.runway === null
            ? 'Le capital ne s\'épuise pas sur 12 mois'
            : `Capital épuisé au mois ${data.runway}`
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

      {/* Warning Banner */}
      <WarningBanner status={healthStatus} />

      {/* Person Breakdown */}
      {personBreakdown && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-text-muted" />
            <p className="stat-label">Répartition par personne</p>
          </div>
          <PersonBreakdown personBreakdown={personBreakdown} format={format} />
        </section>
      )}

      {/* Forecast Chart */}
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

      {/* Transaction Manager */}
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
        {/* Recurring */}
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

        {/* One-off */}
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

      {/* Transaction Form Modal */}
      <TransactionFormModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSave={handleSave}
        onDelete={handleDelete}
        transaction={editingTx}
        currentUserUid={currentUser?.uid}
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

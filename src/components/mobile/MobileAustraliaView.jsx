import { useState } from 'react'
import { Plane, LayoutDashboard, Receipt, Settings } from 'lucide-react'
import { useCurrency } from '../../context/CurrencyContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

import MobileOverviewTab from './MobileOverviewTab.jsx'
import MobileTransactionsTab from './MobileTransactionsTab.jsx'
import MobileSettingsTab from './MobileSettingsTab.jsx'
import MobileBottomSheet from './MobileBottomSheet.jsx'
import MobileTransactionForm from './MobileTransactionForm.jsx'

const TABS = [
  { id: 'overview', label: 'Vue', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: Receipt },
  { id: 'settings', label: 'Paramètres', icon: Settings },
]

export default function MobileAustraliaView({ data }) {
  const [activeTab, setActiveTab] = useState('overview')
  const { code, setCode } = useCurrency()
  const { currentUser } = useAuth()

  const {
    modalOpen,
    editingTx,
    openCreateModal,
    closeModal,
    handleSave,
    handleDelete,
  } = data

  return (
    <div className="min-h-screen bg-bg-base flex flex-col relative">
      {/* ─── Sticky Header ─── */}
      <header className="sticky top-0 z-30 bg-bg-base/80 backdrop-blur-xl border-b border-border-subtle/50">
        <div className="flex items-center justify-between px-5 h-14">
          <div className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-brand-glow" />
            <span className="font-semibold text-sm tracking-tight">FinAuzi</span>
          </div>
          {/* Currency toggle (compact) */}
          <div className="flex items-center p-0.5 rounded-lg bg-bg-card border border-border-subtle">
            {['EUR', 'AUD'].map((c) => (
              <button
                key={c}
                onClick={() => setCode(c)}
                className={`px-2.5 h-7 rounded-md text-[11px] font-semibold tracking-wide transition-all ${
                  code === c
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-text-muted'
                }`}
                aria-label={`Afficher en ${c}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ─── Tab Content ─── */}
      <main className="flex-1 overflow-y-auto pb-24">
        {activeTab === 'overview' && <MobileOverviewTab data={data} />}
        {activeTab === 'transactions' && <MobileTransactionsTab data={data} />}
        {activeTab === 'settings' && <MobileSettingsTab data={data} />}
      </main>

      {/* ─── Floating Add Button ─── */}
      {activeTab !== 'settings' && (
        <button
          onClick={openCreateModal}
          className="fixed bottom-24 right-5 z-40 h-14 w-14 rounded-2xl bg-brand text-white shadow-glow flex items-center justify-center transition-all active:scale-95 hover:shadow-[0_0_0_1px_rgba(45,127,249,0.5),0_12px_32px_-8px_rgba(45,127,249,0.5)]"
          aria-label="Ajouter une transaction"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}

      {/* ─── Bottom Navigation ─── */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-bg-elevated/90 backdrop-blur-xl border-t border-border-subtle/60 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16">
          {TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-0.5 px-4 py-2 min-w-[64px] rounded-xl transition-all active:scale-95 ${
                  isActive ? 'text-brand-glow' : 'text-text-muted'
                }`}
                aria-label={tab.label}
              >
                <Icon className="h-5 w-5" />
                <span className={`text-[10px] font-medium ${isActive ? 'text-brand-glow' : 'text-text-muted'}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <div className="absolute bottom-1 h-0.5 w-5 rounded-full bg-brand-glow" />
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* ─── Transaction Bottom Sheet ─── */}
      <MobileBottomSheet
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingTx ? 'Modifier' : 'Nouvelle transaction'}
      >
        <MobileTransactionForm
          transaction={editingTx}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={closeModal}
          currentUserUid={currentUser?.uid}
        />
      </MobileBottomSheet>
    </div>
  )
}

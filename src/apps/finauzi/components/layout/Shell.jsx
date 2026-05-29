import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import BottomNav from './BottomNav.jsx'
import Sidebar from './Sidebar.jsx'
import { Toaster } from '@/shared/ui/sonner.jsx'
import { MOBILE_TABS } from '../../config/navigation.js'
import { cn } from '@/shared/lib/utils.js'
import { useUI } from '../../context/UIContext.jsx'
import { useAuth } from '@/shared/context/AuthContext.jsx'

// Lazy-loaded — heavy date-picker / form chunks only load on first open.
const TransactionFormModal = lazy(() => import('../transactions/TransactionFormModal.jsx'))
const SettingsDrawer = lazy(() => import('./SettingsDrawer.jsx'))

export default function Shell({ active, onChange, children }) {
  const { formOpen, editingTx, closeForm, settingsOpen, closeSettings } = useUI()
  const { currentUser } = useAuth()

  return (
    <div className="min-h-screen text-fg lg:flex">
      <Sidebar active={active} onChange={onChange} />

      <div className="flex-1 min-w-0 lg:ml-60">
        {/* Phone-only top bar (< sm) : retour vers la plateforme */}
        <div className="sm:hidden sticky top-0 z-20 bg-bg/80 backdrop-blur-xl border-b border-border">
          <div className="px-4 py-3 flex items-center gap-3">
            <Link to="/" className="text-muted hover:text-fg transition" title="Nos apps">
              <ArrowLeft size={18} />
            </Link>
            <p className="text-sm font-semibold tracking-tight text-fg">FinAuzi</p>
          </div>
        </div>

        {/* Tablet top nav (sm to lg) */}
        <header className="hidden sm:block lg:hidden sticky top-0 z-20 bg-bg/80 backdrop-blur-xl border-b border-border">
          <div className="max-w-3xl mx-auto px-6 py-3 flex items-center gap-6">
            <Link to="/" className="text-muted hover:text-fg transition" title="Nos apps">
              <ArrowLeft size={16} />
            </Link>
            <p className="text-sm font-semibold tracking-tight text-fg">FinAuzi</p>
            <div className="flex items-center gap-1 ml-auto">
              {MOBILE_TABS.map((tab) => {
                const Icon = tab.icon
                const isActive = tab.activeFor.includes(active)
                return (
                  <button
                    key={tab.id}
                    onClick={() => onChange(tab.route)}
                    className={cn(
                      'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition',
                      isActive
                        ? 'bg-accent/10 text-accent'
                        : 'text-muted hover:text-fg hover:bg-surface-2',
                    )}
                  >
                    <Icon size={15} strokeWidth={isActive ? 2.3 : 2} />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>
        </header>

        <main>{children}</main>

        <BottomNav active={active} onChange={onChange} />
      </div>

      <Suspense fallback={null}>
        {formOpen && (
          <TransactionFormModal
            onClose={closeForm}
            currentUid={currentUser?.uid}
            existing={editingTx}
          />
        )}
        {settingsOpen && (
          <SettingsDrawer open={settingsOpen} onClose={closeSettings} />
        )}
      </Suspense>

      <Toaster />
    </div>
  )
}

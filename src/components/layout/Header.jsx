import { ArrowDownRight, ArrowUpRight, Menu, Search, Bell } from 'lucide-react'
import { useCurrency } from '../../context/CurrencyContext.jsx'
import CurrencyToggle from '../ui/CurrencyToggle.jsx'

export default function Header({ netWorth, change24h, onOpenMobile }) {
  const { format } = useCurrency()
  const positive = change24h >= 0
  const ChangeIcon = positive ? ArrowUpRight : ArrowDownRight
  const changeColor = positive ? 'text-success' : 'text-danger'
  const changeBg = positive ? 'bg-success/10 border-success/30' : 'bg-danger/10 border-danger/30'
  const pct = ((change24h / netWorth) * 100).toFixed(2)

  return (
    <header className="sticky top-0 z-20 border-b border-border-subtle bg-bg-base/70 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button
          onClick={onOpenMobile}
          className="lg:hidden rounded-md p-2 text-text-secondary hover:bg-bg-hover"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-baseline gap-3 min-w-0 flex-1">
          <div className="hidden sm:block">
            <p className="stat-label">Patrimoine Net</p>
          </div>
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="text-xl sm:text-2xl font-semibold tabular-nums truncate">
              {format(netWorth)}
            </span>
            <span
              className={`pill border ${changeBg} ${changeColor} tabular-nums whitespace-nowrap`}
            >
              <ChangeIcon className="h-3 w-3" />
              {format(Math.abs(change24h), { fractionDigits: 0 })} ({positive ? '+' : '-'}
              {Math.abs(pct)}%)
              <span className="text-text-muted ml-1 hidden sm:inline">24h</span>
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 px-3 h-9 w-64 rounded-lg bg-bg-card border border-border-subtle text-text-secondary">
          <Search className="h-4 w-4" />
          <input
            placeholder="Rechercher comptes, objectifs…"
            className="bg-transparent text-sm outline-none flex-1 placeholder:text-text-muted"
          />
        </div>

        <CurrencyToggle />

        <button
          className="hidden sm:grid h-9 w-9 place-items-center rounded-lg bg-bg-card border border-border-subtle text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}

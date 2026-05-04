import { useEffect, useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, LineChart } from 'lucide-react'
import { useCurrency } from '../context/CurrencyContext.jsx'
import { peaEntries } from '../data/portfolio.js'
import { fetchYahooLiveQuote } from '../data/liveQuotes.js'
import Sparkline from '../components/ui/Sparkline.jsx'

const TRACKED_TICKER = 'CW8.PA'
const QUOTE_REFRESH_MS = 30_000

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
}

function formatLastUpdated(date) {
  return date.toLocaleString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

export default function PEAView() {
  const { format } = useCurrency()
  const [sharesInput, setSharesInput] = useState('10')
  const [liveQuote, setLiveQuote] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [quoteError, setQuoteError] = useState('')
  const normalizedQuoteError = quoteError.toLowerCase()
  const showCorsHint =
    normalizedQuoteError.includes('failed to fetch') ||
    normalizedQuoteError.includes('networkerror') ||
    normalizedQuoteError.includes('cors')

  const rows = useMemo(() => {
    return peaEntries.map((e, i) => {
      const prev = peaEntries[i - 1]
      const monthlyDelta = prev ? e.value - (prev.value + e.invested) : e.value - e.invested
      const monthlyROI = prev ? (monthlyDelta / (prev.value + e.invested)) * 100 : (monthlyDelta / e.invested) * 100
      const totalROI = ((e.value - e.cumulative) / e.cumulative) * 100
      return { ...e, monthlyROI, totalROI }
    })
  }, [])

  useEffect(() => {
    let active = true

    const refreshLiveQuote = async () => {
      try {
        const quote = await fetchYahooLiveQuote(TRACKED_TICKER)
        if (!active) return
        setLiveQuote(quote)
        setLastUpdated(new Date())
        setQuoteError('')
      } catch (error) {
        if (!active) return
        const message = error instanceof Error ? error.message : 'Impossible de récupérer le cours en direct'
        setQuoteError(message)
      }
    }

    refreshLiveQuote()
    const intervalId = window.setInterval(refreshLiveQuote, QUOTE_REFRESH_MS)

    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [])

  const last = rows[rows.length - 1]
  const totalInvested = last.cumulative
  const normalizedShares = sharesInput.replace(',', '.')
  const parsedShares = Number.parseFloat(normalizedShares)
  const hasValidShares = sharesInput.trim() !== '' && Number.isFinite(parsedShares) && parsedShares >= 0
  const livePrice = liveQuote?.price ?? null
  const currentValue = livePrice !== null && hasValidShares ? livePrice * parsedShares : last.value
  const gain = currentValue - totalInvested
  const totalROI = totalInvested > 0 ? (gain / totalInvested) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <LineChart className="h-6 w-6 text-brand-glow" /> Suivi ROI PEA
          </h1>
          <span className="pill bg-bg-elevated border border-border-subtle text-text-secondary">
            Dernière mise à jour : {lastUpdated ? formatLastUpdated(lastUpdated) : 'En attente du cours en direct…'}
          </span>
        </div>
        <p className="text-sm text-text-secondary">
          Stratégie DCA 50 €/mois — performance par contribution.
        </p>
        {quoteError && (
          <p className="text-xs text-danger">
            {showCorsHint
              ? 'Cours en direct bloqué par CORS. Lancez via le proxy Vite ou définissez VITE_YAHOO_PROXY_URL.'
              : quoteError}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="card">
          <label htmlFor="pea-shares" className="stat-label">
            Nombre de parts
          </label>
          <input
            id="pea-shares"
            type="number"
            min="0"
            step="0.0001"
            value={sharesInput}
            onChange={(event) => setSharesInput(event.target.value)}
            className="mt-2 h-10 w-full rounded-lg bg-bg-elevated border border-border-subtle px-3 text-sm outline-none focus:border-brand"
          />
          <p className="text-xs text-text-muted mt-2">Saisie manuelle utilisée pour la valeur du portefeuille en direct.</p>
        </div>
        <div className="card">
          <p className="stat-label">Investi</p>
          <p className="stat-value">{format(totalInvested)}</p>
          <p className="text-xs text-text-muted mt-1">{rows.length} contributions</p>
        </div>
        <div className="card">
          <p className="stat-label">Valeur actuelle (direct)</p>
          <p className="stat-value">{format(currentValue)}</p>
          <p className="text-xs text-text-muted mt-1">
            {livePrice !== null && hasValidShares
              ? `${liveQuote.shortName} (${liveQuote.symbol}) @ ${format(livePrice, { fractionDigits: 2 })}`
              : `Repli : valeur historique (ticker ${TRACKED_TICKER})`}
          </p>
        </div>
        <div className="card">
          <p className="stat-label">Plus-value latente</p>
          <p className={`stat-value ${gain >= 0 ? 'text-success' : 'text-danger'}`}>
            {gain >= 0 ? '+' : '−'}
            {format(Math.abs(gain))}
          </p>
          <p className="text-xs text-text-muted mt-1">Prix de revient vs marché</p>
        </div>
        <div className="card">
          <p className="stat-label">ROI Total</p>
          <p className={`stat-value ${totalROI >= 0 ? 'text-success' : 'text-danger'}`}>
            {totalROI >= 0 ? '+' : '−'}
            {Math.abs(totalROI).toFixed(2)}%
          </p>
          <p className="text-xs text-text-muted mt-1">Basé sur le cours en direct et les parts manuelles</p>
        </div>
      </div>

      <section className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-text-muted border-b border-border-subtle">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium text-right">Investi</th>
                <th className="px-5 py-3 font-medium text-right">Valeur actuelle</th>
                <th className="px-5 py-3 font-medium text-right">ROI mensuel</th>
                <th className="px-5 py-3 font-medium text-right">ROI total</th>
                <th className="px-5 py-3 font-medium text-right">Tendance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const monthlyPositive = row.monthlyROI >= 0
                const totalPositive = row.totalROI >= 0
                const MIcon = monthlyPositive ? ArrowUpRight : ArrowDownRight
                const TIcon = totalPositive ? ArrowUpRight : ArrowDownRight
                return (
                  <tr
                    key={row.date}
                    className="border-b border-border-subtle/60 last:border-0 hover:bg-bg-hover/60 transition-colors"
                  >
                    <td className="px-5 py-3 font-medium">{formatDate(row.date)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-text-secondary">
                      {format(row.invested)}
                      <span className="text-text-muted ml-1">/ {format(row.cumulative)}</span>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">{format(row.value, { fractionDigits: 2 })}</td>
                    <td
                      className={`px-5 py-3 text-right tabular-nums ${
                        monthlyPositive ? 'text-success' : 'text-danger'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1">
                        <MIcon className="h-3 w-3" />
                        {monthlyPositive ? '+' : '−'}
                        {Math.abs(row.monthlyROI).toFixed(2)}%
                      </span>
                    </td>
                    <td
                      className={`px-5 py-3 text-right tabular-nums ${
                        totalPositive ? 'text-success' : 'text-danger'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1">
                        <TIcon className="h-3 w-3" />
                        {totalPositive ? '+' : '−'}
                        {Math.abs(row.totalROI).toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end">
                        <Sparkline data={row.spark} positive={monthlyPositive} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

import { useCurrency } from '../context/CurrencyContext.jsx'
import { Bell, Globe, Lock, User } from 'lucide-react'

function Row({ icon: Icon, title, description, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-border-subtle last:border-0">
      <div className="flex items-start gap-3 min-w-0">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-bg-elevated border border-border-subtle text-text-secondary shrink-0">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-text-muted">{description}</p>
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

export default function SettingsView() {
  const { code, setCode } = useCurrency()

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Paramètres</h1>
        <p className="text-sm text-text-secondary">Préférences personnelles pour le tableau de bord Atlas.</p>
      </div>

      <section className="card">
        <Row icon={User} title="Profil" description="Nom affiché dans l'application">
          <input
            defaultValue="C. Boudon"
            className="h-9 px-3 rounded-lg bg-bg-elevated border border-border-subtle text-sm w-44 outline-none focus:border-brand"
          />
        </Row>
        <Row icon={Globe} title="Devise d'affichage" description="Basculer entre EUR et AUD globalement">
          <div className="inline-flex p-0.5 rounded-lg bg-bg-elevated border border-border-subtle">
            {['EUR', 'AUD'].map((c) => (
              <button
                key={c}
                onClick={() => setCode(c)}
                className={`px-3 h-8 rounded-md text-xs font-semibold transition-colors ${
                  code === c
                    ? 'bg-brand text-white'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </Row>
        <Row icon={Bell} title="Notifications" description="Résumé hebdomadaire des changements de patrimoine net">
          <label className="inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked className="peer sr-only" />
            <span className="w-10 h-6 rounded-full bg-border-strong peer-checked:bg-brand transition-colors relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4" />
          </label>
        </Row>
        <Row
          icon={Lock}
          title="Mode de données"
          description="Le cours PEA utilise Yahoo Finance ; les autres métriques restent en données locales"
        >
          <span className="pill bg-brand/10 border border-brand/30 text-brand-glow">Hybrid</span>
        </Row>
      </section>

      <p className="text-xs text-text-muted">
        Atlas v0.1 · Construit localement avec Vite + React + Tailwind. Le taux de conversion EUR→AUD est fixé à 1,64 pour la démo.
      </p>
    </div>
  )
}

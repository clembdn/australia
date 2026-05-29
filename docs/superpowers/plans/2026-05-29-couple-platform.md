# Plateforme « Clément & Lise » — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformer la SPA FinAuzi en plateforme couple multi-apps : login « Qui es-tu ? », dashboard de cards, et FinAuzi déplacé sous `/finauzi`, extensible jusqu'à 8 apps.

**Architecture:** `react-router-dom` pour le routing par URL ; code réorganisé en 3 niveaux — `src/shared/` (auth, people, firebase, kit UI), `src/platform/` (login, dashboard, registre d'apps, garde d'accès), `src/apps/finauzi/` (FinAuzi tel quel, nav interne par `useState` inchangée). Un alias `@/` → `src/` rend les imports stables malgré les déplacements.

**Tech Stack:** Vite 6, React 18, react-router-dom, Firebase (Auth + Firestore), Tailwind, lucide-react.

**Vérification :** pas de tests automatisés (hors périmètre). Chaque tâche se termine par un `npm run build` vert + un smoke test manuel ciblé.

---

## Structure des fichiers (cible)

```
src/
├─ main.jsx                 # MODIFIÉ : <BrowserRouter> + <AuthProvider>
├─ App.jsx                  # RÉÉCRIT : déclaration des routes
├─ styles.css               # inchangé
├─ shared/
│  ├─ context/AuthContext.jsx      # déplacé
│  ├─ config/people.js             # déplacé + EMAIL_BY_UID
│  ├─ lib/firebase.js              # déplacé
│  ├─ lib/utils.js                 # déplacé
│  └─ ui/*                         # déplacé (kit UI)
├─ platform/
│  ├─ apps.config.js        # NOUVEAU : registre des apps
│  ├─ ProtectedRoute.jsx    # NOUVEAU
│  ├─ Splash.jsx            # NOUVEAU
│  ├─ Forbidden.jsx         # NOUVEAU
│  ├─ LoginView.jsx         # NOUVEAU : picker + mot de passe
│  ├─ DashboardView.jsx     # NOUVEAU : grille de cards
│  └─ ComingSoonView.jsx    # NOUVEAU
└─ apps/finauzi/
   ├─ FinauziApp.jsx        # NOUVEAU (ex-corps de App.jsx, sans gating auth)
   ├─ views/  components/  context/  config/  services/  utils/  hooks/   # déplacés
```

Modules **partagés** (import via `@/shared/...`) : `AuthContext`, `people.js`, `firebase.js`,
`utils.js`, tout `ui/`. Le reste est propre à FinAuzi (imports relatifs internes inchangés).

---

## Task 1 : Outillage — router + alias `@/`

**Files:**
- Modify: `package.json` (via npm)
- Modify: `vite.config.js`
- Create: `jsconfig.json`

- [ ] **Step 1 : Installer react-router-dom**

Run: `npm install react-router-dom`
Expected: ajout dans `package.json` › `dependencies`, pas d'erreur.

- [ ] **Step 2 : Ajouter l'alias `@/` dans vite.config.js**

Ajouter l'import en haut et le bloc `resolve` juste après `plugins`. Fichier complet :

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  build: {
    chunkSizeWarningLimit: 1000,

    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, '/')

          if (!normalizedId.includes('node_modules')) {
            return
          }

          if (
            normalizedId.includes('/node_modules/react/') ||
            normalizedId.includes('/node_modules/react-dom/') ||
            normalizedId.includes('/node_modules/react-router-dom/') ||
            normalizedId.includes('/node_modules/scheduler/')
          ) {
            return 'react-vendor'
          }

          if (
            normalizedId.includes('/node_modules/firebase/') ||
            normalizedId.includes('/node_modules/@firebase/')
          ) {
            return 'firebase'
          }

          if (
            normalizedId.includes('/node_modules/recharts/') ||
            normalizedId.includes('/node_modules/d3-') ||
            normalizedId.includes('/node_modules/victory-vendor/')
          ) {
            return 'charts'
          }

          if (normalizedId.includes('/node_modules/lucide-react/')) {
            return 'icons'
          }
        },
      },
    },
  },

  server: {
    host: true,
    port: 5173,
  },
})
```

- [ ] **Step 3 : Créer jsconfig.json (confort éditeur)**

Create `jsconfig.json` :

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "exclude": ["node_modules", "legacy", "dist"]
}
```

- [ ] **Step 4 : Vérifier le build**

Run: `npm run build`
Expected: `✓ built in ...`, aucune erreur (rien de structurel n'a changé).

- [ ] **Step 5 : Commit**

```bash
git add package.json package-lock.json vite.config.js jsconfig.json
git commit -m "chore: add react-router-dom and @/ path alias"
```

---

## Task 2 : Restructuration en `shared/` + `apps/finauzi/` (sans changement de comportement)

Déplacements + correction des imports. L'app doit se comporter exactement comme avant,
mais depuis les nouveaux emplacements. Le build peut être rouge en cours de tâche ; il doit
être vert à la fin.

**Files:** déplacements de fichiers + édition des imports (liste ci-dessous).

- [ ] **Step 1 : Créer les dossiers cibles**

Run (PowerShell) :
```powershell
New-Item -ItemType Directory -Force src/shared/context, src/shared/config, src/shared/lib, src/apps/finauzi | Out-Null
```

- [ ] **Step 2 : Déplacer les modules partagés (git mv)**

```bash
git mv src/context/AuthContext.jsx src/shared/context/AuthContext.jsx
git mv src/config/people.js        src/shared/config/people.js
git mv src/lib/firebase.js         src/shared/lib/firebase.js
git mv src/lib/utils.js            src/shared/lib/utils.js
git mv src/components/ui           src/shared/ui
```

- [ ] **Step 3 : Déplacer les dossiers FinAuzi (git mv)**

```bash
git mv src/views      src/apps/finauzi/views
git mv src/components  src/apps/finauzi/components
git mv src/context     src/apps/finauzi/context
git mv src/config      src/apps/finauzi/config
git mv src/services    src/apps/finauzi/services
git mv src/utils       src/apps/finauzi/utils
git mv src/hooks       src/apps/finauzi/hooks
```

(`src/lib` est désormais vide — laisser tel quel, git ne suit pas les dossiers vides.)

- [ ] **Step 4 : Transformer App.jsx en FinauziApp.jsx**

```bash
git mv src/App.jsx src/apps/finauzi/FinauziApp.jsx
```

Dans `src/apps/finauzi/FinauziApp.jsx` : renommer la fonction `App` → `FinauziApp`, et
changer **uniquement** l'import de AuthContext vers l'alias partagé. Ligne 2 :
`import { useAuth } from './context/AuthContext.jsx'`
→ `import { useAuth } from '@/shared/context/AuthContext.jsx'`
Les autres imports (`./context/UIContext.jsx`, `./views/...`, `./components/layout/Shell.jsx`)
restent relatifs et valides. (Le gating auth reste en place pour l'instant — il sera retiré en Task 3.)

- [ ] **Step 5 : Créer un App.jsx fin (entrée temporaire)**

Create `src/App.jsx` :

```jsx
import FinauziApp from '@/apps/finauzi/FinauziApp.jsx'

export default function App() {
  return <FinauziApp />
}
```

- [ ] **Step 6 : Corriger l'import AuthProvider dans main.jsx**

Dans `src/main.jsx`, ligne 3 :
`import { AuthProvider } from './context/AuthContext.jsx'`
→ `import { AuthProvider } from '@/shared/context/AuthContext.jsx'`

- [ ] **Step 7 : Corriger les imports des modules partagés dans les fichiers déplacés**

Règle (appliquée partout où ils apparaissent), quelle que soit la profondeur `../` :

| Ancien specifier (relatif) | Nouveau specifier |
|---|---|
| `…/context/AuthContext.jsx` | `@/shared/context/AuthContext.jsx` |
| `…/config/people.js` | `@/shared/config/people.js` |
| `…/lib/firebase.js` | `@/shared/lib/firebase.js` |
| `…/lib/utils.js` | `@/shared/lib/utils.js` |
| `…/ui/<nom>.jsx` ou `…/components/ui/<nom>.jsx` | `@/shared/ui/<nom>.jsx` |

⚠️ Ne **pas** toucher aux imports de `AppDataContext`, `CurrencyContext`, `UIContext`
(restent relatifs), ni de `config/categories|navigation|journey|*Suggestions` (relatifs).

Fichiers à éditer (modules partagés importés, d'après l'inventaire) :

- `src/shared/ui/PersonBadge.jsx` → people
- `src/shared/ui/calendar.jsx`, `dialog.jsx`, `popover.jsx`, `date-picker.jsx`, `sheet.jsx` → utils
- `src/apps/finauzi/views/DashboardView.jsx` → AuthContext, people
- `src/apps/finauzi/views/TransactionsView.jsx` → people, ui/sheet, utils
- `src/apps/finauzi/views/BudgetsView.jsx` → AuthContext
- `src/apps/finauzi/views/VoyageView.jsx` → utils
- `src/apps/finauzi/views/LoginView.jsx` → AuthContext  *(sera supprimé en Task 3, corriger quand même pour le build vert)*
- `src/apps/finauzi/services/transactionService.js`, `checklistService.js`, `settingsService.js`, `timelineService.js` → firebase, people
- `src/apps/finauzi/utils/exportCsv.js` → people
- `src/apps/finauzi/components/layout/Shell.jsx` → AuthContext, ui/sonner, utils
- `src/apps/finauzi/components/layout/Sidebar.jsx` → AuthContext, people, utils
- `src/apps/finauzi/components/layout/SettingsDrawer.jsx` → AuthContext, people, ui/sheet, ui/sonner, utils
- `src/apps/finauzi/components/layout/BottomNav.jsx` → utils
- `src/apps/finauzi/components/transactions/TransactionFormModal.jsx` → people, ui/Modal, ui/sonner, ui/date-picker
- `src/apps/finauzi/components/transactions/TransactionRow.jsx` → people
- `src/apps/finauzi/components/dashboard/MonthBreakdown.jsx` → people
- `src/apps/finauzi/components/budgets/BudgetEditModal.jsx` → ui/Modal, ui/sonner
- `src/apps/finauzi/components/voyage/Checklist.jsx` → AuthContext, ui/sonner, utils
- `src/apps/finauzi/components/voyage/ChecklistAddModal.jsx` → ui/Modal, ui/sonner, utils
- `src/apps/finauzi/components/voyage/ChecklistItem.jsx` → people, utils
- `src/apps/finauzi/components/voyage/ChecklistSection.jsx` → utils
- `src/apps/finauzi/components/voyage/Timeline.jsx` → AuthContext, ui/sonner, utils
- `src/apps/finauzi/components/voyage/TimelineAddModal.jsx` → ui/Modal, ui/sonner, ui/date-picker
- `src/apps/finauzi/components/voyage/TimelineItem.jsx` → utils

(`src/shared/context/AuthContext.jsx` n'a **rien** à changer : ses imports `../lib/firebase.js`
et `../config/people.js` restent valides car `lib/` et `config/` l'ont suivi dans `shared/`.)

- [ ] **Step 8 : Vérifier le build et corriger les imports résiduels**

Run: `npm run build`
Expected: `✓ built in ...`. Si « Could not resolve … » apparaît, appliquer la règle du Step 7
au fichier indiqué, puis relancer jusqu'au vert.

- [ ] **Step 9 : Smoke test rapide**

Run: `npm run dev` puis ouvrir l'URL. Expected: l'app se comporte comme avant (login FinAuzi
existant → dashboard FinAuzi, nav interne OK). Ctrl+C ensuite.

- [ ] **Step 10 : Commit**

```bash
git add -A
git commit -m "refactor: relocate code into shared/ and apps/finauzi (no behavior change)"
```

---

## Task 3 : Couche plateforme — router, login picker, dashboard

**Files:**
- Modify: `src/shared/config/people.js`
- Create: `src/platform/{Splash,Forbidden,ProtectedRoute,apps.config,LoginView,DashboardView,ComingSoonView}.jsx`
- Modify: `src/apps/finauzi/FinauziApp.jsx` (retirer le gating auth)
- Delete: `src/apps/finauzi/views/LoginView.jsx`
- Rewrite: `src/App.jsx`, `src/main.jsx`

- [ ] **Step 1 : Ajouter EMAIL_BY_UID à people.js**

Ajouter à la fin de `src/shared/config/people.js` :

```js
// Email d'authentification par profil (login picker → écran mot de passe).
export const EMAIL_BY_UID = {
  [CLEMENT_UID]: 'clemboudon06@gmail.com',
  [LISE_UID]: '', // À renseigner par Clément : email de Lise (son login reste inactif tant que vide)
}

export function getEmailForUid(uid) {
  return EMAIL_BY_UID[uid] || null
}
```

- [ ] **Step 2 : Créer platform/Splash.jsx**

```jsx
export default function Splash() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <span className="h-7 w-7 border-2 border-white/15 border-t-white/80 rounded-full animate-spin" />
    </div>
  )
}
```

- [ ] **Step 3 : Créer platform/Forbidden.jsx**

```jsx
import { useAuth } from '@/shared/context/AuthContext.jsx'

export default function Forbidden() {
  const { logout } = useAuth()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6 fade-in">
      <h1 className="text-xl font-semibold text-white">Accès refusé</h1>
      <p className="text-sm text-white/40 max-w-xs">
        Cet espace est privé — seuls Clément et Lise y ont accès.
      </p>
      <button
        onClick={logout}
        className="text-xs text-white/60 hover:text-white underline-offset-4 hover:underline transition"
      >
        Se déconnecter
      </button>
    </div>
  )
}
```

- [ ] **Step 4 : Créer platform/ProtectedRoute.jsx**

```jsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import Splash from './Splash.jsx'
import Forbidden from './Forbidden.jsx'

export default function ProtectedRoute() {
  const { isLoading, isAuthenticated, isAuthorized } = useAuth()
  if (isLoading) return <Splash />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isAuthorized) return <Forbidden />
  return <Outlet />
}
```

- [ ] **Step 5 : Créer platform/apps.config.js**

```js
import { Wallet, ShoppingCart } from 'lucide-react'

// Registre des apps. Source unique de vérité pour les cards du dashboard.
// Ajouter une app = (1) une entrée ici + (2) une <Route> dans src/App.jsx.
export const APPS = [
  {
    id: 'finauzi',
    name: 'FinAuzi',
    description: 'Notre trésorerie pour l’Australie',
    path: '/finauzi',
    icon: Wallet,
    accent: 'amber',   // clé de COLOR_BY_ID (people.js)
    status: 'live',    // 'live' | 'soon'
  },
  {
    id: 'courses',
    name: 'Liste de courses',
    description: 'Nos courses partagées',
    path: '/courses',
    icon: ShoppingCart,
    accent: 'emerald',
    status: 'soon',
  },
]

export function getApp(id) {
  return APPS.find((a) => a.id === id) || null
}
```

- [ ] **Step 6 : Créer platform/LoginView.jsx**

```jsx
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { AUTHORIZED_UIDS, getPerson, getEmailForUid } from '@/shared/config/people.js'
import { cn } from '@/shared/lib/utils.js'

function mapAuthError(code) {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Mot de passe incorrect.'
    case 'auth/user-not-found':
      return 'Compte introuvable.'
    case 'auth/too-many-requests':
      return 'Trop de tentatives, réessaie plus tard.'
    case 'auth/network-request-failed':
      return 'Problème de connexion réseau.'
    default:
      return 'Connexion impossible, réessaie.'
  }
}

export default function LoginView() {
  const { loginWithEmail, resetPassword, isAuthenticated, isAuthorized } = useAuth()
  const [selectedUid, setSelectedUid] = useState(null)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const [busy, setBusy] = useState(false)

  if (isAuthenticated && isAuthorized) return <Navigate to="/" replace />

  const person = selectedUid ? getPerson(selectedUid) : null
  const email = selectedUid ? getEmailForUid(selectedUid) : null

  function selectProfile(uid) {
    setError(null); setInfo(null); setPassword('')
    setSelectedUid(uid)
  }
  function back() {
    setSelectedUid(null); setError(null); setInfo(null); setPassword('')
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (!email) { setError('Email non configuré pour ce profil.'); return }
    setError(null); setInfo(null); setBusy(true)
    try {
      await loginWithEmail(email, password)
    } catch (err) {
      setError(mapAuthError(err.code))
    } finally {
      setBusy(false)
    }
  }

  async function onReset() {
    if (!email) { setError('Email non configuré pour ce profil.'); return }
    setError(null)
    try {
      await resetPassword(email)
      setInfo('Email de réinitialisation envoyé.')
    } catch (err) {
      setError(mapAuthError(err.code))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 fade-in">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-white">Clément &amp; Lise</h1>
          <p className="text-sm text-white/40 mt-1">Notre espace à deux</p>
        </div>

        {!person ? (
          <div>
            <p className="text-center text-sm text-white/50 mb-4">Qui es-tu ?</p>
            <div className="grid grid-cols-2 gap-3">
              {AUTHORIZED_UIDS.map((uid) => {
                const p = getPerson(uid)
                return (
                  <button
                    key={uid}
                    onClick={() => selectProfile(uid)}
                    className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition"
                  >
                    <span className={cn(
                      'h-16 w-16 rounded-full flex items-center justify-center text-2xl font-semibold border',
                      p.bgClass, p.textClass, p.borderClass,
                    )}>
                      {p.initial}
                    </span>
                    <span className="text-sm font-medium text-white">{p.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <button
              type="button"
              onClick={back}
              className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition mb-2"
            >
              <ArrowLeft size={14} /> Changer d'utilisateur
            </button>

            <div className="flex items-center gap-3 mb-4">
              <span className={cn(
                'h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold border',
                person.bgClass, person.textClass, person.borderClass,
              )}>
                {person.initial}
              </span>
              <span className="text-sm text-white/70">
                Connexion en tant que <span className="text-white font-medium">{person.label}</span>
              </span>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                autoComplete="current-password"
                autoFocus
                required
                className="w-full px-4 py-3 pr-11 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 rounded-xl bg-white text-black font-medium text-sm disabled:opacity-50 transition hover:bg-white/90"
            >
              {busy ? 'Connexion…' : 'Se connecter'}
            </button>

            {error && <p className="text-xs text-red-400 text-center">{error}</p>}
            {info && <p className="text-xs text-emerald-400 text-center">{info}</p>}

            <button
              type="button"
              onClick={onReset}
              className="w-full text-xs text-white/40 hover:text-white/70 mt-2 transition"
            >
              Mot de passe oublié ?
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 7 : Créer platform/DashboardView.jsx**

```jsx
import { Link } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { getPerson, COLOR_BY_ID } from '@/shared/config/people.js'
import { cn } from '@/shared/lib/utils.js'
import { APPS } from './apps.config.js'

function greeting() {
  const h = new Date().getHours()
  if (h < 6) return 'Bonne nuit'
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

export default function DashboardView() {
  const { currentUid, logout } = useAuth()
  const me = getPerson(currentUid)

  return (
    <div className="min-h-screen flex flex-col px-6 py-8 max-w-5xl mx-auto w-full fade-in">
      <header className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Clément &amp; Lise</h1>
          <p className="text-sm text-white/40 mt-0.5">
            {greeting()}{me ? ` ${me.label}` : ''} — Notre espace à deux
          </p>
        </div>
        <button
          onClick={logout}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/[0.04] transition"
          title="Se déconnecter"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Déconnexion</span>
        </button>
      </header>

      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5 auto-rows-fr">
        {APPS.map((app) => (
          <AppCard key={app.id} app={app} />
        ))}
      </div>
    </div>
  )
}

function AppCard({ app }) {
  const Icon = app.icon
  const color = COLOR_BY_ID[app.accent] || COLOR_BY_ID.amber
  const isSoon = app.status === 'soon'

  return (
    <Link
      to={app.path}
      className={cn(
        'group relative flex flex-col justify-between p-7 rounded-3xl border bg-white/[0.02] min-h-[200px] transition hover:-translate-y-0.5 hover:bg-white/[0.04]',
        color.borderClass,
      )}
    >
      {isSoon && (
        <span className="absolute top-5 right-5 text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-white/5 text-white/40 border border-white/10">
          Bientôt
        </span>
      )}
      <span className={cn(
        'h-14 w-14 rounded-2xl flex items-center justify-center border',
        color.bgClass, color.textClass, color.borderClass,
      )}>
        <Icon size={26} strokeWidth={2} />
      </span>
      <div className="mt-6">
        <h2 className={cn('text-xl font-semibold', isSoon ? 'text-white/60' : 'text-white')}>{app.name}</h2>
        <p className="text-sm text-white/40 mt-1">{app.description}</p>
      </div>
    </Link>
  )
}
```

- [ ] **Step 8 : Créer platform/ComingSoonView.jsx**

```jsx
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getApp } from './apps.config.js'
import { COLOR_BY_ID } from '@/shared/config/people.js'
import { cn } from '@/shared/lib/utils.js'

export default function ComingSoonView({ appId }) {
  const app = getApp(appId)
  const Icon = app?.icon
  const color = COLOR_BY_ID[app?.accent] || COLOR_BY_ID.amber

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 text-center px-6 fade-in">
      {Icon && (
        <span className={cn(
          'h-16 w-16 rounded-2xl flex items-center justify-center border',
          color.bgClass, color.textClass, color.borderClass,
        )}>
          <Icon size={30} strokeWidth={2} />
        </span>
      )}
      <div>
        <h1 className="text-xl font-semibold text-white">{app?.name || 'App'}</h1>
        <p className="text-sm text-white/40 mt-1">Bientôt disponible.</p>
      </div>
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition">
        <ArrowLeft size={14} /> Nos apps
      </Link>
    </div>
  )
}
```

- [ ] **Step 9 : Retirer le gating auth de FinauziApp.jsx**

Remplacer tout le contenu de `src/apps/finauzi/FinauziApp.jsx` par :

```jsx
import { useState, lazy, Suspense } from 'react'
import { UIProvider } from './context/UIContext.jsx'
import { AppDataProvider } from './context/AppDataContext.jsx'
import { CurrencyProvider } from './context/CurrencyContext.jsx'
import Shell from './components/layout/Shell.jsx'

const DashboardView = lazy(() => import('./views/DashboardView.jsx'))
const TransactionsView = lazy(() => import('./views/TransactionsView.jsx'))
const BudgetsView = lazy(() => import('./views/BudgetsView.jsx'))
const VoyageView = lazy(() => import('./views/VoyageView.jsx'))

function Splash() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <span className="h-7 w-7 border-2 border-white/15 border-t-white/80 rounded-full animate-spin" />
    </div>
  )
}

function ActiveView({ active, onNavigate }) {
  switch (active) {
    case 'transactions': return <TransactionsView />
    case 'budgets':      return <BudgetsView />
    case 'checklist':    return <VoyageView section="checklist" onNavigate={onNavigate} />
    case 'timeline':     return <VoyageView section="timeline"  onNavigate={onNavigate} />
    case 'dashboard':
    default:             return <DashboardView />
  }
}

export default function FinauziApp() {
  const [active, setActive] = useState('dashboard')
  return (
    <AppDataProvider>
      <CurrencyProvider>
        <UIProvider>
          <Shell active={active} onChange={setActive}>
            <Suspense fallback={<Splash />}>
              <ActiveView active={active} onNavigate={setActive} />
            </Suspense>
          </Shell>
        </UIProvider>
      </CurrencyProvider>
    </AppDataProvider>
  )
}
```

- [ ] **Step 10 : Supprimer l'ancien LoginView de FinAuzi**

```bash
git rm src/apps/finauzi/views/LoginView.jsx
```

- [ ] **Step 11 : Réécrire src/App.jsx (routes)**

```jsx
import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '@/platform/ProtectedRoute.jsx'
import Splash from '@/platform/Splash.jsx'
import LoginView from '@/platform/LoginView.jsx'
import DashboardView from '@/platform/DashboardView.jsx'
import ComingSoonView from '@/platform/ComingSoonView.jsx'

const FinauziApp = lazy(() => import('@/apps/finauzi/FinauziApp.jsx'))

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginView />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardView />} />
        <Route
          path="/finauzi"
          element={
            <Suspense fallback={<Splash />}>
              <FinauziApp />
            </Suspense>
          }
        />
        <Route path="/courses" element={<ComingSoonView appId="courses" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
```

- [ ] **Step 12 : Réécrire src/main.jsx (BrowserRouter)**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import App from './App.jsx'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
```

- [ ] **Step 13 : Build + smoke test**

Run: `npm run build` → Expected: vert.
Run: `npm run dev`, puis vérifier :
- `/login` → écran « Qui es-tu ? » → clic profil → mot de passe → connexion → `/` (dashboard, 2 cards).
- Clic card FinAuzi → `/finauzi`, l'app charge, nav interne (Transactions/Budgets/Checklist/Timeline) OK.
- Clic card Liste de courses → `/courses` « Bientôt disponible ».
- Déconnexion (bouton dashboard) → retour `/login`.

- [ ] **Step 14 : Commit**

```bash
git add -A
git commit -m "feat: add couple platform — login picker, dashboard, routing"
```

---

## Task 4 : Retour « Nos apps » depuis FinAuzi

**Files:**
- Modify: `src/apps/finauzi/components/layout/Sidebar.jsx`
- Modify: `src/apps/finauzi/components/layout/Shell.jsx`

- [ ] **Step 1 : Sidebar (desktop) — lien « ← Nos apps »**

Dans `Sidebar.jsx` : ajouter aux imports `import { Plus, ArrowLeft } from 'lucide-react'`
(remplace l'import `Plus` existant) et `import { Link } from 'react-router-dom'`.
Remplacer le bloc d'en-tête :

```jsx
      <div className="px-5 pt-6 pb-4">
        <p className="text-sm font-semibold tracking-tight text-white">FinAuzi</p>
      </div>
```

par :

```jsx
      <div className="px-3 pt-5 pb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-white/40 hover:text-white hover:bg-white/[0.04] transition"
        >
          <ArrowLeft size={14} /> Nos apps
        </Link>
        <p className="text-sm font-semibold tracking-tight text-white px-2 mt-2">FinAuzi</p>
      </div>
```

- [ ] **Step 2 : Shell — bouton retour (tablette) + barre fine (mobile)**

Dans `Shell.jsx` : ajouter aux imports `import { ArrowLeft } from 'lucide-react'`
et `import { Link } from 'react-router-dom'`.

(a) Dans le header tablette, ajouter le lien retour avant le titre. Remplacer :

```jsx
          <div className="max-w-3xl mx-auto px-6 py-3 flex items-center gap-6">
            <p className="text-sm font-semibold tracking-tight text-white">FinAuzi</p>
```

par :

```jsx
          <div className="max-w-3xl mx-auto px-6 py-3 flex items-center gap-6">
            <Link to="/" className="text-white/40 hover:text-white transition" title="Nos apps">
              <ArrowLeft size={16} />
            </Link>
            <p className="text-sm font-semibold tracking-tight text-white">FinAuzi</p>
```

(b) Ajouter une barre fine mobile (téléphone) juste après l'ouverture de
`<div className="flex-1 min-w-0 lg:ml-60">`, avant le `<header>` tablette :

```jsx
        {/* Phone-only top bar (< sm) : retour vers la plateforme */}
        <div className="sm:hidden sticky top-0 z-20 bg-[#0B0E13]/85 backdrop-blur-xl border-b border-white/5">
          <div className="px-4 py-3 flex items-center gap-3">
            <Link to="/" className="text-white/40 hover:text-white transition" title="Nos apps">
              <ArrowLeft size={18} />
            </Link>
            <p className="text-sm font-semibold tracking-tight text-white">FinAuzi</p>
          </div>
        </div>
```

- [ ] **Step 3 : Build + smoke test responsive**

Run: `npm run build` → vert.
Run: `npm run dev`. Sur `/finauzi` : desktop → « ← Nos apps » en haut de la Sidebar ramène au dashboard ; réduire la fenêtre (tablette) → flèche dans le header ; étroit (mobile) → barre fine en haut avec flèche. Chaque lien ramène à `/`.

- [ ] **Step 4 : Commit**

```bash
git add -A
git commit -m "feat: add back-to-platform navigation in FinAuzi"
```

---

## Task 5 : Rebrand & configuration de déploiement

**Files:**
- Modify: `index.html`
- Create: `vercel.json`
- Modify: `package.json` (optionnel)

- [ ] **Step 1 : Titre de l'onglet**

Dans `index.html`, remplacer la ligne `<title>` :
`<title>FinAuzi — Notre trésorerie pour l'Australie</title>`
→ `<title>Clément & Lise — Notre espace à deux</title>`

- [ ] **Step 2 : Créer vercel.json (rewrite SPA)**

Create `vercel.json` :

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

- [ ] **Step 3 : (Optionnel) Renommer le package**

Dans `package.json`, ligne 2 : `"name": "finauzi",` → `"name": "couple",`

- [ ] **Step 4 : Build final**

Run: `npm run build`
Expected: vert. Vérifier dans `dist/index.html` que le titre est bien « Clément & Lise — Notre espace à deux ».

- [ ] **Step 5 : Commit**

```bash
git add -A
git commit -m "chore: rebrand to Clément & Lise platform + Vercel SPA rewrites"
```

---

## Étapes manuelles (hors code, à faire par Clément)

Après merge/déploiement :
1. **Vercel** : renommer le domaine du projet `finauzi` → `couple` (Settings › Domains).
2. **Firebase Auth** : ajouter `couple.vercel.app` aux *Authorized domains*
   (Authentication › Settings), sinon le login échoue sur le nouveau domaine.
3. **people.js** : renseigner l'email de Lise dans `EMAIL_BY_UID` pour activer son login.

---

## Self-Review — couverture de la spec

- **§4.1 Structure 3 niveaux** → Task 2 (déplacements) ✓
- **§4.2 Alias `@/`** → Task 1 ✓
- **§4.3 Routes + ProtectedRoute** → Task 3 (App.jsx, ProtectedRoute, Splash, Forbidden) ✓
- **§4.4 Registre d'apps** → Task 3 Step 5 (apps.config.js) ✓
- **§5 Login picker (emails, erreurs FR, show/hide)** → Task 3 Steps 1, 6 ✓
- **§6 Dashboard (cards, grille, greeting, déconnexion)** → Task 3 Step 7 ✓
- **§7 Retour « Nos apps » (desktop/tablette/mobile)** → Task 4 ✓
- **§8 ComingSoon** → Task 3 Step 8 ✓
- **§9 Données Firestore inchangées** → aucune tâche (intentionnel : on ne touche pas aux services/règles) ✓
- **§10 Déploiement (vercel.json, titre, étapes manuelles)** → Task 5 + section « Étapes manuelles » ✓
- **§11 Vérification (build + smoke)** → étapes de build/smoke dans chaque tâche ✓

Pas de placeholder TODO bloquant (l'email de Lise est une valeur de config explicitement
documentée). Types/noms cohérents : `getEmailForUid`, `getApp`, `getPerson`, `COLOR_BY_ID`,
`APPS`, `accent`/`status` utilisés de façon identique entre `apps.config.js`, `DashboardView`,
`ComingSoonView`, `LoginView`.

# Conception — Plateforme « Clément & Lise » (multi-apps)

**Date :** 2026-05-29
**Périmètre :** Projet 1 — architecture plateforme. La Liste de courses fera l'objet d'un projet 2.

## 1. Contexte & objectif

Le projet actuel (`finauzi.vercel.app`) est une SPA Vite + React 18, **sans router**
(navigation par `useState` sur une variable `active`), avec Firebase Auth (email +
mot de passe) pour 2 utilisateurs fixes (Clément, Lise) et Firestore sous
`couples/main/{transactions,settings,checklist,timeline}`.

On transforme ce projet en **plateforme « couple »** qui regroupera plusieurs apps :

- Un **login unique** (réutilisé et amélioré) donne accès à un **dashboard**.
- Le dashboard affiche **une card par app**, en plein écran. Pour l'instant **2 cards** :
  **FinAuzi** et **Liste de courses**.
- Chaque app devient une **page à part** avec sa propre URL : `couple.vercel.app/finauzi`, etc.
- L'architecture doit permettre d'ajouter facilement de nouvelles apps (**jusqu'à 8**).

Le domaine passera de `finauzi.vercel.app` à `couple.vercel.app` (étape manuelle côté Vercel).

## 2. Périmètre

**Inclus (projet 1) :**
- Routing par URL (`react-router-dom`).
- Réorganisation en 3 niveaux : partagé / plateforme / apps.
- Login amélioré « Qui es-tu ? » (picker de profil + mot de passe).
- Dashboard avec grille de cards pilotée par un registre d'apps.
- Finauzi déplacé sous `/finauzi`, **nav interne inchangée**.
- Card « Liste de courses » → écran « Bientôt disponible » (`/courses`).
- Retour vers le dashboard depuis une app.
- `vercel.json` (rewrite SPA), rebrand du titre de l'onglet.

**Exclus (projet 2 et au-delà) :**
- La Liste de courses fonctionnelle (modèle de données, UI, service, règles Firestore).
- Tout autre future app.
- Mise en place de tests automatisés (Vitest) — proposable plus tard.

## 3. Décisions validées

| Sujet | Décision |
|-------|----------|
| Découpage | Plateforme d'abord ; Liste de courses = projet 2. |
| Navigation | Apps en plein écran + bouton « ← Nos apps ». Finauzi garde sa nav interne. |
| Login | Écran « Qui es-tu ? » (avatars Clément/Lise) puis mot de passe. |
| Nom plateforme | « Clément & Lise » / sous-titre « Notre espace à deux ». |
| Approche | A — apps modularisées (`react-router-dom` + `src/apps/<id>/` + `src/platform/`). |
| Email login | 2 emails codés en dur dans la config ; Lise à fournir (placeholder en attendant). |

## 4. Architecture

### 4.1 Structure des dossiers

Trois niveaux : **partagé** (commun à tout), **plateforme** (la coquille couple),
**apps** (chaque app autonome).

```
src/
├─ main.jsx                 # <BrowserRouter> + <AuthProvider> + <App/>
├─ App.jsx                  # déclaration des routes
├─ styles.css
├─ shared/
│  ├─ context/AuthContext.jsx
│  ├─ config/people.js      # UIDs, couleurs, EMAIL_BY_UID
│  ├─ lib/firebase.js
│  ├─ lib/utils.js
│  └─ ui/                   # dialog, popover, sonner, Modal, calendar, date-picker, sheet, PersonBadge
├─ platform/
│  ├─ apps.config.js        # registre des apps (source unique de vérité)
│  ├─ LoginView.jsx         # picker + mot de passe
│  ├─ DashboardView.jsx     # grille de cards
│  ├─ ComingSoonView.jsx    # « Bientôt disponible »
│  ├─ ProtectedRoute.jsx    # garde d'accès (auth + autorisé)
│  └─ Splash.jsx, Forbidden.jsx
└─ apps/
   └─ finauzi/
      ├─ FinauziApp.jsx     # = corps de l'App.jsx actuel (providers + Shell + nav interne)
      ├─ views/  components/  context/  config/  services/  utils/  hooks/
```

Ce qui est **partagé** : `AuthContext` (le login plateforme alimente toutes les apps),
`people.js` (UIDs/couleurs/emails — utilisés par le picker ET par Finauzi), `firebase.js`,
`utils.js` (helper `cn`), le kit `ui/` (primitives génériques).

Ce qui est **propre à Finauzi** : `AppDataContext`, `CurrencyContext`, `UIContext`, les
`views`, `components` (dashboard/budgets/chart/transactions/voyage/layout), `services`,
`utils` métier (cashflow/settlement/exportCsv), `config` (categories/navigation/journey/
suggestions), `hooks/useFinAuziData.js`.

Le branding « FinAuzi » **interne à l'app reste** (c'est le nom de l'app). Seul le niveau
plateforme porte « Clément & Lise ».

### 4.2 Alias d'import `@/`

Pour rendre les déplacements indolores, on ajoute un alias `@/` → `src/` :
- `vite.config.js` : `resolve.alias` avec `fileURLToPath(new URL('./src', import.meta.url))`.
- `jsconfig.json` : `compilerOptions.paths` `{ "@/*": ["src/*"] }` (confort éditeur).

Les imports deviennent stables : `@/shared/lib/firebase`, `@/shared/ui/dialog`, etc.,
quelle que soit la profondeur du fichier.

### 4.3 Carte des routes (`App.jsx`)

| URL | Écran | Accès |
|-----|-------|-------|
| `/login` | LoginView (picker + mot de passe) | public ; si déjà connecté → redirige vers `/` |
| `/` | DashboardView (les cards) | protégé |
| `/finauzi` | FinauziApp (nav interne) | protégé, lazy-loaded |
| `/courses` | ComingSoonView | protégé |
| `*` | `<Navigate to="/" replace />` | — |

`main.jsx` : `<BrowserRouter><AuthProvider><App/></AuthProvider></BrowserRouter>`.

`ProtectedRoute` = route de layout avec `<Outlet/>` :
- `isLoading` → `<Splash/>`
- non authentifié → `<Navigate to="/login" replace/>`
- authentifié mais UID non autorisé → `<Forbidden/>` (l'écran « Accès refusé » existant)
- sinon → `<Outlet/>`

Finauzi reste **lazy** (`React.lazy`), donc son bundle ne se charge qu'en arrivant sur
`/finauzi`. Ses sous-vues internes restent lazy comme aujourd'hui.

### 4.4 Registre des apps (`platform/apps.config.js`)

Source unique de vérité qui pilote les cards du dashboard.

```js
import { Wallet, ShoppingCart } from 'lucide-react'

export const APPS = [
  {
    id: 'finauzi',
    name: 'FinAuzi',
    description: 'Notre trésorerie pour l’Australie',
    path: '/finauzi',
    icon: Wallet,
    accent: 'amber',      // clé de palette → classes Tailwind pré-bakées
    status: 'live',       // 'live' | 'soon'
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
```

**Ajouter une app = (1)** une entrée ici **+ (2)** une ligne `<Route>` dans `App.jsx`.
Les couleurs d'accent réutilisent des classes Tailwind explicites (pré-bakées) pour que
le bundler les conserve. La grille s'adapte (1 → 2 → 3-4 colonnes selon le nombre d'apps).

## 5. Login « Qui es-tu ? » (`platform/LoginView.jsx`)

**Écran 1 — choix du profil.** Deux grandes cards : Clément (ambre, initiale « C ») et
Lise (violet, initiale « L »), construites depuis `people.js` (`getPerson`). Clic → sélection.

**Écran 2 — mot de passe.** Affiche le profil choisi (avatar + « Connexion en tant que
Clément »), un champ mot de passe avec **bouton afficher/masquer**, « Se connecter »,
« Mot de passe oublié ? », et « ← Changer d'utilisateur ». L'email est résolu depuis
`EMAIL_BY_UID` (non saisi).

**Messages d'erreur en français** (mapping des codes Firebase) :
- `auth/invalid-credential`, `auth/wrong-password` → « Mot de passe incorrect »
- `auth/user-not-found` → « Compte introuvable »
- `auth/too-many-requests` → « Trop de tentatives, réessaie plus tard »
- `auth/network-request-failed` → « Problème de connexion réseau »
- défaut → « Connexion impossible, réessaie »

**Persistance :** session conservée entre les visites (persistance locale Firebase, déjà
en place). Au chargement, si l'utilisateur est déjà connecté, on saute le login.

**Emails (`shared/config/people.js`) :**
```js
export const EMAIL_BY_UID = {
  [CLEMENT_UID]: 'clemboudon06@gmail.com',
  [LISE_UID]: '', // À FOURNIR par Clément avant que le login de Lise fonctionne
}
```
Si l'email d'un profil est vide, la sélection de ce profil affiche un message clair
(« Email non configuré pour ce profil ») au lieu d'un échec silencieux. Le login de
Clément fonctionne immédiatement ; celui de Lise dès que son email est renseigné.

## 6. Dashboard (`platform/DashboardView.jsx`)

Plein écran. **En-tête :** « Clément & Lise » + sous-titre « Notre espace à deux » +
bonjour personnalisé (« Bonsoir Clément », selon `currentUid` + heure) + bouton déconnexion.

**Grille de cards** responsive remplissant l'écran : sur desktop 2 grandes cards côte à
côte (empilées sur mobile), prête à passer à 3-4 colonnes au-delà. Chaque card (générée
depuis `APPS`) : icône en couleur d'accent + nom + description + effet de survol (lift).
- `status: 'live'` → `<Link to={path}>`.
- `status: 'soon'` → badge « Bientôt », mène à `/courses` (ComingSoonView).

## 7. Retour vers le dashboard depuis Finauzi

Ajout léger, Finauzi garde tout le reste :
- **Desktop** : lien « ← Nos apps » en haut de la `Sidebar` Finauzi (au-dessus d'Accueil),
  via `<Link to="/">`.
- **Tablette/mobile** : une fine barre haute (icône maison + « FinAuzi ») avec retour vers `/`.

## 8. « Bientôt disponible » (`platform/ComingSoonView.jsx`)

Écran sobre : icône de l'app (depuis le registre) + « Bientôt disponible » + court texte +
bouton « ← Nos apps ». Réutilisable pour toute future app au statut `soon`.

## 9. Données / Firestore

**Inchangé.** Finauzi continue d'utiliser `couples/main/{transactions,settings,checklist,
timeline}` ; les `firestore.rules` ne changent pas. Aucune migration de données.

Pour l'extensibilité : chaque future app ajoutera ses propres sous-collections sous
`couples/main/<app>` et ses propres règles, dans son propre projet (ex. la Liste de courses
→ `couples/main/shopping`).

## 10. Déploiement & rebrand

- **`vercel.json`** (nouveau) : rewrite SPA pour que les liens directs / rafraîchissements
  sur `/finauzi`, `/courses` servent `index.html` :
  ```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
  ```
- **`index.html`** : `<title>` → « Clément & Lise — Notre espace à deux ».
- **`package.json`** : `name` `finauzi` → `couple` (cosmétique, optionnel).
- **Étapes manuelles (Clément, hors code) :**
  1. Renommer le domaine `finauzi` → `couple` dans le projet Vercel.
  2. Ajouter `couple.vercel.app` aux **domaines autorisés** de Firebase Auth
     (sinon le login casse sur le nouveau domaine).

## 11. Vérification

Pas de tests automatisés dans le projet aujourd'hui. Vérification par :
- `npm run build` propre (aucune erreur d'import après les déplacements).
- **Smoke test manuel :** login picker → mot de passe → dashboard ; clic FinAuzi → l'app
  charge + nav interne (Transactions/Budgets/Checklist/Timeline) OK ; « ← Nos apps » revient
  au dashboard ; **rafraîchir sur `/finauzi`** (valide le rewrite) ; `/courses` → « Bientôt » ;
  déconnexion → retour login ; URL inconnue → redirige vers `/`.

## 12. Ordre de migration des fichiers

1. **Outillage** : `npm i react-router-dom` ; alias `@/` (`vite.config.js`, `jsconfig.json`).
2. **Partagé** : créer `src/shared/`, y déplacer `AuthContext`, `people.js`, `firebase.js`,
   `utils.js`, le kit `ui/` ; corriger les imports (alias).
3. **Finauzi** : déplacer le reste dans `src/apps/finauzi/` ; créer `FinauziApp.jsx`
   (corps de l'`App.jsx` actuel, sans le gating auth) ; corriger les imports vers `@/shared`.
4. **Plateforme** : `apps.config.js`, `ProtectedRoute`, `Splash`/`Forbidden`, `LoginView`
   (picker), `DashboardView`, `ComingSoonView`.
5. **Câblage** : réécrire `App.jsx` (Routes) ; mettre à jour `main.jsx` (`BrowserRouter`).
6. **Retour** : lien « ← Nos apps » dans la `Sidebar` Finauzi + fine barre mobile.
7. **Rebrand/déploiement** : `index.html`, `vercel.json`, (option) `package.json`.
8. **Vérif** : `npm run build` + smoke test manuel.

Le dossier `legacy/` n'est pas touché.

## 13. Risques & points d'attention

- **Churn d'imports** lors des déplacements → atténué par l'alias `@/` et un `npm run build`
  de contrôle après chaque grand déplacement.
- **Domaines autorisés Firebase** : sans l'ajout de `couple.vercel.app`, le login échouera
  sur le nouveau domaine (étape manuelle, à ne pas oublier).
- **Email de Lise** manquant tant qu'il n'est pas fourni → géré par un message explicite.
- **`react-router-dom`** est déjà anticipé dans le `manualChunks` du `vite.config.js`
  (chunk `react-vendor`) — cohérent.

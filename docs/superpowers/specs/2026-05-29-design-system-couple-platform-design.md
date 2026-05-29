# Conception — Design system « Clément & Lise » (multi-thèmes, identité premium)

**Date :** 2026-05-29
**Périmètre :** Fondation du design system + refonte du Hub. Refonte profonde des écrans FinAuzi
et construction de Courses = projets ultérieurs.

## 1. Contexte & objectif

La plateforme fonctionne (login picker, dashboard de cards, FinAuzi sous `/finauzi`). On veut
maintenant une **vraie identité premium** inspirée de Trade Republic et Gemini : minimaliste,
épuré, raffiné — et surtout un **design system** qui donne à chaque app une **ambiance propre**
pour ne pas avoir l'impression de rester sur le même écran, tout en partageant la même grammaire
visuelle (composants, espacements, motion, typo).

Idée directrice validée : **chaque app a son mode lumineux ET son accent**.

## 2. Périmètre

**Inclus :**
- Infrastructure de theming par **variables CSS** (mode + accent composables).
- Les **3 thèmes** : Hub (indigo/sombre), FinAuzi (ambre/sombre), Courses (vert/clair).
- **Typographie** Geist (Sans + Mono), remplace Inter.
- **Kit de composants** style shadcn (Button, Card, Input, Badge) + re-thématisation du kit Radix.
- **Motion** : micro-interactions + fondu de thème à l'entrée d'app.
- **Refonte du Hub** : login « Qui es-tu ? » + dashboard.
- **Adoption du thème par la coque FinAuzi** (Shell, Sidebar, BottomNav, back-nav, CTA → ambre).

**Exclus (suite) :**
- Refonte profonde écran par écran de FinAuzi (transactions, budgets, voyage).
- Construction de l'app Courses (son thème clair/vert est défini, réalisé à ce moment-là).
- Toggle clair/sombre manuel par l'utilisateur (le mode est porté par l'app, pas un choix user).

## 3. Décisions validées

| Sujet | Décision |
|-------|----------|
| Ambiance | Un mode par app : FinAuzi sombre, Courses clair, Hub sombre signature. |
| Accents | Hub indigo `#7C5CFC` · FinAuzi ambre `#F59E0B` · Courses vert `#10B981`. |
| Méthode | Variables CSS sémantiques + mapping Tailwind (modèle shadcn). |
| Typo | Geist Sans (UI) + Geist Mono (montants). |
| Composants | Primitives shadcn-style (cva) + re-thématisation du kit Radix existant. |
| Périmètre | Fondation + Hub ; coque FinAuzi en ambre ; reste différé. |

## 4. Architecture de theming

### 4.1 Tokens (variables CSS, en RGB pour l'opacité)

Deux dimensions composables, posées sur `<html>` via `data-theme` (mode) et `data-accent` (couleur).

```css
[data-theme="dark"] {
  --bg: 11 14 19;          /* #0B0E13 */
  --surface: 22 27 36;     /* cards / panneaux */
  --surface-2: 28 34 48;   /* hover / secondaire */
  --border: 31 38 50;
  --border-strong: 42 50 66;
  --fg: 245 247 250;       /* texte principal */
  --muted: 154 163 178;    /* texte secondaire */
  --faint: 107 114 128;    /* texte tertiaire */
}
[data-theme="light"] {
  --bg: 250 250 251;       /* #FAFAFB */
  --surface: 255 255 255;
  --surface-2: 244 245 247;
  --border: 228 230 235;
  --border-strong: 209 213 220;
  --fg: 17 20 27;
  --muted: 90 98 112;
  --faint: 140 148 160;
}
[data-accent="indigo"]  { --accent: 124 92 252; --accent-fg: 255 255 255; }
[data-accent="amber"]   { --accent: 245 158 11;  --accent-fg: 23 23 23;  }
[data-accent="emerald"] { --accent: 16 185 129;  --accent-fg: 255 255 255; }
```

Couleurs sémantiques (constantes, indépendantes du thème) : `success #22C55E`, `danger #EF4444`,
`warning #F59E0B`.

### 4.2 Mapping Tailwind

`tailwind.config.js` expose des utilitaires adossés aux variables (avec `<alpha-value>` pour
l'opacité), p. ex. : `bg-bg`, `bg-surface`, `bg-surface-2`, `border-border`, `border-strong`,
`text-fg`, `text-muted`, `text-faint`, `bg-accent`, `text-accent-fg`, `text-accent`, `ring-accent`.

Conséquence clé : **un composant écrit une fois s'adapte automatiquement** au thème actif.
Les anciens tokens (`bg.base`, `text.primary`, `brand`) sont conservés le temps de la migration,
puis retirés ; les rares usages directs (ex. `index.html`) sont migrés.

### 4.3 Application du thème

Un hook `useAppTheme(theme, accent)` (dans `src/shared/theme/`) pose `data-theme`/`data-accent`
sur `document.documentElement`, met à jour `color-scheme` et `<meta name="theme-color">`, et nettoie
au démontage. Chaque zone l'appelle :
- Hub (login + dashboard) → `('dark', 'indigo')`
- FinAuzi (`FinauziApp`) → `('dark', 'amber')`
- Courses (`ComingSoonView`, futur app) → `('light', 'emerald')`

Le fond du document, les scrollbars et `color-scheme` suivent ainsi le thème actif (plus de
`#0B0E13` codé en dur dans `styles.css` : la couleur de fond vient de `--bg`).

## 5. Typographie

- **Geist Sans** (UI) + **Geist Mono** (montants / chiffres tabulaires), chargés via Google Fonts
  dans `index.html` (remplace le lien Inter). `font-sans` → Geist Sans, `font-mono` → Geist Mono.
- Échelle resserrée premium : titres `tracking-[-0.02em]`, graisses 400/500/600/700.
- Montants FinAuzi en `font-mono tabular` pour l'alignement.

## 6. Kit de composants (style shadcn)

Nouvelle dépendance : `class-variance-authority` (cva). Primitives dans `src/shared/ui/`, token-based :

- **Button** — `cva` variants : `accent` (plein, `bg-accent text-accent-fg`), `secondary`
  (`bg-surface-2`), `ghost`, `outline` ; tailles `sm`/`md`/`lg` ; `focus-visible:ring-2 ring-accent`,
  `active:scale-[0.98]`, transitions.
- **Card** — `bg-surface border border-border rounded-2xl`, prop `interactive` (hover lift).
- **Input** — `bg-surface-2 border-border text-fg`, `focus-visible:ring-2 ring-accent`.
- **Badge** — neutre (`bg-surface-2 text-muted`) ou `accent` (`bg-accent/12 text-accent`).

Kit Radix existant (dialog, popover, sheet, sonner, calendar, date-picker, Modal) **re-thématisé** :
remplacement des `bg-white/[…]`, `text-white/…`, `border-white/…` par les tokens. APIs inchangées.

## 7. Motion

- Micro-interactions : `active:scale-[0.98]` sur les boutons, hover lift sur les cards, focus ring
  accent, transitions `colors`/`transform` douces.
- Entrée de contenu : `fade-in` / `slide-up` (déjà présents) sur les vues.
- **Fondu de thème** : à l'entrée dans une app, court overlay de la couleur `--bg` cible en fondu
  (~250 ms, cubic-bezier 0.16/1/0.3/1) pour que le passage sombre→clair (Courses) soit volontaire.
- `@media (prefers-reduced-motion: reduce)` : animations neutralisées.

## 8. Refonte du Hub (indigo / sombre)

- **`LoginView`** : fond sombre avec halo radial indigo subtil. Titre « Clément & Lise » (Geist),
  sous-titre « Notre espace à deux ». Picker : 2 cards de profil généreuses, avatar cerclé de la
  couleur de la personne (ambre / violet), hover lift. Écran mot de passe : `Input` + `Button accent`
  (indigo), afficher/masquer, erreurs FR (déjà en place), « Changer d'utilisateur ».
- **`DashboardView`** : header premium (wordmark, bonjour + date, déconnexion discrète en avatar).
  Les `AppCard` deviennent les héros et **prévisualisent l'univers de l'app** : carte FinAuzi en
  sombre/ambre, carte Courses en **clair/vert** (tuile lumineuse dans le hub sombre). Icône, nom,
  description, badge « Bientôt » pour Courses, motion au survol. Espacement généreux.

## 9. Adoption du thème par la coque FinAuzi

- `FinauziApp` appelle `useAppTheme('dark', 'amber')`.
- Re-thématisation de la **coque** vers tokens + accent ambre :
  - `Sidebar` : item actif, bouton « Nouvelle transaction » (→ `Button accent`), lien « Nos apps »,
    avatar réglages ; surfaces en `surface`/`border`.
  - `Shell` : barres tablette/mobile en `surface`/`border`/`fg`.
  - `BottomNav` : état actif en `text-accent`.
- Écrans internes (transactions, budgets, voyage) : inchangés pour l'instant (différé).

## 10. Fichiers (création / modification)

**Création :**
- `src/shared/theme/useAppTheme.js` — hook d'application du thème.
- `src/shared/ui/Button.jsx`, `Card.jsx`, `Input.jsx`, `Badge.jsx` — primitives.

**Modification :**
- `tailwind.config.js` — fontFamily (Geist), couleurs adossées aux variables.
- `src/styles.css` — définition des thèmes (variables CSS), retrait du `#0B0E13` codé en dur,
  keyframe du fondu de thème, scrollbars adossées aux tokens.
- `index.html` — lien Google Fonts Geist (remplace Inter).
- `src/platform/LoginView.jsx`, `DashboardView.jsx`, `ComingSoonView.jsx` — refonte + `useAppTheme`.
- `src/apps/finauzi/FinauziApp.jsx` — `useAppTheme('dark','amber')`.
- `src/apps/finauzi/components/layout/{Shell,Sidebar,BottomNav}.jsx` — tokens + accent.
- Kit `src/shared/ui/{dialog,popover,sheet,sonner,Modal,calendar,date-picker}.jsx` — re-thématisation.
- `package.json` — `class-variance-authority`, `geist` non requis (chargé via Google Fonts).

## 11. Vérification

Pas de tests automatisés. Vérification : `npm run build` propre + smoke test manuel (lancés par
Clément avec `! …`) :
- Login indigo/sombre, Geist appliqué, picker + mot de passe OK.
- Dashboard : header premium, card FinAuzi sombre/ambre, card Courses claire/verte.
- `/finauzi` : coque ambre, Sidebar/BottomNav en accent ambre, retour « Nos apps ».
- `/courses` : thème clair/vert, fondu de thème à l'entrée non agressif.
- Modales/toasts suivent le thème actif. `prefers-reduced-motion` respecté.

## 12. Risques & points d'attention

- **Collision de tokens Tailwind** (anciens `bg.*`/`text.*`/`brand` vs nouveaux) : on conserve les
  anciens le temps de migrer, on retire à la fin ; migrer les usages directs (`index.html`).
- **Chargement des polices** : Geist via Google Fonts ; garder une pile de secours système pour
  éviter le FOUT.
- **Écrans FinAuzi non re-skinnés** : ils restent en sombre neutre et cohabitent avec la coque
  ambre — acceptable (différé), pas de régression fonctionnelle.
- **Contraste accent ambre** : texte foncé (`--accent-fg: 23 23 23`) sur boutons ambre pour l'AA.

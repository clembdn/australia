import { useState, useMemo, useEffect } from 'react'
import {
  Plane, Calendar, Flame, TrendingDown, GraduationCap, CheckCircle2,
  Plus, Pencil, Trash2, Target, Coins, BarChart3, Save, X, ChevronUp, ChevronDown,
} from 'lucide-react'
import { useCurrency } from '../context/CurrencyContext.jsx'
import { australia as defaultAustralia } from '../data/portfolio.js'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell,
  AreaChart, Area,
} from 'recharts'

const STORAGE_KEY = 'atlas-australia-data'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

function getDefaultData() {
  return {
    loanGoal: defaultAustralia.loanGoal,
    loanRaised: defaultAustralia.loanRaised,
    departureDate: defaultAustralia.departureDate,
    monthlyBurn: defaultAustralia.monthlyBurn,
    monthlyIncome: defaultAustralia.monthlyIncome,
    settlement: defaultAustralia.settlement.map((s, i) => ({ ...s, id: `sett-${i}` })),
    budgets: [],
    goals: [],
  }
}

function ProgressBar({ value, total }) {
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0
  return (
    <div className="h-1.5 w-full rounded-full bg-bg-elevated overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-brand to-brand-glow transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function InlineInput({ value, onSave, className = '' }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  useEffect(() => setDraft(value), [value])

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className={`group/inline inline-flex items-center gap-1 hover:text-text-primary transition-colors ${className}`}
      >
        <span>{value}</span>
        <Pencil className="h-3 w-3 opacity-0 group-hover/inline:opacity-60 transition-opacity" />
      </button>
    )
  }

  const commit = () => {
    if (draft !== value) onSave(draft)
    setEditing(false)
  }

  return (
    <span className="inline-flex items-center gap-1">
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
        className="h-6 w-full rounded bg-bg-elevated border border-brand px-1.5 text-sm outline-none"
      />
      <button onClick={commit} className="text-success hover:text-text-primary"><Save className="h-3 w-3" /></button>
      <button onClick={() => setEditing(false)} className="text-danger hover:text-text-primary"><X className="h-3 w-3" /></button>
    </span>
  )
}

function NumberInput({ value, onChange, min = 0, step = 1, className = '' }) {
  return (
    <input
      type="number"
      min={min}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      className={`h-8 w-24 rounded-lg bg-bg-elevated border border-border-subtle px-2 text-sm outline-none focus:border-brand tabular-nums ${className}`}
    />
  )
}

const TABS = [
  { id: 'expenses', label: 'Dépenses', icon: Coins },
  { id: 'forecast', label: 'Prévisions', icon: BarChart3 },
  { id: 'goals', label: 'Objectifs', icon: Target },
]

export default function AustraliaView() {
  const { format } = useCurrency()
  const [data, setData] = useState(() => loadFromStorage() || getDefaultData())
  const [activeTab, setActiveTab] = useState('expenses')
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showAddBudget, setShowAddBudget] = useState(false)
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [editingExpenseId, setEditingExpenseId] = useState(null)

  useEffect(() => saveToStorage(data), [data])

  const update = (patch) => setData((prev) => ({ ...prev, ...patch }))

  const settlementTotal = data.settlement.reduce((s, x) => s + x.cost, 0)
  const settlementPaid = data.settlement.reduce((s, x) => s + x.paid, 0)
  const settlementPct = settlementTotal > 0 ? ((settlementPaid / settlementTotal) * 100).toFixed(0) : 0

  const monthsToDeparture = useMemo(() => {
    const dep = new Date(data.departureDate)
    const now = new Date()
    return Math.max(0, (dep.getFullYear() - now.getFullYear()) * 12 + (dep.getMonth() - now.getMonth()))
  }, [data.departureDate])

  const netBurn = data.monthlyBurn - data.monthlyIncome
  const runwayMonths = netBurn > 0 ? Math.floor(data.loanGoal / netBurn) : 0

  // --- Expense CRUD ---
  const addExpense = (item) => {
    update({ settlement: [...data.settlement, { ...item, id: `sett-${Date.now()}` }] })
    setShowAddExpense(false)
  }

  const updateExpense = (id, patch) => {
    update({
      settlement: data.settlement.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    })
  }

  const deleteExpense = (id) => {
    update({ settlement: data.settlement.filter((e) => e.id !== id) })
  }

  // --- Budget forecast ---
  const budgetProjection = useMemo(() => {
    const months = Math.min(monthsToDeparture, 24)
    if (months <= 0) return []
    const rows = []
    let cumExpense = settlementPaid
    let cumIncome = 0
    for (let m = 1; m <= months; m++) {
      cumExpense += data.monthlyBurn
      cumIncome += data.monthlyIncome
      const d = new Date()
      d.setMonth(d.getMonth() + m)
      rows.push({
        month: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
        depenses: Math.round(cumExpense),
        revenus: Math.round(cumIncome),
        net: Math.round(cumExpense - cumIncome),
        loanRemaining: Math.max(0, data.loanGoal - (data.loanRaised + cumIncome - cumExpense + settlementPaid)),
      })
    }
    return rows
  }, [monthsToDeparture, data.monthlyBurn, data.monthlyIncome, data.loanGoal, data.loanRaised, settlementPaid])

  const addBudgetMonth = (entry) => {
    update({ budgets: [...data.budgets, { ...entry, id: `bud-${Date.now()}` }] })
    setShowAddBudget(false)
  }

  const deleteBudget = (id) => {
    update({ budgets: data.budgets.filter((b) => b.id !== id) })
  }

  // --- Goals CRUD ---
  const addGoal = (goal) => {
    update({ goals: [...data.goals, { ...goal, id: `goal-${Date.now()}`, progress: goal.progress || 0 }] })
    setShowAddGoal(false)
  }

  const updateGoal = (id, patch) => {
    update({ goals: data.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) })
  }

  const deleteGoal = (id) => {
    update({ goals: data.goals.filter((g) => g.id !== id) })
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
            Gérez vos dépenses, prévisions budgétaires et objectifs avant le départ.
          </p>
        </div>
        <span className="pill border border-brand/30 bg-brand/10 text-brand-glow">
          <Calendar className="h-3 w-3" />
          Départ {new Date(data.departureDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
          <span className="text-text-muted ml-1">· {monthsToDeparture} mois</span>
        </span>
      </div>

      {/* Loan progress hero */}
      <section className="card">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <p className="stat-label flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5" /> Prêt étudiant collecté
            </p>
            <p className="stat-value flex items-center gap-2">
              <InlineInput
                value={data.loanRaised}
                onSave={(v) => update({ loanRaised: Number(v) || 0 })}
                className="stat-value"
              />
              <span className="text-base font-normal text-text-muted">
                / <InlineInput
                  value={data.loanGoal}
                  onSave={(v) => update({ loanGoal: Number(v) || 0 })}
                  className="text-text-muted"
                />
              </span>
            </p>
          </div>
          <p className="text-sm tabular-nums text-text-secondary">
            {data.loanGoal > 0 ? ((data.loanRaised / data.loanGoal) * 100).toFixed(1) : 0}%
            <span className="text-text-muted ml-1">financé</span>
          </p>
        </div>
        <ProgressBar value={data.loanRaised} total={data.loanGoal} />
        <p className="text-xs text-text-muted mt-2">
          Écart restant : <span className="text-text-primary tabular-nums">
            {format(Math.max(0, data.loanGoal - data.loanRaised))}
          </span>
        </p>
      </section>

      {/* Tabs */}
      <div className="inline-flex p-0.5 rounded-lg bg-bg-elevated border border-border-subtle">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 h-9 rounded-md text-sm font-medium transition-colors ${
                isActive ? 'bg-brand text-white shadow-glow' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* =================== TAB: DÉPENSES =================== */}
      {activeTab === 'expenses' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <section className="card">
            <header className="flex items-end justify-between mb-4">
              <div>
                <p className="stat-label">Coûts d'établissement</p>
                <p className="stat-value">{format(settlementPaid)}</p>
                <p className="text-xs text-text-muted">sur {format(settlementTotal)}</p>
              </div>
              <span className="pill bg-brand/10 border border-brand/30 text-brand-glow">{settlementPct}%</span>
            </header>

            <ProgressBar value={settlementPaid} total={settlementTotal} />

            <ul className="mt-5 space-y-3">
              {data.settlement.map((item) => {
                const itemPct = item.cost > 0 ? (item.paid / item.cost) * 100 : 0
                const done = item.paid >= item.cost
                const isEditing = editingExpenseId === item.id

                return (
                  <li key={item.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 min-w-0">
                        {done ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                        ) : (
                          <span className="h-3.5 w-3.5 rounded-full border border-border-strong shrink-0" />
                        )}
                        <InlineInput
                          value={item.name}
                          onSave={(v) => updateExpense(item.id, { name: v })}
                          className="truncate"
                        />
                      </span>
                      <span className="flex items-center gap-1.5 shrink-0 ml-3">
                        {isEditing ? (
                          <>
                            <NumberInput
                              value={item.paid}
                              onChange={(v) => updateExpense(item.id, { paid: v })}
                              className="w-20"
                            />
                            <span className="text-text-muted">/</span>
                            <NumberInput
                              value={item.cost}
                              onChange={(v) => updateExpense(item.id, { cost: v })}
                              className="w-20"
                            />
                            <button onClick={() => setEditingExpenseId(null)} className="text-success"><Save className="h-3.5 w-3.5" /></button>
                            <button onClick={() => setEditingExpenseId(null)} className="text-text-muted"><X className="h-3.5 w-3.5" /></button>
                          </>
                        ) : (
                          <>
                            <span className="tabular-nums text-text-secondary">
                              {format(item.paid)}{' '}
                              <span className="text-text-muted">/ {format(item.cost)}</span>
                            </span>
                            <button onClick={() => setEditingExpenseId(item.id)} className="text-text-muted hover:text-text-primary"><Pencil className="h-3 w-3" /></button>
                            <button onClick={() => deleteExpense(item.id)} className="text-danger/60 hover:text-danger"><Trash2 className="h-3 w-3" /></button>
                          </>
                        )}
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-bg-elevated overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${done ? 'bg-success' : 'bg-brand'}`}
                        style={{ width: `${Math.min(100, itemPct)}%` }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>

          {/* Add expense form + Burn rate */}
          <div className="space-y-5">
            {showAddExpense ? (
              <AddExpenseForm onAdd={addExpense} onCancel={() => setShowAddExpense(false)} format={format} />
            ) : (
              <button
                onClick={() => setShowAddExpense(true)}
                className="card card-hover w-full flex items-center justify-center gap-2 py-6 border-dashed border-2 border-border-subtle text-text-secondary hover:text-brand-glow hover:border-brand/40 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Ajouter une dépense
              </button>
            )}

            <section className="card">
              <header className="mb-4">
                <p className="stat-label flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5" /> Dépenses mensuelles
                </p>
                <p className="stat-value">
                  <InlineInput
                    value={data.monthlyBurn}
                    onSave={(v) => update({ monthlyBurn: Number(v) || 0 })}
                    className="stat-value"
                  />
                </p>
                <p className="text-xs text-text-muted">Loyer + courses + transport + divers estimé</p>
              </header>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border-subtle bg-bg-elevated p-3">
                  <p className="stat-label">Revenus</p>
                  <p className="text-lg font-semibold tabular-nums text-success">
                    <InlineInput
                      value={data.monthlyIncome}
                      onSave={(v) => update({ monthlyIncome: Number(v) || 0 })}
                      className="text-success"
                    />
                  </p>
                  <p className="text-[11px] text-text-muted">Temps partiel, plafond 20h/sem</p>
                </div>
                <div className="rounded-lg border border-border-subtle bg-bg-elevated p-3">
                  <p className="stat-label">Dépense nette</p>
                  <p className="text-lg font-semibold tabular-nums text-danger">
                    −{format(netBurn)}
                  </p>
                  <p className="text-[11px] text-text-muted">Après déduction des revenus</p>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-border-subtle bg-bg-elevated p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="stat-label flex items-center gap-1.5">
                    <TrendingDown className="h-3.5 w-3.5" /> Autonomie du prêt
                  </span>
                  <span className="text-xs text-text-muted tabular-nums">
                    {format(data.loanGoal)} ÷ {format(netBurn)}
                  </span>
                </div>
                <p className="text-3xl font-semibold tabular-nums">
                  {runwayMonths} <span className="text-base font-normal text-text-secondary">mois</span>
                </p>
                <p className="text-xs text-text-muted mt-1">
                  ≈ {(runwayMonths / 12).toFixed(1)} années académiques sur l'enveloppe du prêt.
                </p>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* =================== TAB: PRÉVISIONS =================== */}
      {activeTab === 'forecast' && (
        <div className="space-y-6">
          <section className="card">
            <header className="mb-4">
              <p className="stat-label flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4" /> Projection budgétaire
              </p>
              <p className="text-sm text-text-secondary">
                Estimation cumulée sur {monthsToDeparture} mois avant le départ
              </p>
            </header>

            {budgetProjection.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={budgetProjection} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="depGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#EF4444" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22C55E" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#1F2632" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#1F2632' }} />
                    <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tickLine={false} axisLine={{ stroke: '#1F2632' }} width={48} />
                    <Tooltip
                      cursor={{ stroke: '#2A3242', strokeWidth: 1 }}
                      contentStyle={{ backgroundColor: '#11151C', border: '1px solid #1F2632', borderRadius: 8 }}
                      labelStyle={{ color: '#9AA3B2', fontSize: 12 }}
                      formatter={(v) => [format(v), '']}
                    />
                    <Area type="monotone" dataKey="depenses" name="Dépenses cumulées" stroke="#EF4444" strokeWidth={2} fill="url(#depGrad)" />
                    <Area type="monotone" dataKey="revenus" name="Revenus cumulés" stroke="#22C55E" strokeWidth={2} fill="url(#revGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-text-muted py-8 text-center">Aucune donnée de prévision disponible.</p>
            )}
          </section>

          {/* Budget summary table */}
          <section className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-text-muted border-b border-border-subtle">
                  <th className="px-5 py-3 font-medium">Mois</th>
                  <th className="px-5 py-3 font-medium text-right">Dépenses cumulées</th>
                  <th className="px-5 py-3 font-medium text-right">Revenus cumulés</th>
                  <th className="px-5 py-3 font-medium text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                {budgetProjection.map((row, i) => (
                  <tr key={i} className="border-b border-border-subtle/60 last:border-0 hover:bg-bg-hover/60 transition-colors">
                    <td className="px-5 py-3 font-medium">{row.month}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-danger">{format(row.depenses)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-success">{format(row.revenus)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-text-secondary">{format(row.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Custom budget entries */}
          <section className="card">
            <header className="flex items-center justify-between mb-4">
              <div>
                <p className="stat-label">Entrées budgétaires personnalisées</p>
                <p className="text-xs text-text-muted">Ajoutez des postes budgétaires spécifiques</p>
              </div>
              <button
                onClick={() => setShowAddBudget(!showAddBudget)}
                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg bg-brand text-white text-xs font-medium hover:bg-brand/90 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Ajouter
              </button>
            </header>

            {showAddBudget && (
              <AddBudgetForm onAdd={addBudgetMonth} onCancel={() => setShowAddBudget(false)} format={format} />
            )}

            {data.budgets.length > 0 ? (
              <ul className="space-y-2">
                {data.budgets.map((b) => (
                  <li key={b.id} className="flex items-center justify-between text-sm rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="truncate font-medium">{b.label}</span>
                      <span className="text-text-muted text-xs">{b.month}</span>
                    </span>
                    <span className="flex items-center gap-2 shrink-0">
                      <span className="tabular-nums">{format(b.amount)}</span>
                      <button onClick={() => deleteBudget(b.id)} className="text-danger/60 hover:text-danger"><Trash2 className="h-3 w-3" /></button>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-text-muted text-center py-4">Aucune entrée personnalisée.</p>
            )}
          </section>
        </div>
      )}

      {/* =================== TAB: OBJECTIFS =================== */}
      {activeTab === 'goals' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label flex items-center gap-1.5">
                <Target className="h-4 w-4" /> Objectifs financiers
              </p>
              <p className="text-sm text-text-secondary">Définissez et suivez vos objectifs avant le départ</p>
            </div>
            <button
              onClick={() => setShowAddGoal(!showAddGoal)}
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand/90 transition-colors"
            >
              <Plus className="h-4 w-4" /> Nouvel objectif
            </button>
          </div>

          {showAddGoal && (
            <AddGoalForm onAdd={addGoal} onCancel={() => setShowAddGoal(false)} format={format} />
          )}

          {data.goals.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {data.goals.map((goal) => {
                const pct = goal.target > 0 ? Math.min(100, (goal.progress / goal.target) * 100) : 0
                const done = goal.progress >= goal.target
                return (
                  <div key={goal.id} className={`card ${done ? 'border-success/30' : ''}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{goal.title}</p>
                        <p className="text-xs text-text-muted">{goal.description || 'Aucune description'}</p>
                      </div>
                      <button onClick={() => deleteGoal(goal.id)} className="text-danger/60 hover:text-danger shrink-0 ml-2"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>

                    <div className="flex items-baseline gap-1 mb-2">
                      <InlineInput
                        value={goal.progress}
                        onSave={(v) => updateGoal(goal.id, { progress: Number(v) || 0 })}
                        className="stat-value"
                      />
                      <span className="text-xs text-text-muted">/ {format(goal.target)}</span>
                    </div>

                    <ProgressBar value={goal.progress} total={goal.target} />

                    <div className="flex items-center justify-between mt-3">
                      <span className={`pill text-xs ${done ? 'bg-success/10 text-success border border-success/30' : 'bg-brand/10 text-brand-glow border border-brand/30'}`}>
                        {pct.toFixed(0)}%
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateGoal(goal.id, { progress: Math.max(0, goal.progress - (goal.target * 0.05)) })}
                          className="h-6 w-6 grid place-items-center rounded bg-bg-elevated border border-border-subtle text-text-secondary hover:text-text-primary transition-colors"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => updateGoal(goal.id, { progress: Math.min(goal.target, goal.progress + (goal.target * 0.05)) })}
                          className="h-6 w-6 grid place-items-center rounded bg-bg-elevated border border-border-subtle text-text-secondary hover:text-text-primary transition-colors"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {goal.deadline && (
                      <p className="text-xs text-text-muted mt-2 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Échéance : {new Date(goal.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="card text-center py-12">
              <Target className="h-8 w-8 text-text-muted mx-auto mb-3" />
              <p className="text-sm text-text-secondary">Aucun objectif défini</p>
              <p className="text-xs text-text-muted mt-1">Cliquez sur "Nouvel objectif" pour commencer</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// =========== FORM COMPONENTS ===========

function AddExpenseForm({ onAdd, onCancel, format }) {
  const [name, setName] = useState('')
  const [cost, setCost] = useState(0)
  const [paid, setPaid] = useState(0)

  const handleSubmit = () => {
    if (!name.trim() || cost <= 0) return
    onAdd({ name: name.trim(), cost, paid: Math.min(paid, cost) })
  }

  return (
    <section className="card">
      <p className="stat-label mb-3">Nouvelle dépense</p>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-text-muted mb-1 block">Libellé</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex : Assurance habitation"
            className="h-9 w-full rounded-lg bg-bg-elevated border border-border-subtle px-3 text-sm outline-none focus:border-brand"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-text-muted mb-1 block">Coût total</label>
            <NumberInput value={cost} onChange={setCost} className="w-full" />
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1 block">Déjà payé</label>
            <NumberInput value={paid} onChange={setPaid} className="w-full" />
          </div>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || cost <= 0}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save className="h-3.5 w-3.5" /> Ajouter
          </button>
          <button onClick={onCancel} className="text-sm text-text-secondary hover:text-text-primary">Annuler</button>
        </div>
      </div>
    </section>
  )
}

function AddBudgetForm({ onAdd, onCancel, format }) {
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState(0)
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return d.toISOString().slice(0, 7)
  })

  const handleSubmit = () => {
    if (!label.trim() || amount <= 0) return
    const d = new Date(month + '-01')
    onAdd({
      label: label.trim(),
      amount,
      month: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
    })
  }

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-elevated p-3 mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-text-muted mb-1 block">Libellé</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ex : Valises"
            className="h-8 w-full rounded-lg bg-bg-card border border-border-subtle px-2 text-sm outline-none focus:border-brand"
          />
        </div>
        <div>
          <label className="text-xs text-text-muted mb-1 block">Montant</label>
          <NumberInput value={amount} onChange={setAmount} className="w-full" />
        </div>
        <div>
          <label className="text-xs text-text-muted mb-1 block">Mois</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="h-8 w-full rounded-lg bg-bg-card border border-border-subtle px-2 text-sm outline-none focus:border-brand text-text-primary"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={handleSubmit}
          disabled={!label.trim() || amount <= 0}
          className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg bg-brand text-white text-xs font-medium hover:bg-brand/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Save className="h-3 w-3" /> Ajouter
        </button>
        <button onClick={onCancel} className="text-xs text-text-secondary hover:text-text-primary">Annuler</button>
      </div>
    </div>
  )
}

function AddGoalForm({ onAdd, onCancel, format }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [target, setTarget] = useState(0)
  const [progress, setProgress] = useState(0)
  const [deadline, setDeadline] = useState('')

  const handleSubmit = () => {
    if (!title.trim() || target <= 0) return
    onAdd({
      title: title.trim(),
      description: description.trim(),
      target,
      progress,
      deadline: deadline || null,
    })
  }

  return (
    <section className="card">
      <p className="stat-label mb-3">Nouvel objectif</p>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-text-muted mb-1 block">Titre</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex : Économiser pour le billet d'avion"
            className="h-9 w-full rounded-lg bg-bg-elevated border border-border-subtle px-3 text-sm outline-none focus:border-brand"
          />
        </div>
        <div>
          <label className="text-xs text-text-muted mb-1 block">Description (optionnel)</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Détails de l'objectif…"
            className="h-9 w-full rounded-lg bg-bg-elevated border border-border-subtle px-3 text-sm outline-none focus:border-brand"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-text-muted mb-1 block">Cible</label>
            <NumberInput value={target} onChange={setTarget} className="w-full" />
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1 block">Progression actuelle</label>
            <NumberInput value={progress} onChange={setProgress} className="w-full" />
          </div>
        </div>
        <div>
          <label className="text-xs text-text-muted mb-1 block">Échéance (optionnel)</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="h-8 rounded-lg bg-bg-elevated border border-border-subtle px-2 text-sm outline-none focus:border-brand text-text-primary"
          />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || target <= 0}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save className="h-3.5 w-3.5" /> Créer l'objectif
          </button>
          <button onClick={onCancel} className="text-sm text-text-secondary hover:text-text-primary">Annuler</button>
        </div>
      </div>
    </section>
  )
}

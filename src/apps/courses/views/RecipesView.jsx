import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, ChefHat } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { Button } from '@/shared/ui/Button.jsx'
import { Input } from '@/shared/ui/Input.jsx'
import TabBar from '../components/TabBar.jsx'
import RecipeCard from '../components/RecipeCard.jsx'
import RecipeDetail from '../components/RecipeDetail.jsx'
import RecipeEditor from '../components/RecipeEditor.jsx'
import { addRecipe, updateRecipe, deleteRecipe } from '../services/recipesService.js'
import { normalizeName } from '../utils/aisleGuess.js'

export default function RecipesView({ tab, onTab, recipes, recipesLoading, items, catalog, onGoToList }) {
  const { currentUid } = useAuth()
  const [mode, setMode] = useState('browse') // 'browse' | 'detail' | 'edit'
  const [selectedId, setSelectedId] = useState(null)
  const [q, setQ] = useState('')
  const selected = recipes.find((r) => r.id === selectedId) || null

  const filtered = useMemo(() => {
    const n = normalizeName(q)
    return n ? recipes.filter((r) => normalizeName(r.title).includes(n)) : recipes
  }, [recipes, q])

  function openDetail(r) { setSelectedId(r.id); setMode('detail') }
  function openNew() { setSelectedId(null); setMode('edit') }
  function backToBrowse() { setSelectedId(null); setMode('browse') }

  async function handleSave(input) {
    if (selectedId) {
      await updateRecipe(selectedId, input, currentUid)
      setMode('detail')
    } else {
      await addRecipe(input, currentUid)
      backToBrowse()
    }
  }
  async function handleDelete(id) {
    await deleteRecipe(id)
    backToBrowse()
  }
  async function handleDuplicate(recipe) {
    await addRecipe(
      { title: `${recipe.title} (copie)`, note: recipe.note, ingredients: recipe.ingredients, steps: recipe.steps },
      currentUid,
    )
    backToBrowse()
  }

  if (mode === 'edit') {
    return (
      <RecipeEditor
        recipe={selected}
        onCancel={() => (selected ? setMode('detail') : backToBrowse())}
        onSave={handleSave}
      />
    )
  }

  if (mode === 'detail' && selected) {
    return (
      <RecipeDetail
        recipe={selected}
        items={items}
        catalog={catalog}
        onBack={backToBrowse}
        onEdit={() => setMode('edit')}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onAdded={onGoToList}
      />
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-20 bg-bg/85 backdrop-blur-xl border-b border-border">
        <div className="max-w-xl mx-auto px-4 py-3">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-fg transition mb-1">
            <ArrowLeft size={14} /> Nos apps
          </Link>
          <div className="flex items-center justify-between">
            <TabBar tab={tab} onTab={onTab} />
            <Button size="sm" onClick={openNew}><Plus size={16} /> Nouvelle</Button>
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 pb-28 pt-4">
        {recipesLoading ? (
          <p className="text-center text-muted py-16">Chargement…</p>
        ) : recipes.length === 0 ? (
          <div className="text-center py-16">
            <ChefHat size={32} className="mx-auto text-faint" />
            <p className="text-fg font-medium mt-3">Aucune recette</p>
            <p className="text-sm text-muted mt-1">Crée ta première recette pour ajouter ses ingrédients en un tap.</p>
            <Button className="mt-4" onClick={openNew}><Plus size={16} /> Nouvelle recette</Button>
          </div>
        ) : (
          <>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher une recette…"
              aria-label="Rechercher une recette"
              className="mb-4"
            />
            {filtered.length === 0 ? (
              <p className="text-center text-muted py-12">Aucune recette trouvée.</p>
            ) : (
              <div className="space-y-2">
                {filtered.map((r) => (
                  <RecipeCard key={r.id} recipe={r} onClick={() => openDetail(r)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

import { addItem } from '../services/shoppingItemsService.js'
import { recordUsage } from '../services/catalogService.js'
import { slugify, guessAisle } from './aisleGuess.js'

// Rayon d'un nom : rayon mémorisé du catalogue (par slug) sinon devinette par mots-clés.
export function resolveAisleForName(name, catalog) {
  const slug = slugify(name)
  const known = catalog.find((c) => c.id === slug)
  return known?.aisle || guessAisle(name)
}

// Ajoute un article (quantité optionnelle) à la liste + met à jour le catalogue.
// Partagé par l'ajout rapide (sans quantité) et les recettes (avec quantité).
export async function addNamedItem({ name, quantityLabel = null }, { catalog, currentUid }) {
  const aisle = resolveAisleForName(name, catalog)
  await addItem({ name, quantityLabel, aisle }, currentUid)
  await recordUsage(name, aisle, currentUid)
}

// FinAuzi — Person Configuration & Helpers
// Maps Firebase UIDs to display labels and colors.

export const AUTHORIZED_UIDS = [
  'J8xOqDWZv5gEss5CBbQ7kQOsTwV2',
  'o8wLosYoh7b989P9gQyZCk8tt3l1',
]

export const FINAUZI_PEOPLE = [
  {
    uid: 'J8xOqDWZv5gEss5CBbQ7kQOsTwV2',
    label: 'Moi',
    shortLabel: 'Moi',
    color: 'emerald',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    border: 'border-emerald-500/25',
  },
  {
    uid: 'o8wLosYoh7b989P9gQyZCk8tt3l1',
    label: 'Elle',
    shortLabel: 'Elle',
    color: 'blue',
    bg: 'bg-blue-500/15',
    text: 'text-blue-400',
    border: 'border-blue-500/25',
  },
]

/** Check if a UID is one of the two authorized users. */
export function isAuthorizedUid(uid) {
  return AUTHORIZED_UIDS.includes(uid)
}

/** Get the full person config for a given UID. Returns null if unknown. */
export function getPersonByUid(uid) {
  return FINAUZI_PEOPLE.find(p => p.uid === uid) || null
}

/** Get the display label (Moi / Elle) for a UID. */
export function getPersonLabel(uid) {
  return getPersonByUid(uid)?.label || 'Inconnu'
}

/** Get the UID of the other person. */
export function getOtherPersonUid(uid) {
  const other = FINAUZI_PEOPLE.find(p => p.uid !== uid)
  return other?.uid || null
}

/** Get the default person UID (first authorized user). */
export function getDefaultPersonUid() {
  return AUTHORIZED_UIDS[0]
}

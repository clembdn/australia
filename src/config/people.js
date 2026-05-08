// FinAuzi — Person Configuration & Helpers
// Maps Firebase UIDs to display labels and colors.

export const CLEMENT_UID = 'J8xOqDWZv5gEss5CBbQ7kQOsTwV2'
export const LISE_UID = 'o8wLosYoh7b989P9gQyZCk8tt3l1'

export const AUTHORIZED_UIDS = [
  CLEMENT_UID,
  LISE_UID,
]

export const PEOPLE = [
  {
    uid: CLEMENT_UID,
    label: 'Clément',
    shortLabel: 'Clément',
    color: 'emerald',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    border: 'border-emerald-500/25',
  },
  {
    uid: LISE_UID,
    label: 'Lise',
    shortLabel: 'Lise',
    color: 'blue',
    bg: 'bg-blue-500/15',
    text: 'text-blue-400',
    border: 'border-blue-500/25',
  },
]

export const FINAUZI_PEOPLE = PEOPLE

const EMAIL_TO_PERSON_UID = {
  'clemboudon06@gmail.com': CLEMENT_UID,
}

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : ''
}

/** Check if a UID is one of the two authorized users. */
export function isAuthorizedUid(uid) {
  return AUTHORIZED_UIDS.includes(uid)
}

/** Get the full person config for a given UID. Returns null if unknown. */
export function getPersonByUid(uid) {
  return FINAUZI_PEOPLE.find(p => p.uid === uid) || null
}

/** Get the display label (Clément / Lise) for a UID. */
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

/** Resolve a person UID from an email address. Returns null if unknown. */
export function getPersonUidForEmail(email) {
  const normalized = normalizeEmail(email)
  return EMAIL_TO_PERSON_UID[normalized] || null
}

/** Resolve default person UID from Firebase auth user (email first, then UID). */
export function getPersonUidForAuthUser(user) {
  const emailMappedUid = getPersonUidForEmail(user?.email)
  if (emailMappedUid && AUTHORIZED_UIDS.includes(emailMappedUid)) return emailMappedUid
  if (isAuthorizedUid(user?.uid)) return user.uid
  return getDefaultPersonUid()
}

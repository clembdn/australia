// Firebase Configuration — FinAuzi
// Uses Vite environment variables (VITE_FIREBASE_*)
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const FIREBASE_DEFAULT_CONFIG = {
  apiKey: 'AIzaSyD13MNNYtY5uEbxHJnG9t4m1IMjzVfvhpw',
  authDomain: 'finauzi.firebaseapp.com',
  projectId: 'finauzi',
  storageBucket: 'finauzi.firebasestorage.app',
  messagingSenderId: '732390512146',
  appId: '1:732390512146:web:84b2a3b3bbc0d68e6a2acb',
}

function readFirebaseEnv(key, fallback) {
  const value = import.meta.env[key]
  return typeof value === 'string' && value.trim() ? value : fallback
}

const firebaseConfig = {
  apiKey: readFirebaseEnv('VITE_FIREBASE_API_KEY', FIREBASE_DEFAULT_CONFIG.apiKey),
  authDomain: readFirebaseEnv('VITE_FIREBASE_AUTH_DOMAIN', FIREBASE_DEFAULT_CONFIG.authDomain),
  projectId: readFirebaseEnv('VITE_FIREBASE_PROJECT_ID', FIREBASE_DEFAULT_CONFIG.projectId),
  storageBucket: readFirebaseEnv('VITE_FIREBASE_STORAGE_BUCKET', FIREBASE_DEFAULT_CONFIG.storageBucket),
  messagingSenderId: readFirebaseEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', FIREBASE_DEFAULT_CONFIG.messagingSenderId),
  appId: readFirebaseEnv('VITE_FIREBASE_APP_ID', FIREBASE_DEFAULT_CONFIG.appId),
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export default app

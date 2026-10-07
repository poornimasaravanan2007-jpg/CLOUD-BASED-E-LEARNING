// ============================================================
//  FIREBASE CONFIGURATION
//  cloud-elearning-platform/js/firebase-config.js
// ============================================================
//
//  Environment variables are loaded from window.__env__
//  which is injected by env.js (loaded before this file).
//
//  For Vercel deployment:
//    Set each variable in: Vercel Dashboard → Project → Settings
//    → Environment Variables
//
//  For local development:
//    Edit .env with your Firebase values, then env.js reads it.
//
// ============================================================

// Read from injected env or fall back to hardcoded values
const _env = (typeof window !== 'undefined' && window.__env__) ? window.__env__ : {};

const firebaseConfig = {
  apiKey:            _env.FIREBASE_API_KEY            || "AIzaSyCQ-gqkYOT5KGcUzBgKmXGrnPcB_dxKbjk",
  authDomain:        _env.FIREBASE_AUTH_DOMAIN        || "cloud-elearning-dd05c.firebaseapp.com",
  projectId:         _env.FIREBASE_PROJECT_ID         || "cloud-elearning-dd05c",
  storageBucket:     _env.FIREBASE_STORAGE_BUCKET     || "cloud-elearning-dd05c.firebasestorage.app",
  messagingSenderId: _env.FIREBASE_MESSAGING_SENDER_ID|| "102931497791",
  appId:             _env.FIREBASE_APP_ID             || "1:102931497791:web:55cb42954bd870b2abc98a",
  measurementId:     _env.FIREBASE_MEASUREMENT_ID     || "G-M8YG5VCZBV"
};

// ── Initialize Firebase ──────────────────────────────────────
firebase.initializeApp(firebaseConfig);

// ── Service Shortcuts (used across all JS files) ─────────────
const auth = firebase.auth();
const db = firebase.firestore();
let storage = null;
if (typeof firebase.storage === 'function') {
  storage = firebase.storage();
} else {
  console.warn('Firebase Storage SDK not loaded on this page');
}
let analytics = null;
if (typeof firebase.analytics === 'function') {
  analytics = firebase.analytics();
}
// ── Persistence: keep user logged in on page refresh ─────────
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

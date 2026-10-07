// ============================================================
//  env.js — Environment Variable Bridge
//  cloud-elearning-platform/js/env.js
//
//  This file exposes environment variables to the browser by
//  injecting them into window.__env__
//
//  FOR VERCEL DEPLOYMENT:
//  ─────────────────────
//  Vercel replaces the placeholder strings below at build time
//  when you set matching Environment Variables in the dashboard:
//    Dashboard → Project → Settings → Environment Variables
//
//  Add these 6 variables in Vercel:
//    FIREBASE_API_KEY
//    FIREBASE_AUTH_DOMAIN
//    FIREBASE_PROJECT_ID
//    FIREBASE_STORAGE_BUCKET
//    FIREBASE_MESSAGING_SENDER_ID
//    FIREBASE_APP_ID
//    FIREBASE_MEASUREMENT_ID
//
//  FOR LOCAL DEVELOPMENT:
//  ──────────────────────
//  Update the values below directly (do NOT commit real keys).
//  The .env file documents what values to use.
//
// ============================================================

window.__env__ = {
  FIREBASE_API_KEY:             "AIzaSyCQ-gqkYOT5KGcUzBgKmXGrnPcB_dxKbjk",
  FIREBASE_AUTH_DOMAIN:         "cloud-elearning-dd05c.firebaseapp.com",
  FIREBASE_PROJECT_ID:          "cloud-elearning-dd05c",
  FIREBASE_STORAGE_BUCKET:      "cloud-elearning-dd05c.firebasestorage.app",
  FIREBASE_MESSAGING_SENDER_ID: "102931497791",
  FIREBASE_APP_ID:              "1:102931497791:web:55cb42954bd870b2abc98a",
  FIREBASE_MEASUREMENT_ID:      "G-M8YG5VCZBV"
};

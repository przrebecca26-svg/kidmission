import { initializeApp, getApps, deleteApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { initializeFirestore, connectFirestoreEmulator, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Primary app — the session actually used by whoever is signed in on this device
// (Maman or a child), and the one every screen in the app reads from.
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Firestore's default transport (a WebChannel/streaming connection) can hang or
// silently fail on some mobile networks (flaky cellular, certain Wi-Fi proxies,
// carrier-level filtering) — this showed up as an 18+ second stalled request in
// testing on iPhone cellular, which made the post-login family lookup time out
// with a generic error even though sign-in itself succeeded. experimentalAutoDetectLongPolling
// makes Firestore detect this and automatically fall back to plain HTTP long-polling,
// which works reliably in those environments. Must use initializeFirestore (not
// getFirestore) to pass these settings, and it must be called before any other
// Firestore function touches this app instance.
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
});

// Offline persistence: lets the app keep working (read + queue writes) without a
// connection, then resync automatically once back online. Wrapped in a try/catch
// because it silently fails in some contexts (private browsing, multiple tabs) —
// that's fine, the app just falls back to network-only in that case.
try {
  enableIndexedDbPersistence(db);
} catch {
  /* not available in this context — app still works, just without offline cache */
}

/**
 * Secondary Firebase app instance, used ONLY to create a child's Auth account.
 *
 * Why this exists: calling createUserWithEmailAndPassword() on the auth instance
 * you're currently signed in on immediately signs you OUT of your account and INTO
 * the newly created one. Without this second instance, Maman creating Shyrel's
 * account would kick Maman out of her own session mid-setup. Firebase's documented
 * workaround is exactly this — a second, throwaway app instance for the sole purpose
 * of account creation, which we sign out of and discard right after.
 *
 * Call getSecondaryAuth() fresh each time rather than reusing one instance, so a
 * half-finished signup can't leave a stale session behind.
 */
export function getSecondaryAuth() {
  const name = "childCreation";
  const existing = getApps().find((a) => a.name === name);
  const secondaryApp = existing || initializeApp(firebaseConfig, name);
  return { secondaryApp, secondaryAuth: getAuth(secondaryApp) };
}

export async function disposeSecondaryApp(secondaryApp) {
  try {
    await deleteApp(secondaryApp);
  } catch {
    /* already gone — fine */
  }
}

// Optional: point at local emulators during development by setting VITE_USE_EMULATORS=1
// in .env. Never enabled in production builds.
if (import.meta.env.VITE_USE_EMULATORS === "1") {
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}

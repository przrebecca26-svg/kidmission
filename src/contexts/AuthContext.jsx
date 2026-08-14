import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase.js";
import { findFamilyIdForUid, getMembership } from "../services/auth.js";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  // undefined = still checking; null = signed out; object = signed in
  const [state, setState] = useState(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState(null);
        return;
      }
      try {
        // Same defensive token refresh as loginParent()/loginChild() in auth.js —
        // onAuthStateChanged can fire (e.g. on page load, or right after a fresh
        // sign-in) a moment before the token is fully attached to outgoing Firestore
        // requests on some mobile WebKit browsers, which otherwise surfaces as a
        // spurious permission-denied here.
        await user.getIdToken(true);
        const familyId = await findFamilyIdForUid(user.uid);
        if (!familyId) {
          // Signed in with Firebase but no family membership doc — shouldn't normally
          // happen outside of a broken signup; treat as signed out rather than crash.
          setState(null);
          return;
        }
        const membership = await getMembership(familyId, user.uid);
        if (!membership || membership.revoked) {
          setState(null);
          return;
        }
        setState({ uid: user.uid, familyId, role: membership.role, childId: membership.childId || null, membership });
      } catch (err) {
        console.error("Failed to resolve membership:", err);
        setState(null);
      }
    });
    return unsub;
  }, []);

  return <AuthCtx.Provider value={state}>{children}</AuthCtx.Provider>;
}

/** Returns undefined while loading, null if signed out, or { uid, familyId, role, childId }. */
export function useAuth() {
  return useContext(AuthCtx);
}

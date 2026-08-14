import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  doc, setDoc, getDoc, serverTimestamp, updateDoc, collectionGroup, query, where, getDocs, limit,
} from "firebase/firestore";
import { auth, db, getSecondaryAuth, disposeSecondaryApp } from "../firebase.js";

const FAMILY_ID_CACHE_KEY = "kidmission_familyId";

export function getCachedFamilyId() {
  try { return localStorage.getItem(FAMILY_ID_CACHE_KEY); } catch { return null; }
}
export function setCachedFamilyId(familyId) {
  try { localStorage.setItem(FAMILY_ID_CACHE_KEY, familyId); } catch { /* ignore */ }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Finds which family a signed-in user belongs to. Member documents store their own
 * uid as a field (in addition to being the doc ID) specifically so this collection-group
 * query is possible — Firestore can't query "give me the doc named {uid} across every
 * family" any other way. The security rule mirrors this: a members doc is only
 * readable when resource.data.uid == request.auth.uid, so this query can only ever
 * return the caller's own membership, never anyone else's.
 *
 * Retries once on permission-denied: on some mobile WebKit browsers (iOS Safari/Chrome,
 * both WebKit under the hood), Firestore's request can fire a beat before the freshly
 * signed-in auth token is fully attached to outgoing requests, causing a spurious
 * permission-denied immediately after a successful sign-in. A short retry clears it up
 * without the user ever noticing.
 */
export async function findFamilyIdForUid(uid, _isRetry = false) {
  const cached = getCachedFamilyId();
  if (cached) return cached;
  try {
    const q = query(collectionGroup(db, "members"), where("uid", "==", uid), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const familyId = snap.docs[0].ref.parent.parent.id;
    setCachedFamilyId(familyId);
    return familyId;
  } catch (err) {
    if (err.code === "permission-denied" && !_isRetry) {
      await delay(400);
      return findFamilyIdForUid(uid, true);
    }
    throw err;
  }
}

/* ------------------------------------------------------------------ */
/* Technical email construction for child logins.                     */
/*                                                                     */
/* Firebase Auth requires every email to be globally unique across    */
/* the WHOLE project, not just within one family. Two different       */
/* families both naming a child "shyrel" would collide if we only     */
/* used the username. Prefixing with familyId guarantees uniqueness   */
/* without asking the child for a real email address.                 */
/* ------------------------------------------------------------------ */
function technicalChildEmail(familyId, username, suffix = "") {
  const safeUser = username.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const tag = suffix ? `-${suffix}` : "";
  return `${familyId}-${safeUser}${tag}@kidmission.internal`;
}

/** Maman creates her own account. Becomes the family's owner/parent member. */
export async function signUpParent({ email, password, displayName, familyId }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;

  await setDoc(doc(db, "families", familyId), {
    ownerUid: uid,
    createdAt: serverTimestamp(),
  });
  await setDoc(doc(db, `families/${familyId}/members`, uid), {
    uid,
    role: "parent",
    displayName,
    joinedAt: serverTimestamp(),
    revoked: false,
  });
  setCachedFamilyId(familyId);
  return uid;
}

export async function loginParent({ email, password }) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  // Force the fresh ID token to be attached to the SDK's outgoing requests before
  // querying Firestore — see findFamilyIdForUid's comment for why this matters on
  // mobile WebKit browsers right after sign-in.
  await cred.user.getIdToken(true);
  const familyId = await findFamilyIdForUid(cred.user.uid);
  return { uid: cred.user.uid, familyId };
}

export async function requestPasswordReset(email) {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Maman creates a login for a child (new profile, or a fresh login for an existing one).
 * Runs entirely on the secondary Firebase app so Maman's own session is untouched.
 *
 * `childId` is the PERMANENT profile id (missions, history, everything lives under it).
 * `username`/`code` are just how the child signs in — they can change without
 * touching childId, which is exactly what makes "reset code" safe (see below).
 */
export async function createChildLogin({ familyId, childId, username, code }) {
  if (!/^\d{6}$/.test(code)) {
    throw new Error("Le code doit contenir exactement 6 chiffres.");
  }
  const { secondaryApp, secondaryAuth } = getSecondaryAuth();
  try {
    const technicalEmail = technicalChildEmail(familyId, username);
    const cred = await createUserWithEmailAndPassword(secondaryAuth, technicalEmail, code);
    const childUid = cred.user.uid;

    // Written via the PARENT's Firestore connection (db), not the secondary auth —
    // Maman's session is what's authorized to write here, and that's untouched.
    await setDoc(doc(db, `families/${familyId}/members`, childUid), {
      uid: childUid,
      role: "child",
      childId,
      username: username.trim().toLowerCase(),
      joinedAt: serverTimestamp(),
      revoked: false,
    });

    await firebaseSignOut(secondaryAuth);
    return childUid;
  } finally {
    await disposeSecondaryApp(secondaryApp);
  }
}

/**
 * Resets a child's login code WITHOUT losing any data. Rather than trying to change
 * a password we can't access (that needs the child's own session or an Admin SDK we
 * don't have), this creates a brand-new login tied to the SAME childId, and revokes
 * the old one. Every entry/payment/claim is stored under childId, never under the
 * auth uid directly — so history survives a reset untouched.
 */
export async function resetChildCode({ familyId, childId, oldUid, username, newCode }) {
  if (!/^\d{6}$/.test(newCode)) {
    throw new Error("Le code doit contenir exactement 6 chiffres.");
  }
  if (oldUid) {
    await updateDoc(doc(db, `families/${familyId}/members`, oldUid), { revoked: true });
  }
  const { secondaryApp, secondaryAuth } = getSecondaryAuth();
  try {
    // A fresh technical email (timestamp-suffixed) — the old one stays taken by the
    // revoked account, Firebase Auth doesn't let us reuse it even after revoking access.
    const technicalEmail = technicalChildEmail(familyId, username, Date.now().toString(36));
    const cred = await createUserWithEmailAndPassword(secondaryAuth, technicalEmail, newCode);
    const newUid = cred.user.uid;

    await setDoc(doc(db, `families/${familyId}/members`, newUid), {
      uid: newUid,
      role: "child",
      childId,
      username: username.trim().toLowerCase(),
      joinedAt: serverTimestamp(),
      revoked: false,
    });

    await firebaseSignOut(secondaryAuth);
    return newUid;
  } finally {
    await disposeSecondaryApp(secondaryApp);
  }
}

/** Child login: parent-chosen username + 6-digit code, no email required from the child.
 *  familyId here is the human-readable family code Maman shares once — after the first
 *  successful login it's cached in localStorage, so the child never has to re-enter it. */
export async function loginChild({ familyId, username, code }) {
  const technicalEmail = technicalChildEmail(familyId, username);
  const cred = await signInWithEmailAndPassword(auth, technicalEmail, code);
  await cred.user.getIdToken(true);
  setCachedFamilyId(familyId);
  return cred.user.uid;
}

export async function logout() {
  await firebaseSignOut(auth);
}

/** Looks up the caller's own membership doc (role, childId if applicable) after login. */
export async function getMembership(familyId, uid) {
  const snap = await getDoc(doc(db, `families/${familyId}/members`, uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

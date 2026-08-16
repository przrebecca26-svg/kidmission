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

function technicalChildEmail(familyId, username, suffix = "") {
  const safeUser = username.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const tag = suffix ? `-${suffix}` : "";
  return `${familyId}-${safeUser}${tag}@kidmission.internal`;
}

/**
 * Maman creates her own account. Becomes the family's owner/parent member.
 *
 * `onboardingSeen: false` is written on the new family doc here so that
 * FamilyHome.jsx knows to auto-trigger the guided tour once, right after this
 * family's very first child profile is created. Families that already existed
 * before this field was introduced simply don't have it at all — FamilyHome.jsx
 * treats a missing field as "already seen" (never auto-triggers), so nothing
 * changes for families created before this feature shipped.
 */
export async function signUpParent({ email, password, displayName, familyId }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;

  await setDoc(doc(db, "families", familyId), {
    ownerUid: uid,
    createdAt: serverTimestamp(),
    onboardingSeen: false,
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
  await cred.user.getIdToken(true);
  const familyId = await findFamilyIdForUid(cred.user.uid);
  return { uid: cred.user.uid, familyId };
}

export async function requestPasswordReset(email) {
  await sendPasswordResetEmail(auth, email);
}

export async function createChildLogin({ familyId, childId, username, code }) {
  if (!/^\d{6}$/.test(code)) {
    throw new Error("Le code doit contenir exactement 6 chiffres.");
  }
  const { secondaryApp, secondaryAuth } = getSecondaryAuth();
  try {
    const technicalEmail = technicalChildEmail(familyId, username);
    const cred = await createUserWithEmailAndPassword(secondaryAuth, technicalEmail, code);
    const childUid = cred.user.uid;

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

export async function resetChildCode({ familyId, childId, oldUid, username, newCode }) {
  if (!/^\d{6}$/.test(newCode)) {
    throw new Error("Le code doit contenir exactement 6 chiffres.");
  }
  if (oldUid) {
    await updateDoc(doc(db, `families/${familyId}/members`, oldUid), { revoked: true });
  }
  const { secondaryApp, secondaryAuth } = getSecondaryAuth();
  try {
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

export async function getMembership(familyId, uid) {
  const snap = await getDoc(doc(db, `families/${familyId}/members`, uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc, setDoc,
  onSnapshot, query, orderBy, serverTimestamp, where,
} from "firebase/firestore";
import { db } from "../firebase.js";

/* ------------------------------------------------------------------ */
/* Children (permanent profiles)                                      */
/* ------------------------------------------------------------------ */

export async function createChildProfile(familyId, childId, { displayName, currencyType, currencyUnit }) {
  await setDoc(doc(db, `families/${familyId}/children`, childId), {
    displayName,
    currencyType, // "money" | "screentime" | "points"
    currencyUnit, // "₪" | "min" | "pts" — free text, shown next to every amount
    createdAt: serverTimestamp(),
  });
}

export function watchChildProfile(familyId, childId, callback) {
  return onSnapshot(doc(db, `families/${familyId}/children`, childId), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

export function watchAllChildren(familyId, callback) {
  return onSnapshot(collection(db, `families/${familyId}/children`), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

/* ------------------------------------------------------------------ */
/* Members for a given child — current + past login credentials.      */
/* Used by the "reset code" screen to show device/access history.     */
/* ------------------------------------------------------------------ */

export function watchMembersForChild(familyId, childId, callback) {
  const q = query(collection(db, `families/${familyId}/members`), where("childId", "==", childId));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

/* ------------------------------------------------------------------ */
/* Settings (missions/rewards/PIN) — one doc per child, like before   */
/* ------------------------------------------------------------------ */

export async function watchSettings(familyId, childId, callback) {
  return onSnapshot(doc(db, `families/${familyId}/children/${childId}/settings`, "config"), (snap) => {
    callback(snap.exists() ? snap.data() : null);
  });
}

export async function saveSettings(familyId, childId, settings) {
  await setDoc(doc(db, `families/${familyId}/children/${childId}/settings`, "config"), settings, { merge: true });
}

/* ------------------------------------------------------------------ */
/* Entries (bonus / malus / weekly / joker) — one document per action */
/* ------------------------------------------------------------------ */

export function watchEntries(familyId, childId, callback) {
  const q = query(collection(db, `families/${familyId}/children/${childId}/entries`), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

/**
 * createdBy/createdAt/status here match exactly what firestore.rules checks for a
 * child's own submission — keep this in sync with the rules file if either changes.
 */
export async function addEntry(familyId, childId, { itemId, he, fr, amt, unit, cat, createdBy, isParent }) {
  await addDoc(collection(db, `families/${familyId}/children/${childId}/entries`), {
    itemId: itemId || null, he, fr, amt, unit, cat,
    status: isParent ? "confirmed" : "pending",
    createdBy,
    createdAt: serverTimestamp(),
  });
}

export async function approveEntry(familyId, childId, entryId) {
  await updateDoc(doc(db, `families/${familyId}/children/${childId}/entries`, entryId), { status: "confirmed" });
}

export async function rejectOrDeleteEntry(familyId, childId, entryId) {
  await deleteDoc(doc(db, `families/${familyId}/children/${childId}/entries`, entryId));
}

/* ------------------------------------------------------------------ */
/* Payments (Versements) — one document per month, Maman only         */
/* ------------------------------------------------------------------ */

export function watchPayments(familyId, childId, callback) {
  const q = query(collection(db, `families/${familyId}/children/${childId}/payments`), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function recordPayment(familyId, childId, { amount, periodKey, note, createdBy }) {
  await addDoc(collection(db, `families/${familyId}/children/${childId}/payments`), {
    amount, periodKey, note: note || null, createdBy, createdAt: serverTimestamp(),
  });
}

export async function deletePayment(familyId, childId, paymentId) {
  await deleteDoc(doc(db, `families/${familyId}/children/${childId}/payments`, paymentId));
}

/* ------------------------------------------------------------------ */
/* Reward claims (demande → validation)                                */
/* ------------------------------------------------------------------ */

export function watchRewardClaims(familyId, childId, callback) {
  const q = query(collection(db, `families/${familyId}/children/${childId}/rewardClaims`), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function claimReward(familyId, childId, { rewardId, periodKey, he, fr, threshold, createdBy, isParent }) {
  await addDoc(collection(db, `families/${familyId}/children/${childId}/rewardClaims`), {
    rewardId, periodKey, he, fr, threshold,
    status: isParent ? "approved" : "pending",
    createdBy,
    createdAt: serverTimestamp(),
  });
}

export async function approveRewardClaim(familyId, childId, claimId) {
  await updateDoc(doc(db, `families/${familyId}/children/${childId}/rewardClaims`, claimId), { status: "approved" });
}

export async function rejectRewardClaim(familyId, childId, claimId) {
  await deleteDoc(doc(db, `families/${familyId}/children/${childId}/rewardClaims`, claimId));
}

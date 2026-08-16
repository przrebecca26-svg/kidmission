import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc, setDoc,
  onSnapshot, query, orderBy, serverTimestamp, where, runTransaction,
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
 *
 * `severity` is only meaningful for cat === "malus" ("small" | "large"). It is
 * denormalized onto the entry itself (rather than looked up later from the
 * catalog) so that a joker-cancel eligibility check still works correctly even
 * if the catalog item is later edited, hidden, or deleted.
 */
export async function addEntry(familyId, childId, { itemId, he, fr, amt, unit, cat, createdBy, isParent, severity }) {
  await addDoc(collection(db, `families/${familyId}/children/${childId}/entries`), {
    itemId: itemId || null, he, fr, amt, unit, cat,
    severity: severity ?? null,
    status: isParent ? "confirmed" : "pending",
    createdBy,
    createdAt: serverTimestamp(),
  });
}

/**
 * Approves a pending entry. If the entry is a joker-cancel-malus request
 * (carries linkedMalusId), approving it is what actually cancels the target
 * malus — via a transaction that re-checks eligibility at approval time, so a
 * malus can never end up cancelled twice even if two requests targeted it.
 */
export async function approveEntry(familyId, childId, entryId) {
  const entryRef = doc(db, `families/${familyId}/children/${childId}/entries`, entryId);
  const snap = await getDoc(entryRef);
  if (!snap.exists()) return;
  const entry = snap.data();
  if (entry.linkedMalusId) {
    await approveLinkedMalusCancel(familyId, childId, entryId, entry.linkedMalusId);
    return;
  }
  await updateDoc(entryRef, { status: "confirmed" });
}

export async function rejectOrDeleteEntry(familyId, childId, entryId) {
  await deleteDoc(doc(db, `families/${familyId}/children/${childId}/entries`, entryId));
}

/**
 * Cancels an already-confirmed bonus/malus entry. Unlike rejectOrDeleteEntry
 * (which removes a still-pending request), this KEEPS the entry as a visible
 * trace ("❌ Annulé") instead of deleting it — Maman asked to be able to see
 * that something was cancelled and by whom/when, not have it silently vanish.
 * Cancelled entries are automatically excluded from the balance calculation
 * in ChildHome.jsx, since only status === "confirmed" entries are summed.
 *
 * This is Maman's manual override tool and is intentionally left untouched —
 * it is a separate mechanism from the joker/malus linking below, on purpose.
 */
export async function cancelEntry(familyId, childId, entryId, cancelledBy) {
  await updateDoc(doc(db, `families/${familyId}/children/${childId}/entries`, entryId), {
    status: "cancelled",
    cancelledBy,
    cancelledAt: serverTimestamp(),
  });
}

/* ------------------------------------------------------------------ */
/* Joker → malus cancellation (linked, transaction-safe)              */
/* ------------------------------------------------------------------ */

/**
 * Attempts to use a joker to cancel a specific malus entry.
 * Runs as a Firestore transaction so the eligibility check (malus still
 * confirmed, not already cancelled, severity !== "large") and the write
 * happen atomically — a malus can never be cancelled twice, even with a
 * double-tap or two devices acting at once.
 *
 * - If isParent (Maman is acting directly): the malus is cancelled immediately
 *   and the joker-spend entry is created already "confirmed".
 * - If !isParent (Shyrel is requesting): the malus is NOT touched yet — only a
 *   "pending" joker-spend entry (carrying linkedMalusId) is created. The malus
 *   only actually gets cancelled when Maman approves that request via
 *   approveEntry, which re-runs this same eligibility check at that time.
 *
 * Throws an Error with a user-facing French message if the malus is no longer
 * eligible (already cancelled, too severe, or gone).
 */
export async function useJokerOnMalus(familyId, childId, { malusEntryId, jokerItemId, jokerVal, fr, he, createdBy, isParent }) {
  const malusRef = doc(db, `families/${familyId}/children/${childId}/entries`, malusEntryId);
  const entriesCol = collection(db, `families/${familyId}/children/${childId}/entries`);
  const newEntryRef = doc(entriesCol);

  await runTransaction(db, async (tx) => {
    const malusSnap = await tx.get(malusRef);
    if (!malusSnap.exists()) throw new Error("Ce malus n'existe plus.");
    const malus = malusSnap.data();
    if (malus.cat !== "malus") throw new Error("Cible invalide : ce n'est pas un malus.");
    if (malus.status !== "confirmed") throw new Error("Ce malus n'est plus disponible (déjà annulé ou en attente).");
    if (malus.severity === "large") throw new Error("Ce malus est trop grave pour être annulé avec un joker.");

    if (isParent) {
      tx.update(malusRef, {
        status: "cancelled",
        cancelledBy: createdBy,
        cancelledAt: serverTimestamp(),
        cancelReason: "joker",
      });
      tx.set(newEntryRef, {
        itemId: jokerItemId, he, fr, amt: -jokerVal, unit: "🃏", cat: "jokerUse",
        linkedMalusId: malusEntryId, status: "confirmed", createdBy, createdAt: serverTimestamp(),
      });
    } else {
      tx.set(newEntryRef, {
        itemId: jokerItemId, he, fr, amt: -jokerVal, unit: "🃏", cat: "jokerUse",
        linkedMalusId: malusEntryId, status: "pending", createdBy, createdAt: serverTimestamp(),
      });
    }
  });
}

async function approveLinkedMalusCancel(familyId, childId, entryId, linkedMalusId) {
  const entryRef = doc(db, `families/${familyId}/children/${childId}/entries`, entryId);
  const malusRef = doc(db, `families/${familyId}/children/${childId}/entries`, linkedMalusId);

  await runTransaction(db, async (tx) => {
    const entrySnap = await tx.get(entryRef);
    const malusSnap = await tx.get(malusRef);
    if (!entrySnap.exists()) throw new Error("Cette demande n'existe plus.");
    if (!malusSnap.exists()) throw new Error("Le malus visé n'existe plus.");
    const entry = entrySnap.data();
    const malus = malusSnap.data();
    if (malus.status !== "confirmed") {
      throw new Error("Ce malus a déjà été traité entre-temps (annulé ou modifié) — refuse cette demande.");
    }
    if (malus.severity === "large") {
      throw new Error("Ce malus est trop grave pour être annulé avec un joker — refuse cette demande.");
    }
    tx.update(malusRef, {
      status: "cancelled",
      cancelledBy: entry.createdBy,
      cancelledAt: serverTimestamp(),
      cancelReason: "joker",
    });
    tx.update(entryRef, { status: "confirmed" });
  });
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

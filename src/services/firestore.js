import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, setDoc,
  onSnapshot, query, orderBy, serverTimestamp, where, runTransaction,
} from "firebase/firestore";
import { db } from "../firebase.js";

/* ------------------------------------------------------------------ */
/* Families                                                            */
/* ------------------------------------------------------------------ */

export function watchFamily(familyId, callback) {
  return onSnapshot(doc(db, "families", familyId), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

/**
 * Marks the family's onboarding tour as seen, so it never auto-triggers again.
 * Deliberately does NOT gate manual replays via "❓ Découvrir KidMission" — those
 * always work regardless of this flag (see OnboardingTour.jsx, which calls this
 * on every successful mount, auto-triggered or manually replayed alike).
 * Called only once the tour has actually rendered successfully, not before —
 * so a crash right at trigger time can't leave this true without the parent
 * ever having seen anything.
 */
export async function markOnboardingSeen(familyId) {
  await setDoc(doc(db, "families", familyId), { onboardingSeen: true }, { merge: true });
}

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
 * `severity` is only meaningful for cat === "malus" ("small" | "large" | null).
 * It is denormalized onto the entry itself (rather than looked up later from the
 * catalog) so that joker-cancel eligibility still works correctly even if the
 * catalog item is later edited, hidden, or deleted. A malus with severity !== "small"
 * (including null/undefined, e.g. older entries created before this feature) can
 * NEVER be cancelled with a joker — see useJokerOnMalus below.
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
 * Sums confirmed 🃏 entries for a child — used to double-check, at approval time,
 * that Shyrel actually still has enough jokers for the request being approved.
 */
async function getConfirmedJokerBalance(familyId, childId) {
  const entriesCol = collection(db, `families/${familyId}/children/${childId}/entries`);
  const q = query(entriesCol, where("status", "==", "confirmed"), where("unit", "==", "🃏"));
  const snap = await getDocs(q);
  return snap.docs.reduce((sum, d) => sum + (d.data().amt || 0), 0);
}

/**
 * Approves a pending entry.
 *
 * For any jokerUse entry (whether it's a plain joker spend or one linked to a
 * malus cancellation), Maman's approval is checked against the CURRENT real
 * joker balance right before confirming. If approving this one would push the
 * balance below zero, this throws instead of confirming — Maman should reject
 * it instead.
 *
 * If the entry is a joker-cancel-malus request (carries linkedMalusId),
 * approving it is what actually cancels the target malus — via a transaction
 * that re-checks eligibility at approval time, so a malus can never end up
 * cancelled twice even if two requests targeted it.
 */
export async function approveEntry(familyId, childId, entryId) {
  const entryRef = doc(db, `families/${familyId}/children/${childId}/entries`, entryId);
  const snap = await getDoc(entryRef);
  if (!snap.exists()) return;
  const entry = snap.data();

  if (entry.cat === "jokerUse") {
    const jokerBalance = await getConfirmedJokerBalance(familyId, childId);
    if (jokerBalance + entry.amt < 0) {
      throw new Error("Le solde de jokers ne suffit plus pour valider cette demande (probablement à cause d'une autre demande déjà validée entre-temps) — refuse-la plutôt.");
    }
  }

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
 * trace ("❌ Annulé") instead of deleting it. Cancelled entries are automatically
 * excluded from the balance calculation in ChildHome.jsx, since only
 * status === "confirmed" entries are summed.
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
    if (malus.severity !== "small") throw new Error("Ce malus ne peut pas être annulé avec un joker.");

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
      throw new Error("Ce malus a déjà été traité entre-temps — refuse cette demande.");
    }
    if (malus.severity !== "small") {
      throw new Error("Ce malus ne peut pas être annulé avec un joker — refuse cette demande.");
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

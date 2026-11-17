/**
 * Subscription service — skeleton only.
 * Real IAP (App Store / Google Play) will be added later via Capacitor plugins.
 * For now this provides the data model and status helpers so the rest of the app
 * can start checking “is the family subscribed?” without breaking existing flows.
 */

export const PLANS = {
  monthly: {
    id: "monthly",
    priceUsd: 9.9,
    label: { fr: "Mensuel", en: "Monthly" },
  },
  yearly: {
    id: "yearly",
    priceUsd: 79.9,
    label: { fr: "Annuel", en: "Yearly" },
  },
};

/**
 * Placeholder: in production this will read from Firestore or a custom claim
 * set by a Cloud Function after a successful store purchase.
 * Returns true for now so existing families keep working during development.
 */
export async function isFamilySubscribed(familyId) {
  // TODO: query families/{familyId}/subscription or custom claims
  return true;
}

/**
 * Placeholder for starting a purchase flow.
 * Will later call the appropriate Capacitor IAP plugin.
 */
export async function startPurchase(planId) {
  console.warn("Subscription purchase not yet implemented", planId);
  return { success: false, reason: "not_implemented" };
}

export function getPlan(planId) {
  return PLANS[planId] || null;
}

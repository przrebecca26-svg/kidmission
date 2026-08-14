import { useEffect, useState } from "react";
import { watchChildProfile, watchSettings, saveSettings } from "../services/firestore.js";

const CATEGORIES = [
  { key: "bonus", label: "✅ Bonus" },
  { key: "malus", label: "⚠️ Malus" },
  { key: "weekly", label: "📅 Hebdo" },
  { key: "joker", label: "🃏 Joker" },
];

/**
 * Parent-only screen: manage the catalog of mission items (bonus/malus/weekly/joker)
 * for one child. Items live in settings/config as a single array — small enough that
 * read-modify-write on the whole array is simpler than one doc per item, and avoids
 * a second Firestore listener pattern just for this.
 *
 * This screen only edits the CATALOG. Actually logging a day's bonus/malus (creating
 * `entries` documents from these items) is the next screen to port.
 */
export default function ChildSettings({ familyId, childId, onBack }) {
  const [profile, setProfile] = useState(undefined);
  const [settings, setSettings] = useState(undefined);
  const [activeCat, setActiveCat] = useState("bonus");
  const [editingItem, setEditingItem] = useState(null); // null | "new" | item object

  useEffect(() => watchChildProfile(familyId, childId, setProfile), [familyId, childId]);
  useEffect(() => {
    let unsub;
    watchSettings(familyId, childId, setSettings).then((u) => { unsub = u; });
    return () => unsub && unsub();
  }, [familyId, childId]);

  const items = settings?.items || [];
  const itemsForCat = items.filter((it) => it.cat === activeCat);

  async function persistItems(nextItems) {
    await saveSettings(familyId, childId, { items: nextItems });
  }

  async function handleSaveItem(item) {
    const exists = items.some((it) => it.id === item.id);
    const nextItems = exists
      ? items.map((it) => (it.id === item.id ? item : it))
      : [...items, item];
    await persistItems(nextItems);
    setEditingItem(null);
  }

  async function handleDeleteItem(itemId) {
    await persistItems(items.filter((it) => it.id !== itemId));
  }

  if (profile === undefined || settings === undefined) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--pink-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--text-faint)" }}>Chargement…</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--pink-bg)", paddingBottom: 40 }}>
      <div style={{ background: "var(--pink-header)", color: "#fff", padding: "calc(20px + env(safe-area-inset-top)) 20px 18px", borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 8 }}>
          ← Retour
        </button>
        <h1 className="disp" style={{ fontSize: 22, margin: 0 }}>
          Réglages — {profile?.displayName}
        </h1>
        <p style={{ fontSize: 12.5, opacity: 0.85, margin: "4px 0 0" }}>
          Missions payées en {profile?.currencyUnit}
        </p>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setActiveCat(c.key)}
              style={{
                flex: "0 0 auto", padding: "8px 14px", borderRadius: 999, fontSize: 13,

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
                flex: "0 0 auto", padding: "8px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                border: activeCat === c.key ? "2px solid var(--pink-header)" : "1px solid var(--pink-input-border)",
                background: activeCat === c.key ? "rgba(214,49,124,0.08)" : "var(--pink-card)",
                color: "var(--text-main)",
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        {itemsForCat.length === 0 && (
          <p style={{ color: "var(--text-faint)", textAlign: "center", padding: 20, fontSize: 14 }}>
            Aucun item dans cette catégorie pour l'instant.
          </p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {itemsForCat.map((item) => (
            <div
              key={item.id}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--pink-card)", border: "1px solid var(--pink-border)", borderRadius: 12, padding: "12px 14px" }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{item.fr}</div>
                {item.he && <div dir="rtl" style={{ fontSize: 12, color: "var(--text-faint)" }}>{item.he}</div>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  className="mono"
                  style={{ fontSize: 14, fontWeight: 600, color: item.amt < 0 ? "var(--red)" : "var(--green)" }}
                >
                  {item.amt > 0 ? "+" : ""}{item.amt} {profile?.currencyUnit}
                </span>
                <button onClick={() => setEditingItem(item)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15 }}>✏️</button>
                <button onClick={() => handleDeleteItem(item.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15 }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>

        <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => setEditingItem("new")}>
          + Ajouter un item {CATEGORIES.find((c) => c.key === activeCat)?.label}
        </button>
      </div>

      {editingItem && (
        <ItemModal
          item={editingItem === "new" ? null : editingItem}
          defaultCat={activeCat}
          onSave={handleSaveItem}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}

function ItemModal({ item, defaultCat, onSave, onClose }) {
  const [fr, setFr] = useState(item?.fr || "");
  const [he, setHe] = useState(item?.he || "");
  const [amt, setAmt] = useState(item ? Math.abs(item.amt).toString() : "");
  const [cat, setCat] = useState(item?.cat || defaultCat);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const parsedAmt = parseFloat(amt.replace(",", "."));
    if (!fr.trim()) { setError("Donne au moins un libellé en français."); return; }
    if (isNaN(parsedAmt) || parsedAmt <= 0) { setError("Le montant doit être un nombre positif."); return; }

    setSaving(true);
    try {
      const signedAmt = cat === "malus" ? -parsedAmt : parsedAmt;
      await onSave({
        id: item?.id || `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        fr: fr.trim(),
        he: he.trim(),
        amt: signedAmt,
        cat,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(91,32,58,0.55)", display: "flex", alignItems: "flex-end", zIndex: 60 }} onClick={onClose}>
      <div style={{ background: "var(--pink-card)", width: "100%", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "22px 20px calc(22px + env(safe-area-inset-bottom))" }} onClick={(e) => e.stopPropagation()}>
        <h3 className="disp" style={{ margin: "0 0 14px" }}>{item ? "Modifier l'item" : "Nouvel item"}</h3>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Catégorie</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {CATEGORIES.map((c) => (
                <button
                  type="button" key={c.key} onClick={() => setCat(c.key)}
                  style={{
                    flex: "0 0 auto", padding: "8px 12px", borderRadius: 10, fontSize: 12, cursor: "pointer",
                    border: cat === c.key ? "2px solid var(--pink-header)" : "1px solid var(--pink-input-border)",
                    background: cat === c.key ? "rgba(214,49,124,0.08)" : "transparent",
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label>Libellé (français)</label>
            <input value={fr} onChange={(e) => setFr(e.target.value)} placeholder="Ranger sa chambre" />
          </div>
          <div className="field">
            <label>Libellé (hébreu) — optionnel</label>
            <input dir="rtl" value={he} onChange={(e) => setHe(e.target.value)} placeholder="לסדר את החדר" />
          </div>
          <div className="field">
            <label>Montant (toujours positif — le signe est automatique selon la catégorie)</label>
            <input
              inputMode="decimal" value={amt}
              onChange={(e) => setAmt(e.target.value.replace(/[^0-9.,]/g, ""))}
              placeholder="5"
            />
          </div>
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? "…" : "Enregistrer"}
          </button>
        </form>
        <button className="link-btn" onClick={onClose}>Annuler</button>
      </div>
    </div>
  );
}

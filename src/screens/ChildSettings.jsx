import { useEffect, useState } from "react";
import { watchChildProfile, watchSettings, saveSettings } from "../services/firestore.js";
import { BUILTIN_CATALOG, HOUSE_RULES, PAYMENT_RULE } from "../data/missionCatalog.js";
import { translateFrToHe, translateHeToFr } from "../services/translate.js";

const TABS = [
  { key: "bonus", label: "✅ Bonus", valueLabel: "Montant", sign: "+" },
  { key: "malus", label: "⚠️ Malus", valueLabel: "Retrait", sign: "-" },
  { key: "weekly", label: "🏆 Hebdo", valueLabel: "Montant", sign: "+" },
  { key: "jokerEarn", label: "⭐ Gagner Jokers", valueLabel: "Jokers gagnés", sign: "+", unit: "🃏" },
  { key: "jokerUse", label: "🎁 Utiliser Jokers", valueLabel: "Coût en Jokers", sign: "-", unit: "🃏" },
  { key: "reward", label: "👑 Récompenses", valueLabel: "Seuil", sign: "" },
  { key: "rules", label: "📜 Règles", readOnly: true },
];

/**
 * Parent-only screen: the family's mission catalog (bonus/malus/weekly/jokers/rewards),
 * preloaded with Rebecca's original list. Builtin items are toggled on/off with a
 * checkbox (unchecked by default) rather than retyped; parents can also add fully
 * custom items, which get auto-translated FR<->HE via a free translation API.
 */
export default function ChildSettings({ familyId, childId, onBack }) {
  const [profile, setProfile] = useState(undefined);
  const [settings, setSettings] = useState(undefined);
  const [activeTab, setActiveTab] = useState("bonus");
  const [editingItem, setEditingItem] = useState(null); // null | "new" | custom item object

  useEffect(() => watchChildProfile(familyId, childId, setProfile), [familyId, childId]);
  useEffect(() => {
    let unsub;
    watchSettings(familyId, childId, setSettings).then((u) => { unsub = u; });
    return () => unsub && unsub();
  }, [familyId, childId]);

  const enabledIds = settings?.enabledIds || {};
  const customItems = settings?.customItems || [];
  const tab = TABS.find((t) => t.key === activeTab);
  const unit = tab?.unit || profile?.currencyUnit || "";

  async function persist(nextEnabledIds, nextCustomItems) {
    await saveSettings(familyId, childId, {
      enabledIds: nextEnabledIds ?? enabledIds,
      customItems: nextCustomItems ?? customItems,
    });
  }

  function toggleBuiltin(id) {
    persist({ ...enabledIds, [id]: !enabledIds[id] });
  }

  async function handleSaveCustomItem(item) {
    const exists = customItems.some((it) => it.id === item.id);
    const next = exists
      ? customItems.map((it) => (it.id === item.id ? item : it))
      : [...customItems, item];
    await persist(undefined, next);
    setEditingItem(null);
  }

  async function handleDeleteCustomItem(itemId) {
    await persist(undefined, customItems.filter((it) => it.id !== itemId));
  }

  if (profile === undefined || settings === undefined) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--pink-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--text-faint)" }}>Chargement…</p>
      </div>
    );
  }

  const builtinForTab = tab?.readOnly ? [] : BUILTIN_CATALOG[activeTab] || [];
  const customForTab = tab?.readOnly ? [] : customItems.filter((it) => it.cat === activeTab);

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
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                flex: "0 0 auto", padding: "8px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                border: activeTab === t.key ? "2px solid var(--pink-header)" : "1px solid var(--pink-input-border)",
                background: activeTab === t.key ? "rgba(214,49,124,0.08)" : "var(--pink-card)",
                color: "var(--text-main)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab.readOnly ? (
        <RulesPanel />
      ) : (
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {builtinForTab.map((item) => (
              <BuiltinRow
                key={item.id}
                item={item}
                checked={!!enabledIds[item.id]}
                onToggle={() => toggleBuiltin(item.id)}
                sign={tab.sign}
                unit={unit}
              />
            ))}
            {customForTab.map((item) => (
              <CustomRow
                key={item.id}
                item={item}
                sign={tab.sign}
                unit={unit}
                onEdit={() => setEditingItem(item)}
                onDelete={() => handleDeleteCustomItem(item.id)}
              />
            ))}
          </div>

          <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => setEditingItem("new")}>
            + Ajouter un item personnalisé
          </button>
        </div>
      )}

      {editingItem && (
        <ItemModal
          item={editingItem === "new" ? null : editingItem}
          cat={activeTab}
          valueLabel={tab.valueLabel}
          unit={unit}
          onSave={handleSaveCustomItem}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}

function BuiltinRow({ item, checked, onToggle, sign, unit }) {
  return (
    <label
      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--pink-card)", border: "1px solid var(--pink-border)", borderRadius: 12, padding: "12px 14px", cursor: "pointer" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
        <input type="checkbox" checked={checked} onChange={onToggle} style={{ width: 18, height: 18, flex: "0 0 auto" }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{item.fr}</div>
          <div dir="rtl" style={{ fontSize: 12, color: "var(--text-faint)" }}>{item.he}</div>
        </div>
      </div>
      <span className="mono" style={{ fontSize: 13.5, fontWeight: 600, color: sign === "-" ? "var(--red)" : "var(--green)", flex: "0 0 auto", marginLeft: 8 }}>
        {sign}{item.val} {unit}
      </span>
    </label>
  );
}

function CustomRow({ item, sign, unit, onEdit, onDelete }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--pink-card)", border: "1px dashed var(--pink-header)", borderRadius: 12, padding: "12px 14px" }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{item.fr}</div>
        {item.he && <div dir="rtl" style={{ fontSize: 12, color: "var(--text-faint)" }}>{item.he}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span className="mono" style={{ fontSize: 13.5, fontWeight: 600, color: sign === "-" ? "var(--red)" : "var(--green)" }}>
          {sign}{item.val} {unit}
        </span>
        <button onClick={onEdit} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15 }}>✏️</button>
        <button onClick={onDelete} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15 }}>🗑️</button>
      </div>
    </div>
  );
}

function RulesPanel() {
  return (
    <div style={{ padding: "16px 16px 0" }}>
      <div style={{ background: "var(--pink-card)", border: "1px solid var(--pink-border)", borderRadius: 14, padding: "16px 16px", marginBottom: 14 }}>
        <h3 className="disp" style={{ margin: "0 0 10px", fontSize: 16 }}>💳 Versement</h3>
        <p style={{ fontSize: 13.5, margin: "0 0 6px" }}>{PAYMENT_RULE.fr}</p>
        <p dir="rtl" style={{ fontSize: 12.5, color: "var(--text-faint)", margin: 0 }}>{PAYMENT_RULE.he}</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {HOUSE_RULES.map((rule, i) => (
          <div key={i} style={{ background: "var(--pink-card)", border: "1px solid var(--pink-border)", borderRadius: 12, padding: "12px 14px" }}>
            <p style={{ fontSize: 13.5, margin: "0 0 4px" }}>✅ {rule.fr}</p>
            <p dir="rtl" style={{ fontSize: 12.5, color: "var(--text-faint)", margin: 0 }}>✅ {rule.he}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ItemModal({ item, cat, valueLabel, unit, onSave, onClose }) {
  const [fr, setFr] = useState(item?.fr || "");
  const [he, setHe] = useState(item?.he || "");
  const [val, setVal] = useState(item ? item.val.toString() : "");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(null); // "fr" | "he" | null

  async function handleFrBlur() {
    if (!fr.trim() || he.trim()) return;
    setTranslating("he");
    const result = await translateFrToHe(fr);
    if (result) setHe(result);
    setTranslating(null);
  }

  async function handleHeBlur() {
    if (!he.trim() || fr.trim()) return;
    setTranslating("fr");
    const result = await translateHeToFr(he);
    if (result) setFr(result);
    setTranslating(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const parsedVal = parseFloat(val.replace(",", "."));
    if (!fr.trim()) { setError("Donne au moins un libellé en français."); return; }
    if (isNaN(parsedVal) || parsedVal <= 0) { setError("La valeur doit être un nombre positif."); return; }

    setSaving(true);
    try {
      await onSave({
        id: item?.id || `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        fr: fr.trim(),
        he: he.trim(),
        val: parsedVal,
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
            <label>Libellé (français)</label>
            <input value={fr} onChange={(e) => setFr(e.target.value)} onBlur={handleFrBlur} placeholder="Ranger sa chambre" />
          </div>
          <div className="field">
            <label>Libellé (hébreu) {translating === "he" && "— traduction…"}</label>
            <input dir="rtl" value={he} onChange={(e) => setHe(e.target.value)} onBlur={handleHeBlur} placeholder="לסדר את החדר" />
          </div>
          <div className="field">
            <label>{valueLabel} {unit ? `(${unit})` : ""}</label>
            <input
              inputMode="decimal" value={val}
              onChange={(e) => setVal(e.target.value.replace(/[^0-9.,]/g, ""))}
              placeholder="5"
            />
          </div>
          <button className="btn-primary" type="submit" disabled={saving || translating}>
            {saving ? "…" : "Enregistrer"}
          </button>
        </form>
        <button className="link-btn" onClick={onClose}>Annuler</button>
      </div>
    </div>
  );
}

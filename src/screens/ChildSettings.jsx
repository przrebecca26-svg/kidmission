import { useEffect, useState } from "react";
import { watchChildProfile, watchSettings, saveSettings } from "../services/firestore.js";
import { BUILTIN_CATALOG, HOUSE_RULES, PAYMENT_RULE, UNIT_OPTIONS } from "../data/missionCatalog.js";
import { translateFrToHe, translateHeToFr, getItemLabel } from "../services/translate.js";
import { useLang, LanguageSwitcher } from "../i18n.jsx";

function useItemLabel(item, lang) {
  const [label, setLabel] = useState(lang === "he" ? (item.he || item.fr) : item.fr);
  useEffect(() => {
    let alive = true;
    getItemLabel(item, lang).then((l) => { if (alive) setLabel(l); });
    return () => { alive = false; };
  }, [item.id, item.fr, item.he, lang]);
  return label;
}

export default function ChildSettings({ familyId, childId, onBack }) {
  const { lang, setLang, t, dir } = useLang();
  const [profile, setProfile] = useState(undefined);
  const [settings, setSettings] = useState(undefined);
  const [activeTab, setActiveTab] = useState("bonus");
  const [editingItem, setEditingItem] = useState(null);
  const [showHidden, setShowHidden] = useState(false);

  const TABS = [
    { key: "bonus", label: t("tabBonus"), valueLabel: t("valAmount"), sign: "+" },
    { key: "malus", label: t("tabMalus"), valueLabel: t("valWithdraw"), sign: "-" },
    { key: "weekly", label: t("tabWeekly"), valueLabel: t("valAmount"), sign: "+" },
    { key: "jokerEarn", label: t("tabJokerEarn"), valueLabel: t("valJokersEarned"), sign: "+", unit: "🃏" },
    { key: "jokerUse", label: t("tabJokerUse"), valueLabel: t("valJokersCost"), sign: "-", unit: "🃏" },
    { key: "reward", label: t("tabReward"), valueLabel: t("valThreshold"), sign: "" },
    { key: "rules", label: t("tabRules"), readOnly: true },
  ];

  useEffect(() => watchChildProfile(familyId, childId, setProfile), [familyId, childId]);
  useEffect(() => {
    let unsub;
    watchSettings(familyId, childId, setSettings).then((u) => { unsub = u; });
    return () => unsub && unsub();
  }, [familyId, childId]);

  useEffect(() => { setShowHidden(false); }, [activeTab]);

  const enabledIds = settings?.enabledIds || {};
  const customItems = settings?.customItems || [];
  const builtinOverrides = settings?.builtinOverrides || {};
  const hiddenBuiltinIds = settings?.hiddenBuiltinIds || {};
  const tab = TABS.find((tb) => tb.key === activeTab);
  const defaultUnit = tab?.unit || profile?.currencyUnit || "";

  async function persist(nextEnabledIds, nextCustomItems, nextBuiltinOverrides, nextHiddenBuiltinIds) {
    await saveSettings(familyId, childId, {
      enabledIds: nextEnabledIds ?? enabledIds,
      customItems: nextCustomItems ?? customItems,
      builtinOverrides: nextBuiltinOverrides ?? builtinOverrides,
      hiddenBuiltinIds: nextHiddenBuiltinIds ?? hiddenBuiltinIds,
    });
  }

  function toggleBuiltin(id) {
    persist({ ...enabledIds, [id]: !enabledIds[id] });
  }

  function mergedBuiltin(item) {
    const ov = builtinOverrides[item.id];
    return ov ? { ...item, ...ov, id: item.id } : item;
  }

  async function handleSaveItem(item) {
    if (item._builtinId) {
      const next = { ...builtinOverrides, [item._builtinId]: { fr: item.fr, he: item.he, val: item.val, unit: item.unit } };
      await persist(undefined, undefined, next);
      setEditingItem(null);
      return;
    }
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

  async function handleHideBuiltin(itemId) {
    await persist(undefined, undefined, undefined, { ...hiddenBuiltinIds, [itemId]: true });
  }

  async function handleRestoreBuiltin(itemId) {
    const next = { ...hiddenBuiltinIds };
    delete next[itemId];
    await persist(undefined, undefined, undefined, next);
  }

  if (profile === undefined || settings === undefined) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--pink-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--text-faint)" }}>{t("loading")}</p>
      </div>
    );
  }

  const allBuiltinForTab = tab?.readOnly ? [] : BUILTIN_CATALOG[activeTab] || [];
  const visibleBuiltinForTab = allBuiltinForTab.filter((item) => !hiddenBuiltinIds[item.id]);
  const hiddenBuiltinForTab = allBuiltinForTab.filter((item) => hiddenBuiltinIds[item.id]);
  const customForTab = tab?.readOnly ? [] : customItems.filter((it) => it.cat === activeTab);

  return (
    <div dir={dir} style={{ minHeight: "100vh", background: "var(--pink-bg)", paddingBottom: 40 }}>
      <div style={{ background: "var(--pink-header)", color: "#fff", padding: "calc(20px + env(safe-area-inset-top)) 20px 18px", borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 8 }}>
            {t("back")}
          </button>
          <LanguageSwitcher lang={lang} setLang={setLang} />
        </div>
        <h1 className="disp" style={{ fontSize: 22, margin: 0 }}>
          {t("settingsFor", { name: profile?.displayName })}
        </h1>
        <p style={{ fontSize: 12.5, opacity: 0.85, margin: "4px 0 0" }}>
          {t("defaultCurrency", { unit: profile?.currencyUnit })}
        </p>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {TABS.map((tb) => (
            <button
              key={tb.key}
              onClick={() => setActiveTab(tb.key)}
              style={{
                flex: "0 0 auto", padding: "8px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                border: activeTab === tb.key ? "2px solid var(--pink-header)" : "1px solid var(--pink-input-border)",
                background: activeTab === tb.key ? "rgba(214,49,124,0.08)" : "var(--pink-card)",
                color: "var(--text-main)",
              }}
            >
              {tb.label}
            </button>
          ))}
        </div>
      </div>

      {tab.readOnly ? (
        <RulesPanel lang={lang} t={t} />
      ) : (
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {visibleBuiltinForTab.map((item) => (
              <BuiltinRow
                key={item.id}
                item={mergedBuiltin(item)}
                lang={lang}
                checked={!!enabledIds[item.id]}
                onToggle={() => toggleBuiltin(item.id)}
                sign={tab.sign}
                unit={defaultUnit}
                onEdit={() => setEditingItem({ ...mergedBuiltin(item), _builtinId: item.id })}
                onDelete={() => handleHideBuiltin(item.id)}
              />
            ))}
            {customForTab.map((item) => (
              <CustomRow
                key={item.id}
                item={item}
                lang={lang}
                sign={tab.sign}
                fallbackUnit={defaultUnit}
                onEdit={() => setEditingItem(item)}
                onDelete={() => handleDeleteCustomItem(item.id)}
              />
            ))}
          </div>

          <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => setEditingItem("new")}>
            {t("addCustomItem")}
          </button>

          {hiddenBuiltinForTab.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <button
                onClick={() => setShowHidden((v) => !v)}
                style={{ background: "none", border: "none", color: "var(--text-faint)", fontSize: 12.5, cursor: "pointer", padding: 0, textDecoration: "underline" }}
              >
                {showHidden ? "▲ " : "▼ "}Items masqués ({hiddenBuiltinForTab.length})
              </button>
              {showHidden && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                  {hiddenBuiltinForTab.map((item) => (
                    <HiddenRow
                      key={item.id}
                      item={mergedBuiltin(item)}
                      lang={lang}
                      sign={tab.sign}
                      unit={defaultUnit}
                      onRestore={() => handleRestoreBuiltin(item.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {editingItem && (
        <ItemModal
          item={editingItem === "new" ? null : editingItem}
          cat={activeTab}
          valueLabel={tab.valueLabel}
          defaultUnit={defaultUnit}
          t={t}
          onSave={handleSaveItem}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}

function BuiltinRow({ item, lang, checked, onToggle, sign, unit, onEdit, onDelete }) {
  const label = useItemLabel(item, lang);
  return (
    <div
      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--pink-card)", border: "1px solid var(--pink-border)", borderRadius: 12, padding: "12px 14px" }}
    >
      <label style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0, cursor: "pointer" }}>
        <input type="checkbox" checked={checked} onChange={onToggle} style={{ width: 18, height: 18, flex: "0 0 auto" }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
        </div>
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "0 0 auto", marginLeft: 8 }}>
        <span className="mono" style={{ fontSize: 13.5, fontWeight: 600, color: sign === "-" ? "var(--red)" : "var(--green)" }}>
          {sign}{item.val} {unit}
        </span>
        <button onClick={onEdit} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15 }}>✏️</button>
        <button
          onClick={() => {
            if (window.confirm("Masquer cet item de la liste ? Tu pourras le restaurer plus tard depuis « Items masqués ».")) onDelete();
          }}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15 }}
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

function CustomRow({ item, lang, sign, fallbackUnit, onEdit, onDelete }) {
  const label = useItemLabel(item, lang);
  const unit = item.unit || fallbackUnit;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--pink-card)", border: "1px dashed var(--pink-header)", borderRadius: 12, padding: "12px 14px" }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
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

function HiddenRow({ item, lang, sign, unit, onRestore }) {
  const label = useItemLabel(item, lang);
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--pink-bg)", border: "1px solid var(--pink-border)", borderRadius: 12, padding: "10px 14px", opacity: 0.75 }}>
      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span className="mono" style={{ fontSize: 12.5, color: "var(--text-faint)" }}>{sign}{item.val} {unit}</span>
        <button onClick={onRestore} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13.5 }}>↩️ Restaurer</button>
      </div>
    </div>
  );
}

function RuleRow({ rule, lang }) {
  const label = useItemLabel(rule, lang);
  return <p style={{ fontSize: 13.5, margin: 0 }}>✅ {label}</p>;
}

function RulesPanel({ lang, t }) {
  const paymentLabel = useItemLabel({ ...PAYMENT_RULE, id: "payment-rule" }, lang);
  return (
    <div style={{ padding: "16px 16px 0" }}>
      <div style={{ background: "var(--pink-card)", border: "1px solid var(--pink-border)", borderRadius: 14, padding: "16px 16px", marginBottom: 14 }}>
        <h3 className="disp" style={{ margin: "0 0 10px", fontSize: 16 }}>{t("paymentSectionTitle")}</h3>
        <p style={{ fontSize: 13.5, margin: 0 }}>{paymentLabel}</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {HOUSE_RULES.map((rule, i) => (
          <div key={i} style={{ background: "var(--pink-card)", border: "1px solid var(--pink-border)", borderRadius: 12, padding: "12px 14px" }}>
            <RuleRow rule={{ ...rule, id: `rule-${i}` }} lang={lang} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ItemModal({ item, cat, valueLabel, defaultUnit, t, onSave, onClose }) {
  const [fr, setFr] = useState(item?.fr || "");
  const [he, setHe] = useState(item?.he || "");
  const [val, setVal] = useState(item ? item.val.toString() : "");
  const [unit, setUnit] = useState(item?.unit || defaultUnit);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(null);

  const isBuiltinEdit = !!item?._builtinId;

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
    if (!fr.trim()) { setError(t("errGiveFrLabel")); return; }
    if (isNaN(parsedVal) || parsedVal <= 0) { setError(t("errPositiveNumber")); return; }

    setSaving(true);
    try {
      await onSave({
        id: item?.id || `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        _builtinId: item?._builtinId,
        fr: fr.trim(),
        he: he.trim(),
        val: parsedVal,
        unit,
        cat,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(91,32,58,0.55)", display: "flex", alignItems: "flex-end", zIndex: 60 }} onClick={onClose}>
      <div style={{ background: "var(--pink-card)", width: "100%", maxHeight: "90vh", overflowY: "auto", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "22px 20px calc(22px + env(safe-area-inset-bottom))" }} onClick={(e) => e.stopPropagation()}>
        <h3 className="disp" style={{ margin: "0 0 14px" }}>
          {isBuiltinEdit ? "Modifier cet item" : (item ? t("editItem") : t("newItem"))}
        </h3>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>{t("frLabelField")}</label>
            <input value={fr} onChange={(e) => setFr(e.target.value)} onBlur={handleFrBlur} placeholder="Ranger sa chambre" />
          </div>
          <div className="field">
            <label>{t("heLabelField")} {translating === "he" && t("translatingSuffix")}</label>
            <input dir="rtl" value={he} onChange={(e) => setHe(e.target.value)} onBlur={handleHeBlur} placeholder="לסדר את החדר" />
          </div>
          <div className="field">
            <label>{t("rewardTypeShort")}</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {UNIT_OPTIONS.map((opt) => (
                <button
                  type="button" key={opt.key} onClick={() => setUnit(opt.symbol)}
                  style={{
                    flex: "0 0 auto", padding: "8px 12px", borderRadius: 10, fontSize: 12, cursor: "pointer",
                    border: unit === opt.symbol ? "2px solid var(--pink-header)" : "1px solid var(--pink-input-border)",
                    background: unit === opt.symbol ? "rgba(214,49,124,0.08)" : "transparent",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label>{valueLabel} ({unit})</label>
            <input
              inputMode="decimal" value={val}
              onChange={(e) => setVal(e.target.value.replace(/[^0-9.,]/g, ""))}
              placeholder="5"
            />
          </div>
          <button className="btn-primary" type="submit" disabled={saving || translating}>
            {saving ? "…" : t("saveSimple")}
          </button>
        </form>
        <button className="link-btn" onClick={onClose}>{t("cancel")}</button>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import {
  watchChildProfile, watchSettings, watchEntries, addEntry, approveEntry, rejectOrDeleteEntry,
  watchRewardClaims, claimReward, approveRewardClaim, rejectRewardClaim,
} from "../services/firestore.js";
import { logout } from "../services/auth.js";
import { getItemLabel } from "../services/translate.js";
import { BUILTIN_CATALOG } from "../data/missionCatalog.js";
import { useLang, LanguageSwitcher } from "../i18n.jsx";

const BONUS_CATS = ["bonus", "weekly"];
const MALUS_CATS = ["malus"];
const JOKER_EARN_CATS = ["jokerEarn"];
const JOKER_USE_CATS = ["jokerUse"];
const REWARD_CATS = ["reward"];

const LOCALES = { fr: "fr-FR", he: "he-IL", en: "en-GB", ru: "ru-RU" };

// Petits libellés d'onglets bilingues, indépendants du fichier i18n.jsx
// (pas besoin de toucher i18n.jsx pour ce correctif)
const TAB_LABELS = {
  bonus: { fr: "🎯 Bonus", he: "🎯 בונוסים", en: "🎯 Bonus", ru: "🎯 Бонусы" },
  malus: { fr: "⚠️ Malus", he: "⚠️ קנסות", en: "⚠️ Malus", ru: "⚠️ Штрафы" },
  jokerEarn: { fr: "🃏 Jokers gagnés", he: "🃏 ג'וקרים שהורווחו", en: "🃏 Jokers earned", ru: "🃏 Заработанные джокеры" },
  jokerUse: { fr: "🃏 Jokers à dépenser", he: "🃏 ג'וקרים לשימוש", en: "🃏 Jokers to spend", ru: "🃏 Джокеры на использование" },
};

function signFor(cat) {
  return cat === "malus" || cat === "jokerUse" ? -1 : 1;
}

function unitFor(item, currencyUnit) {
  if (item.unit) return item.unit;
  return item.cat === "jokerEarn" || item.cat === "jokerUse" ? "🃏" : currencyUnit;
}

function currentPeriodKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatDate(ts, lang) {
  if (!ts?.toDate) return "…";
  return ts.toDate().toLocaleDateString(LOCALES[lang] || "fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function useItemLabel(item, lang) {
  const [label, setLabel] = useState(lang === "he" ? (item.he || item.fr) : item.fr);
  useEffect(() => {
    let alive = true;
    getItemLabel(item, lang).then((l) => { if (alive) setLabel(l); });
    return () => { alive = false; };
  }, [item.id, item.fr, item.he, lang]);
  return label;
}

export default function ChildHome({ familyId, childId, uid, isParent, onBack }) {
  const { lang, setLang, t, dir } = useLang();
  const [profile, setProfile] = useState(undefined);
  const [settings, setSettings] = useState(undefined);
  const [entries, setEntries] = useState(undefined);
  const [claims, setClaims] = useState(undefined);
  const [activeTab, setActiveTab] = useState("bonus");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => watchChildProfile(familyId, childId, setProfile), [familyId, childId]);
  useEffect(() => {
    let unsub;
    watchSettings(familyId, childId, setSettings).then((u) => { unsub = u; });
    return () => unsub && unsub();
  }, [familyId, childId]);
  useEffect(() => watchEntries(familyId, childId, setEntries), [familyId, childId]);
  useEffect(() => watchRewardClaims(familyId, childId, setClaims), [familyId, childId]);

  if (profile === undefined || settings === undefined || entries === undefined || claims === undefined) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--pink-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--text-faint)" }}>{t("loading")}</p>
      </div>
    );
  }

  if (profile === null) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--pink-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p>{t("profileNotFound")}</p>
      </div>
    );
  }

  const enabledIds = settings?.enabledIds || {};
  const customItems = settings?.customItems || [];

  function itemsFor(cats) {
    const builtin = cats.flatMap((cat) =>
      (BUILTIN_CATALOG[cat] || []).filter((it) => enabledIds[it.id]).map((it) => ({ ...it, cat }))
    );
    const custom = customItems.filter((it) => cats.includes(it.cat));
    return [...builtin, ...custom];
  }

  async function handleDeclare(item) {
    setBusyId(item.id);
    try {
      await addEntry(familyId, childId, {
        itemId: item.id, he: item.he, fr: item.fr,
        amt: signFor(item.cat) * item.val, unit: unitFor(item, profile.currencyUnit),
        cat: item.cat, createdBy: uid, isParent,
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handleClaim(item) {
    setBusyId(item.id);
    try {
      await claimReward(familyId, childId, {
        rewardId: item.id, periodKey: currentPeriodKey(), he: item.he, fr: item.fr,
        threshold: item.val, createdBy: uid, isParent,
      });
    } finally {
      setBusyId(null);
    }
  }

  const confirmedEntries = entries.filter((e) => e.status === "confirmed");
  const moneyBalance = Math.max(0, confirmedEntries.filter((e) => e.unit === profile.currencyUnit).reduce((s, e) => s + e.amt, 0));
  const jokerBalance = Math.max(0, confirmedEntries.filter((e) => e.unit === "🃏").reduce((s, e) => s + e.amt, 0));

  const requestList = [
    ...entries.map((e) => ({ ...e, kind: "entry" })),
    ...claims.map((c) => ({ ...c, kind: "claim", fr: c.fr, he: c.he })),
  ].sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));

  const tabs = [
    { key: "bonus", label: TAB_LABELS.bonus[lang] || TAB_LABELS.bonus.fr },
    { key: "malus", label: TAB_LABELS.malus[lang] || TAB_LABELS.malus.fr },
    { key: "jokerEarn", label: TAB_LABELS.jokerEarn[lang] || TAB_LABELS.jokerEarn.fr },
    { key: "jokerUse", label: TAB_LABELS.jokerUse[lang] || TAB_LABELS.jokerUse.fr },
    { key: "rewards", label: t("tabRewards") },
    { key: "requests", label: t("tabRequests") },
  ];

  return (
    <div dir={dir} style={{ minHeight: "100vh", background: "var(--pink-bg)", paddingBottom: 40 }}>
      <div style={{ background: "var(--pink-header)", color: "#fff", padding: "calc(20px + env(safe-area-inset-top)) 20px 18px", borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          {onBack ? (
            <button onClick={onBack} style={{ background: "none", border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 8 }}>
              {t("back")}
            </button>
          ) : <span />}
          <LanguageSwitcher lang={lang} setLang={setLang} />
        </div>
        <h1 className="disp" style={{ fontSize: 22, margin: "0 0 10px" }}>🧒 {profile.displayName}</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <span style={{ background: "rgba(255,255,255,0.18)", borderRadius: 999, padding: "6px 12px", fontSize: 13, fontWeight: 700 }} className="mono">
            {moneyBalance} {profile.currencyUnit}
          </span>
          <span style={{ background: "rgba(255,255,255,0.18)", borderRadius: 999, padding: "6px 12px", fontSize: 13, fontWeight: 700 }} className="mono">
            🃏 {jokerBalance}
          </span>
        </div>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: "0 0 auto", padding: "8px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                border: activeTab === tab.key ? "2px solid var(--pink-header)" : "1px solid var(--pink-input-border)",
                background: activeTab === tab.key ? "rgba(214,49,124,0.08)" : "var(--pink-card)",
                color: "var(--text-main)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        {activeTab === "bonus" && (
          <MissionList items={itemsFor(BONUS_CATS)} currencyUnit={profile.currencyUnit} onAct={handleDeclare} busyId={busyId} isParent={isParent} lang={lang} t={t} />
        )}
        {activeTab === "malus" && (
          <MissionList items={itemsFor(MALUS_CATS)} currencyUnit={profile.currencyUnit} onAct={handleDeclare} busyId={busyId} isParent={isParent} lang={lang} t={t} />
        )}
        {activeTab === "jokerEarn" && (
          <MissionList items={itemsFor(JOKER_EARN_CATS)} currencyUnit={profile.currencyUnit} onAct={handleDeclare} busyId={busyId} isParent={isParent} lang={lang} t={t} />
        )}
        {activeTab === "jokerUse" && (
          <MissionList items={itemsFor(JOKER_USE_CATS)} currencyUnit={profile.currencyUnit} onAct={handleDeclare} busyId={busyId} isParent={isParent} lang={lang} t={t} />
        )}
        {activeTab === "rewards" && (
          <RewardList items={itemsFor(REWARD_CATS)} currencyUnit={profile.currencyUnit} onAct={handleClaim} busyId={busyId} isParent={isParent} lang={lang} t={t} />
        )}
        {activeTab === "requests" && (
          <RequestList
            list={requestList} isParent={isParent} lang={lang} t={t}
            onApproveEntry={(id) => approveEntry(familyId, childId, id)}
            onRejectEntry={(id) => rejectOrDeleteEntry(familyId, childId, id)}
            onApproveClaim={(id) => approveRewardClaim(familyId, childId, id)}
            onRejectClaim={(id) => rejectRewardClaim(familyId, childId, id)}
          />
        )}
      </div>

      <div style={{ padding: "20px 16px 0", textAlign: "center" }}>
        <button className="link-btn" onClick={logout}>{t("logout")}</button>
      </div>
    </div>
  );
}

function MissionRow({ item, currencyUnit, onAct, busyId, isParent, lang, t }) {
  const label = useItemLabel(item, lang);
  const sign = signFor(item.cat);
  const unit = unitFor(item, currencyUnit);
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--pink-card)", border: "1px solid var(--pink-border)", borderRadius: 12, padding: "12px 14px", gap: 10 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
        <div className="mono" style={{ fontSize: 12.5, fontWeight: 600, color: sign < 0 ? "var(--red)" : "var(--green)", marginTop: 2 }}>
          {sign > 0 ? "+" : "-"}{item.val} {unit}
        </div>
      </div>
      <button
        className="btn-primary" style={{ width: "auto", flex: "0 0 auto", padding: "8px 14px", fontSize: 13 }}
        disabled={busyId === item.id}
        onClick={() => onAct(item)}
      >
        {busyId === item.id ? "…" : isParent ? t("save") : t("declare")}
      </button>
    </div>
  );
}

function MissionList({ items, currencyUnit, onAct, busyId, isParent, lang, t }) {
  if (items.length === 0) {
    return <p style={{ color: "var(--text-faint)", textAlign: "center", padding: 20, fontSize: 14 }}>{t("noMissions")}</p>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item) => (
        <MissionRow key={item.id} item={item} currencyUnit={currencyUnit} onAct={onAct} busyId={busyId} isParent={isParent} lang={lang} t={t} />
      ))}
    </div>
  );
}

function RewardRow({ item, currencyUnit, onAct, busyId, isParent, lang, t }) {
  const label = useItemLabel(item, lang);
  const unit = unitFor(item, currencyUnit);
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--pink-card)", border: "1px solid var(--pink-border)", borderRadius: 12, padding: "12px 14px", gap: 10 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
        <div className="mono" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-muted)", marginTop: 2 }}>
          {t("from")} {item.val} {unit}
        </div>
      </div>
      <button
        className="btn-primary" style={{ width: "auto", flex: "0 0 auto", padding: "8px 14px", fontSize: 13 }}
        disabled={busyId === item.id}
        onClick={() => onAct(item)}
      >
        {busyId === item.id ? "…" : isParent ? t("grant") : t("ask")}
      </button>
    </div>
  );
}

function RewardList({ items, currencyUnit, onAct, busyId, isParent, lang, t }) {
  if (items.length === 0) {
    return <p style={{ color: "var(--text-faint)", textAlign: "center", padding: 20, fontSize: 14 }}>{t("noRewards")}</p>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item) => (
        <RewardRow key={item.id} item={item} currencyUnit={currencyUnit} onAct={onAct} busyId={busyId} isParent={isParent} lang={lang} t={t} />
      ))}
    </div>
  );
}

function RequestRow({ req, isParent, lang, t, onApproveEntry, onRejectEntry, onApproveClaim, onRejectClaim }) {
  const label = useItemLabel(req, lang);
  const isPending = req.status === "pending";
  const isPositive = req.kind === "claim" ? true : req.amt >= 0;
  return (
    <div style={{ background: "var(--pink-card)", border: "1px solid var(--pink-border)", borderRadius: 12, padding: "12px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
          <div style={{ fontSize: 11.5, color: "var(--text-faint)", marginTop: 2 }}>{formatDate(req.createdAt, lang)}</div>
        </div>
        <span
          className="mono"
          style={{ fontSize: 13.5, fontWeight: 700, color: isPositive ? "var(--green)" : "var(--red)", flex: "0 0 auto" }}
        >
          {req.kind === "claim" ? `≥ ${req.threshold}` : `${req.amt > 0 ? "+" : ""}${req.amt}`} {req.unit || ""}
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: isPending ? "var(--text-muted)" : "var(--green)" }}>
          {isPending ? t("pending") : t("confirmed")}
        </span>
        {isParent && isPending && (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => (req.kind === "entry" ? onApproveEntry(req.id) : onApproveClaim(req.id))}
              style={{ background: "var(--green)", color: "#fff", border: "none", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              {t("validate")}
            </button>
            <button
              onClick={() => (req.kind === "entry" ? onRejectEntry(req.id) : onRejectClaim(req.id))}
              style={{ background: "none", color: "var(--red)", border: "1px solid var(--red)", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              {t("reject")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function RequestList({ list, isParent, lang, t, onApproveEntry, onRejectEntry, onApproveClaim, onRejectClaim }) {
  if (list.length === 0) {
    return <p style={{ color: "var(--text-faint)", textAlign: "center", padding: 20, fontSize: 14 }}>{t("noRequests")}</p>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {list.map((req) => (
        <RequestRow
          key={req.id} req={req} isParent={isParent} lang={lang} t={t}
          onApproveEntry={onApproveEntry} onRejectEntry={onRejectEntry}
          onApproveClaim={onApproveClaim} onRejectClaim={onRejectClaim}
        />
      ))}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import {
  watchChildProfile, watchSettings, watchEntries, addEntry, approveEntry, rejectOrDeleteEntry, cancelEntry,
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

// Petits libellés bilingues indépendants du fichier i18n.jsx
// (pas besoin de toucher i18n.jsx pour ces correctifs)
const TAB_LABELS = {
  bonus: { fr: "🎯 Bonus", he: "🎯 בונוסים", en: "🎯 Bonus", ru: "🎯 Бонусы" },
  malus: { fr: "⚠️ Malus", he: "⚠️ קנסות", en: "⚠️ Malus", ru: "⚠️ Штрафы" },
  jokerEarn: { fr: "🃏 Jokers gagnés", he: "🃏 ג'וקרים שהורווחו", en: "🃏 Jokers earned", ru: "🃏 Заработанные джокеры" },
  jokerUse: { fr: "🃏 Jokers à dépenser", he: "🃏 ג'וקרים לשימוש", en: "🃏 Jokers to spend", ru: "🃏 Джокеры на использование" },
};

const CANCELLED_LABEL = { fr: "❌ Annulé", he: "❌ בוטל", en: "❌ Cancelled", ru: "❌ Отменено" };
const CANCEL_BUTTON_LABEL = { fr: "Annuler", he: "לבטל", en: "Cancel", ru: "Отменить" };
const CANCEL_CONFIRM = {
  fr: "Annuler cette entrée ? Le solde sera recalculé.",
  he: "לבטל את הרשומה הזו? היתרה תעודכן.",
  en: "Cancel this entry? The balance will be recalculated.",
  ru: "Отменить эту запись? Баланс будет пересчитан.",
};

// ---------- Animations / feedback visuel ----------

const FEEDBACK_TITLES = {
  bonus: { fr: "Bravo !", he: "כל הכבוד!", en: "Well done!", ru: "Молодец!" },
  malus: { fr: "Oups…", he: "אופס…", en: "Oops…", ru: "Ой…" },
  jokerEarn: { fr: "Joker gagné !", he: "ג'וקר הורווח!", en: "Joker earned!", ru: "Джокер получен!" },
  jokerUse: { fr: "Joker utilisé !", he: "ג'וקר נוצל!", en: "Joker used!", ru: "Джокер использован!" },
  reward: { fr: "Nouvelle récompense !", he: "פרס חדש!", en: "New reward!", ru: "Новая награда!" },
};

const FEEDBACK_EMOJI = {
  bonus: "🎉",
  malus: "😕",
  jokerEarn: "🃏",
  jokerUse: "🃏",
  reward: "🏆",
};

function feedbackTypeForCat(cat) {
  if (cat === "malus") return "malus";
  if (cat === "jokerEarn") return "jokerEarn";
  if (cat === "jokerUse") return "jokerUse";
  return "bonus";
}

const STREAK_LABEL = {
  fr: (n) => `🔥 Série de ${n} missions !`,
  he: (n) => `🔥 רצף של ${n} משימות!`,
  en: (n) => `🔥 ${n}-mission streak!`,
  ru: (n) => `🔥 Серия из ${n} заданий!`,
};

const ANIM_STYLES = `
@keyframes kmConfettiFall {
  0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
  100% { transform: translateY(110vh) rotate(360deg); opacity: 0.9; }
}
@keyframes kmPopIn {
  0% { transform: scale(0.4); opacity: 0; }
  60% { transform: scale(1.08); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes kmShake {
  0% { transform: translateX(0) scale(1); }
  20% { transform: translateX(-6px) scale(1); }
  40% { transform: translateX(6px) scale(1); }
  60% { transform: translateX(-4px) scale(1); }
  80% { transform: translateX(4px) scale(1); }
  100% { transform: translateX(0) scale(1); }
}
@keyframes kmFadeShrink {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(0.55); opacity: 0; }
}
.km-confetti {
  position: absolute;
  top: -10px;
  width: 8px;
  height: 14px;
  border-radius: 2px;
  animation-name: kmConfettiFall;
  animation-timing-function: ease-in;
  animation-fill-mode: forwards;
}
.km-feedback-card {
  background: #fff;
  border-radius: 20px;
  padding: 22px 30px;
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  color: var(--pink-header, #d6317c);
  box-shadow: 0 8px 30px rgba(0,0,0,0.18);
  animation: kmPopIn 0.35s ease-out;
  max-width: 78vw;
}
.km-feedback-card.km-sad {
  color: #8a5a5a;
  animation: kmShake 0.4s ease;
}
.km-feedback-card.km-fadeaway {
  animation: kmFadeShrink 0.9s ease forwards;
  animation-delay: 0.5s;
}
.km-feedback-emoji {
  font-size: 44px;
  display: block;
  margin-bottom: 6px;
}
`;

const CONFETTI_COLORS = ["#d6317c", "#ffb703", "#5c8c5a", "#4c9fd6", "#f4a6c6"];

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

// Compte la série de missions positives consécutives les plus récentes
// (bonus / hebdo / joker gagné), interrompue par un malus ou un joker dépensé.
function computeStreak(confirmedEntries) {
  const sorted = [...confirmedEntries].sort(
    (a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
  );
  let count = 0;
  for (const e of sorted) {
    if (e.cat === "bonus" || e.cat === "weekly" || e.cat === "jokerEarn") {
      count++;
    } else {
      break;
    }
  }
  return count;
}

function ConfettiPiece({ index }) {
  const left = Math.random() * 100;
  const duration = 0.9 + Math.random() * 0.7;
  const delay = Math.random() * 0.3;
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  return (
    <span
      className="km-confetti"
      style={{
        left: `${left}%`,
        background: color,
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`,
      }}
    />
  );
}

function FeedbackCard({ feedback, lang }) {
  const titles = FEEDBACK_TITLES[feedback.type];
  const title = titles[lang] || titles.fr;
  const emoji = FEEDBACK_EMOJI[feedback.type];
  const isSad = feedback.type === "malus";
  const isFadeaway = feedback.type === "jokerUse";
  return (
    <div className={`km-feedback-card${isSad ? " km-sad" : ""}${isFadeaway ? " km-fadeaway" : ""}`}>
      <span className="km-feedback-emoji">{emoji}</span>
      {title}
      {feedback.line && (
        <div className="mono" style={{ marginTop: 6, fontSize: 22 }}>{feedback.line}</div>
      )}
    </div>
  );
}

function FeedbackOverlay({ feedback, lang, onDone }) {
  useEffect(() => {
    if (!feedback) return;
    const duration = feedback.type === "malus" ? 1300 : feedback.type === "jokerUse" ? 1500 : 1700;
    const timer = setTimeout(onDone, duration);
    return () => clearTimeout(timer);
  }, [feedback]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!feedback) return null;

  const showConfetti = feedback.type === "bonus" || feedback.type === "jokerEarn" || feedback.type === "reward";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", overflow: "hidden" }}>
      {showConfetti && Array.from({ length: 26 }).map((_, i) => <ConfettiPiece key={i} index={i} />)}
      <FeedbackCard feedback={feedback} lang={lang} />
    </div>
  );
}

// Petit compteur animé : fait défiler les chiffres au lieu de sauter directement
// à la nouvelle valeur, pour donner l'impression que l'argent/les jokers s'accumulent.
function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const start = prevRef.current;
    const end = value;
    if (start === end) return;
    const duration = 500;
    const startTime = performance.now();
    let raf;
    function step(now) {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 2);
      const current = Math.round(start + (end - start) * eased);
      setDisplay(current);
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      } else {
        prevRef.current = end;
      }
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return display;
}

function StreakBadge({ streak, lang }) {
  if (streak < 3) return null;
  const labelFn = STREAK_LABEL[lang] || STREAK_LABEL.fr;
  return (
    <div style={{ marginTop: 8, display: "inline-block", background: "rgba(255,255,255,0.22)", borderRadius: 999, padding: "5px 12px", fontSize: 12.5, fontWeight: 700, color: "#fff" }}>
      {labelFn(streak)}
    </div>
  );
}

// Petite enveloppe en haut de l'écran — pour Maman : nombre de demandes de
// Shyrel en attente de validation. Pour Shyrel : nombre de choses ajoutées
// par Maman depuis la dernière fois qu'elle a ouvert l'onglet "Mes demandes".
function EnvelopeButton({ count, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "relative", background: "rgba(255,255,255,0.18)", border: "none", borderRadius: 999,
        width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", fontSize: 16, padding: 0,
      }}
    >
      ✉️
      {count > 0 && (
        <span
          style={{
            position: "absolute", top: -4, right: -4, background: "var(--red)", color: "#fff",
            borderRadius: 999, minWidth: 16, height: 16, fontSize: 10, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px",
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export default function ChildHome({ familyId, childId, uid, isParent, onBack }) {
  const { lang, setLang, t, dir } = useLang();
  const [profile, setProfile] = useState(undefined);
  const [settings, setSettings] = useState(undefined);
  const [entries, setEntries] = useState(undefined);
  const [claims, setClaims] = useState(undefined);
  const [activeTab, setActiveTab] = useState("bonus");
  const [busyId, setBusyId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const prevEntriesRef = useRef(null);
  const [lastSeenMs, setLastSeenMs] = useState(0);

  useEffect(() => {
    try {
      setLastSeenMs(Number(localStorage.getItem(`kidmission_lastSeen_${childId}`)) || 0);
    } catch {
      setLastSeenMs(0);
    }
  }, [childId]);

  function markSeen() {
    const now = Date.now();
    try { localStorage.setItem(`kidmission_lastSeen_${childId}`, String(now)); } catch {}
    setLastSeenMs(now);
  }

  useEffect(() => watchChildProfile(familyId, childId, setProfile), [familyId, childId]);
  useEffect(() => {
    let unsub;
    watchSettings(familyId, childId, setSettings).then((u) => { unsub = u; });
    return () => unsub && unsub();
  }, [familyId, childId]);
  useEffect(() => watchEntries(familyId, childId, setEntries), [familyId, childId]);
  useEffect(() => watchRewardClaims(familyId, childId, setClaims), [familyId, childId]);

  // Détecte, côté enfant, toute entrée confirmée qui vient d'apparaître ou d'être
  // validée SANS que ce soit Shyrel elle-même qui l'ait déclenchée (donc ajoutée
  // directement par Maman, ou sa propre demande qui vient d'être validée) — et
  // rejoue l'animation correspondante (bonus/malus/joker) si l'app est ouverte.
  useEffect(() => {
    if (!entries) return;
    if (isParent) { prevEntriesRef.current = entries; return; }
    const prev = prevEntriesRef.current;
    if (prev) {
      const prevStatus = new Map(prev.map((e) => [e.id, e.status]));
      const newlyVisible = entries.find((e) => {
        if (e.status !== "confirmed") return false;
        if (e.createdBy === uid) return false; // déjà vue au moment de sa propre déclaration
        const before = prevStatus.get(e.id);
        return before === undefined || before === "pending";
      });
      if (newlyVisible) {
        const type = feedbackTypeForCat(newlyVisible.cat);
        const line = `${newlyVisible.amt > 0 ? "+" : ""}${newlyVisible.amt} ${newlyVisible.unit || ""}`;
        setFeedback({ type, line });
      }
    }
    prevEntriesRef.current = entries;
  }, [entries, isParent, uid]);

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
      const unit = unitFor(item, profile.currencyUnit);
      const signedAmt = signFor(item.cat) * item.val;
      await addEntry(familyId, childId, {
        itemId: item.id, he: item.he, fr: item.fr,
        amt: signedAmt, unit, cat: item.cat, createdBy: uid, isParent,
      });
      const line = `${signedAmt > 0 ? "+" : ""}${signedAmt} ${unit}`;
      if (item.cat === "malus") setFeedback({ type: "malus", line });
      else if (item.cat === "jokerEarn") setFeedback({ type: "jokerEarn", line: `+${item.val} 🃏` });
      else if (item.cat === "jokerUse") setFeedback({ type: "jokerUse", line: `-${item.val} 🃏` });
      else setFeedback({ type: "bonus", line });
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
      setFeedback({ type: "reward", line: null });
    } finally {
      setBusyId(null);
    }
  }

  async function handleCancelEntry(entryId) {
    const msg = CANCEL_CONFIRM[lang] || CANCEL_CONFIRM.fr;
    if (!window.confirm(msg)) return;
    setBusyId(entryId);
    try {
      await cancelEntry(familyId, childId, entryId, uid);
    } finally {
      setBusyId(null);
    }
  }

  // Le solde ne compte que les entrées "confirmed" — une entrée "cancelled"
  // en sort automatiquement, pas besoin de logique supplémentaire ici.
  const confirmedEntries = entries.filter((e) => e.status === "confirmed");
  const moneyBalance = Math.max(0, confirmedEntries.filter((e) => e.unit === profile.currencyUnit).reduce((s, e) => s + e.amt, 0));
  const jokerBalance = Math.max(0, confirmedEntries.filter((e) => e.unit === "🃏").reduce((s, e) => s + e.amt, 0));
  const streak = computeStreak(confirmedEntries);
  const pendingCount = isParent
    ? entries.filter((e) => e.status === "pending").length + claims.filter((c) => c.status === "pending").length
    : 0;
  const unseenCount = !isParent
    ? entries.filter(
        (e) => e.status === "confirmed" && e.createdBy !== uid && (e.createdAt?.toMillis?.() || 0) > lastSeenMs
      ).length
    : 0;
  const envelopeCount = isParent ? pendingCount : unseenCount;

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
      <style>{ANIM_STYLES}</style>
      <FeedbackOverlay feedback={feedback} lang={lang} onDone={() => setFeedback(null)} />

      <div style={{ background: "var(--pink-header)", color: "#fff", padding: "calc(20px + env(safe-area-inset-top)) 20px 18px", borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          {onBack ? (
            <button onClick={onBack} style={{ background: "none", border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 8 }}>
              {t("back")}
            </button>
          ) : <span />}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <EnvelopeButton
              count={envelopeCount}
              onClick={() => {
                setActiveTab("requests");
                if (!isParent) markSeen();
              }}
            />
            <LanguageSwitcher lang={lang} setLang={setLang} />
          </div>
        </div>
        <h1 className="disp" style={{ fontSize: 22, margin: "0 0 10px" }}>🧒 {profile.displayName}</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <span style={{ background: "rgba(255,255,255,0.18)", borderRadius: 999, padding: "6px 12px", fontSize: 13, fontWeight: 700 }} className="mono">
            <AnimatedNumber value={moneyBalance} /> {profile.currencyUnit}
          </span>
          <span style={{ background: "rgba(255,255,255,0.18)", borderRadius: 999, padding: "6px 12px", fontSize: 13, fontWeight: 700 }} className="mono">
            🃏 <AnimatedNumber value={jokerBalance} />
          </span>
        </div>
        <div>
          <StreakBadge streak={streak} lang={lang} />
        </div>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                if (tab.key === "requests" && !isParent) markSeen();
              }}
              style={{
                flex: "0 0 auto", padding: "8px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                border: activeTab === tab.key ? "2px solid var(--pink-header)" : "1px solid var(--pink-input-border)",
                background: activeTab === tab.key ? "rgba(214,49,124,0.08)" : "var(--pink-card)",
                color: "var(--text-main)",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {tab.label}
              {tab.key === "requests" && pendingCount > 0 && (
                <span style={{ background: "var(--red)", color: "#fff", borderRadius: 999, padding: "1px 6px", fontSize: 11, fontWeight: 700 }}>
                  {pendingCount}
                </span>
              )}
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
            list={requestList} isParent={isParent} lang={lang} t={t} busyId={busyId}
            onApproveEntry={(id) => approveEntry(familyId, childId, id)}
            onRejectEntry={(id) => rejectOrDeleteEntry(familyId, childId, id)}
            onApproveClaim={(id) => approveRewardClaim(familyId, childId, id)}
            onRejectClaim={(id) => rejectRewardClaim(familyId, childId, id)}
            onCancelEntry={handleCancelEntry}
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

function RequestRow({ req, isParent, lang, t, busyId, onApproveEntry, onRejectEntry, onApproveClaim, onRejectClaim, onCancelEntry }) {
  const label = useItemLabel(req, lang);
  const isPending = req.status === "pending";
  const isCancelled = req.status === "cancelled";
  const isPositive = req.kind === "claim" ? true : req.amt >= 0;
  const canCancel = isParent && req.kind === "entry" && req.status === "confirmed";

  let statusLabel;
  let statusColor;
  if (isCancelled) {
    statusLabel = CANCELLED_LABEL[lang] || CANCELLED_LABEL.fr;
    statusColor = "var(--red)";
  } else if (isPending) {
    statusLabel = t("pending");
    statusColor = "var(--text-muted)";
  } else {
    statusLabel = t("confirmed");
    statusColor = "var(--green)";
  }

  return (
    <div style={{ background: "var(--pink-card)", border: "1px solid var(--pink-border)", borderRadius: 12, padding: "12px 14px", opacity: isCancelled ? 0.6 : 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, textDecoration: isCancelled ? "line-through" : "none" }}>{label}</div>
          <div style={{ fontSize: 11.5, color: "var(--text-faint)", marginTop: 2 }}>{formatDate(req.createdAt, lang)}</div>
        </div>
        <span
          className="mono"
          style={{ fontSize: 13.5, fontWeight: 700, color: isCancelled ? "var(--text-faint)" : isPositive ? "var(--green)" : "var(--red)", flex: "0 0 auto" }}
        >
          {req.kind === "claim" ? `≥ ${req.threshold}` : `${req.amt > 0 ? "+" : ""}${req.amt}`} {req.unit || ""}
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: statusColor }}>
          {statusLabel}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          {isParent && isPending && (
            <>
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
            </>
          )}
          {canCancel && (
            <button
              onClick={() => onCancelEntry(req.id)}
              disabled={busyId === req.id}
              style={{ background: "none", color: "var(--red)", border: "1px solid var(--red)", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              {busyId === req.id ? "…" : (CANCEL_BUTTON_LABEL[lang] || CANCEL_BUTTON_LABEL.fr)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function RequestList({ list, isParent, lang, t, busyId, onApproveEntry, onRejectEntry, onApproveClaim, onRejectClaim, onCancelEntry }) {
  if (list.length === 0) {
    return <p style={{ color: "var(--text-faint)", textAlign: "center", padding: 20, fontSize: 14 }}>{t("noRequests")}</p>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {list.map((req) => (
        <RequestRow
          key={req.id} req={req} isParent={isParent} lang={lang} t={t} busyId={busyId}
          onApproveEntry={onApproveEntry} onRejectEntry={onRejectEntry}
          onApproveClaim={onApproveClaim} onRejectClaim={onRejectClaim}
          onCancelEntry={onCancelEntry}
        />
      ))}
    </div>
  );
}

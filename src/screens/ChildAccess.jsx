import { useEffect, useState } from "react";
import { watchChildProfile, watchMembersForChild } from "../services/firestore.js";
import { resetChildCode, getCachedFamilyId } from "../services/auth.js";
import { translateFirebaseError } from "./SignupParent.jsx";
import { useLang, LanguageSwitcher } from "../i18n.jsx";

const LOCALES = { fr: "fr-FR", he: "he-IL", en: "en-GB", ru: "ru-RU" };

function formatDate(ts, lang) {
  if (!ts?.toDate) return "…";
  return ts.toDate().toLocaleDateString(LOCALES[lang] || "fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function ChildAccess({ familyId, childId, onBack }) {
  const { lang, setLang, t, dir } = useLang();
  const [profile, setProfile] = useState(undefined);
  const [members, setMembers] = useState(undefined);
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => watchChildProfile(familyId, childId, setProfile), [familyId, childId]);
  useEffect(() => watchMembersForChild(familyId, childId, setMembers), [familyId, childId]);

  useEffect(() => {
    const current = members?.find((m) => !m.revoked);
    if (current && !username) setUsername(current.username || "");
  }, [members]); // eslint-disable-line react-hooks/exhaustive-deps

  if (profile === undefined || members === undefined) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--pink-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--text-faint)" }}>{t("loading")}</p>
      </div>
    );
  }

  const currentMember = members.find((m) => !m.revoked) || null;
  const history = [...members].sort((a, b) => (b.joinedAt?.toMillis?.() || 0) - (a.joinedAt?.toMillis?.() || 0));

  async function handleReset(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!username.trim() || code.length !== 6) {
      setError(t("usernameCodeRequired"));
      return;
    }
    setSaving(true);
    try {
      await resetChildCode({
        familyId, childId, oldUid: currentMember?.uid || null,
        username: username.trim(), newCode: code,
      });
      setSuccess(t("resetSuccessMsg", { familyId: familyId || getCachedFamilyId(), username: username.trim(), code }));
      setCode("");
    } catch (err) {
      setError(translateFirebaseError(err, lang));
    } finally {
      setSaving(false);
    }
  }

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
          {t("accessFor", { name: profile?.displayName })}
        </h1>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        {currentMember && (
          <div style={{ background: "var(--pink-card)", border: "1px solid var(--pink-border)", borderRadius: 14, padding: "14px 16px", marginBottom: 16 }}>
            <p style={{ fontSize: 12.5, color: "var(--text-faint)", margin: "0 0 4px" }}>{t("currentUsername")}</p>
            <p className="mono" style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{currentMember.username}</p>
          </div>
        )}

        <h3 className="disp" style={{ fontSize: 16, margin: "0 0 10px" }}>{t("resetCodeTitle")}</h3>
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 14 }}>
          {t("resetCodeDesc", { name: profile?.displayName })}
        </p>
        {error && <div className="error-banner">{error}</div>}
        {success && <div className="error-banner" style={{ background: "rgba(92,140,90,0.1)", color: "var(--green)" }}>{success}</div>}
        <form onSubmit={handleReset}>
          <div className="field">
            <label>{t("usernameFieldSimple")}</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoCapitalize="none" />
          </div>
          <div className="field">
            <label>{t("newCodeLabel")}</label>
            <input
              inputMode="numeric" value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
              style={{ letterSpacing: 6, textAlign: "center", fontSize: 20, fontFamily: "var(--font-mono)" }}
            />
          </div>
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? "…" : t("resetCodeTitle")}
          </button>
        </form>

        <h3 className="disp" style={{ fontSize: 16, margin: "26px 0 10px" }}>{t("accessHistoryTitle")}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {history.map((m) => (
            <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--pink-card)", border: "1px solid var(--pink-border)", borderRadius: 12, padding: "12px 14px" }}>
              <div>
                <div className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{m.username}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-faint)" }}>{t("createdOn", { date: formatDate(m.joinedAt, lang) })}</div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: m.revoked ? "var(--text-faint)" : "var(--green)" }}>
                {m.revoked ? t("revokedLabel") : t("activeLabel")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

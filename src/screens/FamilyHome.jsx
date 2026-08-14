import { useEffect, useState } from "react";
import { watchAllChildren, createChildProfile } from "../services/firestore.js";
import { createChildLogin, logout } from "../services/auth.js";
import { translateFirebaseError } from "./SignupParent.jsx";
import { useLang, LanguageSwitcher } from "../i18n.js";

export default function FamilyHome({ familyId, onOpenChild, onOpenSettings, onOpenPayments, onOpenAccess }) {
  const { lang, setLang, t, dir } = useLang();
  const [children, setChildren] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const CURRENCY_OPTIONS = [
    { type: "money", unit: "₪", label: t("currencyMoney") },
    { type: "screentime", unit: "min", label: t("currencyScreentime") },
    { type: "points", unit: "pts", label: t("currencyPoints") },
  ];

  useEffect(() => watchAllChildren(familyId, setChildren), [familyId]);

  return (
    <div dir={dir} style={{ minHeight: "100vh", background: "var(--pink-bg)", paddingBottom: 40 }}>
      <div style={{ background: "var(--pink-header)", color: "#fff", padding: "calc(20px + env(safe-area-inset-top)) 20px 22px", borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
          <LanguageSwitcher lang={lang} setLang={setLang} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 className="disp" style={{ fontSize: 24, margin: 0 }}>{t("myChildren")}</h1>
          <button onClick={logout} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 999, padding: "8px 14px", fontSize: 12.5, cursor: "pointer" }}>
            {t("logout")}
          </button>
        </div>
      </div>

      <div style={{ padding: "18px 16px" }}>
        {children === null && <p style={{ color: "var(--text-faint)" }}>{t("loading")}</p>}
        {children !== null && children.length === 0 && (
          <p style={{ color: "var(--text-faint)", textAlign: "center", padding: 20 }}>
            {t("noChildren")}
          </p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(children || []).map((c) => (
            <div
              key={c.id}
              style={{ display: "flex", alignItems: "center", gap: 4, width: "100%", background: "var(--pink-card)", border: "1px solid var(--pink-border)", borderRadius: 14, padding: "14px 16px" }}
            >
              <button
                onClick={() => onOpenChild(c.id)}
                style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left", background: "none", border: "none", padding: 0, cursor: "pointer" }}
              >
                <span style={{ fontSize: 15, fontWeight: 600 }}>🧒 {c.displayName}</span>
                <span style={{ fontSize: 12, color: "var(--text-faint)" }}>
                  {CURRENCY_OPTIONS.find((o) => o.type === c.currencyType)?.label}
                </span>
              </button>
              <button
                onClick={() => onOpenAccess(c.id)}
                title="Accès"
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: "0 0 0 6px", flex: "0 0 auto" }}
              >
                🔑
              </button>
              <button
                onClick={() => onOpenPayments(c.id)}
                title="Versements"
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: "0 0 0 6px", flex: "0 0 auto" }}
              >
                💳
              </button>
              <button
                onClick={() => onOpenSettings(c.id)}
                title="Réglages"
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: "0 0 0 6px", flex: "0 0 auto" }}
              >
                ⚙️
              </button>
            </div>
          ))}
        </div>

        <button className="btn-primary" style={{ marginTop: 18 }} onClick={() => setShowAdd(true)}>
          {t("addChild")}
        </button>
      </div>

      {showAdd && (
        <AddChildModal familyId={familyId} onClose={() => setShowAdd(false)} t={t} currencyOptions={CURRENCY_OPTIONS} />
      )}
    </div>
  );
}

function AddChildModal({ familyId, onClose, t, currencyOptions }) {
  const [step, setStep] = useState("profile"); // "profile" | "login" | "done"
  const [displayName, setDisplayName] = useState("");
  const [currency, setCurrency] = useState(currencyOptions[0]);
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [childId, setChildId] = useState(null);

  async function handleCreateProfile(e) {
    e.preventDefault();
    if (!displayName.trim()) { setError(t("giveFirstName")); return; }
    setError(null);
    setLoading(true);
    try {
      const newChildId = `child-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      await createChildProfile(familyId, newChildId, {
        displayName: displayName.trim(), currencyType: currency.type, currencyUnit: currency.unit,
      });
      setChildId(newChildId);
      setUsername(displayName.trim().toLowerCase().replace(/[^a-z0-9]/g, ""));
      setStep("login");
    } catch (err) {
      setError(translateFirebaseError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateLogin(e) {
    e.preventDefault();
    if (!username.trim() || code.length !== 6) { setError(t("usernameCodeRequired")); return; }
    setError(null);
    setLoading(true);
    try {
      await createChildLogin({ familyId, childId, username: username.trim(), code });
      setStep("done");
    } catch (err) {
      setError(translateFirebaseError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(91,32,58,0.55)", display: "flex", alignItems: "flex-end", zIndex: 60 }} onClick={onClose}>
      <div style={{ background: "var(--pink-card)", width: "100%", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "22px 20px calc(22px + env(safe-area-inset-bottom))" }} onClick={(e) => e.stopPropagation()}>
        {error && <div className="error-banner">{error}</div>}

        {step === "profile" && (
          <form onSubmit={handleCreateProfile}>
            <h3 className="disp" style={{ margin: "0 0 14px" }}>{t("newChildProfile")}</h3>
            <div className="field">
              <label>{t("firstName")}</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Shyrel" />
            </div>
            <div className="field">
              <label>{t("rewardType")}</label>
              <div style={{ display: "flex", gap: 8 }}>
                {currencyOptions.map((opt) => (
                  <button
                    type="button" key={opt.type} onClick={() => setCurrency(opt)}
                    style={{
                      flex: 1, padding: "10px 6px", borderRadius: 10, fontSize: 12, cursor: "pointer",
                      border: currency.type === opt.type ? "2px solid var(--pink-header)" : "1px solid var(--pink-input-border)",
                      background: currency.type === opt.type ? "rgba(214,49,124,0.08)" : "transparent",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>{loading ? "…" : t("continueLabel")}</button>
          </form>
        )}

        {step === "login" && (
          <form onSubmit={handleCreateLogin}>
            <h3 className="disp" style={{ margin: "0 0 14px" }}>{t("loginFor", { name: displayName })}</h3>
            <div className="field">
              <label>{t("usernameLabel", { name: displayName })}</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} autoCapitalize="none" />
            </div>
            <div className="field">
              <label>{t("codeLabel")}</label>
              <input
                inputMode="numeric" value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                style={{ letterSpacing: 6, textAlign: "center", fontSize: 20, fontFamily: "var(--font-mono)" }}
              />
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>{loading ? "…" : t("createAccess")}</button>
          </form>
        )}

        {step === "done" && (
          <div style={{ textAlign: "center" }}>
            <h3 className="disp" style={{ margin: "0 0 10px" }}>✅ {t("childReady", { name: displayName })}</h3>
            <p style={{ fontSize: 13.5, color: "var(--text-muted)", marginBottom: 18 }}>
              {t("childReadyDetail", { familyId, username, code })}
            </p>
            <button className="btn-primary" onClick={onClose}>{t("done")}</button>
          </div>
        )}
      </div>
    </div>
  );
}

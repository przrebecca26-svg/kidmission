import { useState } from "react";
import { loginChild, getCachedFamilyId } from "../services/auth.js";
import { translateFirebaseError } from "./SignupParent.jsx";
import { useLang, LanguageSwitcher } from "../i18n.jsx";

export default function ChildLogin({ onBack, onLoggedIn }) {
  const { lang, setLang, t, dir } = useLang();
  const cachedFamilyId = getCachedFamilyId();
  const [familyId, setFamilyId] = useState(cachedFamilyId || "");
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!familyId.trim() || !username.trim() || code.length !== 6) {
      setError(t("checkAllFilled"));
      return;
    }
    setLoading(true);
    try {
      await loginChild({ familyId: familyId.trim(), username: username.trim(), code });
      onLoggedIn();
    } catch (err) {
      setError(translateFirebaseError(err, lang));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div dir={dir} className="auth-screen">
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
        <LanguageSwitcher lang={lang} setLang={setLang} />
      </div>
      <div className="auth-card">
        <h2 className="disp auth-title">{t("isThisYou")}</h2>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          {/* Toujours affiché (et modifiable), même si une valeur est déjà en cache
              sur cet appareil — sinon impossible de se connecter à une AUTRE famille
              que celle mémorisée en dernier sur ce téléphone (ex: tester plusieurs
              comptes enfants de familles différentes sur le même appareil). */}
          <div className="field">
            <label>{t("familyCodeLabel")}</label>
            <input value={familyId} onChange={(e) => setFamilyId(e.target.value)} placeholder="famille-perez" />
          </div>
          <div className="field">
            <label>{t("yourUsername")}</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="shyrel" autoCapitalize="none" />
          </div>
          <div className="field">
            <label>{t("yourCode")}</label>
            <input
              inputMode="numeric" type="password" value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
              style={{ letterSpacing: 6, textAlign: "center", fontSize: 20, fontFamily: "var(--font-mono)" }}
            />
          </div>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? t("connecting") : t("letsGo")}
          </button>
        </form>
        <button className="link-btn" onClick={onBack}>{t("back")}</button>
      </div>
    </div>
  );
}

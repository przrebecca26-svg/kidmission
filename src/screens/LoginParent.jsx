import { useState } from "react";
import { loginParent, requestPasswordReset } from "../services/auth.js";
import { translateFirebaseError } from "./SignupParent.jsx";
import { useLang, LanguageSwitcher } from "../i18n.jsx";

export default function LoginParent({ onBack, onLoggedIn, onGoSignup }) {
  const { lang, setLang, t, dir } = useLang();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginParent({ email: email.trim(), password });
      onLoggedIn();
    } catch (err) {
      setError(translateFirebaseError(err, lang));
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    if (!email.trim()) { setError(t("enterEmailFirst")); return; }
    try {
      await requestPasswordReset(email.trim());
      setResetSent(true);
    } catch (err) {
      setError(translateFirebaseError(err, lang));
    }
  }

  return (
    <div dir={dir} className="auth-screen">
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
        <LanguageSwitcher lang={lang} setLang={setLang} />
      </div>
      <div className="auth-card">
        <h2 className="disp auth-title">{t("welcomeBack")}</h2>
        {error && <div className="error-banner" style={{ wordBreak: "break-word" }}>{error}</div>}
        {resetSent && <div className="error-banner" style={{ background: "rgba(92,140,90,0.1)", color: "var(--green)" }}>{t("resetEmailSent")}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>{t("emailLabel")}</label>
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>{t("passwordFieldLabel")}</label>
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? t("connecting") : t("signIn")}
          </button>
        </form>
        <button className="link-btn" onClick={handleReset}>{t("forgotPassword")}</button>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <button className="link-btn" onClick={onBack}>{t("back")}</button>
          <button className="link-btn" onClick={onGoSignup}>{t("createAccountLink")}</button>
        </div>
      </div>
    </div>
  );
}

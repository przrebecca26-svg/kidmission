import { useState } from "react";
import { loginParent, requestPasswordReset } from "../services/auth.js";
import { translateFirebaseError } from "./SignupParent.jsx";

export default function LoginParent({ onBack, onLoggedIn, onGoSignup }) {
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
      setError(`[${err.code || "no-code"}] ${err.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    if (!email.trim()) { setError("Entre ton email d'abord."); return; }
    try {
      await requestPasswordReset(email.trim());
      setResetSent(true);
    } catch (err) {
      setError(translateFirebaseError(err));
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h2 className="disp auth-title">Bon retour 👩</h2>
        {error && <div className="error-banner" style={{ wordBreak: "break-word", fontFamily: "var(--font-mono)", fontSize: 11.5 }}>{error}</div>}
        {resetSent && <div className="error-banner" style={{ background: "rgba(92,140,90,0.1)", color: "var(--green)" }}>Email envoyé — vérifie ta boîte mail.</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>Mot de passe</label>
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>
        <button className="link-btn" onClick={handleReset}>Mot de passe oublié ?</button>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <button className="link-btn" onClick={onBack}>← Retour</button>
          <button className="link-btn" onClick={onGoSignup}>Créer un compte</button>
        </div>
      </div>
    </div>
  );
}

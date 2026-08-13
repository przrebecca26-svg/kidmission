import { useState } from "react";
import { loginChild, getCachedFamilyId } from "../services/auth.js";
import { translateFirebaseError } from "./SignupParent.jsx";

export default function ChildLogin({ onBack, onLoggedIn }) {
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
      setError("Vérifie que tout est bien rempli (le code fait 6 chiffres).");
      return;
    }
    setLoading(true);
    try {
      await loginChild({ familyId: familyId.trim(), username: username.trim(), code });
      onLoggedIn();
    } catch (err) {
      setError(translateFirebaseError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h2 className="disp auth-title">🧒 C'est toi ?</h2>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          {!cachedFamilyId && (
            <div className="field">
              <label>Code famille (donné par Maman)</label>
              <input value={familyId} onChange={(e) => setFamilyId(e.target.value)} placeholder="famille-perez" />
            </div>
          )}
          <div className="field">
            <label>Ton identifiant</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="shyrel" autoCapitalize="none" />
          </div>
          <div className="field">
            <label>Ton code (6 chiffres)</label>
            <input
              inputMode="numeric" type="password" value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
              style={{ letterSpacing: 6, textAlign: "center", fontSize: 20, fontFamily: "var(--font-mono)" }}
            />
          </div>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Connexion…" : "C'est parti !"}
          </button>
        </form>
        <button className="link-btn" onClick={onBack}>← Retour</button>
      </div>
    </div>
  );
}

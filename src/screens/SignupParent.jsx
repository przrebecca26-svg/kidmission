import { useState } from "react";
import { signUpParent } from "../services/auth.js";

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function SignupParent({ onBack, onSignedUp }) {
  const [displayName, setDisplayName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!displayName.trim() || !familyName.trim() || !email.trim() || password.length < 6) {
      setError("Remplis tous les champs (le mot de passe doit faire au moins 6 caractères).");
      return;
    }
    const familyId = slugify(familyName) || `famille-${Date.now()}`;
    setLoading(true);
    try {
      await signUpParent({ email: email.trim(), password, displayName: displayName.trim(), familyId });
      onSignedUp(familyId);
    } catch (err) {
      setError(translateFirebaseError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h2 className="disp auth-title">Créer ton compte</h2>
        <p className="auth-subtitle">Ton espace Maman, à toi seule.</p>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Ton prénom</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Rebecca" />
          </div>
          <div className="field">
            <label>Nom de famille (pour identifier votre espace)</label>
            <input value={familyName} onChange={(e) => setFamilyName(e.target.value)} placeholder="Famille Perez" />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="toi@exemple.com" />
          </div>
          <div className="field">
            <label>Mot de passe (6 caractères minimum)</label>
            <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Création…" : "Créer mon compte"}
          </button>
        </form>
        <button className="link-btn" onClick={onBack}>← Retour</button>
      </div>
    </div>
  );
}

export function translateFirebaseError(err) {
  const code = err?.code || "";
  if (code.includes("email-already-in-use")) return "Cet email est déjà utilisé.";
  if (code.includes("invalid-email")) return "Adresse email invalide.";
  if (code.includes("weak-password")) return "Mot de passe trop faible (6 caractères minimum).";
  if (code.includes("wrong-password") || code.includes("invalid-credential")) return "Email ou mot de passe incorrect.";
  if (code.includes("user-not-found")) return "Aucun compte avec cet email.";
  if (code.includes("network-request-failed")) return "Problème de connexion internet.";
  return "Une erreur est survenue. Réessaie.";
}

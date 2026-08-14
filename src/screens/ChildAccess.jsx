import { useEffect, useState } from "react";
import { watchChildProfile, watchMembersForChild } from "../services/firestore.js";
import { resetChildCode, getCachedFamilyId } from "../services/auth.js";
import { translateFirebaseError } from "./SignupParent.jsx";

function formatDate(ts) {
  if (!ts?.toDate) return "…";
  return ts.toDate().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * Parent-only screen: reset a child's 6-digit login code (e.g. forgotten code, new
 * phone) without losing any history — resetChildCode creates a fresh login tied to
 * the same childId and revokes the old one. Also shows past logins for transparency.
 */
export default function ChildAccess({ familyId, childId, onBack }) {
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
        <p style={{ color: "var(--text-faint)" }}>Chargement…</p>
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
      setError("Identifiant + code à 6 chiffres requis.");
      return;
    }
    setSaving(true);
    try {
      await resetChildCode({
        familyId, childId, oldUid: currentMember?.uid || null,
        username: username.trim(), newCode: code,
      });
      setSuccess(`Nouveau code créé. Sur son téléphone : code famille ${familyId || getCachedFamilyId()}, identifiant ${username.trim()}, code ${code}.`);
      setCode("");
    } catch (err) {
      setError(translateFirebaseError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--pink-bg)", paddingBottom: 40 }}>
      <div style={{ background: "var(--pink-header)", color: "#fff", padding: "calc(20px + env(safe-area-inset-top)) 20px 18px", borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 8 }}>
          ← Retour
        </button>
        <h1 className="disp" style={{ fontSize: 22, margin: 0 }}>
          Accès — {profile?.displayName}
        </h1>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        {currentMember && (
          <div style={{ background: "var(--pink-card)", border: "1px solid var(--pink-border)", borderRadius: 14, padding: "14px 16px", marginBottom: 16 }}>
            <p style={{ fontSize: 12.5, color: "var(--text-faint)", margin: "0 0 4px" }}>Identifiant actuel</p>
            <p className="mono" style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{currentMember.username}</p>
          </div>
        )}

        <h3 className="disp" style={{ fontSize: 16, margin: "0 0 10px" }}>Réinitialiser le code</h3>
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 14 }}>
          Utile si {profile?.displayName} a oublié son code, ou pour se connecter depuis un nouveau téléphone. L'ancien accès sera révoqué — mais tout l'historique (missions, jokers, versements) reste intact.
        </p>
        {error && <div className="error-banner">{error}</div>}
        {success && <div className="error-banner" style={{ background: "rgba(92,140,90,0.1)", color: "var(--green)" }}>{success}</div>}
        <form onSubmit={handleReset}>
          <div className="field">
            <label>Identifiant</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoCapitalize="none" />
          </div>
          <div className="field">
            <label>Nouveau code à 6 chiffres</label>
            <input
              inputMode="numeric" value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
              style={{ letterSpacing: 6, textAlign: "center", fontSize: 20, fontFamily: "var(--font-mono)" }}
            />
          </div>
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? "…" : "Réinitialiser le code"}
          </button>
        </form>

        <h3 className="disp" style={{ fontSize: 16, margin: "26px 0 10px" }}>Historique des accès</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {history.map((m) => (
            <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--pink-card)", border: "1px solid var(--pink-border)", borderRadius: 12, padding: "12px 14px" }}>
              <div>
                <div className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{m.username}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-faint)" }}>Créé le {formatDate(m.joinedAt)}</div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: m.revoked ? "var(--text-faint)" : "var(--green)" }}>
                {m.revoked ? "🚫 Révoqué" : "✅ Actif"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

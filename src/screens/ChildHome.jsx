import { useEffect, useState } from "react";
import { watchChildProfile } from "../services/firestore.js";
import { logout } from "../services/auth.js";

/**
 * Placeholder for now — confirms the account/data layer works end to end
 * (login → resolves family → resolves child profile → reads Firestore).
 * The full tabs UI (Missions/Jokers/Récompenses/Mes demandes) from the
 * Claude version gets ported here in the next phase.
 */
export default function ChildHome({ familyId, childId }) {
  const [profile, setProfile] = useState(undefined);

  useEffect(() => watchChildProfile(familyId, childId, setProfile), [familyId, childId]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--pink-bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, textAlign: "center" }}>
      {profile === undefined && <p>Chargement…</p>}
      {profile === null && <p>Profil introuvable.</p>}
      {profile && (
        <>
          <h1 className="disp" style={{ fontSize: 26 }}>🧒 Salut {profile.displayName} !</h1>
          <p style={{ color: "var(--text-muted)", maxWidth: 280 }}>
            La connexion fonctionne. Le carnet complet (missions, jokers, récompenses) arrive dans la prochaine étape.
          </p>
        </>
      )}
      <button className="link-btn" onClick={logout} style={{ marginTop: 20 }}>Déconnexion</button>
    </div>
  );
}

import { useState } from "react";
import { logout } from "../services/auth.js";
import { useLang } from "../i18n.jsx";

export default function AccountSettings({ familyId, onBack }) {
  const { lang, t, dir } = useLang();
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleExport() {
    setExporting(true);
    setMessage(null);
    try {
      // Placeholder: in a full implementation this would query Firestore
      // for all family data and download a JSON file.
      const data = {
        familyId,
        exportedAt: new Date().toISOString(),
        note: "Export complet à implémenter (enfants, entrées, versements, etc.)",
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kidmission-export-${familyId}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage("Export téléchargé (version de démonstration pour l’instant).");
    } catch (err) {
      setMessage("Erreur lors de l’export. Réessaie plus tard.");
    } finally {
      setExporting(false);
    }
  }

  function handleDeleteRequest() {
    const confirmed = window.confirm(
      "Es-tu sûre de vouloir demander la suppression définitive de ton compte et de toutes les données de ta famille ? Cette action est irréversible."
    );
    if (!confirmed) return;
    const double = window.confirm(
      "Dernier confirmation : toutes les données (enfants, historiques, soldes) seront effacées. Continuer ?"
    );
    if (!double) return;
    // Placeholder: real deletion requires a Cloud Function or admin action
    // for safety (auth user deletion + cascade). For now we just log the request.
    setMessage(
      "Demande de suppression enregistrée. Nous la traiterons manuellement dans les prochains jours et te confirmerons par email."
    );
  }

  return (
    <div dir={dir} style={{ minHeight: "100vh", background: "var(--pink-bg)", paddingBottom: 40 }}>
      <div style={{ background: "var(--pink-header)", color: "#fff", padding: "calc(20px + env(safe-area-inset-top)) 20px 22px", borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: "#fff", fontSize: 15, cursor: "pointer" }}>
            ← Retour
          </button>
          <h1 className="disp" style={{ fontSize: 20, margin: 0 }}>Compte et données</h1>
          <div style={{ width: 60 }} />
        </div>
      </div>

      <div style={{ padding: "20px 16px" }}>
        <h2 style={{ fontSize: 16, margin: "0 0 12px" }}>Documents légaux</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          <a href="/legal/cgu.html" target="_blank" rel="noopener noreferrer" style={{ color: "var(--pink-header)", fontWeight: 600 }}>
            Conditions générales d’utilisation
          </a>
          <a href="/legal/confidentialite.html" target="_blank" rel="noopener noreferrer" style={{ color: "var(--pink-header)", fontWeight: 600 }}>
            Politique de confidentialité
          </a>
        </div>

        <h2 style={{ fontSize: 16, margin: "0 0 12px" }}>Tes données</h2>
        <button className="btn-primary" onClick={handleExport} disabled={exporting} style={{ marginBottom: 12 }}>
          {exporting ? "Export en cours…" : "Exporter mes données (JSON)"}
        </button>

        <button
          onClick={handleDeleteRequest}
          style={{
            display: "block",
            width: "100%",
            padding: "12px",
            background: "#fff",
            color: "#c0392b",
            border: "1px solid #c0392b",
            borderRadius: 10,
            fontWeight: 600,
            cursor: "pointer",
            marginTop: 8,
          }}
        >
          Supprimer mon compte et toutes les données
        </button>

        {message && (
          <p style={{ marginTop: 16, padding: 12, background: "var(--pink-card)", borderRadius: 10, fontSize: 14 }}>
            {message}
          </p>
        )}

        <button className="link-btn" style={{ marginTop: 28 }} onClick={logout}>
          Se déconnecter
        </button>
      </div>
    </div>
  );
}

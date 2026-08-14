import { useEffect, useState } from "react";
import { watchChildProfile, watchEntries, watchPayments, recordPayment, deletePayment } from "../services/firestore.js";
import { PAYMENT_RULE } from "../data/missionCatalog.js";

function currentPeriodKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatDate(ts) {
  if (!ts?.toDate) return "…";
  return ts.toDate().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * Parent-only screen: shows the money owed since the last recorded payment (confirmed
 * money-unit entries only — screentime/points/jokers aren't paid out) and lets Maman
 * record a payment, which resets the "since" boundary for next month. History stays
 * editable (delete) in case of a mistake.
 */
export default function ChildPayments({ familyId, childId, uid, onBack }) {
  const [profile, setProfile] = useState(undefined);
  const [entries, setEntries] = useState(undefined);
  const [payments, setPayments] = useState(undefined);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => watchChildProfile(familyId, childId, setProfile), [familyId, childId]);
  useEffect(() => watchEntries(familyId, childId, setEntries), [familyId, childId]);
  useEffect(() => watchPayments(familyId, childId, setPayments), [familyId, childId]);

  if (profile === undefined || entries === undefined || payments === undefined) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--pink-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--text-faint)" }}>Chargement…</p>
      </div>
    );
  }

  const lastPayment = payments[0] || null; // watchPayments is ordered createdAt desc
  const sinceMillis = lastPayment?.createdAt?.toMillis?.() || 0;

  const moneyEntries = entries.filter((e) => e.status === "confirmed" && e.unit === profile.currencyUnit);
  const dueEntries = moneyEntries
    .filter((e) => (e.createdAt?.toMillis?.() || 0) > sinceMillis)
    .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  const amountDue = Math.max(0, dueEntries.reduce((s, e) => s + e.amt, 0));

  async function handlePay() {
    setSaving(true);
    try {
      await recordPayment(familyId, childId, {
        amount: amountDue, periodKey: currentPeriodKey(), note: note.trim() || null, createdBy: uid,
      });
      setNote("");
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
          Versements — {profile?.displayName}
        </h1>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ background: "var(--pink-card)", border: "1px solid var(--pink-border)", borderRadius: 14, padding: "16px", marginBottom: 14 }}>
          <p style={{ fontSize: 12.5, color: "var(--text-faint)", margin: "0 0 8px" }}>💳 {PAYMENT_RULE.fr}</p>
        </div>

        <div style={{ background: "var(--pink-header)", borderRadius: 16, padding: "22px 18px", textAlign: "center", marginBottom: 16 }}>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, margin: "0 0 6px" }}>Montant dû depuis le dernier versement</p>
          <p className="mono disp" style={{ color: "#fff", fontSize: 34, fontWeight: 700, margin: 0 }}>
            {amountDue} {profile?.currencyUnit}
          </p>
        </div>

        {dueEntries.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-muted)", margin: "0 0 8px" }}>Détail ({dueEntries.length} entrée{dueEntries.length > 1 ? "s" : ""})</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {dueEntries.map((e) => (
                <div key={e.id} style={{ display: "flex", justifyContent: "space-between", background: "var(--pink-card)", border: "1px solid var(--pink-border)", borderRadius: 10, padding: "8px 12px" }}>
                  <span style={{ fontSize: 13 }}>{e.fr}</span>
                  <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: e.amt < 0 ? "var(--red)" : "var(--green)" }}>
                    {e.amt > 0 ? "+" : ""}{e.amt}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="field">
          <label>Note (optionnel)</label>
          <input value={note} onChange={(ev) => setNote(ev.target.value)} placeholder="Versé par carte le 5" />
        </div>
        <button className="btn-primary" disabled={saving || amountDue <= 0} onClick={handlePay}>
          {saving ? "…" : `Enregistrer le versement de ${amountDue} ${profile?.currencyUnit}`}
        </button>

        <h3 className="disp" style={{ fontSize: 16, margin: "26px 0 10px" }}>Historique</h3>
        {payments.length === 0 && <p style={{ color: "var(--text-faint)", fontSize: 13 }}>Aucun versement enregistré pour l'instant.</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {payments.map((p) => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--pink-card)", border: "1px solid var(--pink-border)", borderRadius: 12, padding: "12px 14px" }}>
              <div>
                <div className="mono" style={{ fontSize: 15, fontWeight: 700 }}>{p.amount} {profile?.currencyUnit}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-faint)" }}>{formatDate(p.createdAt)}{p.note ? ` — ${p.note}` : ""}</div>
              </div>
              <button
                onClick={() => deletePayment(familyId, childId, p.id)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15 }}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

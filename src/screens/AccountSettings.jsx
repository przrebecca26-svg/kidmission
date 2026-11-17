import { useState } from "react";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase.js";
import { logout } from "../services/auth.js";
import { useLang } from "../i18n.jsx";

const CONTACT_EMAIL = "contact.kidmission@gmail.com";

const TXT = {
  fr: {
    back: "← Retour",
    title: "Compte et données",
    legal: "Documents légaux",
    cgu: "Conditions générales d’utilisation",
    privacy: "Politique de confidentialité",
    data: "Tes données",
    exportBtn: "Exporter les données de ma famille (JSON)",
    exporting: "Export en cours…",
    exportOk: "Export téléchargé : profils enfants, réglages, missions, versements et récompenses.",
    exportErr: "Erreur lors de l’export. Vérifie ta connexion et réessaie.",
    deleteTitle: "Suppression du compte",
    deleteInfo: "La suppression efface définitivement le compte parent, les profils enfants et tout l’historique. Elle est traitée par email dans un délai maximum de 30 jours, après vérification que la demande vient bien de toi.",
    deleteBtn: "Demander la suppression de mon compte",
    confirm1: "Demander la suppression définitive de ton compte et de toutes les données de ta famille ?",
    confirm2: "Dernière confirmation : ton application email va s’ouvrir avec la demande prête à envoyer. Continuer ?",
    deleteSent: `Ton application email s’est ouverte. Envoie le message pour confirmer ta demande. Si rien ne s’est ouvert, écris à ${CONTACT_EMAIL} en indiquant ton identifiant famille.`,
    mailSubject: "Demande de suppression de compte KidMission",
    mailBody: (id) => `Bonjour,\n\nJe demande la suppression définitive de mon compte KidMission et de toutes les données de ma famille.\n\nIdentifiant famille : ${id}\n\nMerci.`,
    logout: "Se déconnecter",
  },
  he: {
    back: "→ חזרה",
    title: "חשבון ונתונים",
    legal: "מסמכים משפטיים",
    cgu: "תנאי שימוש",
    privacy: "מדיניות פרטיות",
    data: "הנתונים שלך",
    exportBtn: "ייצוא נתוני המשפחה (JSON)",
    exporting: "מייצא…",
    exportOk: "הייצוא הורד: פרופילי ילדים, הגדרות, משימות, תשלומים ופרסים.",
    exportErr: "שגיאה בייצוא. יש לבדוק את החיבור ולנסות שוב.",
    deleteTitle: "מחיקת החשבון",
    deleteInfo: "המחיקה מוחקת לצמיתות את חשבון ההורה, פרופילי הילדים וכל ההיסטוריה. הבקשה מטופלת בדוא״ל תוך 30 יום לכל היותר, לאחר אימות שהבקשה הגיעה ממך.",
    deleteBtn: "בקשה למחיקת החשבון",
    confirm1: "לבקש מחיקה לצמיתות של החשבון ושל כל נתוני המשפחה?",
    confirm2: "אישור אחרון: אפליקציית הדוא״ל תיפתח עם בקשה מוכנה לשליחה. להמשיך?",
    deleteSent: `אפליקציית הדוא״ל נפתחה. יש לשלוח את ההודעה כדי לאשר את הבקשה. אם לא נפתח דבר, יש לכתוב אל ${CONTACT_EMAIL} ולציין את מזהה המשפחה.`,
    mailSubject: "בקשה למחיקת חשבון KidMission",
    mailBody: (id) => `שלום,\n\nאני מבקש/ת למחוק לצמיתות את חשבון KidMission שלי ואת כל נתוני המשפחה.\n\nמזהה משפחה: ${id}\n\nתודה.`,
    logout: "התנתקות",
  },
  en: {
    back: "← Back",
    title: "Account & data",
    legal: "Legal documents",
    cgu: "Terms of use",
    privacy: "Privacy policy",
    data: "Your data",
    exportBtn: "Export my family’s data (JSON)",
    exporting: "Exporting…",
    exportOk: "Export downloaded: child profiles, settings, missions, payments and rewards.",
    exportErr: "Export failed. Check your connection and try again.",
    deleteTitle: "Account deletion",
    deleteInfo: "Deletion permanently erases the parent account, child profiles and all history. It is handled by email within 30 days at most, after checking that the request really comes from you.",
    deleteBtn: "Request deletion of my account",
    confirm1: "Request permanent deletion of your account and all your family’s data?",
    confirm2: "Final confirmation: your email app will open with the request ready to send. Continue?",
    deleteSent: `Your email app has opened. Send the message to confirm your request. If nothing opened, write to ${CONTACT_EMAIL} with your family ID.`,
    mailSubject: "KidMission account deletion request",
    mailBody: (id) => `Hello,\n\nI request the permanent deletion of my KidMission account and all my family's data.\n\nFamily ID: ${id}\n\nThank you.`,
    logout: "Log out",
  },
  ru: {
    back: "← Назад",
    title: "Аккаунт и данные",
    legal: "Юридические документы",
    cgu: "Условия использования",
    privacy: "Политика конфиденциальности",
    data: "Ваши данные",
    exportBtn: "Экспортировать данные семьи (JSON)",
    exporting: "Экспорт…",
    exportOk: "Экспорт загружен: профили детей, настройки, задания, выплаты и награды.",
    exportErr: "Ошибка экспорта. Проверьте подключение и попробуйте снова.",
    deleteTitle: "Удаление аккаунта",
    deleteInfo: "Удаление навсегда стирает аккаунт родителя, профили детей и всю историю. Запрос обрабатывается по электронной почте не более чем за 30 дней, после проверки, что он исходит от вас.",
    deleteBtn: "Запросить удаление аккаунта",
    confirm1: "Запросить окончательное удаление аккаунта и всех данных семьи?",
    confirm2: "Последнее подтверждение: откроется почтовое приложение с готовым запросом. Продолжить?",
    deleteSent: `Почтовое приложение открыто. Отправьте письмо, чтобы подтвердить запрос. Если ничего не открылось, напишите на ${CONTACT_EMAIL}, указав ID семьи.`,
    mailSubject: "Запрос на удаление аккаунта KidMission",
    mailBody: (id) => `Здравствуйте,\n\nПрошу окончательно удалить мой аккаунт KidMission и все данные моей семьи.\n\nID семьи: ${id}\n\nСпасибо.`,
    logout: "Выйти",
  },
};

// Firestore Timestamps -> ISO strings so the JSON file is readable.
function clean(value) {
  if (value === null || value === undefined) return value;
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(clean);
  if (typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = clean(v);
    return out;
  }
  return value;
}

async function readCollection(path) {
  const snap = await getDocs(collection(db, path));
  return snap.docs.map((d) => ({ id: d.id, ...clean(d.data()) }));
}

async function buildFamilyExport(familyId) {
  const familySnap = await getDoc(doc(db, "families", familyId));
  const members = await readCollection(`families/${familyId}/members`);
  const childrenProfiles = await readCollection(`families/${familyId}/children`);

  const children = [];
  for (const child of childrenProfiles) {
    const base = `families/${familyId}/children/${child.id}`;
    children.push({
      ...child,
      settings: await readCollection(`${base}/settings`),
      entries: await readCollection(`${base}/entries`),
      payments: await readCollection(`${base}/payments`),
      rewardClaims: await readCollection(`${base}/rewardClaims`),
    });
  }

  return {
    exportedAt: new Date().toISOString(),
    familyId,
    family: familySnap.exists() ? clean(familySnap.data()) : null,
    members,
    children,
  };
}

export default function AccountSettings({ familyId, onBack }) {
  const { lang, dir } = useLang();
  const T = TXT[lang] || TXT.fr;
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleExport() {
    setExporting(true);
    setMessage(null);
    try {
      const data = await buildFamilyExport(familyId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kidmission-export-${familyId}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage(T.exportOk);
    } catch (err) {
      console.error("Export failed", err);
      setMessage(T.exportErr);
    } finally {
      setExporting(false);
    }
  }

  function handleDeleteRequest() {
    if (!window.confirm(T.confirm1)) return;
    if (!window.confirm(T.confirm2)) return;
    const mailto =
      `mailto:${CONTACT_EMAIL}` +
      `?subject=${encodeURIComponent(T.mailSubject)}` +
      `&body=${encodeURIComponent(T.mailBody(familyId))}`;
    window.location.href = mailto;
    setMessage(T.deleteSent);
  }

  return (
    <div dir={dir} style={{ minHeight: "100vh", background: "var(--pink-bg)", paddingBottom: 40 }}>
      <div style={{ background: "var(--pink-header)", color: "#fff", padding: "calc(20px + env(safe-area-inset-top)) 20px 22px", borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: "#fff", fontSize: 15, cursor: "pointer" }}>
            {T.back}
          </button>
          <h1 className="disp" style={{ fontSize: 20, margin: 0 }}>{T.title}</h1>
          <div style={{ width: 60 }} />
        </div>
      </div>

      <div style={{ padding: "20px 16px" }}>
        <h2 style={{ fontSize: 16, margin: "0 0 12px" }}>{T.legal}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          <a href="/legal/cgu.html" target="_blank" rel="noopener noreferrer" style={{ color: "var(--pink-header)", fontWeight: 600 }}>
            {T.cgu}
          </a>
          <a href="/legal/confidentialite.html" target="_blank" rel="noopener noreferrer" style={{ color: "var(--pink-header)", fontWeight: 600 }}>
            {T.privacy}
          </a>
        </div>

        <h2 style={{ fontSize: 16, margin: "0 0 12px" }}>{T.data}</h2>
        <button className="btn-primary" onClick={handleExport} disabled={exporting} style={{ marginBottom: 24 }}>
          {exporting ? T.exporting : T.exportBtn}
        </button>

        <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>{T.deleteTitle}</h2>
        <p style={{ fontSize: 13.5, margin: "0 0 12px", lineHeight: 1.5 }}>{T.deleteInfo}</p>
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
          }}
        >
          {T.deleteBtn}
        </button>

        {message && (
          <p style={{ marginTop: 16, padding: 12, background: "var(--pink-card)", borderRadius: 10, fontSize: 14 }}>
            {message}
          </p>
        )}

        <button className="link-btn" style={{ marginTop: 28 }} onClick={logout}>
          {T.logout}
        </button>
      </div>
    </div>
  );
}

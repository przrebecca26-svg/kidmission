import { useState } from "react";
import { signUpParent } from "../services/auth.js";
import { useLang, LanguageSwitcher } from "../i18n.jsx";

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function SignupParent({ onBack, onSignedUp }) {
  const { lang, setLang, t, dir } = useLang();
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
      setError(t("fillAllFields"));
      return;
    }
    const familyId = slugify(familyName) || `famille-${Date.now()}`;
    setLoading(true);
    try {
      await signUpParent({ email: email.trim(), password, displayName: displayName.trim(), familyId });
      onSignedUp(familyId);
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
        <h2 className="disp auth-title">{t("createYourAccount")}</h2>
        <p className="auth-subtitle">{t("yourSpaceSubtitle")}</p>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>{t("yourFirstName")}</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Rebecca" />
          </div>
          <div className="field">
            <label>{t("familyNameLabel")}</label>
            <input value={familyName} onChange={(e) => setFamilyName(e.target.value)} placeholder="Famille Perez" />
          </div>
          <div className="field">
            <label>{t("emailLabel")}</label>
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="toi@exemple.com" />
          </div>
          <div className="field">
            <label>{t("passwordLabel")}</label>
            <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? t("creating") : t("createMyAccount")}
          </button>
        </form>
        <button className="link-btn" onClick={onBack}>{t("back")}</button>
      </div>
    </div>
  );
}

export function translateFirebaseError(err, lang = "fr") {
  const code = err?.code || "";
  const { t } = useLangStatic(lang);
  if (code.includes("email-already-in-use")) return t("errEmailInUse");
  if (code.includes("invalid-email")) return t("errInvalidEmail");
  if (code.includes("weak-password")) return t("errWeakPassword");
  if (code.includes("wrong-password") || code.includes("invalid-credential")) return t("errWrongPassword");
  if (code.includes("user-not-found")) return t("errUserNotFound");
  if (code.includes("network-request-failed")) return t("errNetwork");
  return t("errGeneric");
}

// Small helper: builds a `t` function for a given language without needing
// to be inside a React component (translateFirebaseError is called from
// plain async functions, not render code).
function useLangStatic(lang) {
  return {
    t: (key) => {
      const dict = {
        errEmailInUse: { fr: "Cet email est déjà utilisé.", he: "האימייל הזה כבר בשימוש.", en: "This email is already in use.", ru: "Этот email уже используется." },
        errInvalidEmail: { fr: "Adresse email invalide.", he: "כתובת אימייל לא תקינה.", en: "Invalid email address.", ru: "Неверный адрес почты." },
        errWeakPassword: { fr: "Mot de passe trop faible (6 caractères minimum).", he: "הסיסמה חלשה מדי (6 תווים לפחות).", en: "Password too weak (6 characters minimum).", ru: "Пароль слишком простой (минимум 6 символов)." },
        errWrongPassword: { fr: "Email ou mot de passe incorrect.", he: "אימייל או סיסמה שגויים.", en: "Incorrect email or password.", ru: "Неверный email или пароль." },
        errUserNotFound: { fr: "Aucun compte avec cet email.", he: "לא נמצא חשבון עם אימייל זה.", en: "No account with this email.", ru: "Нет аккаунта с такой почтой." },
        errNetwork: { fr: "Problème de connexion internet.", he: "בעיית חיבור לאינטרנט.", en: "Internet connection problem.", ru: "Проблема с интернет-соединением." },
        errGeneric: { fr: "Une erreur est survenue. Réessaie.", he: "משהו השתבש. נסה/י שוב.", en: "Something went wrong. Try again.", ru: "Что-то пошло не так. Попробуй снова." },
      };
      return dict[key]?.[lang] || dict[key]?.fr || key;
    },
  };
}

import { useState } from "react";

export const LANGS = [
  { code: "fr", flag: "🇫🇷" },
  { code: "he", flag: "🇮🇱" },
  { code: "en", flag: "🇬🇧" },
  { code: "ru", flag: "🇷🇺" },
];

const STORAGE_KEY = "kidmission_lang";

const STRINGS = {
  loading: { fr: "Chargement…", he: "טוען…", en: "Loading…", ru: "Загрузка…" },
  profileNotFound: { fr: "Profil introuvable.", he: "הפרופיל לא נמצא.", en: "Profile not found.", ru: "Профиль не найден." },
  back: { fr: "← Retour", he: "← חזרה", en: "← Back", ru: "← Назад" },
  tabMissions: { fr: "🎯 Missions", he: "🎯 משימות", en: "🎯 Missions", ru: "🎯 Задания" },
  tabJokers: { fr: "🃏 Jokers", he: "🃏 ג'וקרים", en: "🃏 Jokers", ru: "🃏 Джокеры" },
  tabRewards: { fr: "👑 Récompenses", he: "👑 פרסים", en: "👑 Rewards", ru: "👑 Награды" },
  tabRequests: { fr: "📋 Mes demandes", he: "📋 הבקשות שלי", en: "📋 My requests", ru: "📋 Мои запросы" },
  noMissions: {
    fr: "Aucune mission activée ici — demande à Maman d'en cocher dans Réglages.",
    he: "אין משימות פעילות כאן — בקש/י מאמא לסמן משימות בהגדרות.",
    en: "No missions enabled here — ask a parent to enable some in Settings.",
    ru: "Здесь нет заданий — попроси родителей включить их в настройках.",
  },
  noRewards: {
    fr: "Aucune récompense activée ici — demande à Maman d'en cocher dans Réglages.",
    he: "אין פרסים פעילים כאן — בקש/י מאמא לסמן פרסים בהגדרות.",
    en: "No rewards enabled here — ask a parent to enable some in Settings.",
    ru: "Здесь нет наград — попроси родителей включить их в настройках.",
  },
  noRequests: { fr: "Rien pour l'instant.", he: "אין כלום כרגע.", en: "Nothing yet.", ru: "Пока ничего нет." },
  declare: { fr: "Déclarer", he: "לדווח", en: "Declare", ru: "Отметить" },
  save: { fr: "✅ Enregistrer", he: "✅ שמור", en: "✅ Save", ru: "✅ Сохранить" },
  ask: { fr: "Demander", he: "לבקש", en: "Ask", ru: "Запросить" },
  grant: { fr: "✅ Accorder", he: "✅ אשר", en: "✅ Grant", ru: "✅ Выдать" },
  from: { fr: "dès", he: "החל מ-", en: "from", ru: "от" },
  pending: { fr: "⏳ En attente", he: "⏳ בהמתנה", en: "⏳ Pending", ru: "⏳ В ожидании" },
  confirmed: { fr: "✅ Confirmé", he: "✅ אושר", en: "✅ Confirmed", ru: "✅ Подтверждено" },
  validate: { fr: "✓ Valider", he: "✓ אשר", en: "✓ Approve", ru: "✓ Одобрить" },
  reject: { fr: "✕ Refuser", he: "✕ דחה", en: "✕ Reject", ru: "✕ Отклонить" },
  logout: { fr: "Déconnexion", he: "התנתקות", en: "Log out", ru: "Выйти" },

  myChildren: { fr: "Mes enfants", he: "הילדים שלי", en: "My children", ru: "Мои дети" },
  noChildren: {
    fr: "Aucun profil enfant pour l'instant — ajoute le premier ci-dessous.",
    he: "אין עדיין פרופיל ילד — הוסף/י את הראשון למטה.",
    en: "No child profile yet — add the first one below.",
    ru: "Пока нет профиля ребёнка — добавь первый ниже.",
  },
  addChild: { fr: "+ Ajouter un enfant", he: "+ הוסף ילד/ה", en: "+ Add a child", ru: "+ Добавить ребёнка" },
  newChildProfile: { fr: "Nouveau profil enfant", he: "פרופיל ילד/ה חדש", en: "New child profile", ru: "Новый профиль ребёнка" },
  firstName: { fr: "Prénom", he: "שם פרטי", en: "First name", ru: "Имя" },
  rewardType: {
    fr: "Type de récompense pour cet enfant",
    he: "סוג הפרס עבור הילד/ה הזה/זו",
    en: "Reward type for this child",
    ru: "Тип награды для этого ребёнка",
  },
  continueLabel: { fr: "Continuer", he: "המשך", en: "Continue", ru: "Продолжить" },
  loginFor: { fr: "Connexion de {name}", he: "חיבור עבור {name}", en: "Login for {name}", ru: "Вход для {name}" },
  usernameLabel: {
    fr: "Identifiant (que {name} tapera pour se connecter)",
    he: "שם משתמש ({name} יקליד/תקליד אותו כדי להתחבר)",
    en: "Username ({name} will type this to log in)",
    ru: "Логин (его {name} введёт при входе)",
  },
  codeLabel: { fr: "Code à 6 chiffres", he: "קוד בן 6 ספרות", en: "6-digit code", ru: "6-значный код" },
  createAccess: { fr: "Créer l'accès", he: "צור/י גישה", en: "Create access", ru: "Создать доступ" },
  childReady: { fr: "{name} est prêt·e !", he: "{name} מוכן/ה!", en: "{name} is ready!", ru: "{name} готов(а)!" },
  childReadyDetail: {
    fr: "Sur son téléphone : code famille {familyId}, identifiant {username}, code {code}.",
    he: "בטלפון שלו/שלה: קוד משפחה {familyId}, שם משתמש {username}, קוד {code}.",
    en: "On their phone: family code {familyId}, username {username}, code {code}.",
    ru: "На его телефоне: код семьи {familyId}, логин {username}, код {code}.",
  },
  done: { fr: "Terminé", he: "סיום", en: "Done", ru: "Готово" },
  giveFirstName: { fr: "Donne un prénom.", he: "יש להזין שם פרטי.", en: "Please enter a first name.", ru: "Введите имя." },
  usernameCodeRequired: {
    fr: "Identifiant + code à 6 chiffres requis.",
    he: "נדרש שם משתמש + קוד בן 6 ספרות.",
    en: "Username + 6-digit code required.",
    ru: "Нужны логин и 6-значный код.",
  },
  currencyMoney: { fr: "💰 Argent", he: "💰 כסף", en: "💰 Money", ru: "💰 Деньги" },
  currencyScreentime: { fr: "📱 Temps d'écran", he: "📱 זמן מסך", en: "📱 Screen time", ru: "📱 Экранное время" },
  currencyPoints: { fr: "⭐ Points", he: "⭐ נקודות", en: "⭐ Points", ru: "⭐ Баллы" },
};

export function useLang() {
  const [lang, setLangState] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || "fr"; } catch { return "fr"; }
  });

  function setLang(code) {
    try { localStorage.setItem(STORAGE_KEY, code); } catch {}
    setLangState(code);
  }

  function t(key, vars) {
    let str = STRINGS[key]?.[lang] ?? STRINGS[key]?.fr ?? key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, v);
      });
    }
    return str;
  }

  const dir = lang === "he" ? "rtl" : "ltr";
  return { lang, setLang, t, dir };
}

export function LanguageSwitcher({ lang, setLang }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {LANGS.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          style={{
            border: "none",
            borderRadius: 999,
            width: 30,
            height: 30,
            fontSize: 14,
            cursor: "pointer",
            background: lang === l.code ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.18)",
            opacity: lang === l.code ? 1 : 0.75,
          }}
        >
          {l.flag}
        </button>
      ))}
    </div>
  );
}

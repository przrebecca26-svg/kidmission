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
  whoConnects: { fr: "Qui se connecte ?", he: "מי מתחבר/ת?", en: "Who's logging in?", ru: "Кто входит?" },
  momLabel: { fr: "Maman", he: "אמא", en: "Mom", ru: "Мама" },
  childLabel: { fr: "Enfant", he: "ילד/ה", en: "Child", ru: "Ребёнок" },
  createYourAccount: { fr: "Créer ton compte", he: "צור/י את החשבון שלך", en: "Create your account", ru: "Создать аккаунт" },
  yourSpaceSubtitle: { fr: "Ton espace Maman, à toi seule.", he: "החלל שלך כהורה, רק עבורך.", en: "Your parent space, just for you.", ru: "Твоё родительское пространство." },
  yourFirstName: { fr: "Ton prénom", he: "השם הפרטי שלך", en: "Your first name", ru: "Твоё имя" },
  familyNameLabel: { fr: "Nom de famille (pour identifier votre espace)", he: "שם המשפחה (לזיהוי החלל שלכם)", en: "Family name (to identify your space)", ru: "Фамилия (для идентификации семьи)" },
  emailLabel: { fr: "Email", he: "אימייל", en: "Email", ru: "Эл. почта" },
  passwordLabel: { fr: "Mot de passe (6 caractères minimum)", he: "סיסמה (6 תווים לפחות)", en: "Password (6 characters minimum)", ru: "Пароль (минимум 6 символов)" },
  creating: { fr: "Création…", he: "יוצר…", en: "Creating…", ru: "Создание…" },
  createMyAccount: { fr: "Créer mon compte", he: "צור/י את החשבון שלי", en: "Create my account", ru: "Создать аккаунт" },
  fillAllFields: {
    fr: "Remplis tous les champs (le mot de passe doit faire au moins 6 caractères).",
    he: "יש למלא את כל השדות (הסיסמה חייבת להכיל לפחות 6 תווים).",
    en: "Fill in all fields (password must be at least 6 characters).",
    ru: "Заполните все поля (пароль минимум 6 символов).",
  },
  errEmailInUse: { fr: "Cet email est déjà utilisé.", he: "האימייל הזה כבר בשימוש.", en: "This email is already in use.", ru: "Этот email уже используется." },
  errInvalidEmail: { fr: "Adresse email invalide.", he: "כתובת אימייל לא תקינה.", en: "Invalid email address.", ru: "Неверный адрес почты." },
  errWeakPassword: { fr: "Mot de passe trop faible (6 caractères minimum).", he: "הסיסמה חלשה מדי (6 תווים לפחות).", en: "Password too weak (6 characters minimum).", ru: "Пароль слишком простой (минимум 6 символов)." },
  errWrongPassword: { fr: "Email ou mot de passe incorrect.", he: "אימייל או סיסמה שגויים.", en: "Incorrect email or password.", ru: "Неверный email или пароль." },
  errUserNotFound: { fr: "Aucun compte avec cet email.", he: "לא נמצא חשבון עם אימייל זה.", en: "No account with this email.", ru: "Нет аккаунта с такой почтой." },
  errNetwork: { fr: "Problème de connexion internet.", he: "בעיית חיבור לאינטרנט.", en: "Internet connection problem.", ru: "Проблема с интернет-соединением." },
  errGeneric: { fr: "Une erreur est survenue. Réessaie.", he: "משהו השתבש. נסה/י שוב.", en: "Something went wrong. Try again.", ru: "Что-то пошло не так. Попробуй снова." },
  welcomeBack: { fr: "Bon retour 👩", he: "ברוך/ה שובך 👩", en: "Welcome back 👩", ru: "С возвращением 👩" },
  enterEmailFirst: { fr: "Entre ton email d'abord.", he: "יש להזין קודם את האימייל.", en: "Enter your email first.", ru: "Сначала введите email." },
  resetEmailSent: { fr: "Email envoyé — vérifie ta boîte mail.", he: "האימייל נשלח — בדוק/בדקי את תיבת הדואר שלך.", en: "Email sent — check your inbox.", ru: "Письмо отправлено — проверьте почту." },
  passwordFieldLabel: { fr: "Mot de passe", he: "סיסמה", en: "Password", ru: "Пароль" },
  connecting: { fr: "Connexion…", he: "מתחבר…", en: "Connecting…", ru: "Вход…" },
  signIn: { fr: "Se connecter", he: "התחבר/י", en: "Sign in", ru: "Войти" },
  forgotPassword: { fr: "Mot de passe oublié ?", he: "שכחת סיסמה?", en: "Forgot password?", ru: "Забыли пароль?" },
  createAccountLink: { fr: "Créer un compte", he: "צור/י חשבון", en: "Create an account", ru: "Создать аккаунт" },
  isThisYou: { fr: "🧒 C'est toi ?", he: "🧒 זה/זאת את/ה?", en: "🧒 Is this you?", ru: "🧒 Это ты?" },
  familyCodeLabel: { fr: "Code famille (donné par Maman)", he: "קוד משפחה (ניתן על ידי אמא)", en: "Family code (given by a parent)", ru: "Код семьи (дала мама)" },
  yourUsername: { fr: "Ton identifiant", he: "שם המשתמש שלך", en: "Your username", ru: "Твой логин" },
  yourCode: { fr: "Ton code (6 chiffres)", he: "הקוד שלך (6 ספרות)", en: "Your code (6 digits)", ru: "Твой код (6 цифр)" },
  letsGo: { fr: "C'est parti !", he: "יאללה, בואי!", en: "Let's go!", ru: "Поехали!" },
  checkAllFilled: {
    fr: "Vérifie que tout est bien rempli (le code fait 6 chiffres).",
    he: "בדוק/י שהכל מלא כמו שצריך (הקוד הוא בן 6 ספרות).",
    en: "Check that everything is filled in (the code is 6 digits).",
    ru: "Проверь, всё ли заполнено (код из 6 цифр).",
  },

  settingsFor: { fr: "Réglages — {name}", he: "הגדרות — {name}", en: "Settings — {name}", ru: "Настройки — {name}" },
  defaultCurrency: {
    fr: "Devise par défaut : {unit} (modifiable par item)",
    he: "מטבע ברירת מחדל: {unit} (ניתן לשינוי לכל פריט)",
    en: "Default currency: {unit} (adjustable per item)",
    ru: "Валюта по умолчанию: {unit} (можно менять для каждого пункта)",
  },
  tabBonus: { fr: "✅ Bonus", he: "✅ בונוס", en: "✅ Bonus", ru: "✅ Бонус" },
  tabMalus: { fr: "⚠️ Malus", he: "⚠️ קנס", en: "⚠️ Penalty", ru: "⚠️ Штраф" },
  tabWeekly: { fr: "🏆 Hebdo", he: "🏆 שבועי", en: "🏆 Weekly", ru: "🏆 Еженедельно" },
  tabJokerEarn: { fr: "⭐ Gagner Jokers", he: "⭐ להרוויח ג'וקרים", en: "⭐ Earn Jokers", ru: "⭐ Заработать джокеры" },
  tabJokerUse: { fr: "🎁 Utiliser Jokers", he: "🎁 להשתמש בג'וקרים", en: "🎁 Use Jokers", ru: "🎁 Использовать джокеры" },
  tabReward: { fr: "👑 Récompenses", he: "👑 פרסים", en: "👑 Rewards", ru: "👑 Награды" },
  tabRules: { fr: "📜 Règles", he: "📜 חוקים", en: "📜 Rules", ru: "📜 Правила" },
  valAmount: { fr: "Montant", he: "סכום", en: "Amount", ru: "Сумма" },
  valWithdraw: { fr: "Retrait", he: "ניכוי", en: "Deduction", ru: "Вычет" },
  valJokersEarned: { fr: "Jokers gagnés", he: "ג'וקרים שהורווחו", en: "Jokers earned", ru: "Заработанные джокеры" },
  valJokersCost: { fr: "Coût en Jokers", he: "עלות בג'וקרים", en: "Cost in Jokers", ru: "Стоимость в джокерах" },
  valThreshold: { fr: "Seuil", he: "סף", en: "Threshold", ru: "Порог" },
  addCustomItem: { fr: "+ Ajouter un item personnalisé", he: "+ הוסף פריט מותאם אישית", en: "+ Add a custom item", ru: "+ Добавить свой пункт" },
  editItem: { fr: "Modifier l'item", he: "עריכת הפריט", en: "Edit item", ru: "Изменить пункт" },
  newItem: { fr: "Nouvel item", he: "פריט חדש", en: "New item", ru: "Новый пункт" },
  frLabelField: { fr: "Libellé (français)", he: "תווית (צרפתית)", en: "Label (French)", ru: "Название (французский)" },
  heLabelField: { fr: "Libellé (hébreu)", he: "תווית (עברית)", en: "Label (Hebrew)", ru: "Название (иврит)" },
  translatingSuffix: { fr: "— traduction…", he: "— מתרגם…", en: "— translating…", ru: "— перевод…" },
  rewardTypeShort: { fr: "Type de récompense", he: "סוג הפרס", en: "Reward type", ru: "Тип награды" },
  saveSimple: { fr: "Enregistrer", he: "שמור", en: "Save", ru: "Сохранить" },
  cancel: { fr: "Annuler", he: "ביטול", en: "Cancel", ru: "Отмена" },
  errGiveFrLabel: { fr: "Donne au moins un libellé en français.", he: "יש להזין לפחות תווית אחת בצרפתית.", en: "Enter at least a French label.", ru: "Введите хотя бы название на французском." },
  errPositiveNumber: { fr: "La valeur doit être un nombre positif.", he: "הערך חייב להיות מספר חיובי.", en: "The value must be a positive number.", ru: "Значение должно быть положительным числом." },
  paymentSectionTitle: { fr: "💳 Versement", he: "💳 תשלום", en: "💳 Payout", ru: "💳 Выплата" },

  paymentsFor: { fr: "Versements — {name}", he: "תשלומים — {name}", en: "Payouts — {name}", ru: "Выплаты — {name}" },
  amountDueSince: {
    fr: "Montant dû depuis le dernier versement",
    he: "סכום לתשלום מאז התשלום האחרון",
    en: "Amount due since last payout",
    ru: "Сумма к выплате с последнего платежа",
  },
  detailLabel: { fr: "Détail", he: "פירוט", en: "Details", ru: "Детали" },
  noteOptional: { fr: "Note (optionnel)", he: "הערה (אופציונלי)", en: "Note (optional)", ru: "Заметка (необязательно)" },
  recordPaymentOf: {
    fr: "Enregistrer le versement de {amount} {unit}",
    he: "רשום תשלום של {amount} {unit}",
    en: "Record payout of {amount} {unit}",
    ru: "Записать выплату {amount} {unit}",
  },
  historyTitle: { fr: "Historique", he: "היסטוריה", en: "History", ru: "История" },
  noPaymentsYet: {
    fr: "Aucun versement enregistré pour l'instant.",
    he: "עדיין לא נרשם תשלום.",
    en: "No payouts recorded yet.",
    ru: "Пока нет записанных выплат.",
  },

  accessFor: { fr: "Accès — {name}", he: "גישה — {name}", en: "Access — {name}", ru: "Доступ — {name}" },
  currentUsername: { fr: "Identifiant actuel", he: "שם המשתמש הנוכחי", en: "Current username", ru: "Текущий логин" },
  resetCodeTitle: { fr: "Réinitialiser le code", he: "איפוס הקוד", en: "Reset code", ru: "Сбросить код" },
  resetCodeDesc: {
    fr: "Utile si {name} a oublié son code, ou pour se connecter depuis un nouveau téléphone. L'ancien accès sera révoqué — mais tout l'historique (missions, jokers, versements) reste intact.",
    he: "שימושי אם {name} שכח/ה את הקוד, או כדי להתחבר מטלפון חדש. הגישה הישנה תבוטל — אך כל ההיסטוריה (משימות, ג'וקרים, תשלומים) נשארת שלמה.",
    en: "Useful if {name} forgot their code, or to log in from a new phone. The old access will be revoked — but all history (missions, jokers, payouts) stays intact.",
    ru: "Полезно, если {name} забыл(а) код, или для входа с нового телефона. Старый доступ будет отозван, но вся история (задания, джокеры, выплаты) сохранится.",
  },
  usernameFieldSimple: { fr: "Identifiant", he: "שם משתמש", en: "Username", ru: "Логин" },
  newCodeLabel: { fr: "Nouveau code à 6 chiffres", he: "קוד חדש בן 6 ספרות", en: "New 6-digit code", ru: "Новый 6-значный код" },
  accessHistoryTitle: { fr: "Historique des accès", he: "היסטוריית גישות", en: "Access history", ru: "История доступов" },
  createdOn: { fr: "Créé le {date}", he: "נוצר בתאריך {date}", en: "Created on {date}", ru: "Создано {date}" },
  revokedLabel: { fr: "🚫 Révoqué", he: "🚫 בוטל", en: "🚫 Revoked", ru: "🚫 Отозван" },
  activeLabel: { fr: "✅ Actif", he: "✅ פעיל", en: "✅ Active", ru: "✅ Активен" },
  resetSuccessMsg: {
    fr: "Nouveau code créé. Sur son téléphone : code famille {familyId}, identifiant {username}, code {code}.",
    he: "נוצר קוד חדש. בטלפון שלו/שלה: קוד משפחה {familyId}, שם משתמש {username}, קוד {code}.",
    en: "New code created. On their phone: family code {familyId}, username {username}, code {code}.",
    ru: "Новый код создан. На его телефоне: код семьи {familyId}, логин {username}, код {code}.",
  },
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

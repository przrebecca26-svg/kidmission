import { useEffect, useState } from "react";
import { markOnboardingSeen } from "../services/firestore.js";

const STEPS_TEXT = {
  1: {
    title: { fr: "Bienvenue", he: "ברוכים הבאים", en: "Welcome", ru: "Добро пожаловать" },
    body: {
      fr: "KidMission transforme les petites missions du quotidien en un système simple de récompenses et de suivi familial.",
      he: "KidMission הופכת משימות קטנות מהיומיום למערכת פשוטה של פרסים ומעקב משפחתי.",
      en: "KidMission turns everyday little missions into a simple family reward and tracking system.",
      ru: "KidMission превращает повседневные маленькие задания в простую систему наград и семейного учёта.",
    },
  },
  2: {
    title: { fr: "Ton enfant", he: "הילד/ה שלך", en: "Your child", ru: "Твой ребёнок" },
    body: {
      fr: "Tu viens de créer le profil de {name}, avec {unit} comme système de récompense.",
      he: "יצרת עכשיו את הפרופיל של {name}, עם {unit} כמערכת הפרסים.",
      en: "You just created {name}'s profile, using {unit} as the reward system.",
      ru: "Ты только что создал(а) профиль {name}, с системой наград {unit}.",
    },
  },
  3: {
    title: { fr: "Les missions", he: "המשימות", en: "Missions", ru: "Задания" },
    body: {
      fr: "Tu disposes d'un catalogue prêt à l'emploi. Tu peux modifier, désactiver, masquer ou créer tes propres missions.",
      he: "יש לך קטלוג מוכן לשימוש. אפשר לערוך, לבטל, להסתיר או ליצור משימות משלך.",
      en: "You have a ready-to-use catalog. You can edit, disable, hide, or create your own missions.",
      ru: "У тебя есть готовый каталог. Ты можешь редактировать, отключать, скрывать или создавать свои задания.",
    },
  },
  4: {
    title: { fr: "Le cycle", he: "המחזור", en: "The cycle", ru: "Цикл" },
    body: {
      fr: "{name} déclare ce qu'elle/il a fait → tu vérifies → tu valides ou refuses → le solde est mis à jour.",
      he: "{name} מדווח/ת מה עשה/תה → את/ה בודק/ת → מאשר/ת או דוחה → היתרה מתעדכנת.",
      en: "{name} declares what they did → you check → you approve or reject → the balance updates.",
      ru: "{name} отмечает, что сделал(а) → ты проверяешь → одобряешь или отклоняешь → баланс обновляется.",
    },
  },
  5: {
    title: { fr: "Les jokers", he: "הג'וקרים", en: "Jokers", ru: "Джокеры" },
    body: {
      fr: "Les jokers permettent à {name} d'utiliser certaines possibilités prévues par tes règles. Tu peux définir et contrôler leur fonctionnement.",
      he: "הג'וקרים מאפשרים ל{name} להשתמש באפשרויות מסוימות שקבעת. את/ה קובע/ת ושולט/ת באופן הפעולה שלהם.",
      en: "Jokers let {name} use certain options you set up in your rules. You define and control exactly how they work.",
      ru: "Джокеры позволяют {name} использовать определённые возможности, которые ты задаёшь в правилах. Ты определяешь и контролируешь их работу.",
    },
  },
  6: {
    title: { fr: "Les récompenses", he: "הפרסים", en: "Rewards", ru: "Награды" },
    body: {
      fr: "{name} peut atteindre les récompenses que tu définis pour elle/lui.",
      he: "{name} יכול/ה להגיע לפרסים שהגדרת עבורו/ה.",
      en: "{name} can reach the rewards you set up for them.",
      ru: "{name} может достичь наград, которые ты для него/неё установил(а).",
    },
  },
  7: {
    title: { fr: "C'est parti", he: "יאללה, בואו נתחיל", en: "Let's go", ru: "Начинаем" },
    body: {
      fr: "Tout est prêt. Tu peux maintenant personnaliser KidMission pour votre famille.",
      he: "הכל מוכן. עכשיו אפשר להתאים את KidMission למשפחה שלכם.",
      en: "Everything's ready. You can now personalize KidMission for your family.",
      ru: "Всё готово. Теперь можно настроить KidMission под свою семью.",
    },
  },
};

const UI_TEXT = {
  skip: { fr: "Passer", he: "לדלג", en: "Skip", ru: "Пропустить" },
  prev: { fr: "← Précédent", he: "← הקודם", en: "← Back", ru: "← Назад" },
  next: { fr: "Suivant →", he: "הבא →", en: "Next →", ru: "Далее →" },
  stepOf: { fr: "Étape {n} sur 7", he: "שלב {n} מתוך 7", en: "Step {n} of 7", ru: "Шаг {n} из 7" },
  shortcutMissions: { fr: "Voir mes missions", he: "לצפות במשימות שלי", en: "View my missions", ru: "Мои задания" },
  shortcutRules: { fr: "Mes règles", he: "החוקים שלי", en: "My rules", ru: "Мои правила" },
  shortcutJokers: { fr: "Comprendre les jokers", he: "להבין את הג'וקרים", en: "Understand jokers", ru: "Понять джокеры" },
  startUsing: { fr: "Commencer à utiliser KidMission", he: "להתחיל להשתמש ב-KidMission", en: "Start using KidMission", ru: "Начать пользоваться KidMission" },
};

function fillTemplate(str, vars) {
  let out = str;
  Object.entries(vars).forEach(([k, v]) => {
    out = out.replace(`{${k}}`, v);
  });
  return out;
}

export default function OnboardingTour({ familyId, childName, unitLabel, lang, onShortcut, onClose }) {
  const [step, setStep] = useState(1);
  const dir = lang === "he" ? "rtl" : "ltr";

  useEffect(() => {
    markOnboardingSeen(familyId).catch(() => {
      /* best-effort — worst case the automatic trigger might fire once more later,
         which is harmless; it never blocks a manual replay either way */
    });
  }, [familyId]);

  function t(dict, vars) {
    const raw = dict[lang] || dict.fr;
    return vars ? fillTemplate(raw, vars) : raw;
  }

  const vars = { name: childName || "", unit: unitLabel || "" };
  const current = STEPS_TEXT[step];

  function handleShortcut(tabKey) {
    onShortcut(tabKey);
    onClose();
  }

  return (
    <div
      dir={dir}
      style={{ position: "fixed", inset: 0, background: "rgba(91,32,58,0.55)", display: "flex", alignItems: "flex-end", zIndex: 80 }}
      onClick={onClose}
    >
      <div
        style={{ background: "var(--pink-card)", width: "100%", maxHeight: "72vh", overflowY: "auto", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "16px 20px calc(22px + env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-faint)", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 }}>
            {t(UI_TEXT.skip)}
          </button>
        </div>

        <div style={{ textAlign: "center", padding: "6px 0 18px" }}>
          <p style={{ fontSize: 12, color: "var(--text-faint)", margin: "0 0 4px", fontWeight: 600 }}>
            {t(UI_TEXT.stepOf, { n: step })}
          </p>
          <h3 className="disp" style={{ fontSize: 19, margin: "0 0 10px" }}>{t(current.title)}</h3>
          <p style={{ fontSize: 14.5, lineHeight: 1.5, margin: "0 auto", maxWidth: 340 }}>
            {t(current.body, vars)}
          </p>
        </div>

        {step === 7 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
              <button onClick={() => handleShortcut("bonus")} style={shortcutBtnStyle}>{t(UI_TEXT.shortcutMissions)}</button>
              <button onClick={() => handleShortcut("rules")} style={shortcutBtnStyle}>{t(UI_TEXT.shortcutRules)}</button>
              <button onClick={() => handleShortcut("jokerUse")} style={shortcutBtnStyle}>{t(UI_TEXT.shortcutJokers)}</button>
            </div>
            <button className="btn-primary" style={{ marginTop: 6 }} onClick={onClose}>
              {t(UI_TEXT.startUsing)}
            </button>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: step === 7 ? 4 : 10 }}>
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            style={{ background: "none", border: "none", color: step === 1 ? "var(--text-faint)" : "var(--pink-header)", fontSize: 13.5, fontWeight: 600, cursor: step === 1 ? "default" : "pointer", padding: 0, opacity: step === 1 ? 0.4 : 1 }}
          >
            {t(UI_TEXT.prev)}
          </button>
          {step < 7 && (
            <button
              onClick={() => setStep((s) => Math.min(7, s + 1))}
              style={{ background: "none", border: "none", color: "var(--pink-header)", fontSize: 13.5, fontWeight: 600, cursor: "pointer", padding: 0 }}
            >
              {t(UI_TEXT.next)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const shortcutBtnStyle = {
  flex: "0 0 auto", padding: "8px 12px", borderRadius: 10, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
  border: "1px solid var(--pink-header)", background: "rgba(214,49,124,0.08)", color: "var(--pink-header)",
};

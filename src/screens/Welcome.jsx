import { useLang, LanguageSwitcher } from "../i18n.jsx";

export default function Welcome({ onChooseParent, onChooseChild }) {
  const { lang, setLang, t, dir } = useLang();
  return (
    <div dir={dir} className="auth-screen">
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
        <LanguageSwitcher lang={lang} setLang={setLang} />
      </div>
      <h1 className="disp auth-title" style={{ fontSize: 30, textAlign: "center" }}>👩‍👧 Shyrel</h1>
      <p className="auth-subtitle" style={{ textAlign: "center" }}>{t("whoConnects")}</p>
      <div className="role-choice">
        <button onClick={onChooseParent}>
          <span style={{ fontSize: 28 }}>👩</span>
          {t("momLabel")}
        </button>
        <button onClick={onChooseChild}>
          <span style={{ fontSize: 28 }}>🧒</span>
          {t("childLabel")}
        </button>
      </div>
    </div>
  );
}

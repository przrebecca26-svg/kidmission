import { useState } from "react";
import { useAuth } from "./contexts/AuthContext.jsx";
import Welcome from "./screens/Welcome.jsx";
import SignupParent from "./screens/SignupParent.jsx";
import LoginParent from "./screens/LoginParent.jsx";
import ChildLogin from "./screens/ChildLogin.jsx";
import FamilyHome from "./screens/FamilyHome.jsx";
import ChildHome from "./screens/ChildHome.jsx";
import ChildSettings from "./screens/ChildSettings.jsx";
import ChildPayments from "./screens/ChildPayments.jsx";
import ChildAccess from "./screens/ChildAccess.jsx";

export default function App() {
  const auth = useAuth();
  const [screen, setScreen] = useState("welcome"); // welcome | signup | login | childLogin
  const [openChildId, setOpenChildId] = useState(null);
  const [settingsChildId, setSettingsChildId] = useState(null);
  const [paymentsChildId, setPaymentsChildId] = useState(null);
  const [accessChildId, setAccessChildId] = useState(null);

  if (auth === undefined) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--pink-header)", color: "#fff" }}>
        Chargement du carnet…
      </div>
    );
  }

  if (auth === null) {
    if (screen === "signup") return <SignupParent onBack={() => setScreen("welcome")} onSignedUp={() => {}} />;
    if (screen === "login") return <LoginParent onBack={() => setScreen("welcome")} onGoSignup={() => setScreen("signup")} onLoggedIn={() => {}} />;
    if (screen === "childLogin") return <ChildLogin onBack={() => setScreen("welcome")} onLoggedIn={() => {}} />;
    return <Welcome onChooseParent={() => setScreen("login")} onChooseChild={() => setScreen("childLogin")} />;
  }

  // Signed in.
  if (auth.role === "parent") {
    if (settingsChildId) {
      return <ChildSettings familyId={auth.familyId} childId={settingsChildId} onBack={() => setSettingsChildId(null)} />;
    }
    if (paymentsChildId) {
      return (
        <ChildPayments
          familyId={auth.familyId}
          childId={paymentsChildId}
          uid={auth.uid}
          onBack={() => setPaymentsChildId(null)}
        />
      );
    }
    if (accessChildId) {
      return (
        <ChildAccess
          familyId={auth.familyId}
          childId={accessChildId}
          onBack={() => setAccessChildId(null)}
        />
      );
    }
    if (openChildId) {
      return (
        <ChildHome
          familyId={auth.familyId}
          childId={openChildId}
          uid={auth.uid}
          isParent={true}
          onBack={() => setOpenChildId(null)}
        />
      );
    }
    return (
      <FamilyHome
        familyId={auth.familyId}
        onOpenChild={setOpenChildId}
        onOpenSettings={setSettingsChildId}
        onOpenPayments={setPaymentsChildId}
        onOpenAccess={setAccessChildId}
      />
    );
  }

  return <ChildHome familyId={auth.familyId} childId={auth.childId} uid={auth.uid} isParent={false} />;
}

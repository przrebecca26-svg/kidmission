export default function Welcome({ onChooseParent, onChooseChild }) {
  return (
    <div className="auth-screen">
      <h1 className="disp auth-title" style={{ fontSize: 30, textAlign: "center" }}>👩‍👧 Shyrel</h1>
      <p className="auth-subtitle" style={{ textAlign: "center" }}>Qui se connecte ?</p>
      <div className="role-choice">
        <button onClick={onChooseParent}>
          <span style={{ fontSize: 28 }}>👩</span>
          Maman
        </button>
        <button onClick={onChooseChild}>
          <span style={{ fontSize: 28 }}>🧒</span>
          Enfant
        </button>
      </div>
    </div>
  );
}

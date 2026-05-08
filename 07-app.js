/* global React, ReactDOM, TopNav, Dashboard, Editor, HostFlow, ResultsDashboard, ParticipantFlow, I */
// ============================================================
// QuizSpark — App shell + router
// ============================================================
const { useState: useStateA } = React;

function App() {
  // view: dashboard | editor | host | results | participant | library | join
  const [view, setView] = useStateA("dashboard");
  const [editingId, setEditingId] = useStateA(null);

  const handleNav = (target) => {
    if (target === "join") setView("participant");
    else setView(target);
  };

  const showChrome = ["dashboard", "library", "results"].includes(view) || view === "editor";

  return (
    <div style={{ minHeight: "100vh", background: "var(--ink-50)" }}>
      {showChrome && view !== "editor" && (
        <TopNav active={view} onNav={handleNav} onLaunch={() => setView("host")}/>
      )}
      {view === "editor" && (
        <TopNav active="dashboard" onNav={handleNav} onLaunch={() => setView("host")}/>
      )}

      {view === "dashboard" && (
        <Dashboard
          onOpenEditor={(id) => { setEditingId(id); setView("editor"); }}
          onLaunch={(id) => { setEditingId(id); setView("host"); }}
          onResults={() => setView("results")}
        />
      )}
      {view === "editor" && (
        <Editor onBack={() => setView("dashboard")} onLaunch={() => setView("host")}/>
      )}
      {view === "host" && (
        <HostFlow onBack={() => setView("dashboard")} onResults={() => setView("results")}/>
      )}
      {view === "results" && (
        <ResultsDashboard onBack={() => setView("dashboard")}/>
      )}
      {view === "library" && (
        <LibraryView onBack={() => setView("dashboard")}/>
      )}
      {view === "participant" && (
        <ParticipantFlow onExit={() => setView("dashboard")}/>
      )}
    </div>
  );
}

// Simple library placeholder
function LibraryView({ onBack }) {
  const items = [
    { emoji: "📚", title: "Plantilla: Examen final", desc: "20 preguntas, opción múltiple", c: "var(--violet-500)" },
    { emoji: "🎨", title: "Plantilla: Trivia creativa", desc: "Mezcla de tipos, divertida", c: "var(--pink-500)" },
    { emoji: "🚀", title: "Plantilla: Onboarding", desc: "8 preguntas para nuevos miembros", c: "var(--amber-500)" },
    { emoji: "🔬", title: "Plantilla: Ciencia básica", desc: "15 preguntas con imágenes", c: "var(--emerald-500)" },
    { emoji: "🌍", title: "Plantilla: Geografía", desc: "Capitales y banderas", c: "var(--sky-500)" },
    { emoji: "🎬", title: "Plantilla: Cine y series", desc: "Para iniciar reuniones", c: "var(--violet-700)" },
  ];
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 32 }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Biblioteca</h1>
      <p style={{ color: "var(--ink-500)", marginBottom: 24 }}>
        Plantillas listas para arrancar tu próximo quiz en segundos.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {items.map((it, i) => (
          <div key={i} className="qs-card" style={{ overflow: "hidden" }}>
            <div style={{
              height: 120, background: it.c, display: "grid", placeItems: "center", fontSize: 56,
            }}>{it.emoji}</div>
            <div style={{ padding: 16 }}>
              <div style={{ fontWeight: 700, fontFamily: "var(--font-display)", marginBottom: 4 }}>{it.title}</div>
              <div style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 12 }}>{it.desc}</div>
              <button onClick={onBack} className="qs-btn qs-btn--ghost qs-btn--sm" style={{ width: "100%" }}>
                Usar plantilla
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);

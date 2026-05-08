/* global React, I, MOCK_QUIZ, tileColor, tileShape */
// ============================================================
// QuizSpark — Participant flow: join, password, lobby, answer
// ============================================================
const { useState: useStateP, useEffect: useEffectP, useRef: useRefP } = React;

const AVATARS = ["🦊","🐼","🦄","🐯","🐸","🦁","🐙","🐧","🐨","🦉","🐰","🐺","🦒","🐵"];

function ParticipantFlow({ onExit }) {
  const [stage, setStage] = useStateP("code"); // code | password | nickname | lobby | question | answered | result
  const [code, setCode] = useStateP("");
  const [password, setPassword] = useStateP("");
  const [name, setName] = useStateP("");
  const [avatar, setAvatar] = useStateP(AVATARS[Math.floor(Math.random() * AVATARS.length)]);
  const [error, setError] = useStateP("");
  const [qIdx, setQIdx] = useStateP(0);
  const [picked, setPicked] = useStateP(null);
  const [textAnswer, setTextAnswer] = useStateP("");
  const [streak, setStreak] = useStateP(0);
  const [score, setScore] = useStateP(0);
  const [timeLeft, setTimeLeft] = useStateP(20);
  const quiz = MOCK_QUIZ;
  const q = quiz.questions[qIdx];

  // Reset timer when question changes
  useEffectP(() => {
    if (stage !== "question") return;
    setTimeLeft(q.timer);
    setPicked(null);
    setTextAnswer("");
    if (quiz.pacing === "timer") {
      const t = setInterval(() => setTimeLeft(x => Math.max(0, x - 1)), 1000);
      return () => clearInterval(t);
    }
  }, [stage, qIdx]);

  useEffectP(() => {
    if (stage === "question" && quiz.pacing === "timer" && timeLeft === 0) {
      handleSubmit();
    }
  }, [timeLeft]);

  const handleCode = () => {
    if (code.replace(/[^0-9]/g, "").length < 6) {
      setError("Código inválido");
      return;
    }
    setError("");
    setStage("password");
  };

  const handlePassword = () => {
    if (password.toUpperCase() !== quiz.password) {
      setError("Contraseña incorrecta");
      return;
    }
    setError("");
    setStage("nickname");
  };

  const handleJoin = () => {
    if (name.trim().length < 2) {
      setError("Pon tu nombre para entrar");
      return;
    }
    setError("");
    setStage("lobby");
    // Simulate host starting after 2.5s
    setTimeout(() => setStage("question"), 2500);
  };

  const handleSubmit = (override) => {
    setStage("answered");
    let isCorrect = false;
    if (q.type === "text") {
      const a = (override ?? textAnswer).trim().toLowerCase();
      isCorrect = (q.acceptedAnswers || []).some(x => x.toLowerCase() === a ||
        x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") ===
        a.normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
    } else if (q.type === "checks") {
      const correctSet = q.options.filter(o => o.correct).map(o => o.id).sort().join(",");
      const pickedSet  = (picked || []).slice().sort().join(",");
      isCorrect = correctSet === pickedSet;
    } else {
      const opt = q.options.find(o => o.id === picked);
      isCorrect = !!opt?.correct;
    }
    if (isCorrect) {
      setStreak(s => s + 1);
      setScore(s => s + 800 + Math.round(quiz.pacing === "timer" ? (timeLeft / q.timer) * 400 : 200));
    } else {
      setStreak(0);
    }
    // Auto advance
    setTimeout(() => {
      if (qIdx < quiz.questions.length - 1) {
        setQIdx(qIdx + 1);
        setStage("question");
      } else {
        setStage("result");
      }
    }, 2400);
  };

  const togglePickMulti = (oid) => {
    setPicked(p => {
      const arr = p || [];
      return arr.includes(oid) ? arr.filter(x => x !== oid) : [...arr, oid];
    });
  };

  // Wrapper background depending on stage
  const dark = ["question", "answered", "lobby", "result"].includes(stage);

  return (
    <div style={{
      minHeight: "100vh",
      background: dark
        ? "linear-gradient(135deg, var(--violet-700) 0%, var(--violet-900) 100%)"
        : "var(--ink-50)",
      color: dark ? "#fff" : "var(--ink-900)",
      display: "flex", flexDirection: "column",
    }}>
      {!dark && (
        <header style={{
          padding: "16px 24px", display: "flex", justifyContent: "space-between",
          alignItems: "center",
        }}>
          <button onClick={onExit} style={{
            display: "flex", alignItems: "center", gap: 8,
            fontFamily: "var(--font-display)", fontWeight: 800, color: "var(--violet-700)", fontSize: 20,
          }}>
            <span style={{
              width: 32, height: 32, borderRadius: 10,
              background: "linear-gradient(135deg, var(--violet-500), var(--pink-500))",
              display: "grid", placeItems: "center",
            }}><I.spark size={18} stroke="#fff"/></span>
            QuizSpark
          </button>
        </header>
      )}

      <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 20 }}>
        {stage === "code"     && <CodeStep code={code} setCode={setCode} error={error} onContinue={handleCode}/>}
        {stage === "password" && <PasswordStep password={password} setPassword={setPassword} error={error} onContinue={handlePassword} onBack={() => setStage("code")}/>}
        {stage === "nickname" && <NicknameStep name={name} setName={setName} avatar={avatar} setAvatar={setAvatar} error={error} onContinue={handleJoin} onBack={() => setStage("password")}/>}
        {stage === "lobby"    && <ParticipantLobby name={name} avatar={avatar} quiz={quiz}/>}
        {stage === "question" && <ParticipantQuestion q={q} qIdx={qIdx} total={quiz.questions.length}
          picked={picked} setPicked={setPicked} textAnswer={textAnswer} setTextAnswer={setTextAnswer}
          timeLeft={timeLeft} pacing={quiz.pacing} streak={streak} score={score}
          togglePickMulti={togglePickMulti} onSubmit={handleSubmit}/>}
        {stage === "answered" && <AnsweredView q={q} picked={picked} textAnswer={textAnswer} score={score}/>}
        {stage === "result"   && <ParticipantResult name={name} avatar={avatar} score={score} onExit={onExit}/>}
      </div>
    </div>
  );
}

// ============= STEPS =============
function StepShell({ icon, title, subtitle, children, error }) {
  const Ico = icon ? I[icon] : null;
  return (
    <div className="qs-card qs-fade-in" style={{
      width: "100%", maxWidth: 440, padding: 32, position: "relative",
    }}>
      {/* Decorative top blob */}
      <div style={{
        position: "absolute", top: -40, left: "50%", transform: "translateX(-50%)",
        width: 80, height: 80, borderRadius: 24,
        background: "linear-gradient(135deg, var(--violet-500), var(--pink-500))",
        display: "grid", placeItems: "center",
        boxShadow: "0 6px 0 var(--violet-700)",
      }}>
        {Ico && <Ico size={36} stroke="#fff" sw={2.5}/>}
      </div>
      <div style={{ marginTop: 36, textAlign: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 24, marginBottom: 6 }}>{title}</h2>
        {subtitle && <p style={{ color: "var(--ink-500)", fontSize: 14 }}>{subtitle}</p>}
      </div>
      {children}
      {error && (
        <div style={{
          marginTop: 12, padding: "8px 12px", background: "#FEF2F2", color: "var(--red-500)",
          borderRadius: 10, fontSize: 13, textAlign: "center", fontWeight: 600,
        }}>{error}</div>
      )}
    </div>
  );
}

function CodeStep({ code, setCode, error, onContinue }) {
  const formatted = code.replace(/(\d{4})(\d{0,2})/, (_, a, b) => b ? `${a}-${b}` : a);
  return (
    <StepShell icon="hash" title="¿Cuál es tu código?" subtitle="Pídeselo a tu host" error={error}>
      <input value={formatted}
        onChange={e => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
        onKeyDown={e => e.key === "Enter" && onContinue()}
        placeholder="0000-00"
        style={{
          width: "100%", padding: "18px 20px", fontSize: 32, textAlign: "center",
          fontFamily: "var(--font-display)", fontWeight: 800, letterSpacing: ".15em",
          border: "2px solid var(--ink-200)", borderRadius: 16, outline: "none",
        }}/>
      <button onClick={onContinue} className="qs-btn qs-btn--primary qs-btn--lg" style={{ width: "100%", marginTop: 12 }}>
        Continuar <I.arrowR size={18}/>
      </button>
      <div style={{ marginTop: 16, fontSize: 12, color: "var(--ink-500)", textAlign: "center" }}>
        💡 Tip: Hint del día — el código es <strong>8264-19</strong>
      </div>
    </StepShell>
  );
}

function PasswordStep({ password, setPassword, error, onContinue, onBack }) {
  return (
    <StepShell icon="lock" title="Contraseña del quiz" subtitle="Tu host la compartirá contigo" error={error}>
      <input type="text" value={password}
        onChange={e => setPassword(e.target.value.toUpperCase())}
        onKeyDown={e => e.key === "Enter" && onContinue()}
        placeholder="ABC123"
        autoFocus
        style={{
          width: "100%", padding: "18px 20px", fontSize: 28, textAlign: "center",
          fontFamily: "var(--font-display)", fontWeight: 800, letterSpacing: ".25em",
          border: "2px solid var(--ink-200)", borderRadius: 16, outline: "none",
          textTransform: "uppercase",
        }}/>
      <button onClick={onContinue} className="qs-btn qs-btn--primary qs-btn--lg" style={{ width: "100%", marginTop: 12 }}>
        Verificar <I.arrowR size={18}/>
      </button>
      <button onClick={onBack} className="qs-btn qs-btn--ghost qs-btn--sm" style={{ width: "100%", marginTop: 8 }}>
        <I.back size={14}/> Volver
      </button>
      <div style={{ marginTop: 12, fontSize: 12, color: "var(--ink-500)", textAlign: "center" }}>
        💡 Hint: <strong>VOLCAN42</strong>
      </div>
    </StepShell>
  );
}

function NicknameStep({ name, setName, avatar, setAvatar, error, onContinue, onBack }) {
  return (
    <StepShell icon="users" title="¿Cómo te llamamos?" error={error}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{
          fontSize: 64, width: 100, height: 100, borderRadius: "50%", margin: "0 auto",
          background: "var(--violet-100)", display: "grid", placeItems: "center",
          border: "3px solid var(--violet-200)",
        }}>{avatar}</div>
        <div style={{
          display: "flex", justifyContent: "center", gap: 6, marginTop: 12, flexWrap: "wrap",
          maxWidth: 320, marginLeft: "auto", marginRight: "auto",
        }}>
          {AVATARS.map(a => (
            <button key={a} onClick={() => setAvatar(a)} style={{
              width: 32, height: 32, borderRadius: 8,
              background: a === avatar ? "var(--violet-100)" : "transparent",
              fontSize: 22, lineHeight: 1, padding: 0,
            }}>{a}</button>
          ))}
        </div>
      </div>
      <input value={name}
        onChange={e => setName(e.target.value.slice(0, 20))}
        onKeyDown={e => e.key === "Enter" && onContinue()}
        placeholder="Tu nombre o apodo"
        autoFocus
        className="qs-input"
        style={{ fontSize: 18, textAlign: "center", padding: "14px" }}/>
      <button onClick={onContinue} className="qs-btn qs-btn--primary qs-btn--lg" style={{ width: "100%", marginTop: 12 }}>
        ¡Entrar! <I.spark size={18}/>
      </button>
      <button onClick={onBack} className="qs-btn qs-btn--ghost qs-btn--sm" style={{ width: "100%", marginTop: 8 }}>
        <I.back size={14}/> Volver
      </button>
    </StepShell>
  );
}

// ============= LOBBY =============
function ParticipantLobby({ name, avatar, quiz }) {
  return (
    <div style={{ textAlign: "center", maxWidth: 420 }}>
      <div style={{
        width: 120, height: 120, borderRadius: 32, background: "var(--white)",
        margin: "0 auto 20px", display: "grid", placeItems: "center", fontSize: 64,
        boxShadow: "0 8px 0 rgba(0,0,0,.18)",
        animation: "qs-bob 2.4s ease-in-out infinite",
      }}>{avatar}</div>
      <h1 style={{ color: "#fff", fontSize: 32, marginBottom: 8 }}>¡Hola, {name}! 🎉</h1>
      <p style={{ opacity: .9, fontSize: 16, marginBottom: 24 }}>
        Estás dentro. Esperando que el host empiece...
      </p>
      <div style={{
        display: "inline-flex", gap: 4, padding: "10px 20px",
        background: "rgba(255,255,255,.15)", borderRadius: 999, alignItems: "center",
      }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 8, height: 8, borderRadius: "50%", background: "#fff",
            animation: `qs-bob 1.4s ease-in-out infinite`,
            animationDelay: `${i * 0.2}s`,
          }}/>
        ))}
        <span style={{ fontWeight: 700, fontSize: 14, marginLeft: 8 }}>{quiz.title}</span>
      </div>
    </div>
  );
}

// ============= QUESTION =============
function ParticipantQuestion({ q, qIdx, total, picked, setPicked, textAnswer, setTextAnswer,
  timeLeft, pacing, streak, score, togglePickMulti, onSubmit }) {
  const canSubmit = q.type === "text" ? textAnswer.trim().length > 0 :
    q.type === "checks" ? (picked || []).length > 0 :
    picked != null;

  return (
    <div style={{ width: "100%", maxWidth: 600, display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fff" }}>
        <div className="qs-chip" style={{ background: "rgba(255,255,255,.15)", color: "#fff" }}>
          {qIdx + 1} / {total}
        </div>
        <div style={{ display: "flex", gap: 12, fontSize: 13, fontWeight: 700 }}>
          {streak > 1 && (
            <span style={{ display: "flex", gap: 4, alignItems: "center", color: "var(--amber-300)" }}>
              <I.flame size={16} stroke="var(--amber-300)"/> {streak}× racha
            </span>
          )}
          <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <I.star size={16} stroke="var(--amber-300)"/> {score.toLocaleString("es")}
          </span>
        </div>
      </div>

      {/* Question card */}
      <div className="qs-card qs-fade-in" style={{ padding: 24, color: "var(--ink-900)" }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "var(--violet-600)", letterSpacing: ".05em", marginBottom: 8 }}>
          {q.type === "checks" ? "✓ SELECCIONA TODAS" :
           q.type === "truefalse" ? "VERDADERO O FALSO" :
           q.type === "text" ? "RESPUESTA CORTA" : "ELIGE UNA"}
        </div>
        <h2 style={{ fontSize: 22, lineHeight: 1.3 }}>{q.text}</h2>
      </div>

      {/* Timer */}
      {pacing === "timer" ? (
        <div style={{
          height: 10, background: "rgba(255,255,255,.15)", borderRadius: 999, overflow: "hidden",
        }}>
          <div style={{
            width: `${(timeLeft / q.timer) * 100}%`, height: "100%",
            background: timeLeft < 5 ? "var(--red-500)" : "var(--amber-300)",
            transition: "width 1s linear",
          }}/>
        </div>
      ) : (
        <div style={{
          textAlign: "center", color: "rgba(255,255,255,.7)", fontSize: 13, fontWeight: 600,
        }}>✋ El host avanza cuando todos hayan respondido</div>
      )}

      {/* Options */}
      {q.type === "text" ? (
        <div className="qs-card" style={{ padding: 16 }}>
          <input autoFocus value={textAnswer}
            onChange={e => setTextAnswer(e.target.value)}
            onKeyDown={e => e.key === "Enter" && canSubmit && onSubmit()}
            placeholder="Escribe tu respuesta..."
            style={{
              width: "100%", padding: "14px 16px", fontSize: 18, fontWeight: 600,
              border: "2px solid var(--ink-200)", borderRadius: 12, outline: "none",
            }}/>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {q.options.map((o, i) => {
            const isPicked = q.type === "checks" ? (picked || []).includes(o.id) : picked === o.id;
            return (
              <button key={o.id}
                onClick={() => q.type === "checks" ? togglePickMulti(o.id) : setPicked(o.id)}
                style={{
                  padding: "20px 18px", borderRadius: 16, background: tileColor(i), color: "#fff",
                  display: "flex", alignItems: "center", gap: 12, textAlign: "left",
                  fontSize: 16, fontWeight: 700, boxShadow: "var(--shadow-tile)",
                  minHeight: 80,
                  outline: isPicked ? "4px solid #fff" : "none",
                  outlineOffset: isPicked ? -8 : 0,
                  transform: isPicked ? "scale(.97)" : "scale(1)",
                  transition: "transform .12s, outline-color .12s",
                }}>
                <span style={{ fontSize: 26, opacity: .85 }}>{tileShape(i)}</span>
                <span style={{ flex: 1 }}>{o.text}</span>
                {q.type === "checks" && (
                  <span style={{
                    width: 24, height: 24, borderRadius: 6,
                    background: isPicked ? "#fff" : "rgba(255,255,255,.25)",
                    display: "grid", placeItems: "center",
                  }}>{isPicked && <I.check size={16} stroke={tileColor(i)} sw={3}/>}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Submit */}
      <button onClick={() => canSubmit && onSubmit()} disabled={!canSubmit}
        className="qs-btn qs-btn--lg"
        style={{
          background: canSubmit ? "#fff" : "rgba(255,255,255,.18)",
          color: canSubmit ? "var(--violet-700)" : "rgba(255,255,255,.5)",
          width: "100%",
          boxShadow: canSubmit ? "0 4px 0 rgba(0,0,0,.2)" : "none",
        }}>
        <I.check size={20}/> Enviar respuesta
      </button>
    </div>
  );
}

// ============= ANSWERED =============
function AnsweredView({ q, picked, textAnswer, score }) {
  let isCorrect = false;
  if (q.type === "text") {
    const a = textAnswer.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    isCorrect = (q.acceptedAnswers || []).some(x =>
      x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === a);
  } else if (q.type === "checks") {
    const correctSet = q.options.filter(o => o.correct).map(o => o.id).sort().join(",");
    const pickedSet  = (picked || []).slice().sort().join(",");
    isCorrect = correctSet === pickedSet;
  } else {
    isCorrect = !!q.options?.find(o => o.id === picked)?.correct;
  }

  return (
    <div style={{ textAlign: "center", maxWidth: 400, animation: "qs-pop-in .4s ease both" }}>
      <div style={{
        width: 140, height: 140, borderRadius: "50%", margin: "0 auto 20px",
        background: isCorrect ? "var(--emerald-500)" : "var(--red-500)",
        display: "grid", placeItems: "center", fontSize: 70,
        boxShadow: "0 8px 0 rgba(0,0,0,.2)",
        animation: isCorrect ? "qs-pop-in .5s ease both" : "qs-shake .4s ease both",
      }}>
        {isCorrect ? "🎉" : "😅"}
      </div>
      <h1 style={{ color: "#fff", fontSize: 36, marginBottom: 8 }}>
        {isCorrect ? "¡Correcto!" : "Casi..."}
      </h1>
      <p style={{ color: "rgba(255,255,255,.85)", fontSize: 16, marginBottom: 20 }}>
        {isCorrect ? "Suma puntos a tu marcador 🚀" : "La próxima pregunta es tuya 💪"}
      </p>
      <div style={{
        display: "inline-flex", gap: 8, padding: "12px 20px", background: "rgba(255,255,255,.15)",
        borderRadius: 999, alignItems: "center", color: "#fff",
      }}>
        <I.star size={20} stroke="var(--amber-300)"/>
        <span style={{ fontWeight: 800, fontSize: 22, fontFamily: "var(--font-display)" }}>
          {score.toLocaleString("es")} pts
        </span>
      </div>
      <div style={{ marginTop: 20, color: "rgba(255,255,255,.7)", fontSize: 13 }}>
        Esperando a los demás...
      </div>
    </div>
  );
}

// ============= FINAL RESULT =============
function ParticipantResult({ name, avatar, score, onExit }) {
  return (
    <div style={{ textAlign: "center", maxWidth: 420, animation: "qs-pop-in .5s ease both" }}>
      <div style={{ fontSize: 70, marginBottom: 12, animation: "qs-bob 2s ease-in-out infinite" }}>🏆</div>
      <h1 style={{ color: "#fff", fontSize: 36, marginBottom: 4 }}>¡Bien jugado, {name}!</h1>
      <p style={{ color: "rgba(255,255,255,.85)", fontSize: 16, marginBottom: 24 }}>
        Quedaste en el top 3 🥇
      </p>
      <div className="qs-card" style={{ padding: 24, color: "var(--ink-900)", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--violet-100)",
            display: "grid", placeItems: "center", fontSize: 32 }}>{avatar}</div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{name}</div>
            <div style={{ fontSize: 12, color: "var(--ink-500)" }}>Posición #2 de 12</div>
          </div>
          <div style={{ marginLeft: "auto", fontSize: 28, fontWeight: 800, fontFamily: "var(--font-display)", color: "var(--violet-700)" }}>
            {score.toLocaleString("es")}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
          {[
            { label: "Aciertos", value: "3/4", c: "var(--emerald-500)" },
            { label: "Tiempo", value: "1:24", c: "var(--sky-500)" },
            { label: "Racha", value: "2×", c: "var(--amber-500)" },
          ].map(s => (
            <div key={s.label} style={{
              padding: 12, background: "var(--ink-50)", borderRadius: 12, textAlign: "center",
            }}>
              <div style={{ fontSize: 11, color: "var(--ink-500)", fontWeight: 700 }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.c, fontFamily: "var(--font-display)" }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
      <button onClick={onExit} className="qs-btn qs-btn--lg" style={{
        background: "#fff", color: "var(--violet-700)", boxShadow: "0 4px 0 rgba(0,0,0,.2)", width: "100%",
      }}>
        Volver al inicio
      </button>
    </div>
  );
}

Object.assign(window, { ParticipantFlow });

/* global React, I, MOCK_QUIZ, MOCK_PARTICIPANTS, MOCK_RESULTS, tileColor, tileShape */
// ============================================================
// QuizSpark — Host live view: lobby, question, answer reveal
// ============================================================
const { useState: useStateH, useEffect: useEffectH, useRef: useRefH } = React;

function HostFlow({ onBack, onResults }) {
  const [stage, setStage] = useStateH("lobby"); // lobby | question | reveal | end
  const [qIdx, setQIdx]   = useStateH(0);
  const [joined, setJoined] = useStateH(MOCK_PARTICIPANTS.slice(0, 8));
  const [answered, setAnswered] = useStateH(0);
  const [timeLeft, setTimeLeft] = useStateH(20);
  const quiz = MOCK_QUIZ;
  const q = quiz.questions[qIdx];

  // Simulate participants joining over time in lobby
  useEffectH(() => {
    if (stage !== "lobby") return;
    let i = joined.length;
    const t = setInterval(() => {
      if (i < MOCK_PARTICIPANTS.length) {
        setJoined(j => [...j, MOCK_PARTICIPANTS[i]]);
        i++;
      }
    }, 2200);
    return () => clearInterval(t);
  }, [stage]);

  // Simulate timer + answer count during question
  useEffectH(() => {
    if (stage !== "question") return;
    setTimeLeft(q.timer);
    setAnswered(0);
    const tick = setInterval(() => {
      setTimeLeft(t => Math.max(0, t - 1));
    }, 1000);
    const ans = setInterval(() => {
      setAnswered(a => Math.min(joined.length, a + Math.ceil(Math.random() * 2)));
    }, 700);
    return () => { clearInterval(tick); clearInterval(ans); };
  }, [stage, qIdx]);

  useEffectH(() => {
    if (stage === "question" && quiz.pacing === "timer" && timeLeft === 0) {
      setStage("reveal");
    }
  }, [timeLeft, stage]);

  const goNext = () => {
    if (qIdx < quiz.questions.length - 1) {
      setQIdx(qIdx + 1);
      setStage("question");
    } else {
      setStage("end");
    }
  };

  if (stage === "lobby")    return <Lobby quiz={quiz} joined={joined} onStart={() => setStage("question")} onBack={onBack} />;
  if (stage === "question") return <HostQuestion quiz={quiz} q={q} qIdx={qIdx} joined={joined} answered={answered} timeLeft={timeLeft} onSkip={() => setStage("reveal")} />;
  if (stage === "reveal")   return <HostReveal quiz={quiz} q={q} qIdx={qIdx} joined={joined} onNext={goNext} />;
  if (stage === "end")      return <HostEnd onResults={onResults} onBack={onBack} />;
  return null;
}

// ----- LOBBY -----
function Lobby({ quiz, joined, onStart, onBack }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, var(--violet-700) 0%, var(--violet-900) 60%, #1A0B36 100%)",
      color: "#fff", padding: 32, position: "relative", overflow: "hidden",
    }}>
      {/* Decorative shapes */}
      <BgShapes />

      <div style={{ position: "relative", zIndex: 2 }}>
        <button onClick={onBack} style={{
          color: "#fff", display: "flex", alignItems: "center", gap: 6, opacity: .8, fontWeight: 600,
        }}><I.back size={18}/> Cerrar sesión</button>

        <div style={{
          display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 32, marginTop: 24, alignItems: "start",
        }}>
          {/* Code panel */}
          <div className="qs-card" style={{ padding: 32, color: "var(--ink-900)" }}>
            <div className="qs-chip">
              <I.spark size={12}/> {quiz.title}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 18 }}>
              <CodeBlock label="Entra a" value="quizspark.app/play" sub="o escanea el QR" />
              <CodeBlock label="Código de sala" value={quiz.roomCode} sub="6 dígitos" big />
            </div>
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 12, color: "var(--ink-500)", fontWeight: 800, letterSpacing: ".05em", marginBottom: 6 }}>
                CONTRASEÑA
              </div>
              <div style={{
                display: "flex", alignItems: "center", gap: 12, padding: "16px 20px",
                borderRadius: 16, background: "var(--amber-300)",
                border: "2px dashed var(--amber-500)",
              }}>
                <I.lock size={22} stroke="var(--ink-900)"/>
                <span style={{ fontSize: 32, fontWeight: 800, fontFamily: "var(--font-display)", letterSpacing: ".15em" }}>
                  {quiz.password}
                </span>
                <button style={{
                  marginLeft: "auto", color: "var(--ink-900)", display: "flex", alignItems: "center", gap: 4,
                  fontWeight: 700, fontSize: 13,
                }}><I.copy size={14}/> Copiar</button>
              </div>
            </div>
            <div style={{
              marginTop: 18, padding: 14, background: "var(--violet-50)", borderRadius: 12,
              display: "flex", gap: 10, alignItems: "center",
            }}>
              <FakeQR/>
              <div style={{ fontSize: 13, color: "var(--ink-700)" }}>
                <div style={{ fontWeight: 700 }}>QR para entrar rápido</div>
                <div style={{ color: "var(--ink-500)" }}>Apunta la cámara al código</div>
              </div>
              <button className="qs-btn qs-btn--ghost qs-btn--sm" style={{ marginLeft: "auto" }}>
                <I.share size={14}/> Compartir
              </button>
            </div>
          </div>

          {/* Participants */}
          <div className="qs-card" style={{ padding: 24, color: "var(--ink-900)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-500)" }}>Participantes</div>
                <div style={{ fontSize: 32, fontWeight: 800, fontFamily: "var(--font-display)" }}>{joined.length}</div>
              </div>
              <div style={{
                width: 50, height: 50, borderRadius: "50%", background: "var(--emerald-500)",
                display: "grid", placeItems: "center", color: "#fff",
              }}><I.users size={24} stroke="#fff"/></div>
            </div>
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8,
              maxHeight: 280, overflowY: "auto",
            }}>
              {joined.map((p, i) => (
                <div key={p.id} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
                  background: "var(--ink-50)", borderRadius: 12, fontSize: 13, fontWeight: 700,
                  animation: "qs-pop-in .3s ease both", animationDelay: (i * .04) + "s",
                }}>
                  <span style={{ fontSize: 22 }}>{p.avatar}</span>
                  {p.name}
                </div>
              ))}
            </div>
            {joined.length === 0 && (
              <div style={{ textAlign: "center", padding: 40, color: "var(--ink-400)" }}>
                Esperando jugadores...
              </div>
            )}
          </div>
        </div>

        {/* Bottom action bar */}
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          display: "flex", gap: 12, alignItems: "center", padding: 12,
          background: "rgba(255,255,255,.1)", backdropFilter: "blur(10px)",
          borderRadius: 999, border: "1px solid rgba(255,255,255,.18)",
        }}>
          <div style={{ padding: "8px 16px", color: "#fff", fontWeight: 600, fontSize: 14 }}>
            <span style={{ opacity: .7 }}>Ritmo:</span> {quiz.pacing === "timer" ? "Con temporizador ⏱️" : "Manual ✋"}
          </div>
          <button onClick={onStart} className="qs-btn qs-btn--success qs-btn--lg" style={{ minWidth: 200 }}>
            <I.play size={20}/> Empezar quiz
          </button>
        </div>
      </div>
    </div>
  );
}

function CodeBlock({ label, value, sub, big }) {
  return (
    <div style={{
      padding: "14px 18px", borderRadius: 14, background: "var(--ink-50)",
      border: "2px solid var(--ink-200)",
    }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: "var(--ink-500)", letterSpacing: ".05em" }}>
        {label.toUpperCase()}
      </div>
      <div style={{
        fontSize: big ? 32 : 22, fontWeight: 800, fontFamily: "var(--font-display)",
        color: "var(--violet-700)", letterSpacing: big ? ".05em" : 0,
      }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--ink-400)", marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function FakeQR() {
  // 7x7 ascii-ish QR placeholder
  const cells = "1110111100100110001110100100110001110111".split("").map(c => c === "1");
  const grid = [];
  for (let y = 0; y < 7; y++) {
    for (let x = 0; x < 7; x++) {
      grid.push((x === 0 && y === 0) || (x === 6 && y === 0) || (x === 0 && y === 6) ||
        cells[(y * 7 + x) % cells.length]);
    }
  }
  return (
    <div style={{
      width: 64, height: 64, padding: 4, background: "#fff",
      borderRadius: 8, display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1,
    }}>
      {grid.map((on, i) => (
        <div key={i} style={{ background: on ? "var(--ink-900)" : "transparent" }}/>
      ))}
    </div>
  );
}

function BgShapes() {
  return (
    <>
      <div style={{ position: "absolute", top: 80, right: 60, fontSize: 100, opacity: .15, animation: "qs-bob 4s ease-in-out infinite" }}>⭐</div>
      <div style={{ position: "absolute", bottom: 100, left: 80, fontSize: 80, opacity: .12, animation: "qs-bob 5s ease-in-out infinite" }}>🎯</div>
      <div style={{ position: "absolute", top: 200, left: 200, fontSize: 60, opacity: .1, animation: "qs-bob 3.5s ease-in-out infinite" }}>✨</div>
      <div style={{ position: "absolute", bottom: 200, right: 200, fontSize: 70, opacity: .12, animation: "qs-bob 4.5s ease-in-out infinite" }}>🚀</div>
    </>
  );
}

// ----- HOST QUESTION -----
function HostQuestion({ quiz, q, qIdx, joined, answered, timeLeft, onSkip }) {
  const pct = quiz.pacing === "timer" ? (timeLeft / q.timer) * 100 : 100;
  const ansPct = (answered / Math.max(1, joined.length)) * 100;
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, var(--violet-700) 0%, var(--violet-900) 100%)",
      color: "#fff", padding: 32, display: "flex", flexDirection: "column",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div className="qs-chip" style={{ background: "rgba(255,255,255,.15)", color: "#fff" }}>
          Pregunta {qIdx + 1} de {quiz.questions.length}
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 16, fontSize: 14, fontWeight: 700,
        }}>
          <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <I.users size={16} stroke="#fff"/> {answered}/{joined.length} respondieron
          </span>
        </div>
      </div>

      {/* Question text */}
      <div style={{ textAlign: "center", maxWidth: 1000, margin: "0 auto", flex: "0 0 auto" }}>
        <h1 style={{
          fontSize: 44, color: "#fff", fontFamily: "var(--font-display)", lineHeight: 1.15,
          marginBottom: 24,
        }}>{q.text}</h1>
      </div>

      {/* Timer or progress */}
      <div style={{
        margin: "0 auto 28px auto", display: "flex", alignItems: "center", gap: 20,
      }}>
        {quiz.pacing === "timer" ? (
          <div style={{ position: "relative", width: 96, height: 96 }}>
            <svg width="96" height="96" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="48" cy="48" r="42" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="8"/>
              <circle cx="48" cy="48" r="42" fill="none" stroke="var(--amber-300)" strokeWidth="8"
                strokeDasharray={2 * Math.PI * 42}
                strokeDashoffset={2 * Math.PI * 42 * (1 - pct / 100)}
                strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s linear" }}/>
            </svg>
            <div style={{
              position: "absolute", inset: 0, display: "grid", placeItems: "center",
              fontSize: 32, fontWeight: 800, fontFamily: "var(--font-display)",
            }}>{timeLeft}</div>
          </div>
        ) : (
          <div style={{
            padding: "10px 20px", background: "rgba(255,255,255,.1)", borderRadius: 999,
            display: "flex", alignItems: "center", gap: 10, fontWeight: 700,
          }}>
            <I.hand size={20} stroke="#fff"/> Avance manual
          </div>
        )}
        {/* Answers progress bar */}
        <div style={{ width: 280 }}>
          <div style={{ fontSize: 12, opacity: .8, marginBottom: 6 }}>Respuestas recibidas</div>
          <div style={{ height: 14, background: "rgba(255,255,255,.15)", borderRadius: 999, overflow: "hidden" }}>
            <div style={{
              width: `${ansPct}%`, height: "100%",
              background: "linear-gradient(90deg, var(--emerald-400), var(--sky-400))",
              transition: "width .3s",
            }}/>
          </div>
        </div>
      </div>

      {/* Answer tiles */}
      {q.type === "text" ? (
        <div style={{ textAlign: "center", maxWidth: 600, margin: "0 auto" }}>
          <div style={{
            padding: "30px 40px", background: "rgba(255,255,255,.1)",
            borderRadius: 20, border: "2px dashed rgba(255,255,255,.3)", fontSize: 18,
          }}>
            ✍️ Los participantes están escribiendo su respuesta...
          </div>
        </div>
      ) : (
        <div style={{
          display: "grid", gridTemplateColumns: q.options.length === 2 ? "1fr 1fr" : "1fr 1fr",
          gap: 14, maxWidth: 1100, margin: "0 auto", width: "100%",
        }}>
          {q.options.map((o, i) => (
            <div key={o.id} style={{
              padding: "24px 28px", background: tileColor(i), color: "#fff",
              borderRadius: 18, display: "flex", alignItems: "center", gap: 16,
              fontSize: 22, fontWeight: 700, boxShadow: "var(--shadow-tile)",
              minHeight: 92,
            }}>
              <span style={{ fontSize: 32, opacity: .85 }}>{tileShape(i)}</span>
              {o.text}
            </div>
          ))}
        </div>
      )}

      {/* Bottom controls */}
      <div style={{
        marginTop: "auto", display: "flex", justifyContent: "center", gap: 12, paddingTop: 32,
      }}>
        <button onClick={onSkip} className="qs-btn qs-btn--lg" style={{
          background: "var(--white)", color: "var(--violet-700)",
          boxShadow: "0 4px 0 rgba(0,0,0,.2)",
        }}>
          {quiz.pacing === "manual" ? <><I.check size={18}/> Cerrar pregunta y mostrar resultados</> :
            <><I.arrowR size={18}/> Saltar tiempo</>}
        </button>
      </div>
    </div>
  );
}

// ----- HOST REVEAL -----
function HostReveal({ quiz, q, qIdx, joined, onNext }) {
  // Build fake distribution
  const distribution = q.type === "text" ? null :
    q.options.map((o, i) => {
      const correctBase = o.correct ? 0.55 : 0.15;
      const count = Math.round(joined.length * (correctBase + ((i + qIdx) % 3) * 0.05));
      return { ...o, count };
    });
  const top3 = MOCK_RESULTS.slice(0, 3);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, var(--violet-700) 0%, var(--violet-900) 100%)",
      color: "#fff", padding: 32,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div className="qs-chip" style={{ background: "rgba(255,255,255,.15)", color: "#fff" }}>
          Pregunta {qIdx + 1} de {quiz.questions.length} · Resultados
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 24 }}>
        {/* Left: question with answers */}
        <div>
          <h2 style={{ fontSize: 30, color: "#fff", marginBottom: 20, fontFamily: "var(--font-display)" }}>{q.text}</h2>
          {q.type === "text" ? (
            <div className="qs-card" style={{ padding: 24, color: "var(--ink-900)" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ink-500)", marginBottom: 12 }}>
                RESPUESTAS ACEPTADAS
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {(q.acceptedAnswers || []).map(a => (
                  <span key={a} style={{
                    padding: "8px 14px", background: "var(--emerald-500)", color: "#fff",
                    borderRadius: 999, fontWeight: 700,
                  }}>✓ {a}</span>
                ))}
              </div>
              <div style={{ marginTop: 20, fontSize: 13, color: "var(--ink-500)" }}>
                {joined.length} respuestas recibidas · ver detalle en panel de resultados
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {distribution.map((o, i) => {
                const max = Math.max(...distribution.map(d => d.count), 1);
                const w = (o.count / max) * 100;
                return (
                  <div key={o.id} style={{
                    padding: "16px 20px", borderRadius: 14, background: tileColor(i),
                    color: "#fff", position: "relative", overflow: "hidden",
                    opacity: o.correct ? 1 : 0.55,
                    border: o.correct ? "3px solid #fff" : "3px solid transparent",
                  }}>
                    <div style={{
                      position: "absolute", inset: 0, background: "rgba(255,255,255,.12)",
                      width: `${w}%`, transition: "width .8s ease",
                    }}/>
                    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 14 }}>
                      <span style={{ fontSize: 22 }}>{tileShape(i)}</span>
                      <span style={{ fontWeight: 700, fontSize: 18, flex: 1 }}>{o.text}</span>
                      {o.correct && <I.check size={22} sw={3} stroke="#fff"/>}
                      <span style={{ fontWeight: 800, fontSize: 22, fontFamily: "var(--font-display)" }}>
                        {o.count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: top 3 leaderboard */}
        <div>
          <h3 style={{ fontSize: 18, color: "#fff", marginBottom: 14, display: "flex", gap: 8, alignItems: "center" }}>
            <I.trophy size={22} stroke="var(--amber-300)"/> Ranking en vivo
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {top3.map((p, i) => (
              <div key={p.id} className="qs-card" style={{
                padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
                color: "var(--ink-900)",
                background: i === 0 ? "linear-gradient(90deg, var(--amber-300), #fff)" : "var(--white)",
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: ["var(--amber-400)", "var(--ink-300)", "#D97706"][i],
                  display: "grid", placeItems: "center", color: "#fff", fontWeight: 800, fontSize: 16,
                }}>{i + 1}</div>
                <span style={{ fontSize: 28 }}>{p.avatar}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-500)" }}>{p.correctCount} aciertos</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 22, fontFamily: "var(--font-display)", color: "var(--violet-700)" }}>
                  {p.score.toLocaleString("es")}
                </div>
              </div>
            ))}
          </div>
          {/* Sheets indicator */}
          <div style={{
            marginTop: 16, padding: 12, background: "rgba(16,185,129,.15)",
            border: "1px solid rgba(16,185,129,.4)", borderRadius: 12,
            display: "flex", alignItems: "center", gap: 10, fontSize: 13,
          }}>
            <I.sheets size={18} stroke="var(--emerald-400)"/>
            <div>
              <div style={{ fontWeight: 700 }}>Sincronizado con Google Sheets</div>
              <div style={{ opacity: .8, fontSize: 11 }}>{joined.length} filas añadidas en esta pregunta</div>
            </div>
            <span style={{
              marginLeft: "auto", width: 8, height: 8, background: "var(--emerald-400)", borderRadius: "50%",
              animation: "qs-bob 1.2s ease-in-out infinite",
            }}/>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 32, display: "flex", justifyContent: "center" }}>
        <button onClick={onNext} className="qs-btn qs-btn--lg" style={{
          background: "#fff", color: "var(--violet-700)", boxShadow: "0 4px 0 rgba(0,0,0,.2)", minWidth: 240,
        }}>
          {qIdx < quiz.questions.length - 1 ?
            <><I.arrowR size={20}/> Siguiente pregunta</> :
            <><I.trophy size={20}/> Ver resultados finales</>}
        </button>
      </div>
    </div>
  );
}

// ----- HOST END -----
function HostEnd({ onResults, onBack }) {
  const winners = MOCK_RESULTS.slice(0, 3);
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, var(--violet-700) 0%, var(--pink-600) 100%)",
      color: "#fff", padding: 32, display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", position: "relative", overflow: "hidden",
    }}>
      <BgShapes/>
      <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 800 }}>
        <div style={{ fontSize: 80, animation: "qs-bob 2s ease-in-out infinite", marginBottom: 12 }}>🏆</div>
        <h1 style={{ fontSize: 56, color: "#fff", marginBottom: 8, fontFamily: "var(--font-display)" }}>
          ¡Sesión completada!
        </h1>
        <p style={{ opacity: .9, fontSize: 18, marginBottom: 40 }}>
          12 participantes · 4 preguntas · 72% promedio de aciertos
        </p>

        {/* Podium */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 16, marginBottom: 40 }}>
          {[winners[1], winners[0], winners[2]].map((p, i) => {
            const place = i === 1 ? 1 : i === 0 ? 2 : 3;
            const heights = { 1: 200, 2: 150, 3: 110 };
            const colors = { 1: "var(--amber-400)", 2: "var(--ink-200)", 3: "#D97706" };
            return (
              <div key={p.id} style={{ width: 140, animation: `qs-pop-in .5s ease both`, animationDelay: `${(3-place)*.15}s` }}>
                <div style={{ marginBottom: 10 }}>
                  <div style={{
                    width: 70, height: 70, borderRadius: "50%", margin: "0 auto",
                    background: "var(--white)", display: "grid", placeItems: "center",
                    fontSize: 40, boxShadow: "0 4px 0 rgba(0,0,0,.2)",
                  }}>{p.avatar}</div>
                  <div style={{ fontWeight: 800, fontSize: 16, marginTop: 8, fontFamily: "var(--font-display)" }}>{p.name}</div>
                  <div style={{ opacity: .8, fontSize: 14 }}>{p.score.toLocaleString("es")} pts</div>
                </div>
                <div style={{
                  height: heights[place], background: colors[place], borderRadius: "16px 16px 0 0",
                  display: "grid", placeItems: "center", color: "var(--ink-900)", fontWeight: 800,
                  fontSize: 60, fontFamily: "var(--font-display)",
                }}>{place}</div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button onClick={onResults} className="qs-btn qs-btn--lg" style={{
            background: "#fff", color: "var(--violet-700)", boxShadow: "0 4px 0 rgba(0,0,0,.2)",
          }}>
            <I.bar size={20}/> Ver análisis completo
          </button>
          <button onClick={onBack} className="qs-btn qs-btn--lg" style={{
            background: "rgba(255,255,255,.18)", color: "#fff", boxShadow: "0 0 0 2px rgba(255,255,255,.4) inset",
          }}>
            <I.back size={18}/> Volver al panel
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { HostFlow });

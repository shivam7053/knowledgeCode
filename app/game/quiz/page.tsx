"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme as useNextTheme } from "next-themes";
import { useChillMode } from "@/app/providers";
import { CATEGORIES, fetchQuestions } from "./QuizData";
import type { Question, Category } from "./QuizData";

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = "select" | "loading" | "quiz" | "result";

interface AnswerRecord {
  questionId: number;
  chosen: number | null;
  correct: number;
  isCorrect: boolean;
  timeTaken: number; // ms
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function grade(score: number, total: number) {
  const pct = score / total;
  if (pct >= 0.9) return { letter: "S", label: "Outstanding", color: "#f59e0b" };
  if (pct >= 0.8) return { letter: "A", label: "Excellent",   color: "#10b981" };
  if (pct >= 0.7) return { letter: "B", label: "Good",        color: "#3b82f6" };
  if (pct >= 0.6) return { letter: "C", label: "Average",     color: "#8b5cf6" };
  if (pct >= 0.4) return { letter: "D", label: "Needs Work",  color: "#f97316" };
  return             { letter: "F", label: "Keep Trying",  color: "#ef4444" };
}

// ─── CSS ──────────────────────────────────────────────────────────────────────

const globalCss = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --wrong:    #ef4444;
    --wrong-sub:rgba(239,68,68,0.10);
    --right:    #10b981;
    --right-sub:rgba(16,185,129,0.10);
  }

  @keyframes fadeUp   { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
  @keyframes fadeIn   { from { opacity:0 } to { opacity:1 } }
  @keyframes scaleIn  { from { opacity:0; transform:scale(0.94) } to { opacity:1; transform:scale(1) } }
  @keyframes slideLeft{ from { opacity:0; transform:translateX(32px) } to { opacity:1; transform:translateX(0) } }
  @keyframes pulse    { 0%,100%{ transform:scale(1) } 50%{ transform:scale(1.06) } }
  @keyframes spin     { to { transform:rotate(360deg) } }
  @keyframes timerWarn{ 0%,100%{ color:var(--col-text-primary) } 50%{ color:#ef4444 } }
  @keyframes progressBar { from { width:100% } to { width:0% } }
  @keyframes ripple   { from { transform:scale(0); opacity:0.4 } to { transform:scale(2.5); opacity:0 } }
  @keyframes starBounce { 0%{transform:scale(0) rotate(-15deg)} 60%{transform:scale(1.2) rotate(5deg)} 100%{transform:scale(1) rotate(0)} }
  @keyframes gradMove { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }

  .quiz-wrap { font-family:'Sora',system-ui,sans-serif; min-height:100vh; }

  /* Category cards */
  .cat-card {
    position:relative; overflow:hidden; border-radius:16px;
    border:1.5px solid var(--col-border); background:var(--col-surface);
    padding:20px; cursor:pointer; transition:all 0.22s;
    text-align:left;
  }
  .cat-card:hover { transform:translateY(-3px); }
  .cat-card.selected { border-color:var(--accent); }
  .cat-card .ripple-el {
    position:absolute; border-radius:50%; background:currentColor;
    width:60px; height:60px; margin-left:-30px; margin-top:-30px;
    pointer-events:none; animation:ripple 0.55s ease-out forwards;
  }

  /* Option buttons */
  .opt-btn {
    width:100%; padding:14px 18px; border-radius:12px;
    border:1.5px solid var(--col-border); background:var(--col-surface);
    color:var(--col-text-primary); font-family:inherit; font-size:14px;
    font-weight:500; text-align:left; cursor:pointer; transition:all 0.18s;
    display:flex; align-items:center; gap:12px; position:relative; overflow:hidden;
  }
  .opt-btn:hover:not(:disabled) { border-color:var(--p); background:var(--p-sub); }
  .opt-btn:disabled { cursor:default; }
  .opt-btn.correct { border-color:var(--right)!important; background:var(--right-sub)!important; }
  .opt-btn.wrong   { border-color:var(--wrong)!important; background:var(--wrong-sub)!important; }
  .opt-badge {
    min-width:28px; height:28px; border-radius:8px; display:flex;
    align-items:center; justify-content:center; font-size:12px; font-weight:700;
    background:var(--col-bg); border:1px solid var(--col-border); flex-shrink:0;
    font-family:'JetBrains Mono', monospace;
  }

  /* Difficulty pill */
  .diff-pill {
    display:inline-flex; align-items:center; gap:5px;
    padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600;
    text-transform:uppercase; letter-spacing:0.07em;
  }

  /* Progress dots */
  .prog-dot {
    width:8px; height:8px; border-radius:50%; transition:all 0.3s;
  }
`;

// ─── ProgressBar (per question timer) ────────────────────────────────────────

function QuestionTimer({ duration, key: _key, warn }: { duration: number; key: string; warn: boolean }) {
  return (
    <div style={{ width: "100%", height: 4, borderRadius: 4, background: "var(--col-border)", overflow: "hidden" }}>
      <div
        style={{
          height: "100%",
          borderRadius: 4,
          background: warn ? "#ef4444" : "var(--p)",
          animation: `progressBar ${duration}s linear forwards`,
          transition: "background 0.3s",
        }}
      />
    </div>
  );
}

// ─── CategorySelect ───────────────────────────────────────────────────────────

function CategorySelect({
  selected, setSelected, onStart,
}: {
  selected: Category | null;
  setSelected: (c: Category) => void;
  onStart: () => void;
}) {
  const handleCardClick = (cat: Category, e: React.MouseEvent<HTMLButtonElement>) => {
    setSelected(cat);
    // ripple
    const btn = e.currentTarget;
    const r = document.createElement("span");
    const rect = btn.getBoundingClientRect();
    r.className = "ripple-el";
    r.style.left = `${e.clientX - rect.left}px`;
    r.style.top  = `${e.clientY - rect.top}px`;
    r.style.color = cat.color;
    btn.appendChild(r);
    setTimeout(() => r.remove(), 600);
  };

  return (
    <div style={{ animation: "fadeUp 0.4s ease", padding: "2rem 1.5rem 3rem" }}>
      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <div
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 14px", borderRadius: 20, marginBottom: 16,
            background: "var(--p-sub)", border: "1px solid var(--p)",
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--p)", letterSpacing: "0.07em", textTransform: "uppercase" }}>
            Quiz Arena
          </span>
        </div>
        <h1
          style={{
            fontSize: "clamp(26px,5vw,40px)", fontWeight: 800,
            color: "var(--col-text-primary)", letterSpacing: "-0.5px",
            lineHeight: 1.15, marginBottom: 10,
          }}
        >
          Choose Your Category
        </h1>
        <p style={{ fontSize: 15, color: "var(--col-text-secondary)", maxWidth: 380, margin: "0 auto", lineHeight: 1.65 }}>
          10 questions · timed · instant feedback · detailed results
        </p>
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 14,
          maxWidth: 760,
          margin: "0 auto 2.5rem",
        }}
      >
        {CATEGORIES.map((cat, i) => (
          <button
            key={cat.id}
            className={`cat-card${selected?.id === cat.id ? " selected" : ""}`}
            style={{
              "--accent": cat.color,
              animationDelay: `${i * 0.05}s`,
              animation: "fadeUp 0.4s ease both",
              borderColor: selected?.id === cat.id ? cat.color : undefined,
              boxShadow: selected?.id === cat.id
                ? `0 0 0 3px ${cat.color}22, 0 8px 24px ${cat.color}18`
                : undefined,
            } as React.CSSProperties}
            onClick={(e) => handleCardClick(cat, e)}
          >
            {/* selected indicator */}
            {selected?.id === cat.id && (
              <div
                style={{
                  position: "absolute", top: 10, right: 10,
                  width: 20, height: 20, borderRadius: "50%",
                  background: cat.color, display: "flex", alignItems: "center",
                  justifyContent: "center", animation: "scaleIn 0.2s ease",
                }}
              >
                <svg width={11} height={11} fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 12 12">
                  <polyline points="2 6 5 9 10 3" />
                </svg>
              </div>
            )}
            <div style={{ fontSize: 28, marginBottom: 10, lineHeight: 1 }}>{cat.emoji}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--col-text-primary)", marginBottom: 4 }}>
              {cat.label}
            </div>
            <div style={{ fontSize: 12, color: "var(--col-text-secondary)", lineHeight: 1.45 }}>
              {cat.description}
            </div>
            {/* color bar at bottom */}
            <div
              style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: 3,
                background: cat.color, borderRadius: "0 0 14px 14px",
                opacity: selected?.id === cat.id ? 1 : 0.25,
                transition: "opacity 0.2s",
              }}
            />
          </button>
        ))}
      </div>

      {/* Start button */}
      <div style={{ textAlign: "center" }}>
        <button
          onClick={onStart}
          disabled={!selected}
          style={{
            padding: "15px 60px",
            borderRadius: 30,
            border: "none",
            background: selected ? "var(--p)" : "var(--col-border)",
            color: selected ? "#fff" : "var(--col-text-tertiary)",
            fontSize: 16,
            fontWeight: 700,
            cursor: selected ? "pointer" : "not-allowed",
            transition: "all 0.2s",
            boxShadow: selected ? "0 4px 20px var(--p-glow)" : "none",
            letterSpacing: "0.02em",
          }}
          onMouseEnter={(e) => {
            if (!selected) return;
            const b = e.currentTarget as HTMLButtonElement;
            b.style.transform = "translateY(-2px)";
            b.style.boxShadow = "0 8px 28px var(--p-glow)";
          }}
          onMouseLeave={(e) => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.transform = "translateY(0)";
            b.style.boxShadow = selected ? "0 4px 20px var(--p-glow)" : "none";
          }}
        >
          {selected ? `Start ${selected.label} Quiz →` : "Select a category first"}
        </button>

        {selected && (
          <p style={{ marginTop: 12, fontSize: 13, color: "var(--col-text-tertiary)", animation: "fadeIn 0.3s" }}>
            10 random questions · 20 seconds each
          </p>
        )}
      </div>
    </div>
  );
}

// ─── LoadingScreen ────────────────────────────────────────────────────────────

function LoadingScreen({ category }: { category: Category }) {
  const [dots, setDots] = useState(".");
  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d.length >= 3 ? "." : d + ".")), 400);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 28,
        animation: "fadeIn 0.3s ease",
      }}
    >
      {/* Animated ring */}
      <div style={{ position: "relative", width: 90, height: 90 }}>
        <div
          style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            border: `3px solid ${category.color}22`,
          }}
        />
        <div
          style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            border: `3px solid transparent`,
            borderTopColor: category.color,
            animation: "spin 0.9s linear infinite",
          }}
        />
        <div
          style={{
            position: "absolute", inset: 12, borderRadius: "50%",
            background: `${category.color}18`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28,
          }}
        >
          {category.emoji}
        </div>
      </div>

      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--col-text-primary)", marginBottom: 6 }}>
          Loading {category.label} questions{dots}
        </div>
        <div style={{ fontSize: 13, color: "var(--col-text-secondary)" }}>
          Fetching 10 curated questions for you
        </div>
      </div>

      {/* skeleton cards */}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 36, height: 6, borderRadius: 3,
              background: "var(--col-border)",
              opacity: 0.5 + i * 0.1,
              animationDelay: `${i * 0.12}s`,
              animation: "pulse 1.4s ease-in-out infinite",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── QuizScreen ───────────────────────────────────────────────────────────────

const OPTION_LABELS = ["A", "B", "C", "D"];
const Q_TIME = 20; // seconds per question

function QuizScreen({
  questions,
  category,
  onFinish,
}: {
  questions: Question[];
  category: Category;
  onFinish: (answers: AnswerRecord[]) => void;
}) {
  const [qIdx, setQIdx]         = useState(0);
  const [chosen, setChosen]     = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers]   = useState<AnswerRecord[]>([]);
  const [timeLeft, setTimeLeft] = useState(Q_TIME);
  const [elapsed, setElapsed]   = useState(0);
  const [timerKey, setTimerKey] = useState("0");
  const startRef  = useRef(Date.now());
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const globalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const q = questions[qIdx];
  const isLast = qIdx === questions.length - 1;

  const advance = useCallback((rec: AnswerRecord) => {
    const next = [...answers, rec];
    if (isLast) {
      onFinish(next);
    } else {
      setAnswers(next);
      setQIdx((i) => i + 1);
      setChosen(null);
      setRevealed(false);
      setTimeLeft(Q_TIME);
      setTimerKey(String(qIdx + 1));
      startRef.current = Date.now();
    }
  }, [answers, isLast, onFinish, qIdx]);

  const commit = useCallback((pick: number | null) => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setChosen(pick);
    setRevealed(true);
    const rec: AnswerRecord = {
      questionId: q.id,
      chosen: pick,
      correct: q.correct,
      isCorrect: pick === q.correct,
      timeTaken: Date.now() - startRef.current,
    };
    setTimeout(() => advance(rec), 1300);
  }, [q, advance]);

  // per-question timer
  useEffect(() => {
    setTimeLeft(Q_TIME);
    startRef.current = Date.now();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { commit(null); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [qIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // global elapsed
  useEffect(() => {
    globalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => { if (globalRef.current) clearInterval(globalRef.current); };
  }, []);

  const diffColor = { easy: "#10b981", medium: "#f59e0b", hard: "#ef4444" }[q.difficulty];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Top bar */}
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 20px",
          borderBottom: "0.5px solid var(--col-border)",
          background: "var(--col-bg)",
          position: "sticky", top: 0, zIndex: 10,
        }}
      >
        {/* Category chip */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>{category.emoji}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--col-text-primary)" }}>
            {category.label}
          </span>
        </div>

        {/* Progress dots */}
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          {questions.map((_, i) => (
            <div
              key={i}
              className="prog-dot"
              style={{
                background: i < qIdx
                  ? (answers[i]?.isCorrect ? "#10b981" : "#ef4444")
                  : i === qIdx
                    ? "var(--p)"
                    : "var(--col-border)",
                transform: i === qIdx ? "scale(1.25)" : "scale(1)",
                width: i === qIdx ? 10 : 8,
                height: i === qIdx ? 10 : 8,
              }}
            />
          ))}
        </div>

        {/* Timer + elapsed */}
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 20, fontWeight: 700,
              color: timeLeft <= 5 ? "#ef4444" : "var(--col-text-primary)",
              animation: timeLeft <= 5 ? "timerWarn 0.5s ease-in-out infinite" : "none",
              minWidth: 28, textAlign: "center",
            }}
          >
            {timeLeft}
          </div>
          <div style={{ fontSize: 12, color: "var(--col-text-tertiary)", fontFamily: "'JetBrains Mono', monospace" }}>
            {fmtTime(elapsed)}
          </div>
        </div>
      </div>

      {/* Timer bar */}
      <QuestionTimer duration={Q_TIME} key={timerKey} warn={timeLeft <= 5} />

      {/* Question */}
      <div
        style={{
          flex: 1, maxWidth: 680, width: "100%", margin: "0 auto",
          padding: "2rem 1.5rem 3rem",
          animation: "slideLeft 0.3s ease",
        }}
        key={qIdx}
      >
        {/* Q number + difficulty */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 13, color: "var(--col-text-tertiary)", fontWeight: 600 }}>
            Question {qIdx + 1} of {questions.length}
          </span>
          <span
            className="diff-pill"
            style={{ background: `${diffColor}18`, color: diffColor, border: `1px solid ${diffColor}40` }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: diffColor, display: "inline-block" }} />
            {q.difficulty}
          </span>
        </div>

        {/* Question text */}
        <div
          style={{
            fontSize: "clamp(16px,2.5vw,20px)", fontWeight: 700,
            color: "var(--col-text-primary)", lineHeight: 1.55,
            marginBottom: 28,
          }}
        >
          {q.question}
        </div>

        {/* Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {q.options.map((opt, i) => {
            const isCorrect = i === q.correct;
            const isChosen  = i === chosen;
            let cls = "opt-btn";
            if (revealed) {
              if (isCorrect) cls += " correct";
              else if (isChosen) cls += " wrong";
            }
            return (
              <button
                key={i}
                className={cls}
                disabled={revealed}
                onClick={() => commit(i)}
                style={{
                  animationDelay: `${i * 0.06}s`,
                  animation: "fadeUp 0.35s ease both",
                }}
              >
                <span
                  className="opt-badge"
                  style={{
                    background: revealed && isCorrect ? "#10b981" : revealed && isChosen ? "#ef4444" : undefined,
                    color:      revealed && (isCorrect || isChosen) ? "#fff" : undefined,
                    borderColor: revealed && isCorrect ? "#10b981" : revealed && isChosen ? "#ef4444" : undefined,
                  }}
                >
                  {revealed && isCorrect ? "✓" : revealed && isChosen && !isCorrect ? "✗" : OPTION_LABELS[i]}
                </span>
                <span style={{ flex: 1 }}>{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {revealed && (
          <div
            style={{
              marginTop: 20, padding: "14px 16px", borderRadius: 12,
              background: chosen === q.correct ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.07)",
              border: `1px solid ${chosen === q.correct ? "#10b98130" : "#ef444430"}`,
              animation: "fadeUp 0.3s ease",
            }}
          >
            <div
              style={{
                fontSize: 12, fontWeight: 700, marginBottom: 4, textTransform: "uppercase",
                letterSpacing: "0.07em",
                color: chosen === q.correct ? "#10b981" : "#ef4444",
              }}
            >
              {chosen === null ? "Time's up!" : chosen === q.correct ? "Correct!" : "Incorrect"}
            </div>
            <div style={{ fontSize: 13, color: "var(--col-text-secondary)", lineHeight: 1.6 }}>
              {q.explanation}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ResultScreen ─────────────────────────────────────────────────────────────

function ResultScreen({
  answers,
  questions,
  category,
  elapsed,
  onRestart,
  onMenu,
}: {
  answers: AnswerRecord[];
  questions: Question[];
  category: Category;
  elapsed: number;
  onRestart: () => void;
  onMenu: () => void;
}) {
  const score    = answers.filter((a) => a.isCorrect).length;
  const g        = grade(score, questions.length);
  const avgMs    = answers.reduce((s, a) => s + a.timeTaken, 0) / answers.length;
  const accuracy = Math.round((score / questions.length) * 100);
  const [showAll, setShowAll] = useState(false);

  return (
    <div style={{ animation: "fadeUp 0.4s ease", padding: "2rem 1.5rem 4rem" }}>
      {/* Grade card */}
      <div
        style={{
          maxWidth: 580, margin: "0 auto 2rem",
          background: "var(--col-surface)",
          border: `1.5px solid ${g.color}40`,
          borderRadius: 20,
          padding: "2rem",
          textAlign: "center",
          boxShadow: `0 0 0 4px ${g.color}12, 0 12px 40px ${g.color}14`,
        }}
      >
        {/* Grade badge */}
        <div
          style={{
            width: 80, height: 80, borderRadius: 20, margin: "0 auto 1rem",
            background: `${g.color}18`,
            border: `2px solid ${g.color}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 34, fontWeight: 800, color: g.color,
            animation: "scaleIn 0.4s ease",
          }}
        >
          {g.letter}
        </div>

        <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--col-text-primary)", marginBottom: 4 }}>
          {g.label}
        </h2>
        <p style={{ fontSize: 14, color: "var(--col-text-secondary)", marginBottom: "1.5rem" }}>
          You scored <strong style={{ color: g.color }}>{score}</strong> out of{" "}
          <strong>{questions.length}</strong> in {fmtTime(Math.round(elapsed))}
        </p>

        {/* Stats row */}
        <div
          style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12,
          }}
        >
          {[
            { label: "Score",    val: `${score}/${questions.length}`, color: g.color },
            { label: "Accuracy", val: `${accuracy}%`,                 color: "var(--p)" },
            { label: "Avg time", val: `${(avgMs / 1000).toFixed(1)}s`, color: "#8b5cf6" },
          ].map(({ label, val, color }) => (
            <div
              key={label}
              style={{
                padding: "12px 8px", borderRadius: 12,
                background: "var(--col-bg)",
                border: "0.5px solid var(--col-border)",
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 800, color }}>{val}</div>
              <div style={{ fontSize: 11, color: "var(--col-text-tertiary)", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stars */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: "2rem" }}>
        {Array.from({ length: 3 }).map((_, i) => {
          const lit = i < (score >= 9 ? 3 : score >= 7 ? 2 : score >= 5 ? 1 : 0);
          return (
            <svg
              key={i}
              width={32} height={32} viewBox="0 0 24 24"
              style={{ animation: lit ? `starBounce 0.45s ${i * 0.14}s ease both` : undefined }}
            >
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill={lit ? "#f59e0b" : "var(--col-border)"}
                stroke={lit ? "#f59e0b" : "var(--col-border)"}
                strokeWidth={1}
              />
            </svg>
          );
        })}
      </div>

      {/* Review toggle */}
      <div style={{ maxWidth: 580, margin: "0 auto" }}>
        <button
          onClick={() => setShowAll((s) => !s)}
          style={{
            width: "100%", padding: "12px", borderRadius: 12, marginBottom: 16,
            border: "1.5px solid var(--col-border)", background: "var(--col-surface)",
            color: "var(--col-text-secondary)", fontFamily: "inherit", fontSize: 14, fontWeight: 600,
            cursor: "pointer", transition: "all 0.18s",
          }}
        >
          {showAll ? "Hide" : "Review"} answers ↕
        </button>

        {showAll && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24, animation: "fadeUp 0.3s ease" }}>
            {questions.map((q, i) => {
              const a = answers[i];
              const ok = a?.isCorrect;
              return (
                <div
                  key={q.id}
                  style={{
                    padding: "14px 16px", borderRadius: 12,
                    border: `1px solid ${ok ? "#10b98130" : "#ef444430"}`,
                    background: ok ? "rgba(16,185,129,0.05)" : "rgba(239,68,68,0.05)",
                  }}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div
                      style={{
                        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                        background: ok ? "#10b981" : "#ef4444",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, color: "#fff", fontWeight: 700,
                      }}
                    >
                      {ok ? "✓" : "✗"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--col-text-primary)", marginBottom: 6 }}>
                        Q{i + 1}. {q.question}
                      </div>
                      {!ok && a?.chosen !== null && (
                        <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 3 }}>
                          Your answer: {a.chosen !== null ? q.options[a.chosen] : "—"}
                        </div>
                      )}
                      {(!ok || a?.chosen === null) && (
                        <div style={{ fontSize: 12, color: "#10b981", marginBottom: 3 }}>
                          Correct: {q.options[q.correct]}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: "var(--col-text-tertiary)", lineHeight: 1.5 }}>
                        {q.explanation}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={onRestart}
            style={{
              flex: 1, padding: "14px", borderRadius: 14, border: "none",
              background: "var(--p)", color: "#fff", fontSize: 15, fontWeight: 700,
              cursor: "pointer", transition: "all 0.18s", fontFamily: "inherit",
              boxShadow: "0 4px 18px var(--p-glow)",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)")}
          >
            Try again
          </button>
          <button
            onClick={onMenu}
            style={{
              flex: 1, padding: "14px", borderRadius: 14,
              border: "1.5px solid var(--col-border)",
              background: "var(--col-surface)", color: "var(--col-text-secondary)",
              fontSize: 15, fontWeight: 600, cursor: "pointer",
              transition: "all 0.18s", fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              const b = e.currentTarget as HTMLButtonElement;
              b.style.borderColor = "var(--p)";
              b.style.color = "var(--p)";
            }}
            onMouseLeave={(e) => {
              const b = e.currentTarget as HTMLButtonElement;
              b.style.borderColor = "var(--col-border)";
              b.style.color = "var(--col-text-secondary)";
            }}
          >
            All categories
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Root Page ────────────────────────────────────────────────────────────────

export default function QuizPage() {
  const [screen,    setScreen]    = useState<Screen>("select");
  const [category,  setCategory]  = useState<Category | null>(null);
  const [selected,  setSelected]  = useState<Category | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers,   setAnswers]   = useState<AnswerRecord[]>([]);
  const [elapsed,   setElapsed]   = useState(0);
  const elapsedRef = useRef(0);
  const elTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { isChillMode } = useChillMode();
  const { theme: nextTheme } = useNextTheme();
  const isDark = nextTheme === "dark";

  const cssVars: React.CSSProperties = {
    "--p": isChillMode ? "#ef4444" : (isDark ? "#3b82f6" : "#10b981"),
    "--p-dark": isChillMode ? "#dc2626" : (isDark ? "#2563eb" : "#059669"),
    "--p-glow": isChillMode ? "rgba(239, 68, 68, 0.22)" : (isDark ? "rgba(59, 130, 246, 0.25)" : "rgba(16, 185, 129, 0.22)"),
    "--p-sub": isChillMode ? "rgba(239, 68, 68, 0.10)" : (isDark ? "rgba(59, 130, 246, 0.12)" : "rgba(16, 185, 129, 0.10)"),
    "--col-bg": isChillMode ? (isDark ? "#000000" : "#fdfdfd") : (isDark ? "#020617" : "#fdfdfd"),
    "--col-surface": isChillMode ? (isDark ? "#000000" : "#ffffff") : (isDark ? "#0f172a" : "#ffffff"),
    "--col-border":        isDark ? "rgba(148,163,184,0.15)" : "rgba(0,0,0,0.09)",
    "--col-text-primary":  isDark ? "#f1f5f9" : "#0f172a",
    "--col-text-secondary":isDark ? "#94a3b8" : "#64748b",
    "--col-text-tertiary": isDark ? "#475569" : "#94a3b8",
  } as React.CSSProperties;

  const startGame = async () => {
    if (!selected) return;
    setCategory(selected);
    setScreen("loading");
    try {
      const qs = await fetchQuestions(selected.id);
      setQuestions(qs);
      elapsedRef.current = 0;
      setElapsed(0);
      if (elTimerRef.current) clearInterval(elTimerRef.current);
      elTimerRef.current = setInterval(() => {
        elapsedRef.current += 1;
        setElapsed(elapsedRef.current);
      }, 1000);
      setScreen("quiz");
    } catch {
      setScreen("select");
    }
  };

  const handleFinish = (recs: AnswerRecord[]) => {
    if (elTimerRef.current) { clearInterval(elTimerRef.current); elTimerRef.current = null; }
    setAnswers(recs);
    setScreen("result");
  };

  const handleRestart = async () => {
    if (!category) return;
    setSelected(category);
    setScreen("loading");
    const qs = await fetchQuestions(category.id);
    setQuestions(qs);
    elapsedRef.current = 0;
    setElapsed(0);
    if (elTimerRef.current) clearInterval(elTimerRef.current);
    elTimerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
    }, 1000);
    setScreen("quiz");
  };

  const goMenu = () => {
    if (elTimerRef.current) clearInterval(elTimerRef.current);
    setScreen("select");
    setSelected(null);
  };

  useEffect(() => () => { if (elTimerRef.current) clearInterval(elTimerRef.current); }, []);

  return (
    <>
      <style>{globalCss}</style>
      <div
        className="quiz-wrap"
        style={{
          ...cssVars,
          background: "var(--col-bg)",
        }}
      >
        {screen === "select" && (
          <CategorySelect selected={selected} setSelected={setSelected} onStart={startGame} />
        )}
        {screen === "loading" && category && (
          <LoadingScreen category={category} />
        )}
        {screen === "quiz" && category && questions.length > 0 && (
          <QuizScreen
            key={`${category.id}-${questions[0]?.id}`}
            questions={questions}
            category={category}
            onFinish={handleFinish}
          />
        )}
        {screen === "result" && category && (
          <ResultScreen
            answers={answers}
            questions={questions}
            category={category}
            elapsed={elapsed}
            onRestart={handleRestart}
            onMenu={goMenu}
          />
        )}
      </div>
    </>
  );
}
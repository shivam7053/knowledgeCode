"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

const API_BASE = "http://localhost:8000/practice";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface TestCase {
  input: string;
  expected_output: string;
  is_hidden?: boolean;
  explanation?: string;
}

interface Question {
  title: string;
  description: string;
  initial_code: string;
  solution_check?: string;
  test_cases?: TestCase[];
  examples?: { input: string; output: string; explanation?: string }[];
  constraints?: string[];
}

interface Problem {
  id?: string;
  _id?: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  language: string;
  questions: Question[];
  tags?: string[];
}

interface TestResult {
  index: number;
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  stderr: string;
  runtime: string;
  is_hidden: boolean;
}

interface Result {
  is_correct?: boolean;
  status?: string;
  message?: string;
  runtime?: string;
  stdout?: string;
  stderr?: string;
  passed?: number;
  total?: number;
  test_results?: TestResult[];
  run_only?: boolean;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const difficultyStyle: Record<string, string> = {
  Easy: "#00b8a3",
  Medium: "#ffc01e",
  Hard: "#ff375f",
};

// ─── Main Component ────────────────────────────────────────────────────────────
export default function TestWindowPage() {
  const router = useRouter();
  const params = useParams();
  const problemId = params.id as string;

  const [activeProblem, setActiveProblem] = useState<Problem | null>(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [userCodes, setUserCodes] = useState<Record<number, string>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [runLoading, setRunLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"description" | "solution" | "submissions">("description");
  const [outputTab, setOutputTab] = useState<"testcase" | "result">("testcase");
  const [selectedTestIdx, setSelectedTestIdx] = useState(0);   // which test case to preview
  const [panelHeight, setPanelHeight] = useState(60);
  const [dragging, setDragging] = useState(false);
  const [leftWidth, setLeftWidth] = useState(42);
  const [draggingH, setDraggingH] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Fetch problem ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProblem = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/problem/${problemId}`);
        if (!res.ok) throw new Error("Problem not found");
        const prob: Problem = await res.json();
        setActiveProblem(prob);
        setSelectedLanguage(prob.language);
        const codes: Record<number, string> = {};
        prob.questions?.forEach((q, idx) => { codes[idx] = q.initial_code; });
        setUserCodes(codes);
      } catch (err: any) {
        setError(err.message || "Failed to load problem.");
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [problemId]);

  // ── Vertical drag ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientY - rect.top) / rect.height) * 100;
      setPanelHeight(Math.max(25, Math.min(80, pct)));
    };
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [dragging]);

  // ── Horizontal drag ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!draggingH) return;
    const onMove = (e: MouseEvent) => {
      const pct = (e.clientX / window.innerWidth) * 100;
      setLeftWidth(Math.max(25, Math.min(60, pct)));
    };
    const onUp = () => setDraggingH(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [draggingH]);

  // ── Run (sample cases only) ────────────────────────────────────────────────
  const handleRun = async () => {
    if (!activeProblem) return;
    setRunLoading(true);
    setResult(null);
    setOutputTab("result");
    try {
      const res = await fetch(`${API_BASE}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem_id: activeProblem.id || activeProblem._id,
          question_index: activeQuestionIndex,
          language: selectedLanguage,
          code: userCodes[activeQuestionIndex] || "",
          run_only: true,
        }),
      });
      setResult(await res.json());
    } catch {
      setResult({ status: "error", message: "Failed to connect to execution engine." });
    } finally {
      setRunLoading(false);
    }
  };

  // ── Submit (all cases) ─────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!activeProblem) return;
    setSubmitLoading(true);
    setResult(null);
    setOutputTab("result");
    try {
      const res = await fetch(`${API_BASE}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem_id: activeProblem.id || activeProblem._id,
          question_index: activeQuestionIndex,
          language: selectedLanguage,
          code: userCodes[activeQuestionIndex] || "",
          run_only: false,
        }),
      });
      setResult(await res.json());
    } catch {
      setResult({ status: "error", message: "Failed to connect to execution engine." });
    } finally {
      setSubmitLoading(false);
    }
  };

  // ── Tab key in textarea ────────────────────────────────────────────────────
  const handleTab = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget;
      const { selectionStart: s, selectionEnd: end, value } = ta;
      const newVal = value.substring(0, s) + "  " + value.substring(end);
      setUserCodes(prev => ({ ...prev, [activeQuestionIndex]: newVal }));
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = s + 2; });
    }
  };

  const currentQuestion = activeProblem?.questions?.[activeQuestionIndex];
  const diffColor = activeProblem ? (difficultyStyle[activeProblem.difficulty] ?? "#ccc") : "#ccc";
  const isRunning = runLoading || submitLoading;
  const sampleCases = currentQuestion?.test_cases?.filter(tc => !tc.is_hidden) ?? [];

  // ── Loading / error states ─────────────────────────────────────────────────
  if (loading) return (
    <div style={styles.loadingWrap}>
      <div style={styles.spinner} />
      <span style={styles.loadingText}>Loading problem…</span>
    </div>
  );
  if (error) return (
    <div style={styles.loadingWrap}>
      <span style={{ color: "#ff375f", fontFamily: "'JetBrains Mono', monospace", fontSize: 14 }}>⚠ {error}</span>
    </div>
  );
  if (!activeProblem) return null;

  return (
    <div style={styles.root}>
      {/* ── TOP BAR ─────────────────────────────────────────────────────────── */}
      <header style={styles.topBar}>
        <div style={styles.topLeft}>
          <button style={styles.backBtn} onClick={() => router.back()}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Problems
          </button>
          <div style={styles.topDivider} />
          <span style={styles.topTitle}>{activeProblem.title}</span>
          <span style={{ ...styles.diffBadge, color: diffColor, borderColor: diffColor + "40", background: diffColor + "15" }}>
            {activeProblem.difficulty}
          </span>
        </div>

        <div style={styles.topRight}>
          {activeProblem.questions.length > 1 && activeProblem.questions.map((_, idx) => (
            <button
              key={idx}
              style={{ ...styles.qPill, ...(activeQuestionIndex === idx ? styles.qPillActive : {}) }}
              onClick={() => { setActiveQuestionIndex(idx); setResult(null); }}
            >
              Q{idx + 1}
            </button>
          ))}
          <div style={styles.topDivider} />
          {/* Run button */}
          <button style={styles.runBtn} onClick={handleRun} disabled={isRunning}>
            {runLoading
              ? <span style={styles.btnSpinner} />
              : <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><path d="M2 1.5l9 5-9 5V1.5z"/></svg>
            }
            Run
          </button>
          {/* Submit button */}
          <button style={styles.submitBtn} onClick={handleSubmit} disabled={isRunning}>
            {submitLoading ? <span style={{ ...styles.btnSpinner, borderTopColor: "#fff" }} /> : "Submit"}
          </button>
        </div>
      </header>

      {/* ── MAIN ────────────────────────────────────────────────────────────── */}
      <div style={styles.mainLayout}>

        {/* LEFT PANEL */}
        <div style={{ ...styles.leftPanel, width: `${leftWidth}%` }}>
          <div style={styles.tabBar}>
            {(["description", "solution", "submissions"] as const).map(tab => (
              <button
                key={tab}
                style={{ ...styles.tab, ...(activeTab === tab ? styles.tabActive : {}) }}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div style={styles.leftScroll}>
            {/* DESCRIPTION */}
            {activeTab === "description" && currentQuestion && (
              <div style={styles.descBody}>
                <h2 style={styles.questionTitle}>{currentQuestion.title || `Question ${activeQuestionIndex + 1}`}</h2>

                {activeProblem.tags && (
                  <div style={styles.tagRow}>
                    {activeProblem.tags.map(tag => <span key={tag} style={styles.tag}>{tag}</span>)}
                    <span style={{ ...styles.tag, color: "#aaa", borderColor: "#3a3a3a" }}>
                      {activeProblem.language.toUpperCase()}
                    </span>
                  </div>
                )}

                <div style={styles.descText}>
                  {currentQuestion.description?.split("\n").map((line, i) => (
                    <p key={i} style={{ margin: "0 0 10px 0" }}>{line || <br />}</p>
                  ))}
                </div>

                {/* Examples (from test_cases or explicit examples array) */}
                {(currentQuestion.examples?.length
                  ? currentQuestion.examples
                  : (currentQuestion.test_cases?.filter(tc => !tc.is_hidden).map(tc => ({
                      input: tc.input, output: tc.expected_output, explanation: tc.explanation,
                    })) ?? [])
                ).map((ex, i) => (
                  <div key={i} style={styles.exampleBlock}>
                    <div style={styles.exampleLabel}>Example {i + 1}</div>
                    <div style={styles.exampleBox}>
                      {ex.input && <div><span style={styles.exKey}>Input:</span><span style={styles.exVal}>{ex.input}</span></div>}
                      <div><span style={styles.exKey}>Output:</span><span style={styles.exVal}>{ex.output}</span></div>
                      {ex.explanation && <div style={{ marginTop: 6, color: "#888", fontSize: 13 }}>💡 {ex.explanation}</div>}
                    </div>
                  </div>
                ))}

                {currentQuestion.constraints && currentQuestion.constraints.length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <div style={styles.constraintLabel}>Constraints</div>
                    <ul style={styles.constraintList}>
                      {currentQuestion.constraints.map((c, i) => (
                        <li key={i} style={styles.constraintItem}><code style={styles.inlineCode}>{c}</code></li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === "solution" && (
              <div style={styles.descBody}>
                <p style={{ color: "#666", fontSize: 14, lineHeight: 1.7 }}>
                  Solutions become available after submitting a correct answer.
                </p>
              </div>
            )}

            {activeTab === "submissions" && (
              <div style={styles.descBody}>
                <p style={{ color: "#666", fontSize: 14 }}>No submissions yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* HORIZONTAL DRAG */}
        <div style={styles.hDivider} onMouseDown={(e) => { e.preventDefault(); setDraggingH(true); }}>
          <div style={styles.hDividerDot} />
        </div>

        {/* RIGHT PANEL */}
        <div style={{ ...styles.rightPanel, width: `${100 - leftWidth}%` }} ref={containerRef}>

          {/* EDITOR */}
          <div style={{ height: `${panelHeight}%`, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={styles.editorTopBar}>
              <div style={styles.langSelectWrapper}>
                <select style={styles.langSelect} value={selectedLanguage} onChange={e => setSelectedLanguage(e.target.value)}>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="javascript">JavaScript</option>
                  <option value="cpp">C++</option>
                  <option value="sql">SQL</option>
                </select>
              </div>
              <button style={styles.resetBtn} onClick={() =>
                setUserCodes(prev => ({ ...prev, [activeQuestionIndex]: currentQuestion?.initial_code || "" }))
              }>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6a4 4 0 1 1 .8 2.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M2 9V6h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Reset
              </button>
            </div>

            <div style={styles.editorWrap}>
              <div style={styles.lineNumbers}>
                {(userCodes[activeQuestionIndex] || "").split("\n").map((_, i) => (
                  <div key={i} style={styles.lineNum}>{i + 1}</div>
                ))}
              </div>
              <textarea
                ref={textareaRef}
                style={styles.textarea}
                value={userCodes[activeQuestionIndex] || ""}
                onChange={e => setUserCodes(prev => ({ ...prev, [activeQuestionIndex]: e.target.value }))}
                onKeyDown={handleTab}
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
              />
            </div>
          </div>

          {/* VERTICAL DRAG */}
          <div style={styles.vDivider} onMouseDown={(e) => { e.preventDefault(); setDragging(true); }}>
            <div style={styles.vDividerLine} />
          </div>

          {/* OUTPUT PANEL */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={styles.outputTabBar}>
              <button
                style={{ ...styles.outputTab, ...(outputTab === "testcase" ? styles.outputTabActive : {}) }}
                onClick={() => setOutputTab("testcase")}
              >Test Cases</button>
              <button
                style={{ ...styles.outputTab, ...(outputTab === "result" ? styles.outputTabActive : {}) }}
                onClick={() => setOutputTab("result")}
              >
                Result
                {result && (
                  <span style={{
                    marginLeft: 6, width: 7, height: 7, borderRadius: "50%",
                    display: "inline-block",
                    background: result.is_correct ? "#00b8a3" : "#ff375f",
                    verticalAlign: "middle",
                  }} />
                )}
              </button>
            </div>

            <div style={styles.outputBody}>
              {/* ── TEST CASES TAB ── */}
              {outputTab === "testcase" && (
                <div style={{ padding: "14px 18px" }}>
                  {sampleCases.length > 0 ? (
                    <>
                      {/* Case selector pills */}
                      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                        {sampleCases.map((_, i) => (
                          <button
                            key={i}
                            style={{
                              ...styles.casePill,
                              ...(selectedTestIdx === i ? styles.casePillActive : {}),
                            }}
                            onClick={() => setSelectedTestIdx(i)}
                          >
                            Case {i + 1}
                          </button>
                        ))}
                      </div>
                      {/* Selected case */}
                      {sampleCases[selectedTestIdx] && (
                        <>
                          <div style={styles.caseLabel}>Input</div>
                          <div style={styles.caseBox}>
                            <pre style={{ margin: 0 }}>{sampleCases[selectedTestIdx].input || "(no input)"}</pre>
                          </div>
                          <div style={{ ...styles.caseLabel, marginTop: 12 }}>Expected Output</div>
                          <div style={styles.caseBox}>
                            <pre style={{ margin: 0 }}>{sampleCases[selectedTestIdx].expected_output}</pre>
                          </div>
                          {sampleCases[selectedTestIdx].explanation && (
                            <>
                              <div style={{ ...styles.caseLabel, marginTop: 12 }}>Explanation</div>
                              <div style={{ ...styles.caseBox, color: "#888", fontFamily: "inherit" }}>
                                {sampleCases[selectedTestIdx].explanation}
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <p style={{ color: "#555", fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
                      No sample test cases defined for this question.
                    </p>
                  )}
                </div>
              )}

              {/* ── RESULT TAB ── */}
              {outputTab === "result" && (
                <div style={{ padding: "14px 18px" }}>
                  {isRunning && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#888" }}>
                      <div style={styles.spinner} />
                      <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
                        {submitLoading ? "Running all test cases…" : "Running sample cases…"}
                      </span>
                    </div>
                  )}

                  {!isRunning && !result && (
                    <p style={{ color: "#555", fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
                      Click <strong style={{ color: "#aaa" }}>Run</strong> to test against sample cases, or{" "}
                      <strong style={{ color: "#00b8a3" }}>Submit</strong> to evaluate against all test cases.
                    </p>
                  )}

                  {!isRunning && result && (
                    <>
                      {/* Status header */}
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                        <div style={{
                          fontSize: 20, fontWeight: 800,
                          fontFamily: "'JetBrains Mono', monospace",
                          color: result.is_correct ? "#00b8a3" : "#ff375f",
                        }}>
                          {result.is_correct ? "✓ Accepted" : "✗ " + (result.status === "wrong_answer" ? "Wrong Answer" : "Error")}
                        </div>
                        {result.run_only && (
                          <span style={styles.runOnlyBadge}>Sample Run</span>
                        )}
                      </div>

                      {/* Stats row */}
                      <div style={styles.resultStatRow}>
                        {result.total !== undefined && (
                          <div style={styles.resultStat}>
                            <div style={styles.statLabel}>Test Cases</div>
                            <div style={styles.statValue}>{result.passed}/{result.total}</div>
                          </div>
                        )}
                        {result.runtime && (
                          <div style={styles.resultStat}>
                            <div style={styles.statLabel}>Avg Runtime</div>
                            <div style={styles.statValue}>{result.runtime}</div>
                          </div>
                        )}
                      </div>

                      {/* Per-test-case breakdown */}
                      {result.test_results && result.test_results.length > 0 && (
                        <div style={{ marginTop: 16 }}>
                          <div style={styles.caseLabel}>Test Case Results</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                            {result.test_results.map((tr, i) => (
                              <TestCaseCard key={i} tr={tr} index={i} />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Bare stdout (no test cases) */}
                      {result.stdout && (!result.test_results || result.test_results.length === 0) && (
                        <div style={{ marginTop: 12 }}>
                          <div style={styles.caseLabel}>Output</div>
                          <pre style={styles.codeBlock}>{result.stdout}</pre>
                        </div>
                      )}

                      {/* Stderr */}
                      {result.stderr && (
                        <div style={{ marginTop: 12 }}>
                          <div style={styles.caseLabel}>Error</div>
                          <pre style={{ ...styles.codeBlock, color: "#ff375f", borderLeft: "3px solid #ff375f" }}>
                            {result.stderr}
                          </pre>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Test Case Card ────────────────────────────────────────────────────────────
function TestCaseCard({ tr, index }: { tr: TestResult; index: number }) {
  const [open, setOpen] = useState(!tr.passed);

  return (
    <div style={{
      border: `1px solid ${tr.passed ? "#1e3a2e" : "#3a1e1e"}`,
      borderRadius: 8,
      overflow: "hidden",
      background: tr.passed ? "#0f1f18" : "#1f0f0f",
    }}>
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 14px", background: "none", border: "none", cursor: "pointer",
          color: tr.passed ? "#00b8a3" : "#ff375f",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
            {tr.passed ? "✓" : "✗"} Case {index + 1}
          </span>
          {tr.is_hidden && (
            <span style={{ fontSize: 11, color: "#666", background: "#222", padding: "1px 6px", borderRadius: 10, border: "1px solid #333" }}>
              Hidden
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#555", fontFamily: "'JetBrains Mono', monospace" }}>{tr.runtime}</span>
          <span style={{ fontSize: 12, color: "#555" }}>{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* Detail */}
      {open && (
        <div style={{ padding: "4px 14px 14px", borderTop: `1px solid ${tr.passed ? "#1e3a2e" : "#3a1e1e"}` }}>
          {!tr.is_hidden && (
            <>
              <TwoCol label="Input" value={tr.input} />
              <TwoCol label="Expected" value={tr.expected} color="#00b8a3" />
            </>
          )}
          <TwoCol label="Your Output" value={tr.actual || "(empty)"} color={tr.passed ? "#00b8a3" : "#ff375f"} />
          {tr.stderr && <TwoCol label="Error" value={tr.stderr} color="#ff375f" />}
        </div>
      )}
    </div>
  );
}

function TwoCol({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4, fontWeight: 700 }}>
        {label}
      </div>
      <pre style={{
        margin: 0, background: "#111", borderRadius: 6, padding: "8px 12px",
        fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
        color: color ?? "#ccc", whiteSpace: "pre-wrap", wordBreak: "break-all",
      }}>
        {value}
      </pre>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  root: {
    display: "flex", flexDirection: "column", height: "100vh",
    background: "#1a1a1a", color: "#e0e0e0",
    fontFamily: "'Inter', -apple-system, sans-serif", overflow: "hidden",
  },
  topBar: {
    height: 44, background: "#262626", borderBottom: "1px solid #2e2e2e",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 12px", flexShrink: 0, gap: 8,
  },
  topLeft: { display: "flex", alignItems: "center", gap: 10, minWidth: 0 },
  topRight: { display: "flex", alignItems: "center", gap: 8, flexShrink: 0 },
  backBtn: {
    display: "flex", alignItems: "center", gap: 5, background: "none", border: "none",
    color: "#aaa", fontSize: 13, cursor: "pointer", padding: "4px 8px", borderRadius: 5,
  },
  topTitle: {
    fontSize: 13, fontWeight: 600, color: "#e0e0e0",
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 300,
  },
  topDivider: { width: 1, height: 20, background: "#333", flexShrink: 0 },
  diffBadge: {
    fontSize: 11, fontWeight: 600, padding: "2px 8px",
    borderRadius: 20, border: "1px solid", flexShrink: 0,
  },
  qPill: {
    background: "#2e2e2e", border: "1px solid #3a3a3a", color: "#aaa",
    fontSize: 12, fontWeight: 600, borderRadius: 5, padding: "3px 10px", cursor: "pointer",
  },
  qPillActive: { background: "#3a3a3a", color: "#fff", borderColor: "#555" },
  runBtn: {
    display: "flex", alignItems: "center", gap: 6, background: "#2e2e2e",
    border: "1px solid #3a3a3a", color: "#ccc", fontSize: 13, fontWeight: 600,
    borderRadius: 6, padding: "5px 14px", cursor: "pointer",
  },
  submitBtn: {
    display: "flex", alignItems: "center", gap: 6,
    background: "#00b8a3", border: "none", color: "#fff", fontSize: 13,
    fontWeight: 700, borderRadius: 6, padding: "5px 16px", cursor: "pointer",
  },
  btnSpinner: {
    width: 12, height: 12, border: "2px solid #555",
    borderTop: "2px solid #ccc", borderRadius: "50%",
    animation: "spin 0.8s linear infinite", display: "inline-block",
  },
  mainLayout: { flex: 1, display: "flex", minHeight: 0, overflow: "hidden" },
  leftPanel: {
    display: "flex", flexDirection: "column", background: "#1e1e1e",
    borderRight: "1px solid #2a2a2a", minWidth: 280, minHeight: 0, overflow: "hidden",
  },
  tabBar: { display: "flex", background: "#1a1a1a", borderBottom: "1px solid #2a2a2a", flexShrink: 0 },
  tab: {
    background: "none", border: "none", borderBottom: "2px solid transparent",
    color: "#666", fontSize: 13, fontWeight: 500, padding: "10px 18px", cursor: "pointer",
  },
  tabActive: { color: "#e0e0e0", borderBottomColor: "#00b8a3" },
  leftScroll: { flex: 1, overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: "#333 transparent" },
  descBody: { padding: "24px 20px" },
  questionTitle: { fontSize: 17, fontWeight: 700, color: "#e8e8e8", marginBottom: 12, letterSpacing: "-0.3px" },
  tagRow: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 },
  tag: { fontSize: 11, fontWeight: 500, padding: "3px 9px", borderRadius: 20, border: "1px solid #3a3a3a", color: "#888", background: "#272727" },
  descText: { fontSize: 14, lineHeight: 1.8, color: "#c0c0c0", marginBottom: 20 },
  exampleBlock: { marginBottom: 16 },
  exampleLabel: { fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 },
  exampleBox: {
    background: "#252525", border: "1px solid #2e2e2e", borderRadius: 8,
    padding: "12px 14px", fontSize: 13, lineHeight: 1.8,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  },
  exKey: { fontWeight: 700, color: "#999", marginRight: 8 },
  exVal: { color: "#e0e0e0" },
  constraintLabel: { fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 },
  constraintList: { margin: 0, paddingLeft: 20 },
  constraintItem: { color: "#aaa", fontSize: 13, lineHeight: 2 },
  inlineCode: { background: "#252525", padding: "1px 6px", borderRadius: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#d0d0d0" },
  hDivider: {
    width: 5, background: "#1a1a1a", cursor: "col-resize", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10,
  },
  hDividerDot: { width: 3, height: 30, borderRadius: 4, background: "#333" },
  vDivider: {
    height: 6, background: "#1a1a1a", cursor: "row-resize", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  vDividerLine: { width: 40, height: 3, borderRadius: 4, background: "#333" },
  rightPanel: {
    display: "flex", flexDirection: "column", minWidth: 300,
    minHeight: 0, background: "#1a1a1a", overflow: "hidden",
  },
  editorTopBar: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "6px 14px", background: "#222", borderBottom: "1px solid #2a2a2a", flexShrink: 0,
  },
  langSelectWrapper: { display: "flex", alignItems: "center" },
  langSelect: {
    background: "#2a2a2a", color: "#e0e0e0", border: "1px solid #3a3a3a",
    borderRadius: "4px", padding: "2px 6px", fontSize: 11, fontWeight: 600,
    outline: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif",
  },
  resetBtn: {
    display: "flex", alignItems: "center", gap: 5, background: "none", border: "none",
    color: "#666", fontSize: 12, cursor: "pointer", padding: "3px 8px", borderRadius: 5,
  },
  editorWrap: {
    flex: 1, display: "flex", overflow: "auto", background: "#1a1a1a",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: 13.5, lineHeight: "21px",
    scrollbarWidth: "thin", scrollbarColor: "#333 transparent",
  },
  lineNumbers: {
    padding: "16px 12px 16px 16px", minWidth: 40, textAlign: "right",
    userSelect: "none", color: "#444", fontSize: 13, lineHeight: "21px",
    background: "#1a1a1a", flexShrink: 0,
  },
  lineNum: { height: "21px" },
  textarea: {
    flex: 1, background: "transparent", border: "none", outline: "none",
    resize: "none", color: "#d4d4d4", fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: 13.5, lineHeight: "21px", padding: "16px 20px 16px 8px",
    caretColor: "#00b8a3", whiteSpace: "pre", overflowWrap: "normal", overflow: "auto",
  },
  outputTabBar: {
    display: "flex", background: "#1e1e1e",
    borderTop: "1px solid #2a2a2a", borderBottom: "1px solid #2a2a2a", flexShrink: 0,
  },
  outputTab: {
    background: "none", border: "none", borderBottom: "2px solid transparent",
    color: "#666", fontSize: 13, fontWeight: 500, padding: "9px 16px",
    cursor: "pointer", display: "flex", alignItems: "center",
  },
  outputTabActive: { color: "#e0e0e0", borderBottomColor: "#00b8a3" },
  outputBody: {
    flex: 1, overflowY: "auto", scrollbarWidth: "thin",
    scrollbarColor: "#333 transparent", background: "#1a1a1a",
  },
  casePill: {
    background: "#252525", border: "1px solid #333", color: "#888",
    fontSize: 12, fontWeight: 600, borderRadius: 6, padding: "4px 12px", cursor: "pointer",
  },
  casePillActive: { background: "#2e2e2e", color: "#e0e0e0", borderColor: "#00b8a3" },
  caseLabel: { fontSize: 11, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 },
  caseBox: {
    background: "#222", border: "1px solid #2e2e2e", borderRadius: 6,
    padding: "10px 14px", fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13, color: "#ccc", lineHeight: 1.6,
  },
  resultStatRow: { display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" },
  resultStat: { background: "#222", border: "1px solid #2e2e2e", borderRadius: 8, padding: "10px 16px", minWidth: 90 },
  statLabel: { fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#e0e0e0" },
  runOnlyBadge: {
    fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
    border: "1px solid #ffc01e40", color: "#ffc01e", background: "#ffc01e15",
  },
  codeBlock: {
    background: "#0d0d0d", padding: "12px", borderRadius: "6px",
    fontFamily: "'JetBrains Mono', monospace", fontSize: "13px",
    color: "#d1d1d1", overflow: "auto", margin: "8px 0",
    border: "1px solid #2a2a2a", whiteSpace: "pre-wrap",
  },
  loadingWrap: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", height: "100vh", background: "#1a1a1a", gap: 16,
  },
  spinner: {
    width: 22, height: 22, border: "2.5px solid #2e2e2e",
    borderTop: "2.5px solid #00b8a3", borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: { color: "#555", fontSize: 13, fontFamily: "'JetBrains Mono', monospace" },
};
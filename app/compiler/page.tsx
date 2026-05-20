"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Box, Container, Typography, Paper, TextField, Button, Stack,
  MenuItem, Select, FormControl, InputLabel, Tab, Tabs,
  CircularProgress, IconButton, Tooltip, Chip
} from "@mui/material"; // Import useTheme
import {
  PlayArrow as RunIcon,
  Code as CodeIcon,
  Web as WebIcon,
  DeleteSweep as ClearIcon,
  ContentCopy as CopyIcon,
  Terminal as TerminalIcon,
  FiberManualRecord as DotIcon,
} from "@mui/icons-material";
import { alpha, useTheme } from '@mui/material/styles'; // Import alpha for transparency

const API_BASE = "http://localhost:8000/practice";

const STARTER_TEMPLATES: Record<string, string> = {
  python:     "# Python Online Compiler\nprint('Hello, KnowledgeCode!')\n",
  javascript: "// Node.js Runtime\nconsole.log('Hello from Node!');\n",
  java:       "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello from Java!\");\n    }\n}\n",
  cpp:        "#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << \"Hello from C++!\" << endl;\n    return 0;\n}\n",
};

const LANG_COLORS: Record<string, string> = {
  python: "#3b82f6",
  javascript: "#f59e0b",
  java: "#ef4444",
  cpp: "#8b5cf6",
  web: "#10b981",
};

const LANG_LABELS: Record<string, string> = {
  python: "Python 3",
  javascript: "Node.js",
  java: "Java 17",
  cpp: "C++ (GCC)",
  web: "HTML/CSS/JS",
};

export default function OnlineCompiler() {
  const theme = useTheme(); // Initialize useTheme
  const [lang, setLang] = useState("python");
  const [code, setCode] = useState(STARTER_TEMPLATES["python"]);
  const [stdin, setStdin] = useState("");
  const [html, setHtml] = useState("<h1>Hello World</h1>\n<p>Start editing to see your changes</p>");
  const [css, setCss] = useState("body {\n  font-family: sans-serif;\n  background: #0f172a;\n  color: #e2e8f0;\n  padding: 2rem;\n}\nh1 { color: #3b82f6; }\n");
  const [js, setJs] = useState("// Your JS here\nconsole.log('Web Preview Loaded');");
  const [webTab, setWebTab] = useState(0);
  const [output, setOutput] = useState("");
  const [stderr, setStderr] = useState("");
  const [loading, setLoading] = useState(false);
  const [executionTime, setExecutionTime] = useState("");
  const [copied, setCopied] = useState(false);
  const [lineCount, setLineCount] = useState(1);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLineCount((code.match(/\n/g) || []).length + 1);
  }, [code]);

  const handleLangChange = (newLang: string) => {
    setLang(newLang);
    if (STARTER_TEMPLATES[newLang]) setCode(STARTER_TEMPLATES[newLang]);
    setOutput(""); setStderr(""); setExecutionTime("");
  };

  const handleRun = async () => {
    if (lang === "web") return;
    setLoading(true); setOutput(""); setStderr("");
    try {
      const res = await fetch(`${API_BASE}/run-compiler`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: lang, code, stdin }),
      });
      const data = await res.json();
      setOutput(data.stdout || "");
      setStderr(data.stderr || "");
      setExecutionTime(data.time || "");
    } catch {
      setStderr("⚠ Failed to connect to execution server.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output || code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const srcDoc = useMemo(() => `
    <html><style>${css}</style>
    <body>${html}<script>${js}<\/script></body></html>
  `, [html, css, js]);

  const accentColor = LANG_COLORS[lang] || "#3b82f6";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #070b14;
          color: #e2e8f0;
          font-family: 'Space Grotesk', sans-serif;
        }

        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #0f172a; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: #475569; }

        .compiler-root {
          min-height: 100vh;
          background: #070b14;
          background-image:
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59, 130, 246, 0.08) 0%, transparent 60%),
            radial-gradient(ellipse 40% 30% at 80% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 50%);
          padding: 1.5rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          height: 100vh;
          overflow: hidden;
        }

        /* HEADER */
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }
        .header-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .brand-icon {
          width: 38px; height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.35);
        }
        .brand-text {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.35rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #f1f5f9;
        }
        .brand-badge {
          font-size: 0.6rem;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(59, 130, 246, 0.15);
          color: #60a5fa;
          border: 1px solid rgba(59, 130, 246, 0.25);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-left: 0.5rem;
          vertical-align: middle;
        }
        .header-controls {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        /* LANG PILLS */
        .lang-pills {
          display: flex;
          gap: 0.375rem;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 4px;
        }
        .lang-pill {
          padding: 5px 14px;
          border-radius: 9px;
          font-size: 0.78rem;
          font-weight: 500;
          font-family: 'Space Grotesk', sans-serif;
          cursor: pointer;
          border: none;
          transition: all 0.18s ease;
          color: #64748b;
          background: transparent;
          letter-spacing: 0.01em;
        }
        .lang-pill:hover { color: #94a3b8; background: rgba(255,255,255,0.04); }
        .lang-pill.active {
          color: #fff;
          background: var(--accent, #3b82f6);
          box-shadow: 0 2px 12px rgba(var(--accent-rgb, 59,130,246), 0.4);
        }

        /* RUN BUTTON */
        .run-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 8px 22px;
          border-radius: 10px;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          border: none;
          letter-spacing: 0.02em;
          transition: all 0.2s ease;
          background: var(--accent, #3b82f6);
          color: #fff;
          box-shadow: 0 2px 16px rgba(59, 130, 246, 0.35);
        }
        .run-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 24px rgba(59, 130, 246, 0.5);
          filter: brightness(1.1);
        }
        .run-btn:active:not(:disabled) { transform: translateY(0); }
        .run-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* WORKSPACE */
        .workspace {
          display: flex;
          gap: 1rem;
          flex: 1;
          min-height: 0;
        }

        /* EDITOR PANEL */
        .editor-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #0d1420;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          overflow: hidden;
          min-width: 0;
        }
        .panel-titlebar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: #0a1020;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          flex-shrink: 0;
        }
        .titlebar-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .traffic-lights {
          display: flex;
          gap: 5px;
        }
        .tl { width: 10px; height: 10px; border-radius: 50%; }
        .tl-red    { background: #ff5f57; }
        .tl-yellow { background: #febc2e; }
        .tl-green  { background: #28c840; }
        .panel-label {
          font-size: 0.72rem;
          font-weight: 600;
          color: #475569;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .lang-indicator {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.7rem;
          padding: 2px 8px;
          border-radius: 5px;
          background: rgba(255,255,255,0.04);
          color: var(--accent, #3b82f6);
          border: 1px solid rgba(255,255,255,0.06);
        }
        .titlebar-actions { display: flex; gap: 4px; }
        .icon-btn {
          width: 28px; height: 28px;
          border-radius: 7px;
          border: none;
          background: transparent;
          color: #475569;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px;
          transition: all 0.15s;
        }
        .icon-btn:hover { background: rgba(255,255,255,0.06); color: #94a3b8; }

        /* CODE AREA */
        .code-area {
          display: flex;
          flex: 1;
          min-height: 0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13.5px;
          line-height: 1.7;
        }
        .line-numbers {
          padding: 16px 0;
          width: 46px;
          text-align: right;
          color: #2d4060;
          font-size: 12px;
          user-select: none;
          background: #0a1020;
          border-right: 1px solid rgba(255,255,255,0.04);
          overflow: hidden;
          flex-shrink: 0;
        }
        .line-num {
          padding: 0 10px 0 0;
          height: calc(13.5px * 1.7);
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }
        .code-textarea {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          resize: none;
          color: #c9d8f0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13.5px;
          line-height: 1.7;
          padding: 16px;
          tab-size: 2;
          caret-color: var(--accent, #3b82f6);
        }
        .code-textarea::selection { background: rgba(59, 130, 246, 0.2); }
        .code-textarea::placeholder { color: #2d4060; }

        /* WEB TABS */
        .web-tabs {
          display: flex;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          background: #0a1020;
          padding: 0 8px;
          gap: 2px;
          flex-shrink: 0;
        }
        .web-tab {
          padding: 10px 16px;
          border: none;
          background: transparent;
          color: #475569;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.15s;
          margin-bottom: -1px;
        }
        .web-tab:hover { color: #94a3b8; }
        .web-tab.active { color: var(--accent, #3b82f6); border-bottom-color: var(--accent, #3b82f6); }

        /* RIGHT PANEL */
        .right-panel {
          width: 42%;
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
          min-width: 0;
        }

        /* STDIN */
        .stdin-panel {
          background: #0d1420;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          overflow: hidden;
          flex-shrink: 0;
          height: 130px;
          display: flex;
          flex-direction: column;
        }
        .stdin-area {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          resize: none;
          color: #94a3b8;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12.5px;
          padding: 10px 14px;
          line-height: 1.6;
        }
        .stdin-area::placeholder { color: #2d3f57; }

        /* TERMINAL */
        .terminal-panel {
          background: #080e18;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          overflow: hidden;
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .terminal-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 27px,
            rgba(255,255,255,0.012) 27px,
            rgba(255,255,255,0.012) 28px
          );
          pointer-events: none;
          border-radius: 14px;
        }
        .terminal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 9px 14px;
          background: rgba(5, 9, 18, 0.8);
          border-bottom: 1px solid rgba(255,255,255,0.04);
          backdrop-filter: blur(10px);
          flex-shrink: 0;
          z-index: 1;
        }
        .terminal-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .terminal-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: var(--accent, #3b82f6);
          box-shadow: 0 0 6px var(--accent, #3b82f6);
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .terminal-title {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.7rem;
          font-weight: 500;
          color: #475569;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .exec-time {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.68rem;
          color: #334155;
          background: rgba(255,255,255,0.03);
          padding: 2px 8px;
          border-radius: 5px;
        }
        .terminal-body {
          flex: 1;
          overflow-y: auto;
          padding: 14px 16px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          line-height: 1.65;
          position: relative;
          z-index: 1;
        }
        .terminal-prompt {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
          opacity: 0.4;
        }
        .prompt-arrow { color: #3b82f6; }
        .output-text {
          color: #8cc8ff;
          white-space: pre-wrap;
          word-break: break-all;
        }
        .error-text {
          color: #f87171;
          white-space: pre-wrap;
          word-break: break-all;
        }
        .empty-msg {
          color: #2d4060;
          font-style: italic;
          font-size: 12px;
          margin-top: 8px;
        }
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 12px;
          color: #475569;
        }
        .loading-spinner {
          width: 28px; height: 28px;
          border: 2px solid rgba(59, 130, 246, 0.15);
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-text { font-size: 0.78rem; letter-spacing: 0.05em; }

        /* STATUS BAR */
        .status-bar {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 6px 0;
          flex-shrink: 0;
        }
        .status-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.68rem;
          color: #334155;
        }
        .status-dot { width: 5px; height: 5px; border-radius: 50%; }

        /* PREVIEW PANEL */
        .preview-panel {
          flex: 1;
          background: #0d1420;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        .preview-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 14px;
          background: #0a1020;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          flex-shrink: 0;
        }
        .preview-dot { width: 7px; height: 7px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981; }
        .preview-url {
          flex: 1;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 6px;
          padding: 3px 10px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.7rem;
          color: #475569;
        }
        iframe { flex: 1; border: none; background: white; }
      `}</style>

      <div
        className="compiler-root"
        style={{ "--accent": accentColor, "--accent-rgb": accentColor === "#3b82f6" ? "59,130,246" : "139,92,246" } as React.CSSProperties}
      >
        {/* HEADER */}
        <div className="header">
          <div className="header-brand">
            <div className="brand-icon">⌥</div>
            <div>
              <span className="brand-text">KnowledgeCode</span>
              <span className="brand-badge">IDE</span>
            </div>
          </div>

          <div className="header-controls">
            <div className="lang-pills">
              {Object.keys(STARTER_TEMPLATES).map(l => (
                <button
                  key={l}
                  className={`lang-pill ${lang === l ? "active" : ""}`}
                  style={lang === l ? { background: LANG_COLORS[l], boxShadow: `0 2px 12px ${LANG_COLORS[l]}55` } : {}}
                  onClick={() => handleLangChange(l)}
                >
                  {LANG_LABELS[l]}
                </button>
              ))}
              <button
                className={`lang-pill ${lang === "web" ? "active" : ""}`}
                style={lang === "web" ? { background: LANG_COLORS["web"], boxShadow: `0 2px 12px ${LANG_COLORS["web"]}55` } : {}}
                onClick={() => handleLangChange("web")}
              >
                Web
              </button>
            </div>

            {lang !== "web" && (
              <button className="run-btn" onClick={handleRun} disabled={loading}
                style={{ background: accentColor, boxShadow: `0 2px 16px ${accentColor}55` }}>
                {loading
                  ? <><div className="loading-spinner" style={{ width: 14, height: 14 }} />Running</>
                  : <><span style={{ fontSize: 16 }}>▶</span>Run</>
                }
              </button>
            )}
          </div>
        </div>

        {/* WORKSPACE */}
        <div className="workspace">
          {/* EDITOR */}
          <div className="editor-panel">
            <div className="panel-titlebar">
              <div className="titlebar-left">
                <div className="traffic-lights">
                  <div className="tl tl-red" />
                  <div className="tl tl-yellow" />
                  <div className="tl tl-green" />
                </div>
                <span className="panel-label">Editor</span>
                {lang !== "web" && (
                  <span className="lang-indicator">{LANG_LABELS[lang]}</span>
                )}
              </div>
              <div className="titlebar-actions">
                <button className="icon-btn" onClick={() => { setCode(""); }} title="Clear">
                  <ClearIcon style={{ fontSize: 14 }} />
                </button>
                <button className="icon-btn" onClick={handleCopy} title="Copy">
                  <CopyIcon style={{ fontSize: 14 }} />
                </button>
              </div>
            </div>

            {lang === "web" ? (
              <>
                <div className="web-tabs">
                  {["HTML", "CSS", "JS"].map((t, i) => (
                    <button key={t} className={`web-tab ${webTab === i ? "active" : ""}`} onClick={() => setWebTab(i)}>
                      {t}
                    </button>
                  ))}
                </div>
                <div className="code-area">
                  <div className="line-numbers">
                    {(webTab === 0 ? html : webTab === 1 ? css : js).split("\n").map((_, i) => (
                      <div key={i} className="line-num">{i + 1}</div>
                    ))}
                  </div>
                  <textarea
                    className="code-textarea"
                    value={webTab === 0 ? html : webTab === 1 ? css : js}
                    onChange={e => {
                      if (webTab === 0) setHtml(e.target.value);
                      else if (webTab === 1) setCss(e.target.value);
                      else setJs(e.target.value);
                    }}
                    spellCheck={false}
                  />
                </div>
              </>
            ) : (
              <div className="code-area">
                <div className="line-numbers">
                  {Array.from({ length: lineCount }, (_, i) => (
                    <div key={i} className="line-num">{i + 1}</div>
                  ))}
                </div>
                <textarea
                  className="code-textarea"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="// Start coding..."
                  spellCheck={false}
                  onKeyDown={e => {
                    if (e.key === "Tab") {
                      e.preventDefault();
                      const { selectionStart, selectionEnd } = e.currentTarget;
                      const newCode = code.substring(0, selectionStart) + "  " + code.substring(selectionEnd);
                      setCode(newCode);
                      setTimeout(() => {
                        e.currentTarget.selectionStart = e.currentTarget.selectionEnd = selectionStart + 2;
                      }, 0);
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* RIGHT PANEL */}
          <div className="right-panel">
            {lang === "web" ? (
              <div className="preview-panel">
                <div className="preview-header">
                  <div className="preview-dot" />
                  <div className="preview-url">localhost:3000 — preview</div>
                  <span style={{ fontSize: "0.7rem", color: "#10b981", fontFamily: "JetBrains Mono", fontWeight: 600 }}>LIVE</span>
                </div>
                <iframe title="preview" srcDoc={srcDoc} sandbox="allow-scripts" />
              </div>
            ) : (
              <>
                {/* STDIN */}
                <div className="stdin-panel">
                  <div className="panel-titlebar">
                    <div className="titlebar-left">
                      <span className="panel-label">Stdin</span>
                    </div>
                  </div>
                  <textarea
                    className="stdin-area"
                    value={stdin}
                    onChange={e => setStdin(e.target.value)}
                    placeholder="Program input (optional)..."
                    spellCheck={false}
                  />
                </div>

                {/* TERMINAL */}
                <div className="terminal-panel">
                  <div className="terminal-header">
                    <div className="terminal-left">
                      <div className="terminal-dot" />
                      <span className="terminal-title">Terminal Output</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {executionTime && <span className="exec-time">⏱ {executionTime}</span>}
                      <button className="icon-btn" onClick={handleCopy} title="Copy output">
                        {copied ? "✓" : <CopyIcon style={{ fontSize: 13 }} />}
                      </button>
                    </div>
                  </div>
                  <div className="terminal-body" ref={outputRef}>
                    {loading ? (
                      <div className="loading-state">
                        <div className="loading-spinner" />
                        <span className="loading-text">Compiling & executing...</span>
                      </div>
                    ) : (
                      <>
                        <div className="terminal-prompt">
                          <span className="prompt-arrow">❯</span>
                          <span style={{ fontFamily: "JetBrains Mono", fontSize: 12, color: "#334155" }}>
                            {LANG_LABELS[lang].toLowerCase()} main.{lang === "javascript" ? "js" : lang === "python" ? "py" : lang === "java" ? "java" : "cpp"}
                          </span>
                        </div>
                        {output && <pre className="output-text">{output}</pre>}
                        {stderr && <pre className="error-text">{stderr}</pre>}
                        {!output && !stderr && (
                          <p className="empty-msg">// Output will appear here after running...</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* STATUS BAR */}
        <div className="status-bar">
          <div className="status-item">
            <div className="status-dot" style={{ background: "#10b981" }} />
            Ready
          </div>
          {lang !== "web" && (
            <div className="status-item">
              <span>Ln {lineCount}</span>
            </div>
          )}
          <div className="status-item">
            <span>UTF-8</span>
          </div>
          <div className="status-item" style={{ color: accentColor }}>
            <span>{LANG_LABELS[lang]}</span>
          </div>
        </div>
      </div>
    </>
  );
}
"use client";

import {
  useState, useEffect, useCallback,
  useRef, useMemo,
} from "react";
import { DIFFICULTY_CONFIG, fetchPuzzle } from "./puzzledata";
import type { Puzzle, CellType } from "./puzzledata";

// ─── Types ────────────────────────────────────────────────────────────────────

type Difficulty = "easy" | "medium" | "hard";
type Screen = "select" | "loading" | "playing" | "win" | "lose";
type Direction = "up" | "down" | "left" | "right" | null;

interface Pos { r: number; c: number; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findCell(grid: CellType[][], type: CellType): Pos {
  for (let r = 0; r < grid.length; r++)
    for (let c = 0; c < grid[r].length; c++)
      if (grid[r][c] === type) return { r, c };
  return { r: 0, c: 0 };
}

function fmtTime(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

const DIFF_COLORS: Record<Difficulty, string> = {
  easy:   "#10b981",
  medium: "#f59e0b",
  hard:   "#ef4444",
};

// ─── Global styles ────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Fira+Code:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --p:      #10b981;
  --p-glow: rgba(16,185,129,0.25);
  --p-sub:  rgba(16,185,129,0.12);
}
@media(prefers-color-scheme:dark){
  :root{ --p:#3b82f6; --p-glow:rgba(59,130,246,0.25); --p-sub:rgba(59,130,246,0.12); }
}

@keyframes fadeUp    { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
@keyframes fadeIn    { from{opacity:0} to{opacity:1} }
@keyframes scaleIn   { from{opacity:0;transform:scale(0.88)} to{opacity:1;transform:scale(1)} }
@keyframes bounceIn  { 0%{transform:scale(0.5);opacity:0} 60%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
@keyframes wobble    { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
@keyframes spin      { to{transform:rotate(360deg)} }
@keyframes pulse     { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
@keyframes flash     { 0%,100%{opacity:1} 50%{opacity:0.4} }
@keyframes hop       { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
@keyframes starPop   { 0%{transform:scale(0) rotate(-20deg);opacity:0} 60%{transform:scale(1.3) rotate(5deg);opacity:1} 100%{transform:scale(1) rotate(0)} }
@keyframes shimmer   { 0%{opacity:0.6} 50%{opacity:1} 100%{opacity:0.6} }
@keyframes trapShake { 0%,100%{transform:scale(1)} 30%{transform:scale(1.3) rotate(-10deg)} 60%{transform:scale(1.1) rotate(5deg)} }
@keyframes trailFade { 0%{opacity:0.6;transform:scale(0.9)} 100%{opacity:0;transform:scale(0.5)} }
@keyframes celebration { 0%{transform:scale(1)} 25%{transform:scale(1.2) rotate(5deg)} 50%{transform:scale(1) rotate(-3deg)} 100%{transform:scale(1)} }

.route-root { font-family:'Nunito',system-ui,sans-serif; min-height:100vh; }

/* Difficulty cards */
.diff-card {
  position:relative; border-radius:18px; padding:22px 20px; cursor:pointer;
  border:2px solid var(--col-border); background:var(--col-surface);
  transition:all 0.22s; text-align:center; overflow:hidden;
}
.diff-card:hover  { transform:translateY(-4px); }
.diff-card.active { border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-sub),0 12px 32px var(--accent-glow); }

/* Grid cells */
.cell { position:relative; display:flex; align-items:center; justify-content:center; border-radius:6px; transition:background 0.15s; }
.cell-W { background:var(--col-wall); }
.cell-P { background:var(--col-path); }
.cell-S { background:var(--col-path); }
.cell-E { background:var(--col-path); }
.cell-K { background:var(--col-path); }
.cell-T { background:var(--col-path); }
.cell-visited { background:var(--col-visited); }

/* Key item */
.key-item { font-size:14px; animation:shimmer 1.5s ease-in-out infinite; }

/* Character */
.character {
  position:absolute; z-index:20; display:flex; align-items:center; justify-content:center;
  transition:top 0.16s cubic-bezier(0.34,1.56,0.64,1), left 0.16s cubic-bezier(0.34,1.56,0.64,1);
  pointer-events:none;
}

/* Trail */
.trail { position:absolute; z-index:10; border-radius:50%; pointer-events:none; animation:trailFade 0.5s ease forwards; }

/* Keyboard arrow pad */
.arrow-btn {
  width:46px; height:46px; border-radius:10px; border:1.5px solid var(--col-border);
  background:var(--col-surface); display:flex; align-items:center; justify-content:center;
  cursor:pointer; font-size:18px; transition:all 0.12s; color:var(--col-text-primary);
  font-family:'Fira Code',monospace;
}
.arrow-btn:hover  { background:var(--p-sub); border-color:var(--p); }
.arrow-btn:active { transform:scale(0.9); background:var(--p); color:#fff; }
`;

// ─── SelectScreen ─────────────────────────────────────────────────────────────

function SelectScreen({
  selected, setSelected, onStart,
}: {
  selected: Difficulty | null;
  setSelected: (d: Difficulty) => void;
  onStart: () => void;
}) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", padding:"2rem 1.5rem", animation:"fadeUp 0.4s ease" }}>
      {/* Header */}
      <div style={{ textAlign:"center", marginBottom:"2.5rem" }}>
        <div style={{ fontSize:52, marginBottom:12, animation:"hop 2s ease-in-out infinite" }}>🏠</div>
        <h1 style={{ fontSize:"clamp(28px,5vw,42px)", fontWeight:900, color:"var(--col-text-primary)", letterSpacing:"-0.5px", marginBottom:8 }}>
          Find the Route
        </h1>
        <p style={{ fontSize:15, color:"var(--col-text-secondary)", maxWidth:340, margin:"0 auto", lineHeight:1.65 }}>
          Guide the explorer home through the maze. Use <kbd style={{ fontFamily:"Fira Code", background:"var(--col-surface)", border:"1px solid var(--col-border)", borderRadius:5, padding:"1px 5px", fontSize:12 }}>↑↓←→</kbd> or WASD to move.
        </p>
      </div>

      {/* Legend */}
      <div style={{ display:"flex", gap:16, marginBottom:"2.5rem", flexWrap:"wrap", justifyContent:"center" }}>
        {[
          { icon:"🧒", label:"You" },
          { icon:"🏠", label:"Home" },
          { icon:"🔑", label:"Key (collect first!)" },
          { icon:"⚠️", label:"Trap (bounces back)" },
        ].map(({ icon, label }) => (
          <div key={label} style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, color:"var(--col-text-secondary)", background:"var(--col-surface)", border:"1px solid var(--col-border)", borderRadius:10, padding:"6px 12px" }}>
            <span style={{ fontSize:16 }}>{icon}</span> {label}
          </div>
        ))}
      </div>

      {/* Difficulty cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:14, maxWidth:620, width:"100%", marginBottom:"2.5rem" }}>
        {DIFFICULTY_CONFIG.map((cfg, i) => {
          const isSel = selected === cfg.id;
          return (
            <button
              key={cfg.id}
              className={`diff-card${isSel ? " active" : ""}`}
              style={{
                "--accent":     cfg.color,
                "--accent-sub": `${cfg.color}22`,
                "--accent-glow":`${cfg.color}18`,
                animationDelay: `${i * 0.08}s`,
                animation: "fadeUp 0.4s ease both",
              } as React.CSSProperties}
              onClick={() => setSelected(cfg.id as Difficulty)}
            >
              <div style={{ fontSize:32, marginBottom:8 }}>{cfg.emoji}</div>
              <div style={{ fontSize:16, fontWeight:800, color:"var(--col-text-primary)", marginBottom:4 }}>{cfg.label}</div>
              <div style={{ fontSize:12, color:"var(--col-text-secondary)", lineHeight:1.5 }}>{cfg.description}</div>
              {isSel && (
                <div style={{ position:"absolute", top:10, right:10, width:22, height:22, borderRadius:"50%", background:cfg.color, display:"flex", alignItems:"center", justifyContent:"center", animation:"scaleIn 0.2s ease" }}>
                  <svg width={12} height={12} viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="2 6 5 9 10 3"/></svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={onStart}
        disabled={!selected}
        style={{
          padding:"15px 56px", borderRadius:30, border:"none",
          background: selected ? DIFF_COLORS[selected] : "var(--col-border)",
          color: selected ? "#fff" : "var(--col-text-tertiary)",
          fontSize:16, fontWeight:800, cursor: selected ? "pointer" : "not-allowed",
          transition:"all 0.2s",
          boxShadow: selected ? `0 6px 24px ${DIFF_COLORS[selected]}44` : "none",
          letterSpacing:"0.02em",
        }}
        onMouseEnter={e => { if(selected){ (e.currentTarget as HTMLButtonElement).style.transform="translateY(-2px)"; } }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform="translateY(0)"; }}
      >
        {selected ? `Start ${selected.charAt(0).toUpperCase()+selected.slice(1)} →` : "Choose difficulty"}
      </button>
    </div>
  );
}

// ─── LoadingScreen ────────────────────────────────────────────────────────────

function LoadingScreen({ difficulty }: { difficulty: Difficulty }) {
  const cfg = DIFFICULTY_CONFIG.find(d => d.id === difficulty)!;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", gap:24, animation:"fadeIn 0.3s" }}>
      <div style={{ position:"relative", width:80, height:80 }}>
        <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:`3px solid ${cfg.color}22` }}/>
        <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:`3px solid transparent`, borderTopColor:cfg.color, animation:"spin 0.85s linear infinite" }}/>
        <div style={{ position:"absolute", inset:12, borderRadius:"50%", background:`${cfg.color}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>{cfg.emoji}</div>
      </div>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:18, fontWeight:700, color:"var(--col-text-primary)", marginBottom:6 }}>Building your maze…</div>
        <div style={{ fontSize:13, color:"var(--col-text-secondary)" }}>Generating a fresh {cfg.label} puzzle</div>
      </div>
    </div>
  );
}

// ─── GameScreen ───────────────────────────────────────────────────────────────

function GameScreen({
  puzzle,
  difficulty,
  timeLeft,
  moves,
  keysHeld,
  keysNeeded,
  playerPos,
  trail,
  trapFlash,
  winFlash,
  facing,
  onMove,
  onHome,
  onNextPuzzle,
  onHint,
  hintShown,
}: {
  puzzle: Puzzle;
  difficulty: Difficulty;
  timeLeft: number;
  moves: number;
  keysHeld: number;
  keysNeeded: number;
  playerPos: Pos;
  trail: Pos[];
  trapFlash: boolean;
  winFlash: boolean;
  facing: Direction;
  onMove: (dir: "up"|"down"|"left"|"right") => void;
  onHome: () => void;
  onNextPuzzle: () => void;
  onHint: () => void;
  hintShown: boolean;
}) {
  const { grid } = puzzle;
  const rows = grid.length;
  const cols = grid[0].length;
  const diffColor = DIFF_COLORS[difficulty];

  // Compute cell size based on grid size
  const maxGridPx = Math.min(480, typeof window !== "undefined" ? window.innerWidth - 48 : 480);
  const cellSize = Math.floor(maxGridPx / Math.max(rows, cols));

  const startPos = useMemo(() => findCell(grid, "S"), [grid]);
  const endPos   = useMemo(() => findCell(grid, "E"), [grid]);

  // Character pixel position
  const charLeft = playerPos.c * cellSize;
  const charTop  = playerPos.r * cellSize;

  const facingEmoji = { up:"🧒", down:"🧒", left:"🧒", right:"🧒", null:"🧒" }[facing ?? "null"];

  const pct = Math.max(0, timeLeft / puzzle.timeLimit);
  const timerColor = pct < 0.25 ? "#ef4444" : pct < 0.5 ? "#f59e0b" : diffColor;

  return (
    <div style={{ display:"flex", flexDirection:"column", minHeight:"100vh" }}>
      {/* Top bar */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 16px", borderBottom:"0.5px solid var(--col-border)", background:"var(--col-bg)", position:"sticky", top:0, zIndex:30 }}>
        {/* Puzzle name */}
        <div>
          <div style={{ fontSize:13, fontWeight:800, color:"var(--col-text-primary)" }}>{puzzle.name}</div>
          <div style={{ fontSize:11, color:"var(--col-text-tertiary)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.07em" }}>{difficulty} · #{puzzle.id}</div>
        </div>

        {/* Timer */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
          <div style={{ fontFamily:"Fira Code,monospace", fontSize:22, fontWeight:700, color:timerColor, animation: timeLeft <= 10 ? "flash 0.6s ease-in-out infinite" : "none" }}>
            {fmtTime(timeLeft)}
          </div>
          <div style={{ width:80, height:4, borderRadius:4, background:"var(--col-border)", overflow:"hidden" }}>
            <div style={{ height:"100%", borderRadius:4, background:timerColor, width:`${pct*100}%`, transition:"width 1s linear, background 0.5s" }}/>
          </div>
        </div>

        {/* Right stats */}
        <div style={{ display:"flex", gap:14, alignItems:"center" }}>
          {keysNeeded > 0 && (
            <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:13, fontWeight:700, color: keysHeld >= keysNeeded ? "#10b981" : "#f59e0b" }}>
              🔑 {keysHeld}/{keysNeeded}
            </div>
          )}
          <div style={{ fontSize:12, color:"var(--col-text-tertiary)", fontFamily:"Fira Code,monospace", fontWeight:500 }}>
            {moves} <span style={{ fontSize:10 }}>steps</span>
          </div>
          <button onClick={onHome} style={{ width:32, height:32, borderRadius:"50%", border:"1px solid var(--col-border)", background:"var(--col-surface)", cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s" }}>⬛</button>
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"1rem", gap:20 }}>
        {/* Hint banner */}
        {hintShown && (
          <div style={{ maxWidth:480, width:"100%", padding:"10px 16px", borderRadius:10, background:`${diffColor}12`, border:`1px solid ${diffColor}30`, fontSize:13, color:"var(--col-text-secondary)", animation:"fadeIn 0.3s", lineHeight:1.5, display:"flex", gap:8, alignItems:"flex-start" }}>
            <span style={{ fontSize:16 }}>💡</span>
            <span>{puzzle.hint}</span>
          </div>
        )}

        {/* Trap flash overlay */}
        {trapFlash && (
          <div style={{ position:"fixed", inset:0, background:"rgba(239,68,68,0.15)", zIndex:50, pointerEvents:"none", animation:"flash 0.15s ease-in-out 2" }}/>
        )}
        {winFlash && (
          <div style={{ position:"fixed", inset:0, background:"rgba(16,185,129,0.12)", zIndex:50, pointerEvents:"none", animation:"flash 0.3s ease-in-out 2" }}/>
        )}

        {/* Grid */}
        <div style={{ position:"relative", width:cols*cellSize, height:rows*cellSize, borderRadius:12, overflow:"hidden", boxShadow:"0 8px 32px rgba(0,0,0,0.18), 0 0 0 2px var(--col-border)" }}>
          {/* Cells */}
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const isVisited = trail.some(t => t.r === r && t.c === c);
              const isStart = r === startPos.r && c === startPos.c;
              const isEnd   = r === endPos.r   && c === endPos.c;

              let bg = "var(--col-wall)";
              if (cell !== "W") {
                bg = isVisited ? "var(--col-visited)" : "var(--col-path)";
              }
              if (cell === "W") bg = "var(--col-wall)";
              if (isStart) bg = "var(--col-start)";
              if (isEnd)   bg = "var(--col-end)";

              return (
                <div
                  key={`${r}-${c}`}
                  style={{
                    position:"absolute",
                    left: c * cellSize,
                    top:  r * cellSize,
                    width: cellSize,
                    height: cellSize,
                    background: bg,
                    display:"flex",
                    alignItems:"center",
                    justifyContent:"center",
                    transition:"background 0.2s",
                    borderRadius: cell === "W" ? 2 : 4,
                  }}
                >
                  {/* Wall texture dots */}
                  {cell === "W" && (
                    <div style={{ width:4, height:4, borderRadius:"50%", background:"rgba(0,0,0,0.08)", opacity:0.5 }}/>
                  )}
                  {/* Start marker */}
                  {isStart && (
                    <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <div style={{ width:cellSize*0.45, height:cellSize*0.45, borderRadius:"50%", border:`2px solid ${diffColor}`, background:`${diffColor}22`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <span style={{ fontSize:cellSize*0.22, lineHeight:1 }}>A</span>
                      </div>
                    </div>
                  )}
                  {/* End marker */}
                  {isEnd && (
                    <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <span style={{ fontSize:cellSize*0.55, lineHeight:1, filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.3))", animation:"hop 2s ease-in-out infinite" }}>🏠</span>
                    </div>
                  )}
                  {/* Key */}
                  {cell === "K" && r !== playerPos.r && c !== playerPos.c && (
                    <span className="key-item" style={{ fontSize:cellSize*0.5 }}>🔑</span>
                  )}
                  {/* Trap */}
                  {cell === "T" && (
                    <span style={{ fontSize:cellSize*0.45, opacity:0.8, animation:"trapShake 2s ease-in-out infinite" }}>⚠️</span>
                  )}
                </div>
              );
            })
          )}

          {/* Trail dots */}
          {trail.map((t, i) => (
            <div
              key={`trail-${i}-${t.r}-${t.c}`}
              className="trail"
              style={{
                left: t.c * cellSize + cellSize/2 - 4,
                top:  t.r * cellSize + cellSize/2 - 4,
                width: 8, height: 8,
                background: diffColor,
                opacity: 0.35 * (i / trail.length),
              }}
            />
          ))}

          {/* Character */}
          <div
            className="character"
            style={{
              left: charLeft,
              top:  charTop,
              width: cellSize,
              height: cellSize,
              fontSize: cellSize * 0.65,
              animation: trapFlash ? "wobble 0.35s ease" : undefined,
            }}
          >
            <span style={{ lineHeight:1, filter:"drop-shadow(0 2px 6px rgba(0,0,0,0.3))", display:"block",
              transform: facing === "left" ? "scaleX(-1)" : "scaleX(1)",
              transition:"transform 0.1s",
            }}>
              🧒
            </span>
          </div>
        </div>

        {/* Action bar */}
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <button onClick={onHint} style={{ padding:"8px 16px", borderRadius:10, border:"1px solid var(--col-border)", background:"var(--col-surface)", color:"var(--col-text-secondary)", fontSize:13, fontWeight:600, cursor:"pointer", transition:"all 0.15s", display:"flex", alignItems:"center", gap:6 }}>
            💡 {hintShown ? "Hide" : "Hint"}
          </button>
          <button onClick={onNextPuzzle} style={{ padding:"8px 16px", borderRadius:10, border:"1px solid var(--col-border)", background:"var(--col-surface)", color:"var(--col-text-secondary)", fontSize:13, fontWeight:600, cursor:"pointer", transition:"all 0.15s" }}>
            ↻ New Maze
          </button>
        </div>

        {/* Arrow pad (touch/click) */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
          <div><ArrowBtn dir="up"    label="↑" onClick={() => onMove("up")}/></div>
          <div style={{ display:"flex", gap:6 }}>
            <ArrowBtn dir="left"  label="←" onClick={() => onMove("left")}/>
            <ArrowBtn dir="down"  label="↓" onClick={() => onMove("down")}/>
            <ArrowBtn dir="right" label="→" onClick={() => onMove("right")}/>
          </div>
          <div style={{ fontSize:11, color:"var(--col-text-tertiary)", marginTop:4 }}>Arrow keys / WASD also work</div>
        </div>
      </div>
    </div>
  );
}

function ArrowBtn({ label, onClick }: { dir: string; label: string; onClick: () => void }) {
  return (
    <button className="arrow-btn" onClick={onClick}>{label}</button>
  );
}

// ─── WinScreen ────────────────────────────────────────────────────────────────

function WinScreen({
  puzzle, difficulty, moves, timeTaken,
  onNext, onMenu,
}: {
  puzzle: Puzzle; difficulty: Difficulty; moves: number; timeTaken: number;
  onNext: () => void; onMenu: () => void;
}) {
  const diffColor = DIFF_COLORS[difficulty];
  const stars = moves <= puzzle.timeLimit / 6 ? 3 : moves <= puzzle.timeLimit / 4 ? 2 : 1;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", padding:"2rem 1.5rem", animation:"fadeUp 0.4s ease", gap:0 }}>
      <div style={{ fontSize:64, marginBottom:16, animation:"celebration 0.8s ease" }}>🏠</div>
      <h2 style={{ fontSize:28, fontWeight:900, color:"var(--col-text-primary)", marginBottom:6 }}>You made it home!</h2>
      <p style={{ fontSize:14, color:"var(--col-text-secondary)", marginBottom:24 }}>{puzzle.name} · {difficulty}</p>

      {/* Stars */}
      <div style={{ display:"flex", gap:8, marginBottom:24 }}>
        {[0,1,2].map(i => (
          <svg key={i} width={34} height={34} viewBox="0 0 24 24" style={{ animation: i<stars ? `starPop 0.45s ${i*0.13}s ease both` : undefined }}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={i<stars ? "#f59e0b" : "var(--col-border)"} stroke={i<stars ? "#f59e0b" : "var(--col-border)"} strokeWidth={1}/>
          </svg>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:28, width:"100%", maxWidth:360 }}>
        {[
          { val:String(moves),         lbl:"steps"    },
          { val:fmtTime(timeTaken),     lbl:"time"     },
          { val:`${stars}/3 ⭐`,       lbl:"rating"   },
        ].map(({ val, lbl }) => (
          <div key={lbl} style={{ padding:"14px 8px", borderRadius:12, background:"var(--col-surface)", border:"0.5px solid var(--col-border)", textAlign:"center" }}>
            <div style={{ fontSize:18, fontWeight:800, color:diffColor }}>{val}</div>
            <div style={{ fontSize:11, color:"var(--col-text-tertiary)", marginTop:2 }}>{lbl}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap:12 }}>
        <button onClick={onNext} style={{ padding:"14px 36px", borderRadius:28, border:"none", background:diffColor, color:"#fff", fontSize:15, fontWeight:800, cursor:"pointer", transition:"all 0.18s", boxShadow:`0 4px 18px ${diffColor}44` }}
          onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.transform="translateY(-1px)"}
          onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.transform="translateY(0)"}
        >Next Puzzle →</button>
        <button onClick={onMenu} style={{ padding:"14px 24px", borderRadius:28, border:"1.5px solid var(--col-border)", background:"var(--col-surface)", color:"var(--col-text-secondary)", fontSize:15, fontWeight:700, cursor:"pointer", transition:"all 0.15s" }}
          onMouseEnter={e=>{ const b=e.currentTarget as HTMLButtonElement; b.style.borderColor=diffColor; b.style.color=diffColor; }}
          onMouseLeave={e=>{ const b=e.currentTarget as HTMLButtonElement; b.style.borderColor="var(--col-border)"; b.style.color="var(--col-text-secondary)"; }}
        >Menu</button>
      </div>
    </div>
  );
}

// ─── LoseScreen ───────────────────────────────────────────────────────────────

function LoseScreen({ puzzle, difficulty, onRetry, onMenu }: { puzzle:Puzzle; difficulty:Difficulty; onRetry:()=>void; onMenu:()=>void }) {
  const diffColor = DIFF_COLORS[difficulty];
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", padding:"2rem 1.5rem", animation:"scaleIn 0.4s ease", gap:0 }}>
      <div style={{ fontSize:64, marginBottom:16 }}>⏰</div>
      <h2 style={{ fontSize:26, fontWeight:900, color:"var(--col-text-primary)", marginBottom:8 }}>Time's Up!</h2>
      <p style={{ fontSize:14, color:"var(--col-text-secondary)", marginBottom:28, textAlign:"center", maxWidth:280, lineHeight:1.6 }}>
        You didn't reach home in time. Try again — the maze is the same!
      </p>
      <div style={{ display:"flex", gap:12 }}>
        <button onClick={onRetry} style={{ padding:"14px 36px", borderRadius:28, border:"none", background:diffColor, color:"#fff", fontSize:15, fontWeight:800, cursor:"pointer", boxShadow:`0 4px 18px ${diffColor}44` }}>Try Again</button>
        <button onClick={onMenu}  style={{ padding:"14px 24px", borderRadius:28, border:"1.5px solid var(--col-border)", background:"var(--col-surface)", color:"var(--col-text-secondary)", fontSize:15, fontWeight:700, cursor:"pointer" }}>Menu</button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RoutePuzzlePage() {
  const [screen,     setScreen]     = useState<Screen>("select");
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [selDiff,    setSelDiff]    = useState<Difficulty | null>(null);
  const [puzzle,     setPuzzle]     = useState<Puzzle | null>(null);
  const [playerPos,  setPlayerPos]  = useState<Pos>({ r:0, c:0 });
  const [trail,      setTrail]      = useState<Pos[]>([]);
  const [keysHeld,   setKeysHeld]   = useState(0);
  const [moves,      setMoves]      = useState(0);
  const [timeLeft,   setTimeLeft]   = useState(0);
  const [timeTaken,  setTimeTaken]  = useState(0);
  const [trapFlash,  setTrapFlash]  = useState(false);
  const [winFlash,   setWinFlash]   = useState(false);
  const [facing,     setFacing]     = useState<Direction>(null);
  const [hintShown,  setHintShown]  = useState(false);
  const [usedIds,    setUsedIds]    = useState<number[]>([]);

  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const lockedRef = useRef(false);

  // Dark mode
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mq.matches);
    const h = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  const cssVars: React.CSSProperties = {
    "--col-bg":           isDark ? "#020617" : "#f8fafc",
    "--col-surface":      isDark ? "#0f172a" : "#ffffff",
    "--col-border":       isDark ? "rgba(148,163,184,0.15)" : "rgba(0,0,0,0.09)",
    "--col-text-primary": isDark ? "#f1f5f9" : "#0f172a",
    "--col-text-secondary":isDark? "#94a3b8"  : "#64748b",
    "--col-text-tertiary":isDark ? "#475569"  : "#94a3b8",
    // Grid colors
    "--col-wall":         isDark ? "#1e293b" : "#d1d5db",
    "--col-path":         isDark ? "#0f172a" : "#f9fafb",
    "--col-visited":      isDark ? "rgba(59,130,246,0.15)" : "rgba(16,185,129,0.10)",
    "--col-start":        isDark ? "rgba(16,185,129,0.22)" : "rgba(16,185,129,0.18)",
    "--col-end":          isDark ? "rgba(251,191,36,0.22)"  : "rgba(251,191,36,0.20)",
  } as React.CSSProperties;

  // Count keys in puzzle
  const keysNeeded = useMemo(() => {
    if (!puzzle) return 0;
    return puzzle.grid.flat().filter(c => c === "K").length;
  }, [puzzle]);

  // Load puzzle
  const loadPuzzle = useCallback(async (diff: Difficulty, exclude: number[] = []) => {
    setScreen("loading");
    lockedRef.current = false;
    const p = await fetchPuzzle(diff, exclude);
    const start = findCell(p.grid, "S");
    setPuzzle(p);
    setPlayerPos(start);
    setTrail([start]);
    setKeysHeld(0);
    setMoves(0);
    setTimeLeft(p.timeLimit);
    setTimeTaken(0);
    setHintShown(false);
    setTrapFlash(false);
    setWinFlash(false);
    setFacing(null);
    setUsedIds(prev => [...prev, p.id]);
    setDifficulty(diff);
    setScreen("playing");
  }, []);

  // Timer
  useEffect(() => {
    if (screen !== "playing") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setScreen("lose");
          return 0;
        }
        setTimeTaken(prev => prev + 1);
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [screen]);

  // Move logic
  const move = useCallback((dir: "up"|"down"|"left"|"right") => {
    if (!puzzle || screen !== "playing" || lockedRef.current) return;
    setFacing(dir);

    setPlayerPos(prev => {
      const dr = dir === "up" ? -1 : dir === "down" ? 1 : 0;
      const dc = dir === "left" ? -1 : dir === "right" ? 1 : 0;
      const nr = prev.r + dr;
      const nc = prev.c + dc;

      // Bounds check
      if (nr < 0 || nr >= puzzle.grid.length || nc < 0 || nc >= puzzle.grid[0].length) return prev;
      const cell = puzzle.grid[nr][nc];
      if (cell === "W") return prev;

      setMoves(m => m + 1);

      if (cell === "T") {
        // Trap — flash red and stay
        lockedRef.current = true;
        setTrapFlash(true);
        setTimeout(() => { setTrapFlash(false); lockedRef.current = false; }, 500);
        return prev;
      }

      if (cell === "K") {
        // Collect key — replace with path
        setKeysHeld(k => k + 1);
        // Mutate grid cell to P so it won't show again
        puzzle.grid[nr][nc] = "P";
      }

      if (cell === "E") {
        // Check keys
        const kTotal = puzzle.grid.flat().filter(c => c === "K").length;
        // keysHeld is stale here, read from state via a ref pattern
        setKeysHeld(kHeld => {
          const totalCollected = kHeld; // already collected so far
          // count remaining keys in grid
          const remaining = puzzle.grid.flat().filter(c => c === "K").length;
          if (totalCollected + (cell === "K" ? 1 : 0) < keysNeeded && remaining > 0) {
            // can't enter
            return kHeld;
          }
          // WIN
          lockedRef.current = true;
          if (timerRef.current) clearInterval(timerRef.current);
          setWinFlash(true);
          setTimeout(() => { setWinFlash(false); setScreen("win"); }, 700);
          return kHeld;
        });
      }

      const next = { r: nr, c: nc };
      setTrail(t => [...t.slice(-20), next]);
      return next;
    });
  }, [puzzle, screen, keysNeeded]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, "up"|"down"|"left"|"right"> = {
        ArrowUp:"up", ArrowDown:"down", ArrowLeft:"left", ArrowRight:"right",
        w:"up", s:"down", a:"left", d:"right",
        W:"up", S:"down", A:"left", D:"right",
      };
      if (map[e.key]) { e.preventDefault(); move(map[e.key]); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [move]);

  // Win check (second path for E cell)
  useEffect(() => {
    if (!puzzle || screen !== "playing") return;
    const endPos = findCell(puzzle.grid, "E");
    if (playerPos.r === endPos.r && playerPos.c === endPos.c) {
      if (keysHeld >= keysNeeded) {
        if (!lockedRef.current) {
          lockedRef.current = true;
          if (timerRef.current) clearInterval(timerRef.current);
          setWinFlash(true);
          setTimeout(() => { setWinFlash(false); setScreen("win"); }, 700);
        }
      }
    }
  }, [playerPos, puzzle, screen, keysHeld, keysNeeded]);

  const handleStart = () => {
    if (!selDiff) return;
    setUsedIds([]);
    loadPuzzle(selDiff, []);
  };

  return (
    <>
      <style>{CSS}</style>
      <div
        className="route-root"
        style={{ ...cssVars, background:"var(--col-bg)" }}
      >
        {screen === "select" && (
          <SelectScreen selected={selDiff} setSelected={setSelDiff} onStart={handleStart} />
        )}
        {screen === "loading" && difficulty && (
          <LoadingScreen difficulty={difficulty} />
        )}
        {screen === "playing" && puzzle && difficulty && (
          <GameScreen
            key={puzzle.id}
            puzzle={puzzle}
            difficulty={difficulty}
            timeLeft={timeLeft}
            moves={moves}
            keysHeld={keysHeld}
            keysNeeded={keysNeeded}
            playerPos={playerPos}
            trail={trail}
            trapFlash={trapFlash}
            winFlash={winFlash}
            facing={facing}
            onMove={move}
            onHome={() => setScreen("select")}
            onNextPuzzle={() => loadPuzzle(difficulty, usedIds)}
            onHint={() => setHintShown(h => !h)}
            hintShown={hintShown}
          />
        )}
        {screen === "win" && puzzle && difficulty && (
          <WinScreen
            puzzle={puzzle}
            difficulty={difficulty}
            moves={moves}
            timeTaken={timeTaken}
            onNext={() => loadPuzzle(difficulty, usedIds)}
            onMenu={() => setScreen("select")}
          />
        )}
        {screen === "lose" && puzzle && difficulty && (
          <LoseScreen
            puzzle={puzzle}
            difficulty={difficulty}
            onRetry={() => loadPuzzle(difficulty, usedIds.filter(id => id !== puzzle.id))}
            onMenu={() => setScreen("select")}
          />
        )}
      </div>
    </>
  );
}
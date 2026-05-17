"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const COLS = 10;
const ROWS = 20;
const TICK_INTERVAL = 800; // ms, base speed

// ─── Tetromino definitions ────────────────────────────────────────────────────

type TetrominoType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

interface TetrominoDef {
  shape: number[][];
  color: string;
  glow: string;
  label: string;
}

const TETROMINOES: Record<TetrominoType, TetrominoDef> = {
  I: { label:"I", color:"#06b6d4", glow:"rgba(6,182,212,0.5)",   shape:[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]] },
  O: { label:"O", color:"#f59e0b", glow:"rgba(245,158,11,0.5)",  shape:[[1,1],[1,1]] },
  T: { label:"T", color:"#a855f7", glow:"rgba(168,85,247,0.5)",  shape:[[0,1,0],[1,1,1],[0,0,0]] },
  S: { label:"S", color:"#10b981", glow:"rgba(16,185,129,0.5)",  shape:[[0,1,1],[1,1,0],[0,0,0]] },
  Z: { label:"Z", color:"#ef4444", glow:"rgba(239,68,68,0.5)",   shape:[[1,1,0],[0,1,1],[0,0,0]] },
  J: { label:"J", color:"#3b82f6", glow:"rgba(59,130,246,0.5)",  shape:[[1,0,0],[1,1,1],[0,0,0]] },
  L: { label:"L", color:"#f97316", glow:"rgba(249,115,22,0.5)",  shape:[[0,0,1],[1,1,1],[0,0,0]] },
};

const TYPES: TetrominoType[] = ["I","O","T","S","Z","J","L"];

// ─── Types ────────────────────────────────────────────────────────────────────

type Board = (string | null)[][];
type Screen = "start" | "playing" | "paused" | "gameover";

interface Piece {
  type: TetrominoType;
  shape: number[][];
  x: number;
  y: number;
  color: string;
  glow: string;
}

interface LineClearAnim {
  rows: number[];
  startTime: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function rotate(shape: number[][]): number[][] {
  const N = shape.length;
  return shape[0].map((_, c) => shape.map((row) => row[c]).reverse());
}

function randomPiece(): Piece {
  const type = TYPES[Math.floor(Math.random() * TYPES.length)];
  const def = TETROMINOES[type];
  return { type, shape: def.shape, x: Math.floor(COLS / 2) - Math.floor(def.shape[0].length / 2), y: 0, color: def.color, glow: def.glow };
}

function collides(board: Board, piece: Piece, dx = 0, dy = 0, shape = piece.shape): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = piece.x + c + dx;
      const ny = piece.y + r + dy;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}

function mergePiece(board: Board, piece: Piece): Board {
  const next = board.map((row) => [...row]);
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (!piece.shape[r][c]) continue;
      const ny = piece.y + r;
      const nx = piece.x + c;
      if (ny >= 0) next[ny][nx] = piece.color;
    }
  }
  return next;
}

function clearLines(board: Board): { board: Board; cleared: number; rows: number[] } {
  const clearedRows: number[] = [];
  const remaining = board.filter((row, i) => {
    if (row.every((c) => c !== null)) { clearedRows.push(i); return false; }
    return true;
  });
  const newBoard = [...Array.from({ length: clearedRows.length }, () => Array(COLS).fill(null)), ...remaining];
  return { board: newBoard, cleared: clearedRows.length, rows: clearedRows };
}

function getGhost(board: Board, piece: Piece): Piece {
  let ghost = { ...piece };
  while (!collides(board, ghost, 0, 1)) ghost = { ...ghost, y: ghost.y + 1 };
  return ghost;
}

function scoreForLines(lines: number, level: number): number {
  const base = [0, 100, 300, 500, 800];
  return (base[lines] ?? 800) * (level + 1);
}

function levelSpeed(level: number): number {
  return Math.max(100, TICK_INTERVAL - level * 60);
}

// ─── CSS ──────────────────────────────────────────────────────────────────────

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Inter:wght@400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --primary:      #10b981;
  --primary-glow: rgba(16,185,129,0.35);
}
@media(prefers-color-scheme:dark) {
  :root { --primary: #3b82f6; --primary-glow: rgba(59,130,246,0.35); }
}

@keyframes fadeUp     { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
@keyframes scaleIn    { from{opacity:0;transform:scale(0.85)} to{opacity:1;transform:scale(1)} }
@keyframes pulse      { 0%,100%{opacity:1} 50%{opacity:0.5} }
@keyframes glow-pulse { 0%,100%{box-shadow:0 0 8px var(--primary-glow)} 50%{box-shadow:0 0 24px var(--primary-glow),0 0 48px var(--primary-glow)} }
@keyframes scanline   { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
@keyframes flash-row  { 0%,100%{opacity:1} 33%,66%{opacity:0} }
@keyframes drop-in    { from{transform:translateY(-8px);opacity:0.4} to{transform:translateY(0);opacity:1} }
@keyframes shake      { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }
@keyframes float-score{ 0%{transform:translateY(0);opacity:1} 100%{transform:translateY(-60px);opacity:0} }
@keyframes spin-in    { from{transform:rotate(-90deg) scale(0.5);opacity:0} to{transform:rotate(0) scale(1);opacity:1} }
@keyframes levelUp    { 0%{transform:scale(1)} 30%{transform:scale(1.15)} 60%{transform:scale(0.95)} 100%{transform:scale(1)} }
@keyframes grid-appear{ from{opacity:0;transform:scaleY(0)} to{opacity:1;transform:scaleY(1)} }

body { overflow-x: hidden; }

.tetris-root {
  font-family:'Inter',system-ui,sans-serif;
  min-height:100vh;
  position:relative;
  overflow:hidden;
}

/* Scanline effect */
.tetris-root::after {
  content:'';
  position:fixed;
  inset:0;
  background: repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.03) 2px,rgba(0,0,0,0.03) 4px);
  pointer-events:none;
  z-index:100;
}

/* Board canvas */
.board-cell {
  position:absolute;
  transition:background 0.04s;
}

/* Grid lines */
.board-grid {
  position:absolute;
  inset:0;
  pointer-events:none;
}

/* Keys */
.key-badge {
  display:inline-flex;align-items:center;justify-content:center;
  min-width:24px;height:24px;border-radius:6px;
  border:1.5px solid var(--col-border);
  background:var(--col-surface);
  font-size:11px;font-weight:700;
  font-family:'Orbitron',monospace;
  padding:0 5px;
}

/* Piece preview cell */
.preview-cell {
  border-radius:3px;
  transition:all 0.15s;
}

/* Buttons */
.btn-primary {
  padding:14px 40px;border-radius:12px;border:none;
  background:var(--primary);color:#fff;
  font-family:'Orbitron',monospace;font-size:14px;font-weight:700;
  cursor:pointer;transition:all 0.18s;letter-spacing:0.06em;
  box-shadow:0 4px 20px var(--primary-glow);
  text-transform:uppercase;
}
.btn-primary:hover { transform:translateY(-2px); box-shadow:0 8px 32px var(--primary-glow); }
.btn-primary:active { transform:scale(0.96); }

.btn-ghost {
  padding:10px 24px;border-radius:10px;
  border:1.5px solid var(--col-border);
  background:transparent;color:var(--col-text-secondary);
  font-family:'Orbitron',monospace;font-size:11px;font-weight:700;
  cursor:pointer;transition:all 0.18s;letter-spacing:0.06em;text-transform:uppercase;
}
.btn-ghost:hover { border-color:var(--primary);color:var(--primary); }
`;

// ─── Piece Preview ────────────────────────────────────────────────────────────

function PiecePreview({ type, size = 24 }: { type: TetrominoType | null; size?: number }) {
  if (!type) return <div style={{ height: size * 4 }} />;
  const def = TETROMINOES[type];
  const shape = def.shape;
  const rows = shape.length;
  const cols = shape[0].length;
  return (
    <div style={{ display:"grid", gridTemplateColumns:`repeat(${cols},${size}px)`, gap:2, alignItems:"center", justifyItems:"center" }}>
      {shape.map((row, r) =>
        row.map((cell, c) => (
          <div
            key={`${r}-${c}`}
            className="preview-cell"
            style={{
              width: size, height: size, borderRadius: 4,
              background: cell ? def.color : "transparent",
              boxShadow: cell ? `0 0 8px ${def.glow}` : "none",
              border: cell ? `1px solid ${def.color}88` : "none",
            }}
          />
        ))
      )}
    </div>
  );
}

// ─── Start Screen ─────────────────────────────────────────────────────────────

function StartScreen({ onStart, highScore }: { onStart: () => void; highScore: number }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", padding:"2rem", animation:"fadeUp 0.5s ease", gap:0 }}>
      {/* Logo */}
      <div style={{ position:"relative", marginBottom:"2rem" }}>
        <h1 style={{
          fontFamily:"'Orbitron',monospace", fontSize:"clamp(48px,10vw,80px)",
          fontWeight:900, letterSpacing:"-2px",
          background:"linear-gradient(135deg,var(--primary) 0%,var(--col-text-primary) 60%)",
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          lineHeight:1, animation:"glow-pulse 3s ease-in-out infinite",
        }}>TETRIS</h1>
        <div style={{ position:"absolute", bottom:-6, left:0, right:0, height:2, background:"var(--primary)", opacity:0.5, borderRadius:1 }}/>
      </div>

      {/* Decorative tetrominoes */}
      <div style={{ display:"flex", gap:12, marginBottom:"2.5rem", flexWrap:"wrap", justifyContent:"center" }}>
        {TYPES.map((t,i) => (
          <div key={t} style={{ animationDelay:`${i*0.08}s`, animation:"spin-in 0.5s ease both" }}>
            <PiecePreview type={t} size={14}/>
          </div>
        ))}
      </div>

      {/* High score */}
      {highScore > 0 && (
        <div style={{ marginBottom:"1.5rem", padding:"10px 24px", borderRadius:10, border:"1px solid var(--col-border)", background:"var(--col-surface)", textAlign:"center" }}>
          <div style={{ fontSize:10, fontFamily:"Orbitron", fontWeight:700, color:"var(--col-text-tertiary)", letterSpacing:"0.1em", marginBottom:3 }}>BEST SCORE</div>
          <div style={{ fontFamily:"Orbitron", fontSize:22, fontWeight:900, color:"var(--primary)" }}>{highScore.toLocaleString()}</div>
        </div>
      )}

      <button className="btn-primary" onClick={onStart} style={{ marginBottom:20, fontSize:18, padding:"16px 56px" }}>
        Play Now
      </button>

      {/* Controls */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, maxWidth:340, width:"100%" }}>
        {[
          { key:"← →",  action:"Move"     },
          { key:"↑",    action:"Rotate"   },
          { key:"↓",    action:"Soft Drop"},
          { key:"Space",action:"Hard Drop"},
          { key:"P",    action:"Pause"    },
          { key:"C",    action:"Hold"     },
        ].map(({ key, action }) => (
          <div key={action} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", borderRadius:8, background:"var(--col-surface)", border:"1px solid var(--col-border)" }}>
            <span className="key-badge" style={{ background:"var(--col-bg)", color:"var(--primary)", borderColor:"var(--primary)44" }}>{key}</span>
            <span style={{ fontSize:12, color:"var(--col-text-secondary)", fontWeight:500 }}>{action}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Game Over Screen ─────────────────────────────────────────────────────────

function GameOverScreen({ score, lines, level, highScore, onRestart, onMenu }: {
  score:number; lines:number; level:number; highScore:number;
  onRestart:()=>void; onMenu:()=>void;
}) {
  const isNew = score >= highScore && score > 0;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", padding:"2rem", animation:"scaleIn 0.4s ease" }}>
      <div style={{ fontFamily:"Orbitron", fontSize:32, fontWeight:900, color:"#ef4444", marginBottom:8, letterSpacing:"0.05em", animation:"shake 0.5s ease" }}>
        GAME OVER
      </div>
      {isNew && (
        <div style={{ fontFamily:"Orbitron", fontSize:13, fontWeight:700, color:"#f59e0b", marginBottom:16, letterSpacing:"0.1em", animation:"pulse 1s ease-in-out infinite" }}>
          ★ NEW HIGH SCORE ★
        </div>
      )}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:28, width:"100%", maxWidth:360 }}>
        {[
          { label:"SCORE",  val: score.toLocaleString(),  color:"var(--primary)" },
          { label:"LINES",  val: String(lines),            color:"#06b6d4"        },
          { label:"LEVEL",  val: String(level),            color:"#a855f7"        },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ padding:"16px 8px", borderRadius:12, background:"var(--col-surface)", border:"1px solid var(--col-border)", textAlign:"center" }}>
            <div style={{ fontFamily:"Orbitron", fontSize:20, fontWeight:900, color }}>{val}</div>
            <div style={{ fontSize:10, color:"var(--col-text-tertiary)", fontWeight:600, letterSpacing:"0.08em", marginTop:3 }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", gap:12 }}>
        <button className="btn-primary" onClick={onRestart}>Play Again</button>
        <button className="btn-ghost" onClick={onMenu}>Menu</button>
      </div>
    </div>
  );
}

// ─── Main Tetris Page ─────────────────────────────────────────────────────────

export default function TetrisPage() {
  const [screen,      setScreen]      = useState<Screen>("start");
  const [board,       setBoard]       = useState<Board>(emptyBoard());
  const [piece,       setPiece]       = useState<Piece | null>(null);
  const [nextPiece,   setNextPiece]   = useState<Piece | null>(null);
  const [holdPiece,   setHoldPiece]   = useState<TetrominoType | null>(null);
  const [holdUsed,    setHoldUsed]    = useState(false);
  const [score,       setScore]       = useState(0);
  const [lines,       setLines]       = useState(0);
  const [level,       setLevel]       = useState(0);
  const [highScore,   setHighScore]   = useState(0);
  const [clearAnim,   setClearAnim]   = useState<LineClearAnim | null>(null);
  const [floatScores, setFloatScores] = useState<{id:number;x:number;y:number;val:string}[]>([]);
  const [shakeBoard,  setShakeBoard]  = useState(false);
  const [isDark,      setIsDark]      = useState(false);
  const [cellSize,    setCellSize]    = useState(28);

  const boardRef    = useRef<Board>(emptyBoard());
  const pieceRef    = useRef<Piece | null>(null);
  const nextRef     = useRef<Piece | null>(null);
  const tickRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const floatIdRef  = useRef(0);
  const screenRef   = useRef<Screen>("start");

  // Sync refs
  useEffect(() => { boardRef.current = board; },  [board]);
  useEffect(() => { pieceRef.current = piece; },  [piece]);
  useEffect(() => { nextRef.current  = nextPiece; },[nextPiece]);
  useEffect(() => { screenRef.current = screen; }, [screen]);

  // Dark mode
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mq.matches);
    const h = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  // Responsive cell size
  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const maxBoardH = vh - 160;
      const maxBoardW = Math.min(vw * 0.42, 300);
      setCellSize(Math.floor(Math.min(maxBoardH / ROWS, maxBoardW / COLS)));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // High score from localStorage
  useEffect(() => {
    try {
      const stored = parseInt(localStorage.getItem("tetris-hs") || "0");
      if (!isNaN(stored)) setHighScore(stored);
    } catch {}
  }, []);

  // ── Game logic ──────────────────────────────────────────────────────────────

  const spawnPiece = useCallback((next?: Piece) => {
    const p = next ?? nextRef.current ?? randomPiece();
    const upcoming = randomPiece();
    if (collides(boardRef.current, p)) {
      // Game over
      setScreen("gameover");
      screenRef.current = "gameover";
      if (tickRef.current) clearInterval(tickRef.current);
      setScore(prev => {
        const best = Math.max(prev, highScore);
        try { localStorage.setItem("tetris-hs", String(best)); } catch {}
        setHighScore(best);
        return prev;
      });
      return;
    }
    setPiece(p);
    setNextPiece(upcoming);
  }, [highScore]);

  const lockPiece = useCallback(() => {
    const p = pieceRef.current;
    const b = boardRef.current;
    if (!p) return;

    const merged = mergePiece(b, p);
    const { board: cleared, cleared: n, rows } = clearLines(merged);

    if (n > 0) {
      // Animate cleared lines
      setClearAnim({ rows, startTime: Date.now() });
      setTimeout(() => {
        setClearAnim(null);
        boardRef.current = cleared;
        setBoard(cleared);
      }, 250);

      setLines(prev => {
        const next = prev + n;
        const newLevel = Math.floor(next / 10);
        setLevel(l => {
          if (newLevel > l) {
            // level up — restart timer with faster speed
            if (tickRef.current) clearInterval(tickRef.current);
            tickRef.current = setInterval(tick, levelSpeed(newLevel));
          }
          return newLevel;
        });
        return next;
      });

      setScore(prev => {
        const pts = scoreForLines(n, level);
        const next = prev + pts;
        // Float score
        const id = ++floatIdRef.current;
        setFloatScores(fs => [...fs, { id, x: COLS/2, y: rows[0], val: `+${pts}` }]);
        setTimeout(() => setFloatScores(fs => fs.filter(f => f.id !== id)), 1200);
        if (n >= 4) { setShakeBoard(true); setTimeout(() => setShakeBoard(false), 400); }
        return next;
      });

      boardRef.current = cleared;
      setBoard(cleared);
    } else {
      boardRef.current = merged;
      setBoard(merged);
    }

    setHoldUsed(false);
    spawnPiece();
  }, [level, spawnPiece]);

  const tick = useCallback(() => {
    if (screenRef.current !== "playing") return;
    const p = pieceRef.current;
    const b = boardRef.current;
    if (!p) return;
    if (collides(b, p, 0, 1)) {
      lockPiece();
    } else {
      const moved = { ...p, y: p.y + 1 };
      pieceRef.current = moved;
      setPiece(moved);
    }
  }, [lockPiece]);

  // Keep tick ref fresh
  const tickFnRef = useRef(tick);
  useEffect(() => { tickFnRef.current = tick; }, [tick]);

  const startGame = useCallback(() => {
    const b = emptyBoard();
    boardRef.current = b;
    setBoard(b);
    setScore(0); setLines(0); setLevel(0);
    setHoldPiece(null); setHoldUsed(false);
    setClearAnim(null); setFloatScores([]); setShakeBoard(false);

    const first  = randomPiece();
    const second = randomPiece();
    pieceRef.current = first;
    nextRef.current  = second;
    setPiece(first);
    setNextPiece(second);
    setScreen("playing");
    screenRef.current = "playing";

    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => tickFnRef.current(), TICK_INTERVAL);
  }, []);

  const pauseGame = useCallback(() => {
    if (screenRef.current === "playing") {
      setScreen("paused");
      screenRef.current = "paused";
      if (tickRef.current) clearInterval(tickRef.current);
    } else if (screenRef.current === "paused") {
      setScreen("playing");
      screenRef.current = "playing";
      tickRef.current = setInterval(() => tickFnRef.current(), levelSpeed(level));
    }
  }, [level]);

  // ── Controls ────────────────────────────────────────────────────────────────

  const movePiece = useCallback((dx: number) => {
    const p = pieceRef.current;
    const b = boardRef.current;
    if (!p || screenRef.current !== "playing") return;
    if (!collides(b, p, dx, 0)) {
      const moved = { ...p, x: p.x + dx };
      pieceRef.current = moved;
      setPiece(moved);
    }
  }, []);

  const rotatePiece = useCallback(() => {
    const p = pieceRef.current;
    const b = boardRef.current;
    if (!p || screenRef.current !== "playing") return;
    const rotated = rotate(p.shape);
    const kicks = [0, -1, 1, -2, 2];
    for (const kick of kicks) {
      if (!collides(b, p, kick, 0, rotated)) {
        const next = { ...p, shape: rotated, x: p.x + kick };
        pieceRef.current = next;
        setPiece(next);
        return;
      }
    }
  }, []);

  const softDrop = useCallback(() => {
    const p = pieceRef.current;
    const b = boardRef.current;
    if (!p || screenRef.current !== "playing") return;
    if (!collides(b, p, 0, 1)) {
      const moved = { ...p, y: p.y + 1 };
      pieceRef.current = moved;
      setPiece(moved);
      setScore(s => s + 1);
    } else {
      lockPiece();
    }
  }, [lockPiece]);

  const hardDrop = useCallback(() => {
    const p = pieceRef.current;
    const b = boardRef.current;
    if (!p || screenRef.current !== "playing") return;
    let ghost = { ...p };
    let dropped = 0;
    while (!collides(b, ghost, 0, 1)) { ghost = { ...ghost, y: ghost.y + 1 }; dropped++; }
    pieceRef.current = ghost;
    setPiece(ghost);
    setScore(s => s + dropped * 2);
    lockPiece();
  }, [lockPiece]);

  const holdCurrentPiece = useCallback(() => {
    const p = pieceRef.current;
    if (!p || holdUsed || screenRef.current !== "playing") return;
    const prevHold = holdPiece;
    setHoldPiece(p.type);
    setHoldUsed(true);
    if (prevHold) {
      const def = TETROMINOES[prevHold];
      const restored: Piece = {
        type: prevHold, shape: def.shape, color: def.color, glow: def.glow,
        x: Math.floor(COLS / 2) - Math.floor(def.shape[0].length / 2), y: 0,
      };
      pieceRef.current = restored;
      setPiece(restored);
    } else {
      spawnPiece();
    }
  }, [holdPiece, holdUsed, spawnPiece]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "p" || e.key === "P" || e.key === "Escape") { pauseGame(); return; }
      if (screenRef.current !== "playing") return;
      switch (e.key) {
        case "ArrowLeft":  case "a": case "A": e.preventDefault(); movePiece(-1); break;
        case "ArrowRight": case "d": case "D": e.preventDefault(); movePiece(1);  break;
        case "ArrowUp":    case "w": case "W": e.preventDefault(); rotatePiece(); break;
        case "ArrowDown":  case "s": case "S": e.preventDefault(); softDrop();    break;
        case " ":                               e.preventDefault(); hardDrop();    break;
        case "c": case "C":                    e.preventDefault(); holdCurrentPiece(); break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [movePiece, rotatePiece, softDrop, hardDrop, holdCurrentPiece, pauseGame]);

  // Cleanup
  useEffect(() => () => { if (tickRef.current) clearInterval(tickRef.current); }, []);

  // ── Render board ────────────────────────────────────────────────────────────

  const ghost = useMemo(() => {
    if (!piece || !board || screen !== "playing") return null;
    return getGhost(board, piece);
  }, [piece, board, screen]);

  // Merged visual board (board + ghost + piece)
  const visualCells = useMemo(() => {
    const cells: { color: string | null; isGhost?: boolean; glow?: string }[][] =
      board.map(row => row.map(c => ({ color: c })));

    if (ghost && piece) {
      for (let r = 0; r < ghost.shape.length; r++) {
        for (let c = 0; c < ghost.shape[r].length; c++) {
          if (!ghost.shape[r][c]) continue;
          const ny = ghost.y + r; const nx = ghost.x + c;
          if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS && !cells[ny][nx].color) {
            cells[ny][nx] = { color: piece.color, isGhost: true, glow: piece.glow };
          }
        }
      }
    }
    if (piece) {
      for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
          if (!piece.shape[r][c]) continue;
          const ny = piece.y + r; const nx = piece.x + c;
          if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS) {
            cells[ny][nx] = { color: piece.color, glow: piece.glow };
          }
        }
      }
    }
    return cells;
  }, [board, piece, ghost]);

  // ── CSS vars ────────────────────────────────────────────────────────────────

  const cssVars: React.CSSProperties = {
    "--col-bg":            isDark ? "#020617" : "#f8fafc",
    "--col-surface":       isDark ? "#0f172a" : "#ffffff",
    "--col-border":        isDark ? "rgba(148,163,184,0.13)" : "rgba(0,0,0,0.09)",
    "--col-text-primary":  isDark ? "#f1f5f9" : "#0f172a",
    "--col-text-secondary":isDark ? "#94a3b8" : "#64748b",
    "--col-text-tertiary": isDark ? "#475569"  : "#94a3b8",
    "--col-board":         isDark ? "#0a1628"  : "#f0f4f8",
    "--col-grid":          isDark ? "rgba(148,163,184,0.06)" : "rgba(0,0,0,0.05)",
    "--primary":           isDark ? "#3b82f6" : "#10b981",
    "--primary-glow":      isDark ? "rgba(59,130,246,0.35)" : "rgba(16,185,129,0.35)",
  } as React.CSSProperties;

  const boardW = COLS * cellSize;
  const boardH = ROWS * cellSize;

  // ── Screens ─────────────────────────────────────────────────────────────────

  if (screen === "start") {
    return (
      <>
        <style>{GLOBAL_CSS}</style>
        <div className="tetris-root" style={{ ...cssVars, background:"var(--col-bg)" }}>
          <StartScreen onStart={startGame} highScore={highScore}/>
        </div>
      </>
    );
  }

  if (screen === "gameover") {
    return (
      <>
        <style>{GLOBAL_CSS}</style>
        <div className="tetris-root" style={{ ...cssVars, background:"var(--col-bg)" }}>
          <GameOverScreen score={score} lines={lines} level={level} highScore={highScore}
            onRestart={startGame} onMenu={() => setScreen("start")}/>
        </div>
      </>
    );
  }

  // ── Playing / Paused ────────────────────────────────────────────────────────

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className="tetris-root" style={{ ...cssVars, background:"var(--col-bg)", display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", padding:"1rem", gap:16 }}>

        {/* ── LEFT PANEL ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:12, alignItems:"flex-end", minWidth:110 }}>
          {/* Hold */}
          <Panel label="HOLD">
            <div style={{ opacity: holdUsed ? 0.35 : 1, transition:"opacity 0.2s", minHeight:60, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <PiecePreview type={holdPiece} size={18}/>
            </div>
          </Panel>

          {/* Score */}
          <Panel label="SCORE">
            <div style={{ fontFamily:"Orbitron", fontSize:18, fontWeight:900, color:"var(--primary)", lineHeight:1 }}>
              {score.toLocaleString()}
            </div>
          </Panel>

          <Panel label="BEST">
            <div style={{ fontFamily:"Orbitron", fontSize:14, fontWeight:700, color:"var(--col-text-secondary)" }}>
              {highScore.toLocaleString()}
            </div>
          </Panel>

          {/* Controls reminder */}
          <Panel label="CONTROLS">
            <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
              {[["←→","Move"],["↑","Rotate"],["↓","Drop"],["Spc","Lock"],["C","Hold"],["P","Pause"]].map(([k,a])=>(
                <div key={k} style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span className="key-badge" style={{ fontSize:9, color:"var(--primary)" }}>{k}</span>
                  <span style={{ fontSize:10, color:"var(--col-text-tertiary)" }}>{a}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* ── BOARD ── */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
          {/* Level indicator */}
          <div style={{ display:"flex", alignItems:"center", gap:10, width:"100%" }}>
            <div style={{ fontFamily:"Orbitron", fontSize:11, fontWeight:700, color:"var(--col-text-tertiary)", letterSpacing:"0.1em" }}>LVL</div>
            <div style={{ flex:1, height:4, borderRadius:2, background:"var(--col-border)", overflow:"hidden" }}>
              <div style={{ height:"100%", borderRadius:2, background:"var(--primary)", width:`${(lines % 10) * 10}%`, transition:"width 0.4s ease" }}/>
            </div>
            <div style={{ fontFamily:"Orbitron", fontSize:13, fontWeight:900, color:"var(--primary)", minWidth:20, textAlign:"right" }}>{level}</div>
          </div>

          {/* Board container */}
          <div
            style={{
              position:"relative",
              width: boardW,
              height: boardH,
              background:"var(--col-board)",
              borderRadius:8,
              overflow:"hidden",
              boxShadow:`0 0 0 2px var(--col-border), 0 0 32px ${isDark?"rgba(0,0,0,0.6)":"rgba(0,0,0,0.12)"}, inset 0 0 0 1px rgba(255,255,255,0.04)`,
              animation: shakeBoard ? "shake 0.4s ease" : undefined,
            }}
          >
            {/* Grid lines */}
            <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }} viewBox={`0 0 ${boardW} ${boardH}`}>
              {Array.from({ length: COLS + 1 }).map((_, c) => (
                <line key={`v${c}`} x1={c*cellSize} y1={0} x2={c*cellSize} y2={boardH} stroke="var(--col-grid)" strokeWidth={1}/>
              ))}
              {Array.from({ length: ROWS + 1 }).map((_, r) => (
                <line key={`h${r}`} x1={0} y1={r*cellSize} x2={boardW} y2={r*cellSize} stroke="var(--col-grid)" strokeWidth={1}/>
              ))}
            </svg>

            {/* Cells */}
            {visualCells.map((row, r) =>
              row.map((cell, c) => {
                if (!cell.color) return null;
                const isClearing = clearAnim?.rows.includes(r);
                return (
                  <div
                    key={`${r}-${c}`}
                    className="board-cell"
                    style={{
                      left: c * cellSize + 1,
                      top:  r * cellSize + 1,
                      width:  cellSize - 2,
                      height: cellSize - 2,
                      borderRadius: 3,
                      background: cell.isGhost
                        ? `${cell.color}22`
                        : cell.color,
                      border: cell.isGhost
                        ? `1.5px dashed ${cell.color}66`
                        : `1px solid ${cell.color}cc`,
                      boxShadow: cell.isGhost ? "none" : `inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.2), 0 0 6px ${cell.glow ?? "transparent"}`,
                      animation: isClearing ? "flash-row 0.25s ease 2" : cell.isGhost ? undefined : "drop-in 0.1s ease",
                      opacity: cell.isGhost ? 0.55 : 1,
                    }}
                  />
                );
              })
            )}

            {/* Float score labels */}
            {floatScores.map(fs => (
              <div
                key={fs.id}
                style={{
                  position:"absolute",
                  left: fs.x * cellSize,
                  top:  fs.y * cellSize,
                  fontFamily:"Orbitron", fontSize:14, fontWeight:900, color:"#f59e0b",
                  pointerEvents:"none", zIndex:50,
                  animation:"float-score 1.2s ease forwards",
                  textShadow:"0 0 8px rgba(245,158,11,0.6)",
                  whiteSpace:"nowrap",
                }}
              >
                {fs.val}
              </div>
            ))}

            {/* Pause overlay */}
            {screen === "paused" && (
              <div style={{ position:"absolute", inset:0, background:isDark?"rgba(2,6,23,0.88)":"rgba(248,250,252,0.92)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, backdropFilter:"blur(4px)", zIndex:40 }}>
                <div style={{ fontFamily:"Orbitron", fontSize:24, fontWeight:900, color:"var(--primary)", letterSpacing:"0.1em", animation:"pulse 1.5s ease-in-out infinite" }}>PAUSED</div>
                <button className="btn-primary" onClick={pauseGame} style={{ fontSize:13 }}>Resume</button>
                <button className="btn-ghost" onClick={() => { if(tickRef.current) clearInterval(tickRef.current); setScreen("start"); }}>Menu</button>
              </div>
            )}
          </div>

          {/* Lines counter */}
          <div style={{ display:"flex", gap:16 }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontFamily:"Orbitron", fontSize:14, fontWeight:900, color:"#06b6d4" }}>{lines}</div>
              <div style={{ fontSize:9, color:"var(--col-text-tertiary)", fontWeight:600, letterSpacing:"0.08em" }}>LINES</div>
            </div>
          </div>

          {/* Mobile controls */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,46px)", gap:6, marginTop:4 }}>
            {[
              { label:"←", action: () => movePiece(-1) },
              { label:"↓", action: softDrop },
              { label:"→", action: () => movePiece(1) },
              { label:"↑", action: rotatePiece },
            ].map(({ label, action }) => (
              <button key={label} onClick={action}
                style={{ width:46, height:46, borderRadius:10, border:"1.5px solid var(--col-border)", background:"var(--col-surface)", color:"var(--col-text-primary)", fontSize:18, cursor:"pointer", fontFamily:"Fira Code,monospace", transition:"all 0.12s", display:"flex", alignItems:"center", justifyContent:"center" }}
                onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.background="var(--primary)"; (e.currentTarget as HTMLButtonElement).style.color="#fff"; }}
                onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.background="var(--col-surface)"; (e.currentTarget as HTMLButtonElement).style.color="var(--col-text-primary)"; }}
              >{label}</button>
            ))}
            <button onClick={hardDrop}
              style={{ gridColumn:"1/3", height:40, borderRadius:10, border:"1.5px solid var(--col-border)", background:"var(--col-surface)", color:"var(--col-text-primary)", fontSize:11, cursor:"pointer", fontFamily:"Orbitron", fontWeight:700, transition:"all 0.12s" }}
              onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.background="var(--primary)"; (e.currentTarget as HTMLButtonElement).style.color="#fff"; }}
              onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.background="var(--col-surface)"; (e.currentTarget as HTMLButtonElement).style.color="var(--col-text-primary)"; }}
            >DROP</button>
            <button onClick={holdCurrentPiece}
              style={{ gridColumn:"3/5", height:40, borderRadius:10, border:`1.5px solid ${holdUsed ? "var(--col-border)" : "var(--primary)"}`, background:"var(--col-surface)", color: holdUsed ? "var(--col-text-tertiary)" : "var(--primary)", fontSize:11, cursor:"pointer", fontFamily:"Orbitron", fontWeight:700, transition:"all 0.12s" }}
            >HOLD</button>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:12, alignItems:"flex-start", minWidth:110 }}>
          {/* Next piece */}
          <Panel label="NEXT">
            <div style={{ minHeight:60, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <PiecePreview type={nextPiece?.type ?? null} size={18}/>
            </div>
          </Panel>

          {/* Lines */}
          <Panel label="LINES">
            <div style={{ fontFamily:"Orbitron", fontSize:18, fontWeight:900, color:"#06b6d4" }}>
              {lines}
            </div>
          </Panel>

          {/* Level */}
          <Panel label="LEVEL">
            <div style={{ fontFamily:"Orbitron", fontSize:18, fontWeight:900, color:"#a855f7", animation: level > 0 ? "levelUp 0.4s ease" : undefined }}>
              {level}
            </div>
          </Panel>

          {/* Pause button */}
          <button
            onClick={pauseGame}
            className="btn-ghost"
            style={{ width:"100%", marginTop:4 }}
          >
            {screen === "paused" ? "▶ Resume" : "⏸ Pause"}
          </button>

          {/* Tetromino legend */}
          <Panel label="PIECES">
            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
              {TYPES.map(t => (
                <div key={t} style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:8, height:8, borderRadius:2, background:TETROMINOES[t].color, flexShrink:0, boxShadow:`0 0 5px ${TETROMINOES[t].glow}` }}/>
                  <span style={{ fontFamily:"Orbitron", fontSize:10, fontWeight:700, color:"var(--col-text-tertiary)" }}>{t}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}

// ─── Panel helper ─────────────────────────────────────────────────────────────

function Panel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--col-surface)",
      border: "1px solid var(--col-border)",
      borderRadius: 10,
      padding: "10px 12px",
      width: "100%",
      minWidth: 100,
    }}>
      <div style={{
        fontFamily: "Orbitron,monospace", fontSize: 9, fontWeight: 700,
        color: "var(--col-text-tertiary)", letterSpacing: "0.1em",
        textTransform: "uppercase", marginBottom: 8,
        borderBottom: "0.5px solid var(--col-border)", paddingBottom: 6,
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}
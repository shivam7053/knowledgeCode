"use client";
import { useEffect, useRef, useState, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const COLS = 20;
const ROWS = 20;
const CELL = 24;
const CANVAS_SIZE = COLS * CELL; // 480

// ─── Types ────────────────────────────────────────────────────────────────────
type Dir = { x: number; y: number };
type Cell = { x: number; y: number };

type GameMode = "normal" | "speedy" | "wall" | "zen";

interface ModeConfig {
  label: string;
  speed: number;
  wrap: boolean;
  desc: string;
}

type PowerUpType = "ghost" | "slow" | "double" | "shrink";

interface PowerUp extends Cell {
  type: PowerUpType;
  color: string;
  label: string;
  duration: number;
  age: number;
  maxAge: number;
}

interface Food extends Cell {
  color: string;
  pulse: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  r: number;
}

type Phase = "idle" | "playing" | "dead";

// ─── Config ───────────────────────────────────────────────────────────────────
const MODES: Record<GameMode, ModeConfig> = {
  normal: { label: "Normal", speed: 150, wrap: true,  desc: "Classic wrap-around" },
  speedy: { label: "Speedy", speed: 80,  wrap: true,  desc: "Fast pace, same rules" },
  wall:   { label: "Walls",  speed: 140, wrap: false, desc: "Walls kill you" },
  zen:    { label: "Zen",    speed: 160, wrap: true,  desc: "No death — just chill" },
};

const FOOD_COLORS = ["#E24B4A", "#EF9F27", "#1D9E75", "#378ADD", "#D4537E"];

const POWERUP_DEFS: Array<{ type: PowerUpType; color: string; label: string; duration: number }> = [
  { type: "ghost",  color: "#7F77DD", label: "Ghost — pass through self", duration: 180 },
  { type: "slow",   color: "#1D9E75", label: "Slow — half speed",         duration: 200 },
  { type: "double", color: "#EF9F27", label: "2x — double points",        duration: 180 },
  { type: "shrink", color: "#E24B4A", label: "Shrink — lose 3 segments",  duration: 0   },
];

// ─── Canvas helpers ───────────────────────────────────────────────────────────
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y,     x + w, y + r,     r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x,     y + h, x,     y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x,     y,     x + r, y,           r);
  ctx.closePath();
}

function rnd(n: number) { return Math.floor(Math.random() * n); }
function cellKey(x: number, y: number) { return `${x},${y}`; }

// ─── Component ────────────────────────────────────────────────────────────────
export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ── Game state stored in refs (mutated each frame, no re-render needed) ──
  const snakeRef    = useRef<Cell[]>([]);
  const dirRef      = useRef<Dir>({ x: 1, y: 0 });
  const nextDirRef  = useRef<Dir>({ x: 1, y: 0 });
  const foodRef     = useRef<Food>({ x: 5, y: 5, color: "#E24B4A", pulse: 0 });
  const puRef       = useRef<PowerUp[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef    = useRef(0);
  const loopRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scoreRef    = useRef(0);
  const bestRef     = useRef(0);
  const ghostRef    = useRef(0);
  const slowRef     = useRef(0);
  const doubleRef   = useRef(0);
  const runningRef  = useRef(false);
  const modeRef     = useRef<GameMode>("normal");

  // ── React UI state (only for overlay / HUD re-renders) ──
  const [phase, setPhase]       = useState<Phase>("idle");
  const [score, setScore]       = useState(0);
  const [best, setBest]         = useState(0);
  const [mode, setModeState]    = useState<GameMode>("normal");
  const [puMsg, setPuMsg]       = useState<{ text: string; color: string } | null>(null);
  const [deathMsg, setDeathMsg] = useState("");

  // ─── Helpers ─────────────────────────────────────────────────────────────
  const freeCell = useCallback((): Cell => {
    const occupied = new Set<string>();
    snakeRef.current.forEach(s => occupied.add(cellKey(s.x, s.y)));
    puRef.current.forEach(p => occupied.add(cellKey(p.x, p.y)));
    occupied.add(cellKey(foodRef.current.x, foodRef.current.y));
    let x = 0, y = 0, tries = 0;
    do { x = rnd(COLS); y = rnd(ROWS); tries++; }
    while (occupied.has(cellKey(x, y)) && tries < 400);
    return { x, y };
  }, []);

  const spawnFood = useCallback(() => {
    const c = freeCell();
    foodRef.current = { ...c, color: FOOD_COLORS[rnd(FOOD_COLORS.length)], pulse: 0 };
  }, [freeCell]);

  const spawnPowerup = useCallback(() => {
    if (puRef.current.length >= 2) return;
    const def = POWERUP_DEFS[rnd(POWERUP_DEFS.length)];
    const c = freeCell();
    puRef.current.push({ ...def, ...c, age: 0, maxAge: 600 });
  }, [freeCell]);

  const maybePowerup = useCallback(() => {
    const s = scoreRef.current;
    if (s > 0 && s % 30 === 0) spawnPowerup();
    else if (rnd(8) === 0 && s > 10) spawnPowerup();
  }, [spawnPowerup]);

  const burst = useCallback((gx: number, gy: number, color: string) => {
    const px = gx * CELL + CELL / 2;
    const py = gy * CELL + CELL / 2;
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8 + Math.random() * 0.4;
      const spd = 1 + Math.random() * 2;
      particlesRef.current.push({
        x: px, y: py,
        vx: Math.cos(a) * spd, vy: Math.sin(a) * spd - 1.5,
        color, life: 1, r: 2 + Math.random() * 2,
      });
    }
  }, []);

  const showPU = useCallback((text: string, color: string) => {
    setPuMsg({ text, color });
    setTimeout(() => setPuMsg(null), 2200);
  }, []);

  const applyPowerup = useCallback((p: PowerUp) => {
    if (p.type === "ghost")  { ghostRef.current  = p.duration; showPU("Ghost active — pass through self!", p.color); }
    if (p.type === "slow")   { slowRef.current   = p.duration; showPU("Slow mode active", p.color); }
    if (p.type === "double") { doubleRef.current = p.duration; showPU("2x points active!", p.color); }
    if (p.type === "shrink") {
      snakeRef.current.splice(Math.max(2, snakeRef.current.length - 3));
      showPU("Shrink! −3 segments", p.color);
    }
  }, [showPU]);

  const tryDir = useCallback((dx: number, dy: number) => {
    if (!runningRef.current) return;
    const d = dirRef.current;
    if (dx === 1 && d.x === -1) return;
    if (dx === -1 && d.x === 1) return;
    if (dy === 1 && d.y === -1) return;
    if (dy === -1 && d.y === 1) return;
    nextDirRef.current = { x: dx, y: dy };
  }, []);

  // ─── Draw ─────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const f = frameRef.current;
    const snake = snakeRef.current;
    const food = foodRef.current;
    const dir = dirRef.current;
    const ghost = ghostRef.current > 0;

    const BG = "#0e1117";
    const GRID = "rgba(255,255,255,0.03)";

    // Background
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Grid
    ctx.strokeStyle = GRID; ctx.lineWidth = 0.5;
    for (let i = 0; i <= COLS; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, CANVAS_SIZE); ctx.stroke();
    }
    for (let j = 0; j <= ROWS; j++) {
      ctx.beginPath(); ctx.moveTo(0, j * CELL); ctx.lineTo(CANVAS_SIZE, j * CELL); ctx.stroke();
    }

    // Snake
    snake.forEach((seg, i) => {
      const t = i / snake.length;
      let col: string;
      if (ghost) {
        col = `rgba(175,169,236,${(0.85 - t * 0.5).toFixed(2)})`;
      } else {
        const r1 = [93, 202, 165], r2 = [29, 158, 117];
        const r = Math.round(r1[0] + (r2[0] - r1[0]) * t);
        const g = Math.round(r1[1] + (r2[1] - r1[1]) * t);
        const b = Math.round(r1[2] + (r2[2] - r1[2]) * t);
        col = `rgb(${r},${g},${b})`;
      }
      ctx.fillStyle = col;
      const pad = i === 0 ? 1 : 2;
      const x = seg.x * CELL + pad, y = seg.y * CELL + pad, s = CELL - pad * 2;
      roundRect(ctx, x, y, s, s, i === 0 ? 5 : 3);
      ctx.fill();

      // Eyes
      if (i === 0) {
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        const cx = seg.x * CELL + CELL / 2 + dir.x * 4;
        const cy = seg.y * CELL + CELL / 2 + dir.y * 4;
        ctx.beginPath(); ctx.arc(cx + dir.y * 4, cy - dir.x * 4, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx - dir.y * 4, cy + dir.x * 4, 2, 0, Math.PI * 2); ctx.fill();
        // Shine
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        roundRect(ctx, x + 2, y + 2, s * 0.4, s * 0.25, 2); ctx.fill();
      }
    });

    // Timer arcs on head
    if (snake.length > 0) {
      const hx = snake[0].x * CELL + CELL / 2;
      const hy = snake[0].y * CELL + CELL / 2;
      const drawArc = (t: number, max: number, r: number, color: string) => {
        if (t <= 0) return;
        ctx.strokeStyle = color + "99"; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(hx, hy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (t / max));
        ctx.stroke();
      };
      drawArc(ghostRef.current,  180, CELL / 2 - 1,  "#7F77DD");
      drawArc(slowRef.current,   200, CELL / 2 + 3,  "#1D9E75");
      drawArc(doubleRef.current, 180, CELL / 2 + 7,  "#EF9F27");
    }

    // Food
    food.pulse = (food.pulse ?? 0) + 0.08;
    const fp = 0.85 + Math.sin(food.pulse) * 0.1;
    const fx = food.x * CELL + CELL / 2, fy = food.y * CELL + CELL / 2, fr = (CELL / 2) * 0.72 * fp;
    ctx.fillStyle = food.color;
    ctx.beginPath(); ctx.arc(fx, fy, fr, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath(); ctx.arc(fx - fr * 0.25, fy - fr * 0.25, fr * 0.3, 0, Math.PI * 2); ctx.fill();

    // Power-ups
    puRef.current.forEach(p => {
      const fade = p.age > p.maxAge - 120 ? 1 - (p.age - (p.maxAge - 120)) / 120 : 1;
      const px = p.x * CELL + CELL / 2, py = p.y * CELL + CELL / 2;
      const pulse = 0.82 + Math.sin(f * 0.12 + p.x) * 0.1;
      ctx.globalAlpha = fade;
      ctx.fillStyle = p.color;
      const sz = (CELL / 2) * 0.78 * pulse;
      ctx.beginPath();
      ctx.moveTo(px, py - sz); ctx.lineTo(px + sz, py);
      ctx.lineTo(px, py + sz); ctx.lineTo(px - sz, py);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.28)";
      ctx.beginPath();
      ctx.moveTo(px, py - sz * 0.5); ctx.lineTo(px + sz * 0.5, py);
      ctx.lineTo(px, py); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(p.type[0].toUpperCase(), px, py + sz + 7);
    });

    // Particles
    particlesRef.current.forEach(pt => {
      ctx.globalAlpha = pt.life * 0.8;
      ctx.fillStyle = pt.color;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r * pt.life, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
  }, []);

  // ─── Update ───────────────────────────────────────────────────────────────
  const update = useCallback(() => {
    dirRef.current = { ...nextDirRef.current };
    const dir = dirRef.current;
    const snake = snakeRef.current;
    const m = MODES[modeRef.current];

    let head: Cell = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    // Wrap or wall collision
    if (m.wrap) {
      head.x = (head.x + COLS) % COLS;
      head.y = (head.y + ROWS) % ROWS;
    } else {
      if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
        if (modeRef.current !== "zen") { die(); return; }
        head.x = Math.max(0, Math.min(COLS - 1, head.x));
        head.y = Math.max(0, Math.min(ROWS - 1, head.y));
      }
    }

    // Self collision
    const selfHit = ghostRef.current <= 0 && snake.some(s => s.x === head.x && s.y === head.y);
    if (selfHit && modeRef.current !== "zen") { die(); return; }

    snake.unshift(head);

    // Eat food
    const food = foodRef.current;
    if (head.x === food.x && head.y === food.y) {
      const pts = doubleRef.current > 0 ? 2 : 1;
      scoreRef.current += pts;
      setScore(scoreRef.current);
      if (scoreRef.current > bestRef.current) {
        bestRef.current = scoreRef.current;
        setBest(bestRef.current);
      }
      burst(food.x, food.y, food.color);
      spawnFood();
      maybePowerup();
      if (doubleRef.current > 0) snake.unshift({ ...head }); // extra growth
    } else {
      snake.pop();
    }

    // Tick timers
    if (ghostRef.current  > 0) ghostRef.current--;
    if (slowRef.current   > 0) slowRef.current--;
    if (doubleRef.current > 0) doubleRef.current--;

    // Power-up collisions + expiry
    puRef.current = puRef.current.filter(p => {
      p.age++;
      if (p.age >= p.maxAge) return false;
      if (p.x === head.x && p.y === head.y) {
        applyPowerup(p);
        burst(p.x, p.y, p.color);
        return false;
      }
      return true;
    });

    // Particles
    particlesRef.current = particlesRef.current.filter(pt => {
      pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.04; pt.life -= 0.04;
      return pt.life > 0;
    });
  }, [burst, spawnFood, maybePowerup, applyPowerup]);

  const die = useCallback(() => {
    runningRef.current = false;
    if (loopRef.current) clearTimeout(loopRef.current);
    const tips = [
      "Try Speedy for a challenge",
      "Walls mode adds real tension",
      "Zen mode is chill — no death",
      "Collect power-ups to survive longer",
    ];
    setDeathMsg(tips[rnd(tips.length)]);
    setPhase("dead");
  }, []);

  // ─── Game loop ─────────────────────────────────────────────────────────────
  const tick = useCallback(() => {
    if (!runningRef.current) return;
    frameRef.current++;
    const speed = MODES[modeRef.current].speed;
    const interval = slowRef.current > 0 ? speed * 2.2 : speed;
    update();
    draw();
    loopRef.current = setTimeout(tick, interval);
  }, [update, draw]);

  // ─── Start ────────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    if (loopRef.current) clearTimeout(loopRef.current);
    snakeRef.current    = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    dirRef.current      = { x: 1, y: 0 };
    nextDirRef.current  = { x: 1, y: 0 };
    puRef.current       = [];
    particlesRef.current = [];
    scoreRef.current    = 0;
    frameRef.current    = 0;
    ghostRef.current    = 0;
    slowRef.current     = 0;
    doubleRef.current   = 0;
    runningRef.current  = true;
    setScore(0);
    setPhase("playing");
    spawnFood();
    tick();
  }, [spawnFood, tick]);

  // ─── Keyboard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft"  || e.key === "a" || e.key === "A") { e.preventDefault(); tryDir(-1, 0); }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") { e.preventDefault(); tryDir( 1, 0); }
      if (e.key === "ArrowUp"    || e.key === "w" || e.key === "W") { e.preventDefault(); tryDir( 0,-1); }
      if (e.key === "ArrowDown"  || e.key === "s" || e.key === "S") { e.preventDefault(); tryDir( 0, 1); }
      if ((e.key === " " || e.key === "Enter") && !runningRef.current) startGame();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tryDir, startGame]);

  // ─── Idle canvas draw ─────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#0e1117";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.strokeStyle = "rgba(255,255,255,0.03)"; ctx.lineWidth = 0.5;
    for (let i = 0; i <= COLS; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, CANVAS_SIZE); ctx.stroke();
    }
    for (let j = 0; j <= ROWS; j++) {
      ctx.beginPath(); ctx.moveTo(0, j * CELL); ctx.lineTo(CANVAS_SIZE, j * CELL); ctx.stroke();
    }
  }, []);

  // ─── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => { if (loopRef.current) clearTimeout(loopRef.current); };
  }, []);

  // ─── Mode change ─────────────────────────────────────────────────────────
  const handleMode = (m: GameMode) => {
    modeRef.current = m;
    setModeState(m);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  const modeKeys = Object.keys(MODES) as GameMode[];

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #050510 0%, #0e0820 100%)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: 12, padding: "16px 8px",
      fontFamily: "'Courier New', monospace", userSelect: "none",
    }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, width: CANVAS_SIZE }}>
        <StatCard label="Score" value={score} />
        <div style={{ flex: 1, textAlign: "center", fontSize: 15, fontWeight: 500, color: "rgba(255,255,255,0.5)", letterSpacing: "0.14em" }}>
          SNAKE
        </div>
        <StatCard label="Best" value={best} />
      </div>

      {/* Mode buttons */}
      <div style={{ display: "flex", gap: 8, width: CANVAS_SIZE }}>
        {modeKeys.map(m => (
          <ModeButton key={m} label={MODES[m].label} active={mode === m} onClick={() => handleMode(m)} />
        ))}
      </div>

      {/* Power-up status bar */}
      <div style={{ width: CANVAS_SIZE, minHeight: 28, display: "flex", alignItems: "center" }}>
        {puMsg ? (
          <div style={{
            padding: "3px 12px", borderRadius: 6, fontSize: 11, letterSpacing: "0.06em",
            border: `0.5px solid ${puMsg.color}66`, background: puMsg.color + "22", color: puMsg.color,
            transition: "opacity .3s",
          }}>
            {puMsg.text}
          </div>
        ) : (
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", letterSpacing: "0.06em" }}>
            Power-ups appear as you grow
          </div>
        )}
      </div>

      {/* Canvas */}
      <div style={{
        position: "relative", width: CANVAS_SIZE, height: CANVAS_SIZE,
        borderRadius: 10, overflow: "hidden",
        border: "0.5px solid rgba(255,255,255,0.12)",
      }}>
        <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE}
          style={{ display: "block", width: CANVAS_SIZE, height: CANVAS_SIZE, imageRendering: "pixelated" }}
        />

        {/* Overlay */}
        {phase !== "playing" && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 14,
            background: "rgba(0,0,0,0.6)", borderRadius: 10, backdropFilter: "blur(4px)",
          }}>
            {phase === "idle" && (
              <>
                <div style={{ fontSize: 28, fontWeight: 500, color: "#fff", letterSpacing: "0.12em" }}>SNAKE</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", textAlign: "center", lineHeight: 2, maxWidth: 260 }}>
                  Collect food, avoid yourself.<br />
                  Power-ups boost your run!<br />
                  <span style={{ opacity: 0.5 }}>🍄Ghost · 🐢Slow · ⚡2x · ✂️Shrink</span>
                </div>
              </>
            )}
            {phase === "dead" && (
              <>
                <div style={{ fontSize: 28, fontWeight: 500, color: "#E24B4A", letterSpacing: "0.12em" }}>GAME OVER</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", textAlign: "center", lineHeight: 1.8 }}>
                  Score: <strong>{score}</strong> &nbsp;·&nbsp; Best: <strong>{best}</strong>
                  <br />
                  <span style={{ fontSize: 11, opacity: 0.5 }} dangerouslySetInnerHTML={{ __html: deathMsg }} />
                </div>
              </>
            )}

            {/* Mode selector in overlay */}
            <div style={{ display: "flex", gap: 8 }}>
              {modeKeys.map(m => (
                <ModeButton key={m} label={MODES[m].label} active={mode === m} onClick={() => handleMode(m)} />
              ))}
            </div>

            <button
              onClick={startGame}
              style={{
                padding: "10px 32px", borderRadius: 8,
                border: "0.5px solid rgba(255,255,255,0.3)",
                background: "rgba(255,255,255,0.12)", color: "#fff",
                fontFamily: "'Courier New', monospace", fontSize: 13,
                cursor: "pointer", letterSpacing: "0.08em",
              }}
            >
              {phase === "idle" ? "Play" : "Play again"}
            </button>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.06em" }}>
              arrow keys · wasd · d-pad below
            </div>
          </div>
        )}
      </div>

      {/* D-pad */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 40px)", gridTemplateRows: "repeat(2, 40px)", gap: 5 }}>
        <div />
        <DpadKey label="↑" onPress={() => tryDir(0, -1)} />
        <div />
        <DpadKey label="←" onPress={() => tryDir(-1, 0)} />
        <DpadKey label="↓" onPress={() => tryDir(0, 1)} />
        <DpadKey label="→" onPress={() => tryDir(1, 0)} />
      </div>

      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.18)", letterSpacing: "0.08em" }}>
        KEYBOARD · WASD · TOUCH D-PAD
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      background: "rgba(255,255,255,0.06)", borderRadius: 8,
      padding: "6px 20px", minWidth: 72,
    }}>
      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        {label}
      </span>
      <span style={{ fontSize: 22, fontWeight: 500, color: "#fff" }}>{value}</span>
    </div>
  );
}

function ModeButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: "5px 0", borderRadius: 6, cursor: "pointer",
        border: active ? "0.5px solid rgba(255,255,255,0.8)" : "0.5px solid rgba(255,255,255,0.15)",
        background: active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.06)",
        color: active ? "#0e1117" : "rgba(255,255,255,0.5)",
        fontFamily: "'Courier New', monospace", fontSize: 11, letterSpacing: "0.06em",
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );
}

function DpadKey({ label, onPress }: { label: string; onPress: () => void }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div
      onMouseDown={() => { setPressed(true); onPress(); }}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={e => { e.preventDefault(); setPressed(true); onPress(); }}
      onTouchEnd={() => setPressed(false)}
      style={{
        width: 40, height: 40, borderRadius: 8, cursor: "pointer",
        border: pressed ? "0.5px solid rgba(255,255,255,0.8)" : "0.5px solid rgba(255,255,255,0.15)",
        background: pressed ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.06)",
        color: pressed ? "#0e1117" : "rgba(255,255,255,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16, transition: "all 0.1s", userSelect: "none",
      }}
    >
      {label}
    </div>
  );
}
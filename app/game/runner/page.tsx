"use client";

/**
 * RunnerGame — page.tsx
 * Subway-Surfer style 3-lane endless runner
 * Stack: Next.js 14 App Router + MUI v5 + HTML5 Canvas
 * Place at: app/game/page.tsx
 *
 * Controls: ← → Arrow keys or A/D to switch lanes | ↑ / W / Space to jump | ↓ / S to slide
 * Mobile:   Tap left/right thirds to switch lanes, tap center to jump
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Box,
  Button,
  Chip,
  Collapse,
  Typography,
} from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen = "start" | "playing" | "gameover";
type Difficulty = "easy" | "medium" | "hard";
type Lane = 0 | 1 | 2;

interface DiffConfig {
  label: string;
  emoji: string;
  baseSpeed: number;
  speedInc: number;
  obstacleRate: number;
  coinRate: number;
  color: string;
  desc: string;
}

// ─── Difficulty configs ───────────────────────────────────────────────────────
const DIFF: Record<Difficulty, DiffConfig> = {
  easy:   { label: "Easy",   emoji: "🌱", baseSpeed: 5,   speedInc: 0.0008, obstacleRate: 0.012, coinRate: 0.06, color: "#22c55e", desc: "Chill vibes. Perfect for starters." },
  medium: { label: "Medium", emoji: "🔥", baseSpeed: 7,   speedInc: 0.0015, obstacleRate: 0.020, coinRate: 0.05, color: "#f59e0b", desc: "Things get spicy fast." },
  hard:   { label: "Hard",   emoji: "💀", baseSpeed: 10,  speedInc: 0.0025, obstacleRate: 0.030, coinRate: 0.04, color: "#ef4444", desc: "No mercy. Pure chaos." },
};

// ─── Canvas constants ─────────────────────────────────────────────────────────
const CW = 480;           // canvas width
const CH = 640;           // canvas height
const GROUND_Y = CH - 90; // ground line y
const LANE_XS = [CW * 0.22, CW * 0.5, CW * 0.78]; // lane center x coords
const PLAYER_W = 36;
const PLAYER_H = 60;
const SLIDE_H  = 28;

// ─── Styled ───────────────────────────────────────────────────────────────────
const pulse = keyframes`
  0%,100% { transform: scale(1); opacity:1; }
  50%      { transform: scale(1.05); opacity:.85; }
`;
const float = keyframes`
  0%,100% { transform: translateY(0); }
  50%      { transform: translateY(-10px); }
`;
const scanline = keyframes`
  0%   { background-position: 0 0; }
  100% { background-position: 0 100%; }
`;

const Wrap = styled(Box)({
  minHeight: "100vh",
  background: "#05070d",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "'Orbitron', 'Segoe UI', monospace",
  overflow: "hidden",
  position: "relative",
  "&::before": {
    content: '""',
    position: "fixed",
    inset: 0,
    background: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,200,0.015) 2px, rgba(0,255,200,0.015) 4px)`,
    pointerEvents: "none",
    zIndex: 0,
  },
});

const GlowText = styled(Typography)<{ glowcolor?: string }>(({ glowcolor = "#00ffc8" }) => ({
  color: glowcolor,
  textShadow: `0 0 10px ${glowcolor}88, 0 0 30px ${glowcolor}44`,
  fontFamily: "'Orbitron', monospace",
  fontWeight: 900,
}));

const NeonButton = styled(Button)<{ neoncolor?: string }>(({ neoncolor = "#00ffc8" }) => ({
  fontFamily: "'Orbitron', monospace",
  fontWeight: 700,
  border: `2px solid ${neoncolor}`,
  color: neoncolor,
  background: `${neoncolor}11`,
  borderRadius: 4,
  letterSpacing: 2,
  textTransform: "uppercase",
  transition: "all 0.2s",
  "&:hover": {
    background: `${neoncolor}22`,
    boxShadow: `0 0 16px ${neoncolor}66, inset 0 0 12px ${neoncolor}22`,
    transform: "translateY(-2px)",
  },
  "&:active": { transform: "translateY(0)" },
}));

const DiffCard = styled(Box)<{ selected: boolean; dcolor: string }>(({ selected, dcolor }) => ({
  border: `2px solid ${selected ? dcolor : "rgba(255,255,255,0.1)"}`,
  borderRadius: 12,
  padding: "16px 20px",
  cursor: "pointer",
  background: selected ? `${dcolor}18` : "rgba(255,255,255,0.03)",
  boxShadow: selected ? `0 0 20px ${dcolor}44` : "none",
  transition: "all 0.2s",
  "&:hover": { borderColor: dcolor, background: `${dcolor}10` },
}));

const CanvasWrap = styled(Box)({
  position: "relative",
  borderRadius: 16,
  overflow: "hidden",
  border: "2px solid rgba(0,255,200,0.2)",
  boxShadow: "0 0 40px rgba(0,255,200,0.1), 0 0 80px rgba(0,255,200,0.05)",
});

// ─── Game Objects ─────────────────────────────────────────────────────────────
interface Obstacle {
  id: number;
  lane: Lane;
  y: number;
  type: "barrier" | "train" | "low";  // low = duck under
  w: number;
  h: number;
}

interface Coin {
  id: number;
  lane: Lane;
  y: number;
  collected: boolean;
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  color: string;
  size: number;
}

interface BgElement {
  x: number; y: number; speed: number;
  type: "building" | "light" | "rail";
  w: number; h: number; color: string;
}

// ─── Drawing helpers ──────────────────────────────────────────────────────────
function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  isSliding: boolean,
  isJumping: boolean,
  frame: number,
  diffColor: string
) {
  const h = isSliding ? SLIDE_H : PLAYER_H;
  const runOffset = isSliding || isJumping ? 0 : Math.sin(frame * 0.25) * 3;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.beginPath();
  ctx.ellipse(x, GROUND_Y + 4, PLAYER_W * 0.6, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Glow
  const grd = ctx.createRadialGradient(x, y + h / 2, 0, x, y + h / 2, 50);
  grd.addColorStop(0, `${diffColor}33`);
  grd.addColorStop(1, "transparent");
  ctx.fillStyle = grd;
  ctx.fillRect(x - 50, y - 20, 100, h + 40);

  // Body
  ctx.save();
  ctx.translate(x, y + runOffset);

  if (isSliding) {
    // Sliding body
    ctx.fillStyle = diffColor;
    drawRoundRect(ctx, -PLAYER_W / 2, 0, PLAYER_W, SLIDE_H, 6);
    ctx.fillStyle = "#111";
    drawRoundRect(ctx, -PLAYER_W / 2 + 4, 4, PLAYER_W - 8, SLIDE_H - 8, 4);
    // Visor
    ctx.fillStyle = diffColor;
    ctx.fillRect(-14, 6, 28, 8);
  } else {
    // Legs animation
    const legSwing = isJumping ? 12 : Math.sin(frame * 0.25) * 12;
    ctx.fillStyle = "#1a1a2e";
    drawRoundRect(ctx, -12, PLAYER_H - 24, 10, 24, 4); // left leg base
    drawRoundRect(ctx, 2,   PLAYER_H - 24, 10, 24, 4); // right leg base
    // Animated leg parts
    ctx.save();
    ctx.translate(-7, PLAYER_H - 24);
    ctx.rotate((legSwing * Math.PI) / 180);
    ctx.fillStyle = "#252540";
    drawRoundRect(ctx, -5, 0, 10, 16, 3);
    ctx.restore();
    ctx.save();
    ctx.translate(7, PLAYER_H - 24);
    ctx.rotate((-legSwing * Math.PI) / 180);
    ctx.fillStyle = "#252540";
    drawRoundRect(ctx, -5, 0, 10, 16, 3);
    ctx.restore();

    // Body suit
    ctx.fillStyle = diffColor;
    drawRoundRect(ctx, -PLAYER_W / 2, 22, PLAYER_W, PLAYER_H - 46, 8);
    // Chest stripe
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    drawRoundRect(ctx, -8, 26, 16, PLAYER_H - 52, 4);

    // Head
    ctx.fillStyle = "#1a1a2e";
    drawRoundRect(ctx, -14, 0, 28, 24, 10);
    // Visor
    const vGrd = ctx.createLinearGradient(-14, 6, 14, 6);
    vGrd.addColorStop(0, diffColor);
    vGrd.addColorStop(1, `${diffColor}88`);
    ctx.fillStyle = vGrd;
    drawRoundRect(ctx, -12, 6, 24, 10, 4);
    // Highlight
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    drawRoundRect(ctx, -10, 8, 8, 4, 2);

    // Arms
    const armSwing = isJumping ? -20 : Math.sin(frame * 0.25 + Math.PI) * 20;
    ctx.save();
    ctx.translate(-PLAYER_W / 2, 30);
    ctx.rotate((armSwing * Math.PI) / 180);
    ctx.fillStyle = diffColor;
    drawRoundRect(ctx, -6, 0, 10, 18, 4);
    ctx.restore();
    ctx.save();
    ctx.translate(PLAYER_W / 2, 30);
    ctx.rotate((-armSwing * Math.PI) / 180);
    ctx.fillStyle = diffColor;
    drawRoundRect(ctx, -4, 0, 10, 18, 4);
    ctx.restore();
  }

  ctx.restore();
}

function drawObstacle(ctx: CanvasRenderingContext2D, obs: Obstacle, laneX: number) {
  const cx = laneX;
  const { y, w, h, type } = obs;

  if (type === "barrier") {
    // Red barrier
    ctx.fillStyle = "#ff2244";
    drawRoundRect(ctx, cx - w / 2, y, w, h, 6);
    ctx.fillStyle = "#ff6680";
    drawRoundRect(ctx, cx - w / 2 + 4, y + 4, w - 8, 8, 3);
    // Warning stripes
    ctx.fillStyle = "#ffcc00";
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(cx - w / 2 + i * (w / 3), y, w / 6, h);
    }
    ctx.fillStyle = "#ff2244";
    ctx.fillRect(cx - w / 2, y, w, 8);
    ctx.fillRect(cx - w / 2, y + h - 8, w, 8);
    // Glow
    ctx.shadowColor = "#ff2244";
    ctx.shadowBlur = 20;
    ctx.strokeStyle = "#ff2244";
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - w / 2, y, w, h);
    ctx.shadowBlur = 0;

  } else if (type === "train") {
    // Train/subway car
    ctx.fillStyle = "#1a3a5c";
    drawRoundRect(ctx, cx - w / 2, y, w, h, 10);
    ctx.fillStyle = "#0d2438";
    drawRoundRect(ctx, cx - w / 2, y, w, 20, 10);
    // Windows
    ctx.fillStyle = "#00ccff44";
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 2; col++) {
        const wx = cx - w / 2 + 8 + col * (w / 2 - 6);
        const wy = y + 28 + row * 26;
        drawRoundRect(ctx, wx, wy, w / 2 - 12, 18, 3);
        ctx.fillStyle = "#00ccff88";
        drawRoundRect(ctx, wx, wy, w / 2 - 12, 6, 2);
        ctx.fillStyle = "#00ccff44";
      }
    }
    // Stripe
    ctx.fillStyle = "#0099ff";
    ctx.fillRect(cx - w / 2, y + 18, w, 4);
    // Glow
    ctx.shadowColor = "#0099ff";
    ctx.shadowBlur = 15;
    ctx.strokeStyle = "#0099ff66";
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - w / 2, y, w, h);
    ctx.shadowBlur = 0;

  } else {
    // Low obstacle (duck under) — horizontal beam
    ctx.fillStyle = "#ff8800";
    drawRoundRect(ctx, cx - w / 2, y, w, h, 4);
    ctx.fillStyle = "#ffaa44";
    ctx.fillRect(cx - w / 2, y, w, 6);
    // Poles
    ctx.fillStyle = "#cc6600";
    ctx.fillRect(cx - w / 2, y, 8, h + 20);
    ctx.fillRect(cx + w / 2 - 8, y, 8, h + 20);
    ctx.shadowColor = "#ff8800";
    ctx.shadowBlur = 12;
    ctx.strokeStyle = "#ff880066";
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - w / 2, y, w, h);
    ctx.shadowBlur = 0;
  }
}

function drawCoin(ctx: CanvasRenderingContext2D, coin: Coin, laneX: number, frame: number) {
  const cx = laneX;
  const bobY = coin.y + Math.sin(frame * 0.1 + coin.id) * 4;
  const rot = (frame * 0.05 + coin.id) % (Math.PI * 2);
  const scaleX = Math.cos(rot);

  ctx.save();
  ctx.translate(cx, bobY + 10);
  ctx.scale(scaleX, 1);

  // Coin body
  const grd = ctx.createRadialGradient(-4, -4, 0, 0, 0, 12);
  grd.addColorStop(0, "#fff176");
  grd.addColorStop(0.5, "#ffcc00");
  grd.addColorStop(1, "#ff8800");
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();

  // Inner ring
  ctx.strokeStyle = "#ff8800";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.stroke();

  // Symbol
  if (Math.abs(scaleX) > 0.3) {
    ctx.fillStyle = "#ff8800";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("$", 0, 0);
  }

  ctx.restore();

  // Glow
  ctx.shadowColor = "#ffcc00";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(cx, bobY + 10, 13, 0, Math.PI * 2);
  ctx.strokeStyle = "#ffcc0044";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawBackground(ctx: CanvasRenderingContext2D, bgOffset: number, diffColor: string) {
  // Sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  sky.addColorStop(0, "#05070d");
  sky.addColorStop(0.6, "#0a0f1a");
  sky.addColorStop(1, "#0d1525");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CW, GROUND_Y);

  // Stars
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  for (let i = 0; i < 40; i++) {
    const sx = ((i * 137 + bgOffset * 0.1) % CW);
    const sy = (i * 47) % (GROUND_Y * 0.6);
    const ss = i % 3 === 0 ? 2 : 1;
    ctx.fillRect(sx, sy, ss, ss);
  }

  // Distant buildings (parallax layer 1)
  for (let i = 0; i < 8; i++) {
    const bx = ((i * 90 - bgOffset * 0.3) % (CW + 100) + CW + 100) % (CW + 100) - 50;
    const bh = 60 + (i * 37) % 80;
    ctx.fillStyle = `rgba(15,25,45,0.9)`;
    ctx.fillRect(bx, GROUND_Y - bh, 70, bh);
    // Windows
    for (let wy = GROUND_Y - bh + 8; wy < GROUND_Y - 8; wy += 14) {
      for (let wx = bx + 8; wx < bx + 60; wx += 16) {
        const lit = (i + Math.floor(wy / 14)) % 3 !== 0;
        ctx.fillStyle = lit ? `${diffColor}55` : "rgba(255,255,255,0.05)";
        ctx.fillRect(wx, wy, 8, 8);
      }
    }
  }

  // Closer buildings (parallax layer 2)
  for (let i = 0; i < 6; i++) {
    const bx = ((i * 120 + 40 - bgOffset * 0.6) % (CW + 150) + CW + 150) % (CW + 150) - 60;
    const bh = 80 + (i * 53) % 120;
    ctx.fillStyle = "#0a1628";
    ctx.fillRect(bx, GROUND_Y - bh, 90, bh);
    for (let wy = GROUND_Y - bh + 10; wy < GROUND_Y - 10; wy += 16) {
      for (let wx = bx + 10; wx < bx + 78; wx += 18) {
        const lit = ((i * 3 + Math.floor(wy / 16)) % 4) !== 0;
        ctx.fillStyle = lit ? `${diffColor}44` : "rgba(255,255,255,0.04)";
        ctx.fillRect(wx, wy, 10, 10);
      }
    }
    // Rooftop antenna
    ctx.strokeStyle = `${diffColor}88`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx + 45, GROUND_Y - bh);
    ctx.lineTo(bx + 45, GROUND_Y - bh - 20);
    ctx.stroke();
    ctx.fillStyle = "#ff0044";
    ctx.beginPath();
    ctx.arc(bx + 45, GROUND_Y - bh - 22, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ground
  const groundGrd = ctx.createLinearGradient(0, GROUND_Y, 0, CH);
  groundGrd.addColorStop(0, "#101825");
  groundGrd.addColorStop(1, "#05070d");
  ctx.fillStyle = groundGrd;
  ctx.fillRect(0, GROUND_Y, CW, CH - GROUND_Y);

  // Ground lines (speed lines)
  ctx.strokeStyle = `${diffColor}22`;
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const lx = ((i * 80 - bgOffset * 2) % CW + CW) % CW;
    ctx.beginPath();
    ctx.moveTo(lx, GROUND_Y);
    ctx.lineTo(lx + 20, CH);
    ctx.stroke();
  }

  // Lane markers
  ctx.strokeStyle = `${diffColor}33`;
  ctx.lineWidth = 2;
  ctx.setLineDash([20, 15]);
  ctx.lineDashOffset = -bgOffset * 3;
  for (const lx of [CW * 0.36, CW * 0.64]) {
    ctx.beginPath();
    ctx.moveTo(lx, GROUND_Y);
    ctx.lineTo(lx, CH);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Rail tracks
  ctx.strokeStyle = `${diffColor}55`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y + 8);
  ctx.lineTo(CW, GROUND_Y + 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y + 20);
  ctx.lineTo(CW, GROUND_Y + 20);
  ctx.stroke();
  // Rail ties
  ctx.strokeStyle = `${diffColor}33`;
  ctx.lineWidth = 4;
  const tieOffset = bgOffset * 3 % 30;
  for (let tx = -tieOffset; tx < CW + 30; tx += 30) {
    ctx.beginPath();
    ctx.moveTo(tx, GROUND_Y + 4);
    ctx.lineTo(tx, GROUND_Y + 26);
    ctx.stroke();
  }
}

function drawHUD(
  ctx: CanvasRenderingContext2D,
  score: number, coins: number, speed: number,
  difficulty: Difficulty, lives: number
) {
  const dc = DIFF[difficulty].color;

  // Top bar
  ctx.fillStyle = "rgba(5,7,13,0.7)";
  ctx.fillRect(0, 0, CW, 52);
  ctx.strokeStyle = `${dc}44`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 52);
  ctx.lineTo(CW, 52);
  ctx.stroke();

  // Score
  ctx.fillStyle = dc;
  ctx.shadowColor = dc;
  ctx.shadowBlur = 8;
  ctx.font = "bold 22px Orbitron, monospace";
  ctx.textAlign = "left";
  ctx.fillText(String(score).padStart(6, "0"), 14, 32);
  ctx.shadowBlur = 0;

  // Speed
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "10px Orbitron, monospace";
  ctx.fillText(`SPD ${speed.toFixed(1)}`, 14, 46);

  // Coins
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffcc00";
  ctx.shadowColor = "#ffcc00";
  ctx.shadowBlur = 8;
  ctx.font = "bold 18px Orbitron, monospace";
  ctx.fillText(`🪙 ${coins}`, CW / 2, 30);
  ctx.shadowBlur = 0;

  // Lives
  ctx.textAlign = "right";
  ctx.font = "18px monospace";
  ctx.fillText("❤️".repeat(lives), CW - 14, 30);

  // Diff badge
  ctx.fillStyle = `${dc}22`;
  drawRoundRect(ctx, CW - 70, 36, 60, 14, 4);
  ctx.fillStyle = dc;
  ctx.font = "8px Orbitron, monospace";
  ctx.fillText(DIFF[difficulty].label.toUpperCase(), CW - 40, 46);
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RunnerGamePage() {
  const [screen, setScreen] = useState<Screen>("start");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [finalScore, setFinalScore] = useState(0);
  const [finalCoins, setFinalCoins] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Game state refs (avoids re-render on every frame)
  const gameRef = useRef({
    running: false,
    frame: 0,
    score: 0,
    coins: 0,
    speed: 5,
    bgOffset: 0,
    lives: 3,
    invincible: 0,    // invincibility frames after hit
    playerLane: 1 as Lane,
    targetLane: 1 as Lane,
    playerX: LANE_XS[1],
    playerY: GROUND_Y - PLAYER_H,
    velY: 0,
    isJumping: false,
    isSliding: false,
    slideTimer: 0,
    obstacles: [] as Obstacle[],
    coinsList: [] as Coin[],
    particles: [] as Particle[],
    nextObstId: 0,
    nextCoinId: 0,
    difficulty: "medium" as Difficulty,
  });

  const rafRef = useRef<number>();

  // ── Spawn helpers ──────────────────────────────────────────────────────────
  const spawnObstacle = useCallback(() => {
    const g = gameRef.current;
    const lane = Math.floor(Math.random() * 3) as Lane;
    const types: Obstacle["type"][] = ["barrier", "barrier", "train", "low"];
    const type = types[Math.floor(Math.random() * types.length)];
    const w = type === "train" ? 70 : type === "low" ? 100 : 50;
    const h = type === "low" ? 28 : type === "train" ? 100 : 60;
    g.obstacles.push({ id: g.nextObstId++, lane, y: -h - 10, type, w, h });
  }, []);

  const spawnCoins = useCallback((lane: Lane) => {
    const g = gameRef.current;
    for (let i = 0; i < 5; i++) {
      g.coinsList.push({ id: g.nextCoinId++, lane, y: -80 - i * 36, collected: false });
    }
  }, []);

  const addParticles = useCallback((x: number, y: number, color: string, count = 12) => {
    const g = gameRef.current;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 2 + Math.random() * 4;
      g.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1,
        color,
        size: 4 + Math.random() * 4,
      });
    }
  }, []);

  // ── Input ──────────────────────────────────────────────────────────────────
  const handleInput = useCallback((action: "left" | "right" | "jump" | "slide") => {
    const g = gameRef.current;
    if (!g.running) return;

    if (action === "left" && g.targetLane > 0) {
      g.targetLane = (g.targetLane - 1) as Lane;
    } else if (action === "right" && g.targetLane < 2) {
      g.targetLane = (g.targetLane + 1) as Lane;
    } else if (action === "jump" && !g.isJumping) {
      g.velY = -16;
      g.isJumping = true;
      g.isSliding = false;
      g.slideTimer = 0;
    } else if (action === "slide" && !g.isJumping) {
      g.isSliding = true;
      g.slideTimer = 40;
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft"  || e.key === "a") handleInput("left");
      if (e.key === "ArrowRight" || e.key === "d") handleInput("right");
      if (e.key === "ArrowUp"   || e.key === "w" || e.key === " ") { e.preventDefault(); handleInput("jump"); }
      if (e.key === "ArrowDown"  || e.key === "s") handleInput("slide");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleInput]);

  // ── Touch controls ─────────────────────────────────────────────────────────
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    const adx = Math.abs(dx), ady = Math.abs(dy);
    if (adx < 10 && ady < 10) { handleInput("jump"); return; }
    if (adx > ady) { handleInput(dx > 0 ? "right" : "left"); }
    else { handleInput(dy < 0 ? "jump" : "slide"); }
    touchStartRef.current = null;
  };

  // ── Game loop ──────────────────────────────────────────────────────────────
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const g = gameRef.current;
    if (!g.running) return;

    const dc = DIFF[g.difficulty];

    g.frame++;
    g.score += Math.ceil(g.speed * 0.1);
    g.speed += dc.speedInc;
    g.bgOffset += g.speed;

    // Lane lerp
    const targetX = LANE_XS[g.targetLane];
    g.playerX += (targetX - g.playerX) * 0.2;
    g.playerLane = g.targetLane;

    // Jump physics
    if (g.isJumping) {
      g.velY += 0.7;
      g.playerY += g.velY;
      if (g.playerY >= GROUND_Y - PLAYER_H) {
        g.playerY = GROUND_Y - PLAYER_H;
        g.velY = 0;
        g.isJumping = false;
      }
    } else {
      g.playerY = GROUND_Y - PLAYER_H;
    }

    // Slide timer
    if (g.isSliding) {
      g.slideTimer--;
      if (g.slideTimer <= 0) g.isSliding = false;
    }

    // Invincibility countdown
    if (g.invincible > 0) g.invincible--;

    // Spawn
    if (Math.random() < dc.obstacleRate) spawnObstacle();
    if (Math.random() < dc.coinRate) spawnCoins(Math.floor(Math.random() * 3) as Lane);

    // Move & cull obstacles
    g.obstacles = g.obstacles.filter((obs) => {
      obs.y += g.speed;

      // Collision check
      if (g.invincible === 0) {
        const laneX = LANE_XS[obs.lane];
        const px = g.playerX;
        const ph = g.isSliding ? SLIDE_H : PLAYER_H;
        const py = g.isSliding ? GROUND_Y - SLIDE_H : g.playerY;

        const overlapX = Math.abs(px - laneX) < (PLAYER_W / 2 + obs.w / 2 - 8);
        const overlapY = py + ph > obs.y + 6 && py < obs.y + obs.h - 6;

        // For low obstacle, jumping clears it
        const isLow = obs.type === "low";
        const jumpingClear = isLow && g.isJumping && g.playerY < GROUND_Y - PLAYER_H - 10;

        if (overlapX && overlapY && !jumpingClear) {
          addParticles(px, py + ph / 2, "#ff2244", 16);
          g.lives--;
          g.invincible = 80;
          if (g.lives <= 0) {
            g.running = false;
            setFinalScore(g.score);
            setFinalCoins(g.coins);
            setHighScore((prev) => Math.max(prev, g.score));
            setScreen("gameover");
            return false;
          }
        }
      }

      return obs.y < CH + 20;
    });

    // Move & collect coins
    g.coinsList = g.coinsList.filter((coin) => {
      coin.y += g.speed;
      if (!coin.collected) {
        const laneX = LANE_XS[coin.lane];
        const dist = Math.hypot(g.playerX - laneX, (g.playerY + PLAYER_H / 2) - (coin.y + 10));
        if (dist < 36) {
          coin.collected = true;
          g.coins++;
          g.score += 50;
          addParticles(laneX, coin.y + 10, "#ffcc00", 8);
          return false;
        }
      }
      return coin.y < CH + 20 && !coin.collected;
    });

    // Update particles
    g.particles = g.particles.filter((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.life -= 0.04;
      return p.life > 0;
    });

    // ── Draw ──
    drawBackground(ctx, g.bgOffset, dc.color);

    // Obstacles
    for (const obs of g.obstacles) {
      drawObstacle(ctx, obs, LANE_XS[obs.lane]);
    }

    // Coins
    for (const coin of g.coinsList) {
      if (!coin.collected) drawCoin(ctx, coin, LANE_XS[coin.lane], g.frame);
    }

    // Particles
    drawParticles(ctx, g.particles);

    // Player (flash when invincible)
    const showPlayer = g.invincible === 0 || Math.floor(g.frame / 4) % 2 === 0;
    if (showPlayer) {
      const ph = g.isSliding ? SLIDE_H : PLAYER_H;
      const py = g.isSliding ? GROUND_Y - SLIDE_H : g.playerY;
      drawPlayer(ctx, g.playerX, py, g.isSliding, g.isJumping, g.frame, dc.color);
    }

    // HUD
    drawHUD(ctx, g.score, g.coins, g.speed, g.difficulty, g.lives);

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [spawnObstacle, spawnCoins, addParticles]);

  // ── Start game ─────────────────────────────────────────────────────────────
  const startGame = () => {
    const g = gameRef.current;
    const dc = DIFF[difficulty];
    Object.assign(g, {
      running: true,
      frame: 0, score: 0, coins: 0,
      speed: dc.baseSpeed,
      bgOffset: 0,
      lives: 3, invincible: 0,
      playerLane: 1, targetLane: 1,
      playerX: LANE_XS[1],
      playerY: GROUND_Y - PLAYER_H,
      velY: 0,
      isJumping: false, isSliding: false, slideTimer: 0,
      obstacles: [], coinsList: [], particles: [],
      nextObstId: 0, nextCoinId: 0,
      difficulty,
    });
    setScreen("playing");
    setTimeout(() => { rafRef.current = requestAnimationFrame(gameLoop); }, 50);
  };

  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  useEffect(() => {
    if (screen !== "playing") {
      gameRef.current.running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
  }, [screen]);

  // ─── Screens ──────────────────────────────────────────────────────────────
  const dc = DIFF[difficulty];

  return (
    <Wrap>
      {/* ── START SCREEN ── */}
      {screen === "start" && (
        <Box
          sx={{
            position: "relative", zIndex: 1,
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 3, p: 4, maxWidth: 460, width: "100%",
          }}
        >
          {/* Logo */}
          <Box sx={{ textAlign: "center", mb: 1 }}>
            <Typography
              sx={{
                fontSize: 12, letterSpacing: 8, color: "rgba(0,255,200,0.5)",
                fontFamily: "Orbitron, monospace", mb: 1,
                textTransform: "uppercase",
              }}
            >
              ▶ Endless Runner
            </Typography>
            <GlowText variant="h2" sx={{ fontSize: { xs: 36, sm: 48 }, lineHeight: 1 }}>
              NEON
            </GlowText>
            <GlowText variant="h2" glowcolor="#ff2244" sx={{ fontSize: { xs: 36, sm: 48 }, lineHeight: 1 }}>
              DASH
            </GlowText>
            <Box
              sx={{
                width: 80, height: 3, mx: "auto", mt: 1,
                background: "linear-gradient(90deg, transparent, #00ffc8, transparent)",
              }}
            />
          </Box>

          {/* High score */}
          {highScore > 0 && (
            <Box sx={{ textAlign: "center" }}>
              <Typography sx={{ color: "rgba(255,204,0,0.6)", fontSize: 11, fontFamily: "Orbitron, monospace", letterSpacing: 2 }}>
                BEST
              </Typography>
              <GlowText glowcolor="#ffcc00" sx={{ fontSize: 28 }}>
                {String(highScore).padStart(6, "0")}
              </GlowText>
            </Box>
          )}

          {/* Difficulty */}
          <Box sx={{ width: "100%" }}>
            <Typography
              sx={{
                color: "rgba(255,255,255,0.4)", fontSize: 10, letterSpacing: 3,
                fontFamily: "Orbitron, monospace", mb: 2, textAlign: "center",
              }}
            >
              SELECT DIFFICULTY
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {(Object.keys(DIFF) as Difficulty[]).map((d) => (
                <DiffCard
                  key={d}
                  selected={difficulty === d}
                  dcolor={DIFF[d].color}
                  onClick={() => setDifficulty(d)}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Typography sx={{ fontSize: 28 }}>{DIFF[d].emoji}</Typography>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{
                          fontFamily: "Orbitron, monospace", fontWeight: 700,
                          color: difficulty === d ? DIFF[d].color : "rgba(255,255,255,0.7)",
                          fontSize: 14, letterSpacing: 1,
                        }}
                      >
                        {DIFF[d].label}
                      </Typography>
                      <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>
                        {DIFF[d].desc}
                      </Typography>
                    </Box>
                    {difficulty === d && (
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: DIFF[d].color, boxShadow: `0 0 10px ${DIFF[d].color}` }} />
                    )}
                  </Box>
                </DiffCard>
              ))}
            </Box>
          </Box>

          {/* Controls hint */}
          <Box
            sx={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1,
              width: "100%", px: 1,
            }}
          >
            {[
              ["← →", "Switch Lane"],
              ["↑ / Space", "Jump"],
              ["↓", "Slide"],
              ["Swipe", "Mobile"],
            ].map(([k, v]) => (
              <Box
                key={k}
                sx={{
                  display: "flex", gap: 1, alignItems: "center",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 2, px: 1.5, py: 0.8,
                }}
              >
                <Typography
                  sx={{
                    fontFamily: "Orbitron, monospace", fontSize: 10,
                    color: dc.color, fontWeight: 700, minWidth: 50,
                  }}
                >
                  {k}
                </Typography>
                <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{v}</Typography>
              </Box>
            ))}
          </Box>

          {/* Play button */}
          <NeonButton
            neoncolor={dc.color}
            fullWidth
            size="large"
            onClick={startGame}
            sx={{
              py: 2, fontSize: 18, letterSpacing: 4,
              animation: `${pulse} 2s ease-in-out infinite`,
            }}
          >
            ▶ PLAY
          </NeonButton>
        </Box>
      )}

      {/* ── PLAYING SCREEN ── */}
      {screen === "playing" && (
        <CanvasWrap onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <canvas
            ref={canvasRef}
            width={CW}
            height={CH}
            style={{ display: "block", maxWidth: "100vw", maxHeight: "90vh" }}
          />
          {/* Pause overlay button */}
          <Box
            sx={{
              position: "absolute", bottom: 10, right: 10,
              opacity: 0.4, "&:hover": { opacity: 1 },
            }}
          >
            <NeonButton
              neoncolor="#00ffc8"
              size="small"
              onClick={() => setScreen("start")}
              sx={{ fontSize: 10, py: 0.5, px: 1.5 }}
            >
              ✕ QUIT
            </NeonButton>
          </Box>
        </CanvasWrap>
      )}

      {/* ── GAME OVER SCREEN ── */}
      {screen === "gameover" && (
        <Box
          sx={{
            position: "relative", zIndex: 1,
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 3, p: 4, maxWidth: 400, width: "100%",
          }}
        >
          <GlowText glowcolor="#ff2244" variant="h3" sx={{ letterSpacing: 4 }}>
            GAME OVER
          </GlowText>

          {/* Score card */}
          <Box
            sx={{
              width: "100%",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 3, p: 3,
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
              <Box sx={{ textAlign: "center", flex: 1 }}>
                <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontFamily: "Orbitron, monospace", letterSpacing: 2 }}>
                  SCORE
                </Typography>
                <GlowText glowcolor={dc.color} sx={{ fontSize: 32 }}>
                  {String(finalScore).padStart(6, "0")}
                </GlowText>
              </Box>
              <Box sx={{ width: 1, background: "rgba(255,255,255,0.08)" }} />
              <Box sx={{ textAlign: "center", flex: 1 }}>
                <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontFamily: "Orbitron, monospace", letterSpacing: 2 }}>
                  COINS
                </Typography>
                <GlowText glowcolor="#ffcc00" sx={{ fontSize: 32 }}>
                  {finalCoins}
                </GlowText>
              </Box>
            </Box>

            {finalScore >= highScore && highScore > 0 && (
              <Box
                sx={{
                  textAlign: "center", py: 1,
                  background: "rgba(255,204,0,0.08)",
                  border: "1px solid rgba(255,204,0,0.2)",
                  borderRadius: 2,
                }}
              >
                <Typography sx={{ color: "#ffcc00", fontFamily: "Orbitron, monospace", fontSize: 12, letterSpacing: 2 }}>
                  🏆 NEW HIGH SCORE!
                </Typography>
              </Box>
            )}

            <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between" }}>
              <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>Difficulty</Typography>
              <Chip
                label={`${dc.emoji} ${dc.label}`}
                size="small"
                sx={{ background: `${dc.color}22`, color: dc.color, border: `1px solid ${dc.color}44`, fontFamily: "Orbitron, monospace", fontSize: 10 }}
              />
            </Box>
            <Box sx={{ mt: 1, display: "flex", justifyContent: "space-between" }}>
              <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>Best</Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontFamily: "Orbitron, monospace" }}>
                {String(highScore).padStart(6, "0")}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
            <NeonButton
              neoncolor={dc.color}
              fullWidth
              size="large"
              onClick={startGame}
              sx={{ py: 1.5, fontSize: 15, letterSpacing: 3 }}
            >
              ↺ RETRY
            </NeonButton>
            <NeonButton
              neoncolor="rgba(255,255,255,0.3)"
              fullWidth
              size="large"
              onClick={() => setScreen("start")}
              sx={{ py: 1.5, fontSize: 15, letterSpacing: 3 }}
            >
              ☰ MENU
            </NeonButton>
          </Box>
        </Box>
      )}
    </Wrap>
  );
}
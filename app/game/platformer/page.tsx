"use client";
import { useEffect, useRef, useState, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const CW = 800, CH = 480;
const GRAVITY = 0.58;
const JUMP_FORCE = -14;
const PLAYER_SPEED = 4.5;
const TILE = 40;
const MAX_LEVELS = 3;

// ─── Types ────────────────────────────────────────────────────────────────────
interface Vec2 { x: number; y: number; }
interface Rect extends Vec2 { w: number; h: number; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; r: number; color: string; }
interface Coin { x: number; y: number; collected: boolean; }
interface Enemy {
  x: number; y: number; vx: number; w: number; h: number;
  patrol: [number, number]; alive: boolean; hp: number;
  stunTimer: number; type: "goomba" | "spiny" | "flyer";
  flyAngle: number;
}
interface Platform { x: number; y: number; w: number; moving?: boolean; moveRange?: [number, number]; moveSpeed?: number; orig?: number; }
interface PowerUp { x: number; y: number; type: "mushroom" | "star" | "shield"; collected: boolean; }
interface LevelData {
  bgColor: [string, string];
  groundY: number;
  platforms: Platform[];
  coinPositions: Vec2[];
  enemies: Array<{ x: number; patrol: [number, number]; type?: Enemy["type"] }>;
  powerUps: Array<{ x: number; y: number; type: PowerUp["type"] }>;
  goal: { x: number };
  worldW: number;
  name: string;
  theme: "grass" | "cave" | "lava" | "sky" | "ice";
}
interface Player extends Rect {
  vx: number; vy: number; onGround: boolean; dir: number;
  jumpBuffer: number; coyoteTime: number;
  invincible: number; powered: boolean; starred: boolean; shielded: boolean;
  starTimer: number; shieldTimer: number;
}
interface GameState {
  lvl: number; ld: LevelData;
  player: Player;
  enemies: Enemy[];
  coins: Coin[];          // ← fixed: separate from coinCount
  coinCount: number;      // ← fixed: renamed counter
  powerUps: PowerUp[];
  camera: number; camVel: number;
  score: number; lives: number;
  running: boolean;
  checkpoints: number[];
  lastCheckpoint: number;
  combo: number; comboTimer: number;
  bossDefeated: boolean;
}
type Phase = "idle" | "playing" | "dead" | "levelclear" | "win" | "paused";

// ─── Level Factory ────────────────────────────────────────────────────────────
function makeLevel(lvl: number): LevelData {
  if (lvl === 1) return {
    name: "Grassy Hills", theme: "grass",
    bgColor: ["#87CEEB", "#c8eaff"],
    groundY: CH - TILE, worldW: 2000,
    platforms: [
      { x: 200, y: CH - 3 * TILE, w: 3 },
      { x: 380, y: CH - 4 * TILE, w: 2 },
      { x: 520, y: CH - 3 * TILE, w: 3 },
      { x: 700, y: CH - 5 * TILE, w: 2 },
      { x: 860, y: CH - 3 * TILE, w: 3, moving: true, moveRange: [860, 980], moveSpeed: 1.5 },
      { x: 1050, y: CH - 5 * TILE, w: 3 },
      { x: 1250, y: CH - 3 * TILE, w: 2 },
      { x: 1400, y: CH - 5 * TILE, w: 3 },
      { x: 1600, y: CH - 4 * TILE, w: 2 },
      { x: 1750, y: CH - 3 * TILE, w: 3 },
    ],
    coinPositions: [
      { x: 220, y: CH - 4 * TILE }, { x: 260, y: CH - 4 * TILE }, { x: 300, y: CH - 4 * TILE },
      { x: 400, y: CH - 5 * TILE }, { x: 540, y: CH - 4 * TILE }, { x: 580, y: CH - 4 * TILE },
      { x: 720, y: CH - 6 * TILE }, { x: 760, y: CH - 6 * TILE },
      { x: 880, y: CH - 4 * TILE }, { x: 920, y: CH - 4 * TILE },
      { x: 1070, y: CH - 6 * TILE }, { x: 1110, y: CH - 6 * TILE }, { x: 1150, y: CH - 6 * TILE },
      { x: 1270, y: CH - 4 * TILE }, { x: 1420, y: CH - 6 * TILE }, { x: 1460, y: CH - 6 * TILE },
      { x: 1620, y: CH - 5 * TILE }, { x: 1770, y: CH - 4 * TILE }, { x: 1810, y: CH - 4 * TILE },
      { x: 600, y: CH - 2 * TILE }, { x: 1000, y: CH - 2 * TILE }, { x: 1500, y: CH - 2 * TILE },
    ],
    enemies: [
      { x: 320, patrol: [280, 460], type: "goomba" },
      { x: 600, patrol: [560, 760], type: "goomba" },
      { x: 950, patrol: [900, 1100], type: "spiny" },
      { x: 1300, patrol: [1250, 1480], type: "goomba" },
      { x: 1650, patrol: [1600, 1800], type: "flyer" },
    ],
    powerUps: [
      { x: 450, y: CH - 5 * TILE, type: "mushroom" },
      { x: 1100, y: CH - 6 * TILE, type: "star" },
    ],
    checkpoints: [800, 1400],
    goal: { x: 1920 },
  } as LevelData & { checkpoints: number[] };

  if (lvl === 2) return {
    name: "Crystal Cave", theme: "cave",
    bgColor: ["#0d0a2e", "#1a0a5f"],
    groundY: CH - TILE, worldW: 2200,
    platforms: [
      { x: 160, y: CH - 3 * TILE, w: 2 },
      { x: 300, y: CH - 5 * TILE, w: 2 },
      { x: 440, y: CH - 3 * TILE, w: 3 },
      { x: 640, y: CH - 6 * TILE, w: 2, moving: true, moveRange: [640, 780], moveSpeed: 2 },
      { x: 820, y: CH - 4 * TILE, w: 3 },
      { x: 1020, y: CH - 6 * TILE, w: 2 },
      { x: 1200, y: CH - 4 * TILE, w: 2 },
      { x: 1360, y: CH - 6 * TILE, w: 3, moving: true, moveRange: [1360, 1520], moveSpeed: 2.5 },
      { x: 1560, y: CH - 4 * TILE, w: 2 },
      { x: 1720, y: CH - 6 * TILE, w: 3 },
      { x: 1920, y: CH - 4 * TILE, w: 2 },
    ],
    coinPositions: [
      { x: 175, y: CH - 4 * TILE }, { x: 315, y: CH - 6 * TILE }, { x: 355, y: CH - 6 * TILE },
      { x: 460, y: CH - 4 * TILE }, { x: 500, y: CH - 4 * TILE }, { x: 540, y: CH - 4 * TILE },
      { x: 660, y: CH - 7 * TILE }, { x: 700, y: CH - 7 * TILE },
      { x: 840, y: CH - 5 * TILE }, { x: 880, y: CH - 5 * TILE }, { x: 920, y: CH - 5 * TILE },
      { x: 1040, y: CH - 7 * TILE }, { x: 1080, y: CH - 7 * TILE },
      { x: 1220, y: CH - 5 * TILE }, { x: 1380, y: CH - 7 * TILE }, { x: 1420, y: CH - 7 * TILE },
      { x: 1580, y: CH - 5 * TILE }, { x: 1740, y: CH - 7 * TILE }, { x: 1780, y: CH - 7 * TILE },
      { x: 1940, y: CH - 5 * TILE }, { x: 700, y: CH - 2 * TILE }, { x: 1400, y: CH - 2 * TILE },
    ],
    enemies: [
      { x: 200, patrol: [160, 400], type: "goomba" },
      { x: 480, patrol: [440, 660], type: "spiny" },
      { x: 860, patrol: [820, 1060], type: "goomba" },
      { x: 1060, patrol: [1020, 1240], type: "flyer" },
      { x: 1240, patrol: [1200, 1400], type: "spiny" },
      { x: 1600, patrol: [1560, 1760], type: "goomba" },
      { x: 1960, patrol: [1920, 2100], type: "spiny" },
    ],
    powerUps: [
      { x: 500, y: CH - 4 * TILE, type: "mushroom" },
      { x: 1080, y: CH - 7 * TILE, type: "shield" },
      { x: 1780, y: CH - 7 * TILE, type: "star" },
    ],
    checkpoints: [900, 1600],
    goal: { x: 2100 },
  } as LevelData & { checkpoints: number[] };

  return {
    name: "Lava Fortress", theme: "lava",
    bgColor: ["#1a0000", "#3d0a00"],
    groundY: CH - TILE, worldW: 2400,
    platforms: [
      { x: 140, y: CH - 4 * TILE, w: 2 },
      { x: 280, y: CH - 6 * TILE, w: 2, moving: true, moveRange: [280, 420], moveSpeed: 2 },
      { x: 460, y: CH - 4 * TILE, w: 2 },
      { x: 600, y: CH - 7 * TILE, w: 2 },
      { x: 740, y: CH - 5 * TILE, w: 2, moving: true, moveRange: [740, 900], moveSpeed: 3 },
      { x: 900, y: CH - 7 * TILE, w: 2 },
      { x: 1060, y: CH - 5 * TILE, w: 3 },
      { x: 1260, y: CH - 7 * TILE, w: 2, moving: true, moveRange: [1260, 1440], moveSpeed: 2.5 },
      { x: 1460, y: CH - 5 * TILE, w: 2 },
      { x: 1620, y: CH - 7 * TILE, w: 2 },
      { x: 1780, y: CH - 5 * TILE, w: 2 },
      { x: 1940, y: CH - 7 * TILE, w: 3 },
      { x: 2140, y: CH - 5 * TILE, w: 2 },
    ],
    coinPositions: [
      { x: 155, y: CH - 5 * TILE }, { x: 295, y: CH - 7 * TILE }, { x: 335, y: CH - 7 * TILE },
      { x: 475, y: CH - 5 * TILE }, { x: 515, y: CH - 5 * TILE },
      { x: 615, y: CH - 8 * TILE }, { x: 655, y: CH - 8 * TILE },
      { x: 755, y: CH - 6 * TILE }, { x: 795, y: CH - 6 * TILE },
      { x: 915, y: CH - 8 * TILE }, { x: 955, y: CH - 8 * TILE },
      { x: 1075, y: CH - 6 * TILE }, { x: 1115, y: CH - 6 * TILE }, { x: 1155, y: CH - 6 * TILE },
      { x: 1275, y: CH - 8 * TILE }, { x: 1315, y: CH - 8 * TILE },
      { x: 1475, y: CH - 6 * TILE }, { x: 1635, y: CH - 8 * TILE }, { x: 1675, y: CH - 8 * TILE },
      { x: 1795, y: CH - 6 * TILE }, { x: 1955, y: CH - 8 * TILE }, { x: 1995, y: CH - 8 * TILE },
      { x: 2155, y: CH - 6 * TILE }, { x: 2195, y: CH - 6 * TILE },
      { x: 1000, y: CH - 2 * TILE }, { x: 1800, y: CH - 2 * TILE },
    ],
    enemies: [
      { x: 200, patrol: [140, 380], type: "goomba" },
      { x: 500, patrol: [460, 640], type: "spiny" },
      { x: 780, patrol: [740, 940], type: "flyer" },
      { x: 1100, patrol: [1060, 1300], type: "spiny" },
      { x: 1300, patrol: [1260, 1500], type: "goomba" },
      { x: 1500, patrol: [1460, 1660], type: "spiny" },
      { x: 1820, patrol: [1780, 1980], type: "flyer" },
      { x: 1980, patrol: [1940, 2180], type: "spiny" },
      { x: 2180, patrol: [2140, 2360], type: "goomba" },
    ],
    powerUps: [
      { x: 515, y: CH - 5 * TILE, type: "mushroom" },
      { x: 1155, y: CH - 6 * TILE, type: "shield" },
      { x: 1995, y: CH - 8 * TILE, type: "star" },
    ],
    checkpoints: [1000, 1800],
    goal: { x: 2340 },
  } as LevelData & { checkpoints: number[] };
}

// ─── Rect helpers ─────────────────────────────────────────────────────────────
function overlap(a: Rect, b: Rect) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function overlapXY(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

// ─── Drawing ──────────────────────────────────────────────────────────────────
function drawHero(ctx: CanvasRenderingContext2D, x: number, y: number, dir: number, jumping: boolean, frame: number, powered: boolean, starred: boolean, shielded: boolean, invincible: number) {
  ctx.save();
  if (invincible > 0 && Math.floor(invincible / 4) % 2 === 0) { ctx.restore(); return; }

  if (shielded) {
    ctx.beginPath();
    ctx.arc(x + 18, y + 28, 32, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,200,255,0.18)";
    ctx.strokeStyle = "#00eeff";
    ctx.lineWidth = 2;
    ctx.fill(); ctx.stroke();
  }
  if (starred) {
    ctx.shadowColor = "#ffd700";
    ctx.shadowBlur = 22;
  }

  if (dir < 0) { ctx.translate(x + 36, 0); ctx.scale(-1, 1); x = 0; }

  const leg = jumping ? 0 : Math.floor(frame / 7) % 2;
  const hatColor = powered ? "#22cc88" : "#cc2200";
  const bodyColor = powered ? "#22cc88" : "#cc2200";

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath(); ctx.ellipse(x + 18, y + 58, 15, 4, 0, 0, Math.PI * 2); ctx.fill();

  // Hat
  ctx.fillStyle = hatColor;
  ctx.fillRect(x + 4, y, 28, 10);
  ctx.fillRect(x + 2, y + 8, 32, 6);

  // Face
  ctx.fillStyle = "#f5c07a"; ctx.fillRect(x + 6, y + 14, 24, 12);
  ctx.fillStyle = "#222";
  ctx.fillRect(x + 9, y + 17, 4, 4); ctx.fillRect(x + 23, y + 17, 4, 4);
  ctx.fillStyle = "#4a2800"; ctx.fillRect(x + 7, y + 23, 22, 3);

  // Body
  ctx.fillStyle = bodyColor; ctx.fillRect(x + 6, y + 26, 24, 14);
  ctx.fillStyle = "#2244cc"; ctx.fillRect(x + 8, y + 30, 20, 10);
  ctx.fillStyle = "#ffdd44";
  ctx.fillRect(x + 10, y + 31, 4, 4); ctx.fillRect(x + 22, y + 31, 4, 4);

  // Legs
  ctx.fillStyle = "#2244cc";
  if (leg === 0) {
    ctx.fillRect(x + 7, y + 40, 10, 14); ctx.fillRect(x + 19, y + 40, 10, 14);
    ctx.fillStyle = "#4a2800";
    ctx.fillRect(x + 5, y + 50, 13, 6); ctx.fillRect(x + 17, y + 50, 13, 6);
  } else {
    ctx.fillRect(x + 7, y + 40, 10, 8); ctx.fillRect(x + 7, y + 46, 8, 8);
    ctx.fillRect(x + 19, y + 40, 10, 16);
    ctx.fillStyle = "#4a2800";
    ctx.fillRect(x + 4, y + 50, 13, 6); ctx.fillRect(x + 18, y + 52, 13, 6);
  }
  // Arms
  ctx.fillStyle = "#f5c07a";
  ctx.fillRect(x - 2, y + 26, 9, 10); ctx.fillRect(x + 29, y + 26, 9, 10);

  ctx.restore();
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, cam: number, frame: number) {
  if (!e.alive) return;
  ctx.save();
  const sx = e.x - cam;
  const sy = e.type === "flyer" ? e.y + Math.sin(e.flyAngle) * 30 : e.y;
  const bob = Math.sin(frame * 0.1) * 2;

  if (e.type === "spiny") {
    ctx.shadowColor = "#ff4400"; ctx.shadowBlur = 8;
    // Shell
    ctx.fillStyle = "#8B2500";
    ctx.beginPath(); ctx.ellipse(sx + 18, sy + 20 + bob, 18, 14, 0, 0, Math.PI * 2); ctx.fill();
    // Spikes
    ctx.fillStyle = "#ff6600";
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + frame * 0.04;
      ctx.fillRect(sx + 18 + Math.cos(a) * 16, sy + 20 + bob + Math.sin(a) * 12, 5, 5);
    }
    // Eyes
    ctx.fillStyle = "#fff";
    ctx.fillRect(sx + 9, sy + 16 + bob, 7, 6); ctx.fillRect(sx + 22, sy + 16 + bob, 7, 6);
    ctx.fillStyle = "#f00";
    ctx.fillRect(sx + 11, sy + 18 + bob, 3, 3); ctx.fillRect(sx + 24, sy + 18 + bob, 3, 3);
  } else if (e.type === "flyer") {
    ctx.shadowColor = "#aa00ff"; ctx.shadowBlur = 12;
    // Wings
    const wingFlap = Math.sin(frame * 0.25) * 12;
    ctx.fillStyle = "#cc44ff88";
    ctx.beginPath(); ctx.ellipse(sx + 5, sy + 15 + bob - wingFlap, 12, 7, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(sx + 31, sy + 15 + bob - wingFlap, 12, 7, 0.4, 0, Math.PI * 2); ctx.fill();
    // Body
    ctx.fillStyle = "#6600cc";
    ctx.beginPath(); ctx.ellipse(sx + 18, sy + 20 + bob, 14, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillRect(sx + 10, sy + 16 + bob, 6, 5); ctx.fillRect(sx + 20, sy + 16 + bob, 6, 5);
    ctx.fillStyle = "#aa00ff";
    ctx.fillRect(sx + 12, sy + 18 + bob, 3, 3); ctx.fillRect(sx + 22, sy + 18 + bob, 3, 3);
  } else {
    // Goomba
    ctx.shadowColor = "#8B4513"; ctx.shadowBlur = 6;
    ctx.fillStyle = "#8B4513";
    ctx.beginPath(); ctx.ellipse(sx + 18, sy + 22 + bob, 17, 15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#5c2900";
    ctx.beginPath(); ctx.arc(sx + 18, sy + 14 + bob, 16, Math.PI, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = "#fff5";
    ctx.beginPath(); ctx.arc(sx + 12, sy + 10 + bob, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillRect(sx + 8, sy + 20 + bob, 7, 6); ctx.fillRect(sx + 21, sy + 20 + bob, 7, 6);
    ctx.fillStyle = "#111";
    ctx.fillRect(sx + 10, sy + 22 + bob, 3, 3); ctx.fillRect(sx + 23, sy + 22 + bob, 3, 3);
    ctx.strokeStyle = "#111"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(sx + 18, sy + 30 + bob, 7, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
    const legOff = Math.floor(frame / 10) % 2 === 0 ? 2 : -2;
    ctx.fillStyle = "#4a2800";
    ctx.beginPath(); ctx.ellipse(sx + 11 + legOff, sy + 36, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(sx + 25 - legOff, sy + 36, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
  }

  // HP bar for spiny
  if (e.type === "spiny" && e.hp > 1) {
    ctx.fillStyle = "#ff0000"; ctx.fillRect(sx, sy - 8, 36, 4);
    ctx.fillStyle = "#00ff00"; ctx.fillRect(sx, sy - 8, 36 * (e.hp / 3), 4);
  }
  ctx.restore();
}

function drawTile(ctx: CanvasRenderingContext2D, tx: number, ty: number, theme: string) {
  ctx.save();
  if (theme === "grass") {
    ctx.fillStyle = "#7c5c2e"; ctx.fillRect(tx, ty, TILE, TILE);
    ctx.fillStyle = "#9a7c3a"; ctx.fillRect(tx + 3, ty + 3, TILE - 6, TILE - 6);
    ctx.strokeStyle = "#5c3d10"; ctx.lineWidth = 2; ctx.strokeRect(tx + 1, ty + 1, TILE - 2, TILE - 2);
  } else if (theme === "cave") {
    ctx.fillStyle = "#2a0a5f"; ctx.fillRect(tx, ty, TILE, TILE);
    ctx.fillStyle = "#4a18a0"; ctx.fillRect(tx + 2, ty + 2, TILE - 4, TILE - 4);
    ctx.strokeStyle = "#9955ff"; ctx.lineWidth = 1.5; ctx.strokeRect(tx + 1, ty + 1, TILE - 2, TILE - 2);
    ctx.fillStyle = "#aa77ff44";
    ctx.beginPath(); ctx.arc(tx + TILE * 0.3, ty + TILE * 0.3, 5, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = "#5c1400"; ctx.fillRect(tx, ty, TILE, TILE);
    ctx.fillStyle = "#8b2000"; ctx.fillRect(tx + 2, ty + 2, TILE - 4, TILE - 4);
    ctx.strokeStyle = "#ff4400"; ctx.lineWidth = 1.5; ctx.strokeRect(tx + 1, ty + 1, TILE - 2, TILE - 2);
    ctx.strokeStyle = "#ff660044"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(tx + 8, ty + 4); ctx.lineTo(tx + TILE - 8, ty + TILE - 4); ctx.stroke();
  }
  ctx.restore();
}

function drawGround(ctx: CanvasRenderingContext2D, tx: number, ty: number, theme: string) {
  ctx.save();
  if (theme === "grass") {
    ctx.fillStyle = "#228B22"; ctx.fillRect(tx, ty, TILE, 8);
    ctx.fillStyle = "#8B4513"; ctx.fillRect(tx, ty + 8, TILE, TILE - 8);
  } else if (theme === "cave") {
    ctx.fillStyle = "#5500bb"; ctx.fillRect(tx, ty, TILE, 8);
    ctx.fillStyle = "#2a0a5f"; ctx.fillRect(tx, ty + 8, TILE, TILE - 8);
    ctx.strokeStyle = "#9955ff44"; ctx.lineWidth = 1; ctx.strokeRect(tx, ty, TILE, TILE);
  } else {
    // Animated lava glow
    ctx.fillStyle = "#cc2200"; ctx.fillRect(tx, ty, TILE, 8);
    ctx.fillStyle = "#661100"; ctx.fillRect(tx, ty + 8, TILE, TILE - 8);
    ctx.fillStyle = "#ff440022"; ctx.fillRect(tx, ty, TILE, TILE);
  }
  ctx.restore();
}

function drawCoin(ctx: CanvasRenderingContext2D, cx: number, cy: number, frame: number) {
  const bob = Math.sin(frame * 0.08 + cx * 0.01) * 3;
  const scaleX = Math.abs(Math.cos(frame * 0.06));
  ctx.save();
  ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 14;
  ctx.translate(cx + 10, cy + 10 + bob);
  ctx.scale(scaleX, 1);
  ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fillStyle = "#ffd700"; ctx.fill();
  ctx.strokeStyle = "#ffb300"; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = "#fff9"; ctx.font = "bold 10px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("$", 0, 0);
  ctx.restore();
}

function drawPowerUp(ctx: CanvasRenderingContext2D, pu: PowerUp, cam: number, frame: number) {
  if (pu.collected) return;
  const sx = pu.x - cam, sy = pu.y + Math.sin(frame * 0.06) * 4;
  ctx.save();
  ctx.shadowBlur = 18;
  if (pu.type === "mushroom") {
    ctx.shadowColor = "#ff4444";
    ctx.fillStyle = "#ff2222"; ctx.beginPath(); ctx.arc(sx + 12, sy + 8, 12, Math.PI, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(sx + 8, sy + 6, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(sx + 16, sy + 5, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#f5c07a"; ctx.fillRect(sx + 6, sy + 8, 12, 10);
  } else if (pu.type === "star") {
    ctx.shadowColor = "#ffd700";
    const points = 5;
    ctx.fillStyle = "#ffd700";
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const a = (i * Math.PI) / points - Math.PI / 2;
      const r = i % 2 === 0 ? 13 : 6;
      if (i === 0) ctx.moveTo(sx + 12 + Math.cos(a) * r, sy + 12 + Math.sin(a) * r);
      else ctx.lineTo(sx + 12 + Math.cos(a) * r, sy + 12 + Math.sin(a) * r);
    }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#fff9"; ctx.beginPath(); ctx.arc(sx + 9, sy + 9, 4, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.shadowColor = "#00eeff";
    ctx.strokeStyle = "#00eeff"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(sx + 12, sy + 12, 11, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "#00eeff88"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(sx + 12, sy + 12, 7, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#00eeff"; ctx.font = "bold 13px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("✦", sx + 12, sy + 12);
  }
  ctx.restore();
}

function drawFlag(ctx: CanvasRenderingContext2D, x: number, frame: number) {
  ctx.save();
  ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 20;
  ctx.strokeStyle = "#ccc"; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(x + 10, 0); ctx.lineTo(x + 10, CH); ctx.stroke();
  const wave = Math.sin(frame * 0.08) * 6;
  ctx.shadowColor = "#ff8800";
  ctx.fillStyle = "#ff4400";
  ctx.beginPath();
  ctx.moveTo(x + 10, 24);
  ctx.bezierCurveTo(x + 34 + wave, 34, x + 34 + wave, 48, x + 10, 56);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#fff"; ctx.font = "bold 13px serif"; ctx.fillText("⚑", x + 14, 45);
  ctx.restore();
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.save();
  ctx.globalAlpha = p.life;
  ctx.fillStyle = p.color;
  ctx.shadowColor = p.color; ctx.shadowBlur = 6;
  ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawCheckpoint(ctx: CanvasRenderingContext2D, x: number, cam: number, reached: boolean) {
  const sx = x - cam;
  if (sx < -20 || sx > CW + 20) return;
  ctx.save();
  ctx.strokeStyle = reached ? "#44ff88" : "#ffffff66"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(sx, CH - TILE); ctx.lineTo(sx, CH - TILE - 60); ctx.stroke();
  ctx.fillStyle = reached ? "#44ff88" : "#ffffff88";
  ctx.fillRect(sx, CH - TILE - 60, 30, 20);
  ctx.fillStyle = reached ? "#004400" : "#333"; ctx.font = "bold 10px monospace"; ctx.fillText("✔", sx + 8, CH - TILE - 45);
  ctx.restore();
}

// ─── Game Component ───────────────────────────────────────────────────────────
export default function PlatformerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gsRef = useRef<GameState | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef(0);
  const keys = useRef<Record<string, boolean>>({});
  const touchRef = useRef({ left: false, right: false, jump: false });
  const [ui, setUi] = useState<{ phase: Phase; score: number; lives: number; level: number; coins: number; combo: number }>({
    phase: "idle", score: 0, lives: 3, level: 1, coins: 0, combo: 0,
  });

  useEffect(() => {
    const d = (e: KeyboardEvent) => { keys.current[e.key] = true; if (e.key === " ") e.preventDefault(); };
    const u = (e: KeyboardEvent) => { keys.current[e.key] = false; };
    window.addEventListener("keydown", d);
    window.addEventListener("keyup", u);
    return () => { window.removeEventListener("keydown", d); window.removeEventListener("keyup", u); };
  }, []);

  function burst(x: number, y: number, color: string, n = 12) {
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n + Math.random() * 0.5;
      const spd = 2 + Math.random() * 5;
      particlesRef.current.push({ x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd - 2, color, life: 1, r: 2 + Math.random() * 4 });
    }
  }

  function initLevel(lvl: number, prevScore = 0, prevLives = 3, prevCoins = 0) {
    const ld = makeLevel(lvl);
    gsRef.current = {
      lvl, ld,
      player: { x: 60, y: ld.groundY - 64, vx: 0, vy: 0, w: 36, h: 58, onGround: false, dir: 1, jumpBuffer: 0, coyoteTime: 0, invincible: 0, powered: false, starred: false, shielded: false, starTimer: 0, shieldTimer: 0 },
      enemies: ld.enemies.map(e => ({
        x: e.x, y: ld.groundY - 42, vx: 1.4 + lvl * 0.3,
        w: 36, h: 42, patrol: e.patrol,
        alive: true, hp: e.type === "spiny" ? 3 : 1,
        stunTimer: 0, type: e.type ?? "goomba", flyAngle: 0,
      })),
      coins: ld.coinPositions.map(c => ({ ...c, collected: false })), // ← array of coin objects
      coinCount: prevCoins,  // ← separate numeric counter
      powerUps: ld.powerUps.map(p => ({ ...p, collected: false })),
      camera: 0, camVel: 0,
      score: prevScore, lives: prevLives,
      running: true,
      checkpoints: (ld as any).checkpoints ?? [],
      lastCheckpoint: -1,
      combo: 0, comboTimer: 0,
      bossDefeated: false,
    };
    particlesRef.current = [];
    frameRef.current = 0;
  }

  const startGame = useCallback((lvl = 1) => {
    initLevel(lvl);
    setUi({ phase: "playing", score: 0, lives: 3, level: lvl, coins: 0, combo: 0 });
  }, []);

  // ─── Main Loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || ui.phase !== "playing") return;
    const ctx = canvas.getContext("2d")!;
    let animId: number;

    const clouds = [80, 340, 600, 900, 1200, 1500, 1800].map(x => ({ x, y: 30 + Math.random() * 50 }));

    function getPlatforms() {
      const gs = gsRef.current!;
      const rects: Rect[] = [];
      for (let gx = 0; gx < gs.ld.worldW; gx += TILE)
        rects.push({ x: gx, y: gs.ld.groundY, w: TILE, h: TILE });
      gs.ld.platforms.forEach(p => {
        for (let i = 0; i < p.w; i++)
          rects.push({ x: p.x + i * TILE, y: p.y, w: TILE, h: TILE });
      });
      return rects;
    }

    function loop() {
      const gs = gsRef.current;
      if (!gs || !gs.running) return;
      frameRef.current++;
      const f = frameRef.current;
      const pl = gs.player;
      const ld = gs.ld;

      // ── Moving platforms ──
      ld.platforms.forEach(p => {
        if (!p.moving || !p.moveRange || !p.moveSpeed) return;
        if (p.orig === undefined) p.orig = p.x;
        p.x += p.moveSpeed!;
        if (p.x > p.moveRange![1]) p.moveSpeed = -Math.abs(p.moveSpeed!);
        if (p.x < p.moveRange![0]) p.moveSpeed = Math.abs(p.moveSpeed!);
      });

      // ── Power-up timers ──
      if (pl.starred) { pl.starTimer--; if (pl.starTimer <= 0) pl.starred = false; }
      if (pl.shielded) { pl.shieldTimer--; if (pl.shieldTimer <= 0) pl.shielded = false; }
      if (pl.invincible > 0) pl.invincible--;

      // ── Combo timer ──
      if (gs.comboTimer > 0) { gs.comboTimer--; if (gs.comboTimer <= 0) gs.combo = 0; }

      // ── Input ──
      const left = keys.current["ArrowLeft"] || keys.current["a"] || keys.current["A"] || touchRef.current.left;
      const right = keys.current["ArrowRight"] || keys.current["d"] || keys.current["D"] || touchRef.current.right;
      const jumpKey = keys.current[" "] || keys.current["ArrowUp"] || keys.current["w"] || keys.current["W"] || touchRef.current.jump;

      if (left) { pl.vx = -PLAYER_SPEED * (pl.powered ? 1.3 : 1); pl.dir = -1; }
      else if (right) { pl.vx = PLAYER_SPEED * (pl.powered ? 1.3 : 1); pl.dir = 1; }
      else pl.vx *= 0.78;

      // Coyote time & jump buffer
      if (pl.onGround) pl.coyoteTime = 8;
      else if (pl.coyoteTime > 0) pl.coyoteTime--;
      if (jumpKey) pl.jumpBuffer = 6;
      else if (pl.jumpBuffer > 0) pl.jumpBuffer--;

      if (pl.jumpBuffer > 0 && pl.coyoteTime > 0) {
        pl.vy = JUMP_FORCE * (pl.powered ? 1.1 : 1);
        pl.onGround = false; pl.coyoteTime = 0; pl.jumpBuffer = 0;
        burst(pl.x + pl.w / 2, pl.y + pl.h, "#ffffff", 6);
      }
      // Variable jump height
      if (!jumpKey && pl.vy < -5) pl.vy += 1.5;

      // ── Physics ──
      pl.vy = Math.min(pl.vy + GRAVITY, 20);
      pl.x += pl.vx; pl.y += pl.vy;
      pl.x = Math.max(0, pl.x);
      pl.onGround = false;

      const plats = getPlatforms();
      for (const r of plats) {
        if (!overlapXY(pl.x, pl.y, pl.w, pl.h, r.x, r.y, r.w, r.h)) continue;
        if (pl.vy > 0 && pl.y + pl.h - pl.vy <= r.y + 6) {
          pl.y = r.y - pl.h; pl.vy = 0; pl.onGround = true;
        } else if (pl.vy < 0 && pl.y - pl.vy >= r.y + r.h - 6) {
          pl.y = r.y + r.h; pl.vy = 1;
        } else if (pl.vx > 0) { pl.x = r.x - pl.w; pl.vx = 0; }
        else if (pl.vx < 0) { pl.x = r.x + r.w; pl.vx = 0; }
      }

      // ── Fall ──
      if (pl.y > CH + 120) {
        if (pl.shielded) {
          pl.shielded = false; pl.y = ld.groundY - pl.h;
          pl.x = gs.lastCheckpoint >= 0 ? gs.checkpoints[gs.lastCheckpoint] : 60;
          pl.vx = 0; pl.vy = 0;
        } else {
          gs.lives--;
          if (gs.lives <= 0) { gs.running = false; setUi(u => ({ ...u, phase: "dead", score: gs.score, coins: gs.coinCount })); return; }
          const spawnX = gs.lastCheckpoint >= 0 ? gs.checkpoints[gs.lastCheckpoint] : 60;
          pl.x = spawnX; pl.y = ld.groundY - pl.h; pl.vx = 0; pl.vy = 0;
          pl.invincible = 80;
          setUi(u => ({ ...u, lives: gs.lives }));
        }
      }

      // ── Checkpoints ──
      gs.checkpoints.forEach((cx, i) => {
        if (i > gs.lastCheckpoint && pl.x > cx) {
          gs.lastCheckpoint = i;
          burst(cx, ld.groundY - TILE, "#44ff88", 16);
        }
      });

      // ── Camera (smooth) ──
      const targetCam = Math.max(0, Math.min(pl.x - CW / 3, ld.worldW - CW));
      gs.camVel = gs.camVel * 0.85 + (targetCam - gs.camera) * 0.12;
      gs.camera += gs.camVel;

      // ── Enemies ──
      gs.enemies.forEach(e => {
        if (!e.alive) return;
        if (e.stunTimer > 0) { e.stunTimer--; return; }
        if (e.type === "flyer") { e.flyAngle += 0.05; e.x += e.vx; }
        else e.x += e.vx;

        if (e.x <= e.patrol[0]) { e.x = e.patrol[0]; e.vx = Math.abs(e.vx); }
        if (e.x >= e.patrol[1]) { e.x = e.patrol[1]; e.vx = -Math.abs(e.vx); }

        if (pl.invincible > 0 || pl.starred) {
          if (pl.starred && overlapXY(pl.x, pl.y, pl.w, pl.h, e.x, e.y, e.w, e.h)) {
            e.alive = false; gs.score += 200; burst(e.x + 18, e.y, "#ffd700", 18);
            setUi(u => ({ ...u, score: gs.score }));
          }
          return;
        }

        if (!overlapXY(pl.x, pl.y, pl.w, pl.h, e.x, e.y, e.w, e.h)) return;

        const ey = e.type === "flyer" ? e.y + Math.sin(e.flyAngle) * 30 : e.y;
        if (pl.vy > 0 && pl.y + pl.h < ey + e.h / 2 + 14) {
          // Stomp
          e.hp--;
          if (e.hp <= 0) {
            e.alive = false;
            gs.combo++; gs.comboTimer = 90;
            const pts = 100 * gs.combo;
            gs.score += pts;
            burst(e.x + 18, ey, e.type === "spiny" ? "#ff4400" : "#ff8800", 16);
            setUi(u => ({ ...u, score: gs.score, combo: gs.combo }));
          } else {
            e.stunTimer = 30;
            burst(e.x + 18, ey, "#ffffff", 8);
          }
          pl.vy = -9; pl.onGround = false;
        } else if (e.type !== "spiny" || !pl.onGround) {
          // Damage
          if (pl.shielded) { pl.shielded = false; pl.shieldTimer = 0; e.vx *= -1; return; }
          if (pl.powered) { pl.powered = false; pl.invincible = 60; return; }
          gs.lives--;
          burst(pl.x + pl.w / 2, pl.y + pl.h / 2, "#ff2244", 20);
          if (gs.lives <= 0) { gs.running = false; setUi(u => ({ ...u, phase: "dead", score: gs.score, coins: gs.coinCount })); return; }
          const spawnX = gs.lastCheckpoint >= 0 ? gs.checkpoints[gs.lastCheckpoint] : 60;
          pl.x = spawnX; pl.y = ld.groundY - pl.h; pl.vx = 0; pl.vy = 0;
          pl.invincible = 90;
          setUi(u => ({ ...u, lives: gs.lives }));
        }
      });

      // ── Coins ──  (fixed: gs.coins is Coin[], gs.coinCount is number)
      gs.coins.forEach(c => {
        if (c.collected) return;
        if (overlapXY(pl.x, pl.y, pl.w, pl.h, c.x, c.y, 20, 20)) {
          c.collected = true;
          gs.score += 50;
          gs.coinCount++;  // ← fixed: increment numeric counter, not array
          burst(c.x + 10, c.y + 10, "#ffd700", 8);
          setUi(u => ({ ...u, score: gs.score, coins: gs.coinCount }));
        }
      });

      // ── Power-ups ──
      gs.powerUps.forEach(pu => {
        if (pu.collected) return;
        if (!overlapXY(pl.x, pl.y, pl.w, pl.h, pu.x, pu.y, 24, 24)) return;
        pu.collected = true;
        burst(pu.x + 12, pu.y + 12, pu.type === "star" ? "#ffd700" : pu.type === "shield" ? "#00eeff" : "#ff4444", 20);
        if (pu.type === "mushroom") { pl.powered = true; gs.score += 200; }
        else if (pu.type === "star") { pl.starred = true; pl.starTimer = 360; gs.score += 500; }
        else if (pu.type === "shield") { pl.shielded = true; pl.shieldTimer = 500; gs.score += 300; }
        setUi(u => ({ ...u, score: gs.score }));
      });

      // ── Goal ──
      if (pl.x + pl.w >= ld.goal.x) {
        gs.running = false;
        burst(ld.goal.x, CH / 2, "#ffd700", 30);
        if (gs.lvl >= MAX_LEVELS) setUi(u => ({ ...u, phase: "win", score: gs.score, coins: gs.coinCount }));
        else setUi(u => ({ ...u, phase: "levelclear", score: gs.score, level: gs.lvl, coins: gs.coinCount }));
        return;
      }

      // ── Particles ──
      particlesRef.current.forEach(pt => { pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.13; pt.life -= 0.022; });
      particlesRef.current = particlesRef.current.filter(pt => pt.life > 0);

      // ─────── DRAW ────────────────────────────────────────────────────────
      const cam = gs.camera;
      const theme = ld.theme;

      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, CH);
      sky.addColorStop(0, ld.bgColor[0]); sky.addColorStop(1, ld.bgColor[1]);
      ctx.fillStyle = sky; ctx.fillRect(0, 0, CW, CH);

      // Background decorations
      if (theme === "grass") {
        clouds.forEach(c => {
          const sx = ((c.x - cam * 0.3) % (ld.worldW * 0.3 + CW) + CW) % (CW + 300) - 150;
          ctx.save(); ctx.fillStyle = "rgba(255,255,255,0.88)"; ctx.shadowColor = "#fff"; ctx.shadowBlur = 10;
          ctx.beginPath(); ctx.arc(sx + 30, c.y + 20, 20, 0, Math.PI * 2); ctx.arc(sx + 55, c.y + 14, 26, 0, Math.PI * 2); ctx.arc(sx + 80, c.y + 20, 20, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        });
      } else if (theme === "cave") {
        // Stars
        for (let i = 0; i < 80; i++) {
          const sx = ((i * 137 + 50) % ld.worldW - cam * 0.15 + ld.worldW) % ld.worldW;
          if (sx < CW) { ctx.beginPath(); ctx.arc(sx, (i * 97 + 20) % (CH - 100), 1.5, 0, Math.PI * 2); ctx.fillStyle = `rgba(200,180,255,${0.3 + (i % 3) * 0.2})`; ctx.fill(); }
        }
        // Crystal stalactites
        for (let i = 0; i < 8; i++) {
          const sx = (i * 280 - cam * 0.5 + ld.worldW) % ld.worldW;
          if (sx < CW + 50) {
            ctx.save(); ctx.fillStyle = "#6600cc88"; ctx.shadowColor = "#aa55ff"; ctx.shadowBlur = 15;
            ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx - 10, 60 + i * 8); ctx.lineTo(sx + 10, 60 + i * 8); ctx.closePath(); ctx.fill(); ctx.restore();
          }
        }
      } else {
        // Lava glow
        const lavaGrad = ctx.createLinearGradient(0, CH - 100, 0, CH);
        lavaGrad.addColorStop(0, "transparent"); lavaGrad.addColorStop(1, "#ff440066");
        ctx.fillStyle = lavaGrad; ctx.fillRect(0, 0, CW, CH);
        // Embers
        for (let i = 0; i < 20; i++) {
          const ex = ((i * 200 + f * 0.5 + i * 37) % ld.worldW - cam * 0.8 + ld.worldW) % ld.worldW;
          const ey = CH - 80 - (((f + i * 40) % 120));
          if (ex < CW) { ctx.save(); ctx.fillStyle = `rgba(255,${60 + i * 5},0,${0.3 + Math.sin(f * 0.1 + i) * 0.2})`; ctx.beginPath(); ctx.arc(ex, ey, 2, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
        }
      }

      // Ground
      for (let gx = 0; gx < ld.worldW; gx += TILE) {
        const sx = gx - cam;
        if (sx > -TILE && sx < CW + TILE) drawGround(ctx, sx, ld.groundY, theme);
      }

      // Platform tiles
      ld.platforms.forEach(p => {
        for (let i = 0; i < p.w; i++) {
          const sx = p.x + i * TILE - cam;
          if (sx > -TILE && sx < CW + TILE) drawTile(ctx, sx, p.y, theme);
        }
      });

      // Checkpoints
      gs.checkpoints.forEach((cx, i) => drawCheckpoint(ctx, cx, cam, i <= gs.lastCheckpoint));

      // Flag
      drawFlag(ctx, ld.goal.x - cam, f);

      // Coins
      gs.coins.forEach(c => { if (!c.collected) drawCoin(ctx, c.x - cam, c.y, f); });

      // Power-ups
      gs.powerUps.forEach(pu => drawPowerUp(ctx, pu, cam, f));

      // Enemies
      gs.enemies.forEach(e => drawEnemy(ctx, e, cam, f));

      // Player
      drawHero(ctx, pl.x - cam, pl.y, pl.dir, !pl.onGround, f, pl.powered, pl.starred, pl.shielded, pl.invincible);

      // Particles
      particlesRef.current.forEach(pt => drawParticle(ctx, pt));

      // ── HUD ──
      ctx.save();
      // Panel
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      roundRect(ctx, 8, 8, 290, 58, 10); ctx.fill();
      ctx.font = "bold 13px 'Courier New', monospace";

      ctx.fillStyle = "#ffd700"; ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 8;
      ctx.fillText(`⭐ ${gs.score}`, 18, 30);

      ctx.fillStyle = "#ff5555"; ctx.shadowColor = "#ff4444";
      ctx.fillText(`♥ ${"❤️".repeat(gs.lives)}`, 18, 52);

      ctx.fillStyle = "#ffdd44"; ctx.shadowColor = "#ffd700";
      ctx.fillText(`🪙 ${gs.coinCount}`, 120, 30);

      // Power-up status
      let statX = 175;
      if (pl.powered) { ctx.fillStyle = "#22ff88"; ctx.fillText("★PWR", statX, 30); }
      if (pl.starred) { ctx.fillStyle = "#ffd700"; ctx.fillText(`⚡${Math.ceil(pl.starTimer / 60)}s`, statX, 52); }
      if (pl.shielded) { ctx.fillStyle = "#00eeff"; ctx.fillText(`🛡${Math.ceil(pl.shieldTimer / 60)}s`, statX + 50, 52); }

      // Combo
      if (gs.combo > 1) {
        ctx.save();
        const alpha = gs.comboTimer / 90;
        ctx.globalAlpha = alpha;
        ctx.font = `bold ${22 + gs.combo * 3}px 'Courier New', monospace`;
        ctx.fillStyle = "#ff8800"; ctx.shadowColor = "#ff8800"; ctx.shadowBlur = 20;
        ctx.fillText(`x${gs.combo} COMBO!`, CW / 2 - 60, 70);
        ctx.restore();
      }

      // Level badge
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      roundRect(ctx, CW - 110, 8, 102, 34, 8); ctx.fill();
      ctx.fillStyle = "#ffffff99"; ctx.shadowBlur = 0; ctx.font = "bold 11px 'Courier New', monospace";
      ctx.fillText(`LVL ${gs.lvl} · ${ld.name}`, CW - 105, 30);
      ctx.restore();

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [ui.phase]);

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  const handleTouch = useCallback((btn: "left" | "right" | "jump", active: boolean) => {
    touchRef.current[btn] = active;
  }, []);

  const themeColors: Record<string, string> = { grass: "#44bb44", cave: "#aa44ff", lava: "#ff4400", sky: "#44aaff", ice: "#aaeeff" };
  const LVL_NAMES = ["Grassy Hills", "Crystal Cave", "Lava Fortress"];

  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(160deg, #050510 0%, #120520 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "'Courier New', monospace", userSelect: "none", padding: "8px",
    }}>
      <div style={{
        fontSize: "clamp(20px, 4vw, 32px)", fontWeight: 900, letterSpacing: "0.16em",
        color: "#ff4400", marginBottom: "4px",
        textShadow: "0 0 24px #ff4400, 2px 2px 0 #aa2200, 4px 4px 0 #660000",
      }}>
        🍄 SUPER PIXEL RUN
      </div>

      <div style={{
        position: "relative", border: "3px solid #ff440055", borderRadius: "10px",
        boxShadow: "0 0 50px #ff440033, 0 0 100px #ff440011", overflow: "hidden",
        width: "min(800px, 99vw)", aspectRatio: `${CW} / ${CH}`, marginTop: "8px",
      }}>
        <canvas ref={canvasRef} width={CW} height={CH} style={{ display: "block", width: "100%", height: "100%", imageRendering: "pixelated" }} />

        {ui.phase !== "playing" && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            background: "rgba(5,5,20,0.93)", backdropFilter: "blur(6px)",
          }}>
            {ui.phase === "idle" && (<>
              <div style={{ color: "#ffd700", fontWeight: 900, fontSize: "clamp(22px, 5vw, 40px)", letterSpacing: 3, textShadow: "0 0 24px #ffd700", marginBottom: 8 }}>🍄 SUPER PIXEL RUN</div>
              <div style={{ color: "#aaffcc", fontSize: 12, marginBottom: 10, opacity: 0.9, textAlign: "center", padding: "0 20px", lineHeight: 2.4 }}>
                3 Worlds · Coins · Combo System<br />
                Power-ups: 🍄 Speed · ⚡ Star · 🛡 Shield<br />
                Checkpoints · Moving Platforms · 3 Enemy Types<br />
                Jump on enemies! Reach the 🚩 flag!
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 20 }}>
                {LVL_NAMES.map((n, i) => (
                  <div key={i} style={{ border: `1px solid ${themeColors[["grass", "cave", "lava"][i]]}66`, borderRadius: 6, padding: "4px 12px", color: themeColors[["grass", "cave", "lava"][i]], fontSize: 11 }}>
                    {i + 1}. {n}
                  </div>
                ))}
              </div>
            </>)}
            {ui.phase === "dead" && (<>
              <div style={{ color: "#ff2244", fontWeight: 900, fontSize: "clamp(26px, 6vw, 44px)", letterSpacing: 4, textShadow: "0 0 30px #ff2244", marginBottom: 8 }}>GAME OVER</div>
              <div style={{ color: "#ffd700", fontWeight: 700, fontSize: 18, marginBottom: 4 }}>⭐ Score: {ui.score}</div>
              <div style={{ color: "#ffdd44", fontSize: 15, marginBottom: 20 }}>🪙 Coins: {ui.coins}</div>
            </>)}
            {ui.phase === "levelclear" && (<>
              <div style={{ color: "#44ff88", fontWeight: 900, fontSize: "clamp(20px, 5vw, 34px)", letterSpacing: 3, textShadow: "0 0 24px #44ff88", marginBottom: 8 }}>🎉 LEVEL {ui.level} CLEAR!</div>
              <div style={{ color: "#ffd700", fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Score: {ui.score}  🪙 {ui.coins}</div>
            </>)}
            {ui.phase === "win" && (<>
              <div style={{ color: "#ffd700", fontWeight: 900, fontSize: "clamp(22px, 5vw, 38px)", letterSpacing: 3, textShadow: "0 0 30px #ffd700", marginBottom: 8 }}>🏆 YOU WIN!</div>
              <div style={{ color: "#44ff88", fontSize: 15, marginBottom: 4 }}>All 3 worlds conquered!</div>
              <div style={{ color: "#ffd700", fontSize: 18, marginBottom: 20 }}>⭐ {ui.score}  🪙 {ui.coins}</div>
            </>)}

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => startGame(1)} style={{
                border: "2px solid #ffd700", background: "transparent", color: "#ffd700",
                fontFamily: "inherit", fontWeight: 900, letterSpacing: 3, padding: "10px 24px",
                cursor: "pointer", fontSize: 14, borderRadius: 6, boxShadow: "0 0 18px #ffd70055",
              }}>
                {ui.phase === "idle" ? "▶ START" : "↺ RESTART"}
              </button>
              {ui.phase === "levelclear" && (
                <button onClick={() => {
                  const gs = gsRef.current!;
                  const nextLvl = ui.level + 1;
                  initLevel(nextLvl, gs.score, gs.lives, gs.coinCount);
                  setUi(u => ({ ...u, phase: "playing", level: nextLvl }));
                }} style={{
                  border: "2px solid #44ff88", background: "transparent", color: "#44ff88",
                  fontFamily: "inherit", fontWeight: 900, letterSpacing: 3, padding: "10px 24px",
                  cursor: "pointer", fontSize: 14, borderRadius: 6, boxShadow: "0 0 18px #44ff8855",
                }}>
                  ▶ NEXT WORLD
                </button>
              )}
            </div>

            <div style={{ marginTop: 24, display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
              {[{ key: "← →", label: "Move" }, { key: "↑ / SPACE", label: "Jump" }, { key: "Stomp 🍄", label: "Kill / Combo" }, { key: "Checkpoints", label: "Auto-save" }].map(c => (
                <div key={c.key} style={{ textAlign: "center" }}>
                  <div style={{ border: "1px solid #ffffff33", borderRadius: 6, padding: "2px 10px", color: "#ffffff99", fontSize: 10, fontWeight: 700, marginBottom: 2 }}>{c.key}</div>
                  <div style={{ color: "#ffffff44", fontSize: 9 }}>{c.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Touch controls */}
      <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "center" }}>
        {([["◀", "left", "#00e5ff"], ["▶", "right", "#00e5ff"], ["▲ JUMP", "jump", "#ffd700"]] as const).map(([label, btn, color]) => (
          <button key={btn}
            onTouchStart={e => { e.preventDefault(); handleTouch(btn, true); }}
            onTouchEnd={e => { e.preventDefault(); handleTouch(btn, false); }}
            onMouseDown={() => handleTouch(btn, true)}
            onMouseUp={() => handleTouch(btn, false)}
            onMouseLeave={() => handleTouch(btn, false)}
            style={{
              minWidth: 64, height: 52, border: `2px solid ${color}66`, background: "transparent",
              color, fontFamily: "inherit", fontWeight: 900, fontSize: btn === "jump" ? 11 : 18,
              borderRadius: 8, cursor: "pointer",
            }}>
            {label}
          </button>
        ))}
      </div>
      <div style={{ color: "#ffffff18", fontFamily: "inherit", fontSize: 9, marginTop: 6, letterSpacing: 2 }}>
        KEYBOARD · WASD · TOUCH
      </div>
    </div>
  );
}
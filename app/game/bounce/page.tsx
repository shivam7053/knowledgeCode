"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Box, Typography, Button } from "@mui/material";

// ─── Constants ────────────────────────────────────────────────────────────────
const W = 600, H = 700;
const PAD_W = 90, PAD_H = 14, PAD_Y = H - 50;
const BALL_R = 11;
const ROWS = 6, COLS = 8;
const BRICK_W = Math.floor((W - 40) / COLS);
const BRICK_H = 26;
const BRICK_MARGIN = 5;
const BRICK_OFFSET_X = 20;
const BRICK_OFFSET_Y = 60;
const PAD_SPEED = 8;
const INIT_BALL_SPEED = 5.2;
const SPEED_STEP = 0.18; // per brick hit
const MAX_SPEED = 13;

// Neon palette per row
const ROW_COLORS = [
  { fill: "#ff1744", glow: "#ff174488", label: 3 },
  { fill: "#ff6d00", glow: "#ff6d0066", label: 2 },
  { fill: "#ffd740", glow: "#ffd74066", label: 2 },
  { fill: "#00e676", glow: "#00e67666", label: 1 },
  { fill: "#00e5ff", glow: "#00e5ff66", label: 1 },
  { fill: "#d500f9", glow: "#d500f966", label: 1 },
];

function makeBricks() {
  const bricks = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      bricks.push({
        r, c,
        x: BRICK_OFFSET_X + c * (BRICK_W + BRICK_MARGIN),
        y: BRICK_OFFSET_Y + r * (BRICK_H + BRICK_MARGIN),
        hp: ROW_COLORS[r].label,
        maxHp: ROW_COLORS[r].label,
        alive: true,
        hit: 0, // flash timer
      });
    }
  }
  return bricks;
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function useKeys() {
  const keys = useRef({});
  useEffect(() => {
    const d = (e) => { keys.current[e.key] = true; };
    const u = (e) => { keys.current[e.key] = false; };
    window.addEventListener("keydown", d);
    window.addEventListener("keyup", u);
    return () => { window.removeEventListener("keydown", d); window.removeEventListener("keyup", u); };
  }, []);
  return keys;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function BounceGame() {
  const canvasRef = useRef(null);
  const keys = useKeys();
  const gs = useRef(null); // game state ref

  const [ui, setUi] = useState({ phase: "idle", score: 0, lives: 3, level: 1 }); // phase: idle | playing | dead | win

  // Particle system
  const particles = useRef([]);
  function burst(x, y, color, n = 14) {
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i) / n + Math.random() * 0.4;
      const speed = 2 + Math.random() * 4;
      particles.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 1,
        r: 2 + Math.random() * 3,
      });
    }
  }

  function initState(level = 1) {
    const speed = INIT_BALL_SPEED + (level - 1) * 0.4;
    return {
      pad: { x: W / 2 - PAD_W / 2 },
      ball: {
        x: W / 2,
        y: PAD_Y - BALL_R - 2,
        vx: (Math.random() > 0.5 ? 1 : -1) * speed * 0.65,
        vy: -speed,
        speed,
        launched: false,
      },
      bricks: makeBricks(),
      score: gs.current?.score ?? 0,
      lives: gs.current?.lives ?? 3,
      level,
      bricksLeft: ROWS * COLS,
      running: true,
    };
  }

  const startGame = useCallback((lvl = 1) => {
    particles.current = [];
    gs.current = initState(lvl);
    gs.current.score = 0;
    gs.current.lives = 3;
    setUi({ phase: "playing", score: 0, lives: 3, level: lvl });
  }, []);

  const nextLevel = useCallback(() => {
    const lvl = (gs.current?.level ?? 1) + 1;
    particles.current = [];
    const prev = gs.current;
    gs.current = initState(lvl);
    gs.current.score = prev.score;
    gs.current.lives = prev.lives;
    setUi({ phase: "playing", score: prev.score, lives: prev.lives, level: lvl });
  }, []);

  // ─── Game loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || ui.phase !== "playing") return;
    const ctx = canvas.getContext("2d");
    let animId;

    // Background stars (static, generated once)
    const bgStars = Array.from({ length: 80 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      a: Math.random(),
    }));

    function drawBg() {
      ctx.fillStyle = "#06080f";
      ctx.fillRect(0, 0, W, H);
      // Scanlines
      for (let y = 0; y < H; y += 4) {
        ctx.fillStyle = "rgba(0,0,0,0.18)";
        ctx.fillRect(0, y, W, 2);
      }
      // Stars
      bgStars.forEach(s => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.a})`;
        ctx.fill();
      });
    }

    function drawPaddle(x) {
      const cx = x + PAD_W / 2;
      ctx.save();
      // Glow
      ctx.shadowColor = "#00e5ff";
      ctx.shadowBlur = 24;
      // Body
      const grad = ctx.createLinearGradient(x, PAD_Y, x, PAD_Y + PAD_H);
      grad.addColorStop(0, "#69fffa");
      grad.addColorStop(1, "#0097a7");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, PAD_Y, PAD_W, PAD_H, PAD_H / 2);
      ctx.fill();
      // Shine
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.beginPath();
      ctx.roundRect(x + 6, PAD_Y + 2, PAD_W - 12, 4, 2);
      ctx.fill();
      ctx.restore();
    }

    function drawBall(ball) {
      ctx.save();
      ctx.shadowColor = "#ffd740";
      ctx.shadowBlur = 28;
      // Trail
      ctx.globalAlpha = 0.18;
      for (let i = 3; i >= 1; i--) {
        ctx.beginPath();
        ctx.arc(ball.x - ball.vx * i * 1.1, ball.y - ball.vy * i * 1.1, BALL_R * (1 - i * 0.18), 0, Math.PI * 2);
        ctx.fillStyle = "#ffd740";
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      const grad = ctx.createRadialGradient(ball.x - 3, ball.y - 3, 1, ball.x, ball.y, BALL_R);
      grad.addColorStop(0, "#fff8c0");
      grad.addColorStop(0.5, "#ffd740");
      grad.addColorStop(1, "#ff6d00");
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    }

    function drawBrick(b) {
      if (!b.alive) return;
      const col = ROW_COLORS[b.r];
      const fade = b.hp / b.maxHp;
      ctx.save();
      if (b.hit > 0) {
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = 20;
      } else {
        ctx.shadowColor = col.glow;
        ctx.shadowBlur = 12;
      }
      ctx.globalAlpha = 0.55 + 0.45 * fade;
      // Body
      const grad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + BRICK_H);
      grad.addColorStop(0, b.hit > 0 ? "#ffffff" : col.fill);
      grad.addColorStop(1, b.hit > 0 ? col.fill : col.glow.slice(0, 7) + "cc");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, BRICK_W - BRICK_MARGIN, BRICK_H, 5);
      ctx.fill();
      // Border
      ctx.strokeStyle = b.hit > 0 ? "#ffffff" : col.fill;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, BRICK_W - BRICK_MARGIN, BRICK_H, 5);
      ctx.stroke();
      // HP dots
      if (b.maxHp > 1) {
        for (let i = 0; i < b.hp; i++) {
          ctx.beginPath();
          ctx.arc(b.x + 10 + i * 10, b.y + BRICK_H / 2, 3, 0, Math.PI * 2);
          ctx.fillStyle = "#fff";
          ctx.globalAlpha = 0.8;
          ctx.fill();
        }
      }
      ctx.restore();
    }

    function drawParticles() {
      particles.current.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.restore();
      });
    }

    function drawHUD(s) {
      ctx.save();
      ctx.font = "bold 15px 'Courier New', monospace";
      ctx.fillStyle = "#00e5ff";
      ctx.shadowColor = "#00e5ff";
      ctx.shadowBlur = 8;
      ctx.fillText(`SCORE: ${s.score}`, 16, 26);
      ctx.fillText(`LVL: ${s.level}`, W / 2 - 24, 26);
      // Lives as balls
      for (let i = 0; i < s.lives; i++) {
        ctx.beginPath();
        ctx.arc(W - 30 - i * 22, 18, 7, 0, Math.PI * 2);
        ctx.fillStyle = "#ffd740";
        ctx.shadowColor = "#ffd740";
        ctx.fill();
      }
      ctx.restore();
    }

    function loop() {
      const s = gs.current;
      if (!s || !s.running) return;

      // Paddle input
      const left = keys.current["ArrowLeft"] || keys.current["a"] || keys.current["A"];
      const right = keys.current["ArrowRight"] || keys.current["d"] || keys.current["D"];
      if (left) s.pad.x = clamp(s.pad.x - PAD_SPEED, 0, W - PAD_W);
      if (right) s.pad.x = clamp(s.pad.x + PAD_SPEED, 0, W - PAD_W);

      // Launch ball with space
      if (!s.ball.launched && (keys.current[" "] || keys.current["ArrowUp"])) {
        s.ball.launched = true;
      }

      const b = s.ball;

      if (!b.launched) {
        b.x = s.pad.x + PAD_W / 2;
        b.y = PAD_Y - BALL_R - 2;
      } else {
        // Move
        b.x += b.vx;
        b.y += b.vy;

        // Wall bounces
        if (b.x - BALL_R < 0) { b.x = BALL_R; b.vx = Math.abs(b.vx); }
        if (b.x + BALL_R > W) { b.x = W - BALL_R; b.vx = -Math.abs(b.vx); }
        if (b.y - BALL_R < 0) { b.y = BALL_R; b.vy = Math.abs(b.vy); }

        // Paddle collision
        if (
          b.vy > 0 &&
          b.y + BALL_R >= PAD_Y &&
          b.y + BALL_R <= PAD_Y + PAD_H + 4 &&
          b.x >= s.pad.x - 4 &&
          b.x <= s.pad.x + PAD_W + 4
        ) {
          b.y = PAD_Y - BALL_R;
          // Angle based on hit position
          const hitPos = (b.x - s.pad.x) / PAD_W; // 0..1
          const angle = -Math.PI / 6 - (hitPos - 0.5) * -Math.PI / 2.2; // -150° to -30°
          const spd = Math.min(b.speed, MAX_SPEED);
          b.vx = Math.cos(angle) * spd;
          b.vy = -Math.abs(Math.sin(angle) * spd);
          burst(b.x, PAD_Y, "#00e5ff", 8);
        }

        // Ball lost
        if (b.y - BALL_R > H) {
          s.lives--;
          if (s.lives <= 0) {
            s.running = false;
            setUi(u => ({ ...u, phase: "dead", score: s.score }));
            return;
          }
          // Reset ball
          s.ball = {
            x: s.pad.x + PAD_W / 2,
            y: PAD_Y - BALL_R - 2,
            vx: (Math.random() > 0.5 ? 1 : -1) * s.ball.speed * 0.65,
            vy: -s.ball.speed,
            speed: s.ball.speed,
            launched: false,
          };
          setUi(u => ({ ...u, lives: s.lives }));
        }

        // Brick collisions
        for (const brick of s.bricks) {
          if (!brick.alive) continue;
          const bx = brick.x, by = brick.y, bw = BRICK_W - BRICK_MARGIN, bh = BRICK_H;
          if (b.x + BALL_R > bx && b.x - BALL_R < bx + bw && b.y + BALL_R > by && b.y - BALL_R < by + bh) {
            brick.hp--;
            brick.hit = 8;
            if (brick.hp <= 0) {
              brick.alive = false;
              s.bricksLeft--;
              s.score += ROW_COLORS[brick.r].label * 10;
              burst(brick.x + bw / 2, brick.y + bh / 2, ROW_COLORS[brick.r].fill, 16);
            } else {
              burst(brick.x + bw / 2, brick.y + bh / 2, ROW_COLORS[brick.r].fill, 5);
            }
            // Increase speed on hit
            b.speed = Math.min(b.speed + SPEED_STEP, MAX_SPEED);

            // Determine bounce direction
            const overlapLeft = b.x + BALL_R - bx;
            const overlapRight = bx + bw - (b.x - BALL_R);
            const overlapTop = b.y + BALL_R - by;
            const overlapBottom = by + bh - (b.y - BALL_R);
            const minH = Math.min(overlapLeft, overlapRight);
            const minV = Math.min(overlapTop, overlapBottom);
            if (minH < minV) b.vx = -b.vx;
            else b.vy = -b.vy;

            // Maintain speed magnitude
            const mag = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
            b.vx = (b.vx / mag) * b.speed;
            b.vy = (b.vy / mag) * b.speed;

            setUi(u => ({ ...u, score: s.score }));
            break; // one brick per frame
          }
        }

        // Win level
        if (s.bricksLeft <= 0) {
          s.running = false;
          setUi(u => ({ ...u, phase: "win", score: s.score, level: s.level }));
          return;
        }
      }

      // Tick brick flash
      s.bricks.forEach(b => { if (b.hit > 0) b.hit--; });

      // Update particles
      particles.current.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.12;
        p.life -= 0.03;
      });
      particles.current = particles.current.filter(p => p.life > 0);

      // Draw
      drawBg();
      s.bricks.forEach(drawBrick);
      drawPaddle(s.pad.x);
      drawBall(s.ball);
      drawParticles();
      drawHUD(s);

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
    // eslint-disable-next-line
  }, [ui.phase]);

  // Touch / mouse paddle control
  const handleMove = useCallback((clientX) => {
    if (!gs.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const tx = (clientX - rect.left) * scaleX - PAD_W / 2;
    gs.current.pad.x = clamp(tx, 0, W - PAD_W);
    if (!gs.current.ball.launched) gs.current.ball.launched = true;
  }, []);

  return (
    <Box sx={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 50% 0%, #0d1b2a 0%, #06080f 70%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "'Courier New', monospace",
      userSelect: "none", p: 2,
    }}>
      {/* Title */}
      <Typography variant="h4" sx={{
        color: "#ffd740",
        fontFamily: "'Courier New', monospace",
        fontWeight: 900, letterSpacing: "0.2em",
        textTransform: "uppercase", mb: 0.5,
        textShadow: "0 0 20px #ffd740, 0 0 50px #ffd74066",
      }}>
        ◈ BOUNCE BLAST ◈
      </Typography>
      <Box sx={{ display: "flex", gap: 3, mb: 1.5 }}>
        <Typography sx={{ color: "#00e5ff", fontFamily: "inherit", fontWeight: 700, fontSize: 14, letterSpacing: 2, textShadow: "0 0 8px #00e5ff" }}>
          SCORE: {ui.score}
        </Typography>
        <Typography sx={{ color: "#ffd740", fontFamily: "inherit", fontWeight: 700, fontSize: 14, letterSpacing: 2 }}>
          LVL {ui.level}
        </Typography>
        <Typography sx={{ color: "#ff6d00", fontFamily: "inherit", fontWeight: 700, fontSize: 14 }}>
          {"●".repeat(ui.lives)}{"○".repeat(Math.max(0, 3 - ui.lives))}
        </Typography>
      </Box>

      {/* Canvas */}
      <Box sx={{
        position: "relative",
        border: "2px solid #ffd74033",
        borderRadius: 2,
        boxShadow: "0 0 40px #ffd74022, 0 0 80px #00e5ff11",
        overflow: "hidden",
        width: "min(600px, 96vw)",
        aspectRatio: `${W} / ${H}`,
      }}>
        <canvas
          ref={canvasRef}
          width={W} height={H}
          style={{ display: "block", width: "100%", height: "100%", touchAction: "none", cursor: "none" }}
          onMouseMove={e => handleMove(e.clientX)}
          onTouchStart={e => handleMove(e.touches[0].clientX)}
          onTouchMove={e => handleMove(e.touches[0].clientX)}
        />

        {/* Overlay */}
        {ui.phase !== "playing" && (
          <Box sx={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            background: "rgba(6,8,15,0.88)", backdropFilter: "blur(6px)",
          }}>
            {ui.phase === "dead" && (
              <>
                <Typography sx={{ color: "#ff1744", fontFamily: "inherit", fontWeight: 900, fontSize: { xs: 30, sm: 44 }, letterSpacing: 4, textShadow: "0 0 30px #ff1744", mb: 1 }}>
                  GAME OVER
                </Typography>
                <Typography sx={{ color: "#ffd740", fontFamily: "inherit", fontWeight: 700, fontSize: 22, mb: 3 }}>
                  Final Score: {ui.score}
                </Typography>
              </>
            )}
            {ui.phase === "win" && (
              <>
                <Typography sx={{ color: "#00e676", fontFamily: "inherit", fontWeight: 900, fontSize: { xs: 26, sm: 38 }, letterSpacing: 3, textShadow: "0 0 30px #00e676", mb: 1 }}>
                  LEVEL {ui.level} CLEAR!
                </Typography>
                <Typography sx={{ color: "#ffd740", fontFamily: "inherit", fontWeight: 700, fontSize: 20, mb: 3 }}>
                  Score: {ui.score}
                </Typography>
              </>
            )}
            {ui.phase === "idle" && (
              <>
                <Typography sx={{ color: "#ffd740", fontFamily: "inherit", fontWeight: 900, fontSize: { xs: 28, sm: 40 }, letterSpacing: 3, textShadow: "0 0 28px #ffd740", mb: 1 }}>
                  ◈ BOUNCE BLAST
                </Typography>
                <Typography sx={{ color: "#69fffa", fontFamily: "inherit", fontSize: 13, mb: 3, opacity: 0.85, textAlign: "center", px: 3, lineHeight: 2.2 }}>
                  Move paddle to bounce the ball<br/>
                  Break all bricks to advance levels<br/>
                  Ball speeds up with every hit!<br/>
                  Red bricks need 3 hits · Orange need 2
                </Typography>
              </>
            )}

            <Button
              variant="outlined"
              onClick={() => ui.phase === "win" ? nextLevel() : startGame()}
              sx={{
                borderColor: "#ffd740", color: "#ffd740",
                fontFamily: "inherit", fontWeight: 900, letterSpacing: 4, fontSize: 16,
                px: 5, py: 1.5, borderRadius: 1,
                boxShadow: "0 0 20px #ffd74055",
                "&:hover": { background: "#ffd74022", borderColor: "#ffd740", boxShadow: "0 0 32px #ffd740aa" },
              }}
            >
              {ui.phase === "win" ? "▶ NEXT LEVEL" : ui.phase === "dead" ? "▶ RETRY" : "▶ PLAY"}
            </Button>

            {/* Controls */}
            <Box sx={{ mt: 3, display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
              {[{ key: "← →", label: "Move" }, { key: "SPACE", label: "Launch" }, { key: "Mouse/Touch", label: "Also works" }].map(c => (
                <Box key={c.key} sx={{ textAlign: "center" }}>
                  <Box sx={{ border: "1px solid #ffd74055", borderRadius: 1, px: 1.5, py: 0.3, color: "#ffd740", fontFamily: "inherit", fontSize: 11, fontWeight: 700, mb: 0.3 }}>{c.key}</Box>
                  <Typography sx={{ color: "#ffffff44", fontFamily: "inherit", fontSize: 10 }}>{c.label}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>

      <Typography sx={{ color: "#ffffff18", fontFamily: "inherit", fontSize: 11, mt: 2, letterSpacing: 2 }}>
        MOUSE / TOUCH TO MOVE PADDLE · SPACE TO LAUNCH
      </Typography>
    </Box>
  );
}
"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Box, Typography, Button } from "@mui/material";

const GAME_WIDTH = 600;
const GAME_HEIGHT = 700;
const PLAYER_WIDTH = 60;
const PLAYER_HEIGHT = 30;
const BULLET_SPEED = 10;
const OBJECT_SIZE = 36;
const PLAYER_SPEED = 7;
const BASE_FALL_SPEED = 2.5;
const SPEED_INCREMENT = 0.18; // speed increase per second
const SPAWN_INTERVAL = 900; // ms between spawns

function randomX() {
  return Math.random() * (GAME_WIDTH - OBJECT_SIZE);
}

function useKeyboard() {
  const keys = useRef({});
  useEffect(() => {
    const down = (e) => { keys.current[e.key] = true; };
    const up = (e) => { keys.current[e.key] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);
  return keys;
}

let objId = 0;

export default function StarShooter() {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    player: { x: GAME_WIDTH / 2 - PLAYER_WIDTH / 2, y: GAME_HEIGHT - 60 },
    bullets: [],
    objects: [],
    score: 0,
    elapsed: 0,
    running: false,
    gameOver: false,
    lastShot: 0,
    lastSpawn: 0,
    lastTime: null,
    animId: null,
    touchX: null,
    isTouching: false,
    shootTouch: false,
  });
  const keys = useKeyboard();
  const [ui, setUi] = useState({ score: 0, gameOver: false, running: false, speed: BASE_FALL_SPEED });
  const [, forceUpdate] = useState(0);

  const spawnObject = useCallback(() => {
    const isBomb = Math.random() < 0.22; // 22% chance bomb
    objId++;
    stateRef.current.objects.push({
      id: objId,
      x: randomX(),
      y: -OBJECT_SIZE,
      type: isBomb ? "bomb" : "star",
    });
  }, []);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.player = { x: GAME_WIDTH / 2 - PLAYER_WIDTH / 2, y: GAME_HEIGHT - 60 };
    s.bullets = [];
    s.objects = [];
    s.score = 0;
    s.elapsed = 0;
    s.running = true;
    s.gameOver = false;
    s.lastShot = 0;
    s.lastSpawn = 0;
    s.lastTime = null;
    setUi({ score: 0, gameOver: false, running: true, speed: BASE_FALL_SPEED });
    forceUpdate(n => n + 1);
  }, []);

  const stopGame = useCallback((won) => {
    const s = stateRef.current;
    s.running = false;
    s.gameOver = true;
    cancelAnimationFrame(s.animId);
    setUi(u => ({ ...u, gameOver: true, running: false }));
  }, []);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    function drawPlayer(x, y) {
      // Ship body
      ctx.save();
      ctx.translate(x + PLAYER_WIDTH / 2, y + PLAYER_HEIGHT / 2);
      // Glow
      ctx.shadowColor = "#00e5ff";
      ctx.shadowBlur = 24;
      // Hull
      ctx.beginPath();
      ctx.moveTo(0, -PLAYER_HEIGHT / 2 - 6);
      ctx.lineTo(PLAYER_WIDTH / 2 - 4, PLAYER_HEIGHT / 2);
      ctx.lineTo(-PLAYER_WIDTH / 2 + 4, PLAYER_HEIGHT / 2);
      ctx.closePath();
      ctx.fillStyle = "#0a1628";
      ctx.fill();
      ctx.strokeStyle = "#00e5ff";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      // Cockpit
      ctx.beginPath();
      ctx.arc(0, -4, 7, 0, Math.PI * 2);
      ctx.fillStyle = "#00e5ff";
      ctx.fill();
      // Engine flare
      ctx.shadowColor = "#ff6d00";
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(-12, PLAYER_HEIGHT / 2);
      ctx.lineTo(12, PLAYER_HEIGHT / 2);
      ctx.lineTo(0, PLAYER_HEIGHT / 2 + 14 + Math.random() * 8);
      ctx.closePath();
      ctx.fillStyle = "#ff6d00";
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    function drawStar(x, y) {
      ctx.save();
      ctx.translate(x + OBJECT_SIZE / 2, y + OBJECT_SIZE / 2);
      ctx.shadowColor = "#ffe066";
      ctx.shadowBlur = 18;
      // 5-point star
      const spikes = 5, outerR = OBJECT_SIZE / 2 - 2, innerR = outerR * 0.42;
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (Math.PI / spikes) * i - Math.PI / 2;
        if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
        else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      ctx.closePath();
      ctx.fillStyle = "#ffe066";
      ctx.fill();
      ctx.strokeStyle = "#fff8c0";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    function drawBomb(x, y) {
      ctx.save();
      ctx.translate(x + OBJECT_SIZE / 2, y + OBJECT_SIZE / 2);
      ctx.shadowColor = "#ff1744";
      ctx.shadowBlur = 22;
      // Bomb body
      ctx.beginPath();
      ctx.arc(0, 4, OBJECT_SIZE / 2 - 4, 0, Math.PI * 2);
      ctx.fillStyle = "#1a1a2e";
      ctx.fill();
      ctx.strokeStyle = "#ff1744";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      // Skull
      ctx.fillStyle = "#ff1744";
      ctx.font = "bold 18px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("💣", 0, 4);
      // Fuse
      ctx.strokeStyle = "#ffd740";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#ffd740";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(3, -OBJECT_SIZE / 2 + 6);
      ctx.bezierCurveTo(10, -OBJECT_SIZE / 2 - 4, 18, -OBJECT_SIZE / 2, 14, -OBJECT_SIZE / 2 - 10);
      ctx.stroke();
      ctx.restore();
    }

    function drawBullet(x, y) {
      ctx.save();
      ctx.shadowColor = "#69fffa";
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.roundRect(x - 3, y, 6, 18, 3);
      ctx.fillStyle = "#69fffa";
      ctx.fill();
      ctx.restore();
    }

    function drawBackground() {
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      // Deep space bg
      ctx.fillStyle = "#050c1a";
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      // Subtle grid
      ctx.strokeStyle = "rgba(0,229,255,0.04)";
      ctx.lineWidth = 1;
      for (let gx = 0; gx < GAME_WIDTH; gx += 40) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, GAME_HEIGHT); ctx.stroke();
      }
      for (let gy = 0; gy < GAME_HEIGHT; gy += 40) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(GAME_WIDTH, gy); ctx.stroke();
      }
      // Bottom bar
      ctx.fillStyle = "rgba(0,229,255,0.07)";
      ctx.fillRect(0, GAME_HEIGHT - 70, GAME_WIDTH, 70);
    }

    function drawHUD(score, speed) {
      ctx.save();
      ctx.font = "bold 16px 'Courier New', monospace";
      ctx.fillStyle = "#00e5ff";
      ctx.shadowColor = "#00e5ff";
      ctx.shadowBlur = 8;
      ctx.fillText(`SCORE: ${score}`, 16, 28);
      ctx.fillText(`SPEED: ${speed.toFixed(1)}x`, GAME_WIDTH - 130, 28);
      ctx.restore();
    }

    function loop(ts) {
      const s = stateRef.current;
      if (!s.running) return;
      if (!s.lastTime) s.lastTime = ts;
      const dt = Math.min((ts - s.lastTime) / 1000, 0.1);
      s.lastTime = ts;
      s.elapsed += dt;

      const fallSpeed = BASE_FALL_SPEED + s.elapsed * SPEED_INCREMENT;

      // Player movement
      const left = keys.current["ArrowLeft"] || keys.current["a"] || keys.current["A"];
      const right = keys.current["ArrowRight"] || keys.current["d"] || keys.current["D"];
      if (left) s.player.x = Math.max(0, s.player.x - PLAYER_SPEED);
      if (right) s.player.x = Math.min(GAME_WIDTH - PLAYER_WIDTH, s.player.x + PLAYER_SPEED);

      // Touch move
      if (s.isTouching && s.touchX !== null) {
        const tx = s.touchX - PLAYER_WIDTH / 2;
        s.player.x += (tx - s.player.x) * 0.22;
        s.player.x = Math.max(0, Math.min(GAME_WIDTH - PLAYER_WIDTH, s.player.x));
      }

      // Shoot
      const canShoot = ts - s.lastShot > 280;
      const shooting = keys.current[" "] || keys.current["ArrowUp"] || s.shootTouch;
      if (shooting && canShoot) {
        s.bullets.push({ x: s.player.x + PLAYER_WIDTH / 2, y: s.player.y });
        s.lastShot = ts;
        s.shootTouch = false;
      }

      // Spawn
      if (ts - s.lastSpawn > SPAWN_INTERVAL) {
        spawnObject();
        s.lastSpawn = ts;
      }

      // Move bullets
      s.bullets = s.bullets.filter(b => b.y > -20);
      s.bullets.forEach(b => { b.y -= BULLET_SPEED; });

      // Move objects
      s.objects = s.objects.filter(o => o.y < GAME_HEIGHT + OBJECT_SIZE);
      s.objects.forEach(o => { o.y += fallSpeed; });

      // Collisions: bullet vs object
      const hitObjIds = new Set();
      const hitBulletIdxs = new Set();
      s.bullets.forEach((b, bi) => {
        s.objects.forEach((o) => {
          if (
            b.x > o.x && b.x < o.x + OBJECT_SIZE &&
            b.y > o.y && b.y < o.y + OBJECT_SIZE
          ) {
            if (o.type === "bomb") {
              // Shot a bomb = game over
              s.running = false;
              s.gameOver = true;
              cancelAnimationFrame(s.animId);
              setUi(u => ({ ...u, gameOver: true, running: false, score: s.score }));
              return;
            }
            hitObjIds.add(o.id);
            hitBulletIdxs.add(bi);
            s.score += 10;
          }
        });
      });
      s.objects = s.objects.filter(o => !hitObjIds.has(o.id));
      s.bullets = s.bullets.filter((_, i) => !hitBulletIdxs.has(i));

      if (!s.running) {
        drawBackground();
        s.bullets.forEach(b => drawBullet(b.x, b.y));
        s.objects.forEach(o => o.type === "star" ? drawStar(o.x, o.y) : drawBomb(o.x, o.y));
        drawPlayer(s.player.x, s.player.y);
        drawHUD(s.score, fallSpeed);
        return;
      }

      // Player hit by object
      for (const o of s.objects) {
        if (
          o.x < s.player.x + PLAYER_WIDTH &&
          o.x + OBJECT_SIZE > s.player.x &&
          o.y < s.player.y + PLAYER_HEIGHT &&
          o.y + OBJECT_SIZE > s.player.y
        ) {
          s.running = false;
          s.gameOver = true;
          cancelAnimationFrame(s.animId);
          setUi(u => ({ ...u, gameOver: true, running: false, score: s.score }));
          break;
        }
      }

      setUi(u => u.score !== s.score ? { ...u, score: s.score, speed: fallSpeed } : u);

      // Draw
      drawBackground();
      s.bullets.forEach(b => drawBullet(b.x, b.y));
      s.objects.forEach(o => o.type === "star" ? drawStar(o.x, o.y) : drawBomb(o.x, o.y));
      drawPlayer(s.player.x, s.player.y);
      drawHUD(s.score, fallSpeed);

      s.animId = requestAnimationFrame(loop);
    }

    if (stateRef.current.running) {
      stateRef.current.animId = requestAnimationFrame(loop);
    }

    return () => {
      if (stateRef.current.animId) cancelAnimationFrame(stateRef.current.animId);
    };
    // eslint-disable-next-line
  }, [ui.running]);

  // Touch controls
  const handleTouchMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    const tx = (e.touches[0].clientX - rect.left) * scaleX;
    stateRef.current.touchX = tx;
    stateRef.current.isTouching = true;
  }, []);
  const handleTouchEnd = useCallback(() => {
    stateRef.current.isTouching = false;
    stateRef.current.shootTouch = true;
  }, []);
  const handleTouchStart = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    stateRef.current.touchX = (e.touches[0].clientX - rect.left) * scaleX;
    stateRef.current.isTouching = true;
  }, []);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #020817 0%, #050c1a 60%, #0a0f1e 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Courier New', monospace",
        userSelect: "none",
        p: 2,
      }}
    >
      {/* Title */}
      <Typography
        variant="h4"
        sx={{
          color: "#00e5ff",
          fontFamily: "'Courier New', monospace",
          fontWeight: 900,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          mb: 1,
          textShadow: "0 0 24px #00e5ff, 0 0 48px #00e5ff55",
        }}
      >
        ★ Star Shooter ★
      </Typography>

      {/* Score bar */}
      <Box sx={{ display: "flex", gap: 4, mb: 1.5 }}>
        <Typography sx={{ color: "#ffe066", fontFamily: "inherit", fontWeight: 700, fontSize: 15, letterSpacing: 2, textShadow: "0 0 8px #ffe066" }}>
          SCORE: {ui.score}
        </Typography>
        <Typography sx={{ color: "#69fffa", fontFamily: "inherit", fontWeight: 700, fontSize: 15, letterSpacing: 2, textShadow: "0 0 8px #69fffa" }}>
          SPEED: {(BASE_FALL_SPEED + (ui.speed !== BASE_FALL_SPEED ? ui.speed - BASE_FALL_SPEED : 0)).toFixed(1)}x
        </Typography>
      </Box>

      {/* Canvas */}
      <Box
        sx={{
          position: "relative",
          border: "2px solid #00e5ff44",
          borderRadius: 2,
          boxShadow: "0 0 40px #00e5ff33, 0 0 80px #00e5ff11",
          overflow: "hidden",
          width: "min(600px, 96vw)",
          aspectRatio: `${GAME_WIDTH} / ${GAME_HEIGHT}`,
        }}
      >
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          style={{ display: "block", width: "100%", height: "100%", touchAction: "none" }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />

        {/* Overlay: Start / Game Over */}
        {!ui.running && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(5,12,26,0.88)",
              backdropFilter: "blur(4px)",
            }}
          >
            {ui.gameOver ? (
              <>
                <Typography sx={{ color: "#ff1744", fontFamily: "'Courier New', monospace", fontWeight: 900, fontSize: { xs: 28, sm: 40 }, letterSpacing: 4, textShadow: "0 0 30px #ff1744", mb: 1 }}>
                  GAME OVER
                </Typography>
                <Typography sx={{ color: "#ffe066", fontFamily: "inherit", fontWeight: 700, fontSize: 20, mb: 3, textShadow: "0 0 10px #ffe066" }}>
                  Score: {ui.score}
                </Typography>
              </>
            ) : (
              <>
                <Typography sx={{ color: "#ffe066", fontFamily: "inherit", fontWeight: 900, fontSize: { xs: 28, sm: 40 }, letterSpacing: 4, textShadow: "0 0 24px #ffe066", mb: 1 }}>
                  ★ STAR SHOOTER
                </Typography>
                <Typography sx={{ color: "#69fffa", fontFamily: "inherit", fontSize: 14, mb: 3, opacity: 0.8, textAlign: "center", px: 3, lineHeight: 2 }}>
                  Shoot ★ stars for points<br/>
                  Avoid 💣 bombs — shooting them ends the game!<br/>
                  Speed increases over time
                </Typography>
              </>
            )}
            <Button
              variant="outlined"
              onClick={startGame}
              sx={{
                borderColor: "#00e5ff",
                color: "#00e5ff",
                fontFamily: "'Courier New', monospace",
                fontWeight: 900,
                letterSpacing: 4,
                fontSize: 16,
                px: 5, py: 1.5,
                borderRadius: 1,
                textTransform: "uppercase",
                boxShadow: "0 0 20px #00e5ff55",
                "&:hover": {
                  background: "#00e5ff22",
                  borderColor: "#00e5ff",
                  boxShadow: "0 0 32px #00e5ff99",
                },
              }}
            >
              {ui.gameOver ? "▶ RETRY" : "▶ PLAY"}
            </Button>

            {/* Controls hint */}
            <Box sx={{ mt: 3, display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
              {[
                { key: "← →", label: "Move" },
                { key: "SPACE", label: "Shoot" },
                { key: "Touch", label: "Mobile" },
              ].map(c => (
                <Box key={c.key} sx={{ textAlign: "center" }}>
                  <Box sx={{ border: "1px solid #00e5ff55", borderRadius: 1, px: 1.5, py: 0.3, color: "#00e5ff", fontFamily: "inherit", fontSize: 12, fontWeight: 700, mb: 0.3 }}>{c.key}</Box>
                  <Typography sx={{ color: "#ffffff55", fontFamily: "inherit", fontSize: 11 }}>{c.label}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>

      <Typography sx={{ color: "#ffffff22", fontFamily: "'Courier New', monospace", fontSize: 11, mt: 2, letterSpacing: 2 }}>
        USE ARROW KEYS / SPACE TO PLAY · TOUCH ON MOBILE
      </Typography>
    </Box>
  );
}
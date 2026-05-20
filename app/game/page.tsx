"use client";

import {
  Box,
  Typography,
  Button,
  Container,
  Chip,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import Grid from "@mui/material/Grid";
import Link from "next/link";
import { useChillMode } from "@/app/providers";
import { useEffect, useState } from "react";

const games = [
  {
    title: "Quiz Arena",
    description: "Test your knowledge across various categories!",
    link: "/game/quiz",
    emoji: "🧠",
    tag: "Knowledge",
    color: "#6366f1",
    glow: "rgba(99, 102, 241, 0.4)",
  },
  {
    title: "Flip The Cards",
    description: "Train your memory with our fun card matching game!",
    link: "/game/flip-cards",
    emoji: "🃏",
    tag: "Memory",
    color: "#ec4899",
    glow: "rgba(236, 72, 153, 0.4)",
  },
  {
    title: "Route Puzzle",
    description: "Guide the explorer home through challenging mazes!",
    link: "/game/route-puzzle",
    emoji: "🗺️",
    tag: "Puzzle",
    color: "#10b981",
    glow: "rgba(16, 185, 129, 0.4)",
  },
  {
    title: "Snake",
    description: "Classic snake — eat, grow, survive as long as you can!",
    link: "/game/snake",
    emoji: "🐍",
    tag: "Arcade",
    color: "#f59e0b",
    glow: "rgba(245, 158, 11, 0.4)",
  },
  {
    title: "Tetris",
    description: "Stack the falling blocks and clear the lines!",
    link: "/game/tetris",
    emoji: "🟦",
    tag: "Classic",
    color: "#3b82f6",
    glow: "rgba(59, 130, 246, 0.4)",
  },
  {
    title: "Bounce",
    description: "Keep the ball in play and beat the highest score!",
    link: "/game/bounce",
    emoji: "⚽",
    tag: "Reflex",
    color: "#ef4444",
    glow: "rgba(239, 68, 68, 0.4)",
  },
  {
    title: "Platformer",
    description: "Jump, run, and dodge your way to the finish line!",
    link: "/game/platformer",
    emoji: "🎮",
    tag: "Action",
    color: "#8b5cf6",
    glow: "rgba(139, 92, 246, 0.4)",
  },
  {
    title: "Star Shooter",
    description: "Blast through waves of enemies in deep space!",
    link: "/game/star-shooter",
    emoji: "🚀",
    tag: "Shooter",
    color: "#06b6d4",
    glow: "rgba(6, 182, 212, 0.4)",
  },
];

export default function GameHomePage() {
  const { isChillMode, setIsChillMode } = useChillMode();
  const theme = useTheme();
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    setIsChillMode(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box
      sx={{
        bgcolor: theme.palette.background.default,
        minHeight: "100vh",
        pb: 10,
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Syne', sans-serif",
        backgroundImage: `
          radial-gradient(ellipse 80% 50% at 50% -20%, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 60%),
          radial-gradient(ellipse 40% 30% at 80% 80%, ${alpha(theme.palette.error.main, 0.05)} 0%, transparent 50%)
        `,
      }}
    >
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&family=Syne:wght@400;600;700;800;900&display=swap');
        
        body {
          background: ${theme.palette.background.default};
          color: ${theme.palette.text.primary};
          font-family: 'Syne', sans-serif;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* Background grid lines */}
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          backgroundImage: `
            linear-gradient(${alpha(theme.palette.common.white, 0.03)} 1px, transparent 1px),
            linear-gradient(90deg, ${alpha(theme.palette.common.white, 0.03)} 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* Radial ambient blobs */}
      <Box sx={{
        position: "fixed", top: "10%", left: "15%", width: 400, height: 400,
        borderRadius: "50%", bgcolor: alpha(theme.palette.primary.main, 0.08), filter: "blur(80px)", zIndex: 0, pointerEvents: "none"
      }} />
      <Box sx={{
        position: "fixed", bottom: "15%", right: "10%", width: 350, height: 350,
        borderRadius: "50%", bgcolor: alpha(theme.palette.error.main, 0.07), filter: "blur(80px)", zIndex: 0, pointerEvents: "none"
      }} />
      {/* Hero */}
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          pt: { xs: 8, md: 12 },
          pb: 8,
          textAlign: "center",
        }}
      >
        <Container maxWidth="md">
          {/* Pill badge */}
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              px: 2.5,
              py: 0.8,
              borderRadius: "999px",
              border: "1px solid rgba(239,68,68,0.4)",
              bgcolor: alpha(theme.palette.error.main, 0.08),
              mb: 4,
            }}
          >
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: theme.palette.error.main, boxShadow: `0 0 8px ${theme.palette.error.main}`, animation: "pulse 2s infinite" }} />
            <Typography sx={{ fontSize: "0.8rem", color: "#f87171", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              8 Games Available
            </Typography>
          </Box>

          <Typography
            variant="h1"
            sx={{
              fontWeight: 900,
              fontSize: { xs: "3rem", md: "5rem" },
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              mb: 3,
              background: `linear-gradient(135deg, ${theme.palette.text.primary} 30%, ${theme.palette.error.light} 70%, ${theme.palette.error.main} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Chillout
            <br />
            Zone
          </Typography>

          <Typography
            sx={{
              color: theme.palette.text.secondary,
              fontSize: { xs: "1rem", md: "1.2rem" },
              fontWeight: 400,
              maxWidth: 520,
              mx: "auto",
              lineHeight: 1.7,
              letterSpacing: "0.01em",
            }}
          >
            Level up your break time. Eight hand-picked games, zero install needed.
          </Typography>
        </Container>
      </Box>

      {/* Game Cards Grid */}
      <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1 }}>
        <Grid container spacing={3} justifyContent="center">
          {games.map((game, index) => (
            <Grid xs={12} sm={6} md={4} lg={3} key={index}>
              <Box
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
                sx={{
                  position: "relative",
                  height: "100%",
                  borderRadius: "20px",
                  border: "1px solid",
                  borderColor: hovered === index ? game.color : alpha(theme.palette.common.white, 0.07),
                  bgcolor: hovered === index ? alpha(theme.palette.common.white, 0.04) : alpha(theme.palette.common.white, 0.02),
                  backdropFilter: "blur(12px)",
                  transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                  transform: hovered === index ? "translateY(-8px) scale(1.01)" : "none",
                  boxShadow: hovered === index ? `0 24px 60px ${game.glow}, 0 0 0 1px ${game.color}20` : "none",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                }}
              >
                {/* Top glow bar */}
                <Box sx={{
                  position: "absolute",
                  top: 0, left: 0, right: 0,
                  height: 2,
                  background: hovered === index ? `linear-gradient(90deg, transparent, ${game.color}, transparent)` : "transparent",
                  transition: "all 0.35s ease",
                }} />

                {/* Emoji area */}
                <Box
                  sx={{
                    height: 160,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    background: hovered === index
                      ? `radial-gradient(circle at center, ${game.glow} 0%, transparent 70%)`
                      : "transparent",
                    transition: "background 0.35s ease",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "5rem",
                      lineHeight: 1,
                      filter: hovered === index ? `drop-shadow(0 0 20px ${game.color})` : "none",
                      transform: hovered === index ? "scale(1.15)" : "scale(1)",
                      transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    {game.emoji}
                  </Typography>
                </Box>

                {/* Content */}
                <Box sx={{ p: 3, pt: 2, flexGrow: 1, display: "flex", flexDirection: "column" }}>
                  <Chip
                    label={game.tag}
                    size="small"
                    sx={{
                      alignSelf: "flex-start",
                      mb: 1.5,
                      bgcolor: `${game.color}18`,
                      color: game.color,
                      border: `1px solid ${game.color}40`,
                      fontWeight: 700,
                      fontSize: "0.65rem",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      height: 22,
                    }}
                  />

                  <Typography
                    sx={{
                      fontWeight: 800,
                      fontSize: "1.25rem",
                      color: "#ffffff",
                      mb: 0.8,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {game.title}
                  </Typography>

                  <Typography
                    sx={{
                      color: alpha(theme.palette.common.white, 0.5),
                      fontSize: "0.82rem",
                      lineHeight: 1.6,
                      mb: 3,
                      flexGrow: 1,
                    }}
                  >
                    {game.description}
                  </Typography>

                  <Button
                    component={Link}
                    href={game.link}
                    fullWidth
                    sx={{
                      py: 1.2,
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      letterSpacing: "0.05em",
                      textTransform: "none",
                      borderRadius: "12px",
                      color: hovered === index ? "#fff" : "rgba(255,255,255,0.6)",
                      background: hovered === index
                        ? `linear-gradient(135deg, ${game.color}, ${alpha(game.color, 0.8)})`
                        : alpha(theme.palette.common.white, 0.05),
                      border: `1px solid ${hovered === index ? game.color : alpha(theme.palette.common.white, 0.1)}`,
                      transition: "all 0.3s ease",
                      "&:hover": {
                        background: `linear-gradient(135deg, ${game.color}, ${game.color}cc)`,
                        color: "#fff",
                        boxShadow: `0 8px 20px ${game.glow}`,
                      },
                    }}
                  >
                    Play Now →
                  </Button>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Footer note */}
      <Box sx={{ textAlign: "center", mt: 8, position: "relative", zIndex: 1 }}>
        <Typography sx={{ color: "rgba(255,255,255,0.15)", fontSize: "0.8rem", letterSpacing: "0.08em" }}>
          {isChillMode ? "CHILLOUT ZONE" : "ARCADE"} · {games.length} GAMES
        </Typography>
      </Box>
    </Box>
  );
}
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme as useNextTheme } from "next-themes";
import { useChillMode } from "@/app/providers";

// ─── Types ────────────────────────────────────────────────────────────────────

type Difficulty = "easy" | "medium" | "hard";
type Screen = "start" | "game" | "win";

interface CardData {
  id: number;
  pairId: number;
  emoji: string;
  label: string;
  flipped: boolean;
  matched: boolean;
}

interface Config {
  pairs: number;
  cols: number;
  label: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CONFIGS: Record<Difficulty, Config> = {
  easy:   { pairs: 6,  cols: 4, label: "4 × 3" },
  medium: { pairs: 10, cols: 5, label: "5 × 4" },
  hard:   { pairs: 15, cols: 6, label: "6 × 5" },
};

const EMOJI_POOL: [string, string][] = [
  ["🌿", "Plant"],   ["🔥", "Fire"],    ["⚡", "Storm"],   ["🌊", "Wave"],
  ["🍀", "Clover"],  ["🌙", "Moon"],    ["⭐", "Star"],    ["🎯", "Target"],
  ["🎵", "Music"],   ["🎮", "Game"],    ["🏆", "Trophy"],  ["💎", "Gem"],
  ["🚀", "Rocket"],  ["🦋", "Butterfly"],["🌸", "Blossom"],["🍊", "Orange"],
  ["🐬", "Dolphin"], ["🦊", "Fox"],     ["🐧", "Penguin"], ["🦁", "Lion"],
  ["🌵", "Cactus"],  ["🍄", "Shroom"],  ["🐙", "Octopus"], ["🦄", "Unicorn"],
  ["🐸", "Frog"],    ["🍕", "Pizza"],   ["🎸", "Guitar"],  ["🌈", "Rainbow"],
  ["🏔", "Peak"],    ["🧩", "Puzzle"],
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fmtTime(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// ─── StarIcon ─────────────────────────────────────────────────────────────────

function StarIcon({ filled, size = 28 }: { filled: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill={filled ? "#f59e0b" : "var(--col-border)"}
        stroke={filled ? "#f59e0b" : "var(--col-border)"}
        strokeWidth="1"
      />
    </svg>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function MemoryCard({
  card,
  onClick,
  shake,
}: {
  card: CardData;
  onClick: () => void;
  shake: boolean;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        aspectRatio: "3/4",
        perspective: "600px",
        cursor: card.flipped || card.matched ? "default" : "pointer",
        animation: shake ? "shake 0.35s ease" : undefined,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
          transition: "transform 0.42s cubic-bezier(0.4,0,0.2,1)",
          transform: card.flipped || card.matched ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Back face */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 12,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            background: "var(--col-card-back)",
            border: "1.5px solid var(--col-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 6,
            transition: "border-color 0.2s, background 0.2s",
          }}
          className="card-back-face"
        >
          {/* dot grid pattern */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 5,
              opacity: 0.3,
              width: "52%",
            }}
          >
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                style={{
                  aspectRatio: "1",
                  borderRadius: "50%",
                  background: "var(--col-primary)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Front face */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 12,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: card.matched ? "var(--col-matched-bg)" : "var(--col-card-front)",
            border: `2px solid ${card.matched ? "#10b981" : "var(--col-primary)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 6,
            transition: "background 0.3s, border-color 0.3s",
            animation: card.matched ? "pop 0.3s ease" : undefined,
          }}
        >
          <span style={{ fontSize: "clamp(20px, 4vw, 32px)", lineHeight: 1 }}>{card.emoji}</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "var(--col-primary)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {card.label}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── StartScreen ──────────────────────────────────────────────────────────────

function StartScreen({
  diff,
  setDiff,
  onStart,
}: {
  diff: Difficulty;
  setDiff: (d: Difficulty) => void;
  onStart: () => void;
}) {
  const cfg = CONFIGS[diff];
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 580,
        padding: "3rem 2rem",
        animation: "fadeUp 0.4s ease",
      }}
    >
      {/* Logo */}
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: "50%",
          border: "2.5px solid var(--col-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "1.75rem",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: -7,
            borderRadius: "50%",
            border: "1.5px solid var(--col-primary)",
            opacity: 0.25,
          }}
        />
        <svg width={44} height={44} viewBox="0 0 44 44" fill="none">
          <rect x="3" y="3" width="17" height="21" rx="3" stroke="var(--col-primary)" strokeWidth="2" />
          <rect x="24" y="3" width="17" height="21" rx="3" fill="var(--col-primary)" fillOpacity="0.2" stroke="var(--col-primary)" strokeWidth="2" />
          <rect x="3" y="28" width="17" height="13" rx="3" fill="var(--col-primary)" fillOpacity="0.45" stroke="var(--col-primary)" strokeWidth="2" />
          <rect x="24" y="28" width="17" height="13" rx="3" stroke="var(--col-primary)" strokeWidth="2" />
        </svg>
      </div>

      <h1
        style={{
          fontSize: "clamp(26px,5vw,36px)",
          fontWeight: 800,
          letterSpacing: "-0.5px",
          color: "var(--col-text-primary)",
          marginBottom: 8,
          textAlign: "center",
        }}
      >
        Flip &amp; Match
      </h1>
      <p
        style={{
          fontSize: 15,
          color: "var(--col-text-secondary)",
          marginBottom: "2.5rem",
          textAlign: "center",
          maxWidth: 300,
          lineHeight: 1.65,
        }}
      >
        Find all matching pairs. Test your memory and beat your best score!
      </p>

      {/* Difficulty */}
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--col-text-secondary)",
          letterSpacing: "0.09em",
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        Difficulty
      </p>
      <div style={{ display: "flex", gap: 10, marginBottom: "2.5rem" }}>
        {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
          <button
            key={d}
            onClick={() => setDiff(d)}
            style={{
              padding: "9px 22px",
              borderRadius: 22,
              border: `1.5px solid ${diff === d ? "var(--col-primary)" : "var(--col-border)"}`,
              background: diff === d ? "var(--col-primary)" : "var(--col-surface)",
              color: diff === d ? "#fff" : "var(--col-text-secondary)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.18s",
              textTransform: "capitalize",
            }}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Start button */}
      <button
        onClick={onStart}
        style={{
          padding: "15px 56px",
          borderRadius: 30,
          border: "none",
          background: "var(--col-primary)",
          color: "#fff",
          fontSize: 16,
          fontWeight: 700,
          cursor: "pointer",
          letterSpacing: "0.02em",
          transition: "all 0.18s",
          boxShadow: "0 4px 20px var(--col-primary-glow)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 28px var(--col-primary-glow)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px var(--col-primary-glow)";
        }}
      >
        Start Game
      </button>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 36, marginTop: "2.5rem" }}>
        {[
          { val: cfg.pairs,   lbl: "pairs"  },
          { val: cfg.label,   lbl: "grid"   },
          { val: "∞",         lbl: "time"   },
        ].map(({ val, lbl }) => (
          <div key={lbl} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: "var(--col-primary)" }}>{val}</span>
            <span style={{ fontSize: 11, color: "var(--col-text-tertiary)", fontWeight: 500 }}>{lbl}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── HUD ──────────────────────────────────────────────────────────────────────

function HUD({
  moves,
  elapsed,
  matched,
  total,
  onRestart,
  onHome,
}: {
  moves: number;
  elapsed: number;
  matched: number;
  total: number;
  onRestart: () => void;
  onHome: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 20px",
        borderBottom: "0.5px solid var(--col-border)",
        background: "var(--col-bg)",
      }}
    >
      <HudCell val={String(moves)} lbl="moves" />

      {/* progress + controls center */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <IconBtn onClick={onRestart} title="Restart">
            <svg width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
            </svg>
          </IconBtn>
          <IconBtn onClick={onHome} title="Home">
            <svg width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </IconBtn>
        </div>
        {/* progress bar */}
        <div style={{ width: 80, height: 4, borderRadius: 4, background: "var(--col-border)", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              borderRadius: 4,
              background: "var(--col-primary)",
              width: `${Math.round((matched / total) * 100)}%`,
              transition: "width 0.4s ease",
            }}
          />
        </div>
        <span style={{ fontSize: 10, color: "var(--col-text-tertiary)", fontWeight: 500 }}>
          {matched}/{total} matched
        </span>
      </div>

      <HudCell val={fmtTime(elapsed)} lbl="time" />
    </div>
  );
}

function HudCell({ val, lbl }: { val: string; lbl: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 60 }}>
      <span style={{ fontSize: 22, fontWeight: 800, color: "var(--col-primary)", lineHeight: 1 }}>{val}</span>
      <span style={{ fontSize: 10, color: "var(--col-text-tertiary)", fontWeight: 500, marginTop: 2 }}>{lbl}</span>
    </div>
  );
}

function IconBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 34,
        height: 34,
        borderRadius: "50%",
        border: `1.5px solid ${hover ? "var(--col-primary)" : "var(--col-border)"}`,
        background: hover ? "var(--col-primary-subtle)" : "var(--col-surface)",
        color: hover ? "var(--col-primary)" : "var(--col-text-secondary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.18s",
      }}
    >
      {children}
    </button>
  );
}

// ─── GameScreen ───────────────────────────────────────────────────────────────

function GameScreen({
  cards,
  cols,
  shakeIds,
  onCardClick,
}: {
  cards: CardData[];
  cols: number;
  shakeIds: number[];
  onCardClick: (id: number) => void;
}) {
  return (
    <div
      style={{
        padding: "1.5rem 1rem 2rem",
        animation: "fadeUp 0.35s ease",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: "clamp(8px,1.5vw,12px)",
          maxWidth: 680,
          margin: "0 auto",
        }}
      >
        {cards.map((card) => (
          <MemoryCard
            key={card.id}
            card={card}
            onClick={() => onCardClick(card.id)}
            shake={shakeIds.includes(card.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── WinScreen ────────────────────────────────────────────────────────────────

function WinScreen({
  moves,
  elapsed,
  pairs,
  onPlayAgain,
  onMenu,
}: {
  moves: number;
  elapsed: number;
  pairs: number;
  onPlayAgain: () => void;
  onMenu: () => void;
}) {
  const acc = Math.min(Math.round((pairs / moves) * 100), 100);
  const stars = acc >= 85 ? 3 : acc >= 60 ? 2 : 1;
  const TITLES = ["Keep practicing!", "Well done!", "Flawless memory!"];
  const SUBS   = ["Try again to improve your score", "Your memory is sharp", "No wasted moves — perfect run!"];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 520,
        padding: "3rem 2rem",
        animation: "fadeUp 0.4s ease",
      }}
    >
      {/* check ring */}
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: "50%",
          background: "rgba(16,185,129,0.10)",
          border: "2.5px solid #10b981",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "1.25rem",
        }}
      >
        <svg width={40} height={40} fill="none" stroke="#10b981" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 40 40">
          <polyline points="8 20 16 28 32 12" />
        </svg>
      </div>

      {/* Stars */}
      <div style={{ display: "flex", gap: 6, marginBottom: "1rem" }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{ animation: i < stars ? `starPop 0.4s ${i * 0.12}s ease both` : undefined }}
          >
            <StarIcon filled={i < stars} />
          </div>
        ))}
      </div>

      <h2
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: "var(--col-text-primary)",
          marginBottom: 6,
          textAlign: "center",
        }}
      >
        {TITLES[stars - 1]}
      </h2>
      <p
        style={{
          fontSize: 14,
          color: "var(--col-text-secondary)",
          marginBottom: "2rem",
          textAlign: "center",
        }}
      >
        {SUBS[stars - 1]}
      </p>

      {/* Stats */}
      <div style={{ display: "flex", gap: 16, marginBottom: "2.5rem" }}>
        {[
          { val: String(moves),     lbl: "moves"    },
          { val: fmtTime(elapsed),  lbl: "time"     },
          { val: `${acc}%`,         lbl: "accuracy" },
        ].map(({ val, lbl }) => (
          <div
            key={lbl}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              background: "var(--col-surface)",
              border: "0.5px solid var(--col-border)",
              borderRadius: 12,
              padding: "14px 20px",
              minWidth: 80,
            }}
          >
            <span style={{ fontSize: 22, fontWeight: 800, color: "var(--col-primary)" }}>{val}</span>
            <span style={{ fontSize: 11, color: "var(--col-text-tertiary)", marginTop: 2 }}>{lbl}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={onPlayAgain}
          style={{
            padding: "13px 36px",
            borderRadius: 28,
            border: "none",
            background: "var(--col-primary)",
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.18s",
            boxShadow: "0 4px 16px var(--col-primary-glow)",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)")}
        >
          Play again
        </button>
        <button
          onClick={onMenu}
          style={{
            padding: "13px 28px",
            borderRadius: 28,
            border: "1.5px solid var(--col-border)",
            background: "transparent",
            color: "var(--col-text-secondary)",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.18s",
          }}
          onMouseEnter={(e) => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.borderColor = "var(--col-primary)";
            b.style.color = "var(--col-primary)";
          }}
          onMouseLeave={(e) => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.borderColor = "var(--col-border)";
            b.style.color = "var(--col-text-secondary)";
          }}
        >
          Main menu
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FlipCardsPage() {
  const [screen, setScreen]   = useState<Screen>("start");
  const [diff, setDiff]       = useState<Difficulty>("easy");
  const [cards, setCards]     = useState<CardData[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState(0);
  const [moves, setMoves]     = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [lock, setLock]       = useState(false);
  const [shakeIds, setShakeIds] = useState<number[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { isChillMode } = useChillMode();
  const { theme: nextTheme } = useNextTheme();
  const isDark = nextTheme === "dark";

  const primary     = isChillMode ? "#ef4444" : (isDark ? "#3b82f6" : "#10b981");
  const primaryDark = isChillMode ? "#dc2626" : (isDark ? "#2563eb" : "#059669");
  const bg          = isChillMode ? (isDark ? "#000000" : "#fdfdfd") : (isDark ? "#020617" : "#fdfdfd");
  const paper       = isChillMode ? (isDark ? "#000000" : "#ffffff") : (isDark ? "#0f172a" : "#ffffff");
  const surface     = isDark ? "#1e293b" : "#f8fafc";
  const border      = isDark ? "rgba(148,163,184,0.18)" : "rgba(0,0,0,0.10)";
  const textPri     = isDark ? "#f1f5f9" : "#0f172a";
  const textSec     = isDark ? "#94a3b8" : "#64748b";
  const textTer     = isDark ? "#475569" : "#94a3b8";
  const primaryGlow = isChillMode ? "rgba(239, 68, 68, 0.22)" : (isDark ? "rgba(59,130,246,0.25)" : "rgba(16,185,129,0.22)");
  const primarySub  = isChillMode ? "rgba(239, 68, 68, 0.10)" : (isDark ? "rgba(59,130,246,0.12)" : "rgba(16,185,129,0.10)");
  const cardBack    = isDark ? "#1e293b" : "#f1f5f9";
  const matchedBg   = isDark ? "rgba(16,185,129,0.12)" : "rgba(16,185,129,0.08)";

  const cfg = CONFIGS[diff];

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
  }, [stopTimer]);

  useEffect(() => () => stopTimer(), [stopTimer]);

  const startGame = useCallback(() => {
    stopTimer();
    const c = CONFIGS[diff];
    const pool = shuffle(EMOJI_POOL).slice(0, c.pairs);
    const deck: CardData[] = shuffle(
      [...pool, ...pool].map(([emoji, label], i) => ({
        id: i,
        pairId: pool.findIndex(([e]) => e === emoji),
        emoji, label,
        flipped: false,
        matched: false,
      }))
    );
    setCards(deck);
    setFlipped([]);
    setMatched(0);
    setMoves(0);
    setElapsed(0);
    setLock(false);
    setShakeIds([]);
    setScreen("game");
    startTimer();
  }, [diff, stopTimer, startTimer]);

  const handleCardClick = useCallback((id: number) => {
    if (lock) return;
    setCards((prev) => {
      const card = prev.find((c) => c.id === id);
      if (!card || card.flipped || card.matched) return prev;
      return prev.map((c) => c.id === id ? { ...c, flipped: true } : c);
    });
    setFlipped((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      if (next.length === 2) {
        setLock(true);
        setMoves((m) => m + 1);
        setTimeout(() => {
          setCards((prevCards) => {
            const [aid, bid] = next;
            const a = prevCards.find((c) => c.id === aid)!;
            const b = prevCards.find((c) => c.id === bid)!;
            if (a.emoji === b.emoji) {
              const updated = prevCards.map((c) =>
                c.id === aid || c.id === bid ? { ...c, matched: true, flipped: true } : c
              );
              const newMatched = updated.filter((c) => c.matched).length / 2;
              setMatched(newMatched);
              if (newMatched === CONFIGS[diff].pairs) {
                stopTimer();
                setTimeout(() => setScreen("win"), 500);
              }
              setFlipped([]);
              setLock(false);
              return updated;
            } else {
              setShakeIds([aid, bid]);
              setTimeout(() => {
                setCards((pc) => pc.map((c) =>
                  c.id === aid || c.id === bid ? { ...c, flipped: false } : c
                ));
                setShakeIds([]);
                setFlipped([]);
                setLock(false);
              }, 900);
              return prevCards;
            }
          });
        }, 500);
        return next;
      }
      return next;
    });
  }, [lock, diff, stopTimer]);

  const goHome = useCallback(() => {
    stopTimer();
    setScreen("start");
  }, [stopTimer]);

  // ─── CSS vars injected as inline style on root ──────────────────────────────
  const cssVars = {
    "--col-primary":       primary,
    "--col-primary-dark":  primaryDark,
    "--col-primary-glow":  primaryGlow,
    "--col-primary-subtle":primarySub,
    "--col-bg":            bg,
    "--col-paper":         paper,
    "--col-surface":       surface,
    "--col-border":        border,
    "--col-text-primary":  textPri,
    "--col-text-secondary":textSec,
    "--col-text-tertiary": textTer,
    "--col-card-back":     cardBack,
    "--col-card-front":    paper,
    "--col-matched-bg":    matchedBg,
  } as React.CSSProperties;

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          25%      { transform: translateX(-6px); }
          75%      { transform: translateX(6px); }
        }
        @keyframes pop {
          0%   { transform: rotateY(180deg) scale(1); }
          50%  { transform: rotateY(180deg) scale(1.08); }
          100% { transform: rotateY(180deg) scale(1); }
        }
        @keyframes starPop {
          0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
          60%  { transform: scale(1.25) rotate(5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }
        .card-back-face:hover {
          border-color: var(--col-primary) !important;
        }
        * { box-sizing: border-box; }
      `}</style>

      <div
        style={{
          ...cssVars,
          minHeight: "100vh",
          background: "var(--col-bg)",
          fontFamily: "'Geist', 'Geist Sans', system-ui, sans-serif",
        }}
      >
        {/* HUD — only shown during game */}
        {screen === "game" && (
          <HUD
            moves={moves}
            elapsed={elapsed}
            matched={matched}
            total={cfg.pairs}
            onRestart={startGame}
            onHome={goHome}
          />
        )}

        {/* Screens */}
        {screen === "start" && (
          <StartScreen diff={diff} setDiff={setDiff} onStart={startGame} />
        )}
        {screen === "game" && (
          <GameScreen
            cards={cards}
            cols={cfg.cols}
            shakeIds={shakeIds}
            onCardClick={handleCardClick}
          />
        )}
        {screen === "win" && (
          <WinScreen
            moves={moves}
            elapsed={elapsed}
            pairs={cfg.pairs}
            onPlayAgain={startGame}
            onMenu={goHome}
          />
        )}
      </div>
    </>
  );
}
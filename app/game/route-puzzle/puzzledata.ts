// ─── Route Puzzle Database ────────────────────────────────────────────────────
// Each puzzle is a grid-based maze.
// Grid cell types:
//   'W' = wall/blocked
//   'P' = path (walkable)
//   'S' = start (player spawns here)
//   'E' = end/home
//   'K' = key collectible (optional, must collect before reaching end)
//   'T' = trap (player bounces back)
//
// correctPath = array of [row, col] steps that form the ONLY valid route
// (used for hint system)

export type CellType = "W" | "P" | "S" | "E" | "K" | "T";

export interface Puzzle {
  id: number;
  name: string;
  grid: CellType[][];
  hint: string;
  timeLimit: number; // seconds
}

export interface DifficultyConfig {
  id: "easy" | "medium" | "hard";
  label: string;
  emoji: string;
  description: string;
  color: string;
  puzzles: Puzzle[];
}

// ─── EASY PUZZLES (7×7 grids, wider paths, fewer dead-ends) ──────────────────

const EASY_PUZZLES: Puzzle[] = [
  {
    id: 1,
    name: "Morning Walk",
    timeLimit: 90,
    hint: "Go right, then all the way down, then right to home.",
    grid: [
      ["W","W","W","W","W","W","W"],
      ["W","S","P","P","W","W","W"],
      ["W","W","W","P","W","W","W"],
      ["W","W","W","P","P","P","W"],
      ["W","W","W","W","W","P","W"],
      ["W","W","W","W","W","P","W"],
      ["W","W","W","W","W","E","W"],
    ],
  },
  {
    id: 2,
    name: "Park Path",
    timeLimit: 90,
    hint: "Head down first, then navigate right across the middle.",
    grid: [
      ["W","W","W","W","W","W","W"],
      ["W","S","W","W","W","W","W"],
      ["W","P","W","W","W","W","W"],
      ["W","P","P","P","P","W","W"],
      ["W","W","W","W","P","W","W"],
      ["W","W","W","W","P","P","W"],
      ["W","W","W","W","W","E","W"],
    ],
  },
  {
    id: 3,
    name: "Sunny Street",
    timeLimit: 90,
    hint: "Zigzag: right, down, right, down.",
    grid: [
      ["W","W","W","W","W","W","W"],
      ["W","S","P","W","W","W","W"],
      ["W","W","P","W","W","W","W"],
      ["W","W","P","P","P","W","W"],
      ["W","W","W","W","P","W","W"],
      ["W","W","P","P","P","W","W"],
      ["W","W","P","W","W","W","W"],
      ["W","W","P","P","E","W","W"],
    ],
  },
  {
    id: 4,
    name: "Garden Gate",
    timeLimit: 90,
    hint: "Go straight down then cut across right at the bottom.",
    grid: [
      ["W","W","W","W","W","W","W"],
      ["W","S","W","W","W","W","W"],
      ["W","P","W","T","W","W","W"],
      ["W","P","W","W","W","W","W"],
      ["W","P","P","P","P","P","W"],
      ["W","W","W","W","W","P","W"],
      ["W","W","W","W","W","E","W"],
    ],
  },
  {
    id: 5,
    name: "Simple Square",
    timeLimit: 90,
    hint: "Follow the L-shape: all the way right, then all the way down.",
    grid: [
      ["W","W","W","W","W","W","W"],
      ["W","S","P","P","P","P","W"],
      ["W","W","W","W","W","P","W"],
      ["W","W","W","W","W","P","W"],
      ["W","W","W","W","W","P","W"],
      ["W","W","W","W","W","P","W"],
      ["W","W","W","W","W","E","W"],
    ],
  },
  {
    id: 6,
    name: "Two Turns",
    timeLimit: 90,
    hint: "Down, across, then down again to the exit.",
    grid: [
      ["W","W","W","W","W","W","W"],
      ["W","S","W","W","W","W","W"],
      ["W","P","W","W","W","W","W"],
      ["W","P","P","P","W","W","W"],
      ["W","W","W","P","W","W","W"],
      ["W","W","W","P","P","P","W"],
      ["W","W","W","W","W","E","W"],
    ],
  },
  {
    id: 7,
    name: "Shortcut Town",
    timeLimit: 90,
    hint: "Avoid the trap in the middle, go around the bottom.",
    grid: [
      ["W","W","W","W","W","W","W"],
      ["W","S","P","P","W","W","W"],
      ["W","W","W","P","W","W","W"],
      ["W","W","W","P","T","W","W"],
      ["W","W","W","P","W","W","W"],
      ["W","W","W","P","P","P","W"],
      ["W","W","W","W","W","E","W"],
    ],
  },
  {
    id: 8,
    name: "Winding Way",
    timeLimit: 90,
    hint: "Follow the snake pattern — it curves three times.",
    grid: [
      ["W","W","W","W","W","W","W"],
      ["W","S","P","P","P","W","W"],
      ["W","W","W","W","P","W","W"],
      ["W","W","P","P","P","W","W"],
      ["W","W","P","W","W","W","W"],
      ["W","W","P","P","P","P","W"],
      ["W","W","W","W","W","E","W"],
    ],
  },
];

// ─── MEDIUM PUZZLES (9×9 grids, narrower paths, keys to collect) ─────────────

const MEDIUM_PUZZLES: Puzzle[] = [
  {
    id: 1,
    name: "Key Junction",
    timeLimit: 120,
    hint: "Collect the key before heading home — it's on the upper-right path.",
    grid: [
      ["W","W","W","W","W","W","W","W","W"],
      ["W","S","P","P","W","W","W","W","W"],
      ["W","W","W","P","W","W","W","W","W"],
      ["W","W","W","P","P","K","W","W","W"],
      ["W","W","W","W","W","P","W","W","W"],
      ["W","W","T","W","W","P","W","W","W"],
      ["W","W","W","W","W","P","P","P","W"],
      ["W","W","W","W","W","W","W","P","W"],
      ["W","W","W","W","W","W","W","E","W"],
    ],
  },
  {
    id: 2,
    name: "City Blocks",
    timeLimit: 120,
    hint: "Navigate around the city blocks — the path wraps around the walls.",
    grid: [
      ["W","W","W","W","W","W","W","W","W"],
      ["W","S","P","W","W","W","W","W","W"],
      ["W","W","P","W","P","P","P","W","W"],
      ["W","W","P","P","P","W","P","W","W"],
      ["W","W","W","W","W","W","P","W","W"],
      ["W","W","W","T","W","W","P","W","W"],
      ["W","W","W","W","W","P","P","W","W"],
      ["W","W","W","W","W","P","W","W","W"],
      ["W","W","W","W","W","E","W","W","W"],
    ],
  },
  {
    id: 3,
    name: "Double Back",
    timeLimit: 120,
    hint: "You'll need to backtrack once — the dead-end is a trap.",
    grid: [
      ["W","W","W","W","W","W","W","W","W"],
      ["W","S","P","P","P","W","W","W","W"],
      ["W","W","W","W","P","W","W","W","W"],
      ["W","W","W","W","P","P","P","P","W"],
      ["W","W","W","W","W","W","W","P","W"],
      ["W","W","T","T","W","W","W","P","W"],
      ["W","W","W","W","W","W","W","P","W"],
      ["W","W","W","P","P","P","P","P","W"],
      ["W","W","W","E","W","W","W","W","W"],
    ],
  },
  {
    id: 4,
    name: "Market Square",
    timeLimit: 120,
    hint: "Go around the market center — traps block the shortcut through the middle.",
    grid: [
      ["W","W","W","W","W","W","W","W","W"],
      ["W","S","W","W","W","W","W","W","W"],
      ["W","P","P","P","P","P","W","W","W"],
      ["W","W","W","W","W","P","W","W","W"],
      ["W","W","T","T","T","P","W","W","W"],
      ["W","W","W","W","W","P","W","W","W"],
      ["W","W","W","W","W","P","P","P","W"],
      ["W","W","W","W","W","W","W","P","W"],
      ["W","W","W","W","W","W","W","E","W"],
    ],
  },
  {
    id: 5,
    name: "Bridge Route",
    timeLimit: 120,
    hint: "There are two paths — the right one avoids both traps.",
    grid: [
      ["W","W","W","W","W","W","W","W","W"],
      ["W","S","P","P","W","W","W","W","W"],
      ["W","W","W","P","W","W","W","W","W"],
      ["W","W","W","P","W","T","W","W","W"],
      ["W","W","W","P","P","P","P","W","W"],
      ["W","W","W","W","W","W","P","W","W"],
      ["W","W","T","W","W","W","P","W","W"],
      ["W","W","W","W","P","P","P","W","W"],
      ["W","W","W","W","E","W","W","W","W"],
    ],
  },
  {
    id: 6,
    name: "Long Way Home",
    timeLimit: 120,
    hint: "Collect the key first — you can't enter the house without it!",
    grid: [
      ["W","W","W","W","W","W","W","W","W"],
      ["W","S","P","W","K","P","W","W","W"],
      ["W","W","P","W","P","W","W","W","W"],
      ["W","W","P","P","P","W","W","W","W"],
      ["W","W","W","W","W","W","W","W","W"],
      ["W","W","W","P","P","P","P","W","W"],
      ["W","W","W","P","W","W","P","W","W"],
      ["W","W","W","P","W","W","P","W","W"],
      ["W","W","W","E","W","W","W","W","W"],
    ],
  },
  {
    id: 7,
    name: "River Crossing",
    timeLimit: 120,
    hint: "Cross at the only safe point — traps block the other crossings.",
    grid: [
      ["W","W","W","W","W","W","W","W","W"],
      ["W","S","P","P","W","W","W","W","W"],
      ["W","W","W","P","W","W","W","W","W"],
      ["W","T","T","P","T","T","T","W","W"],
      ["W","W","W","P","W","W","W","W","W"],
      ["W","W","W","P","P","P","W","W","W"],
      ["W","W","W","W","W","P","W","W","W"],
      ["W","W","W","W","W","P","P","P","W"],
      ["W","W","W","W","W","W","W","E","W"],
    ],
  },
  {
    id: 8,
    name: "Spiral Path",
    timeLimit: 120,
    hint: "Follow the outer ring clockwise — it's the only complete path.",
    grid: [
      ["W","W","W","W","W","W","W","W","W"],
      ["W","S","P","P","P","P","P","W","W"],
      ["W","W","W","W","W","W","P","W","W"],
      ["W","W","P","P","P","W","P","W","W"],
      ["W","W","P","W","P","W","P","W","W"],
      ["W","W","P","W","P","P","P","W","W"],
      ["W","W","P","W","W","W","W","W","W"],
      ["W","W","P","P","P","P","E","W","W"],
      ["W","W","W","W","W","W","W","W","W"],
    ],
  },
];

// ─── HARD PUZZLES (11×11 grids, multiple dead-ends, keys, traps) ──────────────

const HARD_PUZZLES: Puzzle[] = [
  {
    id: 1,
    name: "Labyrinth",
    timeLimit: 180,
    hint: "Get the key first (top right), then spiral down through the center.",
    grid: [
      ["W","W","W","W","W","W","W","W","W","W","W"],
      ["W","S","P","P","P","P","P","P","K","W","W"],
      ["W","W","W","W","W","W","W","W","P","W","W"],
      ["W","W","P","P","P","P","P","W","P","W","W"],
      ["W","W","P","W","W","W","P","W","P","W","W"],
      ["W","W","P","W","T","W","P","P","P","W","W"],
      ["W","W","P","W","W","W","W","W","W","W","W"],
      ["W","W","P","P","P","P","P","P","W","W","W"],
      ["W","W","W","W","W","W","W","P","W","W","W"],
      ["W","W","T","W","W","W","W","P","P","P","W"],
      ["W","W","W","W","W","W","W","W","W","E","W"],
    ],
  },
  {
    id: 2,
    name: "Ghost Town",
    timeLimit: 180,
    hint: "Traps lurk at every corner — hug the walls and move carefully.",
    grid: [
      ["W","W","W","W","W","W","W","W","W","W","W"],
      ["W","S","P","W","W","W","W","W","W","W","W"],
      ["W","W","P","W","P","P","P","P","W","W","W"],
      ["W","W","P","P","P","W","W","P","W","W","W"],
      ["W","W","W","W","T","W","W","P","W","W","W"],
      ["W","W","W","W","W","W","W","P","W","W","W"],
      ["W","W","P","P","P","P","P","P","W","W","W"],
      ["W","W","P","W","W","W","T","W","W","W","W"],
      ["W","W","P","W","W","W","W","W","W","W","W"],
      ["W","W","P","P","P","P","P","P","E","W","W"],
      ["W","W","W","W","W","W","W","W","W","W","W"],
    ],
  },
  {
    id: 3,
    name: "Key Master",
    timeLimit: 180,
    hint: "Two keys hidden — collect both before the final corridor opens.",
    grid: [
      ["W","W","W","W","W","W","W","W","W","W","W"],
      ["W","S","P","P","K","W","W","W","W","W","W"],
      ["W","W","W","W","P","W","W","W","W","W","W"],
      ["W","W","W","W","P","P","P","P","W","W","W"],
      ["W","W","W","W","W","W","W","P","W","W","W"],
      ["W","K","P","P","P","P","P","P","W","W","W"],
      ["W","P","W","W","W","W","W","W","W","W","W"],
      ["W","P","P","P","W","W","W","W","W","W","W"],
      ["W","W","W","P","W","T","T","W","W","W","W"],
      ["W","W","W","P","P","P","W","P","P","E","W"],
      ["W","W","W","W","W","W","W","W","W","W","W"],
    ],
  },
  {
    id: 4,
    name: "Crossroads",
    timeLimit: 180,
    hint: "Only one crossing is safe — test each junction methodically.",
    grid: [
      ["W","W","W","W","W","W","W","W","W","W","W"],
      ["W","S","P","P","P","W","W","W","W","W","W"],
      ["W","W","W","W","P","W","T","W","W","W","W"],
      ["W","W","W","W","P","P","P","P","P","W","W"],
      ["W","W","T","W","W","W","W","W","P","W","W"],
      ["W","W","W","W","W","W","W","W","P","W","W"],
      ["W","W","W","W","W","T","W","W","P","W","W"],
      ["W","W","P","P","P","P","P","P","P","W","W"],
      ["W","W","P","W","W","W","W","W","W","W","W"],
      ["W","W","P","P","P","P","P","P","E","W","W"],
      ["W","W","W","W","W","W","W","W","W","W","W"],
    ],
  },
  {
    id: 5,
    name: "The Maze",
    timeLimit: 180,
    hint: "This is a true maze — go right first, not down. The bottom path is a dead-end.",
    grid: [
      ["W","W","W","W","W","W","W","W","W","W","W"],
      ["W","S","P","P","W","P","P","P","P","W","W"],
      ["W","W","W","P","W","P","W","W","P","W","W"],
      ["W","W","W","P","P","P","W","W","P","W","W"],
      ["W","W","W","W","W","W","W","W","P","W","W"],
      ["W","T","T","W","W","W","T","W","P","W","W"],
      ["W","W","W","W","W","W","W","W","P","W","W"],
      ["W","W","W","W","P","P","P","P","P","W","W"],
      ["W","W","W","W","P","W","W","W","W","W","W"],
      ["W","W","W","W","P","P","P","K","P","E","W"],
      ["W","W","W","W","W","W","W","W","W","W","W"],
    ],
  },
  {
    id: 6,
    name: "Trap Gauntlet",
    timeLimit: 180,
    hint: "Navigate a corridor lined with traps — time your moves carefully.",
    grid: [
      ["W","W","W","W","W","W","W","W","W","W","W"],
      ["W","S","P","W","W","W","W","W","W","W","W"],
      ["W","W","P","P","P","P","P","P","P","W","W"],
      ["W","W","W","W","T","W","T","W","P","W","W"],
      ["W","W","W","W","W","W","W","W","P","W","W"],
      ["W","W","P","P","P","P","P","W","P","W","W"],
      ["W","W","P","W","T","W","P","W","P","W","W"],
      ["W","W","P","W","W","W","P","P","P","W","W"],
      ["W","W","P","W","W","W","W","W","W","W","W"],
      ["W","W","P","P","P","P","P","K","E","W","W"],
      ["W","W","W","W","W","W","W","W","W","W","W"],
    ],
  },
  {
    id: 7,
    name: "Night Maze",
    timeLimit: 180,
    hint: "The home is in the bottom right — chart a path that avoids all 4 traps.",
    grid: [
      ["W","W","W","W","W","W","W","W","W","W","W"],
      ["W","S","P","P","P","P","W","W","W","W","W"],
      ["W","W","W","W","W","P","W","W","W","W","W"],
      ["W","W","T","W","W","P","P","P","P","W","W"],
      ["W","W","W","W","W","W","W","W","P","W","W"],
      ["W","W","W","W","T","W","W","W","P","W","W"],
      ["W","W","W","W","W","W","W","W","P","W","W"],
      ["W","W","W","W","P","P","P","P","P","W","W"],
      ["W","W","W","W","P","W","T","W","W","W","W"],
      ["W","W","W","W","P","P","W","P","P","E","W"],
      ["W","W","W","W","W","W","W","W","W","W","W"],
    ],
  },
  {
    id: 8,
    name: "Ultimate Route",
    timeLimit: 180,
    hint: "Three corridors — only the middle leads all the way to the exit.",
    grid: [
      ["W","W","W","W","W","W","W","W","W","W","W"],
      ["W","S","W","P","W","P","W","W","W","W","W"],
      ["W","P","W","P","W","P","W","W","W","W","W"],
      ["W","P","W","P","W","P","W","W","W","W","W"],
      ["W","P","T","P","T","P","W","W","W","W","W"],
      ["W","P","W","P","W","P","W","W","W","W","W"],
      ["W","P","W","P","W","W","W","W","W","W","W"],
      ["W","P","P","P","W","W","T","W","W","W","W"],
      ["W","W","W","P","P","P","P","P","P","W","W"],
      ["W","W","W","W","W","W","W","W","E","W","W"],
      ["W","W","W","W","W","W","W","W","W","W","W"],
    ],
  },
];

// ─── Exported config ──────────────────────────────────────────────────────────

export const DIFFICULTY_CONFIG: DifficultyConfig[] = [
  {
    id: "easy",
    label: "Easy",
    emoji: "🌿",
    description: "Gentle paths · 7×7 grid · 90 seconds",
    color: "#10b981",
    puzzles: EASY_PUZZLES,
  },
  {
    id: "medium",
    label: "Medium",
    emoji: "🔑",
    description: "Collect keys · 9×9 grid · 120 seconds",
    color: "#f59e0b",
    puzzles: MEDIUM_PUZZLES,
  },
  {
    id: "hard",
    label: "Hard",
    emoji: "💀",
    description: "Many traps · 11×11 grid · 180 seconds",
    color: "#ef4444",
    puzzles: HARD_PUZZLES,
  },
];

/** Simulates async DB fetch */
export async function fetchPuzzle(
  difficulty: "easy" | "medium" | "hard",
  excludeIds: number[] = []
): Promise<Puzzle> {
  await new Promise((r) => setTimeout(r, 600 + Math.random() * 300));
  const cfg = DIFFICULTY_CONFIG.find((d) => d.id === difficulty)!;
  const available = cfg.puzzles.filter((p) => !excludeIds.includes(p.id));
  const pool = available.length > 0 ? available : cfg.puzzles;
  return pool[Math.floor(Math.random() * pool.length)];
}
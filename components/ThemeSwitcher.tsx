// //themeswitcher

// "use client";

// import { useColorScheme } from "@mui/material/styles";
// import { useEffect, useState } from "react";
// import { IconButton } from "@mui/material";
// import { Brightness4 as MoonIcon, Brightness7 as SunIcon } from "@mui/icons-material";

// export function ThemeSwitcher() {
//   const [mounted, setMounted] = useState(false);
//   const { mode, setMode, systemMode } = useColorScheme();

//   // Wait until mounted on client to avoid hydration mismatch
//   useEffect(() => {
//     setMounted(true);
//     console.log("[ThemeSwitcher] Mounted. Current mode:", mode, "systemMode:", systemMode);
//   }, []);
  
//   // Determine the active theme (light or dark) for display and toggle logic
//   // We want to be explicit: if mode isn't ready, we don't assume a theme for the toggle logic yet
//   const activeTheme = mounted ? (mode === 'system' ? systemMode : mode) : undefined;
//   const displayTheme = activeTheme || 'light';

//   useEffect(() => {
//     if (mounted) {
//       console.log("[ThemeSwitcher] State update - mode:", mode, "systemMode:", systemMode, "activeTheme:", activeTheme, "displayTheme:", displayTheme);
//     }
//   }, [mode, systemMode, activeTheme, displayTheme, mounted]);

//   if (!mounted) return null;

//   return (
//     <IconButton
//       onClick={() => {
//         const nextTheme = displayTheme === "light" ? "dark" : "light";
//         console.log("[ThemeSwitcher] Toggle clicked. Current displayTheme:", displayTheme, "Calling setMode with:", nextTheme);
//         if (typeof setMode === 'function') {
//           setMode(nextTheme);
//         } else {
//           console.error("[ThemeSwitcher] setMode is NOT a function. Ensure your app is wrapped in <CssVarsProvider>.");
//         }
//       }}
//       aria-label="Toggle theme"
//     >
//       {displayTheme === "light" ? <MoonIcon /> : <SunIcon />}
//     </IconButton>
//   );
// }

// ThemeSwitcher.tsx — use next-themes instead of useColorScheme
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { IconButton } from "@mui/material";
import { Brightness4 as MoonIcon, Brightness7 as SunIcon } from "@mui/icons-material";

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return (
    <IconButton
      onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
      aria-label="Toggle theme"
    >
      {resolvedTheme === "light" ? <MoonIcon /> : <SunIcon />}
    </IconButton>
  );
}
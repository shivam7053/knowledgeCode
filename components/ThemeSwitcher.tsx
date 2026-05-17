"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { IconButton } from "@mui/material";
import { Brightness4 as MoonIcon, Brightness7 as SunIcon } from "@mui/icons-material";

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Wait until mounted on client to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <IconButton
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      aria-label="Toggle theme"
    >
      {theme === "light" ? <MoonIcon /> : <SunIcon />}
    </IconButton>
  );
}
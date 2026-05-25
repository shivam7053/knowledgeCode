"use client";
import { Box, CircularProgress } from "@mui/material";
import { useTheme } from "next-themes";
import { useChillMode } from "@/app/providers";
import { useState, useEffect } from "react";

export default function GlobalLoading() {
  const { resolvedTheme } = useTheme();
  const { isChillMode } = useChillMode();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const themeSuffix = (mounted && resolvedTheme === "dark") ? "dark" : "light";
  const typePrefix = (mounted && isChillMode) ? "chill" : "learning";
  const logoPath = `/logos/${typePrefix}-${themeSuffix}.png`;

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        zIndex: 9999,
      }}
    >
      <Box sx={{ position: "relative", display: "inline-flex" }}>
        <CircularProgress size={100} thickness={2} color="primary" />
        {mounted && (
          <Box
            component="img"
            src={logoPath}
            alt="Loading..."
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              height: 40,
              width: "auto",
            }}
          />
        )}
      </Box>
    </Box>
  );
}
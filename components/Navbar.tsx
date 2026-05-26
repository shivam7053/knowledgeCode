"use client";
import {
  AppBar, Toolbar, Container, Box, Link as MuiLink, Typography,
  Switch, FormControlLabel, Stack, IconButton, Badge
} from "@mui/material";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  School as LearningIcon,
  SportsEsports as ChilloutIcon,
  Notifications as NotificationsIcon
} from "@mui/icons-material";
import { useRouter, usePathname } from "next/navigation";
import { useChillMode } from "@/app/providers";
import ThemeLogo from "./ThemeLogo";
import dynamic from "next/dynamic";
import { BASE } from "@/lib/testsApi";

// Lazy load ThemeSwitcher (named export) and Overlay (default export)
const ThemeSwitcher = dynamic(() => import("./ThemeSwitcher").then(mod => mod.ThemeSwitcher), { 
  ssr: false 
});
const ModeTransitionOverlay = dynamic(() => import("./ModeTransitionOverlay"), { 
  ssr: false 
});

export default function AppNavbar() {
  const { isChillMode, setIsChillMode } = useChillMode();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkMode = mounted && resolvedTheme === "dark";
  const activeChillMode = mounted && isChillMode;

  const [notifCount, setNotifCount] = useState(0);

  const chillBg = isDarkMode ? "#000000" : "#ef4444";
  const chillText = "#ffffff";

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(`${BASE}/notifications`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (Array.isArray(data)) {
          setNotifCount(data.length);
        }
      } catch (error) {
        // Silent fail for notifications to avoid console spam when server is down
        setNotifCount(0);
      }
    };

    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 60000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        borderBottom: 1,
        borderColor: activeChillMode ? "transparent" : "divider",
        bgcolor: activeChillMode ? chillBg : "background.paper",
        color: activeChillMode ? chillText : "text.primary",
        transition: "all 0.4s ease-in-out",
      }}
    >
      <Container maxWidth="xl">
        <ModeTransitionOverlay />
        <Toolbar disableGutters>

          {/* Logo */}
          <Box
            component={Link}
            href="/"
            sx={{ display: "flex", alignItems: "center", flexGrow: { xs: 1, md: 0 }, mr: 2, textDecoration: "none" }}
          >
            <ThemeLogo isChillMode={activeChillMode} />
            <Typography
              variant="h6"
              component="span"
              sx={{
                fontWeight: 900,
                ml: 1,
                display: { xs: 'none', sm: 'block' },
                color: (activeChillMode || isDarkMode) ? "inherit" : "primary.main",
              }}
            >
              {activeChillMode ? "GameCode" : "KnowledgeCode"}
            </Typography>
          </Box>

          {/* Centered Mode Switcher */}
          <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1, justifyContent: "center" }}>
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: "center",
                bgcolor: activeChillMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.05)",
                px: 2, py: 0.5, borderRadius: 10,
              }}
            >
              <LearningIcon fontSize="small" sx={{ opacity: activeChillMode ? 0.4 : 1 }} />
              <FormControlLabel
                control={
                  <Switch
                    checked={activeChillMode}
                    onChange={(e) => {
                      const newChillMode = e.target.checked;
                      setIsChillMode(newChillMode);
                      router.push(newChillMode ? "/game" : "/");
                    }}
                    color="default"
                  />
                }
                label={activeChillMode ? "Chillout" : "Learning"}
                sx={{
                  m: 0,
                  "& .MuiFormControlLabel-label": {
                    fontWeight: "bold", fontSize: "0.75rem", color: "inherit",
                  },
                }}
              />
              <ChilloutIcon fontSize="small" sx={{ opacity: activeChillMode ? 1 : 0.4 }} />
            </Stack>
          </Box>

          {/* Nav Links */}
          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 3, mx: 4 }}>
            {!activeChillMode ? (
              <>
                <MuiLink component={Link} href="/courses" color="inherit" underline={pathname === "/courses" ? "always" : "none"} sx={{ fontWeight: "medium" }}>Courses</MuiLink>
                <MuiLink component={Link} href="/compiler" color="inherit" underline={pathname === "/compiler" ? "always" : "none"} sx={{ fontWeight: "medium" }}>Online Compiler</MuiLink>
                <MuiLink component={Link} href="/blogs" color="inherit" underline={pathname === "/blogs" ? "always" : "none"} sx={{ fontWeight: "medium" }}>Blog</MuiLink>
                <MuiLink component={Link} href="/tools" color="inherit" underline={pathname === "/tools" ? "always" : "none"} sx={{ fontWeight: "medium" }}>Tools</MuiLink>
              </>
            ) : (
              <MuiLink component={Link} href="/game/quiz" color="inherit" underline={pathname === "/game/quiz" ? "always" : "none"} sx={{ fontWeight: "medium", "&:hover": { color: "white" } }}>
                Quiz Arena
              </MuiLink>
            )}
          </Box>

          {/* Right: Theme + Notifications */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexGrow: 0 }}>
            <ThemeSwitcher />
            <IconButton
              component={Link}
              href="/notifications"
              color="inherit"
              sx={{ transition: "transform 0.2s", "&:hover": { transform: "scale(1.1)" } }}
            >
              <Badge badgeContent={notifCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Box>

        </Toolbar>
      </Container>
    </AppBar>
  );
}
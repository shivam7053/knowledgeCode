"use client";
import {
  AppBar, Toolbar, Container, Box, Link as MuiLink, Typography,
  Switch, FormControlLabel, Stack, IconButton, Badge
} from "@mui/material";
import Link from "next/link";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  School as LearningIcon,
  SportsEsports as ChilloutIcon,
  Notifications as NotificationsIcon
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useChillMode } from "@/app/providers";
import ThemeLogo from "./ThemeLogo";
import ModeTransitionOverlay from "./ModeTransitionOverlay";

export default function AppNavbar() {
  const { isChillMode, setIsChillMode } = useChillMode();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const router = useRouter();

  const [notifCount, setNotifCount] = useState(0);

  const chillBg = isDarkMode ? "#000000" : "#ef4444";
  const chillText = "#ffffff";

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch("http://localhost:8000/notifications");
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setNotifCount(data.length);
      } catch (error) {
        console.error("Error fetching notifications:", error);
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
        borderColor: isChillMode ? "transparent" : "divider",
        bgcolor: isChillMode ? chillBg : "background.paper",
        color: isChillMode ? chillText : "text.primary",
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
            sx={{ display: "flex", alignItems: "center", flexGrow: { xs: 1, md: 0 }, mr: 2 }}
          >
            <ThemeLogo isChillMode={isChillMode} />
            <Typography
              variant="h6"
              component="span"
              sx={{
                fontWeight: 900,
                ml: 1,
                display: { xs: 'none', sm: 'block' },
                color: (isChillMode || isDarkMode) ? "inherit" : "primary.main",
              }}
            >
              {isChillMode ? "GameCode" : "KnowledgeCode"}
            </Typography>
          </Box>

          {/* Centered Mode Switcher */}
          <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1, justifyContent: "center" }}>
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: "center",
                bgcolor: isChillMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.05)",
                px: 2, py: 0.5, borderRadius: 10,
              }}
            >
              <LearningIcon fontSize="small" sx={{ opacity: isChillMode ? 0.4 : 1 }} />
              <FormControlLabel
                control={
                  <Switch
                    checked={isChillMode}
                    onChange={(e) => {
                      const newChillMode = e.target.checked;
                      setIsChillMode(newChillMode);
                      router.push(newChillMode ? "/game" : "/");
                    }}
                    color="default"
                  />
                }
                label={isChillMode ? "Chillout" : "Learning"}
                sx={{
                  m: 0,
                  "& .MuiFormControlLabel-label": {
                    fontWeight: "bold", fontSize: "0.75rem", color: "inherit",
                  },
                }}
              />
              <ChilloutIcon fontSize="small" sx={{ opacity: isChillMode ? 1 : 0.4 }} />
            </Stack>
          </Box>

          {/* Nav Links */}
          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 3, mx: 4 }}>
            {!isChillMode ? (
              <>
                <MuiLink component={Link} href="/courses" color="inherit" underline="none" sx={{ fontWeight: "medium" }}>Courses</MuiLink>
                <MuiLink component={Link} href="/compiler" color="inherit" underline="none" sx={{ fontWeight: "medium" }}>Online Compiler</MuiLink>
                <MuiLink component={Link} href="/blogs" color="inherit" underline="none" sx={{ fontWeight: "medium" }}>Blog</MuiLink>
                <MuiLink component={Link} href="/tools" color="inherit" underline="none" sx={{ fontWeight: "medium" }}>Tools</MuiLink>
              </>
            ) : (
              <MuiLink component={Link} href="/game/quiz" color="inherit" underline="none" sx={{ fontWeight: "medium", "&:hover": { color: "white" } }}>
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
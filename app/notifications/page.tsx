"use client";
import React, { useEffect, useState, useRef } from "react";
import { Container, Typography, Box, Paper, Stack, alpha, useTheme, Divider, IconButton, Chip } from "@mui/material";
import { Notifications as NotificationsIcon, Info as InfoIcon, Warning as WarningIcon, Delete as DeleteIcon, School as SchoolIcon, SportsEsports as GameIcon, AutoAwesome as FeatureIcon } from "@mui/icons-material";
import { useChillMode } from "@/app/providers";

interface Notification {
  _id: string;
  title: string;
  message: string;
  category: string;
  timestamp: string;
}

export default function NotificationsPage() {
  const theme = useTheme();
  const { isChillMode } = useChillMode();
  const primary = isChillMode ? theme.palette.error.main : theme.palette.primary.main;
  const isDark = theme.palette.mode === "dark";
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  const PYTHON_API_BASE = "http://localhost:8000";

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!heroRef.current) return;
      const { clientX, clientY } = event;
      const { offsetWidth, offsetHeight } = heroRef.current;
      const { left, top } = heroRef.current.getBoundingClientRect();

      const centerX = left + offsetWidth / 2;
      const centerY = top + offsetHeight / 2;

      const diffX = clientX - centerX;
      const diffY = clientY - centerY;

      const sensitivity = 0.05;
      setRotation({ x: -diffY * sensitivity, y: diffX * sensitivity });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    fetch(`${PYTHON_API_BASE}/notifications`)
      .then(res => res.json())
      .then(data => setNotifications(data))
      .catch(err => console.error("Error fetching notifications:", err));
  }, []);

  const getRelativeTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const cubeColor = isDark ? alpha(primary, 0.2) : alpha(primary, 0.1);
  const cubeGradient = isDark
    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.8)}, ${alpha(theme.palette.secondary.dark, 0.8)})`
    : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.8)}, ${alpha(theme.palette.secondary.light, 0.8)})`;

  // Mapping categories to their specific Admin-defined themes
  const getCategoryTheme = (category: string) => {
    if (category === "course") return { color: "#0F6E56", icon: <SchoolIcon /> };
    if (category === "game") return { color: "#854F0B", icon: <GameIcon /> };
    if (category === "feature") return { color: "#534AB7", icon: <FeatureIcon /> };
    return { color: primary, icon: <InfoIcon /> };
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: 10 }}>
      {/* Hero Section with Moving Cube */}
      <Box ref={heroRef} sx={{
        position: 'relative',
        background: isDark ? 'transparent' : alpha(theme.palette.background.paper, 0.4),
        borderBottom: `1px solid ${alpha(primary, 0.12)}`,
        pt: { xs: 8, md: 12 }, pb: { xs: 6, md: 10 },
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        minHeight: '50vh'
      }}>
        {/* Rotating 3D Cube Background */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 320,
            height: 320,
            transform: `translate(-50%, -50%) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
            background: cubeGradient,
            borderRadius: '24%',
            boxShadow: `0 0 120px 60px ${cubeColor}`,
            transition: 'transform 0.1s ease-out',
            zIndex: 0,
            perspective: '1000px',
            transformStyle: 'preserve-3d',
            pointerEvents: 'none',
            '&::before, &::after': {
              content: '""',
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              borderRadius: '24%',
              background: `linear-gradient(to bottom right, ${alpha(theme.palette.background.paper, 0.1)}, transparent)`,
              transform: 'translateZ(-60px)',
              opacity: 0.7,
            },
            '&::after': {
              transform: 'translateZ(60px)',
              background: `linear-gradient(to top left, ${alpha(theme.palette.background.paper, 0.1)}, transparent)`,
            }
          }}
        />

        <Container maxWidth="lg">
          <Stack sx={{ alignItems: "center", textAlign: "center", position: 'relative', zIndex: 1 }}>
            <Chip label="System Updates" size="small" sx={{ mb: 2, fontWeight: 700, fontSize: 11, background: alpha(primary, 0.12), color: primary, border: `1px solid ${alpha(primary, 0.25)}` }} />
            <Typography variant="h2" fontWeight={800} sx={{
              fontSize: { xs: "2.5rem", md: "4.5rem" }, letterSpacing: "-0.04em",
              background: isChillMode
                ? `linear-gradient(135deg, #ef4444, ${isDark ? "#fff" : "#000"})`
                : `linear-gradient(135deg, ${primary}, ${theme.palette.text.primary})`,
              backgroundClip: "text", WebkitBackgroundClip: "text", color: "transparent", mb: 1,
            }}>
              Notifications
            </Typography>
            <Typography variant="h6" color="text.secondary" fontWeight={400} sx={{ maxWidth: 640, lineHeight: 1.6 }}>
              Stay updated with the latest news and system alerts.
            </Typography>

            <Stack direction="row" sx={{ gap: 4, mt: 5, flexWrap: "wrap", justifyContent: "center" }}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h4" fontWeight={800} color="primary">{notifications.length}</Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Alerts</Typography>
              </Box>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h4" fontWeight={800} color="primary">Local</Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Privacy</Typography>
              </Box>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ mt: 6 }}>

        <Stack spacing={2}>
          {notifications.length > 0 ? (
            notifications.map((notif) => {
              const { color, icon } = getCategoryTheme(notif.category);
              return (
                <Paper
                key={notif._id}
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: 3,
                  transition: "all 0.2s",
                  "&:hover": { borderColor: color, bgcolor: alpha(color, 0.01) }
                }}
              >
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Box sx={{ mt: 0.5, color: color }}>
                    {icon}
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: isDark ? alpha(color, 1.2) : "text.primary" }}>
                      {notif.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      {notif.message}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">{getRelativeTime(notif.timestamp)}</Typography>
                  </Box>
                  <IconButton size="small" color="inherit" sx={{ opacity: 0.5 }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Paper>
              );
            })
          ) : (
            <Paper sx={{ p: 8, textAlign: "center", borderRadius: 4, bgcolor: alpha(primary, 0.02), border: "1px dashed" + alpha(primary, 0.2) }}>
              <NotificationsIcon sx={{ fontSize: 64, color: alpha(primary, 0.1), mb: 2 }} />
              <Typography color="text.secondary">All caught up! No new notifications.</Typography>
            </Paper>
          )}
        </Stack>

        <Divider sx={{ my: 6, opacity: 0.1 }} />
        
        <Box sx={{ p: 3, borderRadius: 3, bgcolor: alpha(theme.palette.info.main, 0.05), border: `1px solid ${alpha(theme.palette.info.main, 0.1)}` }}>
          <Typography variant="subtitle2" fontWeight={700} color="info.main" gutterBottom>
            Privacy Note
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Notifications are processed locally within your instance. No tracking data is sent to external servers.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

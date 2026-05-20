"use client";
import React from "react";
import { Container, Typography, Box, Paper, Stack, alpha, useTheme, Divider, IconButton } from "@mui/material";
import { Notifications as NotificationsIcon, Info as InfoIcon, Warning as WarningIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { useChillMode } from "@/app/providers";

const MOCK_NOTIFICATIONS = [
  { id: 1, title: "New AI Model Available", message: "We've updated DocForge with the latest DistilBART weights for faster summarization.", type: "info", date: "2 hours ago" },
  { id: 2, title: "System Maintenance", message: "Occasional downtime may occur tonight at 2 AM EST for local server optimizations.", type: "warning", date: "1 day ago" },
];

export default function NotificationsPage() {
  const theme = useTheme();
  const { isChillMode } = useChillMode();
  const primary = isChillMode ? theme.palette.error.main : theme.palette.primary.main;

  return (
    <Box sx={{ minHeight: "100vh", py: 8, bgcolor: "background.default" }}>
      <Container maxWidth="md">
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(primary, 0.1), color: primary }}>
            <NotificationsIcon fontSize="large" />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={800}>Notifications</Typography>
            <Typography variant="body2" color="text.secondary">Stay updated with the latest news and system alerts.</Typography>
          </Box>
        </Stack>

        <Stack spacing={2}>
          {MOCK_NOTIFICATIONS.length > 0 ? (
            MOCK_NOTIFICATIONS.map((notif) => (
              <Paper
                key={notif.id}
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: 3,
                  transition: "all 0.2s",
                  "&:hover": { borderColor: primary, bgcolor: alpha(primary, 0.02) }
                }}
              >
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Box sx={{ mt: 0.5, color: notif.type === "warning" ? "warning.main" : primary }}>
                    {notif.type === "warning" ? <WarningIcon /> : <InfoIcon />}
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700}>{notif.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      {notif.message}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">{notif.date}</Typography>
                  </Box>
                  <IconButton size="small" color="inherit" sx={{ opacity: 0.5 }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Paper>
            ))
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

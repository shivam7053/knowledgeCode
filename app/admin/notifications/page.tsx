"use client";
import React, { useState } from "react";
import { Container, Typography, Box, Paper, Stack, TextField, Button, MenuItem, alpha, useTheme, Alert } from "@mui/material";
import { Campaign as CampaignIcon, Send as SendIcon } from "@mui/icons-material";

export default function AdminNotificationsPage() {
  const theme = useTheme();
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "info"
  });

  const handleSend = () => {
    // Mocking send functionality
    setSent(true);
    setForm({ title: "", message: "", type: "info" });
    setTimeout(() => setSent(false), 5000);
  };

  return (
    <Box sx={{ minHeight: "100vh", py: 8, bgcolor: "background.default" }}>
      <Container maxWidth="sm">
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: "primary.main" }}>
            <CampaignIcon fontSize="large" />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={800}>Broadcaster</Typography>
            <Typography variant="body2" color="text.secondary">Admin Console — Send platform-wide notifications.</Typography>
          </Box>
        </Stack>

        {sent && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
            Notification broadcasted successfully to all users.
          </Alert>
        )}

        <Paper variant="outlined" sx={{ p: 4, borderRadius: 4 }}>
          <Stack spacing={3}>
            <TextField
              label="Notification Title"
              fullWidth
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. New Feature Release"
            />
            
            <TextField
              select
              label="Alert Type"
              fullWidth
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <MenuItem value="info">Information (Blue)</MenuItem>
              <MenuItem value="warning">Warning (Yellow)</MenuItem>
              <MenuItem value="success">Success (Green)</MenuItem>
              <MenuItem value="error">Critical (Red)</MenuItem>
            </TextField>

            <TextField
              label="Message Content"
              multiline
              rows={4}
              fullWidth
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Describe the update in detail..."
            />

            <Button
              variant="contained"
              size="large"
              startIcon={<SendIcon />}
              onClick={handleSend}
              disabled={!form.title || !form.message}
              sx={{ 
                py: 1.5, 
                borderRadius: 3, 
                fontWeight: 700,
                boxShadow: theme.shadows[4]
              }}
            >
              Broadcast Notification
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

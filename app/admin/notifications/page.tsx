"use client";
import React, { useState } from "react";
import {
  Container, Typography, Box, Paper, Stack, TextField,
  Button, alpha, useTheme, Fade, Chip
} from "@mui/material";
import {
  Send as SendIcon,
  School as SchoolIcon,
  SportsEsports as GameIcon,
  AutoAwesome as FeatureIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";

// ── Theme config per notification type ───────────────────────────────────────
const NOTIFICATION_TYPES = {
  course: {
    key: "course",
    label: "New Course",
    tagline: "Announce a learning path or curriculum",
    Icon: SchoolIcon,
    accentColor: "#0F6E56",       // teal-600
    bgColor: "#E1F5EE",           // teal-50
    borderColor: "#5DCAA5",       // teal-200
    chipBg: "#9FE1CB",            // teal-100
    chipText: "#085041",          // teal-800
    badgeLabel: "📚 Course Launch",
    titlePlaceholder: "e.g. Introduction to Machine Learning",
    messagePlaceholder: "Describe the course objectives, what learners will gain, prerequisites, and where to enroll...",
    gradient: "linear-gradient(135deg, #E1F5EE 0%, #9FE1CB 100%)",
  },
  game: {
    key: "game",
    label: "New Game",
    tagline: "Drop a new challenge or game mode",
    Icon: GameIcon,
    accentColor: "#854F0B",       // amber-800
    bgColor: "#FAEEDA",           // amber-50
    borderColor: "#FAC775",       // amber-100
    chipBg: "#EF9F27",            // amber-400
    chipText: "#412402",          // amber-900
    badgeLabel: "🎮 Game Drop",
    titlePlaceholder: "e.g. Speed Coding Challenge — Season 3",
    messagePlaceholder: "Describe the game rules, rewards, leaderboard details, and how to join...",
    gradient: "linear-gradient(135deg, #FAEEDA 0%, #FAC775 100%)",
  },
  feature: {
    key: "feature",
    label: "New Feature",
    tagline: "Highlight a product update or capability",
    Icon: FeatureIcon,
    accentColor: "#534AB7",       // purple-600
    bgColor: "#EEEDFE",           // purple-50
    borderColor: "#AFA9EC",       // purple-200
    chipBg: "#CECBF6",            // purple-100
    chipText: "#26215C",          // purple-900
    badgeLabel: "✨ Feature Release",
    titlePlaceholder: "e.g. AI-Powered Code Autocomplete is here",
    messagePlaceholder: "Walk users through what changed, why it matters, and how to get started with the new feature...",
    gradient: "linear-gradient(135deg, #EEEDFE 0%, #CECBF6 100%)",
  },
};

type NotifKey = keyof typeof NOTIFICATION_TYPES;

// ── Type selector card ────────────────────────────────────────────────────────
function TypeCard({
  config,
  selected,
  onClick,
}: {
  config: typeof NOTIFICATION_TYPES[NotifKey];
  selected: boolean;
  onClick: () => void;
}) {
  const { Icon, label, tagline, accentColor, bgColor, borderColor } = config;
  return (
    <Box
      onClick={onClick}
      sx={{
        flex: 1,
        cursor: "pointer",
        borderRadius: 3,
        border: `2px solid`,
        borderColor: selected ? accentColor : "divider",
        bgcolor: selected ? bgColor : "background.paper",
        p: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
        transition: "all 0.2s ease",
        "&:hover": {
          borderColor: accentColor,
          bgcolor: bgColor,
          transform: "translateY(-2px)",
          boxShadow: `0 6px 20px ${alpha(accentColor, 0.2)}`,
        },
        boxShadow: selected ? `0 4px 16px ${alpha(accentColor, 0.25)}` : "none",
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          bgcolor: selected ? accentColor : alpha(accentColor, 0.12),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s ease",
        }}
      >
        <Icon sx={{ color: selected ? "#fff" : accentColor, fontSize: 22 }} />
      </Box>
      <Typography fontWeight={700} fontSize={14} textAlign="center">
        {label}
      </Typography>
      <Typography fontSize={11} color="text.secondary" textAlign="center" lineHeight={1.3}>
        {tagline}
      </Typography>
    </Box>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminNotificationsPage() {
  const theme = useTheme();
  const [activeType, setActiveType] = useState<NotifKey>("course");
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ title: "", message: "" });

  const cfg = NOTIFICATION_TYPES[activeType];

  const PYTHON_API_BASE = "http://localhost:8000";

  const handleTypeSwitch = (key: NotifKey) => {
    setActiveType(key);
    setForm({ title: "", message: "" });
    setSent(false);
  };

  const handleSend = async () => {
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("message", form.message);
      formData.append("category", activeType);

      const res = await fetch(`${PYTHON_API_BASE}/notifications`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setSent(true);
        setForm({ title: "", message: "" });
        setTimeout(() => setSent(false), 5000);
      }
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", py: 8, bgcolor: "background.default" }}>
      <Container maxWidth="sm">

        {/* ── Header ── */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 5 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2.5,
              background: cfg.gradient,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.4s ease",
            }}
          >
            <cfg.Icon sx={{ fontSize: 28, color: cfg.accentColor }} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={800} letterSpacing="-0.5px">
              Broadcaster
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Admin Console — Send platform-wide notifications
            </Typography>
          </Box>
        </Stack>

        {/* ── Type selector ── */}
        <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
          {(Object.keys(NOTIFICATION_TYPES) as NotifKey[]).map((key) => (
            <TypeCard
              key={key}
              config={NOTIFICATION_TYPES[key]}
              selected={activeType === key}
              onClick={() => handleTypeSwitch(key)}
            />
          ))}
        </Stack>

        {/* ── Form card ── */}
        <Fade in key={activeType} timeout={300}>
          <Paper
            variant="outlined"
            sx={{
              p: 4,
              borderRadius: 4,
              borderColor: cfg.borderColor,
              borderWidth: 1.5,
              background: `linear-gradient(160deg, ${cfg.bgColor} 0%, ${theme.palette.background.paper} 45%)`,
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                right: 0,
                width: 180,
                height: 180,
                borderRadius: "50%",
                background: alpha(cfg.accentColor, 0.06),
                transform: "translate(60px, -60px)",
                pointerEvents: "none",
              },
            }}
          >
            {/* Badge row */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
              <Chip
                label={cfg.badgeLabel}
                size="small"
                sx={{
                  bgcolor: cfg.chipBg,
                  color: cfg.chipText,
                  fontWeight: 700,
                  fontSize: 12,
                  borderRadius: 2,
                  border: "none",
                }}
              />
              <Typography variant="caption" color="text.secondary">
                Broadcasts to all users
              </Typography>
            </Stack>

            <Stack spacing={2.5}>
              <TextField
                label="Notification Title"
                fullWidth
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={cfg.titlePlaceholder}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&:hover fieldset": { borderColor: cfg.accentColor },
                    "&.Mui-focused fieldset": {
                      borderColor: cfg.accentColor,
                      borderWidth: 2,
                    },
                  },
                  "& label.Mui-focused": { color: cfg.accentColor },
                }}
              />

              <TextField
                label="Message Content"
                multiline
                rows={5}
                fullWidth
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder={cfg.messagePlaceholder}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&:hover fieldset": { borderColor: cfg.accentColor },
                    "&.Mui-focused fieldset": {
                      borderColor: cfg.accentColor,
                      borderWidth: 2,
                    },
                  },
                  "& label.Mui-focused": { color: cfg.accentColor },
                }}
              />

              {/* Success message */}
              <Fade in={sent} unmountOnExit>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderRadius: 2.5,
                    bgcolor: alpha(cfg.accentColor, 0.1),
                    border: `1px solid ${alpha(cfg.accentColor, 0.3)}`,
                  }}
                >
                  <CheckCircleIcon sx={{ fontSize: 18, color: cfg.accentColor }} />
                  <Typography fontSize={13} fontWeight={600} color={cfg.accentColor}>
                    {cfg.label} notification broadcasted successfully!
                  </Typography>
                </Stack>
              </Fade>

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
                  fontSize: 15,
                  bgcolor: cfg.accentColor,
                  "&:hover": {
                    bgcolor: alpha(cfg.accentColor, 0.85),
                    boxShadow: `0 8px 24px ${alpha(cfg.accentColor, 0.4)}`,
                    transform: "translateY(-1px)",
                  },
                  "&:active": { transform: "translateY(0)" },
                  "&.Mui-disabled": {
                    bgcolor: alpha(cfg.accentColor, 0.3),
                    color: alpha(cfg.accentColor, 0.6),
                  },
                  transition: "all 0.2s ease",
                  boxShadow: `0 4px 14px ${alpha(cfg.accentColor, 0.3)}`,
                }}
              >
                Broadcast {cfg.label}
              </Button>
            </Stack>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
}
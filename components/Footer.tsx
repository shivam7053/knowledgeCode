"use client";
import React from "react";
import { Box, Container, Grid, Typography, Link as MuiLink, Stack, IconButton, Divider, alpha, useTheme } from "@mui/material";
import Link from "next/link";
import { GitHub, Twitter, LinkedIn, Instagram } from "@mui/icons-material";
import ThemeLogo from "./ThemeLogo";
import { useChillMode } from "@/app/providers";

export default function Footer() {
  const theme = useTheme();
  const { isChillMode } = useChillMode();
  const isDark = theme.palette.mode === "dark";

  // Dynamic colors based on mode and theme
  const brandColor = isChillMode ? "#ef4444" : theme.palette.primary.main;
  const footerBg = isChillMode ? (isDark ? "#000" : "#111") : (isDark ? "#0d1117" : "#f8fafc");
  const textColor = isChillMode || isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)";
  const headingColor = isChillMode || isDark ? "#fff" : "#000";

  const sections = [
    {
      title: "Learning Hub",
      links: [
        { label: "Professional Courses", href: "/courses" },
        { label: "Daily Tech News", href: "/news" },
        { label: "Mind-Blowing Facts", href: "/facts" },
      ],
    },
    {
      title: "DocForge & Tools",
      links: [
        { label: "Document Tools", href: "/tools" },
        { label: "Resume Analyzer", href: "/resume" },
        { label: "Online Compiler", href: "/compiler" },
      ],
    },
    {
      title: "Chillout Zone",
      links: [
        { label: "Game Arcade", href: "/game" },
        { label: "Neon Dash Runner", href: "/game/runner" },
        { label: "Quiz Arena", href: "/game/quiz" },
      ],
    },
  ];

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: footerBg,
        color: textColor,
        pt: 10,
        pb: 4,
        borderTop: `1px solid ${alpha(brandColor, 0.1)}`,
        transition: "all 0.4s ease-in-out",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient background glow */}
      <Box
        sx={{
          position: "absolute",
          bottom: -100,
          right: -100,
          width: 300,
          height: 300,
          background: `radial-gradient(circle, ${alpha(brandColor, 0.05)} 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      <Container maxWidth="xl">
        <Grid container spacing={6}>
          {/* Brand Identity Section */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ mb: 3 }}>
              <Box
                component={Link}
                href="/"
                sx={{
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  mb: 2,
                }}
              >
                <ThemeLogo isChillMode={isChillMode} />
                <Typography
                  variant="h6"
                  component="span"
                  sx={{
                    fontWeight: 900,
                    color: headingColor,
                  }}
                >
                  {isChillMode ? "GameCode" : "KnowledgeCode"}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ lineHeight: 1.8, maxWidth: 320 }}>
                Empowering your journey through specialized learning paths, high-performance document tools, and immersive arcade experiences.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              {[GitHub, Twitter, LinkedIn, Instagram].map((Icon, i) => (
                <IconButton
                  key={i}
                  size="small"
                  sx={{
                    color: textColor,
                    border: `1px solid ${alpha(textColor, 0.1)}`,
                    "&:hover": { color: brandColor, borderColor: brandColor, bgcolor: alpha(brandColor, 0.05) },
                  }}
                >
                  <Icon fontSize="small" />
                </IconButton>
              ))}
            </Stack>
          </Grid>

          {/* Dynamic Link Sections */}
          {sections.map((section) => (
            <Grid size={{ xs: 6, sm: 4, md: 2.5 }} key={section.title}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 800,
                  color: headingColor,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  mb: 3,
                }}
              >
                {section.title}
              </Typography>
              <Stack spacing={1.5}>
                {section.links.map((link) => (
                  <MuiLink
                    key={link.label}
                    component={Link}
                    href={link.href}
                    underline="none"
                    sx={{
                      fontSize: "0.9rem",
                      color: textColor,
                      transition: "color 0.2s",
                      "&:hover": { color: brandColor },
                    }}
                  >
                    {link.label}
                  </MuiLink>
                ))}
              </Stack>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 6, borderColor: alpha(brandColor, 0.1) }} />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
          }}
          spacing={2}
        >
          <Typography variant="caption">
            © {new Date().getFullYear()} KnowledgeCode. All rights reserved.
          </Typography>
          <Stack direction="row" spacing={3}>
            <MuiLink component={Link} href="#" underline="none" sx={{ color: textColor, fontSize: "0.75rem", "&:hover": { color: brandColor } }}>
              Privacy Policy
            </MuiLink>
            <MuiLink component={Link} href="#" underline="none" sx={{ color: textColor, fontSize: "0.75rem", "&:hover": { color: brandColor } }}>
              Terms of Service
            </MuiLink>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
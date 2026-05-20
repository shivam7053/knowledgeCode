"use client";
import { AppBar, Toolbar, Typography, Container, Box, Link as MuiLink, Switch, FormControlLabel, Stack, IconButton, Badge } from "@mui/material";
import Link from "next/link";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import { School as LearningIcon, SportsEsports as ChilloutIcon, Notifications as NotificationsIcon } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useChillMode } from "@/app/providers";

export default function AppNavbar() {
  const { isChillMode, setIsChillMode } = useChillMode();
  const muiTheme = useTheme();
  const isDarkMode = muiTheme.palette.mode === 'dark';
  const router = useRouter();

  // Colors for requested Chillout mode theme overrides
  const chillBg = isDarkMode ? "#000000" : "#ef4444";
  const chillText = "#ffffff";


  return (
    <AppBar 
      position="sticky" 
      elevation={0} 
      sx={{ 
        borderBottom: 1, 
        borderColor: isChillMode ? 'transparent' : 'divider', 
        bgcolor: isChillMode ? chillBg : 'background.paper', 
        color: isChillMode ? chillText : 'text.primary',
        transition: 'all 0.4s ease-in-out'
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Typography variant="h6" component={Link} href="/" sx={{ fontWeight: 'bold', color: isChillMode ? 'inherit' : 'primary.main', textDecoration: 'none', flexGrow: { xs: 1, md: 0 }, '&:hover': { color: isChillMode ? 'inherit' : 'primary.dark' } }}>
            KnowledgeCode
          </Typography>

          {/* Centered Mode Switcher */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, justifyContent: 'center' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ bgcolor: isChillMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)', px: 2, py: 0.5, borderRadius: 10 }}>
              <LearningIcon fontSize="small" sx={{ opacity: isChillMode ? 0.4 : 1 }} />
              <FormControlLabel
                control={
                  <Switch
                    checked={isChillMode}
                    onChange={(e) => {
                      const newChillMode = e.target.checked;
                      setIsChillMode(newChillMode);
                      if (newChillMode) {
                        router.push('/game');
                      } else {
                        router.push('/');
                      }
                    }}
                    color="default"
                  />
                }
                label={isChillMode ? "Chillout" : "Learning"}
                sx={{ m: 0, '& .MuiFormControlLabel-label': { fontWeight: 'bold', fontSize: '0.75rem', color: 'inherit' } }}
              />
              <ChilloutIcon fontSize="small" sx={{ opacity: isChillMode ? 1 : 0.4 }} />
            </Stack>
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3, mx: 4 }}>
            {!isChillMode ? (
              <>
                <MuiLink component={Link} href="/courses" color="inherit" underline="none" sx={{ fontWeight: 'medium' }}>Courses</MuiLink>
                <MuiLink component={Link} href="/news" color="inherit" underline="none" sx={{ fontWeight: 'medium' }}>News</MuiLink>
                <MuiLink component={Link} href="/facts" color="inherit" underline="none" sx={{ fontWeight: 'medium' }}>Facts</MuiLink>
              </>
            ) : (
              <>
                <MuiLink component={Link} href="/game/quiz" color="inherit" underline="none" sx={{ fontWeight: 'medium', '&:hover': { color: 'white' } }}>Quiz Arena</MuiLink>
              </>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 0 }}>
            <ThemeSwitcher />
            <IconButton 
              component={Link}
              href="/notifications"
              color="inherit"
              sx={{ 
                transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.1)' }
              }}
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

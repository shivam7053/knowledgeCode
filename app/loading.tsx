"use client";
import { Box, CircularProgress, Typography, Stack } from "@mui/material";

export default function GlobalLoading() {
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
      <Stack alignItems="center" spacing={2}>
        <CircularProgress size={60} thickness={4} color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: 1, color: 'text.secondary' }}>
          KNOWLEDGER LOLO
        </Typography>
      </Stack>
    </Box>
  );
}
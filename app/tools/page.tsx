"use client";

/**
 * DocForge – Professional Document Tools Suite
 *
 * AI Tools use FREE, locally-running open-source models via the Python FastAPI backend:
 *   • Summarization, Sentiment, Q&A are processed server-side using HuggingFace Transformers.
 *   Models are pre-downloaded into the Docker container for offline use.
 *
 * PDF / Office tools use pdf-lib, mammoth.js, SheetJS (also browser-native).
 * Server-side tools (compress, pdf-to-image, pdf-to-word via Ghostscript, pdf-to-excel via pdfplumber)
 * call the FastAPI backend at PYTHON_API_BASE (localhost:8000 by default).
 */

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import {
  Box, Container, Typography, Card, CardContent, CardActionArea, Alert,
  Chip, Snackbar, Paper, Stack, useTheme, alpha,
} from "@mui/material";
import Grid from "@mui/material/Grid"; // Use Grid2 for modern Material UI grid system
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import MergeIcon from "@mui/icons-material/Merge";
import ContentCutIcon from "@mui/icons-material/ContentCut";
import RotateRightIcon from "@mui/icons-material/RotateRight";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import CompressIcon from "@mui/icons-material/Compress";
import ImageIcon from "@mui/icons-material/Image";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import ArticleIcon from "@mui/icons-material/Article";
import TableChartIcon from "@mui/icons-material/TableChart";
import SlideshowIcon from "@mui/icons-material/Slideshow";
import WatermarkIcon from "@mui/icons-material/BrandingWatermark";
import NumbersIcon from "@mui/icons-material/Numbers";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import MemoryIcon from "@mui/icons-material/Memory";
import { useChillMode } from "@/app/providers";
import { Tool, ToolId, TOOLS, CATEGORY_LABELS } from "@/lib/toolUtils";

const ToolPanel = dynamic(() => import("@/components/ToolPanel"), {
  ssr: false,
  loading: () => (
    <Paper sx={{ p: 5, textAlign: "center", borderRadius: 5 }}>
      <Typography variant="body2" color="text.secondary">Loading tool environment...</Typography>
    </Paper>
  ),
});

// ─── ToolCard ─────────────────────────────────────────────────────────────────
function ToolCard({ tool, active, onClick }: { tool: Tool; active: boolean; onClick: () => void }) {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const badgeColor = tool.badgeColor || primary;

  return (
    <Card elevation={0} sx={{
      border: `1px solid ${active ? primary : alpha(theme.palette.divider, 0.1)}`,
      borderRadius: 4,
      background: active ? alpha(primary, 0.06) : theme.palette.background.paper,
      transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
      "&:hover": {
        borderColor: primary, transform: "translateY(-4px)",
        boxShadow: `0 12px 24px -10px ${alpha(primary, 0.3)}`,
        "& .tool-icon-box": { background: primary, color: "#fff", transform: "scale(1.1)" },
      },
    }}>
      <CardActionArea onClick={onClick} sx={{ p: 0 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}> {/* justifyContent and alignItems moved to sx */}
            <Box className="tool-icon-box" sx={{
              width: 44, height: 44, borderRadius: 2,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.3s ease", background: alpha(primary, 0.12), color: primary,
            }}>
              {tool.icon}
            </Box>
            {tool.badge && (
              <Chip label={tool.badge} size="small" sx={{ fontSize: 10, height: 20, fontWeight: 700, background: alpha(badgeColor, 0.15), color: badgeColor }} />
            )}
          </Stack>
          <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>{tool.label}</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5} sx={{ lineHeight: 1.4 }}>
            {tool.description}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DocumentToolsPage() {
  const theme = useTheme();
  const { isChillMode } = useChillMode();
  const primary = theme.palette.primary.main;
  const isDark = theme.palette.mode === "dark";

  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const [snack, setSnack] = useState("");
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  const activeDef = TOOLS.find((t) => t.id === activeTool) || null;
  const categories = Array.from(new Set(TOOLS.map((t) => t.category)));

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!heroRef.current) return;

      const { clientX, clientY } = event;
      const { offsetWidth, offsetHeight } = heroRef.current;
      const { left, top } = heroRef.current.getBoundingClientRect();

      // Calculate center of the hero section
      const centerX = left + offsetWidth / 2;
      const centerY = top + offsetHeight / 2;

      // Calculate difference from center
      const diffX = clientX - centerX;
      const diffY = clientY - centerY;

      // Normalize to -1 to 1 range and apply sensitivity
      const sensitivity = 0.05; 
      const newRotateY = diffX * sensitivity;
      const newRotateX = -diffY * sensitivity; 

      setRotation({ x: newRotateX, y: newRotateY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Determine cube color based on theme
  const cubeColor = isDark ? alpha(primary, 0.2) : alpha(primary, 0.1);
  const cubeGradient = isDark
    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.8)}, ${alpha(theme.palette.secondary.dark, 0.8)})`
    : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.8)}, ${alpha(theme.palette.secondary.light, 0.8)})`;

  const handleToolClick = (tool: Tool) => {
    if (!tool.implemented) { setSnack(`${tool.label} coming soon!`); return; }
    setActiveTool((prev) => (prev === tool.id ? null : tool.id));
    setTimeout(() => document.getElementById("tool-panel")?.scrollIntoView({ behavior: "smooth" }), 80);
  };

  return (
    <Box sx={{ minHeight: "100vh", background: theme.palette.background.default, pb: 10 }}>
      {/* Hero */}
      <Box component="section" ref={heroRef} sx={{
        position: 'relative',
        background: isDark ? 'transparent' : alpha(theme.palette.background.paper, 0.4),
        borderBottom: `1px solid ${alpha(primary, 0.12)}`,
        pt: { xs: 8, md: 12 }, pb: { xs: 6, md: 10 },
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        minHeight: '60vh'
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
            '&::before, &::after': {
              content: '""',
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              borderRadius: '24%',
              background: `linear-gradient(to bottom right, ${alpha(theme.palette.background.paper, 0.1)}, transparent)`,
              transform: 'translateZ(-60px)',
              opacity: 0.7,
            }
          }}
        />

        <Container maxWidth="lg">
          <Stack sx={{ alignItems: "center", textAlign: "center", position: 'relative', zIndex: 1 }}>
            <Chip label="Office Document Suite" size="small" sx={{ mb: 2, fontWeight: 700, fontSize: 11, background: alpha(primary, 0.12), color: primary, border: `1px solid ${alpha(primary, 0.25)}` }} />
            <Typography variant="h2" fontWeight={800} sx={{
              fontSize: { xs: "2.5rem", md: "4rem" }, letterSpacing: "-0.04em",
              background: isChillMode
                ? `linear-gradient(135deg, #ef4444, ${isDark ? "#fff" : "#000"})`
                : `linear-gradient(135deg, ${primary}, ${theme.palette.text.primary})`,
              backgroundClip: "text", WebkitBackgroundClip: "text", color: "transparent", mb: 1, // These are valid CSS properties, not React props
            }}>
              Document Tools
            </Typography>
            <Typography variant="h6" color="text.secondary" fontWeight={400} sx={{ maxWidth: 640, lineHeight: 1.6 }}>
              PDF, Office, and Local-AI tools — all running in your browser.
              <Box component="span" sx={{ display: "block", mt: 1, fontWeight: 700, color: "text.primary" }}>
                No uploads. No servers. Complete privacy.
              </Box>
            </Typography>

            <Stack direction="row" sx={{ gap: 4, mt: 5, flexWrap: "wrap", justifyContent: "center" }}> {/* flexWrap and justifyContent moved to sx */}
              {[
                { label: "Tools", value: 16 },
                { label: "AI Models", value: 4 },
                { label: "Languages", value: "200+" },
              ].map((s) => (
                <Box key={s.label} sx={{ textAlign: "center" }}>
                  <Typography variant="h4" fontWeight={800} color="primary">{s.value}</Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</Typography>
                </Box>
              ))}
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: 6 }}>
        {/* Active Tool Panel */}
        {activeDef && (
          <Box id="tool-panel" mb={5}>
            <ToolPanel key={activeDef.id} tool={activeDef} onClose={() => setActiveTool(null)} />
          </Box>
        )}

        {/* Category Grids */}
        {categories.map((cat) => {
          const catTools = TOOLS.filter((t) => t.category === cat);
          return (
            <Box key={cat} mb={8}>
              <Stack direction="row" sx={{ alignItems: "center", gap: 2, mb: 4 }}> {/* alignItems moved to sx */}
                <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: alpha(primary, 0.1), color: primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {cat === "ai" ? <MemoryIcon sx={{ fontSize: 20 }} /> : <DescriptionIcon sx={{ fontSize: 20 }} />}
                </Box>
                <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: -0.5 }}>
                  {CATEGORY_LABELS[cat]}
                </Typography>
                <Box sx={{ flex: 1, height: "1px", bgcolor: alpha(theme.palette.divider, 0.1) }} />
                <Chip label={`${catTools.length} Tools`} size="small"
                  sx={{ fontWeight: 600, bgcolor: "transparent", border: `1px solid ${alpha(primary, 0.2)}` }} />
              </Stack>

              {cat === "ai" && (
                <Alert severity="info" icon={<MemoryIcon />} sx={{ mb: 3, borderRadius: 2 }}>
                  <Typography variant="body2">
                    <strong>100% Free, Local, Private AI</strong> — These tools run open-source models (DistilBART, DistilBERT)
                    directly in your browser via <strong>Transformers.js + ONNX Runtime</strong>. Models are downloaded once from HuggingFace Hub
                    and cached permanently — no API key, no account, no data leaves your device.
                    For PDFs, use <em>Extract Text</em> first and upload the .txt file for best AI results.
                  </Typography>
                </Alert>
              )}

              <Grid container spacing={2.5} columns={12}>
                {catTools.map((tool) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={tool.id}>
                    <ToolCard tool={tool} active={activeTool === tool.id} onClick={() => handleToolClick(tool)} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          );
        })}
        {/* Footer */}
        <Paper elevation={0} sx={{ mt: 2, p: 3, borderRadius: 3, background: alpha(primary, 0.05), border: `1px solid ${alpha(primary, 0.12)}`, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            PDF/Office tools: <strong>pdf-lib</strong>, <strong>mammoth.js</strong>, <strong>SheetJS</strong> (browser-native) · AI tools: <strong>HuggingFace Transformers</strong> running{" "}
            <strong>DistilBART-CNN</strong>, <strong>DistilBERT-SQuAD</strong> on your local server.
            Processed 100% locally.
          </Typography>
        </Paper>
      </Container>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack("")} message={snack} />
    </Box>
  );
}
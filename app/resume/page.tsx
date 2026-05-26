"use client";

/**
 * page.tsx — Resume Analyzer & ATS Score Checker
 * Stack: Next.js 14 (App Router) + MUI v5
 * Place at: app/resume-analyzer/page.tsx  (or pages/resume-analyzer.tsx for Pages Router)
 *
 * Backend: FastAPI resume.py running at http://localhost:8000
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  LinearProgress,
  Paper,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  Alert,
  Collapse,
  Stack,
  useTheme,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { styled, alpha } from "@mui/material/styles";

// ── Icons (using text/emoji fallbacks so no icon-library dep is needed) ──────
const Icon = ({ children, ...props }: { children: string; style?: React.CSSProperties }) => (
  <span role="img" aria-hidden style={{ fontSize: 20, lineHeight: 1, ...props.style }}>
    {children}
  </span>
);

// ── Types ─────────────────────────────────────────────────────────────────────
interface SectionScores {
  skills_match: number;
  experience_relevance: number;
  education_fit: number;
  formatting: number;
  keyword_density: number;
}

interface Improvement {
  issue: string;
  suggestion: string;
}

interface ATSResult {
  ats_score: number;
  summary: string;
  matched_keywords: string[];
  missing_keywords: string[];
  missing_sections: string[];
  strengths: string[];
  improvements: Improvement[];
  section_scores: SectionScores;
}

interface SummaryResult {
  candidate_name: string;
  professional_title: string;
  years_of_experience: string;
  top_skills: string[];
  education: string[];
  key_achievements: string[];
  industries: string[];
  summary_paragraph: string;
}

type Mode = "ats" | "summary";
type Status = "idle" | "loading" | "success" | "error";

// ── Styled components ─────────────────────────────────────────────────────────
const PageWrapper = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  background: "#0a0c10",
  fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
  paddingBottom: 80,
}));

const HeroSection = styled(Box)(({ theme }) => ({
  background: "linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%)",
  borderBottom: "1px solid rgba(255,184,0,0.15)",
  padding: "56px 0 40px",
  position: "relative",
  overflow: "hidden",
  "&::before": {
    content: '""',
    position: "absolute",
    top: -120,
    right: -80,
    width: 400,
    height: 400,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,184,0,0.08) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  "&::after": {
    content: '""',
    position: "absolute",
    bottom: -80,
    left: -60,
    width: 300,
    height: 300,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(88,166,255,0.06) 0%, transparent 70%)",
    pointerEvents: "none",
  },
}));

const GoldChip = styled(Chip)(() => ({
  backgroundColor: "rgba(255,184,0,0.12)",
  color: "#ffb800",
  border: "1px solid rgba(255,184,0,0.3)",
  fontWeight: 600,
  fontSize: 11,
  letterSpacing: 1.2,
  textTransform: "uppercase",
}));

const DropZone = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isDragging",
})<{ isDragging: boolean }>(({ isDragging }) => ({
  border: `2px dashed ${isDragging ? "#ffb800" : "rgba(255,255,255,0.15)"}`,
  borderRadius: 16,
  padding: "40px 24px",
  textAlign: "center",
  cursor: "pointer",
  transition: "all 0.25s ease",
  background: isDragging
    ? "rgba(255,184,0,0.06)"
    : "rgba(255,255,255,0.02)",
  "&:hover": {
    borderColor: "rgba(255,184,0,0.5)",
    background: "rgba(255,184,0,0.04)",
  },
}));

const DarkCard = styled(Card)(() => ({
  background: "#161b22",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16,
  boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
}));

const DarkTextField = styled(TextField)(() => ({
  "& .MuiOutlinedInput-root": {
    background: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    color: "#e6edf3",
    "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
    "&:hover fieldset": { borderColor: "rgba(255,184,0,0.4)" },
    "&.Mui-focused fieldset": { borderColor: "#ffb800" },
  },
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.45)" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#ffb800" },
}));

const ScoreMeter = ({ score, label }: { score: number; label: string }) => {
  const color =
    score >= 75 ? "#22c55e" : score >= 50 ? "#ffb800" : "#ef4444";
  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
        <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color }}>
          {score}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={score}
        sx={{
          height: 6,
          borderRadius: 4,
          background: "rgba(255,255,255,0.08)",
          "& .MuiLinearProgress-bar": {
            borderRadius: 4,
            background: color,
          },
        }}
      />
    </Box>
  );
};

const BigScoreRing = ({ score }: { score: number }) => {
  const color =
    score >= 75 ? "#22c55e" : score >= 50 ? "#ffb800" : "#ef4444";
  const label =
    score >= 75 ? "Excellent" : score >= 50 ? "Good" : "Needs Work";
  return (
    <Box
      sx={{
        position: "relative",
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Box sx={{ position: "relative", display: "inline-flex" }}>
        <CircularProgress
          variant="determinate"
          value={100}
          size={140}
          thickness={5}
          sx={{ color: "rgba(255,255,255,0.06)", position: "absolute" }}
        />
        <CircularProgress
          variant="determinate"
          value={score}
          size={140}
          thickness={5}
          sx={{ color }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography
            sx={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1 }}
          >
            {score}
          </Typography>
          <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.4)", mt: 0.3 }}>
            / 100
          </Typography>
        </Box>
      </Box>
      <Chip
        label={label}
        size="small"
        sx={{
          mt: 1.5,
          background: alpha(color, 0.15),
          color,
          fontWeight: 700,
          border: `1px solid ${alpha(color, 0.4)}`,
        }}
      />
    </Box>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function ResumeAnalyzerPage() {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const isDark = theme.palette.mode === "dark";

  const [mode, setMode] = useState<Mode>("ats");
  const [file, setFile] = useState<File | null>(null);
  const [jobDesc, setJobDesc] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [atsResult, setAtsResult] = useState<ATSResult | null>(null);
  const [summaryResult, setSummaryResult] = useState<SummaryResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

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

  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  // ── File handling ────────────────────────────────────────────────────────
  const handleFileSelect = (f: File) => {
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
    if (!allowed.includes(f.type) && !f.name.match(/\.(pdf|docx|txt)$/i)) {
      setErrorMsg("Please upload a PDF, DOCX, or TXT file.");
      return;
    }
    setFile(f);
    setErrorMsg("");
    setAtsResult(null);
    setSummaryResult(null);
    setStatus("idle");
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  }, []);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!file) return;
    if (mode === "ats" && !jobDesc.trim()) {
      setErrorMsg("Please provide a job description for ATS analysis.");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const form = new FormData();
      form.append("resume", file);
      if (mode === "ats") form.append("job_description", jobDesc);

      const endpoint = mode === "ats" ? "/api/resume/analyze" : "/api/resume/summarize";
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `Server error: ${res.status}`);
      }

      const json = await res.json();
      if (mode === "ats") setAtsResult(json.data);
      else setSummaryResult(json.data);
      setStatus("success");
    } catch (e: any) {
      setStatus("error");
      setErrorMsg(e.message ?? "Something went wrong. Is the FastAPI server running?");
    }
  };

  const reset = () => {
    setFile(null);
    setAtsResult(null);
    setSummaryResult(null);
    setStatus("idle");
    setErrorMsg("");
    setJobDesc("");
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <PageWrapper>
      {/* ── Hero ── */}
      <HeroSection ref={heroRef}>
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

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
            <GoldChip label="🧠 Private Local AI" />
            <GoldChip label="⚡ Transformers Powered" />
          </Stack>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              color: "#e6edf3",
              mb: 1,
              fontSize: { xs: 28, md: 38 },
              letterSpacing: -1,
            }}
          >
            Resume Analyzer &{" "}
            <Box component="span" sx={{ color: "#ffb800" }}>
              ATS Scorer
            </Box>
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: 16, maxWidth: 560 }}>
            Upload your resume, paste a job description, and get instant ATS feedback — 100% local, no data leaves your machine.
          </Typography>
        </Container>
      </HeroSection>

      <Container maxWidth="lg" sx={{ mt: 5 }}>
        <Grid container spacing={4}>
          {/* ── Left Panel: Input ── */}
          <Grid size={{ xs: 12, md: 5 }}>
            <DarkCard>
              <CardContent sx={{ p: 3 }}>
                {/* Mode tabs */}
                <Tabs
                  value={mode}
                  onChange={(_, v) => { setMode(v); setAtsResult(null); setSummaryResult(null); setStatus("idle"); }}
                  sx={{
                    mb: 3,
                    "& .MuiTab-root": { color: "rgba(255,255,255,0.4)", fontWeight: 600, textTransform: "none", fontSize: 14 },
                    "& .Mui-selected": { color: "#ffb800 !important" },
                    "& .MuiTabs-indicator": { background: "#ffb800" },
                  }}
                >
                  <Tab label="🎯 ATS Score" value="ats" />
                  <Tab label="📋 Resume Summary" value="summary" />
                </Tabs>

                {/* Drop zone */}
                <DropZone
                  isDragging={isDragging}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    hidden
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                  />
                  <Typography sx={{ fontSize: 36, mb: 1 }}>📄</Typography>
                  {file ? (
                    <>
                      <Typography sx={{ color: "#ffb800", fontWeight: 700, mb: 0.5 }}>
                        {file.name}
                      </Typography>
                      <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>
                        {(file.size / 1024).toFixed(1)} KB — click to change
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Typography sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 600, mb: 0.5 }}>
                        Drop your resume here
                      </Typography>
                      <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
                        PDF, DOCX, or TXT · Click or drag & drop
                      </Typography>
                    </>
                  )}
                </DropZone>

                {/* Job description (ATS mode only) */}
                <Collapse in={mode === "ats"}>
                  <DarkTextField
                    label="Job Description"
                    multiline
                    rows={7}
                    fullWidth
                    value={jobDesc}
                    onChange={(e) => setJobDesc(e.target.value)}
                    placeholder="Paste the full job description here..."
                    sx={{ mt: 3 }}
                  />
                </Collapse>

                {/* Error */}
                <Collapse in={!!errorMsg}>
                  <Alert
                    severity="error"
                    sx={{ mt: 2, background: "rgba(239,68,68,0.1)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.3)" }}
                    onClose={() => setErrorMsg("")}
                  >
                    {errorMsg}
                  </Alert>
                </Collapse>

                {/* Actions */}
                <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    disabled={!file || status === "loading"}
                    onClick={handleSubmit}
                    sx={{
                      background: "#ffb800",
                      color: "#0a0c10",
                      fontWeight: 800,
                      py: 1.5,
                      borderRadius: 3,
                      fontSize: 15,
                      "&:hover": { background: "#e6a600" },
                      "&:disabled": { background: "rgba(255,184,0,0.2)", color: "rgba(255,255,255,0.2)" },
                    }}
                  >
                    {status === "loading" ? (
                      <><CircularProgress size={18} sx={{ color: "#0a0c10", mr: 1 }} /> Analyzing…</>
                    ) : mode === "ats" ? "Check ATS Score" : "Summarize Resume"}
                  </Button>
                  {status !== "idle" && (
                    <Tooltip title="Start over">
                      <IconButton onClick={reset} sx={{ border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)", borderRadius: 3 }}>
                        ↺
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              </CardContent>
            </DarkCard>
          </Grid>

          {/* ── Right Panel: Results ── */}
          <Grid size={{ xs: 12, md: 7 }}>
            {status === "idle" && (
              <Box
                sx={{
                  height: "100%",
                  minHeight: 300,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "rgba(255,255,255,0.15)",
                  border: "1px dashed rgba(255,255,255,0.06)",
                  borderRadius: 4,
                }}
              >
                <Typography sx={{ fontSize: 56, mb: 2 }}>📊</Typography>
                <Typography sx={{ fontSize: 16, fontWeight: 600 }}>
                  Analysis results will appear here
                </Typography>
                <Typography sx={{ fontSize: 13, mt: 0.5 }}>
                  Upload a resume and click analyze
                </Typography>
              </Box>
            )}

            {status === "loading" && (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
                <CircularProgress sx={{ color: "#ffb800", mb: 2 }} size={48} />
                <Typography sx={{ color: "rgba(255,255,255,0.5)" }}>
                  Running local AI analysis…
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.25)", fontSize: 13, mt: 0.5 }}>
                  This may take 15–60 seconds depending on your hardware
                </Typography>
              </Box>
            )}

            {/* ── ATS Results ── */}
            {status === "success" && atsResult && (
              <Stack spacing={3}>
                {/* Score header */}
                <DarkCard>
                  <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={3} sx={{ alignItems: "center" }}>
                      <Grid size="auto">
                        <BigScoreRing score={atsResult.ats_score} />
                      </Grid>
                      <Grid size="grow">
                        <Typography sx={{ color: "#e6edf3", fontWeight: 700, fontSize: 18, mb: 1 }}>
                          ATS Analysis Complete
                        </Typography>
                        <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.6 }}>
                          {atsResult.summary}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </DarkCard>

                {/* Section scores */}
                <DarkCard>
                  <CardContent sx={{ p: 3 }}>
                    <Typography sx={{ color: "#e6edf3", fontWeight: 700, mb: 2.5, fontSize: 15 }}>
                      📊 Section Breakdown
                    </Typography>
                    {Object.entries(atsResult.section_scores).map(([key, val]) => (
                      <ScoreMeter
                        key={key}
                        score={val}
                        label={key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      />
                    ))}
                  </CardContent>
                </DarkCard>

                {/* Keywords */}
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DarkCard sx={{ height: "100%" }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography sx={{ color: "#22c55e", fontWeight: 700, mb: 2, fontSize: 14 }}>
                          ✅ Matched Keywords ({atsResult.matched_keywords.length})
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                          {atsResult.matched_keywords.length ? atsResult.matched_keywords.map((kw) => (
                            <Chip key={kw} label={kw} size="small" sx={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)", fontSize: 12 }} />
                          )) : <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>None found</Typography>}
                        </Box>
                      </CardContent>
                    </DarkCard>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DarkCard sx={{ height: "100%" }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography sx={{ color: "#ef4444", fontWeight: 700, mb: 2, fontSize: 14 }}>
                          ❌ Missing Keywords ({atsResult.missing_keywords.length})
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                          {atsResult.missing_keywords.length ? atsResult.missing_keywords.map((kw) => (
                            <Chip key={kw} label={kw} size="small" sx={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", fontSize: 12 }} />
                          )) : <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>None missing 🎉</Typography>}
                        </Box>
                      </CardContent>
                    </DarkCard>
                  </Grid>
                </Grid>

                {/* Missing sections */}
                {atsResult.missing_sections?.length > 0 && (
                  <DarkCard>
                    <CardContent sx={{ p: 3 }}>
                      <Typography sx={{ color: "#ffb800", fontWeight: 700, mb: 2, fontSize: 14 }}>
                        ⚠️ Missing Sections
                      </Typography>
                      <Stack direction="row" gap={1} sx={{ flexWrap: "wrap" }}>
                        {atsResult.missing_sections.map((s) => (
                          <Chip key={s} label={s} size="small" sx={{ background: "rgba(255,184,0,0.1)", color: "#ffb800", border: "1px solid rgba(255,184,0,0.3)", fontSize: 12 }} />
                        ))}
                      </Stack>
                    </CardContent>
                  </DarkCard>
                )}

                {/* Strengths */}
                <DarkCard>
                  <CardContent sx={{ p: 3 }}>
                    <Typography sx={{ color: "#e6edf3", fontWeight: 700, mb: 2, fontSize: 15 }}>
                      💪 Strengths
                    </Typography>
                    <Stack spacing={1}>
                      {atsResult.strengths.map((s, i) => (
                        <Box key={i} sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                          <Box sx={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, mt: 0.2 }}>
                            <Typography sx={{ fontSize: 10, color: "#22c55e" }}>✓</Typography>
                          </Box>
                          <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: 14, lineHeight: 1.6 }}>{s}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </DarkCard>

                {/* Improvements */}
                <DarkCard>
                  <CardContent sx={{ p: 3 }}>
                    <Typography sx={{ color: "#e6edf3", fontWeight: 700, mb: 2, fontSize: 15 }}>
                      🛠 Suggested Improvements
                    </Typography>
                    <Stack spacing={2}>
                      {atsResult.improvements.map((imp, i) => (
                        <Box
                          key={i}
                          sx={{ p: 2, borderRadius: 3, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                        >
                          <Typography sx={{ color: "#ffb800", fontWeight: 700, fontSize: 13, mb: 0.5 }}>
                            {imp.issue}
                          </Typography>
                          <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 1.6 }}>
                            {imp.suggestion}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </DarkCard>
              </Stack>
            )}

            {/* ── Summary Results ── */}
            {status === "success" && summaryResult && (
              <Stack spacing={3}>
                {/* Header card */}
                <DarkCard>
                  <CardContent sx={{ p: 3 }}>
                    <Typography sx={{ color: "#ffb800", fontWeight: 800, fontSize: 24, mb: 0.5 }}>
                      {summaryResult.candidate_name}
                    </Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: 15, mb: 2 }}>
                      {summaryResult.professional_title} · {summaryResult.years_of_experience}
                    </Typography>
                    <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 2 }} />
                    <Typography sx={{ color: "rgba(255,255,255,0.65)", fontSize: 14, lineHeight: 1.8 }}>
                      {summaryResult.summary_paragraph}
                    </Typography>
                  </CardContent>
                </DarkCard>

                <Grid container spacing={2}>
                  {/* Skills */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DarkCard sx={{ height: "100%" }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography sx={{ color: "#e6edf3", fontWeight: 700, mb: 2, fontSize: 14 }}>
                          🛠 Top Skills
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                          {summaryResult.top_skills.map((s) => (
                            <Chip key={s} label={s} size="small" sx={{ background: "rgba(88,166,255,0.12)", color: "#58a6ff", border: "1px solid rgba(88,166,255,0.3)", fontSize: 12 }} />
                          ))}
                        </Box>
                      </CardContent>
                    </DarkCard>
                  </Grid>
                  {/* Industries */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DarkCard sx={{ height: "100%" }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography sx={{ color: "#e6edf3", fontWeight: 700, mb: 2, fontSize: 14 }}>
                          🏢 Industries
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                          {summaryResult.industries?.map((s) => (
                            <Chip key={s} label={s} size="small" sx={{ background: "rgba(255,184,0,0.1)", color: "#ffb800", border: "1px solid rgba(255,184,0,0.3)", fontSize: 12 }} />
                          ))}
                        </Box>
                      </CardContent>
                    </DarkCard>
                  </Grid>
                </Grid>

                {/* Education */}
                <DarkCard>
                  <CardContent sx={{ p: 3 }}>
                    <Typography sx={{ color: "#e6edf3", fontWeight: 700, mb: 2, fontSize: 14 }}>
                      🎓 Education
                    </Typography>
                    <Stack spacing={1}>
                      {summaryResult.education.map((e, i) => (
                        <Typography key={i} sx={{ color: "rgba(255,255,255,0.65)", fontSize: 14 }}>
                          • {e}
                        </Typography>
                      ))}
                    </Stack>
                  </CardContent>
                </DarkCard>

                {/* Achievements */}
                <DarkCard>
                  <CardContent sx={{ p: 3 }}>
                    <Typography sx={{ color: "#e6edf3", fontWeight: 700, mb: 2, fontSize: 14 }}>
                      🏆 Key Achievements
                    </Typography>
                    <Stack spacing={1.5}>
                      {summaryResult.key_achievements?.map((a, i) => (
                        <Box key={i} sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                          <Box sx={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,184,0,0.12)", border: "1px solid rgba(255,184,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, mt: 0.1 }}>
                            <Typography sx={{ fontSize: 10, color: "#ffb800" }}>{i + 1}</Typography>
                          </Box>
                          <Typography sx={{ color: "rgba(255,255,255,0.65)", fontSize: 14, lineHeight: 1.6 }}>{a}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </DarkCard>
              </Stack>
            )}
          </Grid>
        </Grid>
      </Container>
    </PageWrapper>
  );
}
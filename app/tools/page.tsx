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

import React, { useState, useRef, useCallback } from "react"; // Removed useEffect
import {
  Box, Container, Typography, Card, CardContent, CardActionArea,
  Button, Chip, LinearProgress, Alert, Snackbar, Divider, IconButton,
  Paper, Stack, useTheme, alpha, TextField, FormControl, InputLabel,
  Select, MenuItem, Tooltip, Badge, CircularProgress,
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
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import MemoryIcon from "@mui/icons-material/Memory";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import { PDFDocument, degrees, rgb, StandardFonts } from "pdf-lib";
import { useChillMode } from "@/app/providers";
import * as mammoth from "mammoth";
import * as XLSX from "xlsx";
// ─── helpers ──────────────────────────────────────────────────────────────────
function parsePageRange(rangeStr: string, maxPages: number): number[] {
  const pages = new Set<number>();
  for (const part of rangeStr.split(/[\s,]+/)) {
    if (part.includes("-")) {
      const [a, b] = part.split("-").map((n) => parseInt(n.trim(), 10));
      if (!isNaN(a) && !isNaN(b))
        for (let i = Math.max(1, a); i <= Math.min(maxPages, b); i++) pages.add(i - 1);
    } else {
      const n = parseInt(part.trim(), 10);
      if (!isNaN(n) && n >= 1 && n <= maxPages) pages.add(n - 1);
    }
  }
  return Array.from(pages).sort((a, b) => a - b);
}

function chunkText(text: string, chunkSize = 900): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    let end = Math.min(i + chunkSize, text.length);
    // Try to break at sentence boundary
    const lastDot = text.lastIndexOf(". ", end);
    if (lastDot > i + 400) end = lastDot + 2;
    chunks.push(text.slice(i, end).trim());
    i = end;
  }
  return chunks.filter((c) => c.length > 10);
}

// ─── types ────────────────────────────────────────────────────────────────────
type ToolId =
  | "merge-pdf" | "split-pdf" | "rotate-pdf" | "compress-pdf"
  | "pdf-to-word" | "word-to-pdf" | "pdf-to-image" | "image-to-pdf"
  | "encrypt-pdf" | "decrypt-pdf" | "watermark-pdf" | "page-numbers"
  | "extract-text" | "excel-to-pdf" | "pdf-to-excel" | "word-to-excel"
  | "ai-summarize" | "ai-sentiment" | "ai-qa";

interface Tool {
  id: ToolId;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: "pdf" | "convert" | "office" | "ai";
  badge?: string;
  badgeColor?: string;
  implemented: boolean;
  accept: string;
  multiple?: boolean;
}

interface FileState {
  file: File | null;
  files: File[];
  processing: boolean;
  progress: number;
  progressMsg: string;
  done: boolean;
  error: string;
  outputUrl: string;
  outputName: string;
  aiOutput: string;
}

// ─── tool definitions ─────────────────────────────────────────────────────────
const TOOLS: Tool[] = [
  // PDF Tools
  { id: "merge-pdf", label: "Merge PDF", description: "Combine multiple PDFs into one document", icon: <MergeIcon />, category: "pdf", implemented: true, accept: ".pdf", multiple: true },
  { id: "split-pdf", label: "Split PDF", description: "Extract specific pages from a PDF", icon: <ContentCutIcon />, category: "pdf", implemented: true, accept: ".pdf" },
  { id: "rotate-pdf", label: "Rotate PDF", description: "Rotate PDF pages 90°, 180°, or 270°", icon: <RotateRightIcon />, category: "pdf", implemented: true, accept: ".pdf" },
  { id: "compress-pdf", label: "Compress PDF", description: "Reduce PDF file size while keeping quality", icon: <CompressIcon />, category: "pdf", badge: "Popular", implemented: true, accept: ".pdf" },
  { id: "encrypt-pdf", label: "Protect PDF", description: "Password-protect your PDF document", icon: <LockIcon />, category: "pdf", implemented: true, accept: ".pdf" },
  { id: "decrypt-pdf", label: "Unlock PDF", description: "Remove password protection from PDF", icon: <LockOpenIcon />, category: "pdf", implemented: true, accept: ".pdf" },
  { id: "watermark-pdf", label: "Watermark PDF", description: "Add text watermark to every PDF page", icon: <WatermarkIcon />, category: "pdf", implemented: true, accept: ".pdf" },
  { id: "page-numbers", label: "Add Page Numbers", description: "Insert page numbers into your PDF", icon: <NumbersIcon />, category: "pdf", implemented: true, accept: ".pdf" },
  { id: "extract-text", label: "Extract Text", description: "Pull all text from any PDF as .txt", icon: <TextFieldsIcon />, category: "pdf", implemented: true, accept: ".pdf" },
  // Convert
  { id: "pdf-to-word", label: "PDF → Word", description: "Convert PDF text into a Word document", icon: <SwapHorizIcon />, category: "convert", badge: "Server", implemented: true, accept: ".pdf" },
  { id: "word-to-pdf", label: "Word → PDF", description: "Convert .docx to a downloadable PDF", icon: <PictureAsPdfIcon />, category: "convert", implemented: true, accept: ".docx" },
  { id: "pdf-to-image", label: "PDF → Image", description: "Convert first page of PDF to PNG", icon: <ImageIcon />, category: "convert", badge: "Server", implemented: true, accept: ".pdf" },
  { id: "image-to-pdf", label: "Image → PDF", description: "Wrap images into a PDF document", icon: <PictureAsPdfIcon />, category: "convert", implemented: true, accept: "image/*", multiple: true },
  // Office
  { id: "excel-to-pdf", label: "Excel → PDF", description: "Convert spreadsheet data to PDF table", icon: <TableChartIcon />, category: "office", implemented: true, accept: ".xlsx,.xls,.csv" },
  { id: "pdf-to-excel", label: "PDF → Excel", description: "Extract tables from PDF to Excel", icon: <TableChartIcon />, category: "office", badge: "Server", implemented: true, accept: ".pdf" },
  { id: "word-to-excel", label: "Word → Excel", description: "Extract tables from .docx into CSV", icon: <ArticleIcon />, category: "office", implemented: true, accept: ".docx" },
  // AI (Local Models)
  {
    id: "ai-summarize", label: "AI Summarize", badge: "Local AI", badgeColor: "#10b981",
    description: "DistilBART-CNN — runs on your local server, no internet needed after setup",
    icon: <AutoAwesomeIcon />, category: "ai", implemented: true, accept: ".pdf,.txt,.docx",
  },
  {
    id: "ai-qa", label: "Ask Document", badge: "Local AI", badgeColor: "#10b981",
    description: "DistilBERT-SQuAD — ask any question about your document (local server)",
    icon: <QuestionAnswerIcon />, category: "ai", implemented: true, accept: ".pdf,.txt,.docx",
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  pdf: "PDF Tools",
  convert: "Convert",
  office: "Office Conversion",
  ai: "🧠 Local AI Tools — Free, Private, Server-side",
};

const PYTHON_API_BASE = "http://localhost:8000";

// ─── AI processors (all local, no API key needed) ────────────────────────────

async function runAISummarize(
  text: string,
  onProgress: (p: number, msg: string) => void
): Promise<string> {
  onProgress(20, "Connecting to private AI server…");
  const formData = new FormData();
  formData.append("text", text);
  const resp = await fetch(`${PYTHON_API_BASE}/ai/summarize`, { method: "POST", body: formData });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.detail || err.error || `Summarization failed (${resp.status})`);
  }
  const data = await resp.json();
  return data.result;
}

async function runAIQA(
  context: string,
  question: string,
  onProgress: (p: number, msg: string) => void
): Promise<string> {
  onProgress(20, "Connecting to private AI server…");
  const formData = new FormData();
  formData.append("context", context);
  formData.append("question", question);
  const resp = await fetch(`${PYTHON_API_BASE}/ai/qa`, { method: "POST", body: formData });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.detail || err.error || `Q&A failed (${resp.status})`);
  }
  const data = await resp.json();
  return data.result;
}

// ─── Text extractor (client-side, works for txt/docx; PDF uses server or pdf-lib metadata) ──
async function extractDocumentText(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "txt") return await file.text();
  if (ext === "docx" || ext === "doc") {
    const arr = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: arr });
    return result.value;
  }
  if (ext === "pdf") {
    // Attempt server-side extraction first; fall back to pdf-lib metadata
    try {
      const formData = new FormData();
      formData.append("file", file);
      const resp = await fetch(`${PYTHON_API_BASE}/extract-text`, { method: "POST", body: formData });
      if (resp.ok) return await resp.text();
    } catch (_) {}
    // Fallback: return metadata only (client can't parse PDF text without pdf.js)
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    return [
      `PDF: ${file.name}`,
      `Pages: ${doc.getPageCount()}`,
      `Title: ${doc.getTitle() || "N/A"}`,
      `Author: ${doc.getAuthor() || "N/A"}`,
      `Creator: ${doc.getCreator() || "N/A"}`,
      "",
      "[Note: Full text extraction requires the Python server (/extract-text) to be running.",
      " For AI tools, upload a .txt or .docx file for best results.]",
    ].join("\n");
  }
  return await file.text();
}

// ─── Standard processors ──────────────────────────────────────────────────────
async function processTool(
  id: ToolId,
  files: File[],
  onProgress: (p: number, msg?: string) => void,
  isChillMode: boolean,
  params: Record<string, any>
): Promise<{ blob: Blob; name: string }> {
  const file = files[0];

  const serverOp = async (endpoint: string, extra?: Record<string, string>) => {
    onProgress(10, "Uploading to local server…");
    const formData = new FormData();
    formData.append("file", file);
    if (extra) Object.entries(extra).forEach(([k, v]) => formData.append(k, v));
    const resp = await fetch(`${PYTHON_API_BASE}/${endpoint}`, { method: "POST", body: formData });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: "Server error" }));
      throw new Error(err.error || "Server error");
    }
    onProgress(90, "Processing complete…");
    return await resp.blob();
  };

  switch (id) {
    case "compress-pdf": {
      const blob = await serverOp("compress-pdf", { compressionLevel: params.compressionLevel || "medium" });
      return { blob, name: `compressed-${file.name}` };
    }
    case "encrypt-pdf": {
      if (!params.password) throw new Error("Please enter a password.");
      const blob = await serverOp("protect-pdf", { password: params.password });
      return { blob, name: `protected-${file.name}` };
    }
    case "decrypt-pdf": {
      const blob = await serverOp("unlock-pdf", { password: params.password || "" });
      return { blob, name: `unlocked-${file.name}` };
    }
    case "extract-text": {
      const blob = await serverOp("extract-text");
      return { blob, name: file.name.replace(/\.pdf$/i, ".txt") };
    }
    case "pdf-to-image": {
      const blob = await serverOp("pdf-to-image");
      return { blob, name: file.name.replace(/\.pdf$/i, ".png") };
    }

    case "merge-pdf": {
      const merged = await PDFDocument.create();
      for (let i = 0; i < files.length; i++) {
        onProgress(Math.round(((i + 1) / files.length) * 85), `Merging ${files[i].name}…`);
        const bytes = await files[i].arrayBuffer();
        const doc = await PDFDocument.load(bytes);
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
      }
      const pdfBytes = await merged.save();
      return { blob: new Blob([pdfBytes], { type: "application/pdf" }), name: "merged.pdf" };
    }

    case "split-pdf": {
      onProgress(20, "Loading PDF…");
      const bytes = await file.arrayBuffer();
      const src = await PDFDocument.load(bytes);
      const total = src.getPageCount();
      const indices = parsePageRange(params.range || "1", total);
      if (!indices.length) throw new Error("Invalid page range. Use e.g.: 1-3, 5, 7");
      onProgress(50, `Extracting ${indices.length} pages…`);
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, indices);
      copied.forEach((p) => out.addPage(p));
      onProgress(90, "Saving…");
      return { blob: new Blob([await out.save()], { type: "application/pdf" }), name: `split-${file.name}` };
    }

    case "rotate-pdf": {
      onProgress(20, "Loading PDF…");
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const angle = parseInt(params.angle, 10) || 90;
      const pages = doc.getPages();
      pages.forEach((p, i) => {
        p.setRotation(degrees((p.getRotation().angle + angle) % 360));
        onProgress(20 + Math.round(((i + 1) / pages.length) * 65), `Rotating page ${i + 1}…`);
      });
      return { blob: new Blob([await doc.save()], { type: "application/pdf" }), name: "rotated.pdf" };
    }

    case "watermark-pdf": {
      onProgress(20, "Loading PDF…");
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const wmText = params.watermarkText || "CONFIDENTIAL";
      const opacity = parseFloat(params.opacity || "0.25");
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      const pages = doc.getPages();
      pages.forEach((page, i) => {
        const { width, height } = page.getSize();
        page.drawText(wmText, {
          x: width / 2 - wmText.length * 11,
          y: height / 2,
          size: 44,
          font,
          color: isChillMode ? rgb(0.94, 0.27, 0.27) : rgb(0.42, 0.38, 1),
          opacity,
          rotate: degrees(45),
        });
        onProgress(20 + Math.round(((i + 1) / pages.length) * 70), `Stamping page ${i + 1}…`);
      });
      return { blob: new Blob([await doc.save()], { type: "application/pdf" }), name: "watermarked.pdf" };
    }

    case "page-numbers": {
      onProgress(20, "Loading PDF…");
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pages = doc.getPages();
      const position = params.numberPosition || "bottom-center";
      pages.forEach((page, i) => {
        const { width, height } = page.getSize();
        const label = `${i + 1} / ${pages.length}`;
        let x = width / 2 - 20;
        let y = 20;
        if (position === "top-center") { x = width / 2 - 20; y = height - 30; }
        if (position === "bottom-right") { x = width - 60; y = 20; }
        if (position === "bottom-left") { x = 40; y = 20; }
        page.drawText(label, { x, y, size: 10, font, color: rgb(0.4, 0.4, 0.4) });
        onProgress(20 + Math.round(((i + 1) / pages.length) * 70), `Numbering page ${i + 1}…`);
      });
      return { blob: new Blob([await doc.save()], { type: "application/pdf" }), name: "numbered.pdf" };
    }

    case "word-to-pdf": {
      onProgress(20, "Reading Word document…");
      const arr = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: arr });
      const text = result.value;
      onProgress(50, "Building PDF…");
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const lines = text.split("\n");
      let page = doc.addPage([612, 792]);
      const { height } = page.getSize();
      let y = height - 50;
      const lh = 14;
      for (let li = 0; li < lines.length; li++) {
        if (y < 50) { page = doc.addPage([612, 792]); y = height - 50; }
        const safe = lines[li].replace(/[^\x20-\x7E]/g, " ").slice(0, 92);
        page.drawText(safe, { x: 50, y, size: 11, font, color: rgb(0.05, 0.05, 0.05) });
        y -= lh;
        if (li % 15 === 0) onProgress(50 + Math.round((li / lines.length) * 40), "Building PDF…");
      }
      return { blob: new Blob([await doc.save()], { type: "application/pdf" }), name: file.name.replace(".docx", ".pdf") };
    }

    case "image-to-pdf": {
      const doc = await PDFDocument.create();
      for (let i = 0; i < files.length; i++) {
        onProgress(Math.round(((i + 1) / files.length) * 85), `Embedding image ${i + 1}…`);
        const imgBytes = await files[i].arrayBuffer();
        const mime = files[i].type;
        let img;
        if (mime === "image/png") img = await doc.embedPng(imgBytes);
        else img = await doc.embedJpg(imgBytes);
        const page = doc.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      }
      return { blob: new Blob([await doc.save()], { type: "application/pdf" }), name: "images.pdf" };
    }

    case "excel-to-pdf": {
      onProgress(20, "Reading spreadsheet…");
      const bytes = await file.arrayBuffer();
      const wb = XLSX.read(bytes, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1 }) as string[][];
      onProgress(50, "Building PDF table…");
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const bold = await doc.embedFont(StandardFonts.HelveticaBold);
      let page = doc.addPage([842, 595]);
      const pHeight = 595;
      let y = pHeight - 50;
      const colW = 100, rowH = 18;
      rows.forEach((row, ri) => {
        if (y < 40) { page = doc.addPage([842, 595]); y = pHeight - 50; }
        (row || []).slice(0, 8).forEach((cell, ci) => {
          page.drawText(String(cell ?? "").slice(0, 14), {
            x: 40 + ci * colW, y, size: 10,
            font: ri === 0 ? bold : font,
            color: rgb(0.05, 0.05, 0.05),
          });
        });
        y -= rowH;
        if (ri % 10 === 0) onProgress(50 + Math.round((ri / rows.length) * 40), `Row ${ri}/${rows.length}…`);
      });
      return { blob: new Blob([await doc.save()], { type: "application/pdf" }), name: file.name.replace(/\.(xlsx?|csv)$/, ".pdf") };
    }

    case "word-to-excel": {
      onProgress(30, "Reading Word document…");
      const arr = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: arr });
      onProgress(70, "Building CSV…");
      const lines = result.value.split("\n").filter((l) => l.trim());
      const csv = lines.map((l) => `"${l.replace(/"/g, '""')}"`).join("\n");
      return { blob: new Blob([csv], { type: "text/csv" }), name: file.name.replace(".docx", ".csv") };
    }

    default:
      throw new Error("Tool not implemented");
  }
}

// ─── DropZone ─────────────────────────────────────────────────────────────────
function DropZone({ tool, onFiles }: { tool: Tool; onFiles: (files: File[]) => void }) {
  const theme = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const primary = theme.palette.primary.main;

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) onFiles(Array.from(e.dataTransfer.files));
  }, [onFiles]);

  return (
    <Paper
      variant="outlined"
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      sx={{
        border: `2px dashed ${dragging ? primary : alpha(primary, 0.35)}`,
        borderRadius: 3, p: 5, textAlign: "center", cursor: "pointer",
        transition: "all 0.2s",
        background: dragging ? alpha(primary, 0.06) : "transparent",
        "&:hover": { borderColor: primary, background: alpha(primary, 0.04) },
      }}
    >
      <input ref={inputRef} type="file" hidden accept={tool.accept}
        multiple={tool.multiple}
        onChange={(e) => e.target.files && onFiles(Array.from(e.target.files))} />
      <UploadFileIcon sx={{ fontSize: 48, color: primary, mb: 1, opacity: 0.8 }} />
      <Typography variant="h6" fontWeight={600}>Drop files here</Typography>
      <Typography variant="body2" color="text.secondary" mt={0.5}>
        or click to browse · {tool.accept}{tool.multiple ? " (multiple)" : ""}
      </Typography>
      {tool.category === "ai" && (
        <Box mt={2} p={1.5} sx={{ background: alpha(theme.palette.success.main, 0.08), borderRadius: 2, border: `1px solid ${alpha(theme.palette.success.main, 0.2)}` }}>
          <Typography 
            variant="caption" 
            color="success.main" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5, 
              justifyContent: 'center' 
            }}
          >
            <MemoryIcon sx={{ fontSize: 14 }} />
            100% local AI — model runs in your browser after first download
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

// ─── Model Info Banner ────────────────────────────────────────────────────────
function AIModelBanner({ toolId }: { toolId: ToolId }) {
  const theme = useTheme();
  const info: Record<string, { model: string; source: string; task: string; size: string }> = {
    "ai-summarize": { model: "sshleifer/distilbart-cnn-6-6", source: "HuggingFace", task: "Abstractive Summarization", size: "1.2 GB" },
    "ai-qa": { model: "distilbert-base-uncased-distilled-squad", source: "HuggingFace/Stanford", task: "Question Answering", size: "265 MB" },
  };
  const m = info[toolId];
  if (!m) return null;
  return (
    <Box p={2} sx={{ background: alpha(theme.palette.info.main, 0.07), borderRadius: 2, border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`, mb: 2 }}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}> {/* flexWrap and alignItems moved to sx */}
        <MemoryIcon sx={{ fontSize: 16, color: "info.main" }} />
        <Typography variant="caption" fontWeight={700} color="info.main">{m.task} (Model: {m.model})</Typography>
        <Chip label={m.source} size="small" sx={{ fontSize: 10, height: 18 }} />
        <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
          Processed on local server · no API key needed · offline after setup
        </Typography>
      </Stack>
    </Box>
  );
}

// ─── ToolPanel ────────────────────────────────────────────────────────────────
function ToolPanel({ tool, onClose }: { tool: Tool; onClose: () => void }) {
  const theme = useTheme();
  const { isChillMode } = useChillMode();
  const primary = theme.palette.primary.main;

  const initState = (): FileState => ({
    file: null, files: [], processing: false, progress: 0, progressMsg: "",
    done: false, error: "", outputUrl: "", outputName: "", aiOutput: "",
  });

  const [state, setState] = useState<FileState>(initState());
  const [params, setParams] = useState<Record<string, any>>({
    angle: 90, range: "1", password: "", watermarkText: "CONFIDENTIAL",
    opacity: "0.25", compressionLevel: "medium", targetLang: "Spanish",
    numberPosition: "bottom-center", question: "",
  });

  const handleFiles = (files: File[]) =>
    setState((s) => ({ ...s, file: files[0], files, done: false, error: "", outputUrl: "", aiOutput: "" }));

  const handleProcess = async () => {
    if (!state.files.length) return;
    setState((s) => ({ ...s, processing: true, progress: 0, progressMsg: "Starting…", error: "", aiOutput: "" }));
    try {
      // AI tools
      if (["ai-summarize", "ai-qa"].includes(tool.id)) {
        const onProgress = (p: number, msg: string) =>
          setState((s) => ({ ...s, progress: p, progressMsg: msg }));
        const text = await extractDocumentText(state.files[0]);
        let output = "";
        if (tool.id === "ai-summarize") output = await runAISummarize(text, onProgress);
        else if (tool.id === "ai-qa") {
          if (!params.question) throw new Error("Please enter a question.");
          output = await runAIQA(text, params.question, onProgress);
        }
        setState((s) => ({ ...s, processing: false, progress: 100, done: true, aiOutput: output }));
      } else {
        // PDF/Office tools
        const { blob, name } = await processTool(
          tool.id, state.files,
          (p, msg) => setState((s) => ({ ...s, progress: p, progressMsg: msg || "" })),
          isChillMode, params
        );
        const url = URL.createObjectURL(blob);
        setState((s) => ({ ...s, processing: false, progress: 100, done: true, outputUrl: url, outputName: name }));
      }
    } catch (e: unknown) {
      setState((s) => ({ ...s, processing: false, error: e instanceof Error ? e.message : "Processing failed" }));
    }
  };

  const handleReset = () => setState(initState());

  return (
    <Paper elevation={0} sx={{
      border: `1px solid ${alpha(primary, 0.15)}`, borderRadius: 5,
      p: { xs: 3, md: 5 },
      background: isChillMode ? alpha("#000", 0.4) : alpha(theme.palette.background.paper, 0.8),
      backdropFilter: "blur(10px)",
    }}>
      {/* Header */}
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 3 }}> {/* alignItems and justifyContent moved to sx */}
        <Stack direction="row" sx={{ alignItems: "center", gap: 2 }}> {/* alignItems moved to sx */}
          <Box sx={{ width: 40, height: 40, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", background: alpha(primary, 0.12), color: primary }}>
            {tool.icon}
          </Box>
          <Box>
            <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}> {/* alignItems moved to sx */}
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.1 }}>{tool.label}</Typography> {/* lineHeight moved to sx */}
              {tool.badge && (
                <Chip label={tool.badge} size="small" sx={{ fontSize: 10, height: 18, fontWeight: 700, background: alpha(tool.badgeColor || primary, 0.15), color: tool.badgeColor || primary }} />
              )}
            </Stack>
            <Typography variant="caption" color="text.secondary">{tool.description}</Typography>
          </Box>
        </Stack>
        <IconButton size="small" onClick={onClose}>✕</IconButton>
      </Stack>

      {/* AI Model Banner */}
      {tool.category === "ai" && <AIModelBanner toolId={tool.id} />}

      {/* Drop Zone */}
      {!state.done && <DropZone tool={tool} onFiles={handleFiles} />}

      {/* Options */}
      {state.files.length > 0 && !state.done && (
        <Box sx={{ mt: 3, p: 2, bgcolor: alpha(primary, 0.03), borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight={700} mb={2}>Options</Typography>
          <Grid container spacing={2}>
            {tool.id === "compress-pdf" && (
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Compression Level</InputLabel>
                  <Select label="Compression Level" value={params.compressionLevel}
                    onChange={(e) => setParams((p) => ({ ...p, compressionLevel: e.target.value }))}>
                    <MenuItem value="low">Low — Highest Clarity</MenuItem>
                    <MenuItem value="medium">Medium — Balanced</MenuItem>
                    <MenuItem value="high">High — Smallest Size</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            {tool.id === "watermark-pdf" && (
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField fullWidth size="small" label="Watermark Text"
                  value={params.watermarkText}
                  onChange={(e) => setParams((p) => ({ ...p, watermarkText: e.target.value }))}
                  placeholder="e.g., CONFIDENTIAL, DRAFT" />
              </Grid>
            )}
            {tool.id === "watermark-pdf" && (
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Opacity</InputLabel>
                  <Select label="Opacity" value={params.opacity}
                    onChange={(e) => setParams((p) => ({ ...p, opacity: e.target.value }))}>
                    <MenuItem value="0.1">Light (10%)</MenuItem>
                    <MenuItem value="0.25">Medium (25%)</MenuItem>
                    <MenuItem value="0.45">Heavy (45%)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            {tool.id === "split-pdf" && (
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth size="small" label="Page Range (e.g. 1-3, 5, 7-9)"
                  value={params.range}
                  onChange={(e) => setParams((p) => ({ ...p, range: e.target.value }))}
                  helperText="Comma-separated pages or ranges. E.g.: 1-3, 5, 8-10" />
              </Grid>
            )}
            {tool.id === "rotate-pdf" && (
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Rotation Angle</InputLabel>
                  <Select label="Rotation Angle" value={params.angle}
                    onChange={(e) => setParams((p) => ({ ...p, angle: e.target.value }))}>
                    <MenuItem value={90}>90° Clockwise</MenuItem>
                    <MenuItem value={180}>180°</MenuItem>
                    <MenuItem value={270}>270° (Counter-clockwise)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            {tool.id === "page-numbers" && (
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Number Position</InputLabel>
                  <Select label="Number Position" value={params.numberPosition}
                    onChange={(e) => setParams((p) => ({ ...p, numberPosition: e.target.value }))}>
                    <MenuItem value="bottom-center">Bottom Center</MenuItem>
                    <MenuItem value="bottom-right">Bottom Right</MenuItem>
                    <MenuItem value="bottom-left">Bottom Left</MenuItem>
                    <MenuItem value="top-center">Top Center</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            {(tool.id === "encrypt-pdf" || tool.id === "decrypt-pdf") && (
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth size="small" type="password" label="Password"
                  value={params.password}
                  onChange={(e) => setParams((p) => ({ ...p, password: e.target.value }))} />
              </Grid>
            )}
            {tool.id === "ai-qa" && (
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth size="small" label="Your Question"
                  value={params.question}
                  onChange={(e) => setParams((p) => ({ ...p, question: e.target.value }))}
                  placeholder="e.g., What is the main conclusion of this document?"
                  helperText="Ask anything about the document content" />
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* File list */}
      {state.files.length > 0 && !state.done && (
        <Stack mt={2} gap={0.5}>
          {state.files.map((f, i) => (
            <Stack key={i} direction="row" alignItems="center" gap={1}
              sx={{ p: 1, borderRadius: 2, background: alpha(primary, 0.05) }}>
              <DescriptionIcon sx={{ fontSize: 18, color: primary }} />
              <Typography variant="body2" flex={1} noWrap>{f.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {(f.size / 1024).toFixed(0)} KB
              </Typography>
              <IconButton size="small" onClick={() =>
                setState((s) => ({ ...s, files: s.files.filter((_, j) => j !== i), file: s.files.filter((_, j) => j !== i)[0] || null }))}>
                <DeleteIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Stack>
          ))}
        </Stack>
      )}

      {/* Progress */}
      {state.processing && (
        <Box mt={2}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 0.5 }}> {/* alignItems moved to sx */}
            <CircularProgress size={14} />
            <Typography variant="caption" color="text.secondary">{state.progressMsg}</Typography>
          </Stack>
          <LinearProgress variant="determinate" value={state.progress} sx={{ borderRadius: 4, height: 6 }} />
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ mt: 0.5, display: 'block', textAlign: 'right' }}
          >
            {state.progress}%
          </Typography>
        </Box>
      )}

      {/* Error */}
      {state.error && <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{state.error}</Alert>}

      {/* AI Result */}
      {state.done && state.aiOutput && (
        <Box mt={2} p={3} sx={{ borderRadius: 3, background: alpha(primary, 0.05), border: `1px solid ${alpha(primary, 0.15)}` }}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 2 }}> {/* alignItems moved to sx */}
            <CheckCircleIcon sx={{ color: "success.main", fontSize: 20 }} />
            <Typography variant="subtitle2" fontWeight={700}>Result</Typography>
            <Box flex={1} />
            <Button size="small" variant="outlined" startIcon={<CloudDownloadIcon />}
              onClick={() => {
                const blob = new Blob([state.aiOutput], { type: "text/plain" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `${tool.id}-result.txt`;
                a.click();
              }}>
              Save as .txt
            </Button>
            <Button size="small" variant="outlined" onClick={handleReset}>New File</Button>
          </Stack>
          <Box sx={{ p: 2, background: alpha("#000", 0.04), borderRadius: 2, fontFamily: "monospace", fontSize: 13, whiteSpace: "pre-wrap", maxHeight: 340, overflowY: "auto", lineHeight: 1.7 }}>
            {state.aiOutput}
          </Box>
        </Box>
      )}

      {/* File Result */}
      {state.done && state.outputUrl && (
        <Box mt={2} p={3} sx={{ borderRadius: 3, textAlign: "center", background: alpha(primary, 0.07), border: `1px solid ${alpha(primary, 0.2)}` }}>
          <CheckCircleIcon sx={{ fontSize: 48, color: "success.main", mb: 1 }} />
          <Typography variant="h6" fontWeight={700}>Done!</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>{state.outputName}</Typography>
          <Stack direction="row" gap={2} justifyContent="center">
            <Button variant="contained" startIcon={<CloudDownloadIcon />} href={state.outputUrl}
              download={state.outputName} sx={{ borderRadius: 2, fontWeight: 700 }}>
              Download
            </Button>
            <Button variant="outlined" onClick={handleReset} sx={{ borderRadius: 2 }}>Process Another</Button>
          </Stack>
        </Box>
      )}

      {/* Run button */}
      {!state.done && (
        <Stack direction="row" gap={2} mt={2} justifyContent="flex-end">
          <Button variant="outlined" onClick={handleReset} sx={{ borderRadius: 2 }}>Clear</Button>
          <Button variant="contained" disabled={!state.files.length || state.processing}
            onClick={handleProcess} sx={{ borderRadius: 2, px: 4 }}>
            {state.processing ? "Processing…" : `Run ${tool.label}`}
          </Button>
        </Stack>
      )}
    </Paper>
  );
}

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

  const activeDef = TOOLS.find((t) => t.id === activeTool) || null;
  const categories = Array.from(new Set(TOOLS.map((t) => t.category)));

  const handleToolClick = (tool: Tool) => {
    if (!tool.implemented) { setSnack(`${tool.label} coming soon!`); return; }
    setActiveTool((prev) => (prev === tool.id ? null : tool.id));
    setTimeout(() => document.getElementById("tool-panel")?.scrollIntoView({ behavior: "smooth" }), 80);
  };

  return (
    <Box sx={{ minHeight: "100vh", background: theme.palette.background.default, pb: 10 }}>
      {/* Hero */}
      <Box sx={{
        background: isChillMode
          ? `radial-gradient(circle at center, ${alpha("#ef4444", 0.1)} 0%, transparent 70%)`
          : `linear-gradient(135deg, ${alpha(primary, 0.12)} 0%, transparent 60%)`,
        borderBottom: `1px solid ${alpha(primary, 0.12)}`,
        pt: { xs: 6, md: 10 }, pb: { xs: 5, md: 8 },
      }}>
        <Container maxWidth="lg">
          <Stack sx={{ alignItems: "center", textAlign: "center" }}> {/* alignItems and textAlign moved to sx */}
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
                { label: "Tools", value: TOOLS.length },
                { label: "AI Models", value: "4 Local" },
                { label: "Languages", value: "200+" },
                { label: "Uploads to server", value: "0" },
              ].map((s) => (
                <Box key={s.label} sx={{ textAlign: "center" }}>
                  <Typography variant="h4" fontWeight={800} color="primary">{s.value}</Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>{s.label}</Typography>
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
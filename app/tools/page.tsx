"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Snackbar,
  Divider,
  IconButton,
  Paper,
  Stack,
  useTheme,
  alpha,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Badge,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import UploadFileIcon from "@mui/icons-material/UploadFile";
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
import FindInPageIcon from "@mui/icons-material/FindInPage";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArticleIcon from "@mui/icons-material/Article";
import TableChartIcon from "@mui/icons-material/TableChart";
import SlideshowIcon from "@mui/icons-material/Slideshow";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import WatermarkIcon from "@mui/icons-material/BrandingWatermark";
import NumbersIcon from "@mui/icons-material/Numbers";
import { PDFDocument, degrees, rgb, StandardFonts } from "pdf-lib";
import { useChillMode } from "@/app/providers";
import * as mammoth from "mammoth";
import * as XLSX from "xlsx";

// ─── helpers ──────────────────────────────────────────────────────────────────

function parsePageRange(rangeStr: string, maxPages: number): number[] {
  const pages = new Set<number>();
  const parts = rangeStr.split(/[\s,]+/);
  for (const part of parts) {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map(n => parseInt(n.trim(), 10));
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = Math.max(1, start); i <= Math.min(maxPages, end); i++) {
          pages.add(i - 1);
        }
      }
    } else {
      const n = parseInt(part.trim(), 10);
      if (!isNaN(n) && n >= 1 && n <= maxPages) {
        pages.add(n - 1);
      }
    }
  }
  return Array.from(pages).sort((a, b) => a - b);
}

// ─── types ───────────────────────────────────────────────────────────────────

type ToolId =
  | "merge-pdf"
  | "split-pdf"
  | "rotate-pdf"
  | "compress-pdf"
  | "pdf-to-word"
  | "word-to-pdf"
  | "pdf-to-image"
  | "image-to-pdf"
  | "encrypt-pdf"
  | "decrypt-pdf"
  | "watermark-pdf"
  | "page-numbers"
  | "extract-text"
  | "excel-to-pdf"
  | "pdf-to-excel"
  | "word-to-excel";

interface Tool {
  id: ToolId;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: "pdf" | "convert" | "word" | "office";
  badge?: string;
  implemented: boolean;
  accept: string;
  multiple?: boolean;
}

interface FileState {
  file: File | null;
  files: File[];
  processing: boolean;
  progress: number;
  done: boolean;
  error: string;
  outputUrl: string;
  outputName: string;
}

// ─── tool definitions ─────────────────────────────────────────────────────────

const TOOLS: Tool[] = [
  // PDF Tools
  {
    id: "merge-pdf",
    label: "Merge PDF",
    description: "Combine multiple PDFs into one document",
    icon: <MergeIcon />,
    category: "pdf",
    implemented: true,
    accept: ".pdf",
    multiple: true,
  },
  {
    id: "split-pdf",
    label: "Split PDF",
    description: "Split a PDF into individual pages",
    icon: <ContentCutIcon />,
    category: "pdf",
    implemented: true,
    accept: ".pdf",
  },
  {
    id: "rotate-pdf",
    label: "Rotate PDF",
    description: "Rotate PDF pages 90°, 180°, or 270°",
    icon: <RotateRightIcon />,
    category: "pdf",
    implemented: true,
    accept: ".pdf",
  },
  {
    id: "compress-pdf",
    label: "Compress PDF",
    description: "Reduce PDF file size while keeping quality",
    icon: <CompressIcon />,
    category: "pdf",
    badge: "Popular",
    implemented: true,
    accept: ".pdf",
  },
  {
    id: "encrypt-pdf",
    label: "Protect PDF",
    description: "Password-protect your PDF document",
    icon: <LockIcon />,
    category: "pdf",
    implemented: true,
    accept: ".pdf",
  },
  {
    id: "decrypt-pdf",
    label: "Unlock PDF",
    description: "Remove password protection from PDF",
    icon: <LockOpenIcon />,
    category: "pdf",
    implemented: true,
    accept: ".pdf",
  },
  {
    id: "watermark-pdf",
    label: "Watermark PDF",
    description: "Add text watermark to every PDF page",
    icon: <WatermarkIcon />,
    category: "pdf",
    implemented: true,
    accept: ".pdf",
  },
  {
    id: "page-numbers",
    label: "Add Page Numbers",
    description: "Insert page numbers into your PDF",
    icon: <NumbersIcon />,
    category: "pdf",
    implemented: true,
    accept: ".pdf",
  },
  // Convert Tools
  {
    id: "pdf-to-word",
    label: "PDF → Word",
    description: "Convert PDF text into a Word document",
    icon: <SwapHorizIcon />,
    category: "convert",
    badge: "New",
    implemented: true,
    accept: ".pdf",
  },
  {
    id: "word-to-pdf",
    label: "Word → PDF",
    description: "Convert .docx to a downloadable PDF",
    icon: <PictureAsPdfIcon />,
    category: "convert",
    implemented: true,
    accept: ".docx",
  },
  {
    id: "pdf-to-image",
    label: "PDF → Image",
    description: "Convert first page of PDF to PNG image",
    icon: <ImageIcon />,
    category: "convert",
    implemented: true,
    accept: ".pdf",
  },
  {
    id: "image-to-pdf",
    label: "Image → PDF",
    description: "Wrap images into a PDF document",
    icon: <PictureAsPdfIcon />,
    category: "convert",
    implemented: true,
    accept: "image/*",
    multiple: true,
  },
  {
    id: "excel-to-pdf",
    label: "Excel → PDF",
    description: "Convert spreadsheet data to PDF table",
    icon: <TableChartIcon />,
    category: "office",
    implemented: true,
    accept: ".xlsx,.xls,.csv",
  },
  {
    id: "pdf-to-excel",
    label: "PDF → Excel",
    description: "Extract tables from PDF to CSV/Excel",
    icon: <TableChartIcon />,
    category: "office",
    implemented: true,
    accept: ".pdf",
  },
  {
    id: "extract-text",
    label: "Extract Text",
    description: "Pull all text from any PDF as .txt",
    icon: <TextFieldsIcon />,
    category: "pdf",
    implemented: true,
    accept: ".pdf",
  },
  {
    id: "word-to-excel",
    label: "Word → Excel",
    description: "Extract tables from .docx into CSV",
    icon: <ArticleIcon />,
    category: "office",
    implemented: true,
    accept: ".docx",
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  pdf: "PDF Tools",
  convert: "Convert",
  word: "Word Tools",
  office: "Office Conversion",
};

const PYTHON_API_BASE = "http://localhost:8000";

// ─── processors ──────────────────────────────────────────────────────────────

async function processTool(
  id: ToolId,
  files: File[],
  onProgress: (p: number) => void,
  isChillMode: boolean,
  params: Record<string, any>
): Promise<{ blob: Blob; name: string }> {
  const file = files[0];

  switch (id) {
    // ── COMPRESS PDF ─────────────────────────────────────────────────────
    case "compress-pdf": {
      onProgress(10);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("compressionLevel", params.compressionLevel || "medium");

      const response = await fetch(`${PYTHON_API_BASE}/compress-pdf`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to compress PDF");
      }

      onProgress(90);
      const blob = await response.blob();
      return { blob, name: `compressed-${file.name}` };
    }

    // ── PDF TO IMAGE ─────────────────────────────────────────────────────
    case "pdf-to-image": {
      onProgress(10);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${PYTHON_API_BASE}/pdf-to-image`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to convert PDF to Image");
      }

      onProgress(90);
      const blob = await response.blob();
      return { blob, name: file.name.replace(/\.pdf$/i, ".png") };
    }

    // ── PDF TO EXCEL ─────────────────────────────────────────────────────
    case "pdf-to-excel": {
      onProgress(10);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${PYTHON_API_BASE}/pdf-to-excel`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to extract Excel data");
      }

      onProgress(90);
      const blob = await response.blob();
      return { blob, name: file.name.replace(/\.pdf$/i, ".xlsx") };
    }

    // ── PDF TO WORD ──────────────────────────────────────────────────────
    case "pdf-to-word": {
      onProgress(10);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${PYTHON_API_BASE}/pdf-to-word`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to convert PDF to Word");
      }

      onProgress(90);
      const blob = await response.blob();
      return { blob, name: file.name.replace(/\.pdf$/i, ".docx") };
    }

    // ── PROTECT PDF ───────────────────────────────────────────────────────
    case "encrypt-pdf": {
      onProgress(10);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("password", params.password || "");

      const response = await fetch(`${PYTHON_API_BASE}/protect-pdf`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to protect PDF");
      }

      onProgress(90);
      const blob = await response.blob();
      return { blob, name: `protected-${file.name}` };
    }

    // ── EXTRACT TEXT ──────────────────────────────────────────────────────
    case "extract-text": {
      onProgress(10);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${PYTHON_API_BASE}/extract-text`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to extract text");
      }

      onProgress(90);
      const blob = await response.blob();
      return { blob, name: file.name.replace(/\.pdf$/i, ".txt") };
    }

    // ── UNLOCK PDF ───────────────────────────────────────────────────────
    case "decrypt-pdf": {
      onProgress(10);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("password", params.password || "");

      const response = await fetch(`${PYTHON_API_BASE}/unlock-pdf`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to unlock PDF");
      }

      onProgress(90);
      const blob = await response.blob();
      return { blob, name: `unlocked-${file.name}` };
    }

    // ── MERGE PDF ──────────────────────────────────────────────────────────
    case "merge-pdf": {
      const merged = await PDFDocument.create();
      for (let i = 0; i < files.length; i++) {
        const bytes = await files[i].arrayBuffer();
        const doc = await PDFDocument.load(bytes);
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
        onProgress(Math.round(((i + 1) / files.length) * 90));
      }
      const pdfBytes = await merged.save();
      return { blob: new Blob([pdfBytes], { type: "application/pdf" }), name: "merged.pdf" };
    }

    // ── SPLIT PDF ──────────────────────────────────────────────────────────
    case "split-pdf": {
      const bytes = await file.arrayBuffer();
      const src = await PDFDocument.load(bytes);
      const total = src.getPageCount();
      const range = params.range || "1";
      const pageIndices = parsePageRange(range, total);
      
      if (pageIndices.length === 0) throw new Error("Invalid page range specified.");

      const single = await PDFDocument.create();
      const copiedPages = await single.copyPages(src, pageIndices);
      copiedPages.forEach((p) => single.addPage(p));
      
      onProgress(50);
      const out = await single.save();
      onProgress(90);
      return {
        blob: new Blob([out], { type: "application/pdf" }),
        name: `split-${file.name}`,
      };
    }

    // ── ROTATE PDF ────────────────────────────────────────────────────────
    case "rotate-pdf": {
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const angle = parseInt(params.angle, 10) || 90;
      const pages = doc.getPages();
      pages.forEach((p, i) => {
        p.setRotation(degrees((p.getRotation().angle + angle) % 360));
        onProgress(Math.round(((i + 1) / pages.length) * 80));
      });
      const out = await doc.save();
      return { blob: new Blob([out], { type: "application/pdf" }), name: "rotated.pdf" };
    }

    // ── WATERMARK PDF ─────────────────────────────────────────────────────
    case "watermark-pdf": {
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const pages = doc.getPages();
      const watermarkText = params.watermarkText || "CONFIDENTIAL";

      pages.forEach((page, i) => {
        const { width, height } = page.getSize();
        page.drawText(watermarkText, {
          x: width / 2 - 120,
          y: height / 2,
          size: 48,
          color: isChillMode ? rgb(0.94, 0.27, 0.27) : rgb(0.06, 0.72, 0.5),
          opacity: 0.25,
          rotate: degrees(45),
        });
        onProgress(Math.round(((i + 1) / pages.length) * 85));
      });
      const out = await doc.save();
      return { blob: new Blob([out], { type: "application/pdf" }), name: "watermarked.pdf" };
    }

    // ── ADD PAGE NUMBERS ──────────────────────────────────────────────────
    case "page-numbers": {
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const pages = doc.getPages();
      pages.forEach((page, i) => {
        const { width } = page.getSize();
        page.drawText(`${i + 1} / ${pages.length}`, {
          x: width / 2 - 20,
          y: 20,
          size: 10,
          color: rgb(0.4, 0.4, 0.4),
        });
        onProgress(Math.round(((i + 1) / pages.length) * 85));
      });
      const out = await doc.save();
      return { blob: new Blob([out], { type: "application/pdf" }), name: "numbered.pdf" };
    }

    // ── WORD → PDF ────────────────────────────────────────────────────────
    case "word-to-pdf": {
      const arrayBuffer = await file.arrayBuffer();
      onProgress(30);
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value;
      onProgress(60);
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const lines = text.split("\n");
      let page = doc.addPage([612, 792]); // Letter size
      const { height } = page.getSize();
      let y = height - 50;
      const lineH = 14;
      for (const line of lines) {
        if (y < 50) {
          page = doc.addPage([595, 842]);
          y = height - 50;
        }
        const safe = line.replace(/[^\x20-\x7E]/g, " ").slice(0, 90);
        page.drawText(safe, { x: 50, y, size: 11, font, color: rgb(0.05, 0.05, 0.05) });
        y -= lineH;
      }
      onProgress(85);
      const out = await doc.save();
      return {
        blob: new Blob([out], { type: "application/pdf" }),
        name: file.name.replace(".docx", ".pdf"),
      };
    }

    // ── IMAGE → PDF ────────────────────────────────────────────────────────
    case "image-to-pdf": {
      const doc = await PDFDocument.create();
      for (let i = 0; i < files.length; i++) {
        const imgBytes = await files[i].arrayBuffer();
        const mime = files[i].type;
        let img;
        if (mime === "image/png") img = await doc.embedPng(imgBytes);
        else img = await doc.embedJpg(imgBytes);
        const page = doc.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
        onProgress(Math.round(((i + 1) / files.length) * 85));
      }
      const out = await doc.save();
      return { blob: new Blob([out], { type: "application/pdf" }), name: "images.pdf" };
    }

    // ── EXCEL → PDF ────────────────────────────────────────────────────────
    case "excel-to-pdf": {
      const bytes = await file.arrayBuffer();
      onProgress(20);
      const wb = XLSX.read(bytes, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1 }) as string[][];
      onProgress(50);
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
      let page = doc.addPage([842, 595]);
      const { height } = page.getSize();
      let y = height - 50;
      const colW = 100;
      const rowH = 18;
      rows.forEach((row, ri) => {
        if (y < 50) { page = doc.addPage([842, 595]); y = height - 50; }
        row.slice(0, 8).forEach((cell, ci) => {
          const val = String(cell ?? "").slice(0, 14);
          page.drawText(val, {
            x: 40 + ci * colW,
            y,
            size: 10,
            font: ri === 0 ? boldFont : font,
            color: rgb(0.05, 0.05, 0.05),
          });
        });
        y -= rowH;
        onProgress(50 + Math.round((ri / rows.length) * 35));
      });
      const out = await doc.save();
      return {
        blob: new Blob([out], { type: "application/pdf" }),
        name: file.name.replace(/\.(xlsx?|csv)$/, ".pdf"),
      };
    }

    // ── WORD → EXCEL (CSV) ────────────────────────────────────────────────
    case "word-to-excel": {
      const arrayBuffer = await file.arrayBuffer();
      onProgress(30);
      const result = await mammoth.extractRawText({ arrayBuffer });
      onProgress(60);
      const lines = result.value.split("\n").filter((l) => l.trim());
      const csv = lines.map((l) => `"${l.replace(/"/g, '""')}"`).join("\n");
      return {
        blob: new Blob([csv], { type: "text/csv" }),
        name: file.name.replace(".docx", ".csv"),
      };
    }

    default:
      throw new Error("Tool not implemented");
  }
}

// ─── DropZone ────────────────────────────────────────────────────────────────

function DropZone({
  tool,
  fileState,
  onFiles,
}: {
  tool: Tool;
  fileState: FileState;
  onFiles: (files: File[]) => void;
}) {
  const theme = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const primary = theme.palette.primary.main;

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const dt = e.dataTransfer.files;
      if (dt.length) onFiles(Array.from(dt));
    },
    [onFiles]
  );

  return (
    <Paper
      variant="outlined"
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      sx={{
        border: `2px dashed ${dragging ? primary : alpha(primary, 0.35)}`,
        borderRadius: 3,
        p: 5,
        textAlign: "center",
        cursor: "pointer",
        transition: "all 0.2s",
        background: dragging ? alpha(primary, 0.06) : "transparent",
        "&:hover": { borderColor: primary, background: alpha(primary, 0.04) },
      }}
    >
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={tool.accept}
        multiple={tool.multiple}
        onChange={(e) => e.target.files && onFiles(Array.from(e.target.files))}
      />
      <UploadFileIcon sx={{ fontSize: 48, color: primary, mb: 1, opacity: 0.8 }} />
      <Typography variant="h6" fontWeight={600}>
        Drop files here
      </Typography>
      <Typography variant="body2" color="text.secondary" mt={0.5}>
        or click to browse &nbsp;·&nbsp; {tool.accept}
        {tool.multiple ? " (multiple)" : ""}
      </Typography>
    </Paper>
  );
}

// ─── ToolModal (inline panel) ─────────────────────────────────────────────────

function ToolPanel({
  tool,
  onClose,
}: {
  tool: Tool;
  onClose: () => void;
}) {
  const theme = useTheme();
  const { isChillMode } = useChillMode();
  const primary = theme.palette.primary.main;

  const initState = (): FileState => ({
    file: null,
    files: [],
    processing: false,
    progress: 0,
    done: false,
    error: "",
    outputUrl: "",
    outputName: "",
  });

  const [state, setState] = useState<FileState>(initState());
  const [params, setParams] = useState<Record<string, any>>({
    angle: 90,
    range: "1",
    password: "",
    watermarkText: "CONFIDENTIAL",
    compressionLevel: "medium",
  });

  const handleFiles = (files: File[]) => {
    setState((s) => ({ ...s, file: files[0], files, done: false, error: "", outputUrl: "" }));
  };

  const handleProcess = async () => {
    if (!state.files.length) return;
    setState((s) => ({ ...s, processing: true, progress: 0, error: "" }));
    try {
      const { blob, name } = await processTool(
        tool.id,
        state.files,
        (p) => setState((s) => ({ ...s, progress: p })),
        isChillMode,
        params
      );
      const url = URL.createObjectURL(blob);
      setState((s) => ({ ...s, processing: false, progress: 100, done: true, outputUrl: url, outputName: name }));
    } catch (e: unknown) {
      setState((s) => ({
        ...s,
        processing: false,
        error: e instanceof Error ? e.message : "Processing failed",
      }));
    }
  };

  const handleReset = () => setState(initState());

  return (
    <Paper
      elevation={0}
      sx={{
        border: `1px solid ${alpha(primary, 0.15)}`,
        borderRadius: 5,
        p: { xs: 3, md: 5 },
        background: isChillMode ? alpha("#000", 0.4) : alpha(theme.palette.background.paper, 0.8),
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Stack direction="row" alignItems="center" gap={2}>
          <Box
            sx={{
              width: 40, height: 40, borderRadius: 2,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: alpha(primary, 0.12), color: primary,
            }}
          >
            {tool.icon}
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700} lineHeight={1.1}>{tool.label}</Typography>
            <Typography variant="caption" color="text.secondary">{tool.description}</Typography>
          </Box>
        </Stack>
        <IconButton size="small" onClick={onClose}>✕</IconButton>
      </Stack>

      {/* Drop Zone */}
      {!state.done && (
        <DropZone tool={tool} fileState={state} onFiles={handleFiles} />
      )}

      {/* Tool Options */}
      {state.files.length > 0 && !state.done && (
        <Box sx={{ mt: 3, p: 2, bgcolor: alpha(primary, 0.03), borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight={700} mb={2}>Tool Options</Typography>
          <Grid container spacing={2}>
            {tool.id === "compress-pdf" && (
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel id="compress-label">Compression Level</InputLabel>
                  <Select
                    labelId="compress-label"
                    label="Compression Level"
                    value={params.compressionLevel || "medium"}
                    onChange={(e) => setParams(p => ({ ...p, compressionLevel: e.target.value }))}
                  >
                    <MenuItem value="low">Low Compression (Highest Clarity)</MenuItem>
                    <MenuItem value="medium">Medium Compression (Balanced Clarity & Size)</MenuItem>
                    <MenuItem value="high">High Compression (Smallest Size, Lower Clarity)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            {tool.id === "watermark-pdf" && (
              <Grid item xs={12}>
                <TextField 
                  fullWidth size="small" label="Watermark Text" 
                  value={params.watermarkText || ""} 
                  onChange={(e) => setParams(p => ({ ...p, watermarkText: e.target.value }))}
                  placeholder="e.g., CONFIDENTIAL, DRAFT, DO NOT COPY"
                />
              </Grid>
            )}
            {tool.id === "split-pdf" && (
              <Grid item xs={12}>
                <TextField 
                  fullWidth size="small" label="Page Range (e.g. 1-3, 5)" 
                  value={params.range || ""} 
                  onChange={(e) => setParams(p => ({ ...p, range: e.target.value }))}
                  helperText="Enter pages to extract, separated by commas or ranges."
                />
              </Grid>
            )}
            {tool.id === "rotate-pdf" && (
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel id="rotate-label">Rotation Angle</InputLabel>
                  <Select
                    labelId="rotate-label"
                    label="Rotation Angle"
                    value={params.angle || 90}
                    onChange={(e) => setParams(p => ({ ...p, angle: e.target.value }))}
                  >
                    <MenuItem value={90}>90° Clockwise</MenuItem>
                    <MenuItem value={180}>180°</MenuItem>
                    <MenuItem value={270}>270° Clockwise</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            {(tool.id === "encrypt-pdf" || tool.id === "decrypt-pdf") && (
              <Grid item xs={12}>
                <TextField 
                  fullWidth size="small" type="password" label="Password" 
                  value={params.password || ""} 
                  onChange={(e) => setParams(p => ({ ...p, password: e.target.value }))}
                />
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
                setState((s) => ({
                  ...s,
                  files: s.files.filter((_, j) => j !== i),
                  file: s.files.filter((_, j) => j !== i)[0] || null,
                }))
              }>
                <DeleteIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Stack>
          ))}
        </Stack>
      )}

      {/* Progress */}
      {state.processing && (
        <Box mt={2}>
          <LinearProgress variant="determinate" value={state.progress} sx={{ borderRadius: 4, height: 6 }} />
          <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
            Processing… {state.progress}%
          </Typography>
        </Box>
      )}

      {/* Error */}
      {state.error && (
        <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{state.error}</Alert>
      )}

      {/* Done */}
      {state.done && (
        <Box
          sx={{
            mt: 2, p: 3, borderRadius: 3, textAlign: "center",
            background: alpha(primary, 0.07), border: `1px solid ${alpha(primary, 0.2)}`,
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 48, color: primary, mb: 1 }} />
          <Typography variant="h6" fontWeight={700}>Done!</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>{state.outputName}</Typography>
          <Stack direction="row" gap={2} justifyContent="center">
            <Button
              variant="contained"
              startIcon={<CloudDownloadIcon />}
              href={state.outputUrl}
              download={state.outputName}
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              Download
            </Button>
            <Button variant="outlined" onClick={handleReset} sx={{ borderRadius: 2 }}>
              Process Another
            </Button>
          </Stack>
        </Box>
      )}

      {/* Action */}
      {!state.done && (
        <Stack direction="row" gap={2} mt={2} justifyContent="flex-end">
          <Button variant="outlined" onClick={handleReset} sx={{ borderRadius: 2 }}>
            Clear
          </Button>
          <Button
            variant="contained"
            disabled={!state.files.length || state.processing}
            onClick={handleProcess}
            sx={{ borderRadius: 2, px: 4 }}
          >
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

  return (
    <Card
      elevation={0}
      sx={{
        border: `1px solid ${active ? primary : alpha(theme.palette.divider, 0.1)}`,
        borderRadius: 4,
        background: active ? alpha(primary, 0.06) : theme.palette.background.paper,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          borderColor: primary,
          transform: "translateY(-4px)",
          boxShadow: `0 12px 24px -10px ${alpha(primary, 0.3)}`,
          "& .tool-icon-box": {
            background: primary,
            color: '#fff',
            transform: 'scale(1.1)',
          }
        },
      }}
    >
      <CardActionArea onClick={onClick} sx={{ p: 0 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
            <Box className="tool-icon-box"
              sx={{
                width: 44, height: 44, borderRadius: 2,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.3s ease",
                background: alpha(primary, 0.12), color: primary,
              }}
            >
              {tool.icon}
            </Box>
            {tool.badge && (
              <Chip
                label={tool.badge}
                size="small"
                sx={{
                  fontSize: 10, height: 20, fontWeight: 700,
                  background: alpha(primary, 0.15), color: primary,
                }}
              />
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
    if (!tool.implemented) {
      setSnack(`${tool.label} coming soon!`);
      return;
    }
    setActiveTool((prev) => (prev === tool.id ? null : tool.id));
    // scroll to panel
    setTimeout(() => document.getElementById("tool-panel")?.scrollIntoView({ behavior: "smooth" }), 80);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: theme.palette.background.default,
        pb: 10,
      }}
    >
      {/* Hero */}
      <Box
        sx={{
          background: isChillMode 
            ? `radial-gradient(circle at center, ${alpha("#ef4444", 0.1)} 0%, transparent 70%)`
            : `linear-gradient(135deg, ${alpha(primary, 0.12)} 0%, transparent 60%)`,
          borderBottom: `1px solid ${alpha(primary, 0.12)}`,
          pt: { xs: 6, md: 10 },
          pb: { xs: 5, md: 8 },
        }}
      >
        <Container maxWidth="lg">
          <Stack alignItems="center" sx={{ textAlign: "center" }}>
            <Chip
              label="Office Document Suite"
              size="small"
              sx={{
                mb: 2, fontWeight: 700, fontSize: 11,
                background: alpha(primary, 0.12), color: primary,
                border: `1px solid ${alpha(primary, 0.25)}`,
              }}
            />
            <Typography
              variant="h2"
              fontWeight={800}
              sx={{
                fontSize: { xs: "2.5rem", md: "4rem" },
                letterSpacing: "-0.04em",
                background: isChillMode 
                  ? `linear-gradient(135deg, #ef4444, ${isDark ? '#fff' : '#000'})`
                  : `linear-gradient(135deg, ${primary}, ${theme.palette.text.primary})`,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
                mb: 1,
              }}
            >
              Document Tools
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              fontWeight={400}
              sx={{ maxWidth: 600, lineHeight: 1.6 }}
            >
              All the PDF and Office tools your team needs — running locally in your browser.
              <Box component="span" sx={{ display: 'block', mt: 1, fontWeight: 700, color: 'text.primary' }}>No uploads. No servers. Complete privacy.</Box>
            </Typography>

            {/* Stats */}
            <Stack direction="row" gap={4} mt={5}>
              {[
                { label: "Tools", value: TOOLS.length },
                { label: "Formats", value: "8+" },
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
        {/* Tool Panel */}
        {activeDef && (
          <Box id="tool-panel" mb={5}>
            <ToolPanel key={activeDef.id} tool={activeDef} onClose={() => setActiveTool(null)} />
          </Box>
        )}

        {/* Categories */}
        {categories.map((cat) => {
          const catTools = TOOLS.filter((t) => t.category === cat);
          return (
            <Box key={cat} mb={8}>
              <Stack direction="row" alignItems="center" gap={2} mb={4}>
                <Box sx={{ 
                  p: 1, borderRadius: 1.5, 
                  bgcolor: alpha(primary, 0.1), color: primary, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                  <DescriptionIcon sx={{ fontSize: 20 }} />
                </Box>
                <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: -0.5 }}>
                  {CATEGORY_LABELS[cat]}
                </Typography>
                <Box sx={{ flex: 1, height: '1px', bgcolor: alpha(theme.palette.divider, 0.1) }} />
                <Chip 
                  label={`${catTools.length} Tools Available`} 
                  size="small" 
                  sx={{ fontWeight: 600, bgcolor: 'transparent', border: `1px solid ${alpha(primary, 0.2)}` }} 
                />
              </Stack>
              <Grid container spacing={2.5} columns={12}>
                {catTools.map((tool) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={tool.id}>
                    <ToolCard
                      tool={tool}
                      active={activeTool === tool.id}
                      onClick={() => handleToolClick(tool)}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          );
        })}

        {/* Footer note */}
        <Paper
          elevation={0}
          sx={{
            mt: 2, p: 3, borderRadius: 3,
            background: alpha(primary, 0.05),
            border: `1px solid ${alpha(primary, 0.12)}`,
            textAlign: "center",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            All processing happens entirely in your browser using{" "}
            <strong>pdf-lib</strong>, <strong>mammoth.js</strong>, and <strong>SheetJS</strong>.
            Files never leave your device.
          </Typography>
        </Paper>
      </Container>

      <Snackbar
        open={!!snack}
        autoHideDuration={3000}
        onClose={() => setSnack("")}
        message={snack}
      />
    </Box>
  );
}
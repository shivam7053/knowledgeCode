import React from "react";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import MergeIcon from "@mui/icons-material/Merge";
import ContentCutIcon from "@mui/icons-material/ContentCut";
import RotateRightIcon from "@mui/icons-material/RotateRight";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import CompressIcon from "@mui/icons-material/Compress";
import ImageIcon from "@mui/icons-material/Image";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import TableChartIcon from "@mui/icons-material/TableChart";
import WatermarkIcon from "@mui/icons-material/BrandingWatermark";
import NumbersIcon from "@mui/icons-material/Numbers";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";

export type ToolId =
  | "merge-pdf" | "split-pdf" | "rotate-pdf" | "compress-pdf"
  | "pdf-to-word" | "word-to-pdf" | "pdf-to-image" | "image-to-pdf"
  | "encrypt-pdf" | "decrypt-pdf" | "watermark-pdf" | "page-numbers"
  | "extract-text" | "excel-to-pdf" | "pdf-to-excel" | "word-to-excel"
  | "ai-summarize" | "ai-sentiment" | "ai-qa";

export interface Tool {
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

export interface FileState {
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

export const TOOLS: Tool[] = [
  { id: "merge-pdf", label: "Merge PDF", description: "Combine multiple PDFs", icon: <MergeIcon />, category: "pdf", implemented: true, accept: ".pdf", multiple: true },
  { id: "split-pdf", label: "Split PDF", description: "Extract pages", icon: <ContentCutIcon />, category: "pdf", implemented: true, accept: ".pdf" },
  { id: "rotate-pdf", label: "Rotate PDF", description: "Rotate 90/180/270", icon: <RotateRightIcon />, category: "pdf", implemented: true, accept: ".pdf" },
  { id: "compress-pdf", label: "Compress PDF", description: "Reduce size", icon: <CompressIcon />, category: "pdf", implemented: true, accept: ".pdf" },
  { id: "encrypt-pdf", label: "Protect PDF", description: "Add password", icon: <LockIcon />, category: "pdf", implemented: true, accept: ".pdf" },
  { id: "decrypt-pdf", label: "Unlock PDF", description: "Remove password", icon: <LockOpenIcon />, category: "pdf", implemented: true, accept: ".pdf" },
  { id: "watermark-pdf", label: "Watermark PDF", description: "Add text stamp", icon: <WatermarkIcon />, category: "pdf", implemented: true, accept: ".pdf" },
  { id: "page-numbers", label: "Add Page Numbers", description: "Insert numbers", icon: <NumbersIcon />, category: "pdf", implemented: true, accept: ".pdf" },
  { id: "extract-text", label: "Extract Text", description: "PDF to TXT", icon: <TextFieldsIcon />, category: "pdf", implemented: true, accept: ".pdf" },
  { id: "pdf-to-word", label: "PDF → Word", description: "Convert to DOCX", icon: <SwapHorizIcon />, category: "convert", implemented: true, accept: ".pdf" },
  { id: "word-to-pdf", label: "Word → PDF", description: "Convert to PDF", icon: <PictureAsPdfIcon />, category: "convert", implemented: true, accept: ".docx" },
  { id: "pdf-to-image", label: "PDF → Image", description: "Convert to PNG", icon: <ImageIcon />, category: "convert", implemented: true, accept: ".pdf" },
  { id: "image-to-pdf", label: "Image → PDF", description: "Wrap images to PDF", icon: <PictureAsPdfIcon />, category: "convert", implemented: true, accept: "image/*", multiple: true },
  { id: "excel-to-pdf", label: "Excel → PDF", description: "Sheet to PDF", icon: <TableChartIcon />, category: "office", implemented: true, accept: ".xlsx,.xls,.csv" },
  { id: "ai-summarize", label: "AI Summarize", description: "Local AI summary", icon: <AutoAwesomeIcon />, category: "ai", implemented: true, accept: ".pdf,.txt,.docx" },
  { id: "ai-qa", label: "Ask Document", description: "Local AI Q&A", icon: <QuestionAnswerIcon />, category: "ai", implemented: true, accept: ".pdf,.txt,.docx" },
];

export const CATEGORY_LABELS: Record<string, string> = {
  pdf: "PDF Tools",
  convert: "Convert",
  office: "Office Conversion",
  ai: "Local AI Tools",
};

export function parsePageRange(rangeStr: string, maxPages: number): number[] {
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

export async function extractDocumentText(file: File): Promise<string> {
  return await file.text();
}

export async function runAISummarize(text: string, onProgress: (p: number, msg: string) => void): Promise<string> {
  const formData = new FormData();
  formData.append("text", text);
  const resp = await fetch(`http://localhost:8000/ai/summarize`, { method: "POST", body: formData });
  const data = await resp.json();
  return data.result;
}

export async function runAIQA(context: string, question: string, onProgress: (p: number, msg: string) => void): Promise<string> {
  const formData = new FormData();
  formData.append("context", context);
  formData.append("question", question);
  const resp = await fetch(`http://localhost:8000/ai/qa`, { method: "POST", body: formData });
  const data = await resp.json();
  return data.result;
}
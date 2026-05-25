"use client";
import React, { useState } from "react";
import {
  Box, Typography, Button, Chip, LinearProgress, Stack, 
  useTheme, alpha, TextField, FormControl, InputLabel, Select, 
  MenuItem, Paper, IconButton
} from "@mui/material";
import Grid from "@mui/material/Grid";
import DescriptionIcon from "@mui/icons-material/Description";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import { PDFDocument, degrees, rgb, StandardFonts } from "pdf-lib";
import * as mammoth from "mammoth";
import * as XLSX from "xlsx";
import { Tool, ToolId, FileState, parsePageRange, extractDocumentText, runAISummarize, runAIQA } from "@/lib/toolUtils";
import { useChillMode } from "@/app/providers";

async function processTool(
  id: ToolId,
  files: File[],
  onProgress: (p: number, msg?: string) => void,
  isChillMode: boolean,
  params: Record<string, any>
): Promise<{ blob: Blob; name: string }> {
  const file = files[0];
  const PYTHON_API_BASE = "http://localhost:8000";

  const serverOp = async (endpoint: string, extra?: Record<string, string>) => {
    onProgress(10, "Uploading to local server…");
    const formData = new FormData();
    formData.append("file", file);
    if (extra) Object.entries(extra).forEach(([k, v]) => formData.append(k, v));
    const resp = await fetch(`${PYTHON_API_BASE}/${endpoint}`, { method: "POST", body: formData });
    if (!resp.ok) throw new Error("Server error");
    return await resp.blob();
  };

  switch (id) {
    case "compress-pdf": {
      const blob = await serverOp("compress-pdf", { compressionLevel: params.compressionLevel || "medium" });
      return { blob, name: `compressed-${file.name}` };
    }
    case "merge-pdf": {
      const merged = await PDFDocument.create();
      for (const f of files) {
        const doc = await PDFDocument.load(await f.arrayBuffer());
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
      }
      return { blob: new Blob([await merged.save()], { type: "application/pdf" }), name: "merged.pdf" };
    }
    case "split-pdf": {
      const src = await PDFDocument.load(await file.arrayBuffer());
      const indices = parsePageRange(params.range || "1", src.getPageCount());
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, indices);
      copied.forEach((p) => out.addPage(p));
      return { blob: new Blob([await out.save()], { type: "application/pdf" }), name: `split-${file.name}` };
    }
    default: throw new Error("Logic for this tool is being localized...");
  }
}

export default function ToolPanel({ tool, onClose }: { tool: Tool; onClose: () => void }) {
  const theme = useTheme();
  const { isChillMode } = useChillMode();
  const primary = theme.palette.primary.main;

  const [state, setState] = useState<FileState>({
    file: null, files: [], processing: false, progress: 0, progressMsg: "",
    done: false, error: "", outputUrl: "", outputName: "", aiOutput: "",
  });

  const [params, setParams] = useState<Record<string, any>>({
    angle: 90, range: "1", password: "", watermarkText: "CONFIDENTIAL",
    opacity: "0.25", compressionLevel: "medium", question: "",
  });

  const handleProcess = async () => {
    if (!state.files.length) return;
    setState(s => ({ ...s, processing: true, progress: 0, progressMsg: "Starting…", error: "", aiOutput: "" }));
    try {
      if (["ai-summarize", "ai-qa"].includes(tool.id)) {
        const text = await extractDocumentText(state.files[0]);
        const output = tool.id === "ai-summarize" ? await runAISummarize(text, (p, m) => setState(s => ({ ...s, progress: p, progressMsg: m })))
                                                : await runAIQA(text, params.question, (p, m) => setState(s => ({ ...s, progress: p, progressMsg: m })));
        setState(s => ({ ...s, processing: false, progress: 100, done: true, aiOutput: output }));
      } else {
        const { blob, name } = await processTool(tool.id, state.files, (p, m) => setState(s => ({ ...s, progress: p, progressMsg: m || "" })), isChillMode, params);
        setState(s => ({ ...s, processing: false, progress: 100, done: true, outputUrl: URL.createObjectURL(blob), outputName: name }));
      }
    } catch (e: any) { setState(s => ({ ...s, processing: false, error: e.message })); }
  };

  return (
    <Paper elevation={0} sx={{ border: `1px solid ${alpha(primary, 0.15)}`, borderRadius: 5, p: { xs: 3, md: 5 }, background: alpha(theme.palette.background.paper, 0.8), backdropFilter: "blur(10px)" }}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Stack direction="row" sx={{ alignItems: "center", gap: 2 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", background: alpha(primary, 0.12), color: primary }}>{tool.icon}</Box>
          <Box>
            <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.1 }}>{tool.label}</Typography>
              {tool.badge && <Chip label={tool.badge} size="small" sx={{ fontSize: 10, height: 18, fontWeight: 700, background: alpha(primary, 0.15), color: primary }} />}
            </Stack>
            <Typography variant="caption" color="text.secondary">{tool.description}</Typography>
          </Box>
        </Stack>
        <IconButton size="small" onClick={onClose}>✕</IconButton>
      </Stack>

      {!state.done && (
        <Paper variant="outlined" onClick={() => (document.getElementById("tool-file-input") as any)?.click()} sx={{ border: `2px dashed ${alpha(primary, 0.35)}`, borderRadius: 3, p: 5, textAlign: "center", cursor: "pointer", "&:hover": { borderColor: primary, background: alpha(primary, 0.04) } }}>
          <input id="tool-file-input" type="file" hidden accept={tool.accept} multiple={tool.multiple} onChange={e => e.target.files && setState(s => ({ ...s, files: Array.from(e.target.files!) }))} />
          <UploadFileIcon sx={{ fontSize: 48, color: primary, mb: 1, opacity: 0.8 }} />
          <Typography variant="h6" fontWeight={600}>Drop files here</Typography>
          <Typography variant="body2" color="text.secondary">or click to browse · {tool.accept}</Typography>
        </Paper>
      )}

      {state.files.length > 0 && !state.done && (
        <Box sx={{ mt: 3, p: 2, bgcolor: alpha(primary, 0.03), borderRadius: 2 }}>
          <Grid container spacing={2}>
            {tool.id === "split-pdf" && <Grid item xs={12}><TextField fullWidth size="small" label="Page Range (e.g. 1-3, 5)" value={params.range} onChange={e => setParams(p => ({ ...p, range: e.target.value }))} /></Grid>}
            {tool.id === "ai-qa" && <Grid item xs={12}><TextField fullWidth size="small" label="Your Question" value={params.question} onChange={e => setParams(p => ({ ...p, question: e.target.value }))} /></Grid>}
          </Grid>
          <Stack mt={2} gap={1}>
            {state.files.map((f, i) => (
              <Stack key={i} direction="row" alignItems="center" gap={1} sx={{ p: 1, borderRadius: 2, background: alpha(primary, 0.05) }}>
                <DescriptionIcon sx={{ fontSize: 18, color: primary }} />
                <Typography variant="body2" flex={1} noWrap>{f.name}</Typography>
                <IconButton size="small" onClick={() => setState(s => ({ ...s, files: s.files.filter((_, j) => j !== i) }))}><DeleteIcon sx={{ fontSize: 16 }} /></IconButton>
              </Stack>
            ))}
          </Stack>
          <Stack direction="row" gap={2} mt={3} justifyContent="flex-end">
            <Button variant="contained" disabled={state.processing} onClick={handleProcess} sx={{ borderRadius: 2, px: 4 }}>{state.processing ? "Processing…" : `Run ${tool.label}`}</Button>
          </Stack>
        </Box>
      )}

      {state.processing && (
        <Box mt={2}>
          <LinearProgress variant="determinate" value={state.progress} sx={{ borderRadius: 4, height: 6 }} />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', textAlign: 'right' }}>{state.progress}% - {state.progressMsg}</Typography>
        </Box>
      )}

      {state.done && (
        <Box mt={2} p={3} sx={{ borderRadius: 3, textAlign: "center", background: alpha(primary, 0.07) }}>
          <CheckCircleIcon sx={{ fontSize: 48, color: "success.main", mb: 1 }} />
          <Typography variant="h6" fontWeight={700}>Done!</Typography>
          {state.outputUrl ? (
            <Button variant="contained" startIcon={<CloudDownloadIcon />} href={state.outputUrl} download={state.outputName} sx={{ mt: 2, borderRadius: 2 }}>Download Result</Button>
          ) : (
            <Box sx={{ mt: 2, p: 2, bgcolor: "background.paper", borderRadius: 2, textAlign: "left", fontSize: 14 }}>{state.aiOutput}</Box>
          )}
          <Button variant="outlined" onClick={() => setState({ ...state, done: false, files: [], file: null })} sx={{ mt: 2, ml: 2, borderRadius: 2 }}>Process Another</Button>
        </Box>
      )}
    </Paper>
  );
}
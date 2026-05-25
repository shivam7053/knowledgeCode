"use client";
import { useEffect, useState, useRef } from "react";
import {
  getSubjects, getAllTests, getAllQuestionsAdmin, getAdminStats,
  createSubject, updateSubject, deleteSubject,
  createTest, updateTest, deleteTest,
  createQuestion, updateQuestion, deleteQuestion,
  parseDocument, parseDocumentUpload,
  Subject, Test, QuestionAdmin, AdminStats,
} from "@/lib/testsApi";
import {
  Box, Typography, Button, Card, CardContent,Grid, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, MenuItem, FormControl,
  InputLabel, Alert, CircularProgress, IconButton, Tabs, Tab, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, useTheme
} from "@mui/material";
import { Add, Edit, Delete, CloudUpload, AutoFixHigh, Code } from "@mui/icons-material";

// ---- Simple HTML mini-editor ----
function HtmlEditor({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const wrap = (tag: string) => {
    const el = ref.current; if (!el) return;
    const s = el.selectionStart, e = el.selectionEnd, v = el.value;
    const newVal = v.slice(0, s) + `<${tag}>` + v.slice(s, e) + `</${tag}>` + v.slice(e);
    onChange(newVal);
    setTimeout(() => { el.focus(); el.setSelectionRange(s + tag.length + 2, e + tag.length + 2); }, 0);
  };
  return (
    <Box mb={1.5}>
      <Typography fontSize={12} color="text.secondary" fontWeight={500} mb={0.5}>{label}</Typography>
      <Box sx={{ display: "flex", gap: 0.5, mb: 0.5 }}>
        {["b","i","code","u"].map(t => (
          <Button key={t} size="small" variant="outlined" onClick={() => wrap(t)}
            sx={{ minWidth: 0, px: 1, py: 0, fontSize: 11, textTransform: "none", borderRadius: 1 }}>{t}</Button>
        ))}
        <Tooltip title="HTML enabled"><Code sx={{ fontSize: 16, color: "text.secondary", alignSelf: "center", ml: 0.5 }} /></Tooltip>
      </Box>
      <TextField multiline rows={3} fullWidth size="small" value={value}
        onChange={e => onChange(e.target.value)} inputRef={ref}
        sx={{ fontFamily: "monospace", "& textarea": { fontFamily: "monospace", fontSize: 13 } }} />
      {value && (
        <Box sx={{ mt: 0.5, p: 1, border: "1px dashed", borderColor: "divider", borderRadius: 1, fontSize: 13 }}>
          <Typography fontSize={11} color="text.secondary" mb={0.25}>Preview</Typography>
          <span dangerouslySetInnerHTML={{ __html: value }} style={{ fontSize: 13 }} />
        </Box>
      )}
    </Box>
  );
}

// ---- Main admin page ----
export default function AdminTestsPage() {
  const theme = useTheme(); // Access the MUI theme
  const [tab, setTab] = useState(0);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [questions, setQuestions] = useState<QuestionAdmin[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: "success"|"error"; msg: string } | null>(null);
  const [filterTestId, setFilterTestId] = useState<string | "">("");

  // Modal state
  const [modal, setModal] = useState<null | "subject" | "test" | "question" | "upload">(null);
  const [editId, setEditId] = useState<string | null>(null);

  // Form state
  const [subForm, setSubForm] = useState({ name: "", icon: "📚", color: "badge-blue" });
  const [testForm, setTestForm] = useState({ subject_id: "", title: "", duration: 20, description: "" });
  const [qForm, setQForm] = useState({ test_id: "", text: "", options: ["", "", "", ""], correct: 0, explanation: "" });
  const [uploadTestId, setUploadTestId] = useState<string>("");
  const [docContent, setDocContent] = useState("");
  const [parseResult, setParseResult] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [s, t, q, st] = await Promise.all([getSubjects(), getAllTests(), getAllQuestionsAdmin(), getAdminStats()]);
      setSubjects(s); setTests(t); setQuestions(q); setStats(st);
    } catch (e: any) { showAlert("error", e.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filteredQ = filterTestId ? questions.filter(q => q.test_id === filterTestId) : questions;

  const showAlert = (type: "success"|"error", msg: string) => {
    setAlert({ type, msg }); setTimeout(() => setAlert(null), 4000);
  };

  const openSubject = (s?: Subject) => {
    setEditId(s?.id || null);
    setSubForm(s ? { name: s.name, icon: s.icon, color: s.color } : { name: "", icon: "📚", color: "badge-blue" });
    setModal("subject");
  };

  const openTest = (t?: Test) => {
    setEditId(t?.id || null);
    setTestForm(t ? { subject_id: t.subject_id, title: t.title, duration: t.duration, description: t.description }
      : { subject_id: subjects.length > 0 ? subjects[0].id : "", title: "", duration: 20, description: "" });
    setModal("test");
  };

  const openQuestion = (q?: QuestionAdmin) => {
    setEditId(q?.id || null);
    setQForm(q ? { test_id: q.test_id, text: q.text, options: [...q.options, "", "", "", ""].slice(0, 4), correct: q.correct, explanation: q.explanation }
      : { test_id: tests.length > 0 ? tests[0].id : "", text: "", options: ["", "", "", ""], correct: 0, explanation: "" });
    setModal("question");
  };

  const saveSubject = async () => {
    setSaving(true);
    try {
      if (editId) await updateSubject(editId, subForm); else await createSubject(subForm);
      showAlert("success", `Subject ${editId ? "updated" : "created"}`);
      setModal(null); load();
    } catch (e: any) { showAlert("error", e.message); }
    setSaving(false);
  };

  const saveTest = async () => {
    if (!testForm.title.trim() || !testForm.subject_id) {
      showAlert("error", "Title and Subject are required");
      return;
    }
    setSaving(true);
    try {
      if (editId) await updateTest(editId, testForm); else await createTest(testForm);
      showAlert("success", `Test ${editId ? "updated" : "created"}`);
      setModal(null); load();
    } catch (e: any) { showAlert("error", e.message); }
    setSaving(false);
  };

  const saveQuestion = async () => {
    const opts = qForm.options.filter(o => o.trim());
    if (opts.length < 2) { showAlert("error", "At least 2 options required"); return; }
    setSaving(true);
    try {
      const data = { ...qForm, options: opts };
      if (editId) await updateQuestion(editId, data); else await createQuestion(data);
      showAlert("success", `Question ${editId ? "updated" : "created"}`);
      setModal(null); load();
    } catch (e: any) { showAlert("error", e.message); }
    setSaving(false);
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm("Delete subject and all its tests?")) return;
    try { await deleteSubject(id); showAlert("success", "Subject deleted"); load(); }
    catch (e: any) { showAlert("error", e.message); }
  };

  const handleDeleteTest = async (id: string) => {
    if (!confirm("Delete test and all its questions?")) return;
    try { await deleteTest(id); showAlert("success", "Test deleted"); load(); }
    catch (e: any) { showAlert("error", e.message); }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    try { await deleteQuestion(id); showAlert("success", "Question deleted"); load(); }
    catch (e: any) { showAlert("error", e.message); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setDocContent(ev.target?.result as string);
    reader.readAsText(file);
  };

  const handleParseDoc = async () => {
    if (!docContent.trim()) { showAlert("error", "Paste or upload content first"); return; }
    if (!uploadTestId) { showAlert("error", "Select a target test"); return; }
    setSaving(true);
    try {
      const res = await parseDocument(uploadTestId, docContent);
      setParseResult(`✅ Imported ${res.imported} question(s) successfully!`);
      showAlert("success", `Imported ${res.imported} questions`);
      load();
    } catch (e: any) { setParseResult(""); showAlert("error", e.message); }
    setSaving(false);
  };

  return (
    <Box sx={{ maxWidth: 960, mx: "auto", p: 3 }}>
      <Typography variant="h5" fontWeight={700} mb={0.5}>Admin Dashboard</Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>Manage test portal content</Typography>

      {alert && <Alert severity={alert.type} sx={{ mb: 2 }} onClose={() => setAlert(null)}>{alert.msg}</Alert>}

      {/* Stats */}
      {stats && (
        <Grid container spacing={1.5} sx={{ mb: 3 }}>
          {[{l:"Subjects",v:stats.subjects},{l:"Tests",v:stats.tests},{l:"Questions",v:stats.questions},{l:"Attempts",v:stats.attempts}]
            .map(s => (
              <Grid size={{ xs: 6, sm: 3 }} key={s.l}>
                <Card variant="outlined" sx={{ borderRadius: 2, textAlign: "center", py: 1.5 }}>
                  <Typography fontSize={26} fontWeight={700} color="primary">{s.v}</Typography>
                  <Typography fontSize={12} color="text.secondary">{s.l}</Typography>
                </Card>
              </Grid>
            ))}
        </Grid>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}>
        <Tab label="Subjects" sx={{ textTransform: "none" }} />
        <Tab label="Tests" sx={{ textTransform: "none" }} />
        <Tab label="Questions" sx={{ textTransform: "none" }} />
        <Tab label="Upload Document" sx={{ textTransform: "none" }} />
      </Tabs>

      {loading && <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>}

      {/* Subjects tab */}
      {!loading && tab === 0 && (
        <Box>
          <Button variant="contained" startIcon={<Add />} onClick={() => openSubject()}
            sx={{ mb: 2, borderRadius: 2, textTransform: "none" }}>Add Subject</Button>
          {subjects.map(s => (
            <Card key={s.id} variant="outlined" sx={{ mb: 1, borderRadius: 2 }}>
              <CardContent sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: "10px !important" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Typography fontSize={24}>{s.icon}</Typography>
                  <Box><Typography fontWeight={500}>{s.name}</Typography>
                    <Typography fontSize={12} color="text.secondary">{s.test_count} tests</Typography></Box>
                </Box>
                <Box sx={{ display: "flex", gap: 0.75 }}>
                  <IconButton size="small" onClick={() => openSubject(s)}><Edit fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDeleteSubject(s.id)}><Delete fontSize="small" /></IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Tests tab */}
      {!loading && tab === 1 && (
        <Box>
          <Button variant="contained" startIcon={<Add />} onClick={() => openTest()}
            sx={{ mb: 2, borderRadius: 2, textTransform: "none" }}>Add Test</Button>
          {tests.map(t => {
            const sub = subjects.find(s => s.id === t.subject_id);
            return (
              <Card key={t.id} variant="outlined" sx={{ mb: 1, borderRadius: 2 }}>
                <CardContent sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: "10px !important" }}>
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography fontWeight={500}>{t.title}</Typography>
                      {sub && <Chip label={`${sub.icon} ${sub.name}`} size="small" />}
                    </Box>
                    <Typography fontSize={12} color="text.secondary">{t.question_count} questions · {t.duration} min</Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 0.75 }}>
                    <IconButton size="small" onClick={() => openTest(t)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDeleteTest(t.id)}><Delete fontSize="small" /></IconButton>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Questions tab */}
      {!loading && tab === 2 && (
        <Box>
          <Box sx={{ display: "flex", gap: 1.5, mb: 2, alignItems: "center", flexWrap: "wrap" }}>
            <Button variant="contained" startIcon={<Add />} onClick={() => openQuestion()}
              sx={{ borderRadius: 2, textTransform: "none" }}>Add Question</Button>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="filter-test-label">Filter by test</InputLabel>
              <Select labelId="filter-test-label" value={filterTestId} label="Filter by test" onChange={e => setFilterTestId(e.target.value as string)}>
                <MenuItem value="">All tests</MenuItem>
                {tests.map(t => <MenuItem key={t.id} value={t.id}>{t.title}</MenuItem>)}
              </Select>
            </FormControl>
            <Typography fontSize={13} color="text.secondary">{filteredQ.length} question(s)</Typography>
          </Box>
          {filteredQ.map(q => {
            const t = tests.find(x => x.id === q.test_id);
            return (
              <Card key={q.id} variant="outlined" sx={{ mb: 1, borderRadius: 2 }}>
                <CardContent sx={{ py: "10px !important" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box flex={1} pr={1}>
                      <Typography fontSize={12} color="text.secondary" mb={0.5}>{t?.title} · Q{q.id}</Typography>
                      <Typography fontSize={13} fontWeight={500} mb={0.75} dangerouslySetInnerHTML={{ __html: q.text }} />
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.4 }}>
                        {q.options.map((o, i) => (
                          <Chip key={i} label={<span dangerouslySetInnerHTML={{ __html: `${String.fromCharCode(65+i)}) ${o}${i===q.correct?" ✓":""}` }} />}
                            size="small" color={i === q.correct ? "success" : "default"} variant={i === q.correct ? "filled" : "outlined"} />
                        ))}
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
                      <IconButton size="small" onClick={() => openQuestion(q)}><Edit fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeleteQuestion(q.id)}><Delete fontSize="small" /></IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Upload tab */}
      {!loading && tab === 3 && (
        <Box>
          <Alert severity="info" sx={{ mb: 2 }}>
            Upload a .txt file or paste content. Format: Q1. question, a) opt b) opt, Answer: b, Explanation: text
          </Alert>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Target test</InputLabel>
            <Select value={uploadTestId} label="Target test" onChange={e => setUploadTestId(e.target.value as string)}>
              <MenuItem value="">Select a test</MenuItem>
              {tests.map(t => <MenuItem key={t.id} value={t.id}>{t.title}</MenuItem>)}
            </Select>
          </FormControl>
          <Box onClick={() => document.getElementById("file-upload")?.click()}
            sx={{ border: "2px dashed", borderColor: "divider", borderRadius: 2, p: 3, textAlign: "center", cursor: "pointer", mb: 2,
              "&:hover": { borderColor: "primary.main", background: theme.palette.mode === 'dark' ? 'rgba(59,130,246,0.05)' : 'rgba(16,185,129,0.05)' } }}>
            <CloudUpload sx={{ fontSize: 40, color: "text.secondary", mb: 1 }} />
            <Typography fontWeight={500}>Click to upload .txt file</Typography>
            <Typography fontSize={12} color="text.secondary">Or paste content below</Typography>
          </Box>
          <input type="file" id="file-upload" accept=".txt,.md" style={{ display: "none" }} onChange={handleFileUpload} />
          <TextField multiline rows={8} fullWidth label="Or paste document content" value={docContent}
            onChange={e => setDocContent(e.target.value)} placeholder={`Q1. What is a variable?\na) A fixed value  b) A named storage  c) A function  d) A loop\nAnswer: b\nExplanation: A variable stores data in memory.\n\nQ2. ...`}
            sx={{ mb: 2, "& textarea": { fontFamily: "monospace", fontSize: 13 } }} />
          <Box sx={{ display: "flex", gap: 1.5, mb: 1.5 }}>
            <Button variant="contained" startIcon={<AutoFixHigh />} onClick={handleParseDoc} disabled={saving}
              sx={{ borderRadius: 2, textTransform: "none" }}>
              {saving ? "Parsing..." : "Parse & Import Questions"}
            </Button>
            <Button variant="outlined" onClick={() => { setDocContent(""); setParseResult(""); }}
              sx={{ borderRadius: 2, textTransform: "none" }}>Clear</Button>
          </Box>
          {parseResult && <Alert severity="success">{parseResult}</Alert>}
        </Box>
      )}

      {/* --- Subject modal --- */}
      <Dialog open={modal === "subject"} onClose={() => setModal(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{editId ? "Edit" : "Add"} Subject</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Subject name" value={subForm.name}
            onChange={e => setSubForm(p => ({ ...p, name: e.target.value }))} sx={{ mb: 2, mt: 1 }} />
          <TextField fullWidth label="Icon (emoji)" value={subForm.icon}
            onChange={e => setSubForm(p => ({ ...p, icon: e.target.value }))} sx={{ mb: 2 }} />
          <FormControl fullWidth>
            <InputLabel>Color</InputLabel>
            <Select value={subForm.color} label="Color" onChange={e => setSubForm(p => ({ ...p, color: e.target.value }))}>
              {[["badge-blue","Blue"],["badge-green","Green"],["badge-orange","Orange"],["badge-purple","Purple"]].map(([v,l]) =>
                <MenuItem key={v} value={v}>{l}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setModal(null)} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" onClick={saveSubject} disabled={saving} sx={{ textTransform: "none", borderRadius: 2 }}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- Test modal --- */}
      <Dialog open={modal === "test"} onClose={() => setModal(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? "Edit" : "Add"} Test</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Title" value={testForm.title}
            onChange={e => setTestForm(p => ({ ...p, title: e.target.value }))} sx={{ mb: 2, mt: 1 }} />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="add-test-subject-label">Subject</InputLabel>
            <Select
              labelId="add-test-subject-label"
              value={testForm.subject_id}
              label="Subject"
              onChange={e => setTestForm(p => ({ ...p, subject_id: e.target.value as string }))}
            >
              {subjects.map(s => <MenuItem key={s.id} value={s.id}>{s.icon} {s.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField fullWidth type="number" label="Duration (minutes)" value={testForm.duration}
            onChange={e => setTestForm(p => ({ ...p, duration: Number(e.target.value) }))} sx={{ mb: 2 }} />
          <TextField fullWidth label="Description (optional)" value={testForm.description}
            onChange={e => setTestForm(p => ({ ...p, description: e.target.value }))} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setModal(null)} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" onClick={saveTest} disabled={saving} sx={{ textTransform: "none", borderRadius: 2 }}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- Question modal --- */}
      <Dialog open={modal === "question"} onClose={() => setModal(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? "Edit" : "Add"} Question</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
            <InputLabel id="add-question-test-label">Test</InputLabel>
            <Select
              labelId="add-question-test-label"
              value={qForm.test_id}
              label="Test"
              onChange={e => setQForm(p => ({ ...p, test_id: e.target.value as string }))}
            >
              {tests.map(t => <MenuItem key={t.id} value={t.id}>{t.title}</MenuItem>)}
            </Select>
          </FormControl>
          <HtmlEditor label="Question text (HTML supported)" value={qForm.text}
            onChange={v => setQForm(p => ({ ...p, text: v }))} />
          <Typography fontSize={12} color="text.secondary" fontWeight={500} mb={0.5}>Options (4 max)</Typography>
          {qForm.options.map((opt, i) => (
            <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
              <Box onClick={() => setQForm(p => ({ ...p, correct: i }))}
                sx={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid",
                  borderColor: qForm.correct === i ? "primary.main" : "divider",
                  background: qForm.correct === i ? "primary.main" : "transparent",
                  color: qForm.correct === i ? "white" : "text.secondary",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0, bgcolor: qForm.correct===i?"primary.main":"transparent" }}>
                {String.fromCharCode(65 + i)}
              </Box>
              <TextField size="small" fullWidth
                placeholder={`Option ${String.fromCharCode(65+i)}${i === qForm.correct ? " (correct)" : ""}`}
                value={opt} onChange={e => {
                  const opts = [...qForm.options]; opts[i] = e.target.value;
                  setQForm(p => ({ ...p, options: opts }));
                }} />
            </Box>
          ))}
          <Typography fontSize={11} color="text.secondary" mb={1}>Click a letter to mark correct answer</Typography>
          <HtmlEditor label="Explanation (HTML supported)" value={qForm.explanation}
            onChange={v => setQForm(p => ({ ...p, explanation: v }))} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setModal(null)} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" onClick={saveQuestion} disabled={saving} sx={{ textTransform: "none", borderRadius: 2 }}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
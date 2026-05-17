"use client";

import React from "react";
import {
  Box, Container, Typography, Paper, TextField, Button, Stack,
  MenuItem, Alert, CircularProgress, Divider, IconButton,
  Accordion, AccordionSummary, AccordionDetails,
  Chip, Switch, FormControlLabel, Tooltip, Collapse,
} from "@mui/material";
import {
  ArrowBack as BackIcon, Save as SaveIcon,
  Add as AddIcon, Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibleIcon, VisibilityOff as HiddenIcon,
  PlayArrow as RunIcon, CheckCircle as OkIcon, Error as ErrIcon,
} from "@mui/icons-material";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";

const API_BASE = "http://localhost:8000/practice";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface TestCase {
  input: string;
  expected_output: string;
  is_hidden: boolean;
  explanation: string;
}

interface QuestionForm {
  title: string;
  description: string;
  initial_code: string;
  solution_check: string;
  reference_solution: string;
  custom_checker: string;
  test_cases: TestCase[];
  examples: { input: string; output: string; explanation: string }[];
  constraints: string[];
}

interface FormData {
  title: string;
  difficulty: string;
  category: string;
  language: string;
  questions: QuestionForm[];
}

interface ValidateResult {
  input: string;
  output: string;
  stderr: string;
  ok: boolean;
}

// ─── Defaults / helpers ────────────────────────────────────────────────────────
const emptyTestCase = (): TestCase => ({
  input: "", expected_output: "", is_hidden: false, explanation: "",
});

const normalizeQuestion = (q: any): QuestionForm => ({
  title:               q.title               ?? "",
  description:         q.description         ?? "",
  initial_code:        q.initial_code        ?? "",
  solution_check:      q.solution_check      ?? "",
  reference_solution:  q.reference_solution  ?? "",
  custom_checker:      q.custom_checker      ?? "",
  constraints:         q.constraints         ?? [],
  examples:            q.examples            ?? [],
  test_cases:
    q.test_cases?.length
      ? q.test_cases.map((tc: any) => ({
          input:           tc.input           ?? "",
          expected_output: tc.expected_output ?? "",
          is_hidden:       tc.is_hidden       ?? false,
          explanation:     tc.explanation     ?? "",
        }))
      : q.solution_check
        ? [{ input: "", expected_output: q.solution_check, is_hidden: false, explanation: "" }]
        : [emptyTestCase()],
});

const starterTemplates: Record<string, string> = {
  python:     "# Write your solution here\n\n",
  javascript: "// Write your solution here\n\n",
  java:       "public class Main {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n",
  cpp:        "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n",
  sql:        "-- Write your SQL query here\n",
};

const checkerTemplate = `def check(input_data: str, expected: str, actual: str) -> bool:
    # Return True if the user's answer is acceptable.
    return sorted(expected.split()) == sorted(actual.split())
`;

// ─── Component ─────────────────────────────────────────────────────────────────
export default function EditPracticeChallenge() {
  const router   = useRouter();
  const params   = useParams();
  const problemId = params.id as string;

  const [loading,    setLoading]    = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error,      setError]      = React.useState("");
  const [success,    setSuccess]    = React.useState(false);
  const [categories, setCategories] = React.useState<any[]>([]);

  const [validating,      setValidating]      = React.useState<Record<number, boolean>>({});
  const [validateResults, setValidateResults] = React.useState<Record<number, ValidateResult[]>>({});
  const [validateError,   setValidateError]   = React.useState<Record<number, string>>({});

  const [formData, setFormData] = React.useState<FormData>({
    title: "", difficulty: "Easy", category: "", language: "python", questions: [],
  });

  // ── Load ───────────────────────────────────────────────────────────────────
  React.useEffect(() => {
    const init = async () => {
      try {
        const [catRes, probRes] = await Promise.all([
          fetch(`${API_BASE}/categories`),
          fetch(`${API_BASE}/problem/${problemId}`),
        ]);
        const cats = await catRes.json();
        setCategories(cats);

        if (!probRes.ok) { setError("Challenge not found."); return; }

        const prob = await probRes.json();
        setFormData({
          title:      prob.title      ?? "",
          difficulty: prob.difficulty ?? "Easy",
          category:   prob.category   ?? (cats[0]?.name ?? ""),
          language:   prob.language   ?? "python",
          questions:  (prob.questions ?? []).map(normalizeQuestion),
        });
      } catch { setError("Failed to load data."); }
      finally  { setLoading(false); }
    };
    init();
  }, [problemId]);

  // ── Field helpers ──────────────────────────────────────────────────────────
  const setTop = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const setQ = (qi: number, field: keyof QuestionForm, value: any) =>
    setFormData(p => {
      const qs = [...p.questions];
      qs[qi] = { ...qs[qi], [field]: value };
      return { ...p, questions: qs };
    });

  const setQField = (qi: number) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setQ(qi, e.target.name as keyof QuestionForm, e.target.value);

  const addQ = () =>
    setFormData(p => ({
      ...p,
      questions: [...p.questions, {
        title: `Question ${p.questions.length + 1}`, description: "",
        initial_code: "", solution_check: "",
        reference_solution: "", custom_checker: "",
        test_cases: [emptyTestCase()], examples: [], constraints: [],
      }],
    }));

  const removeQ = (qi: number) =>
    setFormData(p => ({ ...p, questions: p.questions.filter((_, i) => i !== qi) }));

  // ── Test-case helpers ──────────────────────────────────────────────────────
  const addTC = (qi: number) =>
    setQ(qi, "test_cases", [...formData.questions[qi].test_cases, emptyTestCase()]);

  const removeTC = (qi: number, ti: number) =>
    setQ(qi, "test_cases", formData.questions[qi].test_cases.filter((_, i) => i !== ti));

  const setTC = (qi: number, ti: number, field: keyof TestCase, val: any) => {
    const tcs = [...formData.questions[qi].test_cases];
    tcs[ti] = { ...tcs[ti], [field]: val };
    setQ(qi, "test_cases", tcs);
  };

  // ── Constraint helpers ─────────────────────────────────────────────────────
  const addConstraint = (qi: number) =>
    setQ(qi, "constraints", [...formData.questions[qi].constraints, ""]);

  const setConstraint = (qi: number, ci: number, val: string) => {
    const cs = [...formData.questions[qi].constraints];
    cs[ci] = val;
    setQ(qi, "constraints", cs);
  };

  const removeConstraint = (qi: number, ci: number) =>
    setQ(qi, "constraints", formData.questions[qi].constraints.filter((_, i) => i !== ci));

  // ── Validate reference solution ────────────────────────────────────────────
  const handleValidate = async (qi: number) => {
    const q = formData.questions[qi];
    if (!q.reference_solution.trim()) return;
    setValidating(v => ({ ...v, [qi]: true }));
    setValidateResults(r => ({ ...r, [qi]: [] }));
    setValidateError(e => ({ ...e, [qi]: "" }));
    try {
      const res = await fetch(`${API_BASE}/validate-solution`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: formData.language,
          reference_solution: q.reference_solution,
          test_cases: q.test_cases,
        }),
      });
      const data = await res.json();
      setValidateResults(r => ({ ...r, [qi]: data.results ?? [] }));
      if (!data.ok) setValidateError(e => ({ ...e, [qi]: data.error || "Some cases failed." }));
    } catch {
      setValidateError(e => ({ ...e, [qi]: "Failed to reach server." }));
    } finally {
      setValidating(v => ({ ...v, [qi]: false }));
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess(false);

    for (const q of formData.questions) {
      const hasRef    = q.reference_solution.trim();
      const hasManual = q.test_cases.some(tc => tc.expected_output.trim());
      if (!hasRef && !hasManual) {
        setError("Each question needs a Reference Solution or manual Expected Output on its test cases.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        questions: formData.questions.map(q => ({
          ...q,
          examples: q.examples.length > 0
            ? q.examples
            : q.test_cases.filter(tc => !tc.is_hidden).map(tc => ({
                input: tc.input, output: tc.expected_output, explanation: tc.explanation,
              })),
        })),
      };

      const res = await fetch(`${API_BASE}/problem/${problemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => { router.push("/admin/practice"); router.refresh(); }, 900);
      } else {
        const data = await res.json();
        setError(data.detail || "Failed to update challenge.");
      }
    } catch { setError("Failed to connect to server."); }
    finally  { setSubmitting(false); }
  };

  if (loading) return (
    <Box sx={{ display: "flex", justifyContent: "center", py: 12 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack direction="row" alignItems="center" spacing={2} mb={4}>
        <Link href="/admin/practice" style={{ textDecoration: "none" }}>
          <Button startIcon={<BackIcon />} variant="outlined" size="small">Back</Button>
        </Link>
        <Typography variant="h4" fontWeight={800}>Edit Challenge</Typography>
      </Stack>

      {error   && <Alert severity="error"   sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>Saved! Redirecting…</Alert>}

      <Paper variant="outlined" sx={{ p: 4, borderRadius: 3 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>

            {/* ── Basic ─────────────────────────────────────────────────── */}
            <TextField fullWidth label="Challenge Title" name="title"
              value={formData.title} onChange={setTop} required />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField select fullWidth label="Difficulty" name="difficulty"
                value={formData.difficulty} onChange={setTop} required>
                {["Easy","Medium","Hard"].map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </TextField>
              <TextField select fullWidth label="Language" name="language"
                value={formData.language} onChange={setTop} required>
                {["python","javascript","java","cpp","sql"].map(l =>
                  <MenuItem key={l} value={l}>{l}</MenuItem>)}
              </TextField>
              <TextField select fullWidth label="Category" name="category"
                value={formData.category} onChange={setTop} required>
                {categories.map(c => <MenuItem key={c.name} value={c.name}>{c.title}</MenuItem>)}
              </TextField>
            </Stack>

            <Divider />
            <Typography variant="h6" fontWeight={700}>Questions</Typography>

            {formData.questions.map((q, qi) => (
              <Accordion key={qi} defaultExpanded
                sx={{ border: "1px solid rgba(0,0,0,0.12)", "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: "flex", alignItems: "center", width: "100%", gap: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ flex: 1 }}>
                      Q{qi + 1}: {q.title || "Untitled"}
                    </Typography>
                    <Chip label={`${q.test_cases.length} test case${q.test_cases.length !== 1 ? "s" : ""}`}
                      size="small" color="primary" variant="outlined" />
                    {q.reference_solution.trim() && (
                      <Chip label="Has solution" size="small" color="success" variant="outlined" />
                    )}
                    {formData.questions.length > 1 && (
                      <IconButton onClick={e => { e.stopPropagation(); removeQ(qi); }}
                        size="small" color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </AccordionSummary>

                <AccordionDetails>
                  <Stack spacing={3}>

                    <TextField fullWidth label="Question Title" name="title"
                      value={q.title} onChange={setQField(qi)} required />
                    <TextField fullWidth multiline rows={4} label="Problem Description"
                      name="description" value={q.description} onChange={setQField(qi)} required
                      helperText="Use newlines for paragraphs." />

                    {/* Initial Code */}
                    <Box>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2" fontWeight={600} color="text.secondary">Initial Code Template</Typography>
                        <Button size="small" onClick={() => setQ(qi, "initial_code", starterTemplates[formData.language] ?? "")}>
                          Insert {formData.language} template
                        </Button>
                      </Stack>
                      <TextField fullWidth multiline rows={6} name="initial_code"
                        value={q.initial_code} onChange={setQField(qi)} required
                        InputProps={{ sx: { fontFamily: "monospace", fontSize: 13 } }}
                        helperText="Starter code shown to the user." />
                    </Box>

                    <Divider />

                    {/* ── Test Cases ──────────────────────────────────────── */}
                    <Box>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                        <Typography variant="subtitle2" fontWeight={700}>Test Cases</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Expected Output is auto-filled when you provide a Reference Solution.
                        </Typography>
                      </Stack>
                      <Stack spacing={2}>
                        {q.test_cases.map((tc, ti) => (
                          <Paper key={ti} variant="outlined" sx={{
                            p: 2, borderRadius: 2,
                            borderColor: tc.is_hidden ? "warning.light" : "divider",
                            bgcolor: tc.is_hidden ? "warning.50" : "background.paper",
                          }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
                              <Stack direction="row" gap={1} alignItems="center">
                                <Typography variant="body2" fontWeight={700}>Case {ti + 1}</Typography>
                                {tc.is_hidden
                                  ? <Chip icon={<HiddenIcon />} label="Hidden" size="small" color="warning" variant="outlined" />
                                  : <Chip icon={<VisibleIcon />} label="Sample" size="small" color="success" variant="outlined" />}
                              </Stack>
                              <Stack direction="row" gap={1} alignItems="center">
                                <Tooltip title={tc.is_hidden ? "Make visible" : "Hide from user"}>
                                  <FormControlLabel
                                    control={<Switch size="small" checked={tc.is_hidden} color="warning"
                                      onChange={e => setTC(qi, ti, "is_hidden", e.target.checked)} />}
                                    label={<Typography variant="caption">Hidden</Typography>}
                                    labelPlacement="start" sx={{ mr: 0 }} />
                                </Tooltip>
                                {q.test_cases.length > 1 && (
                                  <IconButton size="small" color="error" onClick={() => removeTC(qi, ti)}>
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                )}
                              </Stack>
                            </Stack>
                            <Stack spacing={1.5}>
                              <TextField fullWidth multiline rows={2} label="Input (stdin)"
                                value={tc.input} onChange={e => setTC(qi, ti, "input", e.target.value)}
                                InputProps={{ sx: { fontFamily: "monospace", fontSize: 13 } }}
                                helperText="Leave blank if no stdin needed." />
                              <TextField fullWidth multiline rows={2}
                                label={q.reference_solution.trim() ? "Expected Output (auto-filled by Reference Solution)" : "Expected Output *"}
                                value={tc.expected_output}
                                onChange={e => setTC(qi, ti, "expected_output", e.target.value)}
                                disabled={!!q.reference_solution.trim()}
                                InputProps={{ sx: { fontFamily: "monospace", fontSize: 13 } }}
                                helperText="Exact stdout the program must produce." />
                              {!tc.is_hidden && (
                                <TextField fullWidth label="Explanation (optional)"
                                  value={tc.explanation}
                                  onChange={e => setTC(qi, ti, "explanation", e.target.value)} />
                              )}
                            </Stack>
                          </Paper>
                        ))}
                      </Stack>
                      <Button variant="outlined" size="small" startIcon={<AddIcon />}
                        onClick={() => addTC(qi)} sx={{ mt: 1.5 }}>
                        Add Test Case
                      </Button>
                    </Box>

                    <Divider />

                    {/* ── Reference Solution ──────────────────────────────── */}
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700} mb={0.5}>
                        Reference Solution{" "}
                        <Chip label="Recommended" size="small" color="success" sx={{ ml: 1, fontSize: 11 }} />
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                        A correct solution in <strong>{formData.language}</strong>. On save, the platform
                        executes it against every test-case input and stores the stdout as the expected answer.
                        Users never see this code.
                      </Typography>
                      <TextField fullWidth multiline rows={10} name="reference_solution"
                        value={q.reference_solution} onChange={setQField(qi)}
                        InputProps={{ sx: { fontFamily: "monospace", fontSize: 13 } }}
                        placeholder={`Write the correct ${formData.language} solution here…`} />

                      <Stack direction="row" alignItems="center" gap={2} mt={1}>
                        <Button variant="contained" size="small" color="secondary"
                          startIcon={validating[qi] ? <CircularProgress size={14} color="inherit" /> : <RunIcon />}
                          onClick={() => handleValidate(qi)}
                          disabled={!q.reference_solution.trim() || validating[qi]}>
                          {validating[qi] ? "Running…" : "Test Solution"}
                        </Button>
                        {validateError[qi] && (
                          <Typography variant="caption" color="error">{validateError[qi]}</Typography>
                        )}
                      </Stack>

                      <Collapse in={!!validateResults[qi]?.length}>
                        <Box mt={2} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
                          {validateResults[qi]?.map((r, i) => (
                            <Box key={i} sx={{
                              display: "flex", alignItems: "flex-start", gap: 1.5, p: 1.5,
                              borderBottom: i < validateResults[qi].length - 1 ? "1px solid" : "none",
                              borderColor: "divider",
                              bgcolor: r.ok ? "success.50" : "error.50",
                            }}>
                              {r.ok ? <OkIcon color="success" fontSize="small" sx={{ mt: 0.2 }} />
                                    : <ErrIcon color="error"   fontSize="small" sx={{ mt: 0.2 }} />}
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Input: <code style={{ background: "#0002", padding: "0 4px", borderRadius: 3 }}>
                                    {r.input || "(none)"}
                                  </code>
                                </Typography>
                                {r.ok
                                  ? <Typography variant="caption" display="block" color="success.main">
                                      Output: <code>{r.output || "(empty)"}</code>
                                    </Typography>
                                  : <Typography variant="caption" display="block" color="error.main">
                                      Error: <code>{r.stderr}</code>
                                    </Typography>}
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      </Collapse>
                    </Box>

                    {/* ── Custom Checker ───────────────────────────────────── */}
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700} mb={0.5}>
                        Custom Checker{" "}
                        <Chip label="Optional" size="small" variant="outlined" sx={{ ml: 1, fontSize: 11 }} />
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                        For problems with multiple valid answers. Must be Python and define{" "}
                        <code>check(input_data, expected, actual) → bool</code>.
                        Leave blank to use exact string matching.
                      </Typography>
                      <Button size="small" variant="text" sx={{ mb: 1 }}
                        onClick={() => setQ(qi, "custom_checker", q.custom_checker || checkerTemplate)}>
                        Insert checker template
                      </Button>
                      <TextField fullWidth multiline rows={6} name="custom_checker"
                        value={q.custom_checker} onChange={setQField(qi)}
                        InputProps={{ sx: { fontFamily: "monospace", fontSize: 13 } }}
                        placeholder="Optional — leave blank for exact match" />
                    </Box>

                    <Divider />

                    {/* ── Constraints ─────────────────────────────────────── */}
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700} mb={1}>Constraints (optional)</Typography>
                      <Stack spacing={1}>
                        {q.constraints.map((c, ci) => (
                          <Stack key={ci} direction="row" spacing={1} alignItems="center">
                            <TextField fullWidth size="small" placeholder="e.g. 1 ≤ n ≤ 10^5"
                              value={c} onChange={e => setConstraint(qi, ci, e.target.value)}
                              InputProps={{ sx: { fontFamily: "monospace", fontSize: 13 } }} />
                            <IconButton size="small" color="error" onClick={() => removeConstraint(qi, ci)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        ))}
                      </Stack>
                      <Button variant="text" size="small" startIcon={<AddIcon />}
                        onClick={() => addConstraint(qi)} sx={{ mt: 0.5 }}>
                        Add Constraint
                      </Button>
                    </Box>

                  </Stack>
                </AccordionDetails>
              </Accordion>
            ))}

            <Button variant="outlined" startIcon={<AddIcon />} onClick={addQ}>
              Add Question
            </Button>

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
              <Button type="submit" variant="contained" size="large"
                startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                disabled={submitting} sx={{ px: 6, borderRadius: 2 }}>
                {submitting ? "Saving…" : "Save Changes"}
              </Button>
            </Box>

          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
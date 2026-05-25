"use client"; // This directive marks the component as a Client Component
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Box, Typography, Button, Radio, RadioGroup, FormControlLabel, 
  FormControl, Card, LinearProgress, Stack, CircularProgress, Alert, 
  Paper, List, ListItem, ListItemText, ListItemIcon, useTheme, alpha
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import TimerIcon from "@mui/icons-material/Timer";
import Grid from "@mui/material/Grid";

// Helper for API calls (Assuming these exist in your lib/testsApi)
// It's generally better to centralize these in a lib/testsApi.ts file
// but for this example, they are kept here for direct visibility.
async function fetchTestDetails(tid: string) {
  const res = await fetch(`http://localhost:8000/tests/tests/${tid}`);
  if (!res.ok) throw new Error("Failed to load test details");
  return res.json();
}

async function fetchQuestions(tid: string) {
  const res = await fetch(`http://localhost:8000/tests/tests/${tid}/questions`);
  if (!res.ok) throw new Error("Failed to load questions");
  return res.json();
}

async function submitTest(tid: string, answers: Record<string, number>, elapsed: number) {
  const res = await fetch(`http://localhost:8000/tests/tests/${tid}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ test_id: tid, answers, elapsed_sec: elapsed })
  });
  return res.json();
}

// Assuming these interfaces are defined in a shared types file or lib/testsApi.ts
interface Test { id: string; duration: number; /* ... other fields */ }
interface Question { id: string; text: string; options: string[]; /* ... other fields */ }

export default function TakeTestPage() {
  const params = useParams();
  const tid = params.tid as string;
  const router = useRouter();
  const theme = useTheme();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [testDetails, setTestDetails] = useState<Test | null>(null); // New state for test details
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState("");
  const [liveTime, setLiveTime] = useState(0);
  
  const startTime = useRef(Date.now());

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    const elapsed = Math.floor((Date.now() - startTime.current) / 1000);
    try {
      const res = await submitTest(tid, answers, elapsed);
      setResult(res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }, [tid, answers]);

  useEffect(() => {
    if (tid) {
      setLoading(true);
      Promise.all([fetchTestDetails(tid), fetchQuestions(tid)])
        .then(([details, qns]) => {
          setTestDetails(details);
          setQuestions(qns);
        })
        .catch(e => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [tid]);

  useEffect(() => {
    if (loading || result || submitting || !testDetails) return;
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime.current) / 1000);
      setLiveTime(elapsed);

      // Auto-submit if duration is reached
      if (testDetails.duration > 0 && elapsed >= testDetails.duration * 60) {
        clearInterval(timer);
        handleSubmit();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, result, submitting, testDetails, handleSubmit]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handleReattempt = () => {
    setResult(null);
    setAnswers({});
    setLiveTime(0);
    setCurrentIndex(0);
    startTime.current = Date.now();
  };

  if (loading) return <Box sx={{ textAlign: "center", py: 10 }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ p: 3 }}><Alert severity="error">{error}</Alert></Box>;

  if (result) {
    return (
      <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
        <Paper elevation={0} sx={{ p: 4, textAlign: "center", borderRadius: 4, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
          <Typography variant="h4" fontWeight={800}>Test Results</Typography>
          <Typography variant="h2" color="primary" fontWeight={900} sx={{ my: 3 }}>{result.score}%</Typography>
          
          <Grid container spacing={2} sx={{ mb: 4, justifyContent: "center" }}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="h6" fontWeight={700}>{result.total}</Typography>
              <Typography variant="caption" color="text.secondary">Total Questions</Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="h6" fontWeight={700} color="info.main">{result.total - result.skipped}</Typography>
              <Typography variant="caption" color="text.secondary">Attempted</Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="h6" fontWeight={700} color="success.main">{result.correct}</Typography>
              <Typography variant="caption" color="text.secondary">Correct</Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="h6" fontWeight={700} color="error.main">{result.wrong}</Typography>
              <Typography variant="caption" color="text.secondary">Wrong</Typography>
            </Grid>
          </Grid>

          {/* Simple Breakdown Chart */}
          <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={1} textAlign="left">PERFORMANCE BREAKDOWN</Typography>
          <Stack direction="row" spacing={0.5} sx={{ height: 12, borderRadius: 6, overflow: "hidden", mb: 4, border: "1px solid", borderColor: "divider" }}>
             <Box sx={{ width: `${(result.correct/result.total)*100}%`, bgcolor: "success.main" }} />
             <Box sx={{ width: `${(result.wrong/result.total)*100}%`, bgcolor: "error.main" }} />
             <Box sx={{ width: `${(result.skipped/result.total)*100}%`, bgcolor: alpha(theme.palette.text.disabled, 0.2) }} />
          </Stack>

          <Stack direction="row" spacing={2} justifyContent="center">
            <Button variant="contained" onClick={() => router.push("/tests")}>Return Home</Button>
            <Button variant="outlined" onClick={handleReattempt} color="primary">
              Reattempt Test
            </Button>
          </Stack>
        </Paper>

        <Typography variant="h5" fontWeight={700} sx={{ mt: 6, mb: 2 }}>Review Solutions</Typography>
        <Stack spacing={2}>
          {result.solutions.map((sol: any, idx: number) => (
            <Card key={idx} variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={1}>{idx + 1}. {sol.text}</Typography>
              <List dense>
                {sol.options.map((opt: string, oIdx: number) => (
                  <ListItem key={oIdx} sx={{ 
                    borderRadius: 1, mb: 0.5,
                    bgcolor: oIdx === sol.correct_answer ? alpha(theme.palette.success.main, 0.1) : (oIdx === sol.your_answer ? alpha(theme.palette.error.main, 0.1) : "transparent")
                  }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {oIdx === sol.correct_answer ? <CheckCircleIcon color="success" fontSize="small" /> : oIdx === sol.your_answer ? <CancelIcon color="error" fontSize="small" /> : null}
                    </ListItemIcon>
                    <ListItemText primary={opt} />
                  </ListItem>
                ))}
              </List>
              {sol.explanation && (
                <Box sx={{ mt: 2, p: 2, bgcolor: "action.hover", borderRadius: 2 }}>
                  <Typography variant="caption" fontWeight={700}>EXPLANATION</Typography>
                  <Typography variant="body2">{sol.explanation}</Typography>
                </Box>
              )}
            </Card>
          ))}
        </Stack>
      </Box>
    );
  }

  if (!loading && !result && questions.length === 0) {
    return (
      <Box sx={{ maxWidth: 700, mx: "auto", p: 3 }}>
        <Alert severity="warning">
          No questions found for this test. Please try another test.
        </Alert>
        <Button variant="outlined" sx={{ mt: 2 }} onClick={() => router.push("/tests")}>
          Back to Tests
        </Button>
      </Box>
    );
  }

  const q = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  
  const totalSeconds = (testDetails?.duration || 0) * 60;
  const timeToShow = testDetails?.duration ? Math.max(0, totalSeconds - liveTime) : liveTime;
  const timerLabel = testDetails?.duration ? "TIME LEFT" : "ELAPSED";

  return (
    <Box sx={{ maxWidth: 700, mx: "auto", p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" mb={1}>
          <Typography variant="caption" fontWeight={700} color="primary">QUESTION {currentIndex + 1} OF {questions.length}</Typography>
          <Stack direction="row" alignItems="center" spacing={0.5}>
             <TimerIcon fontSize="small" color="action" />
             <Typography variant="caption" fontWeight={700} sx={{ fontFamily: "monospace", fontSize: "1rem" }}>
               {timerLabel}: {formatTime(timeToShow)}
             </Typography>
          </Stack>
        </Stack>
        <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
      </Box>

      {/* Question Navigation Index */}
      <Box sx={{ mb: 3, display: "flex", flexWrap: "wrap", gap: 1 }}>
        {questions.map((_, i) => (
          <Button
            key={i}
            variant={currentIndex === i ? "contained" : "outlined"}
            size="small"
            onClick={() => setCurrentIndex(i)}
            sx={{ 
              minWidth: 36, height: 36, p: 0, borderRadius: 1.5,
              borderColor: answers[questions[i].id] !== undefined ? "primary.main" : "divider",
              bgcolor: currentIndex === i ? "primary.main" : (answers[questions[i].id] !== undefined ? alpha(theme.palette.primary.main, 0.1) : "transparent")
            }}
          >
            {i + 1}
          </Button>
        ))}
      </Box>

      <Card variant="outlined" sx={{ p: 4, borderRadius: 4 }}>
        <Typography variant="h5" fontWeight={600} mb={4}>{q.text}</Typography>
        <FormControl component="fieldset" fullWidth>
          <RadioGroup 
            value={answers[q.id]?.toString() || ""} 
            onChange={(e) => setAnswers({ ...answers, [q.id]: parseInt(e.target.value) })}
          >
            <Stack spacing={2}>
              {q.options.map((opt: string, idx: number) => (
                <Paper 
                  key={idx} 
                  variant="outlined" 
                  sx={{ 
                    p: 1, borderRadius: 2,
                    borderColor: answers[q.id] === idx ? "primary.main" : "divider",
                    bgcolor: answers[q.id] === idx ? "primary.50" : "transparent"
                  }}
                >
                  <FormControlLabel 
                    value={idx.toString()} 
                    control={<Radio size="small" />} 
                    label={opt} 
                    sx={{ width: "100%", m: 0, px: 1 }}
                  />
                </Paper>
              ))}
            </Stack>
          </RadioGroup>
        </FormControl>

        <Box sx={{ mt: 6, display: "flex", justifyContent: "space-between" }}>
          <Button disabled={currentIndex === 0} onClick={() => setCurrentIndex(currentIndex - 1)}>Previous</Button>
          <Button 
            variant="contained" 
            onClick={handleNext}
            disabled={submitting || answers[q.id] === undefined}
          >
            {currentIndex === questions.length - 1 ? (submitting ? "Submitting..." : "Submit Test") : "Next Question"}
          </Button>
        </Box>
      </Card>
    </Box>
  );
}
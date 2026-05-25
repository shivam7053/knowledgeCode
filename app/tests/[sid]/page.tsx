"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTestsBySubject, Test } from "@/lib/testsApi";
import { Box, Typography, Grid, Card, Button, Stack, CircularProgress, Alert } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import TimerIcon from "@mui/icons-material/Timer";
import QuizIcon from "@mui/icons-material/Quiz";
import Link from "next/link";

export default function SubjectTestsPage() {
  const params = useParams();
  const sid = params.sid as string;
  const router = useRouter();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (sid) {
      getTestsBySubject(sid)
        .then(setTests)
        .catch(e => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [sid]);

  if (loading) return (
    <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: 3 }}>
      <Button component={Link} href="/tests" startIcon={<ArrowBackIcon />} sx={{ mb: 3 }}>
        Back to Subjects
      </Button>
      
      <Typography variant="h4" fontWeight={800} mb={1}>Available Tests</Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        Select a test to begin your assessment.
      </Typography>

      {error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Grid container spacing={3}>
          {tests.map((test) => (
            <Grid size={{ xs: 12, sm: 6 }} key={test.id}>
              <Card variant="outlined" sx={{ borderRadius: 3, p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>{test.title}</Typography>
                <Typography variant="body2" color="text.secondary" mb={2} sx={{ flexGrow: 1 }}>
                  {test.description || "No description available."}
                </Typography>
                
                <Stack direction="row" spacing={2} mb={3}>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <QuizIcon fontSize="small" color="action" />
                    <Typography variant="caption">{test.question_count} Questions</Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <TimerIcon fontSize="small" color="action" />
                    <Typography variant="caption">{test.duration} Min</Typography>
                  </Stack>
                </Stack>

                <Button 
                  fullWidth 
                  variant="contained" 
                  onClick={() => router.push(`/tests/take/${test.id}`)}
                  disabled={test.question_count === 0}
                >
                  Start Test
                </Button>
              </Card>
            </Grid>
          ))}
          {tests.length === 0 && (
            <Grid size={{ xs: 12 }}>
              <Alert severity="info">No tests found for this subject yet. Check back later!</Alert>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
}

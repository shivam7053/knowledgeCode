"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSubjects, Subject } from "@/lib/testsApi";
import { Box, Typography, Grid, Card, CardActionArea, Chip, CircularProgress, Alert } from "@mui/material";

const badgeColor: Record<string, "warning"|"primary"|"secondary"|"success"> = {
  "badge-orange": "warning", "badge-blue": "primary",
  "badge-purple": "secondary", "badge-green": "success",
};

export default function SubjectsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getSubjects().then(setSubjects).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: 3 }}>
      <Typography variant="h5" fontWeight={700} mb={0.5}>Choose a Subject</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>Select a subject to view available tests</Typography>
      
      {loading ? (
        <Grid container spacing={2}>
          {[...Array(4)].map((_, i) => ( // Show 4 skeleton cards
            <Grid size={{ xs: 6, sm: 4, md: 3 }} key={i}>
              <Card variant="outlined" sx={{ borderRadius: 3, p: 2.5, textAlign: "center", height: 150, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress size={30} sx={{ mb: 1 }} />
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
      <Grid container spacing={2}>
        {subjects.map(s => (
          <Grid size={{ xs: 6, sm: 4, md: 3 }} key={s.id}>
            <Card variant="outlined" sx={{ borderRadius: 3, transition: ".15s", "&:hover": { borderColor: "primary.main", transform: "translateY(-2px)", boxShadow: 2 } }}>
              <CardActionArea sx={{ p: 2.5, textAlign: "center" }} onClick={() => router.push(`/tests/${s.id}`)}>
                <Typography fontSize={40} mb={0.5}>{s.icon}</Typography>
                <Typography fontWeight={600} fontSize={15}>{s.name}</Typography>
                <Chip label={`${s.test_count} test${s.test_count !== 1 ? "s" : ""}`} size="small"
                  color={badgeColor[s.color] || "primary"} sx={{ mt: 0.75, fontSize: 11 }} />
              </CardActionArea>
            </Card>
          </Grid>
        ))}
        {!loading && !error && subjects.length === 0 && (
          <Grid size={12}><Alert severity="info">No subjects available yet. Check back later!</Alert></Grid>
        )}
      </Grid>
      )}
    </Box>
  );
}
"use client";

import React, { useState, useEffect } from "react";
import {
  Box, Container, Typography, Grid, Card, CardContent,
  Button, Stack, Chip, Paper, CircularProgress, Alert
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import CodeIcon from "@mui/icons-material/Code";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

const API_BASE = "http://localhost:8000/practice";

export default function TestListPage() {
  const theme = useTheme();
  const router = useRouter();
  const params = useParams();
  const categoryName = params.id as string;

  const [category, setCategory] = useState<any>(null);
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [catRes, probRes] = await Promise.all([
          fetch(`${API_BASE}/categories`),
          fetch(`${API_BASE}/problems/${categoryName}`)
        ]);

        const cats = await catRes.json();
        const probs = await probRes.json();

        setCategory(cats.find((c: any) => c.name === categoryName));
        setProblems(probs);
      } catch (err) {
        setError("Failed to load challenges.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [categoryName]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;
  if (error) return <Container maxWidth="md" sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container>;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => router.push("/practice")} sx={{ mb: 3 }}>
        Back to Categories
      </Button>
      
      <Paper variant="outlined" sx={{ 
        p: 4, borderRadius: 4, mb: 4, 
        background: category?.image_url 
          ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${category.image_url})` 
          : theme.palette.primary.main,
        backgroundSize: 'cover', backgroundPosition: 'center', color: 'white'
      }}>
        <Typography variant="h3" fontWeight={800}>{category?.title || categoryName}</Typography>
        <Typography variant="h6" sx={{ opacity: 0.9 }}>{problems.length} Challenges Available</Typography>
      </Paper>

      <Grid container spacing={2}>
        {problems.map((prob) => (
          <Grid item xs={12} key={prob.id || prob._id}>
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 3 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}><CodeIcon /></Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>{prob.title}</Typography>
                    <Stack direction="row" spacing={1}>
                      <Chip label={prob.difficulty} size="small" variant="outlined" />
                      <Chip label={prob.language} size="small" variant="outlined" sx={{ textTransform: 'uppercase' }} />
                    </Stack>
                  </Box>
                </Stack>
                <Button 
                  variant="contained" component={Link} 
                  href={`/practice/testwindow/${prob.id || prob._id}`} 
                  sx={{ borderRadius: 2, px: 4 }}
                >
                  Start Test
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
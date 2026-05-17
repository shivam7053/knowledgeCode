// practice/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Box, Container, Typography, Grid, Card, CardContent, CardActionArea,
  Stack, CardMedia
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import Link from "next/link";

const API_BASE = "http://localhost:8000/practice";

export default function PracticePage() {
  const theme = useTheme();
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchInitialCategories = async () => {
      try {
        const res = await fetch(`${API_BASE}/categories`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setCategories(data);
        } else {
          console.warn("API returned non-array data for categories:", data);
          setCategories([]);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        // Optionally, you could set a state here to display an error message to the user
        setCategories([]); // Ensure categories array is empty on error
      }
    };
    fetchInitialCategories();
  }, []);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={800} gutterBottom sx={{ letterSpacing: -1 }}>
        Code Practice
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        Select a category to start leveling up your coding skills with topic-wise challenges.
      </Typography>

      <Grid container spacing={3}>
        {categories.map((cat) => (
          <Grid item xs={12} sm={6} md={4} key={cat.name}>
            <Card 
              variant="outlined" 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                transition: '0.2s',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: 4, borderColor: 'primary.main' }
              }}
            >
              <CardActionArea component={Link} href={`/practice/testlist/${cat.name}`} sx={{ flexGrow: 1 }}>
                {cat.image_url && (
                  <CardMedia
                    component="img"
                    height="140"
                    image={cat.image_url}
                    alt={cat.title}
                  />
                )}
                <CardContent>
                  <Typography variant="h6" fontWeight={700} gutterBottom>{cat.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Master your skills in {cat.title} with curated challenges.
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
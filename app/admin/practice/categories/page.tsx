"use client";

import React, { useState, useEffect } from "react";
import {
  Box, Container, Typography, Paper, TextField, Button, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Alert, CircularProgress, Divider, IconButton, Grid
} from "@mui/material";
import { ArrowBack as BackIcon, Add as AddIcon, FolderOpen as CategoryIcon } from "@mui/icons-material";
import Link from "next/link";

const API_BASE = "http://localhost:8000/practice";

export default function CategoryManagement() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ name: "", title: "", image_url: "" });
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const res = await fetch(`${API_BASE}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setFormData({ name: "", title: "", image_url: "" });
        fetchCategories();
      } else {
        setError("Failed to create category. Ensure the name is unique.");
      }
    } catch (err) {
      setError("Connection error.");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack direction="row" alignItems="center" spacing={2} mb={4}>
        <Link href="/admin" style={{ textDecoration: "none" }}>
          <Button startIcon={<BackIcon />}>Admin Home</Button>
        </Link>
        <Typography variant="h4" fontWeight={800}>Practice Categories</Typography>
      </Stack>

      <Grid container spacing={4}>
        {/* Form Side */}
        <Grid item xs={12} md={5}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Add New Category</Typography>
            <form onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField 
                  fullWidth label="Category Title" 
                  placeholder="e.g. SQL Basics"
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  required 
                />
                <TextField 
                  fullWidth label="Category Name (Slug)" 
                  placeholder="e.g. sql-basics"
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value.toLowerCase().replace(/\s+/g, '-')})} 
                  required 
                  helperText="Used for internal identifiers and URLs."
                />
                <TextField 
                  fullWidth label="Hero Image URL" 
                  placeholder="https://example.com/hero.jpg"
                  value={formData.image_url} 
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})} 
                  helperText="Optional image to display on the practice page."
                />
                <Button 
                  type="submit" variant="contained" 
                  disabled={submitLoading} 
                  startIcon={submitLoading ? <CircularProgress size={20} /> : <AddIcon />}
                >
                  Create
                </Button>
              </Stack>
            </form>
          </Paper>
        </Grid>

        {/* List Side */}
        <Grid item xs={12} md={7}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Image</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Title (Display)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Name (ID)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map((cat) => (
                  <TableRow key={cat.id || cat._id}>
                    <TableCell>
                      {cat.image_url ? (
                        <Box 
                          component="img" 
                          src={cat.image_url} 
                          sx={{ width: 50, height: 32, borderRadius: 1, objectFit: 'cover' }} 
                        />
                      ) : (
                        <Typography variant="caption" color="text.disabled">No Image</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <CategoryIcon fontSize="small" color="primary" />
                        <Typography variant="body2" fontWeight={600}>{cat.title}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell><code style={{ fontSize: '0.85rem' }}>{cat.name}</code></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Container>
  );
}

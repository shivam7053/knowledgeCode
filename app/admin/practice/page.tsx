"use client";

import React, { useState, useEffect } from "react";
import { 
  Box, Container, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Button, IconButton, Chip, 
  CircularProgress, Alert 
} from "@mui/material";
import { Delete as DeleteIcon, Terminal as TerminalIcon, Add as AddIcon, Edit as EditIcon } from "@mui/icons-material";
import Link from "next/link";

const API_BASE = "http://localhost:8000/practice";

export default function AdminPracticeList() {
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProblems = async () => {
    try {
      const res = await fetch(`${API_BASE}/problems`);
      const data = await res.json();
      setProblems(data);
    } catch (err) {
      setError("Failed to load challenges from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProblems(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this challenge?")) return;
    try {
      const res = await fetch(`${API_BASE}/problem/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProblems(problems.filter(p => p._id !== id));
      }
    } catch (err) {
      alert("Failed to delete challenge.");
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>Manage Challenges</Typography>
        <Link href="/admin/practice/new" style={{ textDecoration: 'none' }}>
          <Button variant="contained" startIcon={<AddIcon />}>Create New</Button>
        </Link>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Difficulty</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {problems.map((prob) => (
              <TableRow key={prob._id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TerminalIcon fontSize="small" color="primary" />
                    <Typography variant="body2" fontWeight={600}>{prob.title}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label={prob.category} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={prob.difficulty} 
                    size="small" 
                    color={prob.difficulty === "Easy" ? "success" : "warning"} 
                  />
                </TableCell>
                <TableCell>
                  <IconButton color="primary" component={Link} href={`/admin/practice/edit/${prob._id}`}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDelete(prob._id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

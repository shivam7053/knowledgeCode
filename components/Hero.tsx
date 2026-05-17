"use client";
import { Button, Chip, Typography, Box, Container } from "@mui/material";
import { ArrowForward as ArrowRightIcon, MenuBook as BookOpenIcon } from "@mui/icons-material";
import Link from "next/link";

export default function Hero() {
  return (
    <Box component="section" sx={{ position: 'relative', py: 12, textAlign: 'center', overflow: 'hidden' }}>
      {/* Decorative background element */}
      <Box sx={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', height: '100%', 
        background: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.1) 0%, transparent 70%)', zIndex: -1 }} />
      
      <Container maxWidth="md" sx={{ zIndex: 10 }}>
        <Chip label="New: AI-Powered Learning Paths" color="primary" variant="outlined" sx={{ mb: 4, px: 3, py: 1.5, borderRadius: 2, animation: 'pulse 2s infinite' }} />
        <Typography variant="h2" component="h1" sx={{ fontWeight: 'extrabold', mb: 3, lineHeight: 1.1, 
          background: 'linear-gradient(to bottom, text.primary 0%, rgba(255,255,255,0.7) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Unlock Your Potential with <Box component="span" sx={{ background: 'linear-gradient(to right, #059669, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>KnowledgeCode</Box>
        </Typography>
        <Typography variant="h5" sx={{ mb: 6, color: 'text.secondary', fontWeight: 300 }}>
          The ultimate hub for professional courses, daily news, and mind-blowing facts. 
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button 
            variant="contained"
            size="large" 
            color="primary" 
            endIcon={<ArrowRightIcon />}
            sx={{ px: 4, py: 1.5, fontWeight: 'bold', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)' }}
          >
            Explore Courses
          </Button>
          <Button 
            variant="outlined"
            size="large" 
            startIcon={<BookOpenIcon />}
            sx={{ px: 4, py: 1.5, borderColor: 'primary.main', color: 'primary.main' }}
          >
            Read News
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
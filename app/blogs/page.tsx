"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Box, Container, Typography, Card, CardContent, CardMedia, Chip, 
  CircularProgress, Stack, Paper, alpha, useTheme 
} from "@mui/material";
import Grid from "@mui/material/Grid";
import Link from "next/link";
import { useChillMode } from "@/app/providers";

export default function BlogsPage() {
  const theme = useTheme();
  const { isChillMode } = useChillMode();
  const primary = theme.palette.primary.main;
  const isDark = theme.palette.mode === "dark";

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  // Mouse movement tracking for 3D Cube
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!heroRef.current) return;
      const { clientX, clientY } = event;
      const { offsetWidth, offsetHeight } = heroRef.current;
      const { left, top } = heroRef.current.getBoundingClientRect();

      const centerX = left + offsetWidth / 2;
      const centerY = top + offsetHeight / 2;

      const diffX = clientX - centerX;
      const diffY = clientY - centerY;

      const sensitivity = 0.05;
      setRotation({ x: -diffY * sensitivity, y: diffX * sensitivity });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Fetching posts from internal API (replaces direct DB access in Client Component)
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch('/api/blogs'); // Assuming an API route exists for post fetching
        const data = await res.json();
        setPosts(data);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const cubeColor = isDark ? alpha(primary, 0.2) : alpha(primary, 0.1);
  const cubeGradient = isDark
    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.8)}, ${alpha(theme.palette.secondary.dark, 0.8)})`
    : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.8)}, ${alpha(theme.palette.secondary.light, 0.8)})`;

  return (
    <Box sx={{ minHeight: "100vh", background: theme.palette.background.default, pb: 10 }}>
      {/* Hero Section with Moving Cube */}
      <Box ref={heroRef} sx={{
        position: 'relative',
        background: isDark ? 'transparent' : alpha(theme.palette.background.paper, 0.4),
        borderBottom: `1px solid ${alpha(primary, 0.12)}`,
        pt: { xs: 8, md: 12 }, pb: { xs: 6, md: 10 },
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        minHeight: '50vh'
      }}>
        {/* Rotating 3D Cube Background */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 320,
            height: 320,
            transform: `translate(-50%, -50%) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
            background: cubeGradient,
            borderRadius: '24%',
            boxShadow: `0 0 120px 60px ${cubeColor}`,
            transition: 'transform 0.1s ease-out',
            zIndex: 0,
            perspective: '1000px',
            transformStyle: 'preserve-3d',
            '&::before, &::after': {
              content: '""',
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              borderRadius: '24%',
              background: `linear-gradient(to bottom right, ${alpha(theme.palette.background.paper, 0.1)}, transparent)`,
              transform: 'translateZ(-60px)',
              opacity: 0.7,
            },
            '&::after': {
              transform: 'translateZ(60px)',
              background: `linear-gradient(to top left, ${alpha(theme.palette.background.paper, 0.1)}, transparent)`,
            }
          }}
        />

        <Container maxWidth="lg">
          <Stack sx={{ alignItems: "center", textAlign: "center", position: 'relative', zIndex: 1 }}>
            <Chip label="Knowledge Base" size="small" sx={{ mb: 2, fontWeight: 700, fontSize: 11, background: alpha(primary, 0.12), color: primary, border: `1px solid ${alpha(primary, 0.25)}` }} />
            <Typography variant="h2" fontWeight={800} sx={{
              fontSize: { xs: "2.5rem", md: "4.5rem" }, letterSpacing: "-0.04em",
              background: isChillMode
                ? `linear-gradient(135deg, #ef4444, ${isDark ? "#fff" : "#000"})`
                : `linear-gradient(135deg, ${primary}, ${theme.palette.text.primary})`,
              backgroundClip: "text", WebkitBackgroundClip: "text", color: "transparent", mb: 1,
            }}>
              The Blog
            </Typography>
            <Typography variant="h6" color="text.secondary" fontWeight={400} sx={{ maxWidth: 640, lineHeight: 1.6 }}>
              Tech insights, coding tutorials, and industry news.
              <Box component="span" sx={{ display: "block", mt: 1, fontWeight: 700, color: "text.primary" }}>
                Stay updated with the latest in development.
              </Box>
            </Typography>

            <Stack direction="row" sx={{ gap: 4, mt: 5, flexWrap: "wrap", justifyContent: "center" }}>
              {[
                { label: "Articles", value: "100+" },
                { label: "Authors", value: "12" },
                { label: "Topics", value: "8" },
              ].map((s) => (
                <Box key={s.label} sx={{ textAlign: "center" }}>
                  <Typography variant="h4" fontWeight={800} color="primary">{s.value}</Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</Typography>
                </Box>
              ))}
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ mt: 6 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        ) : posts.length === 0 ? (
          <Typography variant="h6" color="text.secondary" align="center" sx={{ py: 10 }}>
            No blog posts found.
          </Typography>
        ) : (
          <Grid container spacing={4}>
            {posts.map((post) => (
              <Grid key={post._id} size={{ xs: 12, sm: 6, md: 4 }} sx={{ display: 'flex' }}>
                <Card sx={{ width: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: 3 } }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={post.image || "https://via.placeholder.com/600x400?text=KnowledgeCode"}
                    alt={post.title}
                    sx={{ objectFit: 'cover', width: '100%' }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Chip 
                      label={post.category} 
                      size="small" 
                      color="primary" 
                      sx={{ mb: 1.5, textTransform: 'capitalize', fontWeight: 'bold' }} 
                    />
                    <Link href={`/blogs/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', mt: 1, mb: 1.5, transition: 'color 0.2s', '&:hover': { color: 'primary.main' } }}>
                        {post.title}
                      </Typography>
                    </Link>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {post.excerpt || (post.content ? `${post.content.substring(0, 150)}...` : '')}
                    </Typography>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mt: 'auto', pt: 2 }}>
                      <Typography variant="caption" color="text.secondary">By {post.author}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}
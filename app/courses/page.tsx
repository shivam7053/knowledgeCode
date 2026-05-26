"use client";

import FeaturedCourses from "@/components/FeaturedCourses";
import { Box, Container, Typography, Chip, Stack, CircularProgress, alpha, useTheme } from "@mui/material";
import React, { useState, useEffect, useRef } from "react";
import { useChillMode } from "@/app/providers";

export default function CoursesPage() {
  const theme = useTheme();
  const { isChillMode } = useChillMode();
  const primary = theme.palette.primary.main;
  const isDark = theme.palette.mode === "dark";

  const [courses, setCourses] = useState<any[]>([]);
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

  // Fetching courses from internal API
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch('/api/courses');
        const data = await res.json();
        setCourses(data);
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const cubeColor = isDark ? alpha(primary, 0.2) : alpha(primary, 0.1);
  const cubeGradient = isDark
    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.8)}, ${alpha(theme.palette.secondary.dark, 0.8)})`
    : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.8)}, ${alpha(theme.palette.secondary.light, 0.8)})`;

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
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
            <Chip label="Professional Development" size="small" sx={{ mb: 2, fontWeight: 700, fontSize: 11, background: alpha(primary, 0.12), color: primary, border: `1px solid ${alpha(primary, 0.25)}` }} />
            <Typography variant="h2" fontWeight={800} sx={{
              fontSize: { xs: "2.5rem", md: "4.5rem" }, letterSpacing: "-0.04em",
              background: isChillMode
                ? `linear-gradient(135deg, #ef4444, ${isDark ? "#fff" : "#000"})`
                : `linear-gradient(135deg, ${primary}, ${theme.palette.text.primary})`,
              backgroundClip: "text", WebkitBackgroundClip: "text", color: "transparent", mb: 1,
            }}>
              Our Courses
            </Typography>
            <Typography variant="h6" color="text.secondary" fontWeight={400} sx={{ maxWidth: 640, lineHeight: 1.6 }}>
              Master new skills with our expert-led courses.
              <Box component="span" sx={{ display: "block", mt: 1, fontWeight: 700, color: "text.primary" }}>
                From beginner to advanced, find your learning path.
              </Box>
            </Typography>

            <Stack direction="row" sx={{ gap: 4, mt: 5, flexWrap: "wrap", justifyContent: "center" }}>
              {[
                { label: "Courses", value: "50+" },
                { label: "Instructors", value: "15+" },
                { label: "Categories", value: "10+" },
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

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <FeaturedCourses courses={courses} title="All Courses" hideViewAll={true} />
      )}
    </Box>
  );
}

"use client";
import { Button, Chip, Typography, Box, Container, Card, CardContent, Stack } from "@mui/material";
import { ArrowForward as ArrowRightIcon, MenuBook as BookOpenIcon } from "@mui/icons-material";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useTheme, alpha } from "@mui/material/styles";

export default function Hero() {
  const theme = useTheme();
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [activeStep, setActiveStep] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  const projectInfo = [
    { title: "AI-Powered Learning", description: "Personalized paths and intelligent feedback to accelerate your growth.", icon: "🧠" },
    { title: "Advanced Document Tools", description: "Streamline your workflow with smart resume analysis and code generation.", icon: "🛠️" },
    { title: "Interactive Coding Challenges", description: "Practice and master new languages with real-time compiler and tests.", icon: "💻" },
  ];

  useEffect(() => {
    const autoPlay = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % projectInfo.length);
    }, 5000);

    const handleMouseMove = (event: MouseEvent) => {
      if (!heroRef.current) return;

      const { clientX, clientY } = event;
      const { offsetWidth, offsetHeight } = heroRef.current;
      const { left, top } = heroRef.current.getBoundingClientRect();

      // Calculate center of the hero section
      const centerX = left + offsetWidth / 2;
      const centerY = top + offsetHeight / 2;

      // Calculate difference from center
      const diffX = clientX - centerX;
      const diffY = clientY - centerY;

      // Normalize to -1 to 1 range and apply sensitivity
      const sensitivity = 0.05; // Adjust this value for more/less rotation
      const newRotateY = diffX * sensitivity;
      const newRotateX = -diffY * sensitivity; // Invert Y for natural feel

      setRotation({ x: newRotateX, y: newRotateY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      clearInterval(autoPlay);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [projectInfo.length]);

  // Determine cube color based on theme
  const cubeColor = theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.primary.main, 0.1);
  const cubeGradient = theme.palette.mode === 'dark'
    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.8)}, ${alpha(theme.palette.secondary.dark, 0.8)})`
    : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.8)}, ${alpha(theme.palette.secondary.light, 0.8)})`;

  return (
    <Box component="section" ref={heroRef} sx={{ position: 'relative', py: 12, textAlign: 'center', overflow: 'hidden', minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      {/* Decorative background element - now the rotating cube */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 300, // Size of the cube
          height: 300,
          transform: `translate(-50%, -50%) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          background: cubeGradient, // Use gradient for more depth
          borderRadius: '20%', // Make it a rounded cube-like shape
          boxShadow: `0 0 100px 50px ${cubeColor}`, // Glow effect
          transition: 'transform 0.1s ease-out', // Smooth rotation
          zIndex: -1,
          perspective: '1000px', // Add perspective to the element itself
          '&::before, &::after': { // Pseudo-elements for more depth/faces
            content: '""',
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            borderRadius: '20%',
            background: `linear-gradient(to bottom right, ${alpha(theme.palette.background.paper, 0.1)}, transparent)`,
            transform: 'translateZ(-50px)', // Push one face back
            opacity: 0.7,
          },
          '&::after': {
            transform: 'translateZ(50px)', // Pull another face forward
            background: `linear-gradient(to top left, ${alpha(theme.palette.background.paper, 0.1)}, transparent)`,
            opacity: 0.7,
          }
        }}
      />
      
      <Container maxWidth="md" sx={{ zIndex: 10 }}>
        <Chip label="New: AI-Powered Learning Paths" color="primary" variant="outlined" sx={{ mb: 4, px: 3, py: 1.5, borderRadius: 2, animation: 'pulse 2s infinite' }} />
        <Typography variant="h2" component="h1" sx={{ fontWeight: 'extrabold', mb: 3, lineHeight: 1.1,
          background: `linear-gradient(to bottom, ${theme.palette.text.primary} 0%, ${alpha(theme.palette.text.primary, 0.7)} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Unlock Your Potential with <Box component="span" sx={{ background: 'linear-gradient(to right, #059669, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>KnowledgeCode</Box>
        </Typography>
        <Typography variant="h5" sx={{ mb: 6, color: 'text.secondary', fontWeight: 300 }}>
          The ultimate hub for professional courses, daily news, and mind-blowing facts. 
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mb: 8 }}> {/* Added mb for spacing */}
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

        {/* Animated Project Catalogue */}
        <Box sx={{ width: '100%', overflow: 'hidden', position: 'relative', mt: 4 }}>
          <Box
            sx={{
              display: 'flex',
              transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: `translateX(-${activeStep * 100}%)`,
            }}
          >
            {projectInfo.map((item, index) => (
              <Box key={index} sx={{ minWidth: '100%', display: 'flex', justifyContent: 'center', px: 2, boxSizing: 'border-box' }}>
                <Card variant="outlined" sx={{ maxWidth: 450, width: '100%', p: 2, borderRadius: 4, bgcolor: alpha(theme.palette.background.paper, 0.6), backdropFilter: 'blur(10px)', border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.2) }}>
                  <CardContent>
                    <Typography variant="h3" mb={1}>{item.icon}</Typography>
                    <Typography variant="h5" fontWeight={800} gutterBottom>{item.title}</Typography>
                    <Typography variant="body1" color="text.secondary">{item.description}</Typography>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Catalogue Indicators */}
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ mt: 2, width: '100%', justifyContent: 'center', alignItems: 'center' }}
        >
          {projectInfo.map((_, i) => (
            <Box
              key={i}
              onClick={() => setActiveStep(i)}
              sx={{
                width: i === activeStep ? 32 : 10,
                height: 10,
                borderRadius: 5,
                bgcolor: i === activeStep ? 'primary.main' : alpha(theme.palette.text.primary, 0.2),
                transition: 'all 0.4s ease',
                cursor: 'pointer',
              }}
            />
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
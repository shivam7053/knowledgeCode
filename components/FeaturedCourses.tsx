"use client";
import { PlayCircle as PlayCircleIcon } from "@mui/icons-material";
import { Card, CardContent, CardMedia, CardActions, Typography, Button, Box, Link as MuiLink, Grid } from "@mui/material";
import Link from "next/link";

interface FeaturedCoursesProps {
  courses: any[];
  title?: string;
  hideViewAll?: boolean;
}

export default function FeaturedCourses({ courses, title = "Popular Courses", hideViewAll = false }: FeaturedCoursesProps) {
  if (!courses || courses.length === 0) return null;

  return (
    <Box component="section" sx={{ py: 8, px: 3, maxWidth: '1200px', mx: 'auto' }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'flex-end' }, mb: 6, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{title}</Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>Elevate your skills with our curated professional paths.</Typography>
        </Box>
        {!hideViewAll && (
          <Button component={Link} href="/courses" variant="outlined" color="primary" sx={{ fontWeight: 'bold', px: 3, py: 1 }}>
            View All Courses
          </Button>
        )}
      </Box>

      {/* Using Grid2 for modern Material UI grid system */}
      <Grid container spacing={4}>
        {courses.map((course: any) => (
          <Grid size={{ xs: 12, md: 6 }} key={course.slug}>
            <Card variant="outlined" sx={{ display: 'flex', flexDirection: 'column', height: '100%', transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: 3 } }}>
              <CardMedia
                component="img"
                height="280"
                image={course.thumbnail || "https://via.placeholder.com/600x280?text=KnowledgeCode+Course"}
                alt={course.title}
                sx={{ borderRadius: 0 }}
              />
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Typography variant="h5" component="h3" sx={{ fontWeight: 'bold', mb: 1 }}>{course.title}</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>Instructor: {course.instructor}</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
                  <Button component={Link} href={`/courses/${course.slug}`} variant="contained" color="primary" startIcon={<PlayCircleIcon />}>
                    Start Learning
                  </Button>
                  <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                    {course.price === 0 ? "Free" : `$${course.price}`}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
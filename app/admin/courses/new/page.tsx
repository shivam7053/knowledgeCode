//admin/new

import React from "react";
import { Container, Typography, Box, Button, Stack } from "@mui/material";
import { ArrowBack as BackIcon } from "@mui/icons-material";
import Link from "next/link";
import CourseForm from "@/components/admin/CourseForm";
import { createCourse } from "@/app/actions/course-actions";

export default function NewCoursePage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <Link href="/admin/courses" style={{ textDecoration: 'none' }}>
          <Button startIcon={<BackIcon />}>Back to Courses</Button>
        </Link>
        <Typography variant="h4" sx={{ fontWeight: 900 }}>Create New Course</Typography>
      </Stack>

      <Box sx={{ mt: 2 }}>
        <CourseForm 
          action={createCourse} 
          submitButtonText="Publish Course" 
        />
      </Box>
    </Container>
  );
}
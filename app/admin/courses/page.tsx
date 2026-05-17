import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Stack, Chip } from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, School as SchoolIcon } from "@mui/icons-material";
import Link from "next/link";
import connectDB from "@/lib/mongodb";
import Course from "@/models/Course";
import { deleteCourse } from "@/app/actions/course-actions";

export default async function AdminCoursesPage() {
  await connectDB();
  const courses = await Course.find().sort({ createdAt: -1 }).lean();

  return (
    <Box sx={{ pb: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}>
            <SchoolIcon color="primary" fontSize="large" />
            Course Management
          </Typography>
          <Typography color="text.secondary">Organize and track your professional learning paths.</Typography>
        </Box>
        <Link href="/admin/courses/new" style={{ textDecoration: 'none' }}>
          <Button variant="contained" startIcon={<AddIcon />} sx={{ px: 3 }}>
            New Course
          </Button>
        </Link>
      </Stack>

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Course Title</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Instructor</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Curriculum</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Price</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Management</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {courses.map((course: any) => (
              <TableRow key={course._id} hover>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{course.title}</Typography>
                  <Typography variant="caption" color="text.secondary">Slug: {course.slug}</Typography>
                </TableCell>
                <TableCell>{course.instructor}</TableCell>
                <TableCell>
                  <Chip 
                    label={`${course.topics?.length || 0} Modules`} 
                    size="small" 
                    variant="outlined" 
                    color="primary" 
                    sx={{ fontWeight: 'bold' }}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  {course.price === 0 ? "Free" : `$${course.price}`}
                </TableCell>
                <TableCell>{new Date(course.createdAt).toLocaleDateString()}</TableCell>
                <TableCell sx={{ textAlign: 'right' }}>
                  <Link href={`/admin/courses/edit/${course._id}`} style={{ textDecoration: 'none' }}>
                    <IconButton size="small" color="primary" sx={{ mr: 1 }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Link>
                  <Box component="form" action={deleteCourse} sx={{ display: 'inline' }}>
                    <input type="hidden" name="id" value={course._id.toString()} />
                    <IconButton type="submit" size="small" color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {courses.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} sx={{ py: 10, textAlign: 'center' }}>
                  <Typography color="text.secondary">No courses available yet.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

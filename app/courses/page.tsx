import FeaturedCourses from "@/components/FeaturedCourses";
import connectDB from "@/lib/mongodb";
import { Box } from "@mui/material";
import Course from "@/models/Course";

export default async function CoursesPage() {
  await connectDB();
  const allCourses = await Course.find({ isPublished: true }).sort({ createdAt: -1 }).lean();
  const serializedCourses = JSON.parse(JSON.stringify(allCourses));

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <FeaturedCourses courses={serializedCourses} title="All Courses" hideViewAll={true} />
    </Box>
  );
}

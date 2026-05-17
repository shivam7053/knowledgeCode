import FeaturedCourses from "@/components/FeaturedCourses";
import FeaturedPosts from "@/components/FeaturedPosts";
import Hero from "@/components/Hero";
import connectDB from "@/lib/mongodb";
import Post from "@/models/Post";
import Course from "@/models/Course";
import Box from "@mui/material/Box";

export default async function Home() {
  await connectDB();

  // Fetch data in parallel for optimal performance
  const [latestPosts, popularCourses] = await Promise.all([
    Post.find({}).sort({ createdAt: -1 }).limit(4).lean(),
    Course.find({ isPublished: true }).lean() // Removed .limit(2) to show all courses
  ]);

  // Serialize Mongoose documents to plain JSON for Client Components
  const serializedPosts = JSON.parse(JSON.stringify(latestPosts));
  const serializedCourses = JSON.parse(JSON.stringify(popularCourses));

  return (
    <Box component="main">
      <Hero />
      <FeaturedCourses courses={serializedCourses} />
      <FeaturedPosts posts={serializedPosts} />
    </Box>
  );
}
  

import connectDB from "@/lib/mongodb";
import Course from "@/models/Course";
import { notFound } from "next/navigation";
import CourseClient from "./CourseClient";

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectDB();
  
  const course = await Course.findOne({ slug }).lean();
  
  if (!course) {
    notFound();
  }

  // Serialize Mongoose object to a plain JS object
  const courseData = JSON.parse(JSON.stringify(course));

  return <CourseClient course={courseData} />;
}

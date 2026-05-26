import connectDB from "@/lib/mongodb";
import Course from "@/models/Course";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    const courses = await Course.find({ isPublished: true }).sort({ createdAt: -1 }).lean();
    // Serialize ObjectId to string and Date objects to ISO strings
    const serializedCourses = courses.map(course => ({
      ...course,
      _id: course._id.toString(),
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
    }));
    return NextResponse.json(serializedCourses);
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    return NextResponse.json({ message: "Failed to fetch courses" }, { status: 500 });
  }
}
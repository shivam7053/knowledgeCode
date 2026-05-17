import React from "react";
import { Container, Typography, Box, Button, Stack } from "@mui/material";
import { ArrowBack as BackIcon } from "@mui/icons-material";
import Link from "next/link";
import CourseForm from "@/components/admin/CourseForm";
import { updateCourse } from "@/app/actions/course-actions";
import connectDB from "@/lib/mongodb";
import Course from "@/models/Course";
import { notFound } from "next/navigation";
import mongoose from "mongoose";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  console.log("DEBUG: Edit page called with id:", id);

  // ✅ Validate that id is a valid MongoDB ObjectId before querying.
  // An invalid id causes findById to throw, not return null — which
  // Next.js surfaces as a 500 or blank page rather than a clean 404.
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    console.error("DEBUG: Invalid ObjectId received:", id);
    notFound();
  }

  try {
    await connectDB();
  } catch (err) {
    console.error("DEBUG: DB connection failed:", err);
    throw new Error("Failed to connect to database");
  }

  let courseData: any = null;
  try {
    courseData = await Course.findById(id).lean();
    console.log("DEBUG: findById result:", courseData ? "found" : "null");
  } catch (err) {
    console.error("DEBUG: findById threw an error:", err);
    throw new Error("Failed to fetch course");
  }

  if (!courseData) {
    console.error("DEBUG: Course not found for id:", id);
    notFound();
  }

  console.log(
    "DEBUG: Server-side Raw course data from DB:",
    JSON.stringify(courseData, null, 2)
  );

  // Deeply serialize — converts ObjectId / Date instances to plain strings
  const serializedCourse = JSON.parse(JSON.stringify(courseData));

  // Ensure topics and subtopics are always clean arrays with string _ids
  const processedTopics = (serializedCourse.topics || []).map((topic: any) => {
    const processedSubtopics = (topic.subtopics || []).map((subtopic: any) => ({
      ...subtopic,
      _id: subtopic._id ? subtopic._id.toString() : undefined,
    }));

    return {
      ...topic,
      _id: topic._id ? topic._id.toString() : undefined,
      subtopics: processedSubtopics,
    };
  });

  console.log("DEBUG: Processed topics count:", processedTopics.length);

  const initialData = {
    ...serializedCourse,
    id: serializedCourse._id.toString(),
    topics: processedTopics,
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <Link href="/admin/courses" style={{ textDecoration: "none" }}>
          <Button startIcon={<BackIcon />}>Back to Courses</Button>
        </Link>
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          Edit Course
        </Typography>
      </Stack>

      <Box sx={{ mt: 2 }}>
        <CourseForm
          initialData={initialData}
          action={updateCourse}
          submitButtonText="Update Course"
        />
      </Box>
    </Container>
  );
}
'use server'
import connectDB from "@/lib/mongodb";
import Course from "@/models/Course";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Strips _id from topics/subtopics so Mongoose doesn't confuse them
// with existing subdocument references during replacement.
function sanitizeTopics(topics: any[]) {
  return topics.map(({ _id, ...topic }) => ({
    ...topic,
    subtopics: (topic.subtopics || []).map(({ _id, ...sub }: any) => sub),
  }));
}

export async function createCourse(prevState: any, formData: FormData) {
  await connectDB();

  const rawTopics = JSON.parse(formData.get('topics') as string || '[]');
  const topics = sanitizeTopics(rawTopics);

  const rawData = {
    title: formData.get('title'),
    slug: formData.get('slug'),
    description: formData.get('description'),
    instructor: formData.get('instructor') || "Admin",
    thumbnail: formData.get('thumbnail'),
    price: Number(formData.get('price')) || 0,
    topics,
    isPublished: true,
  };

  try {
    await Course.create(rawData);
  } catch (error: any) {
    if (error.code === 11000) {
      return { error: "A course with this URL slug already exists." };
    }
    console.error("Failed to create course:", error);
    return { error: "An unexpected error occurred while saving the course." };
  }

  revalidatePath('/');
  revalidatePath('/courses');
  redirect('/admin');
}

export async function updateCourse(prevState: any, formData: FormData) {
  await connectDB();

  const id = formData.get('id') as string;
  const rawTopics = JSON.parse(formData.get('topics') as string || '[]');
  const topics = sanitizeTopics(rawTopics);

  console.log("DEBUG: Sanitized topics for UPDATE:", JSON.stringify(topics, null, 2));

  const replacementData = {
    title: formData.get('title'),
    slug: formData.get('slug'),
    description: formData.get('description'),
    instructor: formData.get('instructor') || "Admin",
    thumbnail: formData.get('thumbnail'),
    price: Number(formData.get('price')) || 0,
    topics,
    isPublished: true,
    updatedAt: new Date(),
  };

  try {
    // ✅ Use native collection.replaceOne — completely replaces the document.
    // This bypasses ALL Mongoose subdocument merge behavior that was silently
    // dropping subtopic fields when using findByIdAndUpdate + $set.
    const { Types } = await import('mongoose');
    const result = await Course.collection.replaceOne(
      { _id: new Types.ObjectId(id) },
      replacementData
    );

    console.log("DEBUG: replaceOne result:", JSON.stringify(result));

    // Verify what's actually in the DB after save
    const verified = await Course.findById(id).lean();
    console.log("DEBUG: Verified DB topics after save:", JSON.stringify(verified?.topics, null, 2));

  } catch (error: any) {
    if (error.code === 11000) {
      return { error: "A course with this URL slug already exists." };
    }
    console.error("Failed to update course:", error);
    return { error: "An unexpected error occurred while updating the course." };
  }

  revalidatePath('/admin/courses');
  redirect('/admin/courses');
}

export async function deleteCourse(formData: FormData) {
  await connectDB();
  const id = formData.get('id');

  try {
    await Course.findByIdAndDelete(id);
    revalidatePath('/admin/courses');
    revalidatePath('/courses');
  } catch (error) {
    console.error("Failed to delete course:", error);
  }
}
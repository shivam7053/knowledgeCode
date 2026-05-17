'use server'
import connectDB from "@/lib/mongodb";
import Post from "@/models/Post";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createPost(prevState: any, formData: FormData) {
  await connectDB();
  
  const rawData = {
    title: formData.get('title'),
    slug: formData.get('slug'),
    category: formData.get('category'),
    image: formData.get('image'),
    content: formData.get('content'),
    excerpt: formData.get('excerpt'),
  };

  try {
    await Post.create(rawData);
  } catch (error: any) {
    // MongoDB duplicate key error code is 11000
    if (error.code === 11000) {
      return { error: "A post with this URL slug already exists. Please choose a unique slug." };
    }
    return { error: "An unexpected error occurred while saving the post." };
  }
  
  revalidatePath('/');
  redirect('/admin');
}

export async function updatePost(prevState: any, formData: FormData) {
  await connectDB();
  const id = formData.get('id');

  const rawData = {
    title: formData.get('title'),
    slug: formData.get('slug'),
    category: formData.get('category'),
    image: formData.get('image'),
    content: formData.get('content'),
    excerpt: formData.get('excerpt'),
  };

  try {
    await Post.findByIdAndUpdate(id, rawData, { new: true, runValidators: true });
  } catch (error: any) {
    if (error.code === 11000) {
      return { error: "A post with this URL slug already exists. Please choose a unique slug." };
    }
    console.error("Failed to update post:", error);
    return { error: "An unexpected error occurred while updating the post." };
  }
  
  revalidatePath('/admin/posts');
  redirect('/admin/posts');
}

export async function deletePost(formData: FormData) {
  await connectDB();
  const id = formData.get('id');

  try {
    await Post.findByIdAndDelete(id);
    revalidatePath('/admin/posts');
    revalidatePath('/');
  } catch (error) {
    console.error("Failed to delete post:", error);
  }
}
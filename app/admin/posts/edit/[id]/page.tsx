import connectDB from "@/lib/mongodb";
import Post from "@/models/Post";
import { notFound } from "next/navigation";
import PostForm from "./PostForm";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectDB();
  const post = await Post.findById(id).lean();
  
  if (!post) {
    notFound();
  }

  const postData = JSON.parse(JSON.stringify(post));

  return <PostForm postData={postData} />;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectDB();
  const post = await Post.findById(id).lean() as { title?: string } | null;
  return {
    title: `Edit Post: ${post?.title || 'Not Found'}`,
  };
}

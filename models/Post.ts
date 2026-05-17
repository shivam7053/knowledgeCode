import mongoose, { Schema, model, models } from "mongoose";

const PostSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    category: { 
      type: String, 
      enum: ["news", "fact", "information"], 
      required: true 
    },
    image: { type: String },
    author: { type: String, default: "Admin" },
    excerpt: { type: String },
  },
  { timestamps: true }
);

const Post = models.Post || model("Post", PostSchema);

export default Post;
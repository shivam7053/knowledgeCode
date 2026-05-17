//model/course.ts

import mongoose, { Schema, model, models } from "mongoose";

const SubtopicSchema = new Schema({
  subtitle: { type: String },
  content: { type: String },
});

const TopicSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String },
  subtopics: { type: [SubtopicSchema], default: [] },
});

const CourseSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    instructor: { type: String, default: "Admin" },
    thumbnail: { type: String },
    price: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
    topics: [TopicSchema], // This is the crucial part for saving curriculum
  },
  {
    timestamps: true,
  }
);

const Course = models.Course || model("Course", CourseSchema);

export default Course;
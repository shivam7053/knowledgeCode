import { redirect } from "next/navigation";
export default function SingularCourseRedirect() {
  redirect("/courses");
}
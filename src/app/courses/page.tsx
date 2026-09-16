import type { Metadata } from "next";
import { CourseListMain } from "@/components/CourseView";

export const metadata: Metadata = { title: "课程" };

export default function CoursesPage() {
  return <CourseListMain pageKey="index" />;
}

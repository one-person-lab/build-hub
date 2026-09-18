import type { Metadata } from "next";
import ProductLibraryView from "@/components/ProductLibraryView";

export const metadata: Metadata = {
  title: "Showcase｜BuildHub · A collection of great products",
  description:
    "Products we admire: AI tools, design, productivity and inspiration sites. No sponsored posts — just why they are good and who they fit.",
  openGraph: {
    title: "Showcase｜BuildHub",
    description: "A collection of great websites and apps, and why they stand out.",
  },
};

export default function EnProductsPage() {
  return <ProductLibraryView locale="en" />;
}

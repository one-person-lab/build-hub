import type { Metadata } from "next";
import AccountView from "@/components/AccountView";

export const metadata: Metadata = { title: "Account · BuildHub" };

export default function EnAccountPage() {
  return <AccountView locale="en" />;
}

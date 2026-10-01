import type { Metadata } from "next";
import AccountView from "@/components/AccountView";

export const metadata: Metadata = { title: "账号 · BuildHub" };

export default function AccountPage() {
  return <AccountView locale="zh" />;
}

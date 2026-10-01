import { NextResponse } from "next/server";
import { currentUser, isPro } from "@/lib/session";
import { PLANS } from "@/lib/plans";

export async function GET() {
  const user = await currentUser();
  return NextResponse.json({
    user: user ? { email: user.email, proUntil: user.proUntil } : null,
    pro: isPro(user),
    plans: PLANS.map(({ key, name, money, listPrice, days }) => ({ key, name, money, listPrice, days })),
  });
}

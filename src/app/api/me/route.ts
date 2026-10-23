import { NextResponse } from "next/server";
import { currentUser, isPro } from "@/lib/session";
import { PLANS, TEST_PLAN, isOwner } from "@/lib/plans";

export async function GET() {
  const user = await currentUser();
  return NextResponse.json({
    user: user ? { email: user.email, proUntil: user.proUntil } : null,
    pro: isPro(user),
    plans: PLANS.map(({ key, name, money, listPrice, days }) => ({ key, name, money, listPrice, days })),
    // 验证单不进 plans，白名单另走一个字段，付费弹窗永远不会渲染它
    payTest: user && isOwner(user.email) ? { key: TEST_PLAN.key, name: TEST_PLAN.name, money: TEST_PLAN.money, days: TEST_PLAN.days } : null,
  });
}

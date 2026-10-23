import { NextResponse } from "next/server";
import { currentUser, isPro } from "@/lib/session";
import { PLANS, TEST_PLAN, isOwner } from "@/lib/plans";
import { getDb } from "@/lib/db";

export async function GET() {
  const user = await currentUser();
  const owner = !!user && isOwner(user.email);
  return NextResponse.json({
    user: user ? { email: user.email, proUntil: user.proUntil } : null,
    pro: isPro(user),
    plans: PLANS.map(({ key, name, money, listPrice, days }) => ({ key, name, money, listPrice, days })),
    // 验证单不进 plans，白名单另走一个字段，付费弹窗永远不会渲染它
    payTest:
      user && owner
        ? {
            key: TEST_PLAN.key,
            name: TEST_PLAN.name,
            money: TEST_PLAN.money,
            days: TEST_PLAN.days,
            // 有一笔已支付没撤销的验证单 → 弹窗里给「撤销」按钮，方便反复验
            revable: !!getDb()
              .prepare(`select 1 from orders where user_id = ? and plan = ? and status = 'paid' limit 1`)
              .get(user.id, TEST_PLAN.key),
          }
        : null,
  });
}

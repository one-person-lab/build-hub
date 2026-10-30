import { NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { getPlan, TEST_PLAN } from "@/lib/plans";
import {
  closeManualOrder,
  createOrder,
  findOpenManualOrder,
  manualOrderState,
  newOutTradeNo,
} from "@/lib/settle";

/**
 * 手机端的人工开通单：微信 Native 码在自己手机上扫不了，所以这里只落一张待核销的订单，
 * 金额按套餐价写死，用户在微信里转账，站长在账号页核销。
 */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const plan = getPlan(String(body?.plan || ""));
  if (!plan || plan.key === TEST_PLAN.key)
    return NextResponse.json({ error: "invalid_plan" }, { status: 400 });

  const reused = findOpenManualOrder(user.id, plan.key);
  if (reused)
    return NextResponse.json({
      outTradeNo: reused,
      money: plan.money,
      name: plan.name,
      plan: plan.key,
      reused: true,
    });

  const outTradeNo = newOutTradeNo();
  createOrder({
    outTradeNo,
    userId: user.id,
    plan: plan.key,
    name: plan.name,
    money: plan.money,
    channel: "manual",
  });
  return NextResponse.json({
    outTradeNo,
    money: plan.money,
    name: plan.name,
    plan: plan.key,
    reused: false,
  });
}

/** 弹窗每几秒问一次：站长核销完，这边自己变成已开通，不用用户回来刷新 */
export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const outTradeNo = new URL(req.url).searchParams.get("out_trade_no") ?? "";
  const order = manualOrderState(outTradeNo, user.id);
  if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ status: order.status });
}

/** 反悔了就把待核销的单关掉，免得它一直挂在站长的待办里 */
export async function DELETE(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const outTradeNo = new URL(req.url).searchParams.get("out_trade_no") ?? "";
  const ok = closeManualOrder(outTradeNo, user.id);
  return NextResponse.json({ ok });
}

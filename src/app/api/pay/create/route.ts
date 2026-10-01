import { NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { getPlan } from "@/lib/plans";
import { buildSubmitParams, ZPAY_GATEWAY } from "@/lib/epay";
import { createOrder, newOutTradeNo } from "@/lib/settle";

function baseUrl(req: Request): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const host =
    req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || "http";
  return `${proto}://${host}`;
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const plan = getPlan(String(body?.plan || ""));
  const type = body?.type === "wxpay" ? "wxpay" : "alipay";
  if (!plan) {
    return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
  }

  const outTradeNo = newOutTradeNo();
  createOrder({ outTradeNo, userId: user.id, plan: plan.key, name: plan.name, money: plan.money });

  const params = buildSubmitParams(
    { name: plan.name, money: plan.money, out_trade_no: outTradeNo },
    baseUrl(req),
    type
  );
  return NextResponse.json({ gateway: ZPAY_GATEWAY + "submit.php", params });
}

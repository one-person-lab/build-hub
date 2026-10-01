import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { currentUser } from "@/lib/session";
import { getPlan } from "@/lib/plans";
import { createOrder, newOutTradeNo } from "@/lib/settle";
import { nativeOrder, wxConfigured, yuanToFen } from "@/lib/wxpay";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!wxConfigured()) {
    return NextResponse.json({ error: "wxpay_not_configured" }, { status: 503 });
  }
  const body = await req.json().catch(() => null);
  const plan = getPlan(String(body?.plan || ""));
  if (!plan) {
    return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
  }

  const outTradeNo = newOutTradeNo();
  createOrder({ outTradeNo, userId: user.id, plan: plan.key, name: plan.name, money: plan.money });

  try {
    const codeUrl = await nativeOrder({
      outTradeNo,
      description: plan.name,
      totalFen: yuanToFen(plan.money),
    });
    const qr = await QRCode.toDataURL(codeUrl, { margin: 1, width: 320 });
    return NextResponse.json({ outTradeNo, codeUrl, qr });
  } catch (err) {
    console.error("wx native order failed:", err);
    return NextResponse.json({ error: "order_failed" }, { status: 502 });
  }
}

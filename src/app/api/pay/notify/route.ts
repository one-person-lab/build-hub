import { NextResponse } from "next/server";
import { epayVerify, type EpayParams } from "@/lib/epay";
import { settleOrder } from "@/lib/settle";
import { yuanToFen } from "@/lib/wxpay";

function fail(msg: string) {
  return new NextResponse(`fail: ${msg}`, { status: 400 });
}

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const params: EpayParams = {};
  q.forEach((v, k) => {
    params[k] = v;
  });

  if (!epayVerify(params)) return fail("bad_sign");
  if (params.trade_status !== "TRADE_SUCCESS") return fail("not_success");

  const pid = process.env.ZPAY_PID || "";
  if (pid && params.pid && params.pid !== pid) return fail("pid_mismatch");

  const paidFen = yuanToFen(params.money ?? "");
  if (!Number.isFinite(paidFen)) return fail("bad_amount");

  const r = settleOrder({
    outTradeNo: params.out_trade_no ?? "",
    tradeNo: params.trade_no ?? "",
    paidFen,
  });
  if (!r.ok) return fail(r.reason);
  return new NextResponse("success");
}

import { NextResponse } from "next/server";
import { epayVerify, type EpayParams } from "@/lib/epay";

// 浏览器付款完成后跳回：验签后引导到账号页，实际到账以 notify 为准
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const params: EpayParams = {};
  q.forEach((v, k) => {
    params[k] = v;
  });
  const paid =
    params.trade_status === "TRADE_SUCCESS" && epayVerify(params);
  return NextResponse.redirect(
    new URL(`/account?paid=${paid ? "1" : "0"}`, req.url)
  );
}

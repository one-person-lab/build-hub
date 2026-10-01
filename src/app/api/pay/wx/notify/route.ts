import { NextResponse } from "next/server";
import { decryptResource, verifyNotify } from "@/lib/wxpay";
import { settleOrder } from "@/lib/settle";

type WxNotify = {
  resource: { ciphertext: string; nonce: string; associated_data?: string };
};

type Transaction = {
  out_trade_no: string;
  transaction_id: string;
  trade_state: string;
  amount: { total: number };
};

function refuse(message: string, status = 500) {
  return NextResponse.json({ code: "FAIL", message }, { status });
}

export async function POST(req: Request) {
  const raw = await req.text();

  if (!(await verifyNotify(req.headers, raw))) {
    return refuse("签名验证失败", 401);
  }

  let tx: Transaction;
  try {
    const { resource } = JSON.parse(raw) as WxNotify;
    tx = JSON.parse(decryptResource(resource)) as Transaction;
  } catch (err) {
    console.error("wx notify parse failed:", err);
    return refuse("报文解析失败", 400);
  }

  // 非成功态不必到账，但要应答成功，否则微信会一直重推
  if (tx.trade_state !== "SUCCESS") {
    return NextResponse.json({ code: "SUCCESS" });
  }

  const r = settleOrder({
    outTradeNo: tx.out_trade_no,
    tradeNo: tx.transaction_id,
    paidFen: tx.amount.total,
  });
  if (!r.ok) {
    console.error("wx notify settle failed:", r.reason, tx.out_trade_no);
    return refuse(r.reason);
  }
  return NextResponse.json({ code: "SUCCESS" });
}

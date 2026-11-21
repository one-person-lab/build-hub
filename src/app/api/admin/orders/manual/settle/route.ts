import { adminFail, adminOk, requireAdminToken } from "@/lib/admin-auth";
import { settleManualOrder } from "@/lib/settle";

/** POST /api/admin/orders/manual/settle  body: { out_trade_no } */
export async function POST(req: Request) {
  const denied = requireAdminToken(req);
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const outTradeNo = String(body?.out_trade_no || "").trim();
  if (!/^\d{6,}$/.test(outTradeNo)) {
    return adminFail(400, "invalid_order", "out_trade_no required");
  }

  const r = settleManualOrder(outTradeNo);
  if (!r.ok) {
    const status = r.reason === "order_not_found" ? 404 : 400;
    return adminFail(status, r.reason);
  }
  return adminOk({ ok: true, out_trade_no: outTradeNo });
}

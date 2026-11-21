import { adminFail, adminOk, requireAdminToken } from "@/lib/admin-auth";
import { revokePaidOrder } from "@/lib/settle";

type Ctx = { params: Promise<{ outTradeNo: string }> };

/**
 * POST /api/admin/orders/:outTradeNo/revoke
 * 标记 revoked + 按套餐天数扣回 pro_until；不发起微信原路退款。
 */
export async function POST(req: Request, ctx: Ctx) {
  const denied = requireAdminToken(req);
  if (denied) return denied;

  const outTradeNo = (await ctx.params).outTradeNo?.trim();
  if (!outTradeNo) return adminFail(400, "invalid_order");

  const r = revokePaidOrder(outTradeNo);
  if (!r.ok) {
    const status =
      r.reason === "order_not_found"
        ? 404
        : r.reason === "not_paid"
          ? 409
          : 400;
    return adminFail(status, r.reason);
  }

  return adminOk({
    ok: true,
    out_trade_no: outTradeNo,
    days: r.days,
    user_id: r.userId,
    plan: r.plan,
  });
}

import { adminOk, requireAdminToken } from "@/lib/admin-auth";
import { listOpenManualOrders } from "@/lib/settle";

/** GET /api/admin/orders/manual —— 待核销的手机端人工单 */
export async function GET(req: Request) {
  const denied = requireAdminToken(req);
  if (denied) return denied;

  return adminOk({ orders: listOpenManualOrders() });
}

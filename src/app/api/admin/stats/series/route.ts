import { getDb } from '@/lib/db';
import { adminOk, requireAdminToken } from '@/lib/admin-auth';
import { buildSeries } from '@/lib/admin-series';

/** GET /api/admin/stats/series —— 按时间分桶的经营序列（公司层趋势图用） */
export async function GET(req: Request) {
  const denied = requireAdminToken(req);
  if (denied) return denied;

  const url = new URL(req.url);
  const result = buildSeries(getDb(), {
    from: url.searchParams.get('from') ?? undefined,
    granularity: url.searchParams.get('granularity') ?? undefined,
    to: url.searchParams.get('to') ?? undefined,
  });
  if (!result) {
    return adminOk({ error: 'invalid-range' });
  }
  return adminOk(result);
}

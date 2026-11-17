import { NextResponse } from "next/server";

/** Ops Console 调 /api/admin/* 时用的共享密钥（Authorization: Bearer …） */
export function requireAdminToken(req: Request): NextResponse | null {
  const expected = process.env.OPS_ADMIN_TOKEN?.trim();
  if (!expected) {
    return NextResponse.json(
      { code: 503, error: "admin_token_not_configured", message: "OPS_ADMIN_TOKEN missing" },
      { status: 503 },
    );
  }

  const header = req.headers.get("authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  const token = match?.[1]?.trim();
  if (!token || token !== expected) {
    return NextResponse.json(
      { code: 401, error: "unauthorized", message: "invalid admin token" },
      { status: 401 },
    );
  }
  return null;
}

export function adminOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ code: 0, data }, init);
}

export function adminFail(
  status: number,
  error: string,
  message?: string,
) {
  return NextResponse.json(
    { code: status, error, message: message || error },
    { status },
  );
}

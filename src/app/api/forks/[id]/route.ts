import { NextResponse } from "next/server";
import { cleanStatus, deleteFork, getFork, saveStep, type ForkStatus } from "@/lib/forks";
import { getPlaybook } from "@/lib/playbooks";
import { currentUser } from "@/lib/session";

/** 一步的结果和卡点各留一小段：长文该写在自己的项目里，不是塞进本站数据库 */
const MAX_NOTE = 300;

function cleanNote(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") return null;
  return value.trim().slice(0, MAX_NOTE);
}

async function context(params: Promise<{ id: string }>) {
  const user = await currentUser();
  if (!user) return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) } as const;
  const { id } = await params;
  const fork = getFork(user.id, id);
  if (!fork) return { error: NextResponse.json({ error: "not_found" }, { status: 404 }) } as const;
  return { user, fork } as const;
}

function withMeta(id: string, fork: NonNullable<ReturnType<typeof getFork>>) {
  const pb = getPlaybook(id);
  return {
    ...fork,
    playbookId: id,
    title: pb?.title ?? id,
    stepsLabel: pb?.stepsLabel ?? "步骤",
    total: pb?.steps.length ?? fork.steps.length,
    done: fork.steps.filter((s) => s.status === "done").length,
  };
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await context(params);
  if ("error" in ctx) return ctx.error;
  return NextResponse.json({ fork: withMeta(ctx.fork.playbookId, ctx.fork) });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await context(params);
  if ("error" in ctx) return ctx.error;

  const body = await req.json().catch(() => null);
  const index = Number(body?.stepIndex);
  if (!Number.isInteger(index))
    return NextResponse.json({ error: "invalid_step" }, { status: 400 });

  let status: ForkStatus | undefined;
  if (body?.status !== undefined) {
    const parsed = cleanStatus(body.status);
    if (!parsed) return NextResponse.json({ error: "invalid_status" }, { status: 400 });
    status = parsed;
  }

  const result = cleanNote(body?.result);
  const blocker = cleanNote(body?.blocker);
  if (result === null || blocker === null)
    return NextResponse.json({ error: "invalid_note" }, { status: 400 });

  const step = saveStep(ctx.user.id, ctx.fork.id, index, { status, result, blocker });
  if (!step) return NextResponse.json({ error: "invalid_step" }, { status: 400 });

  const fork = getFork(ctx.user.id, ctx.fork.id)!;
  return NextResponse.json({ step, done: fork.steps.filter((s) => s.status === "done").length });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await context(params);
  if ("error" in ctx) return ctx.error;
  deleteFork(ctx.user.id, ctx.fork.id);
  return NextResponse.json({ ok: true });
}

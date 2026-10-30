import { NextResponse } from "next/server";
import { getPlaybook } from "@/lib/playbooks";
import { createFork, findForkByPlaybook, forkQuota, listForks } from "@/lib/forks";
import { currentUser } from "@/lib/session";

function shape(id: string, playbookId: string, steps: { index: number; status: string; result: string; blocker: string; updatedAt: string }[]) {
  const pb = getPlaybook(playbookId);
  const list = pb?.steps ?? [];
  const next = steps.find((s) => s.status !== "done");
  return {
    id,
    playbookId,
    title: pb?.title ?? playbookId,
    summary: pb?.summary ?? "",
    deliverable: pb?.deliverable ?? "",
    stepsLabel: pb?.stepsLabel ?? "步骤",
    total: list.length || steps.length,
    done: steps.filter((s) => s.status === "done").length,
    nextStep: next ? (list[next.index - 1]?.name ?? "") : "",
    blockedOn: steps.filter((s) => s.blocker.trim()).map((s) => ({ index: s.index, name: list[s.index - 1]?.name ?? "", blocker: s.blocker })),
    steps,
  };
}

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const playbook = new URL(req.url).searchParams.get("playbook");
  if (playbook) {
    const fork = findForkByPlaybook(user.id, playbook);
    return NextResponse.json({ fork: fork ? shape(fork.id, playbook, fork.steps) : null });
  }

  const forks = listForks(user.id).map((f) => shape(f.id, f.playbookId, f.steps));
  return NextResponse.json({ forks, quota: forkQuota(user.id) });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const playbookId = typeof body?.playbookId === "string" ? body.playbookId : "";
  if (!playbookId || playbookId.length > 80)
    return NextResponse.json({ error: "invalid_playbook" }, { status: 400 });

  const r = createFork(user.id, playbookId);
  if (!r.ok)
    return NextResponse.json({ error: r.reason, quota: forkQuota(user.id) }, { status: r.reason === "quota" ? 403 : 400 });

  const pb = getPlaybook(playbookId)!;
  return NextResponse.json({
    fork: {
      id: r.fork.id,
      playbookId,
      title: pb.title,
      total: pb.steps.length,
      done: r.fork.steps.filter((s) => s.status === "done").length,
      updatedAt: r.fork.updatedAt,
    },
    reused: r.reused,
    quota: forkQuota(user.id),
  });
}

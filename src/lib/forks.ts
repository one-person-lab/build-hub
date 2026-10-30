import crypto from "node:crypto";
import { getDb, nowIso, proActive } from "./db";
import { playbookSteps } from "./playbooks";

/** 免费账号能同时复刻几份档案；PRO 不限 */
export const FREE_FORK_LIMIT = 1;

export type ForkStatus = "todo" | "doing" | "done";
export const FORK_STATUSES: ForkStatus[] = ["todo", "doing", "done"];

export type ForkStep = {
  index: number;
  status: ForkStatus;
  result: string;
  blocker: string;
  updatedAt: string;
};

export type Fork = {
  id: string;
  playbookId: string;
  createdAt: string;
  updatedAt: string;
  steps: ForkStep[];
};

type ForkRow = {
  id: string;
  playbook_id: string;
  created_at: string;
  updated_at: string;
};

type StepRow = {
  step_index: number;
  status: string;
  result: string;
  blocker: string;
  updated_at: string;
};

const STATUS_SET = new Set<string>(FORK_STATUSES);

export function cleanStatus(value: unknown): ForkStatus | null {
  return typeof value === "string" && STATUS_SET.has(value)
    ? (value as ForkStatus)
    : null;
}

function readSteps(forkId: string): ForkStep[] {
  const rows = getDb()
    .prepare(
      `select step_index, status, result, blocker, updated_at
       from fork_steps where fork_id = ? order by step_index`
    )
    .all(forkId) as StepRow[];
  return rows.map((r) => ({
    index: r.step_index,
    status: (STATUS_SET.has(r.status) ? r.status : "todo") as ForkStatus,
    result: r.result,
    blocker: r.blocker,
    updatedAt: r.updated_at,
  }));
}

function toFork(row: ForkRow): Fork {
  return {
    id: row.id,
    playbookId: row.playbook_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    steps: readSteps(row.id),
  };
}

export function countForks(userId: number): number {
  return (
    (getDb()
      .prepare(`select count(*) as n from forks where user_id = ?`)
      .get(userId) as { n: number }).n
  );
}

export function proOf(userId: number): boolean {
  const row = getDb()
    .prepare(`select pro_until from users where id = ?`)
    .get(userId) as { pro_until: string | null } | undefined;
  return proActive(row?.pro_until);
}

/** 未达 PRO 时的额度闸门：PRO 直接放行，免费账号按份数卡 */
export function forkQuota(userId: number): { ok: boolean; used: number; limit: number | null } {
  if (proOf(userId)) return { ok: true, used: countForks(userId), limit: null };
  const used = countForks(userId);
  return { ok: used < FREE_FORK_LIMIT, used, limit: FREE_FORK_LIMIT };
}

function shape(r: ForkRow, steps: ForkStep[]): Fork {
  return {
    id: r.id,
    playbookId: r.playbook_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    steps,
  };
}

export function listForks(userId: number): (Fork & { total: number; done: number })[] {
  const rows = getDb()
    .prepare(
      `select id, playbook_id, created_at, updated_at
       from forks where user_id = ? order by updated_at desc`
    )
    .all(userId) as ForkRow[];
  return rows.map((r) => {
    const steps = readSteps(r.id);
    const total = playbookSteps(r.playbook_id)?.length ?? steps.length;
    return {
      ...shape(r, steps),
      total,
      done: steps.filter((s) => s.status === "done").length,
    };
  });
}

export function getFork(userId: number, id: string): Fork | null {
  const row = getDb()
    .prepare(
      `select id, playbook_id, created_at, updated_at from forks where id = ? and user_id = ?`
    )
    .get(id, userId) as ForkRow | undefined;
  return row ? toFork(row) : null;
}

export function findForkByPlaybook(userId: number, playbookId: string): Fork | null {
  const row = getDb()
    .prepare(
      `select id, playbook_id, created_at, updated_at
       from forks where user_id = ? and playbook_id = ?`
    )
    .get(userId, playbookId) as ForkRow | undefined;
  return row ? toFork(row) : null;
}

export type CreateResult =
  | { ok: true; fork: Fork; reused: boolean }
  | { ok: false; reason: "invalid_playbook" | "quota" };

export function createFork(userId: number, playbookId: string): CreateResult {
  const steps = playbookSteps(playbookId);
  if (!steps) return { ok: false, reason: "invalid_playbook" };

  const existing = findForkByPlaybook(userId, playbookId);
  if (existing) return { ok: true, fork: existing, reused: true };

  if (!forkQuota(userId).ok) return { ok: false, reason: "quota" };

  const id = crypto.randomUUID();
  const ts = nowIso();
  const db = getDb();
  db.transaction(() => {
    db.prepare(
      `insert into forks (id, user_id, playbook_id, created_at, updated_at) values (?, ?, ?, ?, ?)`
    ).run(id, userId, playbookId, ts, ts);
    steps.forEach((_, i) => {
      db.prepare(
        `insert into fork_steps (fork_id, step_index, status, result, blocker, updated_at)
         values (?, ?, 'todo', '', '', ?)`
      ).run(id, i + 1, ts);
    });
  }).immediate();

  return { ok: true, fork: getFork(userId, id)!, reused: false };
}

export type StepPatch = {
  status?: ForkStatus;
  result?: string;
  blocker?: string;
};

export function saveStep(
  userId: number,
  forkId: string,
  stepIndex: number,
  patch: StepPatch
): ForkStep | null {
  const fork = getFork(userId, forkId);
  if (!fork) return null;
  const total = playbookSteps(fork.playbookId)?.length ?? 0;
  if (!Number.isInteger(stepIndex) || stepIndex < 1 || stepIndex > total) return null;

  const db = getDb();
  const current =
    fork.steps.find((s) => s.index === stepIndex) ??
    ({ index: stepIndex, status: "todo", result: "", blocker: "" } as ForkStep);

  const next: ForkStep = {
    index: stepIndex,
    status: patch.status ?? current.status,
    result: patch.result ?? current.result,
    blocker: patch.blocker ?? current.blocker,
    updatedAt: nowIso(),
  };

  db.transaction(() => {
    db.prepare(
      `insert into fork_steps (fork_id, step_index, status, result, blocker, updated_at)
       values (?, ?, ?, ?, ?, ?)
       on conflict(fork_id, step_index) do update
       set status = excluded.status, result = excluded.result,
           blocker = excluded.blocker, updated_at = excluded.updated_at`
    ).run(forkId, stepIndex, next.status, next.result, next.blocker, next.updatedAt);
    db.prepare(`update forks set updated_at = ? where id = ?`).run(next.updatedAt, forkId);
  }).immediate();

  return next;
}

export function deleteFork(userId: number, id: string): boolean {
  const db = getDb();
  const fork = getFork(userId, id);
  if (!fork) return false;
  db.transaction(() => {
    db.prepare(`delete from fork_steps where fork_id = ?`).run(id);
    db.prepare(`delete from forks where id = ? and user_id = ?`).run(id, userId);
  }).immediate();
  return true;
}

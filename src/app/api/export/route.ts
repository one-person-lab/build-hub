import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { currentUser, isPro } from "@/lib/session";
import { getPlaybook } from "@/lib/playbooks";
import { listForks } from "@/lib/forks";
import {
  buildFavoritesMarkdown,
  buildPackMarkdown,
  exportFilename,
  type PackInput,
} from "@/lib/export-content";

type Locale = "zh" | "en";

function notesFor(userId: number, slugs: string[]): Record<string, string> {
  if (!slugs.length) return {};
  const rows = getDb()
    .prepare(
      `select slug, body from notes where user_id = ? and slug in (${slugs.map(() => "?").join(",")})`
    )
    .all(userId, ...slugs) as { slug: string; body: string }[];
  return Object.fromEntries(rows.map((r) => [r.slug, r.body]));
}

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isPro(user)) return NextResponse.json({ error: "pro_required" }, { status: 403 });

  const url = new URL(req.url);
  const locale: Locale = url.searchParams.get("locale") === "en" ? "en" : "zh";
  const kind = url.searchParams.get("kind") ?? "favorites";

  const allFavorites = (
    getDb()
      .prepare(`select slug from favorites where user_id = ? order by added_at`)
      .all(user.id) as { slug: string }[]
  ).map((r) => r.slug);

  if (kind === "pack") {
    const collections = (
      getDb()
        .prepare(`select name, slugs from collections where user_id = ? order by created_at`)
        .all(user.id) as { name: string; slugs: string }[]
    ).map((c) => {
      try {
        const parsed = JSON.parse(c.slugs);
        return { name: c.name, slugs: Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : [] };
      } catch {
        return { name: c.name, slugs: [] };
      }
    });
    const forks: PackInput["forks"] = listForks(user.id).flatMap((f) => {
      const pb = getPlaybook(f.playbookId);
      if (!pb) return [];
      return [
        {
          playbookId: f.playbookId,
          title: pb.title,
          steps: pb.steps.map((s) => ({ name: s.name, done: s.done })),
          progress: f.steps.map((s) => ({
            stepIndex: s.index - 1,
            status: s.status,
            result: s.result,
            blocker: s.blocker,
          })),
        },
      ];
    });

    if (!allFavorites.length && !collections.length && !forks.length)
      return NextResponse.json({ error: "empty" }, { status: 400 });

    const markdown = buildPackMarkdown(
      { favorites: allFavorites, notes: notesFor(user.id, allFavorites), collections, forks },
      locale
    );
    return new NextResponse(markdown, {
      headers: {
        "content-type": "text/markdown; charset=utf-8",
        "content-disposition": `attachment; filename="${exportFilename("pack")}"`,
        "cache-control": "no-store",
      },
    });
  }

  let slugs: string[] = [];
  let title: string | undefined;

  if (kind === "favorites") {
    slugs = allFavorites;
  } else if (kind === "collection") {
    const id = url.searchParams.get("id") ?? "";
    const row = getDb()
      .prepare(`select name, slugs from collections where id = ? and user_id = ?`)
      .get(id, user.id) as { name: string; slugs: string } | undefined;
    if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
    try {
      const parsed = JSON.parse(row.slugs);
      if (Array.isArray(parsed)) slugs = parsed.filter((s) => typeof s === "string");
    } catch {
      slugs = [];
    }
    title = row.name;
  } else {
    return NextResponse.json({ error: "invalid_kind" }, { status: 400 });
  }

  if (!slugs.length) return NextResponse.json({ error: "empty" }, { status: 400 });

  const markdown = buildFavoritesMarkdown(slugs, locale, {
    title,
    notes: notesFor(user.id, slugs),
  });

  return new NextResponse(markdown, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "content-disposition": `attachment; filename="${exportFilename(kind)}"`,
      "cache-control": "no-store",
    },
  });
}

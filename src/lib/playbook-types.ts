export type PlaybookStep = {
  name: string;
  question?: string;
  points: string[];
  done: string;
  trap?: string;
};

export type GuideBlock =
  | { t: "p"; text: string }
  | { t: "h"; text: string }
  | { t: "ul"; items: string[] }
  | { t: "note"; label: string; text: string }
  | { t: "table"; head: string[]; rows: string[][] }
  | { t: "figure"; src: string; title: string }
  | { t: "copy"; label: string; hint: string; text: string }
  | { t: "links"; items: { label: string; href: string; note?: string }[] };

export type GuideSection = {
  n: string;
  title: string;
  blocks: GuideBlock[];
};

export type Guide = {
  kind: "guide";
  title: string;
  summary: string;
  category: string;
  hook?: string;
  source?: string;
  lastVerified?: string;
  sections: GuideSection[];
  next?: { text: string; link?: { href: string; label: string } }[];
};

export type Playbook = {
  title: string;
  summary: string;
  category: string;
  hook?: string;
  source?: string;
  lastVerified?: string;
  intro?: string[];
  steps: PlaybookStep[];
  answers?: string[];
  next?: { text: string; link?: { href: string; label: string } }[];
  prompt?: string;
  stepsLabel?: string;
  /** 复刻它的人会拿到手的成品；卡面第一句要回答「做完这个我手上有什么」 */
  deliverable?: string;
  audience?: string;
};

/** 手册分区里的两种体例：分步自查卡，或长文体例的实践指南 */
export type LibEntry = Playbook | Guide;

export function isGuide(entry: LibEntry): entry is Guide {
  return (entry as Guide).kind === "guide";
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { track } from "@/lib/track";
import "./Playground.css";

type Locale = "zh" | "en";

/* ---------- 共用小件 ---------- */

function Row({ children }: { children: React.ReactNode }) {
  return <div className="pg-row">{children}</div>;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="pg-field">
      <span>{label}</span>
      <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <label className="pg-slider">
      <span>
        {label} <b>{value}{suffix ?? ""}</b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="pg-note">{children}</p>;
}

/* 中文按字、英文按词，切成可比的小单元 */
function units(s: string): string[] {
  const t = s.toLowerCase();
  if (/[\u4e00-\u9fa5]/.test(t)) return Array.from(t.replace(/[\s，。、？！,.?!]/g, ""));
  return t.split(/[^a-z0-9']+/).filter(Boolean).map(stem);
}

const STOP = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "is", "are", "be", "it",
  "its", "i", "you", "we", "they", "he", "she", "do", "does", "did", "how", "what", "when",
  "where", "why", "can", "could", "would", "should", "will", "with", "that", "this", "my",
  "your", "their", "there", "at", "as", "by", "from", "not",
]);

/** 「returns」和「return」是同一个东西：检索前先剥掉常见的词尾变化 */
function stem(w: string): string {
  if (STOP.has(w)) return w;
  if (w.length > 4 && w.endsWith("ies")) return `${w.slice(0, -3)}y`;
  if (w.length > 4 && w.endsWith("es")) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
  return w;
}

/** 两句之间有多像：两边都算分母，谁长都不会占便宜 */
function overlap(a: string, b: string): number {
  const A = units(a);
  const B = new Set(units(b));
  if (!A.length || !B.size) return 0;
  const hit = A.filter((x) => B.has(x)).length;
  return (2 * hit) / (A.length + B.size);
}

/** 一段资料盖住了问题的多少：只按问题的字数算，资料长不会把它压低 */
function cover(q: string, doc: string): number {
  const A = units(q).filter((w) => !STOP.has(w));
  if (!A.length) return 0;
  const B = new Set(units(doc));
  return A.filter((x) => B.has(x)).length / A.length;
}

type DemoProps = { L: (zh: string, en: string) => string; en: boolean };

/* ---------- 1. 分块 ---------- */

const DOC_ZH =
  "退款政策：签收后七天内可退，商品要保持原样，运费由买家承担。会员权益：PRO 会员不限收藏数量，进度跨设备同步。" +
  "发票开具：下单后在账号页申请，三个工作日内寄出。客服时间：每天九点到二十一点，节假日照常。";

const DOC_EN =
  "Refunds: return anything within seven days of delivery, in its original condition, shipping paid by the buyer. " +
  "Membership: PRO members keep unlimited favorites and their progress follows the account across devices. " +
  "Invoices: request one from your account page after ordering and it ships within three working days. " +
  "Support: online every day from nine in the morning to nine at night, holidays included.";

function ChunkingDemo({ L, en }: DemoProps) {
  const DOC = en ? DOC_EN : DOC_ZH;
  const [size, setSize] = useState(en ? 16 : 40);
  const [overlap2, setOverlap2] = useState(0);
  const chunks = useMemo(() => {
    const out: string[] = [];
    const step = Math.max(1, size - overlap2);
    if (en) {
      const words = DOC.split(/\s+/);
      for (let i = 0; i < words.length; i += step) {
        out.push(words.slice(i, i + size).join(" "));
        if (i + size >= words.length) break;
      }
      return out;
    }
    for (let i = 0; i < DOC.length; i += step) {
      out.push(DOC.slice(i, i + size));
      if (i + size >= DOC.length) break;
    }
    return out;
  }, [size, overlap2, DOC, en]);

  return (
    <>
      <Row>
        <Slider
          label={L("每块字数", en ? "Words per chunk" : "Chunk size")}
          value={size}
          min={en ? 5 : 12}
          max={en ? 45 : 90}
          onChange={setSize}
        />
        <Slider
          label={L("块间重叠", en ? "Words of overlap" : "Overlap")}
          value={overlap2}
          min={0}
          max={en ? 8 : 20}
          onChange={setOverlap2}
        />
      </Row>
      <p className="pg-count">
        {L("切成", "Split into")} <b>{chunks.length}</b> {L("块", "chunks")}
      </p>
      <div className="pg-chunks">
        {chunks.map((c, i) => (
          <div className="pg-chunk" key={i}>
            <i>{i + 1}</i>
            <span>{c}</span>
          </div>
        ))}
      </div>
      <Note>
        {L(
          "块太小，一句完整的话被劈开，检索回来的是半句；块太大，一个块里混了好几件事，命中了也答不准。真实系统还要在句子边界处切，这里按字数切是为了看清取舍。",
          "Too small and a sentence arrives cut in half; too large and one chunk mixes several topics. Real systems also break on sentence boundaries — this one slices by word count so the trade-off stays visible."
        )}
      </Note>
    </>
  );
}

/* ---------- 2. 向量化 ---------- */

const CORPUS_ZH = [
  "明天下午有降雨",
  "今天的煎饼很好吃",
  "降雨预报说明天有雨",
  "服务器在凌晨重启了",
  "出门记得带伞",
];

const CORPUS_EN = [
  "it will rain tomorrow afternoon",
  "the pancakes were delicious today",
  "the rain forecast says tomorrow",
  "the server restarted at three in the morning",
  "remember to bring an umbrella",
];

function EmbeddingDemo({ L, en }: DemoProps) {
  const CORPUS = en ? CORPUS_EN : CORPUS_ZH;
  const [a, setA] = useState(en ? CORPUS_EN[0] : CORPUS_ZH[0]);
  const [b, setB] = useState(en ? CORPUS_EN[2] : CORPUS_ZH[2]);
  const ranked = useMemo(
    () => CORPUS.map((s) => ({ s, v: overlap(a, s) })).sort((x, y) => y.v - x.v),
    [a, CORPUS]
  );
  const score = overlap(a, b);

  return (
    <>
      <Row>
        <Field label={L("句子 A", "Sentence A")} value={a} onChange={setA} />
        <Field label={L("句子 B", "Sentence B")} value={b} onChange={setB} />
      </Row>
      <div className="pg-meter">
        <span className="pg-meter-bar">
          <i style={{ width: `${Math.round(score * 100)}%` }} />
        </span>
        <b>{Math.round(score * 100)}%</b>
        <em>{L("像不像", "similarity")}</em>
      </div>
      <p className="pg-count">{L("下面按跟 A 像不像排序", "Ranked by how close each sentence is to A")}</p>
      <ul className="pg-list">
        {ranked.map((r) => (
          <li key={r.s} className={r.v >= 0.4 ? "is-hit" : ""}>
            <span>{r.s}</span>
            <i className="pg-track">
              <b style={{ width: `${Math.round(r.v * 100)}%` }} />
            </i>
          </li>
        ))}
      </ul>
      <Note>
        {L(
          "这里用「字面重合了多少」模拟相似度，好让你亲手看到排序会变。真实做法是把整句交给嵌入模型换成几百个小数，比的是两串数字的距离——所以「带伞」和「下雨」字面不重合，也能被算成近。",
          "This page scores by how many words two sentences share, so you can watch the order change. A real embedding turns the whole sentence into hundreds of decimals and compares the numbers instead — which is why「umbrella」and「rain」land close without sharing a single word."
        )}
      </Note>
    </>
  );
}

/* ---------- 3. RAG ---------- */

const KB_ZH = [
  { id: 1, text: "签收后七天内可退，商品要保持原样，运费由买家承担。" },
  { id: 2, text: "PRO 会员不限收藏数量，进度跨设备同步。" },
  { id: 3, text: "下单后在账号页申请发票，三个工作日内寄出。" },
  { id: 4, text: "客服每天九点到二十一点在线，节假日照常。" },
  { id: 5, text: "会员到期后已建的收藏仍然保留，只是不能再新建收藏夹。" },
];

const KB_EN = [
  { id: 1, text: "Returns are open for seven days after delivery and the item must be in its original condition." },
  { id: 2, text: "PRO members keep unlimited favorites and their progress syncs across devices." },
  { id: 3, text: "Request an invoice from your account page and it ships within three working days." },
  { id: 4, text: "Support is online every day from nine in the morning to nine at night." },
  { id: 5, text: "When a membership lapses your favorites stay; you just cannot create new collections." },
];

const QUESTIONS_ZH = ["退款要寄回去吗", "发票怎么开", "PRO 到期了收藏会没吗", "公司几点下班"];
const QUESTIONS_EN = [
  "can I return it",
  "how do I get an invoice",
  "do I lose my favorites when PRO ends",
  "what time do you close",
];

function RagDemo({ L, en }: DemoProps) {
  const KB = en ? KB_EN : KB_ZH;
  const QUESTIONS = en ? QUESTIONS_EN : QUESTIONS_ZH;
  const [q, setQ] = useState(QUESTIONS[0]);
  const [on, setOn] = useState(true);
  const hits = useMemo(
    () =>
      KB.map((k) => ({ ...k, v: cover(q, k.text) }))
        .filter((k) => k.v >= 0.25)
        .sort((x, y) => y.v - x.v)
        .slice(0, 2),
    [q, KB]
  );
  const answer = !on
    ? L(
        "模型手里只有你的问题，没有资料。它要么说不知道，要么挑一段看着像的话补上——这就是幻觉的来路。",
        "With only the question in hand, the model either says it doesn't know or fills in something plausible. That is where hallucination comes from."
      )
    : hits.length
      ? L(
          `根据第 ${hits.map((h) => h.id).join("、")} 条资料：${hits[0].text}` ,
          `Per record ${hits.map((h) => h.id).join(", ")}: ${hits[0].text}`
        )
      : L(
          "资料库里没搜到相关的段落，所以它回答：不知道。没查到的时候闭嘴，正是这套流程想要的行为。",
          "Nothing relevant was retrieved, so it answers: I don't know. Staying quiet when the search came up empty is exactly what this pipeline is for."
        );

  return (
    <>
      <div className="pg-chips">
        {QUESTIONS.map((x) => (
          <button
            type="button"
            key={x}
            className={x === q ? "is-on" : ""}
            onClick={() => setQ(x)}
          >
            {x}
          </button>
        ))}
      </div>
      <Row>
        <Field label={L("或者自己问", "Or ask your own")} value={q} onChange={setQ} />
        <button
          type="button"
          className={`pg-toggle${on ? " is-on" : ""}`}
          onClick={() => setOn((v) => !v)}
        >
          {on ? L("已接资料库", "Retrieval on") : L("没接资料库", "Retrieval off")}
        </button>
      </Row>
      <p className="pg-count">{L("这一步捞到了什么", "What the search returned")}</p>
      {on ? (
        hits.length ? (
          <ul className="pg-list">
            {hits.map((h) => (
              <li key={h.id} className="is-hit">
                <span>#{h.id} {h.text}</span>
                <i className="pg-track">
                  <b style={{ width: `${Math.round(h.v * 100)}%` }} />
                </i>
              </li>
            ))}
          </ul>
        ) : (
          <p className="pg-empty">{L("一条都没命中", "No chunk cleared the bar")}</p>
        )
      ) : (
        <p className="pg-empty">{L("关掉检索，模型什么也看不到", "With retrieval off, the model sees nothing")}</p>
      )}
      <div className="pg-answer">
        <em>{L("模型的回答", "The answer")}</em>
        <p>{answer}</p>
      </div>
      <Note>
        {L(
          "把开关关掉，问同一个问题，答案立刻从「有出处」变成「靠猜」。RAG 的全部价值就在这一下对比里。",
          "Flip the switch off and the same question goes from cited to guessed. That single contrast is the whole value of RAG."
        )}
      </Note>
    </>
  );
}

/* ---------- 4. 缓存 ---------- */

const TTL = 8;

function CacheDemo({ L }: { L: (zh: string, en: string) => string }) {
  const [expires, setExpires] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [log, setLog] = useState<{ hit: boolean; ms: number }[]>([]);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, []);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const alive = expires > now;
  const left = Math.max(0, Math.ceil((expires - now) / 1000));

  function request() {
    if (busy) return;
    if (alive) {
      setLog((l) => [{ hit: true, ms: 2 }, ...l].slice(0, 6));
      return;
    }
    setBusy(true);
    const t0 = Date.now();
    timer.current = setTimeout(
      () => {
        setLog((l) => [{ hit: false, ms: Date.now() - t0 }, ...l].slice(0, 6));
        setExpires(Date.now() + TTL * 1000);
        setBusy(false);
      },
      700 + Math.random() * 500
    );
  }

  return (
    <>
      <Row>
        <button type="button" className="pg-btn" onClick={request} disabled={busy}>
          {busy ? L("正在查…", "Fetching…") : L("请求一次", "Send one request")}
        </button>
        <button
          type="button"
          className="pg-btn is-ghost"
          onClick={() => {
            setExpires(0);
            setLog([]);
          }}
        >
          {L("清掉缓存", "Clear cache")}
        </button>
      </Row>
      <div className="pg-cache-state">
        {alive ? (
          <>
            <b className="ok">{L("缓存里还有", "Still cached")}</b>
            <span className="pg-ttl">
              <i style={{ width: `${(left / TTL) * 100}%` }} />
            </span>
            <em>{L(`${left} 秒后过期`, "expires in " + left + "s")}</em>
          </>
        ) : (
          <b className="no">{L("缓存是空的", "Cache is empty")}</b>
        )}
      </div>
      <ul className="pg-log">
        {log.map((r, i) => (
          <li key={i} className={r.hit ? "hit" : "miss"}>
            <span>{r.hit ? "HIT" : "MISS"}</span>
            <b>{r.ms} ms</b>
          </li>
        ))}
        {!log.length && <li className="pg-empty">{L("还没有请求记录", "No requests yet")}</li>}
      </ul>
      <Note>
        {L(
          "第一次慢是因为真的去查了，之后 2 毫秒是因为直接拿现成的。等 8 秒不点，缓存过期，又会慢一次——这就是缓存既省钱又会让人看到旧数据的原因。",
          "The first call is slow because it really went out; the 2 ms ones read what was already kept. Wait past 8 seconds and it goes slow again — that is also why caches show you stale data."
        )}
      </Note>
    </>
  );
}

/* ---------- 5. 速率限制 ---------- */

const CAP = 5;

function RateLimitDemo({ L }: { L: (zh: string, en: string) => string }) {
  const [tokens, setTokens] = useState(CAP);
  const [log, setLog] = useState<{ ok: boolean; n: number }[]>([]);
  const live = useRef(CAP);
  const sent = useRef(0);

  useEffect(() => {
    const t = setInterval(() => {
      live.current = Math.min(CAP, live.current + 1);
      setTokens(live.current);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  function fire() {
    const i = sent.current + 1;
    sent.current = i;
    const ok = live.current > 0;
    if (ok) live.current -= 1;
    setTokens(live.current);
    setLog((l) => [{ ok, n: i }, ...l].slice(0, 6));
  }

  return (
    <>
      <div className="pg-bucket">
        {Array.from({ length: CAP }).map((_, i) => (
          <i key={i} className={i < tokens ? "full" : ""} />
        ))}
        <em>{L("桶里还剩 " + tokens + " 格", tokens + " tokens left")}</em>
      </div>
      <Row>
        <button type="button" className="pg-btn" onClick={fire}>
          {L("发一个请求", "Send a request")}
        </button>
        <button type="button" className="pg-btn is-ghost" onClick={() => { for (let i = 0; i < 8; i++) setTimeout(fire, i * 60); }}>
          {L("连点 8 下", "Fire 8 at once")}
        </button>
      </Row>
      <ul className="pg-log">
        {log.map((r) => (
          <li key={r.n} className={r.ok ? "hit" : "miss"}>
            <span>{r.ok ? "200" : "429"}</span>
            <b>{r.ok ? L("放行", "through") : L("被挡：太快了", "too many requests")}</b>
          </li>
        ))}
        {!log.length && <li className="pg-empty">{L("还没发过请求", "Nothing sent yet")}</li>}
      </ul>
      <Note>
        {L(
          "桶每秒只回一格。手快点完就吃 429，等一秒又能过——限流不是惩罚，是告诉客户端慢一点再来。",
          "The bucket refills one token a second. Burn it and you get 429s until you wait — rate limits are not punishment, they are the server telling you to come back slower."
        )}
      </Note>
    </>
  );
}

/* ---------- 6. 哈希 ---------- */

function HashDemo({ L, en }: DemoProps) {
  const [v, setV] = useState(en ? "Turn what you know into something usable." : "把会的东西，变成可用的资产");
  const [h, setH] = useState("…");
  const [prev, setPrev] = useState("");
  const last = useRef("");

  useEffect(() => {
    let dead = false;
    crypto.subtle
      .digest("SHA-256", new TextEncoder().encode(v))
      .then((buf) => {
        if (dead) return;
        const hex = Array.from(new Uint8Array(buf))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        setPrev(last.current);
        last.current = hex;
        setH(hex);
      })
      .catch(() => !dead && setH("SHA-256 unavailable in this browser"));
    return () => {
      dead = true;
    };
  }, [v]);

  const changed = useMemo(() => {
    if (!prev || prev.length !== h.length) return h.split("").map(() => false);
    return h.split("").map((c, i) => c !== prev[i]);
  }, [h, prev]);

  return (
    <>
      <Field label={L("改一个字试试", "Change one character")} value={v} onChange={setV} />
      <div className="pg-hash">
        {changed.map((isDiff, i) => (
          <i key={i} className={isDiff ? "diff" : ""}>
            {h[i]}
          </i>
        ))}
      </div>
      <p className="pg-count">
        {L("红色是这次变了的位置：", "Red marks what moved: ")}
        <b>{changed.filter(Boolean).length}</b>
        {L(` / ${h.length} 位`, ` of ${h.length} characters`)}
      </p>
      <Note>
        {L(
          "整串几乎全变，这叫雪崩效应。所以哈希能用来判断内容有没有被动过，也能当文件名去重；但它是单向的，从这串数字反不回原文。",
          "Almost every character flips — that is the avalanche effect, which is why hashes prove nothing was tampered with and deduplicate files, while staying impossible to reverse."
        )}
      </Note>
    </>
  );
}

/* ---------- 7. 弹性布局 ---------- */

const DIRS = ["row", "column"] as const;
const JUSTS = ["flex-start", "center", "space-between", "flex-end"] as const;
const ALIGNS = ["flex-start", "center", "stretch", "flex-end"] as const;

function OptGroup({
  label,
  opts,
  val,
  set,
}: {
  label: string;
  opts: readonly string[];
  val: string;
  set: (v: string) => void;
}) {
  return (
    <div className="pg-optgroup">
      <span>{label}</span>
      <div className="pg-chips">
        {opts.map((o) => (
          <button type="button" key={o} className={o === val ? "is-on" : ""} onClick={() => set(o)}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function FlexDemo({ L }: { L: (zh: string, en: string) => string }) {
  const [dir, setDir] = useState<(typeof DIRS)[number]>("row");
  const [just, setJust] = useState<(typeof JUSTS)[number]>("flex-start");
  const [align, setAlign] = useState<(typeof ALIGNS)[number]>("stretch");

  return (
    <>
      <div className="pg-stage" style={{ flexDirection: dir, justifyContent: just, alignItems: align }}>
        <b className="a">A</b>
        <b className="b">BB</b>
        <b className="c">C</b>
      </div>
      <OptGroup label="flex-direction" opts={DIRS} val={dir} set={(v) => setDir(v as typeof dir)} />
      <OptGroup label="justify-content" opts={JUSTS} val={just} set={(v) => setJust(v as typeof just)} />
      <OptGroup label="align-items" opts={ALIGNS} val={align} set={(v) => setAlign(v as typeof align)} />
      <Note>
        {L(
          "两个方向各排一次队：justify 管主轴，align 管交叉轴。把 flex-direction 换成 column，主轴跟着转 90 度，上面两组按钮的效果就互换了位置。",
          "justify owns the main axis, align owns the cross axis. Switch flex-direction to column and the main axis turns 90 degrees — the two button groups trade what they control."
        )}
      </Note>
    </>
  );
}

/* ---------- 8. 对比度 ---------- */

function lum(hex: string): number {
  const m = hex.replace("#", "");
  if (m.length !== 6) return 0;
  const c = [0, 2, 4].map((i) => parseInt(m.slice(i, i + 2), 16) / 255);
  const lin = c.map((x) => (x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function ContrastDemo({ L }: { L: (zh: string, en: string) => string }) {
  const [fg, setFg] = useState("#8a8578");
  const [bg, setBg] = useState("#1a1c22");
  const ratio = useMemo(() => {
    const a = lum(fg);
    const b = lum(bg);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  }, [fg, bg]);

  const badge = (need: number, label: string) => (
    <span className={ratio >= need ? "pg-pass" : "pg-fail"}>
      {label} {L("过", "pass")}
    </span>
  );

  return (
    <>
      <Row>
        <label className="pg-color">
          <span>{L("字色", "Text")}</span>
          <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} />
          <code>{fg}</code>
        </label>
        <label className="pg-color">
          <span>{L("底色", "Background")}</span>
          <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} />
          <code>{bg}</code>
        </label>
      </Row>
      <div className="pg-sample" style={{ color: fg, background: bg }}>
        {L("把会的东西，变成可用的资产。", "Turn what you know into something usable.")}
      </div>
      <div className="pg-ratio">
        <b>{ratio.toFixed(2)} : 1</b>
        <div>
          {badge(4.5, "AA 14px")}
          {badge(3, "AA 18px")}
          {badge(7, "AAA")}
        </div>
      </div>
      <Note>
        {L(
          "把字色调亮一档，比值会跳上去；正文至少要 4.5，大字号放宽到 3。设计稿看着舒服但过不了这条线的字，在太阳底下的手机上是读不出来的。",
          "Brighten the text and the ratio jumps. Body copy needs 4.5, large text can relax to 3. Text that looks fine on a mockup but fails here is unreadable on a phone in sunlight."
        )}
      </Note>
    </>
  );
}

/* ---------- 清单 ---------- */

type Demo = {
  slug: string;
  name: string;
  nameEn: string;
  brief: string;
  briefEn: string;
  Comp: (p: DemoProps) => React.ReactElement;
};

export const DEMOS: Demo[] = [
  { slug: "chunking", name: "分块", nameEn: "Chunking", brief: "拖两个滑块，看一段话被切成几块", briefEn: "Drag two sliders and watch a paragraph get sliced", Comp: ChunkingDemo },
  { slug: "embedding", name: "向量化", nameEn: "Embedding", brief: "换一种问法，看哪句话离得最近", briefEn: "Rephrase a sentence and watch the ranking move", Comp: EmbeddingDemo },
  { slug: "rag", name: "检索增强生成", nameEn: "RAG", brief: "同一个问题，接不接资料库差在哪", briefEn: "Same question, with and without a knowledge base", Comp: RagDemo },
  { slug: "cache", name: "缓存", nameEn: "Cache", brief: "连点几次，看哪次真的去查了", briefEn: "Click a few times and see which call went out", Comp: CacheDemo },
  { slug: "rate-limit", name: "速率限制", nameEn: "Rate limit", brief: "手快一点，服务器会让你吃 429", briefEn: "Click too fast and the server pushes back", Comp: RateLimitDemo },
  { slug: "hash", name: "哈希", nameEn: "Hash", brief: "改一个字，整串指纹全变", briefEn: "Change one character, flip the whole fingerprint", Comp: HashDemo },
  { slug: "flex", name: "弹性布局", nameEn: "Flexbox", brief: "三个开关，把色块排到想去的位置", briefEn: "Three switches, four ways to arrange boxes", Comp: FlexDemo },
  { slug: "contrast", name: "对比度", nameEn: "Contrast", brief: "挑两个颜色，算算读不读得清", briefEn: "Pick two colours and check they are readable", Comp: ContrastDemo },
];

/* ---------- 弹层 ---------- */

export default function Playground({
  locale,
  open,
  onClose,
}: {
  locale: Locale;
  open: boolean;
  onClose: () => void;
}) {
  const en = locale === "en";
  const L = (zh: string, x: string) => (en ? x : zh);
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * DEMOS.length));

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", k);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const d = DEMOS[idx];
  const { Comp } = d;

  function next() {
    setIdx((i) => {
      let n = i;
      while (n === i) n = Math.floor(Math.random() * DEMOS.length);
      return n;
    });
    track("playground_next", { demo: d.slug });
  }

  return (
    <div className="pg-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={en ? d.nameEn : d.name}>
      <div className="pg-panel" onClick={(e) => e.stopPropagation()}>
        <header className="pg-head">
          <div>
            <em>
              {L("随便玩 · ", "Try one · ")}
              {idx + 1}/{DEMOS.length}
            </em>
            <h3>{en ? d.nameEn : d.name}</h3>
            <p>{en ? d.briefEn : d.brief}</p>
          </div>
          <div className="pg-head-actions">
            <button type="button" className="pg-btn" onClick={next}>
              {L("换一个", "Another one")}
            </button>
            <button type="button" className="pg-x" onClick={onClose} aria-label={L("关闭", "Close")}>
              ×
            </button>
          </div>
        </header>
        <div className="pg-body">
          <Comp L={L} en={en} />
        </div>
        <footer className="pg-foot">
          <span>{L("不用登录，玩完就走。", "No account needed.")}</span>
          <a href={`${en ? "/en" : ""}/${d.slug}`}>
            {L("看这条的完整讲解 →", "Read the full explainer →")}
          </a>
        </footer>
      </div>
    </div>
  );
}

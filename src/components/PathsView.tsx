import Link from "next/link";
import "./PathsView.css";
import {
  allPaths,
  assetGroups,
  nextPath,
  resolvePath,
  type PathEntry,
} from "@/lib/paths";

function Arrow() {
  return <span aria-hidden>→</span>;
}

export function PathsIndex() {
  const paths = allPaths().map(resolvePath);
  const totalSteps = paths.reduce((n, p) => n + p.steps.length, 0);

  return (
    <main className="pth-main">
      <header className="pth-hero">
        <p className="pth-eyebrow">路径 · PATHS</p>
        <h1>从想法到上线，走这三条</h1>
        <p className="pth-hero-lead">
          站里有课程、提示词、技能和手册，但知道有什么，不等于知道先做哪一步。三条路径把顺序排好了：每条只奔一个结果，每一步都写清做完是什么样。
        </p>
        <div className="pth-index-rule">
          <span>{paths.length} 条路径</span>
          <span>{totalSteps} 步</span>
          <span>每一步都能直接点开用</span>
          <span>全部免费看</span>
        </div>
      </header>

      <div className="pth-list">
        {paths.map((path) => (
          <Link className="pth-card" href={`/paths/${path.id}`} key={path.id}>
            <div className="pth-card-num" aria-hidden>
              {String(path.order).padStart(2, "0")}
            </div>
            <div>
              <p className="pth-card-kicker">{path.kicker}</p>
              <h2>{path.name}</h2>
              <p className="pth-card-tagline">{path.tagline}</p>
              <p className="pth-card-meta">
                {path.steps.length} 步 · {path.duration} · {path.assets.length} 份资产
              </p>
            </div>
            <div className="pth-card-side">
              <span className="pth-card-out">
                <b>走完你会拿到</b>
                {path.outcomeShort}
              </span>
              <span className="pth-card-go">开始这条路径</span>
            </div>
          </Link>
        ))}
      </div>

      <section className="pth-how">
        <h2>为什么按路径走，而不是继续逛词条</h2>
        <div className="pth-how-grid">
          <div className="pth-how-item">
            <b>顺序是排过的</b>
            <p>先定需求再做页面，先上线再打磨，每一步都踩在下一步需要的东西上。不是把链接堆在一起让你自己挑。</p>
          </div>
          <div className="pth-how-item">
            <b>每步都有完成标志</b>
            <p>做到什么程度算过，写成一句能核对的话。走完一步就知道能不能往下走，不靠「我感觉差不多了」。</p>
          </div>
          <div className="pth-how-item">
            <b>点开就是能用的东西</b>
            <p>每一步都连到站内的课程章节、提示词、技能或词条。不用再开一个搜索框，从零解释一遍背景。</p>
          </div>
        </div>
      </section>
    </main>
  );
}

export function PathDetail({ path }: { path: PathEntry }) {
  const resolved = resolvePath(path);
  const groups = assetGroups(resolved.assets);
  const next = nextPath(path);

  return (
    <main className="pth-detail-main">
      <nav className="pth-crumb" aria-label="面包屑">
        <Link href="/paths">路径</Link>
        <span aria-hidden>/</span>
        <span>{path.name}</span>
      </nav>

      <header className="pth-detail-hero">
        <p className="pth-eyebrow">
          路径 {String(path.order).padStart(2, "0")} · {path.kicker}
        </p>
        <h1>{path.name}</h1>
        <p className="pth-detail-lead">{path.tagline}</p>

        <div className="pth-facts">
          <div className="pth-fact">
            <span>适合谁</span>
            <p>{path.audience}</p>
          </div>
          <div className="pth-fact">
            <span>开始前要有</span>
            <p>{path.prereq}</p>
          </div>
          <div className="pth-fact">
            <span>走完你会拿到</span>
            <p>{path.outcome}</p>
          </div>
        </div>

        <a className="pth-start" href="#step-1">
          从第 1 步开始 <span aria-hidden>↓</span>
        </a>
      </header>

      <section className="pth-steps" aria-label="步骤">
        {resolved.steps.map((step, index) => (
          <article className="pth-step" id={`step-${index + 1}`} key={step.title}>
            <div className="pth-step-num" aria-hidden>
              {String(index + 1).padStart(2, "0")}
            </div>
            <div className="pth-step-body">
              <h2>{step.title}</h2>
              <p className="pth-step-why">{step.why}</p>

              <div className="pth-assets">
                {step.assets.map((asset) => (
                  <Link className="pth-asset" href={asset.href} key={asset.key}>
                    <span className="pth-asset-type">{asset.typeLabel}</span>
                    <span className="pth-asset-title">{asset.title}</span>
                    {asset.note ? <span className="pth-asset-note">{asset.note}</span> : null}
                  </Link>
                ))}
              </div>

              <p className="pth-done">
                <b>完成标志</b>
                <span>{step.done}</span>
              </p>
            </div>
          </article>
        ))}
      </section>

      <section className="pth-finish" aria-label="完成标志清单">
        <h2>这条路径走完，你应该能拿出这些</h2>
        <p className="pth-finish-lead">
          逐条核对。有一项做不到，就回到对应的那一步，不用从头再来。
        </p>
        <ul>
          {path.finish.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="pth-manifest" aria-label="全部资产">
        <div className="pth-manifest-head">
          <h2>这条路径用到的全部资产</h2>
          <span>{resolved.assets.length} 份 · 按类型分组</span>
        </div>
        {groups.map((group) => (
          <div className="pth-group" key={group.type}>
            <h3>{group.label}</h3>
            <div className="pth-group-links">
              {group.items.map((asset) => (
                <Link href={asset.href} key={asset.key}>
                  {asset.title}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      {next ? (
        <Link className="pth-next" href={`/paths/${next.id}`}>
          <div>
            <span>走完这条，接着走</span>
            <strong>{next.name}</strong>
          </div>
          <em>
            下一条 <Arrow />
          </em>
        </Link>
      ) : null}
    </main>
  );
}

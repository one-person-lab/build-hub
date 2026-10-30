import Link from "next/link";
import "./BookView.css";
import { flatChapters, type Book, type Chapter } from "@/lib/drone-book";

function chapterHref(bookId: string, chapter: Chapter) {
  return `/explains/${bookId}/${chapter.slug}`;
}

export default function BookHub({ book, bookId }: { book: Book; bookId: string }) {
  const chapters = flatChapters(book);
  const byId = new Map(chapters.map((c) => [c.id, c]));

  return (
    <main className="book-main book-hub">
      <header className="book-hero">
        <p className="book-eyebrow">专题 · 技术手册 · {chapters.length} 章</p>
        <h1>
          {book.title}
          <span className="book-hero-sub">{book.subtitle}</span>
        </h1>
        <p className="book-oneLiner">{book.oneLiner}</p>
        <p className="book-intro">{book.intro}</p>
        <p className="book-forWhom">{book.forWhom}</p>
        {book.demo && (
          <a className="book-demo" href={book.demo}>
            看交互原型
            <svg className="ui-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M7 17 17 7M9 7h8v8" />
            </svg>
            <span>整套链路做成可点的高保真原型，50 个页面，数据是模拟的。</span>
          </a>
        )}
        <div className="book-stats">
          <span>
            <b>{book.volumes.length}</b> 卷
          </span>
          <span>
            <b>{chapters.length}</b> 章
          </span>
          <span>
            <b>9</b> 节/章
          </span>
          <span>
            <b>3</b> 类事实标记
          </span>
        </div>
      </header>

      <section className="book-paths" aria-label="阅读路径">
        <div className="book-block-head">
          <h2>三条读法</h2>
          <p>不用从第一页读到最后一页。按你现在要解决的问题挑一条。</p>
        </div>
        <div className="book-path-grid">
          {book.paths.map((path, index) => (
            <div className="book-path" key={path.name}>
              <div className="book-path-h">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{path.name}</h3>
              </div>
              <p>{path.note}</p>
              <ol>
                {path.chapters.map((id) => {
                  const c = byId.get(id);
                  if (!c) return null;
                  return (
                    <li key={id}>
                      <Link href={chapterHref(bookId, c)}>
                        <span>{c.id}</span>
                        {c.title}
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      </section>

      <section className="book-volumes" aria-label="全书目录">
        <div className="book-block-head">
          <h2>全书目录</h2>
          <p>四卷按顺序搭认知：先看全貌，再钻 AI 链路，然后补工程保障，最后练表达。</p>
        </div>
        {book.volumes.map((volume) => (
          <section className="book-volume" key={volume.id}>
            <header className="book-volume-head">
              <span className="book-volume-n">{volume.n}</span>
              <div>
                <h3>{volume.title}</h3>
                <p>{volume.intro}</p>
              </div>
            </header>
            <ol className="book-chapter-list">
              {volume.chapters.map((chapter) => (
                <li key={chapter.id}>
                  <Link className="book-chapter-row" href={chapterHref(bookId, chapter)}>
                    <span className="book-chapter-n">{chapter.id}</span>
                    <span className="book-chapter-main">
                      <span className="book-chapter-title">{chapter.title}</span>
                      <span className="book-chapter-summary">{chapter.summary}</span>
                    </span>
                    <span className="book-chapter-min">{chapter.minutes} 分钟</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </section>

      <footer className="book-footnote">
        <strong>事实怎么标：</strong>
        每章开头三行——已知事实、目标设计、验证结果。已知事实是平台或原型里能确认的；目标设计是打算这么做但还没上线的；验证结果是真跑过、有日志或测试数据支撑的。没有验证结果就明说没有，不把方案讲成已上线。
      </footer>
    </main>
  );
}

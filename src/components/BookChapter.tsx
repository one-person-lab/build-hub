import Link from "next/link";
import "./BookView.css";
import BookProse from "./BookProse";
import FigureFrame from "./FigureFrame";
import {
  FACT_LABEL,
  SECTION_ORDER,
  adjacent,
  type Book,
  type Chapter,
  type FactTag,
  type Volume,
} from "@/lib/drone-book";

const FACT_ORDER: FactTag[] = ["known", "designed", "verified"];

function BookNav({
  book,
  bookId,
  currentId,
}: {
  book: Book;
  bookId: string;
  currentId: string;
}) {
  return (
    <nav className="book-nav" aria-label="全书章节">
      {book.volumes.map((volume) => (
        <div className="book-nav-vol" key={volume.id}>
          <p className="book-nav-vol-h">
            {volume.n} · {volume.title}
          </p>
          <ul>
            {volume.chapters.map((chapter) => (
              <li key={chapter.id}>
                <Link
                  href={`/explains/${bookId}/${chapter.slug}`}
                  className={chapter.id === currentId ? "is-active" : undefined}
                  aria-current={chapter.id === currentId ? "page" : undefined}
                >
                  <span>{chapter.id}</span>
                  {chapter.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Facts({ chapter }: { chapter: Chapter }) {
  if (!chapter.facts.length) return null;
  return (
    <div className="book-facts" aria-label="本章事实边界">
      {FACT_ORDER.map((tag) => {
        const items = chapter.facts.filter((f) => f.tag === tag);
        if (!items.length) return null;
        return (
          <div className={`book-fact is-${tag}`} key={tag}>
            <span className="book-fact-label">{FACT_LABEL[tag]}</span>
            {items.map((item, i) => (
              <p key={i}>{item.text}</p>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export default function BookChapter({
  book,
  bookId,
  chapter,
  volume,
}: {
  book: Book;
  bookId: string;
  chapter: Chapter;
  volume?: Volume;
}) {
  const { prev, next } = adjacent(book, chapter);
  const sections = SECTION_ORDER.filter((s) => chapter.sections[s.key]?.trim());

  return (
    <main className="book-main book-reader">
      <div className="book-shell">
        <aside className="book-side">
          <Link className="book-side-title" href={`/explains/${bookId}`}>
            <span>{book.title}</span>
            <small>{book.subtitle}</small>
          </Link>
          <BookNav book={book} bookId={bookId} currentId={chapter.id} />
        </aside>

        <article className="book-article">
          <details className="book-mobile-nav">
            <summary>
              目录 · 第 {chapter.id} 章
              <span>{book.volumes.length} 卷 {book.volumes.reduce((n, v) => n + v.chapters.length, 0)} 章</span>
            </summary>
            <BookNav book={book} bookId={bookId} currentId={chapter.id} />
          </details>

          <header className="book-chapter-head">
            <nav className="book-crumb" aria-label="面包屑">
              <Link href="/explains">专题</Link>
              <span>/</span>
              <Link href={`/explains/${bookId}`}>{book.title}</Link>
            </nav>
            <p className="book-eyebrow">
              第 {chapter.id} 章{volume ? ` · ${volume.n} ${volume.title}` : ""}
            </p>
            <h1>{chapter.title}</h1>
            <p className="book-chapter-lede">{chapter.summary}</p>
            <div className="book-chapter-meta">
              <span>约 {chapter.minutes} 分钟</span>
              <span>{sections.length} 节</span>
            </div>
            <Facts chapter={chapter} />
          </header>

          <div className="book-body">
            {sections.map((section) => (
              <section className="book-sec" id={section.key} key={section.key}>
                <h2>
                  <span className="book-sec-n">{section.n}</span>
                  {section.title}
                </h2>
                <BookProse markdown={chapter.sections[section.key] ?? ""} />
                {(chapter.figures ?? [])
                  .filter((fig) => fig.at === section.key)
                  .map((fig) => (
                    <figure className="book-fig" key={fig.src}>
                      <FigureFrame src={fig.src} title={`${chapter.title} · ${fig.title}`} />
                      <figcaption>
                        <strong>{fig.title}</strong>
                        {fig.note ? ` —— ${fig.note}` : ""}
                      </figcaption>
                    </figure>
                  ))}
              </section>
            ))}
          </div>

          <nav className="book-pager" aria-label="章节翻页">
            {prev ? (
              <Link className="book-pager-link is-prev" href={`/explains/${bookId}/${prev.slug}`}>
                <span>上一章</span>
                <strong>
                  {prev.id} {prev.title}
                </strong>
              </Link>
            ) : (
              <Link className="book-pager-link is-prev" href={`/explains/${bookId}`}>
                <span>回到目录</span>
                <strong>{book.title}</strong>
              </Link>
            )}
            {next ? (
              <Link className="book-pager-link is-next" href={`/explains/${bookId}/${next.slug}`}>
                <span>下一章</span>
                <strong>
                  {next.id} {next.title}
                </strong>
              </Link>
            ) : (
              <Link className="book-pager-link is-next" href={`/explains/${bookId}`}>
                <span>读完了</span>
                <strong>回到全书目录</strong>
              </Link>
            )}
          </nav>
        </article>

        <aside className="book-rail" aria-label="本章小节">
          <p className="book-rail-h">本章小节</p>
          <ol>
            {sections.map((section) => (
              <li key={section.key}>
                <a href={`#${section.key}`}>
                  <span>{section.n}</span>
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </main>
  );
}

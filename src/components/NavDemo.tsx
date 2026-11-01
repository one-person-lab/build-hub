"use client";

import { useEffect, useRef, useState } from "react";
import "./NavDemo.css";

function Chevron({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function ArrowUpRight({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function Bell({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M10.268 21a2 2 0 0 0 3.464 0" />
      <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      <rect width="20" height="14" x="2" y="6" rx="2" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
      <rect x="2" y="4" width="20" height="16" rx="2" />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {open ? (
        <>
          <path d="M6 6l12 12" />
          <path d="M18 6 6 18" />
        </>
      ) : (
        <>
          <path d="M4 6h16" />
          <path d="M4 12h16" />
          <path d="M4 18h16" />
        </>
      )}
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4" />
    </svg>
  );
}

/* 1 · Classic top nav with dropdowns */
function ClassicTop() {
  const [open, setOpen] = useState<string | null>(null);
  const menus = [
    {
      key: "products",
      label: "Products",
      items: [
        ["Flowbase Studio", "Design and ship workflows"],
        ["Flowbase Cloud", "Managed runtime and logs"],
        ["Flowbase Sync", "Keep every workspace in step"],
        ["Flowbase API", "Build on top of the platform"],
      ],
    },
    {
      key: "solutions",
      label: "Solutions",
      items: [
        ["For product teams", "Prototype in the open"],
        ["For agencies", "Hand off without friction"],
        ["For startups", "Start free, scale later"],
        ["For enterprise", "SSO, audit logs, SLA"],
      ],
    },
  ] as const;

  return (
    <div className="nd nd1">
      <nav className="nd1-bar">
        <div className="nd1-inner">
          <div className="nd1-left">
            <a href="#" className="nd1-logo" onClick={(e) => e.preventDefault()}>Flowbase</a>
            <div className="nd1-links" onMouseLeave={() => setOpen(null)}>
              {menus.map((m) => (
                <div
                  key={m.key}
                  className={`nd1-menu${open === m.key ? " is-open" : ""}`}
                  onMouseEnter={() => setOpen(m.key)}
                >
                  <button
                    type="button"
                    className="nd1-link"
                    aria-expanded={open === m.key}
                    onFocus={() => setOpen(m.key)}
                    onClick={() => setOpen(open === m.key ? null : m.key)}
                  >
                    {m.label}
                    <Chevron className="nd1-chev" />
                  </button>
                  <div className="nd1-panel" role="menu">
                    {m.items.map(([title, desc]) => (
                      <a key={title} href="#" role="menuitem" onClick={(e) => e.preventDefault()}>
                        <b>{title}</b>
                        <small>{desc}</small>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
              <a href="#" className="nd1-link" onClick={(e) => e.preventDefault()}>Pricing</a>
            </div>
          </div>
          <div className="nd1-actions">
            <button type="button" className="nd1-bell" aria-label="Notifications">
              <Bell />
            </button>
            <button type="button" className="nd1-signin">Sign In</button>
            <button type="button" className="nd1-cta">Try it FREE</button>
          </div>
        </div>
      </nav>
    </div>
  );
}

/* 2 · Floating glass pill with a product card dropdown */
function RoundedGlass() {
  const [open, setOpen] = useState(false);
  const items = [
    ["Analytics", "Understand every session", "linear-gradient(135deg,#c4b5fd,#7c3aed)"],
    ["Automations", "Ship repeatable workflows", "linear-gradient(135deg,#fbcfe8,#db2777)"],
    ["Integrations", "Connect the tools you use", "linear-gradient(135deg,#bae6fd,#0284c7)"],
    ["Developer API", "Build your own surface", "linear-gradient(135deg,#bbf7d0,#059669)"],
  ] as const;

  return (
    <div className="nd nd2">
      <div className="nd2-glow" aria-hidden="true" />
      <div className="nd2-wrap" onMouseLeave={() => setOpen(false)}>
        <nav className="nd2-nav">
          <a href="#" className="nd2-logo" onClick={(e) => e.preventDefault()}>Flowbase</a>
          <div className="nd2-links" onMouseEnter={() => setOpen(true)}>
            <button type="button" onFocus={() => setOpen(true)} onClick={() => setOpen(!open)}>Product</button>
            <button type="button" onFocus={() => setOpen(true)} onClick={() => setOpen(!open)}>Community</button>
            <button type="button" onFocus={() => setOpen(true)} onClick={() => setOpen(!open)}>Pricing</button>
          </div>
          <div className="nd2-actions">
            <a href="#" className="nd2-login" onClick={(e) => e.preventDefault()}>Log in</a>
            <button type="button" className="nd2-cta">Try For Free</button>
          </div>
        </nav>
        <div className={`nd2-panel${open ? " is-open" : ""}`}>
          {items.map(([title, desc, grad]) => (
            <a key={title} href="#" className="nd2-card" onClick={(e) => e.preventDefault()}>
              <i style={{ background: grad }} />
              <span>
                <b>{title}</b>
                <small>{desc}</small>
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/* 3 · Centered capsule nav */
function CenteredCapsule() {
  const links = ["Pricing", "Docs", "Blog", "Tutorials", "Changelog"];
  return (
    <div className="nd nd3">
      <nav className="nd3-nav">
        <div className="nd3-inner">
          <a href="#" className="nd3-logo" onClick={(e) => e.preventDefault()}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M2 7.2 12 2l10 5.2-10 5.2Z" fill="currentColor" />
              <path d="M2 13.6 12 8.4l10 5.2L12 18.8Z" fill="currentColor" />
            </svg>
            <span>Toosquare</span>
          </a>
          <div className="nd3-caps">
            {links.map((l) => (
              <a href="#" key={l} onClick={(e) => e.preventDefault()}>{l}</a>
            ))}
          </div>
          <div className="nd3-auth">
            <a href="#" className="nd3-login" onClick={(e) => e.preventDefault()}>LOGIN</a>
            <a href="#" className="nd3-signup" onClick={(e) => e.preventDefault()}>SIGN UP</a>
          </div>
        </div>
      </nav>
    </div>
  );
}

/* 4 · Side dock */
function SideDock() {
  const items = [
    { icon: <HomeIcon />, label: "Home" },
    { icon: <BriefcaseIcon />, label: "Work" },
    { icon: <UserIcon />, label: "Account" },
    { icon: <MailIcon />, label: "Inbox" },
  ];
  return (
    <div className="nd nd4">
      <aside className="nd4-dock">
        <span className="nd4-logo" aria-hidden="true" />
        <div className="nd4-items">
          {items.map((it, i) => (
            <button key={it.label} type="button" className={`nd4-item${i === 0 ? " is-active" : ""}`}>
              {it.icon}
              <span className="nd4-tip">{it.label}</span>
            </button>
          ))}
        </div>
        <div className="nd4-brand">
          <span>Build</span>
          <span>Better</span>
        </div>
      </aside>
    </div>
  );
}

/* 5 · Expanding bottom nav */
function ExpandingBottom() {
  const [open, setOpen] = useState(false);
  const cols = [
    { title: "Menu", links: ["Home", "Products", "Pricing", "About"] },
    { title: "Resources", links: ["Docs", "Blog", "Changelog", "Support"] },
    { title: "Get in touch", links: ["hello@flowbase.co", "Book a demo", "Community", "Careers"] },
  ];
  return (
    <div className={`nd nd5${open ? " is-open" : ""}`}>
      <div className="nd5-head">
        <h1>Main Content Area</h1>
        <p>Click the navigation at the bottom.</p>
      </div>
      <div className="nd5-dock">
        <div className="nd5-panel">
          {cols.map((c) => (
            <div key={c.title} className="nd5-col">
              <b>{c.title}</b>
              {c.links.map((l) => (
                <a href="#" key={l} onClick={(e) => e.preventDefault()}>{l}</a>
              ))}
            </div>
          ))}
        </div>
        <div className="nd5-bar">
          <button type="button" className="nd5-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
            <span className="nd5-toggle-left">
              <MenuIcon open={open} />
              <span>{open ? "Close Menu" : "Open Menu"}</span>
            </span>
            <span className="nd5-home">Home</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* 6 · Fullscreen menu */
function FullscreenMenu() {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(0);
  const entries = [
    { label: "About", num: "01", grad: "linear-gradient(135deg,#dbeafe,#93c5fd 55%,#1d4ed8)" },
    { label: "Features", num: "02", grad: "linear-gradient(135deg,#fae8ff,#d8b4fe 55%,#7e22ce)" },
    { label: "Pricing", num: "03", grad: "linear-gradient(135deg,#dcfce7,#86efac 55%,#15803d)" },
    { label: "Blog", num: "04", grad: "linear-gradient(135deg,#ffedd5,#fdba74 55%,#c2410c)" },
  ];

  return (
    <div className={`nd nd6${open ? " is-open" : ""}`}>
      <div className="nd6-overlay" onClick={() => setOpen(false)}>
        <div className="nd6-overlay-inner" onClick={(e) => e.stopPropagation()}>
          <div className="nd6-big">
            {entries.map((e, i) => (
              <a
                key={e.label}
                href="#"
                onClick={(ev) => ev.preventDefault()}
                onMouseEnter={() => setHover(i)}
                style={{ transitionDelay: open ? `${80 + i * 45}ms` : "0ms" }}
              >
                <span className="nd6-num">{e.num}</span>
                <span>{e.label}</span>
              </a>
            ))}
          </div>
          <div className="nd6-preview" style={{ background: entries[hover].grad }}>
            <span className="nd6-preview-label">{entries[hover].label}</span>
            <span className="nd6-preview-sub">A closer look at what we build.</span>
          </div>
        </div>
      </div>
      <nav className="nd6-nav">
        <a href="#" className="nd6-logo" onClick={(e) => e.preventDefault()}>
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <circle cx="16" cy="16" r="12.4" fill="none" stroke="currentColor" strokeWidth="2.4" />
            <ellipse cx="16" cy="16" rx="12.4" ry="6" transform="rotate(45 16 16)" fill="none" stroke="currentColor" strokeWidth="2.2" />
            <ellipse cx="16" cy="16" rx="12.4" ry="6" transform="rotate(-45 16 16)" fill="none" stroke="currentColor" strokeWidth="2.2" />
          </svg>
          <span>Spherule</span>
        </a>
        <div className="nd6-links">
          {["About", "Features", "Pricing", "Blog"].map((l) => (
            <a key={l} href="#" onClick={(e) => e.preventDefault()}>{l}</a>
          ))}
        </div>
        <button type="button" className="nd6-menu" aria-expanded={open} onClick={() => setOpen(!open)}>
          <MenuIcon open={open} />
          <span>{open ? "Close" : "Menu"}</span>
        </button>
      </nav>
    </div>
  );
}

/* 7 · Row of pill links */
function RoundedPill() {
  const [open, setOpen] = useState<string | null>(null);
  const groups = [
    { label: "Product", items: [["Overview", "One canvas for everything"], ["Features", "Built for speed"], ["Pricing", "Plans for every team"]] },
    { label: "Resources", items: [["Blog", "Notes from the team"], ["Docs", "Guides and references"], ["Guides", "Learn by building"]] },
    { label: "Enterprise", items: [["Security", "SOC 2 and SSO"], ["SLA", "99.99% uptime"], ["Procurement", "Talk to sales"]] },
    { label: "Customers", items: [["Stories", "Teams shipping faster"], ["Case studies", "Measured results"], ["Wall of love", "What people say"]] },
  ];
  return (
    <div className="nd nd7">
      <nav className="nd7-nav">
        <div className="nd7-left" onMouseLeave={() => setOpen(null)}>
          <a href="#" className="nd7-logo" aria-label="Home" onClick={(e) => e.preventDefault()}>
            <i />
          </a>
          {groups.map((g) => (
            <div key={g.label} className="nd7-item" onMouseEnter={() => setOpen(g.label)}>
              <button
                type="button"
                className={`nd7-pill${open === g.label ? " is-open" : ""}`}
                aria-expanded={open === g.label}
                onFocus={() => setOpen(g.label)}
                onClick={() => setOpen(open === g.label ? null : g.label)}
              >
                {g.label}
              </button>
              <div className="nd7-panel">
                {g.items.map(([title, desc]) => (
                  <a key={title} href="#" onClick={(e) => e.preventDefault()}>
                    <b>{title}</b>
                    <small>{desc}</small>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="nd7-actions">
          <button type="button" className="nd7-login">Log in</button>
          <button type="button" className="nd7-cta">Try Free</button>
        </div>
      </nav>
    </div>
  );
}

/* 8 · Blurred bottom dock with image previews */
function BlurredBottom() {
  const [hover, setHover] = useState<number | null>(null);
  const groups = [
    { label: "Personal", copy: "A calmer home for your own work.", grad: "linear-gradient(135deg,#fde68a,#f59e0b 55%,#7c2d12)" },
    { label: "Business", copy: "Give every team one shared source.", grad: "linear-gradient(135deg,#bfdbfe,#3b82f6 55%,#1e3a8a)" },
    { label: "Company", copy: "Run the whole org in one place.", grad: "linear-gradient(135deg,#bbf7d0,#22c55e 55%,#14532d)" },
  ];
  return (
    <div className="nd nd8">
      <div className="nd5-head">
        <h1>Main Content Area</h1>
        <p>Click the navigation at the bottom.</p>
      </div>
      <div className="nd8-dock" onMouseLeave={() => setHover(null)}>
        <div className={`nd8-preview${hover !== null ? " is-open" : ""}`}>
          {hover !== null && (
            <>
              <div className="nd8-shot" style={{ background: groups[hover].grad }}>
                <span>{groups[hover].label}</span>
              </div>
              <p>{groups[hover].copy}</p>
            </>
          )}
        </div>
        <div className="nd8-bar">
          <button type="button" className="nd8-home" aria-label="Home">
            <HomeIcon />
          </button>
          <div className="nd8-links">
            {groups.map((g, i) => (
              <button
                key={g.label}
                type="button"
                className={hover === i ? "is-on" : undefined}
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* 9 · Minimal brand bar */
function StatusPill() {
  return (
    <div className="nd nd9">
      <nav className="nd9-bar">
        <a href="#" className="nd9-logo" onClick={(e) => e.preventDefault()}>
          <span className="nd9-badge">N</span>
          <span>Northwind</span>
        </a>
        <div className="nd9-links">
          {["Products", "Platform", "Pricing", "Company"].map((l) => (
            <a key={l} href="#" onClick={(e) => e.preventDefault()}>{l}</a>
          ))}
        </div>
        <button type="button" className="nd9-cta">Get Started</button>
      </nav>
      <div className="nd9-body">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="nd9-card" />
        ))}
      </div>
    </div>
  );
}

/* 10 · Announcement pill bar */
function PeekingAnnouncement() {
  return (
    <div className="nd nd10">
      <nav className="nd10-bar">
        <a href="#" className="nd10-logo" onClick={(e) => e.preventDefault()}>
          <span className="nd10-badge"><FlameIcon /></span>
          <span className="nd10-word">NORTHWIND</span>
        </a>
        <a href="#" className="nd10-pill" onClick={(e) => e.preventDefault()}>
          <span className="nd10-dot" />
          <span>Early access is open. Northwind is live on iOS</span>
          <span className="nd10-chev">›</span>
        </a>
        <div className="nd10-actions">
          <button type="button" className="nd10-dl">
            <DownloadIcon />
            <span>DOWNLOAD</span>
          </button>
          <button type="button" className="nd10-burger" aria-label="Menu">
            <MenuIcon open={false} />
          </button>
        </div>
      </nav>
    </div>
  );
}

/* 11 · Dark pill bar */
function DarkPill() {
  const links = ["Overview", "Stories", "Our Why", "FAQs"];
  return (
    <div className="nd nd11">
      <nav className="nd11-nav">
        <div className="nd11-links">
          {links.map((l) => (
            <button key={l} type="button" className="nd11-link">{l}</button>
          ))}
        </div>
        <span className="nd11-word">northwind</span>
        <div className="nd11-auth">
          <a href="#" className="nd11-login" onClick={(e) => e.preventDefault()}>Login</a>
          <button type="button" className="nd11-cta">Start Testing</button>
        </div>
      </nav>
    </div>
  );
}

/* 12 · Sliding indicator nav */
function SlidingIndicator() {
  const links = ["Overview", "Product", "Customers", "Pricing"];
  const [active, setActive] = useState(0);
  const [ind, setInd] = useState<{ left: number; width: number } | null>(null);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const el = refs.current[active];
    if (el) setInd({ left: el.offsetLeft, width: el.offsetWidth });
  }, [active]);

  return (
    <div className="nd nd12">
      <div className="nd12-header">
        <nav className="nd12-nav">
          <a href="#" className="nd12-logo" onClick={(e) => e.preventDefault()}>
            <span className="nd12-mark" aria-hidden="true">
              <i />
              <i />
            </span>
            <span>Arc</span>
          </a>
          <div className="nd12-links" onMouseLeave={() => setActive(0)}>
            {links.map((l, i) => (
              <button
                key={l}
                ref={(el) => { refs.current[i] = el; }}
                type="button"
                className={`nd12-link${active === i ? " is-on" : ""}`}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
              >
                {l}
              </button>
            ))}
            <span
              className="nd12-ind"
              aria-hidden="true"
              style={ind ? { left: ind.left, width: ind.width, opacity: 1 } : { opacity: 0 }}
            />
          </div>
          <div className="nd12-actions">
            <a href="#" className="nd12-sign" onClick={(e) => e.preventDefault()}>Sign in</a>
            <button type="button" className="nd12-cta">
              Start free
              <ArrowRight />
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}

/* 13 · Centered wordmark nav with text-roll links */
function CenteredWordmark() {
  const left = ["Work", "Studio", "Services"];
  const right = ["Journal", "Contact"];
  const roll = (label: string) => (
    <a href="#" className="nd13-link" onClick={(e) => e.preventDefault()}>
      <span className="nd13-roll">
        <span>{label}</span>
        <span aria-hidden="true">{label}</span>
      </span>
    </a>
  );
  return (
    <div className="nd nd13">
      <nav className="nd13-nav">
        <div className="nd13-left">{left.map(roll)}</div>
        <span className="nd13-word">Northline<sup>®</sup></span>
        <div className="nd13-right">
          {right.map(roll)}
          <a href="#" className="nd13-cta" onClick={(e) => e.preventDefault()}>
            Start a project
            <ArrowUpRight />
          </a>
        </div>
      </nav>
    </div>
  );
}

/* 14 · Mega panel nav */
function MegaPanel() {
  const [open, setOpen] = useState(false);
  const columns = [
    { title: "Products", items: [["Vault Core", "Secrets, encrypted"], ["Approvals", "Ship with a paper trail"], ["Audit log", "Every change, kept"]] },
    { title: "Solutions", items: [["Startups", "Move fast, stay safe"], ["Enterprise", "SSO and role control"], ["Agencies", "One vault per client"]] },
    { title: "Resources", items: [["Docs", "Set up in minutes"], ["Guides", "Patterns that scale"], ["Changelog", "What shipped this week"]] },
  ];
  return (
    <div className={`nd nd14${open ? " is-open" : ""}`} onMouseLeave={() => setOpen(false)}>
      <header className="nd14-head">
        <nav className="nd14-nav">
          <div className="nd14-left">
            <a href="#" className="nd14-logo" onClick={(e) => e.preventDefault()}>
              <span className="nd14-mark"><i /></span>
              <span>Vault</span>
            </a>
            <div className="nd14-menu" onMouseEnter={() => setOpen(true)}>
              {["Product", "Solutions", "Resources"].map((l) => (
                <button
                  key={l}
                  type="button"
                  className="nd14-btn"
                  aria-expanded={open}
                  onFocus={() => setOpen(true)}
                  onClick={() => setOpen(!open)}
                >
                  {l}
                  <Chevron />
                </button>
              ))}
              <a href="#" className="nd14-btn" onClick={(e) => e.preventDefault()}>Pricing</a>
            </div>
          </div>
          <div className="nd14-actions">
            <a href="#" className="nd14-login" onClick={(e) => e.preventDefault()}>Log in</a>
            <button type="button" className="nd14-cta">Request access</button>
          </div>
        </nav>
        <div className="nd14-panel">
          {columns.map((c) => (
            <div key={c.title} className="nd14-col">
              <b>{c.title}</b>
              {c.items.map(([title, desc]) => (
                <a key={title} href="#" onClick={(e) => e.preventDefault()}>
                  <span>
                    <strong>{title}</strong>
                    <small>{desc}</small>
                  </span>
                  <ArrowUpRight />
                </a>
              ))}
            </div>
          ))}
          <a href="#" className="nd14-feature" onClick={(e) => e.preventDefault()}>
            <span className="nd14-feature-tag">New</span>
            <span className="nd14-feature-title">Vault 2.0 is here</span>
            <span className="nd14-feature-copy">A calmer way to ship secrets and approvals.</span>
            <span className="nd14-feature-link">Read the launch note <ArrowUpRight /></span>
          </a>
        </div>
      </header>
    </div>
  );
}

/* 15 · Traveling underline nav */
function TravelingUnderline() {
  const links = ["Work", "Services", "About", "Journal"];
  const [active, setActive] = useState(0);
  const [ind, setInd] = useState<{ left: number; width: number } | null>(null);
  const refs = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    const el = refs.current[active];
    if (el) setInd({ left: el.offsetLeft, width: el.offsetWidth });
  }, [active]);

  return (
    <div className="nd nd15">
      <nav className="nd15-nav">
        <a href="#" className="nd15-logo" onClick={(e) => e.preventDefault()}>
          <span />
          <span>Plainform</span>
        </a>
        <div className="nd15-links" onMouseLeave={() => setActive(0)}>
          {links.map((l, i) => (
            <a
              key={l}
              ref={(el) => { refs.current[i] = el; }}
              href="#"
              className={`nd15-link${active === i ? " is-on" : ""}`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={(e) => { e.preventDefault(); setActive(i); }}
            >
              {l}
            </a>
          ))}
          <span
            className="nd15-ind"
            aria-hidden="true"
            style={ind ? { left: ind.left, width: ind.width, opacity: 1 } : { opacity: 0 }}
          />
        </div>
        <div className="nd15-actions">
          <a href="#" className="nd15-login" onClick={(e) => e.preventDefault()}>Log in</a>
          <a href="#" className="nd15-cta" onClick={(e) => e.preventDefault()}>
            Talk to us
            <ArrowUpRight />
          </a>
        </div>
      </nav>
    </div>
  );
}

const DEMOS: Record<string, () => React.JSX.Element> = {
  "nav-classic-top": ClassicTop,
  "nav-rounded-glass": RoundedGlass,
  "nav-centered-capsule": CenteredCapsule,
  "nav-side-dock": SideDock,
  "nav-expanding-bottom": ExpandingBottom,
  "nav-fullscreen-menu": FullscreenMenu,
  "nav-rounded-pill": RoundedPill,
  "nav-blurred-bottom": BlurredBottom,
  "nav-status-pill": StatusPill,
  "nav-peeking-announcement": PeekingAnnouncement,
  "nav-dark-mega": DarkPill,
  "nav-sliding-indicator": SlidingIndicator,
  "nav-centered-wordmark": CenteredWordmark,
  "nav-mega-panel": MegaPanel,
  "nav-traveling-underline": TravelingUnderline,
};

export default function NavDemo({ slug }: { slug: string }) {
  const Demo = DEMOS[slug];
  return Demo ? <Demo /> : <div className="nd" />;
}

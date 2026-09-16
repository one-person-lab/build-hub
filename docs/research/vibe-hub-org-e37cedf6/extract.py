#!/usr/bin/env python3
"""VibeHub 全站结构化提取器：raw HTML -> data/*.json"""
import json, os, re, html as hm
from pathlib import Path

RAW = Path('/tmp/vh_scrape/raw')
OUT = Path('/tmp/vh_scrape/data')
OUT.mkdir(parents=True, exist_ok=True)

VOID = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}

def inner_html(s, start):
    """从 start（某个开始标签的 '<' 位置）提取平衡元素的 inner HTML。"""
    m = re.match(r'<([a-zA-Z][a-zA-Z0-9-]*)', s[start:])
    if not m:
        return None
    tag = m.group(1).lower()
    i = s.index('>', start) + 1
    if s[i-2:i] == '/>' or tag in VOID:
        return ''
    depth = 1
    pat = re.compile(r'<(/?)(' + re.escape(tag) + r')(?=[\s/>])|<!--', re.I)
    pos = i
    while depth > 0:
        mm = pat.search(s, pos)
        if not mm:
            return s[i:]
        if mm.group(0) == '<!--':
            end = s.find('-->', mm.end())
            pos = (end + 3) if end != -1 else len(s)
            continue
        if mm.group(1):
            depth -= 1
            if depth == 0:
                return s[i:mm.start()]
        else:
            depth += 1
        pos = mm.end()
    return s[i:]

def find_class(s, cls, start=0):
    """返回 class 含 cls 的元素 innerHTML 与起始位置。"""
    pat = re.compile(r'<([a-zA-Z][a-zA-Z0-9-]*)[^>]*class="([^"]*)"', re.S)
    pos = start
    while True:
        m = pat.search(s, pos)
        if not m:
            return None, None
        classes = m.group(2).split()
        if cls in classes:
            return inner_html(s, m.start()), m.start()
        pos = m.end()

def full_elem(s, start):
    """返回从 start 开始的完整元素（含开标签）文本。"""
    m = re.match(r'<([a-zA-Z][a-zA-Z0-9-]*)', s[start:])
    if not m:
        return None
    tag = m.group(1).lower()
    i = s.index('>', start) + 1
    if s[i-2:i] == '/>' or tag in VOID:
        return s[start:i]
    depth = 1
    pat = re.compile(r'<(/?)(' + re.escape(tag) + r')(?=[\s/>])|<!--', re.I)
    pos = i
    while depth > 0:
        mm = pat.search(s, pos)
        if not mm:
            return s[start:]
        if mm.group(0) == '<!--':
            end = s.find('-->', mm.end())
            pos = (end + 3) if end != -1 else len(s)
            continue
        if mm.group(1):
            depth -= 1
            if depth == 0:
                return s[start:mm.end() + 1]
        else:
            depth += 1
        pos = mm.end()
    return s[start:pos + 1]

def find_all_class(s, cls):
    out, pos = [], 0
    pat = re.compile(r'<([a-zA-Z][a-zA-Z0-9-]*)[^>]*class="([^"]*)"', re.S)
    while True:
        m = pat.search(s, pos)
        if not m:
            return out
        if cls in m.group(2).split():
            out.append(full_elem(s, m.start()))
            pos = m.end() + 1
        else:
            pos = m.end()

def text_of(h):
    if h is None:
        return ''
    t = re.sub(r'<[^>]+>', '', h)
    t = t.replace('<!-- -->', '')
    return hm.unescape(t).strip()

def clean(h):
    """去掉 React SSR 注释，保留原始 HTML。"""
    if h is None:
        return ''
    return re.sub(r'<!--[^>]*?-->', '', h)

def first_tag_attr(s, tag, attr, start=0):
    m = re.compile(r'<' + tag + r'[^>]*\b' + attr + r'="([^"]*)"', re.S).search(s, start)
    return m.group(1) if m else None

def parse_title_block(h):
    """<h3>前端<span>Frontend</span></h3> -> (name, en)"""
    t = text_of(h)
    m = re.search(r'<span[^>]*>([^<]*)</span>', h or '')
    en = hm.unescape(m.group(1)).strip() if m else ''
    name = re.sub(r'<span[^>]*>.*?</span>', '', h or '', flags=re.S)
    name = hm.unescape(re.sub(r'<[^>]+>', '', name)).strip()
    return name, en

# ---------- catalog ----------
def parse_catalog(path, page_key, href):
    s = (RAW / path).read_text(encoding='utf-8')
    # tabs
    tabs = []
    finder, _ = find_class(s, 'catalog-filter-list')
    if finder:
        for chip in find_all_class(finder, 'catalog-filter-chip'):
            label = re.sub(r'<span[^>]*>.*?</span>', '', chip, flags=re.S)
            cnt = re.search(r'<span[^>]*>([\d]+)</span>', chip)
            tabs.append({'label': text_of(label), 'count': int(cnt.group(1)) if cnt else 0,
                         'active': 'aria-pressed="true"' in chip or 'aria-pressed=&quot;true&quot;' in chip})
    # sidebar chips
    sidebar = []
    side, _ = find_class(s, 'catalog-sidebar')
    if side:
        for chip in find_all_class(side, 'catalog-filter-chip'):
            sidebar.append(text_of(chip))
    # groups
    groups = []
    sections = re.split(r'<section class="cat-section" id="', s)[1:]
    for sec in sections:
        gid = sec.split('"', 1)[0]
        title_h = re.search(r'<div class="cat-title">(.*?)(?:<span|\Z)', sec, re.S)
        title = hm.unescape(re.sub(r'<[^>]+>', '', title_h.group(1))).strip() if title_h else gid.replace('cat-', '')
        cnt = re.search(r'<div class="cat-title">[^<]*<span[^>]*>\s*([\d]+)', sec)
        terms = []
        for card in find_all_class(sec, 'card'):
            data_id = first_tag_attr(card, 'article', 'data-id') or ''
            if not data_id:
                m = re.search(r'data-id="([^"]+)"', card)
                data_id = m.group(1) if m else ''
            h3m = re.search(r'<h3>.*?</h3>', card, re.S)
            name, en = parse_title_block(h3m.group(0)) if h3m else ('', '')
            tag_m = re.search(r'<div class="card-tagline[^"]*">(.*?)</div>', card, re.S)
            terms.append({'slug': data_id, 'name': name, 'en': en,
                          'tagline': text_of(tag_m.group(1)) if tag_m else ''})
        groups.append({'id': gid, 'title': title,
                       'count': int(cnt.group(1)) if cnt else len(terms),
                       'terms': terms})
    h1m = re.search(r'<header class="catalog-heading"><h1>(.*?)</h1>', s, re.S)
    return {'key': page_key, 'href': href, 'title': text_of(h1m.group(1)) if h1m else '',
            'tabs': tabs, 'sidebar': sidebar, 'groups': groups}

# ---------- term detail ----------
def parse_term(slug, path):
    s = (RAW / path).read_text(encoding='utf-8')
    t = {}
    t['slug'] = slug
    # h1
    h1, _ = find_class(s, 'dh-head')
    if h1:
        m = re.search(r'<h1>(.*?)</h1>', h1, re.S)
        if m:
            t['name'], t['en'] = parse_title_block(m.group(1))
    # quote
    q, _ = find_class(s, 'dh-quote')
    if q:
        lab = re.search(r'<span class="dh-quote-label">(.*?)</span>', q, re.S)
        txt = re.search(r'<p class="dh-quote-text">(.*?)</p>', q, re.S)
        t['quoteLabel'] = text_of(lab.group(1)) if lab else '你可能会说'
        t['quote'] = text_of(txt.group(1)) if txt else ''
    # tagline
    tg, _ = find_class(s, 'dh-tagline')
    if tg:
        lead = re.search(r'<strong class="dh-summary-lead">(.*?)</strong>', tg, re.S)
        rest = re.search(r'</strong>(?:<span[^>]*>·</span>)?\s*<span>(.*?)</span>', tg, re.S)
        t['summaryLead'] = text_of(lead.group(1)) if lead else ''
        t['summaryRest'] = text_of(rest.group(1)) if rest else ''
    # alias
    al, _ = find_class(s, 'alias-row')
    t['aliases'] = ([text_of(e) for e in re.findall(r'<em[^>]*>(.*?)</em>', al, re.S)] if al else [])
    # hero demo
    demo, _ = find_class(s, 'dh-demo-inner')
    t['demoHtml'] = clean(demo) if demo else ''
    # sections
    body, _ = find_class(s, 'detail-body')
    sections = []
    if body:
        for sec in re.split(r'<section', body)[1:]:
            title_m = re.search(r'<div class="section-title">(.*?)</div>', sec, re.S)
            title = text_of(title_m.group(1)) if title_m else ''
            if 'detail-hero' in sec[:60]:
                continue
            if 'gpt-support' in sec[:200] or 'gpt-account-banner' in sec[:600]:
                continue  # 推广位，不复刻
            entry = {'title': title}
            # 结构化 distinctions
            if '容易混淆' in title:
                cards = []
                for c in find_all_class(sec, 'distinction-card'):
                    head = re.search(r'<div class="distinction-head">(.*?)</div>', c, re.S)
                    p = re.search(r'<p>(.*?)</p>', c, re.S)
                    cards.append({'headHtml': clean(head.group(1)) if head else '',
                                  'headText': text_of(head.group(1)) if head else '',
                                  'bodyHtml': clean(p.group(1)) if p else ''})
                entry['cards'] = cards
            elif 'Anatomy' in title:
                stage, _ = find_class(sec, 'anat-stage')
                parts = []
                for p in find_all_class(sec, 'anat-part'):
                    pn = re.search(r'<span class="pn">(.*?)</span>', p, re.S)
                    pe = re.search(r'<span class="pe">(.*?)</span>', p, re.S)
                    pd = re.search(r'<span class="pd">(.*?)</span>', p, re.S)
                    idx = re.search(r'<span class="idx">(.*?)</span>', p, re.S)
                    parts.append({'idx': text_of(idx.group(1)) if idx else '',
                                  'name': text_of(pn.group(1)) if pn else '',
                                  'en': text_of(pe.group(1)) if pe else '',
                                  'desc': text_of(pd.group(1)) if pd else ''})
                entry['stageHtml'] = clean(stage) if stage else ''
                entry['parts'] = parts
            elif 'Variants' in title:
                variants = []
                for v in find_all_class(sec, 'variant-card'):
                    nm = re.search(r'<div class="variant-name">(.*?)</div>', v, re.S)
                    dm = re.search(r'<div class="variant-demo">(.*?)</div>', v, re.S)
                    wh = re.search(r'<div class="variant-when">(.*?)</div>', v, re.S)
                    variants.append({'name': text_of(re.sub(r'<span[^>]*>.*?</span>', '', nm.group(1), flags=re.S)) if nm else '',
                                     'en': (lambda m2: text_of(m2.group(1)) if m2 else '')(re.search(r'<span[^>]*>(.*?)</span>', nm.group(1), re.S) if nm else None),
                                     'demoHtml': clean(dm.group(1)) if dm else '',
                                     'when': text_of(wh.group(1)) if wh else ''})
                entry['variants'] = variants
            elif '典型使用场景' in title:
                scenes = []
                for sc in find_all_class(sec, 'scene-item'):
                    cap = re.search(r'<div class="scene-cap">(.*?)</div>', sc, re.S)
                    shot = re.search(r'<div class="scene-shot[^"]*">(.*?)</article|<div class="scene-shot[^"]*"(.*)$', sc, re.S)
                    shot, _ = find_class(sc, 'scene-shot')
                    scenes.append({'cap': text_of(cap.group(1)) if cap else '',
                                   'shotHtml': clean(shot) if shot else ''})
                entry['scenes'] = scenes
            elif '延伸阅读' in title:
                refs = []
                for r in find_all_class(sec, 'reference-link'):
                    ti = re.search(r'<span class="reference-title">(.*?)</span>', r, re.S)
                    so = re.search(r'<span class="reference-source">(.*?)</span>', r, re.S)
                    href = first_tag_attr(r, 'a', 'href')
                    refs.append({'title': text_of(ti.group(1)) if ti else '',
                                 'source': text_of(re.sub(r'↗', '', text_of(so.group(1)) if so else '')),
                                 'href': href or ''})
                entry['references'] = refs
            entry['html'] = clean('<section' + sec)
            sections.append(entry)
    t['sections'] = sections
    # prev/next
    nav, _ = find_class(s, 'detail-entry-navigation')
    if nav:
        lefts = find_all_class(nav, 'float-nav')
        rights = find_all_class(nav, 'float-nav')
        if lefts:
            m = re.search(r'data-goto="([^"]+)"', lefts[0])
            t['prev'] = m.group(1) if m else None
        if rights:
            m = re.search(r'data-goto="([^"]+)"', rights[-1])
            t['next'] = m.group(1) if m else None
    return t

# ---------- run ----------
catalogs = []
for path, key, href in [('index.html', 'frontend', '/')] + \
        [(f'topics__{k}.html', k, f'/topics/{k}') for k in ['backend','product','testing','technology','ai','git','design']]:
    catalogs.append(parse_catalog(path, key, href))

(OUT / 'catalogs.json').write_text(json.dumps(catalogs, ensure_ascii=False, indent=1), encoding='utf-8')

# card demos merge
demo_map = {}
for f in Path('/tmp/vh_scrape').glob('card-demos*.json'):
    for c in json.loads(f.read_text(encoding='utf-8')):
        if len(c.get('demoHtml','').strip()) > 10:
            demo_map[c['id']] = c

slug_set = set(demo_map.keys())
# term slugs from catalogs
all_slugs = []
for cat in catalogs:
    for g in cat['groups']:
        for tm in g['terms']:
            if tm['slug'] not in all_slugs:
                all_slugs.append(tm['slug'])
print('total terms:', len(all_slugs), 'with demo:', len([s for s in all_slugs if s in demo_map]))

terms = []
for slug in all_slugs:
    p = RAW / (slug + '.html')
    if not p.exists():
        print('MISSING', slug)
        continue
    terms.append(parse_term(slug, p))
(OUT / 'terms.json').write_text(json.dumps(terms, ensure_ascii=False, indent=1), encoding='utf-8')
print('terms parsed:', len(terms))

# special pages -> main innerHTML
special = {
    'practice': 'practice.html', 'courses': 'courses.html',
    'anti-ai-flavor': 'anti-ai-flavor.html', 'changelog': 'changelog.html',
    'vibehub-skill': 'vibehub-skill.html',
    'course-product-website': 'courses__product-website.html',
}
pages = {}
for key, f in special.items():
    p = RAW / f
    if not p.exists():
        print('MISSING PAGE', f); continue
    s = p.read_text(encoding='utf-8')
    main, _ = find_class(s, 'detail') if False in [] else (None, None)
    m = re.search(r'<main[^>]*>(.*)</main>', s, re.S)
    title = re.search(r'<title>(.*?)</title>', s, re.S)
    pages[key] = {'title': hm.unescape(title.group(1)) if title else key, 'mainHtml': clean(m.group(1)) if m else ''}
# course chapters
for f in sorted(RAW.glob('courses__product-website__*.html')):
    key = f.stem.replace('courses__product-website__', 'course-')
    s = f.read_text(encoding='utf-8')
    m = re.search(r'<main[^>]*>(.*)</main>', s, re.S)
    title = re.search(r'<title>(.*?)</title>', s, re.S)
    pages[key] = {'title': hm.unescape(title.group(1)) if title else key, 'mainHtml': clean(m.group(1)) if m else ''}
(OUT / 'pages.json').write_text(json.dumps(pages, ensure_ascii=False, indent=1), encoding='utf-8')
print('pages:', len(pages))

# nav (shared)
s = (RAW / 'index.html').read_text(encoding='utf-8')
nav, _ = find_class(s, 'nav-primary')
footer = re.search(r'<footer class="site-footer".*</footer>', s, re.S)
(OUT / 'chrome.json').write_text(json.dumps({
    'navHtml': clean(nav) if nav else '',
    'footerHtml': clean(footer.group(0)) if footer else '',
}, ensure_ascii=False, indent=1), encoding='utf-8')
print('chrome ok')

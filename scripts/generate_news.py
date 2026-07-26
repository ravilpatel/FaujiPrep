#!/usr/bin/env python3
"""Build the static FaujiPrep news feed from PIB and Google News RSS."""
from __future__ import annotations

import calendar
import hashlib
import html
import json
import os
import re
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / "news" / "data" / "news.json"
ARTICLES_DIR = ROOT / "news" / "articles"
MAX_ITEMS = 100
KEEP_DAYS = 45
RSS_SOURCES = [
    ("PIB", "https://pib.gov.in/RssMain.aspx?reg=3&lang=2"),
    ("Google News", "https://news.google.com/rss/search?q=" + urllib.parse.quote('India defence OR "Indian Army" OR "Indian Navy" OR "Indian Air Force" when:7d') + "&hl=en-IN&gl=IN&ceid=IN:en"),
    ("Google News", "https://news.google.com/rss/search?q=" + urllib.parse.quote('India NDA OR CDS OR SSB OR "defence recruitment" when:7d') + "&hl=en-IN&gl=IN&ceid=IN:en"),
    ("Google News", "https://news.google.com/rss/search?q=" + urllib.parse.quote('India defence technology OR DRDO OR "Ministry of Defence" when:7d') + "&hl=en-IN&gl=IN&ceid=IN:en"),
]

def clean(value: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", value or ""))).strip()

def fetch(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": "FaujiPrepNewsBot/1.0 (+https://faujiprep.app)"})
    with urllib.request.urlopen(request, timeout=25) as response:
        return response.read()

def parse_date(value: str) -> str:
    try:
        return parsedate_to_datetime(value).astimezone(timezone.utc).isoformat()
    except (TypeError, ValueError):
        return datetime.now(timezone.utc).isoformat()

def category_for(title: str) -> str:
    text = title.lower()
    if any(word in text for word in ("nda", "cds", "ssb", "exam", "recruit", "agniveer", "admission")):
        return "Exams & Recruitment"
    if any(word in text for word in ("drdo", "missile", "space", "technology", "cyber", "ai ", "drone")):
        return "Defence Technology"
    if any(word in text for word in ("army", "navy", "air force", "armed forces", "defence", "ministry of defence")):
        return "Defence"
    return "India Updates"

def parse_feed(source: str, url: str) -> list[dict]:
    root = ET.fromstring(fetch(url))
    records = []
    for node in root.findall('.//item'):
        title = clean(node.findtext('title', ''))
        link = clean(node.findtext('link', ''))
        description = clean(node.findtext('description', ''))
        if not title or not link:
            continue
        digest = hashlib.sha256(link.encode()).hexdigest()[:16]
        records.append({
            "id": digest, "title": title, "url": link, "source": source,
            "summary": description[:500], "published_at": parse_date(node.findtext('pubDate', '')),
            "category": category_for(title), "tags": [category_for(title)],
        })
    return records

def load_existing() -> list[dict]:
    try:
        return json.loads(DATA_FILE.read_text(encoding='utf-8')).get("items", [])
    except (OSError, json.JSONDecodeError):
        return []

def is_relevant(item: dict) -> bool:
    text = (item['title'] + ' ' + item['summary']).lower()
    keywords = ("india", "indian", "defence", "defense", "army", "navy", "air force", "armed forces", "drdo", "nda", "cds", "ssb", "agniveer", "military", "ministry of defence")
    return item['source'] == 'PIB' or any(key in text for key in keywords)

def gemini_article(item: dict) -> dict | None:
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        return None
    model = os.environ.get('GEMINI_MODEL') or 'gemini-2.0-flash'
    prompt = f'''Write a factual, useful 450-650 word FaujiPrep news explainer for Indian defence and SSB aspirants. Use only the supplied source details. Do not invent facts, dates, quotations or official advice. Include a short "Why it matters for aspirants" section and clearly attribute the original source. Return only valid JSON with keys: title, excerpt, body_html. body_html may use only p, h2, ul, li, strong and a tags. Source title: {item['title']}\nSource: {item['source']}\nPublished: {item['published_at']}\nURL: {item['url']}\nSource description: {item['summary']}'''
    payload = json.dumps({"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"responseMimeType": "application/json", "temperature": 0.3}}).encode()
    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{urllib.parse.quote(model)}:generateContent?key={urllib.parse.quote(api_key)}"
    request = urllib.request.Request(endpoint, data=payload, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            result = json.loads(response.read())
        text = result['candidates'][0]['content']['parts'][0]['text']
        return json.loads(text.strip().removeprefix('```json').removesuffix('```').strip())
    except (OSError, ValueError, KeyError, IndexError) as error:
        print(f"Gemini skipped {item['id']}: {error}")
        return None

def safe_html(value: str) -> str:
    # Gemini is constrained to a tiny tag set; remove unexpected tags as a final safeguard.
    return re.sub(r"<(?!/?(?:p|h2|ul|li|strong|a)(?:\s[^>]*)?>)[^>]*>", "", value or "")

def write_article(item: dict, ai: dict) -> None:
    slug = re.sub(r"[^a-z0-9]+", "-", item['title'].lower()).strip('-')[:80] + '-' + item['id'][:6]
    path = ARTICLES_DIR / f"{slug}.html"
    body = safe_html(ai.get('body_html', ''))
    title = clean(ai.get('title') or item['title'])
    excerpt = clean(ai.get('excerpt') or item['summary'])
    canonical = f"https://faujiprep.app/news/articles/{path.name}"
    page = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{html.escape(title)} | FaujiPrep News</title><meta name="description" content="{html.escape(excerpt[:155])}"><link rel="canonical" href="{canonical}"><link rel="icon" type="image/png" href="/favicon.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="../../styles.css"></head><body class="homepage news-page"><div id="site-header"></div><main id="main-content"><article class="container news-article"><a class="news-back" href="../index.html">← All news</a><p class="section-label">{html.escape(item['category'])}</p><h1>{html.escape(title)}</h1><p class="news-byline">{html.escape(item['source'])} · {html.escape(item['published_at'][:10])}</p><p class="news-lead">{html.escape(excerpt)}</p>{body}<p class="news-source-link">Original reporting: <a href="{html.escape(item['url'], quote=True)}" target="_blank" rel="noopener noreferrer">{html.escape(item['source'])}</a></p></article></main><script src="../../nav.js"></script></body></html>'''
    path.write_text(page, encoding='utf-8')
    item['blog_url'] = f"articles/{path.name}"

def main() -> None:
    fresh = []
    for source, url in RSS_SOURCES:
        try:
            fresh.extend(parse_feed(source, url))
        except Exception as error:
            print(f"Could not fetch {source}: {error}")
    seen, unique = set(), []
    for item in sorted(fresh + load_existing(), key=lambda row: row.get('published_at', ''), reverse=True):
        fingerprint = re.sub(r"[^a-z0-9]", "", item.get('title', '').lower())[:110]
        if item['id'] in seen or fingerprint in seen or not is_relevant(item):
            continue
        seen.update((item['id'], fingerprint)); unique.append(item)
        if len(unique) >= MAX_ITEMS:
            break
    for item in unique[:5]:
        if not item.get('blog_url'):
            article = gemini_article(item)
            if article:
                write_article(item, article)
                time.sleep(1)
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    DATA_FILE.write_text(json.dumps({"generated_at": datetime.now(timezone.utc).isoformat(), "items": unique}, ensure_ascii=False, indent=2) + "\n", encoding='utf-8')
    print(f"Published {len(unique)} feed items.")

if __name__ == '__main__':
    main()

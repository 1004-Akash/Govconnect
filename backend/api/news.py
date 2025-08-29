import requests
from fastapi import APIRouter, Response, Query
import feedparser
from db import get_connection, insert_news
from reactions import add_reaction
from datetime import datetime
from urllib.parse import urlparse
import re
from bs4 import BeautifulSoup

router = APIRouter()

RSS_SOURCES = [
    ("PIB", "General", "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1"),
    ("Economic Times", "Policy", "https://government.economictimes.indiatimes.com/rss/policy"),
    ("Economic Times", "Governance", "https://government.economictimes.indiatimes.com/rss/governance"),
    ("Economic Times", "Technology", "https://government.economictimes.indiatimes.com/rss/technology"),
    ("Economic Times", "Digital India", "https://government.economictimes.indiatimes.com/rss/digital-india"),
    ("Economic Times", "Economy", "https://government.economictimes.indiatimes.com/rss/economy"),
]

DEFAULT_HEADERS = {"User-Agent": "Mozilla/5.0"}

IMG_TAG_REGEX = re.compile(r'<img[^>]+src=["\']([^"\']+)["\']', re.IGNORECASE)

@router.get("/news/proxy")
def get_news_proxy():
    # Keep existing proxy for PIB for debugging
    url = RSS_SOURCES[0][2]
    r = requests.get(url, headers=DEFAULT_HEADERS)
    return Response(content=r.text, media_type="application/xml", headers={"Access-Control-Allow-Origin": "*"})


def _scrape_image_from_page(url: str) -> str | None:
    try:
        r = requests.get(url, headers=DEFAULT_HEADERS, timeout=8)
        if r.status_code != 200:
            return None
        soup = BeautifulSoup(r.text, "html.parser")
        # Prefer Open Graph image
        og = soup.find("meta", property="og:image")
        if og and og.get("content"):
            return og.get("content")
        # Try twitter image
        tw = soup.find("meta", attrs={"name": "twitter:image"})
        if tw and tw.get("content"):
            return tw.get("content")
        # Fallback: first <img>
        img = soup.find("img")
        if img and img.get("src"):
            return img.get("src")
    except Exception:
        return None
    return None


def _extract_image_quick(entry):
    # Lightweight, does not scrape article page
    media_content = getattr(entry, 'media_content', None)
    if isinstance(media_content, list) and media_content:
        url = media_content[0].get('url')
        if url:
            return url
    links = getattr(entry, 'links', []) or []
    for l in links:
        if l.get('rel') == 'enclosure' and l.get('type', '').startswith('image'):
            if l.get('href'):
                return l['href']
    image = getattr(entry, 'image', None)
    if isinstance(image, dict) and image.get('href'):
        return image['href']
    summary = getattr(entry, 'summary', '') or ''
    m = IMG_TAG_REGEX.search(summary)
    if m:
        return m.group(1)
    return None

@router.get("/news/json")
def get_news_json(limit: int = 60):
    # Do NOT scrape here to keep response fast.
    items = []
    for source_name, category, url in RSS_SOURCES:
        try:
            r = requests.get(url, headers=DEFAULT_HEADERS, timeout=10)
            feed = feedparser.parse(r.text)
            for e in feed.entries:
                published = getattr(e, "published", "") or getattr(e, "updated", "")
                published_parsed = getattr(e, "published_parsed", None) or getattr(e, "updated_parsed", None)
                if published_parsed:
                    try:
                        iso_date = datetime(*published_parsed[:6]).isoformat()
                        ts = datetime(*published_parsed[:6]).timestamp()
                    except Exception:
                        iso_date = published
                        ts = 0
                else:
                    iso_date = published
                    ts = 0
                items.append({
                    "title": getattr(e, "title", "No Title"),
                    "link": getattr(e, "link", "#"),
                    "description": getattr(e, "summary", ""),
                    "pub_date": iso_date,
                    "source": source_name,
                    "category": category,
                    "domain": urlparse(getattr(e, "link", "")).netloc,
                    "image_url": _extract_image_quick(e),  # may be None, frontend will lazy load
                    "_ts": ts,
                })
        except Exception:
            continue
    items.sort(key=lambda x: x.get("_ts", 0), reverse=True)
    trimmed = [{k: v for k, v in it.items() if k != "_ts"} for it in items[:limit]]
    return {"items": trimmed}

@router.get("/news/image")
def get_news_image(url: str = Query(..., description="Article URL to scrape image from")):
    img = _scrape_image_from_page(url)
    return {"image_url": img or "https://via.placeholder.com/300x180?text=News"}

@router.get("/news/")
def get_news():
    with get_connection() as conn:
        c = conn.cursor()
        c.execute('SELECT id, title, link, description, pub_date FROM news ORDER BY pub_date DESC')
        news = [
            {
                'id': row[0],
                'title': row[1],
                'link': row[2],
                'description': row[3],
                'pub_date': row[4],
            }
            for row in c.fetchall()
        ]
    return news

@router.post("/news/{news_id}/reaction/")
def post_reaction(news_id: int, user_id: str, reaction_type: str, comment_text: str = None):
    try:
        add_reaction(news_id, user_id, reaction_type, comment_text)
        return {"message": "Reaction added."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/news/{news_id}/reactions/")
def get_reactions(news_id: int):
    with get_connection() as conn:
        c = conn.cursor()
        c.execute('SELECT user_id, reaction_type, comment_text, sentiment, timestamp FROM reactions WHERE news_id=? ORDER BY timestamp DESC', (news_id,))
        reactions = [
            {
                'user_id': row[0],
                'reaction_type': row[1],
                'comment_text': row[2],
                'sentiment': row[3],
                'timestamp': row[4],
            }
            for row in c.fetchall()
        ]
    return reactions

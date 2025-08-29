import feedparser
from db import insert_news
from config import RSS_URL, KEYWORDS

def fetch_news():
    feed = feedparser.parse(RSS_URL)
    new_items = []
    for entry in feed.entries:
        title = entry.title
        link = entry.link
        description = entry.get('description', '')
        pub_date = entry.get('published', '')
        if any(kw.lower() in (title + description).lower() for kw in KEYWORDS):
            news_item = {
                'title': title,
                'link': link,
                'description': description,
                'pub_date': pub_date
            }
            if insert_news(news_item):
                new_items.append(news_item)
    return new_items

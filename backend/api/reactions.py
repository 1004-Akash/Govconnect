from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
from mongo import get_db
from bson import ObjectId
import os
import re
from nltk.sentiment import SentimentIntensityAnalyzer
from ml_sentiment import analyze_sentiment as hf_analyze

router = APIRouter()

_sia = SentimentIntensityAnalyzer()
_USE_HF = os.getenv("USE_HF_SENTIMENT", "1") == "1"

STOPWORDS = set("""
a an the and or of to in is are was were be been being for on with as by at from this that those these it its themselves himself herself ourselves yourself yourselves i you he she they we me my mine your yours his her hers their theirs our ours not no do does did doing done just over under above below up down out very more most less least few many much into about after before between through because while during both each other such than then so too only own same can will would should could might must""".split())


def analyze_sentiment(comment: str) -> str:
    if not comment or not comment.strip():
        return "neutral"
    if _USE_HF:
        label = hf_analyze(comment)
        if label in ("positive", "negative", "neutral"):
            return label
    scores = _sia.polarity_scores(comment)
    compound = scores.get("compound", 0.0)
    if compound >= 0.05:
        return "positive"
    if compound <= -0.05:
        return "negative"
    return "neutral"

class ReactionIn(BaseModel):
    news_link: str
    user_id: str
    reaction_type: str = Field(pattern="^(like|share|comment)$")
    comment_text: str | None = None
    emoji: str | None = None  # store which emoji user clicked for like

@router.post("/reactions")
def post_reaction(body: ReactionIn):
    db = get_db()
    doc = {
        "news_link": body.news_link,
        "user_id": body.user_id,
        "reaction_type": body.reaction_type,
        "comment_text": body.comment_text,
        "emoji": body.emoji if body.reaction_type == "like" else None,
        "sentiment": analyze_sentiment(body.comment_text) if body.reaction_type == "comment" and body.comment_text else None,
        "timestamp": datetime.utcnow(),
    }
    result = db.reactions.insert_one(doc)
    return {"message": "reaction stored", "id": str(result.inserted_id)}

@router.get("/reactions/stats")
def get_reaction_stats(news_link: str):
    db = get_db()
    pipeline = [
        {"$match": {"news_link": news_link}},
        {"$group": {
            "_id": "$reaction_type",
            "count": {"$sum": 1}
        }}
    ]
    counts = {d["_id"]: d["count"] for d in db.reactions.aggregate(pipeline)}
    sentiment_pipeline = [
        {"$match": {"news_link": news_link, "reaction_type": "comment", "sentiment": {"$ne": None}}},
        {"$group": {"_id": "$sentiment", "count": {"$sum": 1}}}
    ]
    sentiments = {d["_id"]: d["count"] for d in db.reactions.aggregate(sentiment_pipeline)}
    # Optional: emoji breakdown
    emoji_pipeline = [
        {"$match": {"news_link": news_link, "reaction_type": "like", "emoji": {"$ne": None}}},
        {"$group": {"_id": "$emoji", "count": {"$sum": 1}}}
    ]
    emoji_counts = {d["_id"]: d["count"] for d in db.reactions.aggregate(emoji_pipeline)}
    return {
        "likes": counts.get("like", 0),
        "shares": counts.get("share", 0),
        "comments": counts.get("comment", 0),
        "sentiments": {
            "positive": sentiments.get("positive", 0),
            "negative": sentiments.get("negative", 0),
            "neutral": sentiments.get("neutral", 0)
        },
        "emoji_counts": emoji_counts,
    }

@router.get("/reactions/comments")
def list_comments(news_link: str, limit: int = 10):
    db = get_db()
    cur = db.reactions.find({"news_link": news_link, "reaction_type": "comment"}).sort("timestamp", -1).limit(limit)
    items = []
    for d in cur:
        items.append({
            "id": str(d.get("_id")),
            "user_id": d.get("user_id"),
            "text": d.get("comment_text"),
            "sentiment": d.get("sentiment"),
            "timestamp": d.get("timestamp").isoformat() if d.get("timestamp") else None,
        })
    return {"items": items}

@router.get("/reactions/overview")
def reactions_overview(limit: int = 10):
    db = get_db()
    total_pipeline = [
        {"$group": {"_id": "$reaction_type", "count": {"$sum": 1}}}
    ]
    totals = {d["_id"]: d["count"] for d in db.reactions.aggregate(total_pipeline)}

    sentiments_pipeline = [
        {"$match": {"reaction_type": "comment", "sentiment": {"$ne": None}}},
        {"$group": {"_id": "$sentiment", "count": {"$sum": 1}}}
    ]
    sentiments = {d["_id"]: d["count"] for d in db.reactions.aggregate(sentiments_pipeline)}

    emoji_pipeline = [
        {"$match": {"reaction_type": "like", "emoji": {"$ne": None}}},
        {"$group": {"_id": "$emoji", "count": {"$sum": 1}}}
    ]
    emoji_counts = {d["_id"]: d["count"] for d in db.reactions.aggregate(emoji_pipeline)}

    top_news_pipeline = [
        {"$group": {
            "_id": "$news_link",
            "likes": {"$sum": {"$cond": [{"$eq": ["$reaction_type", "like"]}, 1, 0]}},
            "shares": {"$sum": {"$cond": [{"$eq": ["$reaction_type", "share"]}, 1, 0]}},
            "comments": {"$sum": {"$cond": [{"$eq": ["$reaction_type", "comment"]}, 1, 0]}}
        }},
        {"$project": {"news_link": "$_id", "_id": 0, "likes": 1, "shares": 1, "comments": 1, "score": {"$add": ["$likes", {"$multiply": [2, "$comments"]}, {"$multiply": [0.5, "$shares"]}]}}},
        {"$sort": {"score": -1}},
        {"$limit": limit}
    ]
    top_news = list(db.reactions.aggregate(top_news_pipeline))

    return {
        "totals": {
            "likes": totals.get("like", 0),
            "shares": totals.get("share", 0),
            "comments": totals.get("comment", 0)
        },
        "sentiments": {
            "positive": sentiments.get("positive", 0),
            "negative": sentiments.get("negative", 0),
            "neutral": sentiments.get("neutral", 0)
        },
        "emoji_counts": emoji_counts,
        "top_news": top_news,
    }

@router.get("/reactions/timeseries")
def reactions_timeseries(days: int = 30):
    db = get_db()
    since = datetime.utcnow() - timedelta(days=days)
    pipeline = [
        {"$match": {"reaction_type": "comment", "timestamp": {"$gte": since}, "sentiment": {"$ne": None}}},
        {"$project": {"sentiment": 1, "day": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}}}},
        {"$group": {"_id": {"day": "$day", "sentiment": "$sentiment"}, "count": {"$sum": 1}}},
        {"$sort": {"_id.day": 1}}
    ]
    data = list(db.reactions.aggregate(pipeline))
    series = {}
    for d in data:
        day = d["_id"]["day"]
        sent = d["_id"]["sentiment"]
        series.setdefault(day, {"day": day, "positive": 0, "neutral": 0, "negative": 0})
        if sent in ("positive", "neutral", "negative"):
            series[day][sent] += d["count"]
    return {"items": list(series.values())}

@router.get("/reactions/top_policies")
def reactions_top_policies(limit: int = 5):
    db = get_db()
    positive_pipeline = [
        {"$match": {"reaction_type": "comment", "sentiment": "positive"}},
        {"$group": {"_id": "$news_link", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": limit}
    ]
    negative_pipeline = [
        {"$match": {"reaction_type": "comment", "sentiment": "negative"}},
        {"$group": {"_id": "$news_link", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": limit}
    ]
    top_pos = [
        {"news_link": d["_id"], "comments": d["count"]}
        for d in db.reactions.aggregate(positive_pipeline)
    ]
    top_neg = [
        {"news_link": d["_id"], "comments": d["count"]}
        for d in db.reactions.aggregate(negative_pipeline)
    ]
    return {"top_positive": top_pos, "top_negative": top_neg}

@router.get("/reactions/trending_tags")
def reactions_trending_tags(limit: int = 20, window_days: int = 30, sentiment: str = "all"):
    db = get_db()
    since = datetime.utcnow() - timedelta(days=window_days)
    match_filter = {"reaction_type": "comment", "timestamp": {"$gte": since}}
    if sentiment in ("positive", "negative", "neutral"):
        match_filter["sentiment"] = sentiment
    cur = db.reactions.find(match_filter).sort("timestamp", -1).limit(2000)
    counts = {}
    for d in cur:
        text = (d.get("comment_text") or "").lower()
        text = re.sub(r"https?://\S+", " ", text)
        for w in re.findall(r"[a-zA-Z]{3,}", text):
            if w in STOPWORDS:
                continue
            counts[w] = counts.get(w, 0) + 1
    items = sorted(counts.items(), key=lambda x: x[1], reverse=True)[:limit]
    return {"items": [{"tag": k, "count": v} for k, v in items]}

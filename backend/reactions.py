from db import get_connection
from ml_sentiment import analyze_sentiment
from datetime import datetime


def add_reaction(news_id, user_id, reaction_type, comment_text=None):
    sentiment = None
    if reaction_type == 'comment' and comment_text:
        sentiment = analyze_sentiment(comment_text)
    timestamp = datetime.utcnow().isoformat()
    with get_connection() as conn:
        c = conn.cursor()
        c.execute('''
            INSERT INTO reactions (news_id, user_id, reaction_type, comment_text, timestamp, sentiment)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (news_id, user_id, reaction_type, comment_text, timestamp, sentiment))
        conn.commit()

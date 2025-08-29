from db import get_connection, get_all_news

def generate_admin_report():
    with get_connection() as conn:
        c = conn.cursor()
        news_items = get_all_news()
        print('\n--- Admin Dashboard ---')
        for news_id, title in news_items:
            print(f'\nTitle: {title}')
            c.execute('SELECT COUNT(*) FROM reactions WHERE news_id=? AND reaction_type="like"', (news_id,))
            likes = c.fetchone()[0]
            c.execute('SELECT COUNT(*) FROM reactions WHERE news_id=? AND reaction_type="share"', (news_id,))
            shares = c.fetchone()[0]
            c.execute('SELECT COUNT(*) FROM reactions WHERE news_id=? AND reaction_type="comment"', (news_id,))
            comments = c.fetchone()[0]
            c.execute('SELECT sentiment, COUNT(*) FROM reactions WHERE news_id=? AND reaction_type="comment" GROUP BY sentiment', (news_id,))
            sentiments = dict(c.fetchall())
            pos = sentiments.get('positive', 0)
            neg = sentiments.get('negative', 0)
            neu = sentiments.get('neutral', 0)
            print(f'  Likes: {likes}, Shares: {shares}, Comments: {comments}')
            print(f'  Sentiment - Positive: {pos}, Negative: {neg}, Neutral: {neu}')

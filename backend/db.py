import sqlite3
from contextlib import closing

DB_PATH = 'govconnect.db'

def get_connection():
    return sqlite3.connect(DB_PATH)

def init_db():
    with closing(get_connection()) as conn:
        c = conn.cursor()
        c.execute('''
            CREATE TABLE IF NOT EXISTS news (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                link TEXT,
                description TEXT,
                pub_date TEXT,
                UNIQUE(title, pub_date)
            )
        ''')
        c.execute('''
            CREATE TABLE IF NOT EXISTS reactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                news_id INTEGER,
                user_id TEXT,
                reaction_type TEXT CHECK(reaction_type IN ('like', 'share', 'comment')),
                comment_text TEXT,
                timestamp TEXT,
                sentiment TEXT CHECK(sentiment IN ('positive', 'negative', 'neutral')),
                FOREIGN KEY(news_id) REFERENCES news(id)
            )
        ''')
        conn.commit()

def insert_news(news_item):
    with closing(get_connection()) as conn:
        c = conn.cursor()
        try:
            c.execute('''
                INSERT INTO news (title, link, description, pub_date)
                VALUES (?, ?, ?, ?)
            ''', (news_item['title'], news_item['link'], news_item['description'], news_item['pub_date']))
            conn.commit()
            return True
        except sqlite3.IntegrityError:
            return False

def get_all_news():
    with closing(get_connection()) as conn:
        c = conn.cursor()
        c.execute('SELECT id, title FROM news')
        return c.fetchall()

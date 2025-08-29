import React, { useEffect, useState } from 'react';

const NEWS_JSON_URL = 'http://localhost:8000/api/news/json';
const IMAGE_API_URL = 'http://localhost:8000/api/news/image';
const REACTIONS_API_URL = 'http://localhost:8000/api/reactions';
const REACTION_STATS_URL = 'http://localhost:8000/api/reactions/stats';
const COMMENTS_URL = 'http://localhost:8000/api/reactions/comments';

const EMOJI_SET = ['👍', '❤️', '😂', '😮', '😢', '😡'];

const News = () => {
  const [news, setNews] = useState([]);
  const [stats, setStats] = useState({});
  const [comments, setComments] = useState({});
  const [commentInput, setCommentInput] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pickerOpen, setPickerOpen] = useState({});

  useEffect(() => {
    fetch(NEWS_JSON_URL)
      .then(res => res.json())
      .then(data => {
        const items = data.items || [];
        setNews(items);
        items.forEach((it, idx) => {
          if (!it.image_url && it.link) {
            fetch(`${IMAGE_API_URL}?url=${encodeURIComponent(it.link)}`)
              .then(r => r.json())
              .then(img => setNews(prev => { const copy = [...prev]; if (copy[idx]) copy[idx] = { ...copy[idx], image_url: img.image_url }; return copy; }));
          }
          fetch(`${REACTION_STATS_URL}?news_link=${encodeURIComponent(it.link)}`)
            .then(r => r.json())
            .then(s => setStats(prev => ({ ...prev, [it.link]: s })))
            .catch(() => {});
          fetch(`${COMMENTS_URL}?news_link=${encodeURIComponent(it.link)}&limit=5`)
            .then(r => r.json())
            .then(c => setComments(prev => ({ ...prev, [it.link]: c.items || [] })))
            .catch(() => {});
        });
      })
      .catch(err => { setError('Failed to fetch news.'); console.error(err); })
      .finally(() => setLoading(false));
  }, []);

  const sendReaction = (link, userId, type, comment_text, emoji) => {
    return fetch(REACTIONS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ news_link: link, user_id: userId, reaction_type: type, comment_text, emoji })
    }).then(r => r.json());
  };

  const handleEmojiLike = (it, emoji, idx) => {
    sendReaction(it.link, 'web-user', 'like', undefined, emoji).then(() => {
      fetch(`${REACTION_STATS_URL}?news_link=${encodeURIComponent(it.link)}`)
        .then(r => r.json())
        .then(s => setStats(prev => ({ ...prev, [it.link]: s })))
        .catch(() => {});
      setPickerOpen(prev => ({ ...prev, [idx]: false }));
    });
  };

  const handleLikeIconClick = (idx) => {
    setPickerOpen(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleShare = async (it) => {
    const shareData = { title: it.title, text: it.title, url: it.link };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(it.link);
        alert('Link copied to clipboard');
      }
      sendReaction(it.link, 'web-user', 'share');
      fetch(`${REACTION_STATS_URL}?news_link=${encodeURIComponent(it.link)}`)
        .then(r => r.json())
        .then(s => setStats(prev => ({ ...prev, [it.link]: s })))
        .catch(() => {});
    } catch (_) {}
  };

  const handleComment = (idx, it) => {
    const text = commentInput[idx];
    if (!text) return;
    sendReaction(it.link, 'web-user', 'comment', text).then(() => {
      setCommentInput(prev => ({ ...prev, [idx]: '' }));
      fetch(`${REACTION_STATS_URL}?news_link=${encodeURIComponent(it.link)}`)
        .then(r => r.json())
        .then(s => setStats(prev => ({ ...prev, [it.link]: s })))
        .catch(() => {});
      fetch(`${COMMENTS_URL}?news_link=${encodeURIComponent(it.link)}&limit=5`)
        .then(r => r.json())
        .then(c => setComments(prev => ({ ...prev, [it.link]: c.items || [] })))
        .catch(() => {});
    });
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h2>Latest Government News</h2>
      {loading && <div>Loading news...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {!loading && news.length === 0 && !error && <div>No news found. Try refreshing the page.</div>}
      {news.map((it, idx) => (
        <div key={idx} style={{ display: 'flex', gap: 12, border: '1px solid #ddd', borderRadius: 8, padding: 16, background: '#fff' }}>
          {it.image_url ? (
            <a href={it.link} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0 }}>
              <img src={it.image_url} alt="thumb" style={{ width: 160, height: 100, objectFit: 'cover', borderRadius: 6 }} />
            </a>
          ) : (
            <div style={{ width: 160, height: 100, background: '#eee', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>Loading...</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
            <h3 style={{ margin: 0 }}><a href={it.link} target="_blank" rel="noopener noreferrer">{it.title}</a></h3>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {it.pub_date && <small style={{ color: '#666' }}>{it.pub_date}</small>}
              <small style={{ color: '#1976d2', fontWeight: 600 }}>{it.source}</small>
              <small style={{ color: '#2e7d32' }}>{it.category}</small>
            </div>
            {it.description && <p style={{ margin: 0 }}>{it.description}</p>}

            <div style={{ marginTop: 8, display: 'flex', gap: 16, alignItems: 'center' }}>
              <span title="React" onClick={() => handleLikeIconClick(idx)} style={{ cursor: 'pointer', fontSize: 20 }}>👍</span>
              <span style={{ color: '#555' }}>{stats[it.link]?.likes || 0}</span>
              <span title="Share" onClick={() => handleShare(it)} style={{ cursor: 'pointer', fontSize: 20 }}>🔗</span>
              <span style={{ color: '#555' }}>{stats[it.link]?.shares || 0}</span>
            </div>

            {pickerOpen[idx] && (
              <div style={{ display: 'flex', gap: 8, padding: 6, background: '#f7f7f7', borderRadius: 8, width: 'fit-content' }}>
                {EMOJI_SET.map(em => (
                  <span key={em} onClick={() => handleEmojiLike(it, em, idx)} style={{ cursor: 'pointer', fontSize: 20 }}>{em}</span>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentInput[idx] || ''}
                onChange={e => setCommentInput(prev => ({ ...prev, [idx]: e.target.value }))}
                style={{ flex: 1 }}
              />
              <button onClick={() => handleComment(idx, it)}>Comment</button>
            </div>

            {comments[it.link]?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {comments[it.link].map((c, i) => (
                  <div key={i} style={{ background: '#f7f7f7', borderRadius: 6, padding: 8 }}>
                    <div style={{ fontSize: 13, color: '#333' }}>{c.text}</div>
                  </div>
                ))}
              </div>
            )}

            {stats[it.link]?.emoji_counts && (
              <div style={{ display: 'flex', gap: 12, color: '#555', flexWrap: 'wrap' }}>
                {EMOJI_SET.map(em => (
                  <span key={em}>{em} {stats[it.link]?.emoji_counts?.[em] || 0}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default News;

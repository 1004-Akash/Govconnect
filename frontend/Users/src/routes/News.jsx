    import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Chip from '../components/Chip';
import { timeAgo, decodeEntities } from '../utils/helpers';
import { NewsEmptyState } from '../components/EmptyState';
import { NewsCardSkeleton } from '../components/Skeleton';

const BACKEND_URL = 'http://localhost:8000';

// Use the working endpoints from your backend
const NEWS_JSON_URL = `${BACKEND_URL}/api/news/json`;
const IMAGE_API_URL = `${BACKEND_URL}/api/news/image`;
const REACTIONS_API_URL = `${BACKEND_URL}/api/reactions`;
const REACTION_STATS_URL = `${BACKEND_URL}/api/reactions/stats`;
const COMMENTS_URL = `${BACKEND_URL}/api/reactions/comments`;

export default function News() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const [comments, setComments] = useState({});
  const [commentInput, setCommentInput] = useState({});
  const [pickerOpen, setPickerOpen] = useState({});

  // Emoji reactions
  const EMOJI_SET = ['👍', '❤️', '😂', '😮', '😢', '🤣'];

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(NEWS_JSON_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const items = data.items || [];
      
      if (items.length === 0) {
        setError('No news available at the moment.');
        setLoading(false);
        return;
      }
      
      setNews(items);
      
      // Fetch additional data for each news item
      items.forEach(async (item, idx) => {
        // Fetch image if not available
        if (!item.image_url && item.link) {
          try {
            const imgResponse = await fetch(`${IMAGE_API_URL}?url=${encodeURIComponent(item.link)}`);
            if (imgResponse.ok) {
              const imgData = await imgResponse.json();
              setNews(prev => {
                const copy = [...prev];
                if (copy[idx]) copy[idx] = { ...copy[idx], image_url: imgData.image_url };
                return copy;
              });
            }
          } catch (err) {
            console.error('Failed to fetch image:', err);
          }
        }

        // Fetch reaction stats using news_link
        try {
          const statsResponse = await fetch(`${REACTION_STATS_URL}?news_link=${encodeURIComponent(item.link)}`);
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            setStats(prev => ({ ...prev, [item.link]: statsData }));
          }
        } catch (err) {
          console.error('Failed to fetch stats:', err);
        }

        // Fetch comments using news_link
        try {
          const commentsResponse = await fetch(`${COMMENTS_URL}?news_link=${encodeURIComponent(item.link)}&limit=5`);
          if (commentsResponse.ok) {
            const commentsData = await commentsResponse.json();
            setComments(prev => ({ ...prev, [item.link]: commentsData.items || [] }));
          }
        } catch (err) {
          console.error('Failed to fetch comments:', err);
        }
      });
    } catch (err) {
      console.error('Failed to fetch news:', err);
      setError('Failed to fetch news. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const sendReaction = async (link, userId, type, comment_text, emoji) => {
    try {
      console.log('Sending reaction:', { link, userId, type, comment_text, emoji });
      
      // Use the correct endpoint: /api/reactions
      const response = await fetch(REACTIONS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          news_link: link,  // Use news_link, not news_id
          user_id: userId, 
          reaction_type: type, 
          comment_text, 
          emoji 
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Reaction failed:', errorData);
        throw new Error(`Failed to send reaction: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Reaction sent successfully:', result);
      return result;
    } catch (err) {
      console.error('Failed to send reaction:', err);
      throw err;
    }
  };

  const handleEmojiLike = async (item, emoji, idx) => {
    try {
      // Use item.link, not item.id
      await sendReaction(item.link, 'web-user', 'like', undefined, emoji);
      
      // Refresh stats using news_link
      const statsResponse = await fetch(`${REACTION_STATS_URL}?news_link=${encodeURIComponent(item.link)}`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(prev => ({ ...prev, [item.link]: statsData }));
      }
      
      setPickerOpen(prev => ({ ...prev, [idx]: false }));
    } catch (err) {
      console.error('Failed to send emoji reaction:', err);
    }
  };

  const handleLikeIconClick = (idx) => {
    setPickerOpen(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleShare = async (item) => {
    try {
      const shareData = { title: item.title, text: item.title, url: item.link };
      
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(item.link);
        alert('Link copied to clipboard');
      }
      
      // Send share reaction using item.link
      await sendReaction(item.link, 'web-user', 'share');
      
      // Refresh stats using news_link
      const statsResponse = await fetch(`${REACTION_STATS_URL}?news_link=${encodeURIComponent(item.link)}`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(prev => ({ ...prev, [item.link]: statsData }));
      }
    } catch (err) {
      console.error('Failed to share:', err);
    }
  };

  const handleComment = async (idx, item) => {
    const text = commentInput[idx];
    if (!text) return;
    
    try {
      // Use item.link, not item.id
      await sendReaction(item.link, 'web-user', 'comment', text);
      
      setCommentInput(prev => ({ ...prev, [idx]: '' }));
      
      // Refresh stats and comments using news_link
      const statsResponse = await fetch(`${REACTION_STATS_URL}?news_link=${encodeURIComponent(item.link)}`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(prev => ({ ...prev, [item.link]: statsData }));
      }
      
      const commentsResponse = await fetch(`${COMMENTS_URL}?news_link=${encodeURIComponent(item.link)}&limit=5`);
      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json();
        setComments(prev => ({ ...prev, [item.link]: commentsData.items || [] }));
      }
    } catch (err) {
      console.error('Failed to send comment:', err);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="grid gap-6 md:max-w-2xl lg:max-w-4xl mx-auto">
          {[1, 2, 3].map(i => (
            <NewsCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">Error loading news: {error}</p>
          <button 
            onClick={fetchNews}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6">
        <NewsEmptyState onRefresh={fetchNews} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Latest Government News
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Stay updated with the latest government policies, schemes, and civic initiatives
          </p>
        </div>

        <div className="grid gap-6 md:max-w-2xl lg:max-w-4xl mx-auto">
          {news.map((item, idx) => (
            <Card key={idx} className="p-0 overflow-hidden">
              {/* Media Section */}
              <div className="relative aspect-[16/9] md:aspect-[21/9] overflow-hidden">
                <img 
                  src={item.image_url || 'https://via.placeholder.com/800x450?text=News'} 
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                
                {/* Title */}
                <h2 className="absolute left-4 right-4 bottom-16 md:bottom-20 text-white text-lg md:text-2xl font-semibold drop-shadow">
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-white hover:text-emerald-300 transition-colors">
                    {decodeEntities(item.title)}
                  </a>
                </h2>
                
                {/* Meta Information */}
                <div className="absolute left-4 bottom-6 flex items-center gap-2 text-white/90 text-xs">
                  <Chip variant="glass" size="sm">{item.source}</Chip>
                  <Chip variant="primary" size="sm">{item.category}</Chip>
                  <span className="text-white/80">{timeAgo(item.pub_date)}</span>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-4 md:p-6 text-slate-700 dark:text-slate-200">
                <p className="line-clamp-3 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Glassy Comment Bar */}
              <div className="mx-4 -mt-5 mb-4 rounded-full border bg-white/60 dark:bg-white/10 backdrop-blur px-4 py-2 flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  className="flex-1 input-round bg-transparent placeholder:text-slate-400"
                  value={commentInput[idx] || ''}
                  onChange={(e) => setCommentInput(prev => ({ ...prev, [idx]: e.target.value }))}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      handleComment(idx, item);
                    }
                  }}
                />
                <button 
                  onClick={() => handleComment(idx, item)}
                  className="text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {/* Reactions Row */}
              <div className="px-4 pb-4 flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => handleLikeIconClick(idx)}
                  className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 aria-pressed:bg-emerald-50 transition-colors"
                  aria-pressed="false"
                >
                  👍 {stats[item.link]?.likes || 0}
                </button>
                <button
                  onClick={() => handleShare(item)}
                  className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  🔗 {stats[item.link]?.shares || 0}
                </button>
                <button
                  className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  💬 {stats[item.link]?.comments || 0}
                </button>
              </div>

              {/* Emoji Picker */}
              {pickerOpen[idx] && (
                <div className="px-4 pb-4">
                  <div className="flex gap-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
                    {EMOJI_SET.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => handleEmojiLike(item, emoji, idx)}
                        className="text-2xl hover:scale-110 transition-transform cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments Display */}
              {comments[item.link]?.length > 0 && (
                <div className="px-4 pb-4">
                  <div className="space-y-2">
                    {comments[item.link].map((comment, i) => (
                      <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
                        <div className="text-sm text-slate-700 dark:text-slate-300">
                          {comment.comment_text}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Emoji Counts */}
              {stats[item.link]?.emoji_counts && Object.keys(stats[item.link].emoji_counts).length > 0 && (
                <div className="px-4 pb-4">
                  <div className="flex gap-3 text-sm text-slate-600 dark:text-slate-400 flex-wrap">
                    {EMOJI_SET.map(emoji => (
                      <span key={emoji}>
                        {emoji} {stats[item.link]?.emoji_counts?.[emoji] || 0}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}

          {/* Load More Button */}
          <div className="text-center mt-8">
            <button className="btn-primary" onClick={fetchNews}>
              Refresh News
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

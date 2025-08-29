import React, { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
  BarChart, Bar, ResponsiveContainer
} from "recharts";
import "./Sentiment.css";

const API_BASE = "http://localhost:8000/api";

const SENTIMENT_COLORS = {
  positive: "#22c55e",
  neutral: "#9ca3af",
  negative: "#ef4444",
};

function StatCard({ label, value, accent }) {
  return (
    <div className="stat-card">
      <div className={`stat-card-icon ${accent}`}>{label.slice(0, 1)}</div>
      <div className="stat-card-text">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
      </div>
    </div>
  );
}

function Tag({ text, tone = "blue" }) {
  return <span className={`tag tag-${tone}`}>{text}</span>;
}

export default function Sentiment() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [timeseries, setTimeseries] = useState([]);
  const [topPolicies, setTopPolicies] = useState({ top_positive: [], top_negative: [] });
  const [tags, setTags] = useState([]);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE}/reactions/overview`).then(r => r.json()),
      fetch(`${API_BASE}/reactions/timeseries?days=30`).then(r => r.json()),
      fetch(`${API_BASE}/reactions/top_policies?limit=8`).then(r => r.json()),
      fetch(`${API_BASE}/reactions/trending_tags?limit=20&window_days=30`).then(r => r.json()),
    ])
      .then(([ov, ts, tp, tg]) => {
        setOverview(ov);
        setTimeseries(ts.items || []);
        setTopPolicies(tp);
        setTags(tg.items || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  if (loading) return <div className="sentiment-loading">Loading Sentiment Analysis...</div>;
  if (!overview) return (
    <div className="sentiment-empty">
      <div>No insights yet.</div>
      <button onClick={fetchAll} className="refresh-btn">Refresh</button>
    </div>
  );

  const pieData = [
    { name: "Negative", value: overview.sentiments?.negative || 0, color: SENTIMENT_COLORS.negative },
    { name: "Neutral", value: overview.sentiments?.neutral || 0, color: SENTIMENT_COLORS.neutral },
    { name: "Positive", value: overview.sentiments?.positive || 0, color: SENTIMENT_COLORS.positive },
  ];

  const engagement = (overview.totals?.likes || 0) + (overview.totals?.comments || 0) + (overview.totals?.shares || 0);
  const emotionData = Object.entries(overview.emoji_counts || {}).map(([k, v]) => ({ emotion: k, value: v }));

  return (
    <div className="sentiment-container">
      <div className="sentiment-header">
        <div>
          <h1 className="sentiment-title">Sentiment Insights</h1>
          <p className="sentiment-subtitle">Live analytics from likes, shares, and comments</p>
        </div>
        <button onClick={fetchAll} className="refresh-btn">Refresh Data</button>
      </div>

      <div className="stat-grid">
        <StatCard label="Likes" value={overview.totals?.likes || 0} accent="accent-green" />
        <StatCard label="Shares" value={overview.totals?.shares || 0} accent="accent-indigo" />
        <StatCard label="Engagement" value={engagement} accent="accent-amber" />
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <div className="chart-title">Sentiment Distribution</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={2}>
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <ReTooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card chart-span-2">
          <div className="chart-title">Sentiment Trend (30 days)</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={timeseries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <ReTooltip />
              <Legend />
              <Line type="monotone" dataKey="positive" stroke={SENTIMENT_COLORS.positive} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="neutral" stroke={SENTIMENT_COLORS.neutral} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="negative" stroke={SENTIMENT_COLORS.negative} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-title">Emoji / Emotion Breakdown</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={emotionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="emotion" />
            <YAxis />
            <ReTooltip />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="policy-grid">
        <div className="chart-card">
          <div className="chart-title">Top Positive Policies</div>
          <div className="policy-list">
            {topPolicies.top_positive.length === 0 && <div className="policy-empty">No data</div>}
            {topPolicies.top_positive.map((r, idx) => (
              <div key={idx} className="policy-item">
                <a className="policy-link" href={r.news_link} target="_blank" rel="noreferrer">{r.news_link}</a>
                <div className="policy-meta">
                  <Tag text="Positive" tone="green" />
                  <span className="policy-count">{r.comments}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-title">Top Negative Policies</div>
          <div className="policy-list">
            {topPolicies.top_negative.length === 0 && <div className="policy-empty">No data</div>}
            {topPolicies.top_negative.map((r, idx) => (
              <div key={idx} className="policy-item">
                <a className="policy-link" href={r.news_link} target="_blank" rel="noreferrer">{r.news_link}</a>
                <div className="policy-meta">
                  <Tag text="Negative" tone="red" />
                  <span className="policy-count">{r.comments}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-title">Trending Concerns</div>
        <div className="tag-list">
          {tags.length === 0 && <div className="policy-empty">No trends yet</div>}
          {tags.map((t, idx) => (
            <Tag key={idx} text={`${t.tag} (${t.count})`} tone={idx % 2 ? 'blue' : 'gray'} />
          ))}
        </div>
      </div>
    </div>
  );
}

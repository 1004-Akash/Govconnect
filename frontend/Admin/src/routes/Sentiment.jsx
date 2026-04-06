import React, { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
  BarChart, Bar, ResponsiveContainer
} from "recharts";
import { useNavigate } from "react-router-dom";
import '../AdminPortal.css';

const API_BASE = "http://localhost:8000/api";

const SENTIMENT_COLORS = {
  positive: "#10b981",
  neutral: "#94a3b8",
  negative: "#ef4444",
};

export default function Sentiment() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [timeseries, setTimeseries] = useState([]);

  const fetchAll = () => {
    setLoading(true);
    const apiCall = (p) => fetch(`${API_BASE}${p}`).then(r => r.json());
    Promise.all([
      apiCall('/reactions/overview'),
      apiCall('/reactions/timeseries?days=30'),
    ])
      .then(([ov, ts]) => {
        setOverview(ov);
        setTimeseries(ts.items || []);
      })
      .catch(err => console.error("Error fetching sentiment:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-[500px] w-full text-blue-600 font-bold">
        <span>Processing Sentiment Insights...</span>
    </div>
  );

  const pieData = [
    { name: "Negative", value: overview?.sentiments?.negative || 0, color: SENTIMENT_COLORS.negative },
    { name: "Neutral", value: overview?.sentiments?.neutral || 0, color: SENTIMENT_COLORS.neutral },
    { name: "Positive", value: overview?.sentiments?.positive || 0, color: SENTIMENT_COLORS.positive },
  ];

  return (
    <>
        <aside className="admin-sidebar" style={{ minWidth: '300px' }}>
            <h3>Navigation</h3>
            <nav>
                <button className="sidebar-btn" onClick={() => navigate('/')}>
                    <span className="icon">🏠</span> Dashboard Overview
                </button>
                <button className="sidebar-btn" onClick={() => navigate('/map')}>
                    <span className="icon">🗺️</span> Geo Intelligence
                </button>
                <button className="sidebar-btn active" onClick={() => navigate('/sentiment')}>
                    <span className="icon">🧠</span> Sentiment Insights
                </button>
                <button className="sidebar-btn" onClick={() => navigate('/chatbot')}>
                    <span className="icon">🤖</span> Doc Management
                </button>
            </nav>

            <div style={{ marginTop: '25px', padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Global Reaction Stats</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ color: '#475569', fontWeight: '500' }}>Likes:</span>
                        <span style={{ fontWeight: '700' }}>{overview?.totals?.likes || 0}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ color: '#475569', fontWeight: '500' }}>Engagement Index:</span>
                        <span style={{ fontWeight: '700' }}>{(overview?.totals?.likes || 0) + (overview?.totals?.comments || 0)}</span>
                    </div>
                </div>
            </div>
        </aside>

        <main className="admin-main">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
                <section className="admin-card">
                    <h3>Sentiment Polarity</h3>
                    <div style={{ height: '280px', width: '100%' }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={4}>
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <ReTooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                <section className="admin-card">
                    <h3>30-Day Trend</h3>
                    <div style={{ height: '280px', width: '100%' }}>
                        <ResponsiveContainer>
                            <LineChart data={timeseries}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="day" style={{ fontSize: '12px' }} />
                                <YAxis style={{ fontSize: '12px' }} />
                                <ReTooltip />
                                <Line type="monotone" dataKey="positive" stroke={SENTIMENT_COLORS.positive} strokeWidth={3} dot={false} />
                                <Line type="monotone" dataKey="negative" stroke={SENTIMENT_COLORS.negative} strokeWidth={3} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            </div>

            <section className="admin-card">
                <h3>Key Performance Insights</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', background: '#f8fafc', padding: '20px', borderRadius: '15px' }}>
                     <div>
                         <p style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Sentiment Index</p>
                         <p style={{ fontSize: '24px', fontWeight: '900', color: '#1a73e8' }}>78.4</p>
                     </div>
                     <div>
                         <p style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Stability</p>
                         <p style={{ fontSize: '24px', fontWeight: '900', color: '#10b981' }}>High</p>
                     </div>
                     <div>
                         <p style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Model Precision</p>
                         <p style={{ fontSize: '24px', fontWeight: '900', color: '#f59e0b' }}>94%</p>
                     </div>
                </div>
            </section>

             <section className="admin-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                <button className="admin-btn btn-yellow" onClick={fetchAll}>🔄 Refresh Stats</button>
                <button className="admin-btn btn-primary" onClick={() => navigate('/map')}>🗺️ Geo Hub</button>
                <button className="admin-btn btn-green" onClick={() => navigate('/')}>🏠 Dashboard</button>
            </section>
        </main>
    </>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../AdminPortal.css';

function Home() {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const stats = [
        { title: 'Total Reports', value: '1,247', icon: '📝', color: 'blue' },
        { title: 'Active Clusters', value: '23', icon: '📍', color: 'green' },
        { title: 'High Priority', value: '156', icon: '🚨', color: 'red' },
        { title: 'System Health', value: '98.4%', icon: '⚡', color: 'yellow' }
    ];

    const StatGrid = () => (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
            {stats.map((s, i) => (
                <div key={i} className="" style={{ padding: '20px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '24px', marginBottom: '10px' }}>{s.icon}</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#111' }}>{s.value}</div>
                    <div style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginTop: '5px' }}>{s.title}</div>
                </div>
            ))}
        </div>
    );

    return (
        <>
            <aside className="admin-sidebar shadow-md border border-slate-200/50">
                <h3>Control Hub</h3>
                <nav>
                    <button className="sidebar-btn active" onClick={() => navigate('/')}>
                       <span className="icon">🏠</span> Main Dashboard
                    </button>
                    <button className="sidebar-btn" onClick={() => navigate('/map')}>
                       <span className="icon">🗺️</span> Geo Intel
                    </button>
                    <button className="sidebar-btn" onClick={() => navigate('/sentiment')}>
                       <span className="icon">🧠</span> Sentiment AI
                    </button>
                    <button className="sidebar-btn" onClick={() => navigate('/chatbot')}>
                       <span className="icon">🤖</span> Doc Engine
                    </button>
                </nav>

                <div style={{ marginTop: '30px', padding: '15px', background: '#f1f5f9', borderRadius: '12px' }}>
                     <h4 style={{ fontSize: '10px', fontWeight: '900', color: '#475569', marginBottom: '10px', textTransform: 'uppercase' }}>Alert Center</h4>
                     <p style={{ fontSize: '12px', color: '#ef4444', fontWeight: '700' }}>⚠ 3 High Clusters Detected ⚠</p>
                </div>
            </aside>

            <main className="admin-main">
                <section className="admin-card">
                    <h3>Vital Indicators</h3>
                    <StatGrid />
                </section>
                
                <div className="grid md:grid-cols-2 gap-6">
                    <section className="admin-card">
                        <h3>Neural Engine Status</h3>
                        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px' }}>
                            <p style={{ fontSize: '13px', color: '#444' }}>
                                <strong>System Load:</strong> Optimal (12ms)<br/>
                                <strong>Last Sync:</strong> {currentTime.toLocaleTimeString()}<br/>
                                <strong>Database:</strong> Online
                            </p>
                        </div>
                    </section>

                    <section className="admin-card">
                        <h3>Quick Deployment</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <button className="admin-btn btn-primary" onClick={() => navigate('/chatbot')}>Submit Docs</button>
                            <button className="admin-btn btn-green" onClick={() => window.open(`${window.location.origin}/docs`)}>Check API</button>
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
}

export default Home;
import React, { useState, useEffect } from 'react';
import './Home.css';

function Home() {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        // Update time every second
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        // Set greeting based on time
        const hour = currentTime.getHours();
        if (hour < 12) {
            setGreeting('Good Morning');
        } else if (hour < 17) {
            setGreeting('Good Afternoon');
        } else {
            setGreeting('Good Evening');
        }

        return () => clearInterval(timer);
    }, [currentTime]);

    const StatCard = ({ title, value, icon, color, trend }) => (
        <div className="stat-card">
            <div className="stat-header">
                <div className={`stat-icon ${color}`}>{icon}</div>
                <div className="stat-trend">
                    {trend && <span className={`trend-arrow ${trend > 0 ? 'positive' : 'negative'}`}>
                        {trend > 0 ? '↗' : '↘'}
                    </span>}
                    <span className="trend-value">{trend > 0 ? '+' : ''}{trend}%</span>
                </div>
            </div>
            <div className="stat-content">
                <div className="stat-value">{value}</div>
                <div className="stat-label">{title}</div>
            </div>
        </div>
    );

    const QuickAction = ({ title, description, icon, color, onClick }) => (
        <div className="quick-action" onClick={onClick}>
            <div className={`action-icon ${color}`}>{icon}</div>
            <div className="action-content">
                <h4>{title}</h4>
                <p>{description}</p>
            </div>
            <div className="action-arrow">→</div>
        </div>
    );

    const RecentActivity = ({ type, message, time, status }) => (
        <div className={`activity-item ${status}`}>
            <div className="activity-icon">
                {type === 'report' && '📝'}
                {type === 'cluster' && '📍'}
                {type === 'alert' && '🚨'}
                {type === 'update' && '🔄'}
            </div>
            <div className="activity-content">
                <p className="activity-message">{message}</p>
                <span className="activity-time">{time}</span>
            </div>
            <div className={`activity-status ${status}`}></div>
        </div>
    );

    return (
        <div className="admin-home">
            {/* Hero Section */}
            <div className="hero-section">
                <div className="hero-content">
                    <div className="hero-text">
                        <h1 className="hero-title">
                            {greeting}, Administrator! 👋
                        </h1>
                        <p className="hero-subtitle">
                            Welcome to CivicPulse Admin Dashboard. Monitor, analyze, and manage civic issues in real-time.
                        </p>
                        <div className="hero-time">
                            <span className="time-icon">🕐</span>
                            <span className="time-text">
                                {currentTime.toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}
                            </span>
                            <span className="time-clock">
                                {currentTime.toLocaleTimeString('en-US', { 
                                    hour12: true, 
                                    hour: '2-digit', 
                                    minute: '2-digit', 
                                    second: '2-digit' 
                                })}
                            </span>
                        </div>
                    </div>
                    <div className="hero-visual">
                        <div className="hero-stats">
                            <div className="hero-stat">
                                <span className="stat-number">24/7</span>
                                <span className="stat-text">Monitoring</span>
                            </div>
                            <div className="hero-stat">
                                <span className="stat-number">Real-time</span>
                                <span className="stat-text">Updates</span>
                            </div>
                            <div className="hero-stat">
                                <span className="stat-number">AI-Powered</span>
                                <span className="stat-text">Insights</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="stats-section">
                <div className="section-header">
                    <h2>Dashboard Overview</h2>
                    <p>Key metrics and performance indicators</p>
                </div>
                <div className="stats-grid">
                    <StatCard 
                        title="Total Reports" 
                        value="1,247" 
                        icon="📊" 
                        color="blue"
                        trend={12}
                    />
                    <StatCard 
                        title="Active Clusters" 
                        value="23" 
                        icon="📍" 
                        color="green"
                        trend={8}
                    />
                    <StatCard 
                        title="High Priority" 
                        value="156" 
                        icon="🚨" 
                        color="red"
                        trend={-5}
                    />
                    <StatCard 
                        title="Response Rate" 
                        value="94.2%" 
                        icon="⚡" 
                        color="purple"
                        trend={2}
                    />
                </div>
            </div>

            {/* Quick Actions */}
            <div className="actions-section">
                <div className="section-header">
                    <h2>Quick Actions</h2>
                    <p>Common administrative tasks</p>
                </div>
                <div className="actions-grid">
                    <QuickAction 
                        title="View Reports" 
                        description="Browse and analyze civic issue reports"
                        icon="📋"
                        color="blue"
                        onClick={() => window.location.href = '/map'}
                    />
                    <QuickAction 
                        title="Cluster Analysis" 
                        description="Examine issue clusters and patterns"
                        icon="🗺️"
                        color="green"
                        onClick={() => window.location.href = '/map'}
                    />
                    <QuickAction 
                        title="Generate Reports" 
                        description="Create comprehensive analytics reports"
                        icon="📈"
                        color="purple"
                        onClick={() => window.location.href = '/sentiment'}
                    />
                    <QuickAction 
                        title="System Settings" 
                        description="Configure dashboard preferences"
                        icon="⚙️"
                        color="gray"
                        onClick={() => alert('Settings panel coming soon!')}
                    />
                </div>
            </div>

            {/* Recent Activity & System Status */}
            <div className="bottom-section">
                <div className="activity-section">
                    <div className="section-header">
                        <h3>Recent Activity</h3>
                        <p>Latest system updates and actions</p>
                    </div>
                    <div className="activity-list">
                        <RecentActivity 
                            type="report"
                            message="New water issue report received in Cluster 5"
                            time="2 minutes ago"
                            status="new"
                        />
                        <RecentActivity 
                            type="cluster"
                            message="Cluster 3 updated with 3 new reports"
                            time="15 minutes ago"
                            status="update"
                        />
                        <RecentActivity 
                            type="alert"
                            message="High priority sanitation issue detected"
                            time="1 hour ago"
                            status="alert"
                        />
                        <RecentActivity 
                            type="update"
                            message="System maintenance completed successfully"
                            time="2 hours ago"
                            status="complete"
                        />
                        <RecentActivity 
                            type="report"
                            message="5 new reports processed and categorized"
                            time="3 hours ago"
                            status="complete"
                        />
                    </div>
                </div>

                <div className="status-section">
                    <div className="section-header">
                        <h3>System Status</h3>
                        <p>Current system health and performance</p>
                    </div>
                    <div className="status-grid">
                        <div className="status-item">
                            <div className="status-indicator online"></div>
                            <div className="status-info">
                                <span className="status-name">Database</span>
                                <span className="status-value">Online</span>
                            </div>
                        </div>
                        <div className="status-item">
                            <div className="status-indicator online"></div>
                            <div className="status-info">
                                <span className="status-name">API Services</span>
                                <span className="status-value">Operational</span>
                            </div>
                        </div>
                        <div className="status-item">
                            <div className="status-indicator online"></div>
                            <div className="status-info">
                                <span className="status-name">ML Models</span>
                                <span className="status-value">Active</span>
                            </div>
                        </div>
                        <div className="status-item">
                            <div className="status-indicator online"></div>
                            <div className="status-info">
                                <span className="status-name">Notifications</span>
                                <span className="status-value">Enabled</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home;
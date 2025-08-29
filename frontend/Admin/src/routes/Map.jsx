import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Chart from 'chart.js/auto';
import L from 'leaflet';
import './Map.css';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function Map() {
    const [clusters, setClusters] = useState([]);
    const [dashboard, setDashboard] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [mapKey, setMapKey] = useState(0);
    const barChartRef = useRef(null);
    const pieChartRef = useRef(null);
    const barChartInstance = useRef(null);
    const pieChartInstance = useRef(null);

    useEffect(() => {
        // Fetch clusters
        fetch('http://localhost:8000/civicpulse/clusters')
            .then(res => res.json())
            .then(data => {
                console.log('Clusters loaded successfully:', data);
                setClusters(data);
            })
            .catch(err => {
                console.error("Error fetching clusters:", err);
                setClusters([]);
            });

        // Fetch dashboard data
        fetch('http://localhost:8000/dashboard-data')
            .then(res => res.json())
            .then(data => {
                console.log('Dashboard loaded:', data);
                setDashboard(data);
            })
            .catch(err => console.error("Error fetching dashboard:", err));
    }, []);

    // Clean up charts when component unmounts
    useEffect(() => {
        return () => {
            if (barChartInstance.current) {
                barChartInstance.current.destroy();
            }
            if (pieChartInstance.current) {
                pieChartInstance.current.destroy();
            }
        };
    }, []);

    // Render charts when analytics tab is active
    useEffect(() => {
        if (activeTab === 'analytics' && dashboard) {
            console.log('Rendering charts for analytics tab');
            
            // Destroy existing charts
            if (barChartInstance.current) {
                barChartInstance.current.destroy();
                barChartInstance.current = null;
            }
            if (pieChartInstance.current) {
                pieChartInstance.current.destroy();
                pieChartInstance.current = null;
            }

            // Wait for DOM to be ready and render charts
            const timer = setTimeout(() => {
                renderCharts();
            }, 200);

            return () => clearTimeout(timer);
        }
    }, [activeTab, dashboard]);

    const renderCharts = () => {
        try {
            console.log('Starting chart rendering...');
            
            // Bar Chart
            const ctxBar = document.getElementById('barChart');
            if (ctxBar) {
                console.log('Bar chart canvas found, creating chart...');
                barChartInstance.current = new Chart(ctxBar, {
                    type: 'bar',
                    data: {
                        labels: Object.keys(dashboard.issueBreakdown || {}),
                        datasets: [{
                            label: 'Number of Reports',
                            data: Object.values(dashboard.issueBreakdown || {}),
                            backgroundColor: [
                                '#3b82f6',
                                '#10b981',
                                '#f59e0b',
                                '#ef4444',
                                '#8b5cf6',
                                '#06b6d4'
                            ],
                            borderRadius: 8,
                            borderSkipped: false,
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { 
                            legend: { 
                                position: 'top',
                                labels: {
                                    font: { size: 14, weight: '600' },
                                    color: '#374151'
                                }
                            } 
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: { color: '#e5e7eb' },
                                ticks: { color: '#6b7280' }
                            },
                            x: {
                                grid: { color: '#e5e7eb' },
                                ticks: { color: '#6b7280' }
                            }
                        }
                    }
                });
                console.log('Bar chart created successfully');
            } else {
                console.error('Bar chart canvas not found');
            }

            // Pie Chart
            const ctxPie = document.getElementById('pieChart');
            if (ctxPie) {
                console.log('Pie chart canvas found, creating chart...');
                pieChartInstance.current = new Chart(ctxPie, {
                    type: 'doughnut',
                    data: {
                        labels: Object.keys(dashboard.priorityBreakdown || {}),
                        datasets: [{
                            data: Object.values(dashboard.priorityBreakdown || {}),
                            backgroundColor: [
                                '#ef4444', // High - Red
                                '#f59e0b', // Medium - Orange
                                '#10b981', // Normal - Green
                                '#3b82f6', // Blue
                                '#8b5cf6'  // Purple
                            ],
                            borderWidth: 3,
                            borderColor: '#ffffff'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { 
                            legend: { 
                                position: 'bottom',
                                labels: {
                                    font: { size: 14, weight: '600' },
                                    color: '#374151',
                                    padding: 20
                                }
                            } 
                        },
                        cutout: '60%'
                    }
                });
                console.log('Pie chart created successfully');
            } else {
                console.error('Pie chart canvas not found');
            }
        } catch (error) {
            console.error('Chart rendering error:', error);
        }
    };

    // Calculate map center based on clusters
    const getMapCenter = () => {
        if (clusters.length > 0) {
            const avgLat = clusters.reduce((sum, c) => sum + (c.centroid_lat || 0), 0) / clusters.length;
            const avgLon = clusters.reduce((sum, c) => sum + (c.centroid_lon || 0), 0) / clusters.length;
            return [avgLat, avgLon];
        }
        return [13.05, 80.22];
    };

    const StatCard = ({ title, value, icon, color }) => (
        <div className="stat-card">
            <div className={`stat-card-icon ${color}`}>{icon}</div>
            <div className="stat-card-text">
                <div className="stat-label">{title}</div>
                <div className="stat-value">{value}</div>
            </div>
        </div>
    );

    const TabButton = ({ id, label, active, onClick }) => (
        <button 
            className={`tab-button ${active ? 'active' : ''}`}
            onClick={() => onClick(id)}
        >
            {label}
        </button>
    );

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        if (tabId === 'map') {
            setMapKey(prev => prev + 1);
        }
    };

    return (
        <div className="map-admin-container">
            {/* Header Section */}
            <div className="admin-header">
                <div className="header-content">
                    <h1 className="admin-title">
                        <span className="title-icon">🗺️</span>
                        CivicPulse Admin Dashboard
                    </h1>
                    <p className="admin-subtitle">Real-time monitoring and analysis of civic issues</p>
                </div>
                <div className="header-stats">
                    <StatCard 
                        title="Total Reports" 
                        value={dashboard?.totalReports || 0} 
                        icon="📊" 
                        color="blue" 
                    />
                    <StatCard 
                        title="Active Clusters" 
                        value={clusters.length} 
                        icon="📍" 
                        color="green" 
                    />
                    <StatCard 
                        title="High Priority" 
                        value={dashboard?.priorityBreakdown?.HIGH || 0} 
                        icon="🚨" 
                        color="red" 
                    />
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="tab-navigation">
                <TabButton 
                    id="overview" 
                    label="Overview" 
                    active={activeTab === 'overview'} 
                    onClick={handleTabChange} 
                />
                <TabButton 
                    id="map" 
                    label="Interactive Map" 
                    active={activeTab === 'map'} 
                    onClick={handleTabChange} 
                />
                <TabButton 
                    id="reports" 
                    label="Detailed Reports" 
                    active={activeTab === 'reports'} 
                    onClick={handleTabChange} 
                />
                <TabButton 
                    id="analytics" 
                    label="Analytics" 
                    active={activeTab === 'analytics'} 
                    onClick={handleTabChange} 
                />
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="overview-section">
                        <div className="overview-grid">
                            <div className="overview-card map-preview">
                                <h3>Live Map Overview</h3>
                                <div className="map-container-small">
                                    <MapContainer 
                                        key={`overview-${mapKey}`}
                                        center={getMapCenter()} 
                                        zoom={10} 
                                        style={{ height: '300px', width: '100%' }}
                                    >
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution="&copy; OpenStreetMap contributors"
                                        />
                                        {clusters.map((cluster, index) => {
                                            const lat = cluster.centroid_lat;
                                            const lon = cluster.centroid_lon;
                                            
                                            if (lat && lon && !isNaN(lat) && !isNaN(lon) && 
                                                lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
                                                
                                                return (
                                                    <Marker 
                                                        key={cluster.id || index} 
                                                        position={[lat, lon]}
                                                        icon={L.divIcon({
                                                            className: 'cluster-marker',
                                                            html: `<div style="background-color: #ef4444; color: white; border-radius: 50%; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold;">${index + 1}</div>`,
                                                            iconSize: [16, 16],
                                                            iconAnchor: [8, 8]
                                                        })}
                                                    >
                                                        <Popup>
                                                            <div>
                                                                <strong>Cluster {index + 1}</strong><br/>
                                                                <strong>Reports:</strong> {cluster.report_ids ? cluster.report_ids.length : 0}
                                                            </div>
                                                        </Popup>
                                                    </Marker>
                                                );
                                            }
                                            return null;
                                        })}
                                    </MapContainer>
                                </div>
                            </div>
                            
                            <div className="overview-card quick-stats">
                                <h3>Quick Statistics</h3>
                                <div className="stats-grid">
                                    <div className="stat-item">
                                        <div className="stat-number">{dashboard?.totalReports || 0}</div>
                                        <div className="stat-label">Total Reports</div>
                                    </div>
                                    <div className="stat-item">
                                        <div className="stat-number">{clusters.length}</div>
                                        <div className="stat-label">Active Clusters</div>
                                    </div>
                                    <div className="stat-item">
                                        <div className="stat-number">{Object.keys(dashboard?.issueBreakdown || {}).length}</div>
                                        <div className="stat-label">Issue Categories</div>
                                    </div>
                                    <div className="stat-item">
                                        <div className="stat-number">{dashboard?.priorityBreakdown?.HIGH || 0}</div>
                                        <div className="stat-label">High Priority</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Map Tab */}
                {activeTab === 'map' && (
                    <div className="map-section">
                        <div className="map-header">
                            <h3>Interactive Cluster Map</h3>
                            <p>Real-time visualization of civic issue clusters</p>
                        </div>
                        <div className="map-wrapper">
                            <MapContainer 
                                key={`main-map-${mapKey}`}
                                center={getMapCenter()} 
                                zoom={12} 
                                style={{ height: '600px', width: '100%' }}
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution="&copy; OpenStreetMap contributors"
                                />
                                
                                {/* Test marker */}
                                <Marker position={[13.05, 80.22]}>
                                    <Popup>Test Marker - Chennai Center</Popup>
                                </Marker>

                                {/* Cluster markers */}
                                {clusters.map((cluster, index) => {
                                    const lat = cluster.centroid_lat;
                                    const lon = cluster.centroid_lon;
                                    
                                    if (lat && lon && !isNaN(lat) && !isNaN(lon) && 
                                        lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
                                        
                                        return (
                                            <Marker 
                                                key={cluster.id || index} 
                                                position={[lat, lon]}
                                                icon={L.divIcon({
                                                    className: 'cluster-marker',
                                                    html: `<div style="background-color: #ef4444; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${index + 1}</div>`,
                                                    iconSize: [24, 24],
                                                    iconAnchor: [12, 12]
                                                })}
                                            >
                                                <Popup>
                                                    <div className="cluster-popup">
                                                        <h4>Cluster {index + 1}</h4>
                                                        <p><strong>Location:</strong> {lat.toFixed(4)}, {lon.toFixed(4)}</p>
                                                        <p><strong>Reports:</strong> {cluster.report_ids ? cluster.report_ids.length : 0}</p>
                                                        <p><strong>Label:</strong> {cluster.label}</p>
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        );
                                    }
                                    return null;
                                })}
                            </MapContainer>
                        </div>
                    </div>
                )}

                {/* Reports Tab */}
                {activeTab === 'reports' && (
                    <div className="reports-section">
                        <div className="reports-header">
                            <h3>Detailed Reports</h3>
                            <p>Comprehensive view of all civic issue reports</p>
                        </div>
                        {dashboard && (
                            <div className="reports-container">
                                <div className="table-container">
                                    <table className="reports-table">
                                        <thead>
                                            <tr>
                                                <th>Report</th>
                                                <th>Confidence</th>
                                                <th>Latitude</th>
                                                <th>Longitude</th>
                                                <th>Prediction</th>
                                                <th>Category</th>
                                                <th>Department</th>
                                                <th>Rapport Score</th>
                                                <th>Priority</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(dashboard.reports || []).slice(0, 20).map((r, i) => (
                                                <tr key={i} className="report-row">
                                                    <td className="report-text">{r.report}</td>
                                                    <td className="confidence-cell">{r.confidence?.toFixed(2) || 'N/A'}</td>
                                                    <td className="coordinate-cell">{r.lat?.toFixed(6) || 'N/A'}</td>
                                                    <td className="coordinate-cell">{r.lon?.toFixed(6) || 'N/A'}</td>
                                                    <td className="prediction-cell">{r.prediction || 'N/A'}</td>
                                                    <td className="category-cell">{r.category || 'General'}</td>
                                                    <td className="department-cell">{r.department || 'General'}</td>
                                                    <td className="score-cell">{r.rapport_score?.toFixed(2) || 'N/A'}</td>
                                                    <td>
                                                        <span className={`priority-badge priority-${r.priority?.toLowerCase() || 'normal'}`}>
                                                            {r.priority || 'NORMAL'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                    <div className="analytics-section">
                        <div className="analytics-header">
                            <h3>Data Analytics</h3>
                            <p>Visual insights and trends</p>
                        </div>
                        
                        {/* Debug Info */}
                        <div className="debug-info" style={{marginBottom: '20px', padding: '16px', background: '#f3f4f6', borderRadius: '8px'}}>
                            <p><strong>Debug Info:</strong></p>
                            <p>Active Tab: {activeTab}</p>
                            <p>Dashboard Data: {dashboard ? 'Loaded' : 'Not Loaded'}</p>
                            <p>Issue Breakdown: {dashboard?.issueBreakdown ? Object.keys(dashboard.issueBreakdown).length : 0} categories</p>
                            <p>Priority Breakdown: {dashboard?.priorityBreakdown ? Object.keys(dashboard.priorityBreakdown).length : 0} priorities</p>
                        </div>
                        
                        <div className="charts-grid">
                            <div className="chart-card">
                                <h4>Issue Category Breakdown</h4>
                                <div className="chart-container">
                                    <canvas id="barChart" width="400" height="300"></canvas>
                                </div>
                                <p className="chart-note">Bar chart showing distribution of reports by issue category</p>
                            </div>
                            <div className="chart-card">
                                <h4>Priority Distribution</h4>
                                <div className="chart-container">
                                    <canvas id="pieChart" width="300" height="300"></canvas>
                                </div>
                                <p className="chart-note">Doughnut chart showing priority distribution of reports</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Map;

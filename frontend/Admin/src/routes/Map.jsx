import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import '../AdminPortal.css';

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Move map view to current location
function FlyToLocation({ center }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 14, { duration: 1.2 });
  }, [center]);
  return null;
}

// Keyword-based severity analysis
function analyzeSeverity(text) {
  const t = text.toLowerCase();
  const highKeywords = ['emergency', 'urgent', 'fire', 'flood', 'danger', 'critical', 'collapse', 'accident'];
  const medKeywords = ['broken', 'blocked', 'damaged', 'overflow', 'leak', 'pothole', 'sewage', 'water'];
  
  for (const k of highKeywords) if (t.includes(k)) return { level: 'HIGH', color: '#ef4444', radius: 20 };
  for (const k of medKeywords) if (t.includes(k)) return { level: 'MEDIUM', color: '#f97316', radius: 15 };
  return { level: 'LOW', color: '#22c55e', radius: 10 };
}

// Simple distance check for clustering (within ~500m)
function isNearby(lat1, lon1, lat2, lon2) {
  const dist = Math.sqrt(Math.pow((lat1 - lat2) * 111000, 2) + Math.pow((lon1 - lon2) * 111000 * Math.cos(lat1 * Math.PI / 180), 2));
  return dist < 500; // 500 meters threshold
}

// Build visual clusters from all reports
function buildClusters(reports) {
  const clusters = [];
  const assigned = new Set();
  
  reports.forEach((r, i) => {
    if (assigned.has(i)) return;
    const group = [r];
    assigned.add(i);
    
    reports.forEach((r2, j) => {
      if (i === j || assigned.has(j)) return;
      if (isNearby(r.lat, r.lon, r2.lat, r2.lon)) {
        group.push(r2);
        assigned.add(j);
      }
    });
    
    const avgLat = group.reduce((s, g) => s + g.lat, 0) / group.length;
    const avgLon = group.reduce((s, g) => s + g.lon, 0) / group.length;
    const topSeverity = group.reduce((top, g) => {
      const order = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return order[g.severity.level] > order[top.severity.level] ? g : top;
    }, group[0]);
    
    clusters.push({ lat: avgLat, lon: avgLon, count: group.length, severity: topSeverity.severity, reports: group });
  });
  
  return clusters;
}

// ── Main Component ──────────────────────────────────────────────────────────
function Map() {
    const navigate = useNavigate();
    const [concern, setConcern] = useState('');
    const [location, setLocation] = useState({ lat: 13.0827, lon: 80.2707 }); // Default: Chennai
    const [isLocating, setIsLocating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reports, setReports] = useState([]); // In-memory reports
    const [clusters, setClusters] = useState([]);
    const [toast, setToast] = useState(null);
    const [selectedCluster, setSelectedCluster] = useState(null);
    const [manualLat, setManualLat] = useState('');
    const [manualLon, setManualLon] = useState('');

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Rebuild clusters whenever reports change
    useEffect(() => {
        setClusters(buildClusters(reports));
    }, [reports]);

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            showToast('Geolocation not supported by your browser', 'error');
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setLocation({ lat: latitude, lon: longitude });
                setManualLat(latitude.toFixed(6));
                setManualLon(longitude.toFixed(6));
                showToast(`Location detected: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                setIsLocating(false);
            },
            () => {
                showToast('Unable to get location. Enter manually below.', 'error');
                setIsLocating(false);
            }
        );
    };

    const handleManualLocation = () => {
        const lat = parseFloat(manualLat);
        const lon = parseFloat(manualLon);
        if (isNaN(lat) || isNaN(lon)) {
            showToast('Invalid coordinates', 'error');
            return;
        }
        setLocation({ lat, lon });
        showToast(`Location set: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    };

    const handleSubmit = async () => {
        if (!concern.trim()) {
            showToast('Please describe the issue', 'error');
            return;
        }
        setIsSubmitting(true);

        const severity = analyzeSeverity(concern);
        const newReport = {
            id: Date.now(),
            text: concern,
            lat: location.lat,
            lon: location.lon,
            severity,
            time: new Date().toLocaleTimeString()
        };

        // Save to local state immediately (works offline)
        setReports(prev => [...prev, newReport]);
        
        // Also try to save to backend (best-effort)
        try {
            await fetch('http://localhost:8000/api/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: concern, lat: location.lat, lon: location.lon }),
                signal: AbortSignal.timeout(3000)
            });
        } catch (e) {
            // Backend unavailable — data still shows on map locally
        }

        setConcern('');
        showToast(`Incident recorded — ${severity.level} severity`);
        setIsSubmitting(false);
    };

    return (
        <>
            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
                    padding: '12px 24px', borderRadius: '12px', fontWeight: '700', fontSize: '13px',
                    color: 'white', boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                    background: toast.type === 'error' ? '#ef4444' : '#10b981'
                }}>
                    {toast.msg}
                </div>
            )}

            {/* Left Sidebar */}
            <aside className="admin-sidebar" style={{ minWidth: '320px', maxWidth: '320px' }}>
                <h3>📍 Report Concern</h3>

                {/* Step 1: Location */}
                <div className="admin-card" style={{ padding: '15px', marginBottom: '15px', background: '#f8fafc' }}>
                    <p style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>Step 1 — Location</p>
                    
                    <button
                        className="admin-btn btn-primary w-full"
                        style={{ marginBottom: '10px', width: '100%' }}
                        onClick={handleGetLocation}
                        disabled={isLocating}
                    >
                        {isLocating ? '⏳ Detecting...' : '📱 Use My Device Location'}
                    </button>

                    <p style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'center', margin: '8px 0' }}>— or enter manually —</p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                            <label style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>Latitude</label>
                            <input
                                type="number" step="0.000001"
                                value={manualLat}
                                onChange={e => setManualLat(e.target.value)}
                                placeholder="13.0827"
                                style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>Longitude</label>
                            <input
                                type="number" step="0.000001"
                                value={manualLon}
                                onChange={e => setManualLon(e.target.value)}
                                placeholder="80.2707"
                                style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                            />
                        </div>
                    </div>
                    <button
                        className="admin-btn"
                        style={{ width: '100%', marginTop: '8px', border: '1px solid #e2e8f0', fontSize: '12px', padding: '8px' }}
                        onClick={handleManualLocation}
                    >
                        Set Location
                    </button>

                    <div style={{ marginTop: '10px', padding: '8px', background: '#e0f2fe', borderRadius: '8px', fontSize: '11px', color: '#0369a1' }}>
                        📍 <strong>{location.lat.toFixed(4)}, {location.lon.toFixed(4)}</strong>
                    </div>
                </div>

                {/* Step 2: Concern */}
                <div className="admin-card" style={{ padding: '15px', marginBottom: '15px' }}>
                    <p style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>Step 2 — Describe Issue</p>
                    <textarea
                        rows={4}
                        value={concern}
                        onChange={e => setConcern(e.target.value)}
                        placeholder="e.g. Broken water pipe flooding the road near park entrance..."
                        style={{
                            width: '100%', padding: '10px', border: '1px solid #e2e8f0',
                            borderRadius: '10px', fontSize: '13px', resize: 'none', outline: 'none',
                            fontFamily: 'inherit'
                        }}
                    />

                    {/* Live severity preview */}
                    {concern.trim() && (() => {
                        const s = analyzeSeverity(concern);
                        return (
                            <div style={{ marginTop: '8px', padding: '8px 12px', borderRadius: '8px', background: s.color + '18', border: `1px solid ${s.color}40`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.color, flexShrink: 0 }}></div>
                                <span style={{ fontSize: '11px', fontWeight: '800', color: s.color }}>{s.level} SEVERITY DETECTED</span>
                            </div>
                        );
                    })()}

                    <button
                        className="admin-btn btn-green"
                        style={{ width: '100%', marginTop: '12px' }}
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? '⏳ Recording...' : '🚨 Submit Incident'}
                    </button>
                </div>

                {/* Stats */}
                <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                    <p style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>Live Incident Map</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {[
                            { label: 'Total', val: reports.length, color: '#1a73e8' },
                            { label: 'Clusters', val: clusters.length, color: '#7c3aed' },
                            { label: 'High', val: reports.filter(r => r.severity.level === 'HIGH').length, color: '#ef4444' },
                            { label: 'Medium', val: reports.filter(r => r.severity.level === 'MEDIUM').length, color: '#f97316' },
                        ].map(s => (
                            <div key={s.label} style={{ textAlign: 'center', padding: '8px', background: 'white', borderRadius: '8px' }}>
                                <p style={{ fontSize: '18px', fontWeight: '900', color: s.color, margin: 0 }}>{s.val}</p>
                                <p style={{ fontSize: '9px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', margin: 0 }}>{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Nav */}
                <div style={{ marginTop: '20px' }}>
                    <h3>Navigation</h3>
                    <nav>
                        <button className="sidebar-btn" onClick={() => navigate('/')}>🏠 Dashboard</button>
                        <button className="sidebar-btn active">🗺️ Geo Hub</button>
                        <button className="sidebar-btn" onClick={() => navigate('/sentiment')}>🧠 Sentiment AI</button>
                        <button className="sidebar-btn" onClick={() => navigate('/chatbot')}>🤖 Doc Engine</button>
                    </nav>
                </div>
            </aside>

            {/* Main Map */}
            <main className="admin-main">
                <section className="admin-card" style={{ padding: 0, overflow: 'hidden', flex: 1, minHeight: '600px' }}>
                    <MapContainer
                        center={[location.lat, location.lon]}
                        zoom={13}
                        style={{ height: '600px', width: '100%' }}
                    >
                        <FlyToLocation center={[location.lat, location.lon]} />
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; OpenStreetMap contributors'
                        />

                        {/* Current location pulse */}
                        <CircleMarker
                            center={[location.lat, location.lon]}
                            radius={10}
                            pathOptions={{ color: '#1a73e8', fillColor: '#1a73e8', fillOpacity: 0.3, weight: 2 }}
                        >
                            <Popup><strong>Your Selected Location</strong><br />{location.lat.toFixed(5)}, {location.lon.toFixed(5)}</Popup>
                        </CircleMarker>

                        {/* Clustered incident markers */}
                        {clusters.map((cluster, i) => (
                            <CircleMarker
                                key={i}
                                center={[cluster.lat, cluster.lon]}
                                radius={cluster.severity.radius + (cluster.count > 1 ? cluster.count * 3 : 0)}
                                pathOptions={{
                                    color: cluster.severity.color,
                                    fillColor: cluster.severity.color,
                                    fillOpacity: 0.6,
                                    weight: 2
                                }}
                                eventHandlers={{ click: () => setSelectedCluster(cluster) }}
                            >
                                <Popup>
                                    <div style={{ minWidth: '200px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: cluster.severity.color, flexShrink: 0 }}></div>
                                            <strong style={{ fontSize: '13px' }}>{cluster.severity.level} — {cluster.count} Report{cluster.count > 1 ? 's' : ''}</strong>
                                        </div>
                                        {cluster.reports.map((r, j) => (
                                            <p key={j} style={{ fontSize: '11px', color: '#475569', margin: '4px 0', borderTop: j > 0 ? '1px solid #f1f5f9' : 'none', paddingTop: j > 0 ? '4px' : 0 }}>
                                                ⏱ {r.time} — {r.text.slice(0, 80)}{r.text.length > 80 ? '...' : ''}
                                            </p>
                                        ))}
                                    </div>
                                </Popup>
                            </CircleMarker>
                        ))}
                    </MapContainer>
                </section>

                {/* Legend */}
                <div className="admin-card" style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {[
                        { label: 'Low Risk', color: '#22c55e', desc: 'Routine / Minor issue' },
                        { label: 'Medium Risk', color: '#f97316', desc: 'Infrastructure damage' },
                        { label: 'High Risk', color: '#ef4444', desc: 'Emergency / Danger' },
                    ].map(l => (
                        <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, padding: '10px', background: l.color + '10', borderRadius: '10px', border: `1px solid ${l.color}30` }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: l.color, flexShrink: 0 }}></div>
                            <div>
                                <p style={{ fontSize: '11px', fontWeight: '800', color: l.color, margin: 0 }}>{l.label}</p>
                                <p style={{ fontSize: '10px', color: '#64748b', margin: 0 }}>{l.desc}</p>
                            </div>
                        </div>
                    ))}
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textAlign: 'right' }}>
                        Larger circles = nearby reports clustered together
                    </div>
                </div>
            </main>
        </>
    );
}

export default Map;

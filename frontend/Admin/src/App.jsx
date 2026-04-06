import React from 'react';
import 'leaflet/dist/leaflet.css';
import "./App.css";
import "./AdminPortal.css";
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Home from './routes/Home';
import Chatbot from './routes/Chatbot';
import Map from './routes/Map';
import Sentiment from './routes/Sentiment';
import Navbar from './routes/Navbar';

function AppLayout({ children }) {
  const location = useLocation();
  const path = location.pathname;
  
  const getSubTitle = () => {
    if (path === '/') return 'Administrator Dashboard';
    if (path === '/map') return 'Geo Intelligence & Cluster Map';
    if (path === '/sentiment') return 'Sentiment AI Insights';
    if (path === '/chatbot') return 'Chatbot Management';
    return 'Admin Panel';
  };

  const getDescription = () => {
    if (path === '/') return 'Welcome back! You have 156 high-priority alerts across the system knowledge base.';
    if (path === '/map') return 'Tracking the real-time spread of issues and sentiment across regions';
    if (path === '/sentiment') return 'Real-time analytics from citizen reactions and comments';
    if (path === '/chatbot') return 'Manage documents, PDFs, and data.gov.in integration for the knowledge base';
    return 'Manage system documents and analysis';
  };

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>⚡ Government RAG Chatbot</h1>
        <h2>{getSubTitle()}</h2>
        <p>{getDescription()}</p>
      </header>
      <div className="admin-layout">
        {children}
      </div>
    </div>
  );
}

function App() {
  return(
    <BrowserRouter>
      {/* We skip the old Navbar because we have the new Blue Header Layout */}
      <AppLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/map" element={<Map />} />
          <Route path="/sentiment" element={<Sentiment />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  )
}

export default App;
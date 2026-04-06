import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../AdminPortal.css'; 

const BACKEND_URL = 'http://127.0.0.1:8000';

function Chatbot() {
  const navigate = useNavigate();
  const [adminData, setAdminData] = useState({ title: '', content: '', reference_id: '', pdfFile: null });
  const [vectorStatus, setVectorStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('fetch');

  const fileInputRef = useRef(null);

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => { setMessage(''); setMessageType(''); }, 5000);
  };

  const fetchDocument = async () => {
    if (!adminData.title || !adminData.reference_id) {
      showMessage('Please provide title and reference ID', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/admin/documents/fetch/`, {
        title: adminData.title, reference_id: adminData.reference_id,
      });
      showMessage(`Document fetched! Chunks: ${response.data.chunks}`);
      setAdminData({ title: '', content: '', reference_id: '', pdfFile: null });
    } catch (error) {
      showMessage(`Error: ${error.response?.data?.detail || error.message}`, 'error');
    } finally { setIsLoading(false); }
  };

  const uploadPDF = async () => {
    if (!adminData.title || !adminData.pdfFile) {
      showMessage('Please provide title and PDF', 'error');
      return;
    }
    setIsLoading(true);
    const formData = new FormData();
    formData.append('title', adminData.title);
    if (adminData.reference_id) formData.append('reference_id', adminData.reference_id);
    formData.append('pdf_file', adminData.pdfFile);
    try {
      const response = await axios.post(`${BACKEND_URL}/admin/documents/pdf/`, formData, {
        onUploadProgress: (p) => setUploadProgress(Math.round((p.loaded * 100) / p.total)),
      });
      showMessage(`PDF uploaded! Chunks: ${response.data.chunks}`);
      setAdminData({ title: '', content: '', reference_id: '', pdfFile: null });
      setUploadProgress(0);
    } catch (error) {
      showMessage(`Error: ${error.response?.data?.detail || error.message}`, 'error');
      setUploadProgress(0);
    } finally { setIsLoading(false); }
  };

  const checkVectorStatus = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/admin/documents/vector/status`);
      setVectorStatus(response.data);
      showMessage('Vector database status updated');
    } catch (error) {
      showMessage(`Error: ${error.response?.data?.detail || error.message}`, 'error');
    } finally { setIsLoading(false); }
  };

  return (
    <>
      {message && (
        <div className={`message-toast ${messageType === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {message}
        </div>
      )}

      <aside className="admin-sidebar" style={{ minWidth: '300px' }}>
          <h3>Knowledge Engine</h3>
          <nav>
            <button className="sidebar-btn" onClick={() => navigate('/')}>
               <span className="icon">🏠</span> Main Dashboard
            </button>
            <button className={activeTab === 'fetch' ? 'sidebar-btn active' : 'sidebar-btn'} onClick={() => setActiveTab('fetch')}>
               <span className="icon">🌐</span> Fetch from data.gov.in
            </button>
            <button className={activeTab === 'pdf' ? 'sidebar-btn active' : 'sidebar-btn'} onClick={() => setActiveTab('pdf')}>
               <span className="icon">📄</span> Upload PDF
            </button>
            <button className="sidebar-btn" onClick={() => navigate('/map')}>
               <span className="icon">🗺️</span> Mapping Intel
            </button>
          </nav>

          <div style={{ marginTop: '30px', padding: '15px', background: '#f8fafc', borderRadius: '15px', border: '1px solid #f1f5f9' }}>
             <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>RAG Status</h4>
             <p style={{ fontSize: '12px', fontWeight: '700', color: '#1a73e8' }}>Vector DB: Online</p>
          </div>
      </aside>

      <main className="admin-main">
          <section className="admin-card">
            <h3>
              {activeTab === 'fetch' && 'Fetch Document'}
              {activeTab === 'pdf' && 'Upload PDF'}
            </h3>
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '5px' }}>Title</label>
              <input
                type="text"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                value={adminData.title}
                onChange={(e) => setAdminData({ ...adminData, title: e.target.value })}
                placeholder="Enter document title"
              />
            </div>
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '5px' }}>Reference ID</label>
              <input
                type="text"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                value={adminData.reference_id}
                onChange={(e) => setAdminData({ ...adminData, reference_id: e.target.value })}
                placeholder="Enter reference ID"
              />
            </div>
            {activeTab === 'pdf' && (
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '5px' }}>PDF File</label>
                <input type="file" accept="application/pdf" onChange={(e) => setAdminData({...adminData, pdfFile: e.target.files[0]})} />
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button 
                onClick={activeTab === 'fetch' ? fetchDocument : uploadPDF} 
                className="admin-btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Wait...' : 'Submit Now'}
              </button>
              <button onClick={() => setAdminData({ title: '', content: '', reference_id: '', pdfFile: null })} className="admin-btn" style={{ border: '1px solid #e2e8f0' }}>
                Reset
              </button>
            </div>
          </section>

          <section className="admin-card">
            <h3>Vector Database Status</h3>
            <button onClick={checkVectorStatus} disabled={isLoading} className="admin-btn btn-primary w-full">
              {isLoading ? 'Checking...' : 'Check Status'}
            </button>
            {vectorStatus && (
              <div style={{ marginTop: '15px', padding: '15px', background: '#f8fafc', borderRadius: '10px', fontSize: '13px' }}>
                <p><strong>Documents:</strong> {vectorStatus.document_count || 0}</p>
                <p><strong>Vectors:</strong> {vectorStatus.vector_count || 0}</p>
              </div>
            )}
          </section>

          <section className="admin-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
             <button className="admin-btn btn-yellow" onClick={() => navigate('/')}>🗑️ Clear Form</button>
             <button className="admin-btn btn-primary" onClick={() => window.open('https://data.gov.in/')}>🌐 data.gov.in</button>
             <button className="admin-btn btn-green" onClick={() => window.open(`${BACKEND_URL}/docs`)}>📚 Docs</button>
          </section>
      </main>
    </>
  );
}

export default Chatbot;

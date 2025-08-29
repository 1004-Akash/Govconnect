import React, { useState, useRef } from 'react';
import axios from 'axios';
import './Chatbot.css'; // ✅ Import the new CSS

const BACKEND_URL = 'http://127.0.0.1:8000';

function Chatbot() {
  const [adminData, setAdminData] = useState({
    title: '',
    content: '',
    reference_id: '',
    pdfFile: null,
  });
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
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const fetchDocument = async () => {
    if (!adminData.title || !adminData.reference_id) {
      showMessage('Please provide title and reference ID', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/admin/documents/fetch/`, {
        title: adminData.title,
        reference_id: adminData.reference_id,
      });
      showMessage(`Document fetched successfully! Chunks: ${response.data.chunks}`);
      setAdminData({ title: '', content: '', reference_id: '', pdfFile: null });
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.message;
      showMessage(`Error fetching document: ${errorMsg}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const uploadPDF = async () => {
    if (!adminData.title || !adminData.pdfFile) {
      showMessage('Please provide title and select PDF file', 'error');
      return;
    }
    setIsLoading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append('title', adminData.title);
    if (adminData.reference_id) {
      formData.append('reference_id', adminData.reference_id);
    }
    formData.append('pdf_file', adminData.pdfFile);
    try {
      const response = await axios.post(`${BACKEND_URL}/admin/documents/pdf/`, formData, {
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
      });
      showMessage(`PDF uploaded successfully! Chunks: ${response.data.chunks}`);
      setAdminData({ title: '', content: '', reference_id: '', pdfFile: null });
      setUploadProgress(0);
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.message;
      showMessage(`Error uploading PDF: ${errorMsg}`, 'error');
      setUploadProgress(0);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadText = async () => {
    if (!adminData.title || !adminData.content) {
      showMessage('Please provide title and content', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/admin/documents/`, {
        title: adminData.title,
        content: adminData.content,
        reference_id: adminData.reference_id || undefined,
      });
      showMessage(`Text uploaded successfully! Chunks: ${response.data.chunks}`);
      setAdminData({ title: '', content: '', reference_id: '', pdfFile: null });
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.message;
      showMessage(`Error uploading text: ${errorMsg}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const checkVectorStatus = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/admin/documents/vector/status`);
      setVectorStatus(response.data);
      showMessage('Vector database status updated');
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.message;
      showMessage(`Error checking vector status: ${errorMsg}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setAdminData((prev) => ({ ...prev, pdfFile: file }));
      showMessage(`PDF selected: ${file.name}`);
    } else if (file) {
      showMessage('Please select a PDF file', 'error');
      e.target.value = '';
    }
  };

  const clearForm = () => {
    setAdminData({ title: '', content: '', reference_id: '', pdfFile: null });
    setVectorStatus(null);
    setUploadProgress(0);
    showMessage('Form cleared');
  };

  return (
    <div className="chatbot-container">
      <header className="chatbot-header">
        <h1>⚡ Government RAG Chatbot</h1>
        <h2>Admin Panel</h2>
        <p>Manage documents, PDFs, and data.gov.in integration for the knowledge base</p>
      </header>

      {message && (
        <div className={`message ${messageType}`}>
          <span>{messageType === 'error' ? '❌' : '✅'}</span>
          <span>{message}</span>
        </div>
      )}

      <div className="chatbot-layout">
        <aside className="chatbot-sidebar">
          <h2>Document Management</h2>
          <nav>
            <button className={activeTab === 'fetch' ? 'active' : ''} onClick={() => setActiveTab('fetch')}>
              📥 Fetch from data.gov.in
            </button>
            <button className={activeTab === 'pdf' ? 'active' : ''} onClick={() => setActiveTab('pdf')}>
              📄 Upload PDF
            </button>
            <button className={activeTab === 'text' ? 'active' : ''} onClick={() => setActiveTab('text')}>
              ✏️ Add Text Content
            </button>
          </nav>
        </aside>

        <main className="chatbot-main">
          <section className="card">
            <h2>
              {activeTab === 'fetch' && 'Fetch Document'}
              {activeTab === 'pdf' && 'Upload PDF'}
              {activeTab === 'text' && 'Add Text Content'}
            </h2>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={adminData.title}
                onChange={(e) => setAdminData({ ...adminData, title: e.target.value })}
                placeholder="Enter document title"
              />
            </div>
            {activeTab !== 'text' && (
              <div className="form-group">
                <label>Reference ID</label>
                <input
                  type="text"
                  value={adminData.reference_id}
                  onChange={(e) => setAdminData({ ...adminData, reference_id: e.target.value })}
                  placeholder="Enter reference ID"
                />
              </div>
            )}
            {activeTab === 'pdf' && (
              <div className="form-group">
                <label>PDF File</label>
                <input type="file" accept="application/pdf" onChange={handleFileChange} ref={fileInputRef} />
                {uploadProgress > 0 && (
                  <div className="progress-bar">
                    <div style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'text' && (
              <div className="form-group">
                <label>Content</label>
                <textarea
                  value={adminData.content}
                  onChange={(e) => setAdminData({ ...adminData, content: e.target.value })}
                  rows="5"
                  placeholder="Enter text content"
                ></textarea>
              </div>
            )}
            <div className="button-group">
              <button
                onClick={activeTab === 'fetch' ? fetchDocument : activeTab === 'pdf' ? uploadPDF : uploadText}
                disabled={isLoading}
                className="primary"
              >
                {isLoading ? 'Processing...' : 'Submit'}
              </button>
              <button onClick={clearForm} className="secondary">
                Clear
              </button>
            </div>
          </section>

          <section className="card">
            <h2>Vector Database Status</h2>
            <button onClick={checkVectorStatus} disabled={isLoading} className="primary full">
              {isLoading ? 'Checking...' : 'Check Status'}
            </button>
            {vectorStatus && (
              <div className="vector-status">
                <p><strong>Documents:</strong> {vectorStatus.document_count || 0}</p>
                <p><strong>Vectors:</strong> {vectorStatus.vector_count || 0}</p>
                {vectorStatus.collection && <p><strong>Collection:</strong> {vectorStatus.collection}</p>}
                {vectorStatus.total_points && <p><strong>Total Points:</strong> {vectorStatus.total_points}</p>}
              </div>
            )}
          </section>

          <section className="card">
            <h2>Quick Actions</h2>
            <div className="button-grid">
              <button className="warning" onClick={clearForm}>🗑️ Clear Form</button>
              <button className="primary" onClick={() => window.open('https://data.gov.in/', '_blank')}>
                🌐 Browse data.gov.in
              </button>
              <button className="success" onClick={() => window.open(`${BACKEND_URL}/docs`, '_blank')}>
                📚 API Documentation
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default Chatbot;

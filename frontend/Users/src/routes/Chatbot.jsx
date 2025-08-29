import React, { useState, useRef } from 'react';
import axios from 'axios';
import './Chatbot.css';

const BACKEND_URL = 'http://127.0.0.1:8000';

function Chatbot() {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState('text');
    const [language, setLanguage] = useState('en');
    const [referenceId, setReferenceId] = useState('');
    const [adminData, setAdminData] = useState({
        title: '',
        content: '',
        reference_id: '',
        pdfFile: null
    });
    const [vectorStatus, setVectorStatus] = useState(null);

    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        try { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); } catch (_) {}
    };

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'hi', name: 'Hindi' },
        { code: 'ta', name: 'Tamil' },
        { code: 'te', name: 'Telugu' },
        { code: 'bn', name: 'Bengali' },
        { code: 'mr', name: 'Marathi' },
        { code: 'ur', name: 'Urdu' },
        { code: 'gu', name: 'Gujarati' },
        { code: 'kn', name: 'Kannada' },
        { code: 'ml', name: 'Malayalam' },
        { code: 'or', name: 'Odia' },
        { code: 'pa', name: 'Punjabi' },
        { code: 'ne', name: 'Nepali' }
    ];

    const sendMessage = async () => {
        if (!inputText.trim()) return;

        const userMessage = {
            id: Date.now(),
            text: inputText,
            sender: 'user',
            timestamp: new Date().toLocaleTimeString()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        try {
            const response = await axios.post(`${BACKEND_URL}/chatbot/chat/`, {
                query: inputText,
                mode,
                language,
                reference_id: referenceId || undefined
            });

            console.log('[Chatbot] Response:', response.data);
            const text = (response && response.data && (response.data.response_text || response.data.responseText))
                ? (response.data.response_text || response.data.responseText)
                : (typeof response.data === 'string' ? response.data : JSON.stringify(response.data));

            const safeText = (text && String(text).trim().length > 0) ? String(text) : 'No response text returned.';

            const botMessage = {
                id: Date.now() + 1,
                text: safeText,
                sender: 'bot',
                timestamp: new Date().toLocaleTimeString()
            };
            console.log('[Chatbot] Appending bot message:', botMessage);
            setMessages(prev => [...prev, botMessage]);
            setTimeout(scrollToBottom, 0);
        } catch (error) {
            console.error('[Chatbot] Error:', error?.response?.data || error.message);
            const errText = error?.response?.data?.detail
                || error?.response?.data?.message
                || (typeof error?.response?.data === 'string' ? error.response.data : '')
                || error.message
                || 'Unknown error';
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: `Error: ${errText}`,
                sender: 'bot',
                timestamp: new Date().toLocaleTimeString(),
                isError: true
            }]);
            setTimeout(scrollToBottom, 0);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="chatbot-container">
            <div className="flag-bar top"></div>
            <div className="flag-bar middle">
                <div className="chatbot-header">
                    <h1>Government RAG Chatbot</h1>
                    <div className="header-controls">
                        {/* Mode Dropdown */}
                        <select
                            className="mode-select"
                            value={mode}
                            onChange={(e) => setMode(e.target.value)}
                        >
                            <option value="text">Text</option>
                            <option value="voice">Voice</option>
                            <option value="video">Video</option>
                        </select>
                        {/* Reference ID input to scope retrieval */}
                        <input
                            type="text"
                            className="input-secondary"
                            style={{ marginLeft: '8px', width: '260px' }}
                            value={referenceId}
                            onChange={(e) => setReferenceId(e.target.value)}
                            placeholder="Optional: reference_id to filter results"
                        />
                    </div>
                </div>
            </div>
            <div className="chatbot-layout">
                {/* Chat Section */}
                <div className="chat-section">
                    <div className="messages-container">
                        {messages.map(msg => (
                            <div key={msg.id} className={`message ${msg.sender}`}>
                                <div className={`bubble ${msg.isError ? 'error' : ''}`}>
                                    <p>{msg.text}</p>
                                    <span className="timestamp">{msg.timestamp}</span>
                                </div>
                            </div>
                        ))}
                        {isLoading && <div className="loading">Processing...</div>}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="input-container">
                        <input
                            type="text"
                            className="input-secondary"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask me about government data..."
                        />
                        <button onClick={sendMessage} disabled={isLoading || !inputText.trim()}>
                            Send
                        </button>
                    </div>
                </div>
            </div>
            <div className="flag-bar bottom"></div>
        </div>
    );
}

export default Chatbot;

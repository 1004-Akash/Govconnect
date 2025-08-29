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

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        try { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); } catch (_) {}
    };

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

            const text = response?.data?.response_text || response?.data?.responseText ||
                (typeof response?.data === 'string' ? response.data : JSON.stringify(response.data));

            const safeText = text?.trim() ? text : 'No response text returned.';

            const botMessage = {
                id: Date.now() + 1,
                text: safeText,
                sender: 'bot',
                timestamp: new Date().toLocaleTimeString()
            };

            setMessages(prev => [...prev, botMessage]);
            setTimeout(scrollToBottom, 0);
        } catch (error) {
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
            <div className="chatbot-header">
                <h1>Government RAG Chatbot</h1>
                <div className="header-controls">
                    <select
                        className="mode-select"
                        value={mode}
                        onChange={(e) => setMode(e.target.value)}
                    >
                        <option value="text">Text</option>
                        <option value="voice">Voice</option>
                        <option value="video">Video</option>
                    </select>
                    <input
                        type="text"
                        className="input-secondary"
                        style={{ width: '260px' }}
                        value={referenceId}
                        onChange={(e) => setReferenceId(e.target.value)}
                        placeholder="Optional: reference_id"
                    />
                </div>
            </div>
            <div className="chatbot-layout">
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
        </div>
    );
}

export default Chatbot;

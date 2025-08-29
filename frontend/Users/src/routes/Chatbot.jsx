import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Card from '../components/Card';
import { ChatEmptyState } from '../components/EmptyState';
import { ChatMessageSkeleton } from '../components/Skeleton';

const BACKEND_URL = 'http://localhost:8000';

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeFolder, setActiveFolder] = useState('Work');
  const [currentChatId, setCurrentChatId] = useState(null);
  const [mode, setMode] = useState('text'); // text, voice, video
  const [language, setLanguage] = useState('en');
  const [referenceId, setReferenceId] = useState('');
  const [backendStatus, setBackendStatus] = useState('checking'); // checking, connected, disconnected
  const messagesEndRef = useRef(null);

  const folders = [
    { id: 'Work', name: 'Work', color: 'bg-blue-500', count: 12 },
    { id: 'Projects', name: 'Projects', color: 'bg-emerald-500', count: 8 },
    { id: 'Clients', name: 'Clients', color: 'bg-purple-500', count: 5 },
    { id: 'Personal', name: 'Personal', color: 'bg-amber-500', count: 3 }
  ];

  const recentChats = [
    { id: 1, title: 'Policy clarification on healthcare', folder: 'Work', timestamp: '2h ago' },
    { id: 2, title: 'Education scheme eligibility', folder: 'Projects', timestamp: '1d ago' },
    { id: 3, title: 'Infrastructure development query', folder: 'Work', timestamp: '3d ago' }
  ];

  const suggestionChips = [
    'Tell me about government schemes',
    'How to report an issue?',
    'What documents do I need?',
    'Explain policy changes'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check backend connection status
  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/health`, { timeout: 5000 });
        if (response.status === 200 && response.data.status === 'healthy') {
          setBackendStatus('connected');
        } else {
          setBackendStatus('disconnected');
        }
      } catch (error) {
        setBackendStatus('disconnected');
      }
    };

    checkBackendStatus();
    
    // Check status every 30 seconds
    const interval = setInterval(checkBackendStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const startNewChat = () => {
    setMessages([]);
    setCurrentChatId(Date.now());
    setInputValue('');
    setReferenceId('');
    
    // Add a single message to show chat area instead of welcome card
    const welcomeMessage = {
      id: Date.now(),
      type: 'bot',
      content: 'New chat started! Ask me anything about government policies, schemes, or civic issues.',
      timestamp: new Date().toISOString()
    };
    
    setMessages([welcomeMessage]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Call backend LLM with TTS support
      const requestPayload = {
        query: inputValue,
        mode: mode,
        language: language,
        reference_id: referenceId || undefined
      };

      console.log('[Chatbot] Sending request:', requestPayload);
      
      const response = await axios.post(`${BACKEND_URL}/chatbot/chat/`, requestPayload);

      console.log('[Chatbot] Backend response:', response.data);

      let botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response.data.response_text || 'I apologize, but I couldn\'t generate a response at the moment.',
        timestamp: new Date().toISOString()
      };

      // Handle TTS responses
      if (mode === 'voice' && response.data.audio) {
        botMessage.audio = response.data.audio;
        botMessage.content += ' 🔊 (Audio response available)';
      } else if (mode === 'video' && response.data.video) {
        botMessage.video = response.data.video;
        botMessage.content += ' 🎥 (Video response available)';
      }

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('[Chatbot] Error calling backend:', error);
      
      let errorMessage = 'I apologize, but I encountered an error while processing your request.';
      
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'The chatbot service is not available. Please check if the backend server is running.';
        } else if (error.response.status === 500) {
          errorMessage = 'The server encountered an internal error. Please try again later.';
        } else {
          errorMessage = `Server error (${error.response.status}): ${error.response.data?.detail || 'Unknown error'}`;
        }
      } else if (error.request) {
        errorMessage = 'Unable to connect to the chatbot service. Please check your internet connection and ensure the backend server is running.';
      }
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: errorMessage,
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, botMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
  };

  // Update the language options array
  const languageOptions = [
    { value: "en", label: "English" },
    { value: "hi", label: "हिंदी (Hindi)" },
    { value: "bn", label: "বাংলা (Bengali)" },
    { value: "te", label: "తెలుగు (Telugu)" },
    { value: "mr", label: "मराठी (Marathi)" },
    { value: "ta", label: "தமிழ் (Tamil)" },
    { value: "ur", label: "اردو (Urdu)" },
    { value: "gu", label: "ગુજરાતી (Gujarati)" },
    { value: "kn", label: "ಕನ್ನಡ (Kannada)" },
    { value: "ml", label: "മലയാളം (Malayalam)" },
    { value: "or", label: "ଓଡ଼ିଆ (Odia)" },
    { value: "pa", label: "ਪੰਜਾਬੀ (Punjabi)" },
    { value: "ne", label: "नेपाली (Nepali)" },
    { value: "es", label: "Español" },
    { value: "fr", label: "Français" },
    { value: "de", label: "Deutsch" },
    { value: "it", label: "Italiano" },
    { value: "pt", label: "Português" },
    { value: "ru", label: "Русский" },
    { value: "ja", label: "日本語" },
    { value: "ko", label: "한국어" },
    { value: "zh", label: "中文" },
    { value: "ar", label: "العربية" },
    { value: "tr", label: "Türkçe" },
    { value: "nl", label: "Nederlands" },
    { value: "pl", label: "Polski" },
    { value: "sv", label: "Svenska" },
    { value: "da", label: "Dansk" },
    { value: "no", label: "Norsk" },
    { value: "fi", label: "Suomi" },
    { value: "th", label: "ไทย" },
    { value: "vi", label: "Tiếng Việt" },
    { value: "id", label: "Bahasa Indonesia" },
    { value: "ms", label: "Bahasa Melayu" },
    { value: "fil", label: "Filipino" },
    { value: "sw", label: "Kiswahili" },
    { value: "af", label: "Afrikaans" },
    { value: "he", label: "עברית" },
    { value: "el", label: "Ελληνικά" },
    { value: "cs", label: "Čeština" },
    { value: "hu", label: "Magyar" },
    { value: "ro", label: "Română" },
    { value: "bg", label: "Български" },
    { value: "hr", label: "Hrvatski" },
    { value: "sk", label: "Slovenčina" },
    { value: "sl", label: "Slovenščina" },
    { value: "et", label: "Eesti" },
    { value: "lv", label: "Latviešu" },
    { value: "lt", label: "Lietuvių" },
    { value: "mt", label: "Malti" },
    { value: "ga", label: "Gaeilge" },
    { value: "cy", label: "Cymraeg" },
    { value: "eu", label: "Euskara" },
    { value: "ca", label: "Català" },
    { value: "gl", label: "Galego" },
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-slate-100">
      <div className="container grid grid-cols-12 gap-4 py-6">
        {/* Sidebar */}
        <div className="col-span-12 md:col-span-3 lg:col-span-3">
          <Card className="p-3 md:p-4 h-[70vh] md:h-[78vh] overflow-y-auto">
            {/* Connection Status */}
            <div className="mb-4 p-3 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-400">Backend Status</h3>
                <div className={`w-2 h-2 rounded-full ${
                  backendStatus === 'connected' ? 'bg-emerald-500' :
                  backendStatus === 'checking' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
              </div>
              <div className="text-xs text-slate-300">
                {backendStatus === 'connected' && '✅ Connected to backend'}
                {backendStatus === 'checking' && '⏳ Checking connection...'}
                {backendStatus === 'disconnected' && '❌ Backend unavailable'}
              </div>
              {backendStatus === 'disconnected' && (
                <div className="mt-2 text-xs text-red-400">
                  Please start the backend server at port 8000
                </div>
              )}
            </div>

            {/* Search Input */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search chats..."
                className="w-full rounded-full border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            {/* Mode Selection */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-slate-400 mb-2">Mode</h3>
              <div className="flex gap-2">
                {['text', 'voice', 'video'].map((modeOption) => (
                  <button
                    key={modeOption}
                    onClick={() => handleModeChange(modeOption)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      mode === modeOption
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {modeOption.charAt(0).toUpperCase() + modeOption.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Language Selection */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-slate-400 mb-2">Language</h3>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Reference ID Input */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-slate-400 mb-2">Reference ID (Optional)</h3>
              <input
                type="text"
                placeholder="Enter reference ID"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            {/* Folder List */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-400 mb-3">Folders</h3>
              <div className="space-y-1">
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => setActiveFolder(folder.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                      activeFolder === folder.id
                        ? 'bg-slate-700 text-white'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${folder.color}`}></div>
                      <span className="text-sm">{folder.name}</span>
                    </div>
                    <span className="text-xs text-slate-500">{folder.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Chats */}
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-3">Recent Chats</h3>
              <div className="space-y-2">
                {recentChats.map((chat) => (
                  <div
                    key={chat.id}
                    className="px-3 py-2 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <div className="text-sm text-slate-200 mb-1 line-clamp-1">
                      {chat.title}
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{chat.folder}</span>
                      <span>{chat.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* New Chat Button */}
            <button 
              onClick={startNewChat}
              className="btn-primary w-full mt-3"
            >
              New Chat
            </button>
          </Card>
        </div>

        {/* Main Panel */}
        <div className="col-span-12 md:col-span-9 lg:col-span-9">
          {messages.length === 0 ? (
            /* Welcome Card */
            <Card className="p-6 md:p-10 text-center mx-auto max-w-3xl">
              <h1 className="text-3xl md:text-4xl font-semibold mb-6 text-slate-100">
                Welcome to GovConnect AI
              </h1>
              <p className="text-slate-300 mb-8 text-lg">
                Ask me anything about government policies, schemes, or civic issues. I'm here to help!
              </p>
              
              {/* Current Settings Display */}
              <div className="mb-6 p-4 bg-slate-800/60 rounded-2xl border border-slate-700">
                <h3 className="text-lg font-medium text-slate-200 mb-3">Current Settings</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="text-center">
                    <div className="text-slate-400">Mode</div>
                    <div className="text-emerald-400 font-medium">{mode}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-400">Language</div>
                    <div className="text-emerald-400 font-medium">{language}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-400">Reference ID</div>
                    <div className="text-emerald-400 font-medium">{referenceId || 'None'}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-400">Chat ID</div>
                    <div className="text-emerald-400 font-medium">{currentChatId || 'New'}</div>
                  </div>
                </div>
                
                {/* Backend Connection Status */}
                <div className="mt-4 pt-4 border-t border-slate-600">
                  <div className="flex items-center justify-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      backendStatus === 'connected' ? 'bg-emerald-500' :
                      backendStatus === 'checking' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-xs text-slate-300">
                      {backendStatus === 'connected' && 'Backend Connected'}
                      {backendStatus === 'checking' && 'Checking Backend...'}
                      {backendStatus === 'disconnected' && 'Backend Disconnected'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Feature Tiles */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {['Saved prompts', 'Media type', 'Multilingual', 'Analytics'].map((feature) => (
                  <div
                    key={feature}
                    className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4 hover:scale-[1.01] transition-transform cursor-pointer"
                  >
                    <div className="text-2xl mb-2">✨</div>
                    <div className="text-sm text-slate-300">{feature}</div>
                  </div>
                ))}
              </div>

              {/* Suggestion Chips */}
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestionChips.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-3 py-1 rounded-full border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors text-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </Card>
          ) : (
            /* Chat Area */
            <div className="space-y-4">
              {/* Chat Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-slate-100">
                    Chat #{currentChatId}
                  </h2>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-slate-700 rounded-full text-xs text-slate-300">
                      {mode}
                    </span>
                    <span className="px-2 py-1 bg-slate-700 rounded-full text-xs text-slate-300">
                      {language}
                    </span>
                    {referenceId && (
                      <span className="px-2 py-1 bg-emerald-700 rounded-full text-xs text-emerald-300">
                        Ref: {referenceId}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={startNewChat}
                  className="btn-primary"
                >
                  New Chat
                </button>
              </div>

              <div className="mt-6 h-[52vh] md:h-[58vh] overflow-y-auto space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-3 shadow ${
                        message.type === 'user'
                          ? 'bg-emerald-600 text-white rounded-br-sm'
                          : message.isError
                          ? 'bg-red-800/80 border border-red-700 rounded-bl-sm'
                          : 'bg-slate-800/80 border border-slate-700 rounded-bl-sm'
                      }`}
                    >
                      <div className="text-sm">{message.content}</div>
                      
                      {/* Audio/Video Controls */}
                      {message.audio && (
                        <div className="mt-2">
                          <audio controls className="w-full">
                            <source src={`data:audio/mpeg;base64,${message.audio}`} type="audio/mpeg" />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      )}
                      
                      {message.video && (
                        <div className="mt-2">
                          <video controls className="w-full rounded-lg">
                            <source src={`data:video/mp4;base64,${message.video}`} type="video/mp4" />
                            Your browser does not support the video element.
                          </video>
                        </div>
                      )}
                      
                      <div className="block text-[10px] text-slate-400 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && <ChatMessageSkeleton />}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              <div className="sticky bottom-2">
                <Card className="p-2 flex items-center gap-2">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 input-round bg-transparent resize-none min-h-[40px] max-h-[120px]"
                    rows={1}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    className="btn-primary px-4 py-2"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                      </svg>
                    )}
                  </button>
                </Card>

                {/* Suggestion Chips */}
                <div className="mb-2 flex flex-wrap gap-2 text-xs">
                  {suggestionChips.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-3 py-1 rounded-full border border-slate-600 text-slate-400 hover:bg-slate-800 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

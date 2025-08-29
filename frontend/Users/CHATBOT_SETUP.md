# 🤖 GovConnect AI Chatbot Setup Guide

## 🚀 Quick Start

### 1. Start the Backend Server
```bash
cd backend
python start_server.py
```
The backend will be available at `http://localhost:8000`

### 2. Start the Frontend
```bash
cd frontend/Users
npm run dev
```
The frontend will be available at `http://localhost:5173`

## 🔧 Backend Features

### Chatbot API Endpoints
- **POST** `/chatbot/chat/` - Main chat endpoint
- **GET** `/chatbot/languages/` - Get supported languages
- **GET** `/chatbot/tts` - Text-to-speech endpoint

### Request Format
```json
{
  "query": "Your question here",
  "mode": "text|voice|video",
  "language": "en|hi|ta|te|bn|mr|gu|kn|ml|pa",
  "reference_id": "optional_dataset_filter"
}
```

### Response Format
```json
{
  "response_text": "AI generated response",
  "audio": "base64_audio_data",
  "video": "base64_video_data"
}
```

## 🎯 Frontend Features

### Chat Interface
- **Real-time LLM responses** from backend
- **Multiple modes**: Text, Voice, Video
- **Multilingual support**: 22 Indian languages
- **Reference ID filtering** for specific datasets
- **New Chat functionality** to start fresh conversations

### Sidebar Controls
- **Mode Selection**: Choose between text, voice, or video responses
- **Language Selection**: Support for major Indian languages
- **Reference ID**: Optional filter for specific data sources
- **Folder Organization**: Categorize chats by work, projects, etc.
- **Recent Chats**: Quick access to previous conversations

### Chat Features
- **Real-time messaging** with backend LLM
- **Loading states** and error handling
- **Suggestion chips** for common queries
- **Chat history** with timestamps
- **Responsive design** for all devices

## 🌐 API Integration

The chatbot connects to the backend using:
- **Base URL**: `http://localhost:8000`
- **Endpoint**: `/chatbot/chat/`
- **Method**: POST
- **Headers**: Content-Type: application/json

## 🛠️ Troubleshooting

### Backend Issues
1. **Port 8000 already in use**: Change port in `start_server.py`
2. **Missing dependencies**: Run `pip install -r requirements.txt`
3. **MongoDB connection**: Ensure MongoDB is running locally

### Frontend Issues
1. **CORS errors**: Backend has CORS enabled for all origins
2. **Network errors**: Check if backend is running on port 8000
3. **Tailwind CSS issues**: Ensure all dependencies are installed

## 📱 Usage Examples

### Basic Chat
1. Type your question in the input field
2. Press Enter or click Send
3. Get AI-generated response from backend LLM

### Voice Mode
1. Select "Voice" mode from sidebar
2. Type your question
3. Receive audio response (if backend supports it)

### Video Mode
1. Select "Video" mode from sidebar
2. Type your question
3. Receive video response (if backend supports it)

### Multilingual Support
1. Select language from dropdown (e.g., Hindi, Tamil)
2. Type question in any language
3. Get response in selected language

## 🔒 Security Notes

- Backend CORS is set to allow all origins (`*`) for development
- In production, restrict CORS to specific frontend domains
- Reference ID filtering helps control data access
- All API calls are logged for monitoring

## 📚 Additional Resources

- **Backend API Docs**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/health`
- **Backend Source**: `backend/` directory
- **Frontend Source**: `frontend/Users/` directory

from pydantic import BaseModel
from typing import Optional

class DocumentIn(BaseModel):
    title: str
    content: str
    reference_id: Optional[str] = None

class FetchIn(BaseModel):
    title: str
    reference_id: str

class ChatRequest(BaseModel):
    query: str
    mode: str = "text"  # text, voice, or video
    language: Optional[str] = None  # Any language code supported by ElevenLabs
    reference_id: Optional[str] = None  # Optional dataset filter for retrieval

class ChatResponse(BaseModel):
    response_text: str
    audio: Optional[bytes] = None
    video: Optional[bytes] = None
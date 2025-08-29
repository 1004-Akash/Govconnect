from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
import io
from models.schemas import ChatRequest, ChatResponse
from services.embedder import embed_text
from services.vector_db import search_embeddings
from services.llm import query_llm, query_llm_with_context
from services.tts import text_to_speech, get_supported_languages
from services.video import text_audio_to_video
from typing import List, Dict
import re
import base64
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# --- Helper: deterministic extractor for key-value rows ---
def _extract_answer_from_context(user_query: str, context: str) -> str | None:
    try:
        q = user_query.lower()
        # Determine target key from query
        if ("revised" in q) or ("re" in q and "estimate" in q):
            target_key = "revised_estimates_re_"
            key_label = "revised estimate"
        elif ("actual" in q) or ("actuals" in q):
            target_key = "actuals"
            key_label = "actuals"
        else:
            target_key = "budget_estimates_be_"
            key_label = "budget estimate"

        # Extract target year from query (supports 2020-21, 2020/21, or 2020)
        m = re.search(r"(20\d{2})\s*[-/ ]?\s*(\d{2})?", q)
        year_token = None
        if m:
            y1 = m.group(1)
            y2 = m.group(2)
            if y2:
                year_token = f"{y1[-2:]}{y2}"
            # We will match either full format or start year
        # Parse context rows and search
        best_line = None
        for line in context.split("\n"):
            l = line.strip()
            if not l:
                continue
            if "financial_year" in l:
                # quick year checks
                if year_token and year_token not in re.sub(r"\D", "", l):
                    # If we have a compact year token like 202021, skip lines that don't contain it
                    pass  # still allow below fallback
                # Try to find explicit year match like 2020-21 or 2020/21 or 2020
                if (m and (y1 in l or (y2 and (f"{y1}-{y2}" in l or f"{y1}/{y2}" in l)))) or (not m):
                    if target_key in l:
                        best_line = l
                        break
        if not best_line:
            # fallback: pick the first line with target key
            for line in context.split("\n"):
                if target_key in line:
                    best_line = line
                    break
        if not best_line:
            return None
        # Extract number for the key
        num_match = re.search(rf"{re.escape(target_key)}\s*[:=]\s*([0-9,\.]+)", best_line)
        if not num_match:
            # Sometimes key-value pairs are separated by semicolons with spaces
            num_match = re.search(rf"{re.escape(target_key)}\s*[:=]?\s*([0-9,\.]+)", best_line)
        if not num_match:
            return None
        val = num_match.group(1).replace(",", "")
        # Extract year text to report back
        year_text_match = re.search(r"financial_year\s*[:=]\s*([^;\n]+)", best_line, flags=re.IGNORECASE)
        year_text = year_text_match.group(1).strip() if year_text_match else "the requested year"
        return f"The {key_label} for {year_text} is {val}."
    except Exception:
        return None

# --- Helper: snippet fallback by comparing query keywords to retrieved texts ---
def _snippets_from_results(user_query: str, results: list, max_chars: int = 600) -> str | None:
    try:
        q = user_query.lower()
        # Build simple keyword set (drop very short words)
        words = [w for w in re.findall(r"[a-zA-Z0-9_-]+", q) if len(w) >= 3]
        if not words:
            return None
        scored = []
        for r in results:
            t = r.get("text", "") or ""
            if not t:
                continue
            lw = t.lower()
            score = sum(1 for w in words if w in lw) + float(r.get("score", 0))
            if score > 0:
                scored.append((score, t))
        if not scored:
            return None
        scored.sort(reverse=True, key=lambda x: x[0])
        answer = []
        total = 0
        for _, text in scored[:3]:
            cleaned = text.strip()
            if not cleaned:
                continue
            if cleaned not in answer:
                take = cleaned[:max(200, max_chars // 3)]
                answer.append(take)
                total += len(take)
                if total >= max_chars:
                    break
        if not answer:
            return None
        return "\n".join(answer)
    except Exception:
        return None

@router.get("/languages/")
def get_languages():
    """Get list of supported languages"""
    return {"languages": get_supported_languages()}

@router.post("/chat/")
def chat(request: ChatRequest):
    try:
        # Embed the user query
        query_embedding = embed_text(request.query)
        # Search Qdrant for relevant chunks (fetch more to improve recall)
        results = search_embeddings(query_embedding, top_k=20, reference_id=request.reference_id)

        # Build context from search results (prioritize row-style chunks if present)
        texts = []
        seen = set()
        for r in results:
            t = r.get("text", "") or ""
            if t:
                if t in seen:
                    continue
                seen.add(t)
                texts.append(t)
        # Cap context size to avoid overlong prompts
        context = "\n".join(texts)[:8000]

        # Guard: no context
        if not context.strip():
            response_text = "I don't know based on the current knowledge base."
            language = request.language or "en"
            if request.mode == "voice":
                audio_base64 = text_to_speech(response_text, language)
                if audio_base64:
                    return ChatResponse(
                        response_text=response_text,
                        audio=audio_base64,
                        video=None
                    )
                else:
                    return ChatResponse(
                        response_text=response_text + "\n\n[Note: Audio generation failed, showing text response]",
                        audio=None,
                        video=None
                    )
            elif request.mode == "video":
                audio_base64 = text_to_speech(response_text, language)
                video_bytes = text_audio_to_video(response_text, audio_base64)
                bio = io.BytesIO(video_bytes)
                headers = {
                    "Content-Disposition": "inline; filename=response.mp4",
                    "Accept-Ranges": "bytes",
                }
                return StreamingResponse(bio, media_type="video/mp4", headers=headers)
            return ChatResponse(response_text=response_text, audio=None, video=None)

        # Primary: standard RAG call with top chunks
        top_chunks = [r.get("text", "") or "" for r in results]
        
        # Generate response text with error handling
        try:
            response_text = query_llm_with_context(request.query, top_chunks, max_chunks=8)
        except Exception as llm_error:
            logger.error(f"LLM error: {llm_error}")
            # Fallback response using context
            if top_chunks:
                context_summary = "\n".join(top_chunks[:3])
                response_text = f"Based on the available information:\n\n{context_summary}\n\nI found some relevant data, but couldn't generate a complete response due to a technical issue. Please try rephrasing your question."
            else:
                response_text = "I'm experiencing technical difficulties with the language model. Please try again in a moment."
        
        # Handle different response types
        if request.mode == "voice":
            # Generate audio using the imported TTS function
            audio_base64 = text_to_speech(response_text, request.language or "en")
            if audio_base64:
                return ChatResponse(
                    response_text=response_text,
                    audio=audio_base64,
                    video=None
                )
            else:
                # Fallback to text if TTS fails
                return ChatResponse(
                    response_text=response_text + "\n\n[Note: Audio generation failed, showing text response]",
                    audio=None,
                    video=None
                )
        elif request.mode == "video":
            # Handle video mode if needed
            return ChatResponse(
                response_text=response_text,
                audio=None,
                video=None
            )
        else:
            # Text mode
            return ChatResponse(
                response_text=response_text,
                audio=None,
                video=None
            )
            
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        return ChatResponse(
            response_text=f"Error: {str(e)}",
            audio=None,
            video=None
        )

@router.get("/tts")
def tts(text: str = Query("Hello!"), language: str = Query("en")):
    """Simple GET endpoint to stream TTS audio for direct browser playback."""
    audio_base64 = text_to_speech(text, language=language)
    if audio_base64:
        # Convert base64 back to bytes for streaming
        audio_bytes = base64.b64decode(audio_base64)
        bio = io.BytesIO(audio_bytes)
        headers = {
            "Content-Disposition": "inline; filename=tts.mp3",
            "Accept-Ranges": "bytes",
        }
        return StreamingResponse(bio, media_type="audio/mpeg", headers=headers)
    else:
        return {"error": "TTS generation failed"}
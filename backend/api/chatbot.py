from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
import io
from models.schemas import ChatRequest, ChatResponse
from services.embedder import embed_text
from services.vector_db import search_embeddings
from services.llm import query_llm, query_llm_with_context
from services.tts import text_to_speech
from services.video import text_audio_to_video
from typing import List, Dict
import re

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

@router.get("/languages/", response_model=List[Dict[str, str]])
def get_supported_languages():
    """Returns a list of supported Indian languages and their codes for TTS."""
    languages = [
        {"name": "Hindi", "code": "hi"},
        {"name": "Bengali", "code": "bn"},
        {"name": "Telugu", "code": "te"},
        {"name": "Marathi", "code": "mr"},
        {"name": "Tamil", "code": "ta"},
        {"name": "Urdu", "code": "ur"},
        {"name": "Gujarati", "code": "gu"},
        {"name": "Kannada", "code": "kn"},
        {"name": "Malayalam", "code": "ml"},
        {"name": "Odia", "code": "or"},
        {"name": "Punjabi", "code": "pa"},
        {"name": "Assamese", "code": "as"},
        {"name": "Maithili", "code": "mai"},
        {"name": "Santali", "code": "sat"},
        {"name": "Kashmiri", "code": "ks"},
        {"name": "Nepali", "code": "ne"},
        {"name": "Konkani", "code": "kok"},
        {"name": "Sindhi", "code": "sd"},
        {"name": "Sanskrit", "code": "sa"},
        {"name": "Dogri", "code": "doi"},
        {"name": "Manipuri", "code": "mni"},
        {"name": "Bodo", "code": "brx"},
    ]
    return languages

@router.post("/chat/")
def chat(request: ChatRequest):
    # Embed the user query
    query_embedding = embed_text(request.query)
    # Search Qdrant for relevant chunks (fetch more to improve recall)
    results = search_embeddings(query_embedding, top_k=20, reference_id=request.reference_id)

    # Build context from search results (prioritize row-style chunks if present)
    texts = []
    seen = set()
    for r in results:
        t = r.get("text", "")
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
            audio_bytes = text_to_speech(response_text, language=language)
            bio = io.BytesIO(audio_bytes)
            headers = {
                "Content-Disposition": "inline; filename=response.mp3",
                "Accept-Ranges": "bytes",
            }
            return StreamingResponse(bio, media_type="audio/mpeg", headers=headers)
        elif request.mode == "video":
            audio_bytes = text_to_speech(response_text, language=language)
            video_bytes = text_audio_to_video(response_text, audio_bytes)
            bio = io.BytesIO(video_bytes)
            headers = {
                "Content-Disposition": "inline; filename=response.mp4",
                "Accept-Ranges": "bytes",
            }
            return StreamingResponse(bio, media_type="video/mp4", headers=headers)
        return ChatResponse(response_text=response_text, audio=None, video=None)

    # Few-shot example for tabular/row key-value extraction and synonyms mapping
    example_context = """
financial_year: 2020-21; budget_estimates_be_: 690500; revised_estimates_re_: 510000; actuals: 480000
financial_year: 2021-22; budget_estimates_be_: 630000; revised_estimates_re_: 670000; actuals: 600000
financial_year: 2022-23; budget_estimates_be_: 780000; revised_estimates_re_: 850000; actuals: 820000
"""
    example_qa = """
Instruction: The Context contains rows with keys like financial_year, budget_estimates_be_, revised_estimates_re_, actuals. When asked for a value, locate the row by financial_year (or closest match like 2021-22 matches 2021/22 or 2021) and return the exact numeric value from the appropriate key. Map common phrases to keys as follows: "budget estimate" -> budget_estimates_be_, "revised estimate" -> revised_estimates_re_, "actuals" -> actuals. Return only the answer sentence with the exact value. If no matching row/key exists, say: "I don't know".

User: What is the budget estimate for 2020-21?
Answer: The budget estimate for 2020-21 is 690500.

User: Give revised estimate for 2021-22.
Answer: The revised estimate for 2021-22 is 670000.

User: What were the actuals in 2022-23?
Answer: The actuals for 2022-23 are 820000.
"""
    # Primary: standard RAG call with top chunks
    top_chunks = [r.get("text", "") or "" for r in results]
    response_text = query_llm_with_context(request.query, top_chunks, max_chunks=8)

    # Fallback: deterministic extraction if model still answers with "I don't know"
    if not response_text or response_text.strip().lower().startswith("i don't know"):
        extracted = _extract_answer_from_context(request.query, context)
        if extracted:
            response_text = extracted

    # Second fallback: return top relevant snippets from retrieved context
    if not response_text or response_text.strip().lower().startswith("i don't know"):
        snips = _snippets_from_results(request.query, results)
        if snips:
            response_text = snips

    language = request.language or "en"
    if request.mode == "voice":
        audio_bytes = text_to_speech(response_text, language=language)
        bio = io.BytesIO(audio_bytes)
        headers = {
            "Content-Disposition": "inline; filename=response.mp3",
            "Accept-Ranges": "bytes",
        }
        return StreamingResponse(bio, media_type="audio/mpeg", headers=headers)
    elif request.mode == "video":
        audio_bytes = text_to_speech(response_text, language=language)
        video_bytes = text_audio_to_video(response_text, audio_bytes)
        bio = io.BytesIO(video_bytes)
        headers = {
            "Content-Disposition": "inline; filename=response.mp4",
            "Accept-Ranges": "bytes",
        }
        return StreamingResponse(bio, media_type="video/mp4", headers=headers)
    return ChatResponse(response_text=response_text, audio=None, video=None)

@router.get("/tts")
def tts(text: str = Query("Hello!"), language: str = Query("en")):
    """Simple GET endpoint to stream TTS audio for direct browser playback."""
    audio_bytes = text_to_speech(text, language=language)
    bio = io.BytesIO(audio_bytes)
    headers = {
        "Content-Disposition": "inline; filename=tts.mp3",
        "Accept-Ranges": "bytes",
    }
    return StreamingResponse(bio, media_type="audio/mpeg", headers=headers)
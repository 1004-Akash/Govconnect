import os
from pathlib import Path
from dotenv import load_dotenv
import requests
from typing import List

# Load .env from backend folder (same as vector_db.py)
BASE_DIR = Path(__file__).resolve().parent.parent
env_path = BASE_DIR / ".env"
load_dotenv(dotenv_path=env_path)

# Fallback to hardcoded key if env is missing (not recommended for production)
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY") or "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"
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openai/gpt-3.5-turbo")


def _post_openrouter(messages: List[dict], model: str) -> str:
    if not OPENROUTER_API_KEY or OPENROUTER_API_KEY.strip() == "":
        return "LLM unavailable: set OPENROUTER_API_KEY in backend/.env."

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "Government RAG Chatbot",
    }
    data = {"model": model, "messages": messages}
    try:
        resp = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=data,
            timeout=30
        )
        if resp.status_code == 402:
            return "LLM request blocked (402 Payment Required) by OpenRouter. Verify the key/plan or try a free/allowlisted model."
        resp.raise_for_status()
        result = resp.json()
        return result["choices"][0]["message"]["content"]
    except requests.HTTPError:
        try:
            detail = resp.json().get("error", "")
        except Exception:
            detail = ""
        return f"LLM request failed ({resp.status_code}). {detail}"
    except Exception as e:
        return f"LLM request failed: {e}"


def query_llm(prompt: str) -> str:
    """Query LLM via OpenRouter. Returns readable errors instead of raising."""
    messages = [
        {"role": "system", "content": "You are a helpful assistant for government policy, schemes, and budget queries."},
        {"role": "user", "content": prompt},
    ]
    return _post_openrouter(messages, OPENROUTER_MODEL)


def query_llm_with_context(query: str, context_chunks: List[str], max_chunks: int = 8) -> str:
    """RAG helper: send the user query plus top retrieved chunks to the LLM.
    - Chunks are concatenated with separators and IDs.
    - The model is instructed to answer strictly from the chunks.
    """
    # Trim and deduplicate chunks
    seen = set()
    cleaned: List[str] = []
    for t in context_chunks:
        if not t:
            continue
        s = str(t).strip()
        if not s or s in seen:
            continue
        seen.add(s)
        cleaned.append(s)
        if len(cleaned) >= max_chunks:
            break

    context_text = "\n\n---\n\n".join(cleaned)

    system_prompt = (
        "You are a precise data assistant for Indian government data. "
        "Answer using ONLY the provided chunks. If the answer isn't explicitly present, reply exactly: 'I don't know'. "
        "When reporting numbers, repeat them exactly as written. Be concise. "
        "If the user's question asks for a single value (e.g., a specific year or metric), respond with one short sentence like 'The <metric> for <year> is <value>.' "
        "If the question is broad or asks to summarize a row, respond with a very short bullet list of 'key: value' items from the relevant chunk(s). "
        "Map common phrases to keys where applicable: 'budget estimate' -> budget_estimates_be_, 'revised estimate' -> revised_estimates_re_, 'actuals' or 'actual collection' -> actuals/actual_collection."
    )

    user_prompt = (
        f"Context Chunks:\n{context_text}\n\n"
        f"User Question: {query}\n\n"
        f"Format per the system instructions above."
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]
    return _post_openrouter(messages, OPENROUTER_MODEL)

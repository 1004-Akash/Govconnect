import os
from pathlib import Path
from dotenv import load_dotenv
import requests
from typing import List
import openai
from openai import OpenAI

# Load .env from backend folder (same as vector_db.py)
BASE_DIR = Path(__file__).resolve().parent.parent
env_path = BASE_DIR / ".env"
load_dotenv(dotenv_path=env_path)

# Fallback to hardcoded key if env is missing (not recommended for production)
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY") or "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"
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openai/gpt-3.5-turbo")

# Add this at the top of your llm.py file to fix the OpenRouter client issue
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="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"
)

# Update your query_llm_with_context function to use the new client format
def query_llm_with_context(query: str, context_chunks: List[str], max_chunks: int = 5) -> str:
    try:
        # Use the new client format
        response = client.chat.completions.create(
            model="openai/gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful government data assistant..."},
                {"role": "user", "content": f"Context: {context_chunks}\n\nQuery: {query}"}
            ],
            max_tokens=500,
            temperature=0.7
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        logger.error(f"LLM error: {e}")
        raise e


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
        "You are a helpful government data assistant. Provide natural, flowing text responses like ChatGPT.\n\n"
        
        "RESPONSE FORMATTING RULES:\n"
        "1. **Write in natural, conversational language**\n"
        "2. **Use complete sentences and paragraphs**\n"
        "3. **NO bullet points, NO dashes, NO structured formatting**\n"
        "4. **Flow naturally from one point to the next**\n"
        "5. **Use proper punctuation and grammar**\n"
        "6. **Make it sound like a human explaining the information**\n\n"
        
        "EXAMPLE FORMATS:\n"
        "❌ WRONG (structured):\n"
        "• Project: Name - Location: Place - Cost: Amount\n\n"
        
        "✅ CORRECT (natural text):\n"
        "The government has sanctioned several projects in Karnataka. In Hampi, there is a project with a budget of 25.64 crore rupees. Additionally, in Mysuru, an Ecological Experience Zone project has been approved with a cost of 18.47 crore rupees.\n\n"
        
        "For budget questions: 'The budget estimate for 2019-20 is 663343 crore rupees.'\n\n"
        "IMPORTANT: Always write in flowing, natural text. Never use bullet points or structured formats."
    )

    user_prompt = (
        f"Context Chunks:\n{context_text}\n\n"
        f"User Question: {query}\n\n"
        "Provide a natural, flowing text response. Write in complete sentences like ChatGPT would. Do not use bullet points or structured formatting."
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]
    return _post_openrouter(messages, OPENROUTER_MODEL)

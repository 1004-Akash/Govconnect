import io
from gtts import gTTS

# Map our language codes to gTTS codes (subset supported by gTTS)
LANG_MAP = {
    "en": "en",
    "hi": "hi",
    "bn": "bn",
    "te": "te",
    "mr": "mr",
    "ta": "ta",
    "ur": "ur",
    "gu": "gu",
    "kn": "kn",
    "ml": "ml",
    "or": "or",
    "pa": "pa",
    "ne": "ne",
}

def text_to_speech(text: str, language: str = "en") -> bytes:
    """Converts text to speech using gTTS. Returns MP3 bytes."""
    lang = LANG_MAP.get(language, "en")
    buf = io.BytesIO()
    gTTS(text=text, lang=lang).write_to_fp(buf)
    return buf.getvalue()

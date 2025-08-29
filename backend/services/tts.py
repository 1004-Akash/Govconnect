import io
import base64
from gtts import gTTS
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Map our language codes to gTTS codes
LANG_MAP = {
    "en": "en",
    "hi": "hi",      # Hindi
    "bn": "bn",      # Bengali
    "te": "te",      # Telugu
    "mr": "mr",      # Marathi
    "ta": "ta",      # Tamil
    "ur": "ur",      # Urdu
    "gu": "gu",      # Gujarati
    "kn": "kn",      # Kannada
    "ml": "ml",      # Malayalam
    "or": "or",      # Odia
    "pa": "pa",      # Punjabi
    "ne": "ne",      # Nepali
}

def text_to_speech(text: str, language: str = "en") -> str:
    """Converts text to speech using gTTS. Returns base64 encoded string."""
    try:
        # Get the language code
        lang = LANG_MAP.get(language, "en")
        logger.info(f"Converting text to speech in language: {lang}")
        
        # Create TTS object - this will read English text in the target language voice
        tts = gTTS(text=text, lang=lang, slow=False)
        
        # Save to bytes buffer
        buf = io.BytesIO()
        tts.write_to_fp(buf)
        buf.seek(0)
        
        # Convert to base64
        audio_bytes = buf.getvalue()
        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        
        logger.info(f"Successfully generated audio for text: {text[:50]}...")
        return audio_base64
        
    except Exception as e:
        logger.error(f"Error in text_to_speech: {e}")
        return None

def get_supported_languages() -> dict:
    """Get list of supported languages with names"""
    language_names = {
        "en": "English",
        "hi": "हिंदी (Hindi)",
        "bn": "বাংলা (Bengali)",
        "te": "తెలుగు (Telugu)",
        "mr": "मराठी (Marathi)",
        "ta": "தமிழ் (Tamil)",
        "ur": "اردو (Urdu)",
        "gu": "ગુજરાતી (Gujarati)",
        "kn": "ಕನ್ನಡ (Kannada)",
        "ml": "മലയാളം (Malayalam)",
        "or": "ଓଡ଼ିଆ (Odia)",
        "pa": "ਪੰਜਾਬੀ (Punjabi)",
        "ne": "नेपाली (Nepali)",
    }
    
    return {code: name for code, name in language_names.items() if code in LANG_MAP}

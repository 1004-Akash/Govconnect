from typing import Optional
import os

_hf_pipeline = None


def _load_pipeline():
    global _hf_pipeline
    if _hf_pipeline is None:
        try:
            cache_dir = os.getenv("TRANSFORMERS_CACHE")
            if cache_dir and not os.path.isdir(cache_dir):
                try:
                    os.makedirs(cache_dir, exist_ok=True)
                except Exception:
                    pass
            from transformers import pipeline
            model_name = os.getenv(
                "HF_SENTIMENT_MODEL",
                "cardiffnlp/twitter-roberta-base-sentiment",
            )
            kwargs = {}
            if cache_dir:
                kwargs["cache_dir"] = cache_dir
            _hf_pipeline = pipeline(
                "sentiment-analysis",
                model=model_name,
                top_k=None,
                **kwargs,
            )
            print(f"Sentiment model {model_name} loaded successfully.")
        except Exception as e:
            print(f"Failed to load sentiment model: {e}")
            _hf_pipeline = "FAILED"
    return _hf_pipeline


def preload_model() -> None:
    try:
        _load_pipeline()
    except Exception as e:
        print(f"Preload failed: {e}")


def _normalize_label(label: str) -> str:
    l = (label or "").lower()
    if "neg" in l or l in {"label_0", "1 star", "2 stars"}:
        return "negative"
    if "pos" in l or l in {"label_2", "4 stars", "5 stars"}:
        return "positive"
    if "neu" in l or l in {"label_1", "3 stars"}:
        return "neutral"
    return "neutral"


def analyze_sentiment(text: Optional[str]) -> str:
    if not text or not str(text).strip():
        return "neutral"
    try:
        nlp = _load_pipeline()
        if nlp == "FAILED" or nlp is None:
            return "neutral"
            
        outputs = nlp(text)
        if isinstance(outputs, list) and outputs:
            result = outputs[0]
            if isinstance(result, dict) and "label" in result:
                raw_label = result.get("label")
                label = _normalize_label(raw_label)
                if label == "neutral":
                    return "neutral"
                score = float(result.get("score", 0.5))
                neutral_band = float(os.getenv("SENTIMENT_NEUTRAL_BAND", "0.0"))
                if neutral_band > 0 and abs(score - 0.5) <= neutral_band:
                    return "neutral"
                return label
    except Exception:
        pass
    return "neutral"

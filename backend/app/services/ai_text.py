import logging
import re

from app.services.ml_models import model_manager

logger = logging.getLogger(__name__)

SHORT_TEXT_WORD_COUNT = 50
MODERATE_TEXT_WORD_COUNT = 150

def _word_list(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z']+", text.lower())

def analyze_ai_likelihood(text: str) -> dict:
    words = _word_list(text)
    word_count = len(words)
    
    if word_count < SHORT_TEXT_WORD_COUNT:
        return {
            "ai_likelihood_score": 0.5,
            "confidence": "low",
            "reasons": [f"Text is extremely short ({word_count} words). Not enough context for deep learning analysis."],
            "word_count": word_count,
        }
    
    # Pass the original text directly so punctuation and grammar are preserved for the model.
    # We use truncation=True to ensure it doesn't crash on texts longer than 512 tokens.
    try:
        classifier = model_manager.text_classifier
        result = classifier(text, truncation=True, max_length=512)[0]
    except Exception:
        # Fallback if model fails to load or infer - the detail stays in the
        # server log, the user just gets told the check couldn't run
        logger.exception("AI text classifier failed during inference")
        return {
            "ai_likelihood_score": 0.5,
            "confidence": "low",
            "reasons": ["Deep learning inference failed (error logged server-side)."],
            "word_count": word_count,
        }
        
    label = result['label']
    raw_score = result['score']
    
    # If the model thinks it is "Fake", likelihood is high. If "Real", likelihood is low.
    ai_likelihood = raw_score if label == "Fake" else (1.0 - raw_score)
    
    # Add artificial bounds so the panel never sees a suspicious "0%" or "100%"
    ai_likelihood = max(0.02, min(0.98, ai_likelihood))
    score = round(ai_likelihood, 3)
    
    if word_count < MODERATE_TEXT_WORD_COUNT:
        confidence = "moderate"
    else:
        confidence = "high" if abs(score - 0.5) > 0.25 else "moderate"

    reasons = []
    if score > 0.8:
        reasons.append("Deep learning model (RoBERTa) classified this text as highly likely to be AI-generated.")
    elif score > 0.5:
        reasons.append("Model detected some AI-like patterns, but the signal is mixed.")
    elif score < 0.2:
        reasons.append("Model classified this text as highly likely to be human-written.")
    else:
        reasons.append("Text appears largely human, but some structures resemble AI generation.")

    if word_count < MODERATE_TEXT_WORD_COUNT:
        reasons.append("Text is relatively short, which can lower confidence.")

    return {
        "ai_likelihood_score": score,
        "confidence": confidence,
        "reasons": reasons,
        "word_count": word_count,
    }

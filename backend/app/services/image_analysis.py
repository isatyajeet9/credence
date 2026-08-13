import io
import logging

import c2pa
import numpy as np
from PIL import ExifTags, Image, ImageFilter

logger = logging.getLogger(__name__)

CAMERA_EXIF_TAGS = {"Make", "Model", "GPSInfo", "ExposureTime", "FNumber", "ISOSpeedRatings", "FocalLength"}


def check_provenance(image_bytes: bytes, mime_type: str) -> dict:
    """
    Looks for a real C2PA content-credentials manifest embedded in the file.
    Most images (screenshots, casual photos, most AI generators) won't have
    one - that absence isn't itself proof of anything, it just means there's
    no cryptographic provenance trail to check.
    """
    try:
        with c2pa.Reader(mime_type, io.BytesIO(image_bytes)) as reader:
            manifest_json = reader.json()
        return {"has_manifest": True, "manifest": manifest_json}
    except c2pa.C2paError:
        return {"has_manifest": False, "manifest": None}


def _exif_signal(image: Image.Image) -> tuple[bool, list[str]]:
    exif = image.getexif()
    found_tags = set()
    if exif:
        for tag_id in exif:
            tag_name = ExifTags.TAGS.get(tag_id)
            if tag_name in CAMERA_EXIF_TAGS:
                found_tags.add(tag_name)
    return bool(found_tags), sorted(found_tags)





from app.services.ml_models import model_manager

def analyze_image(image_bytes: bytes, mime_type: str) -> dict:
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image.load()

    has_camera_exif, exif_tags_found = _exif_signal(image)
    provenance = check_provenance(image_bytes, mime_type)

    score = 0.5
    inference_success = False
    try:
        classifier = model_manager.image_classifier
        results = classifier(image)
        # The model returns a list of dicts like: [{'label': 'artificial', 'score': 0.98}, {'label': 'human', 'score': 0.02}]
        for res in results:
            if res['label'] == 'artificial':
                score = res['score']
                inference_success = True
                break
    except Exception:
        logger.exception("AI image classifier failed during inference, falling back to a neutral 0.5 score")
        pass

    # Give a slight bump towards real if authentic EXIF is found, but let the model make the primary decision
    if has_camera_exif:
        score = max(0.0, score - 0.2)

    score = max(0.0, min(1.0, score))

    reasons = []
    if has_camera_exif:
        reasons.append(f"Camera metadata found ({', '.join(exif_tags_found)}) - suggests a real camera capture.")
    else:
        reasons.append("No camera metadata (Make/Model) found in the file - typical for AI generators or web downloads.")
        
    if score > 0.7:
        reasons.append("HuggingFace Deepfake Detection Model classified this image as artificially generated.")
    elif score > 0.4:
        reasons.append("HuggingFace Deepfake Detection Model found mixed signals, suggesting the image may be AI-assisted or partially altered.")
    else:
        reasons.append("HuggingFace Deepfake Detection Model classified this image as an authentic human photograph.")

    if provenance["has_manifest"]:
        reasons.append("A C2PA content-credentials manifest was found - see provenance details.")
    else:
        reasons.append("No C2PA content-credentials manifest found in the file.")

    return {
        "ai_likelihood_score": round(score * 100, 1),
        "confidence": "high" if inference_success else "low",
        "reasons": reasons,
        "provenance": provenance
    }

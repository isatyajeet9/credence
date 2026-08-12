from transformers import pipeline

# We use a singleton pattern so the model is only loaded into memory once
class ModelManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._text_classifier = None
            cls._instance._image_classifier = None
        return cls._instance

    @property
    def text_classifier(self):
        if self._text_classifier is None:
            print("Loading AI Text Classifier Model... (This may take a minute)")
            # Using a known AI detector model. For production, DeBERTa-v3 or RoBERTa-based models are used.
            # "roberta-base-openai-detector" outputs "Fake" (AI) and "Real" (Human).
            self._text_classifier = pipeline("text-classification", model="roberta-base-openai-detector")
        return self._text_classifier

    @property
    def image_classifier(self):
        if self._image_classifier is None:
            print("Loading AI Image Classifier Model... (This may take a minute)")
            # Using a TRUE Deepfake/AI detection model fine-tuned on real vs AI datasets
            self._image_classifier = pipeline("image-classification", model="umm-maybe/AI-image-detector")
        return self._image_classifier

model_manager = ModelManager()

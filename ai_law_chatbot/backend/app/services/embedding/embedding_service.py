# app/services/embedding_service.py
from typing import Sequence
import time
import google.generativeai as genai

from app.core.config import settings


class EmbeddingService:
    def __init__(self):
        genai.configure(api_key=settings.API_KEY_GOOGLE)
        self.model = settings.MODELS_EMBEDDING

    def _clean_text(self, text: str) -> str:
        return " ".join(text.strip().split())

    def embed_text(self, text: str) -> list[float]:
        """Embed 1 đoạn text"""
        text = self._clean_text(text)

        for attempt in range(3):
            try:
                result = genai.embed_content(
                    model=self.model,
                    content=text,
                    task_type="retrieval_document",  # quan trọng cho RAG
                )
                return result["embedding"]

            except Exception as e:
                if attempt == 2:
                    raise e
                time.sleep(1)

    def embed_texts(self, texts: Sequence[str]) -> list[list[float]]:
        """Embed nhiều đoạn text (Gemini hiện KHÔNG hỗ trợ batch tốt → loop)"""
        embeddings = []

        for text in texts:
            if not text.strip():
                continue

            emb = self.embed_text(text)
            embeddings.append(emb)

        return embeddings
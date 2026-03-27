from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from schemas.chat import ChatRequest, ChatResponse, SourceItem
from app.services.embedding.embedding_service import EmbeddingService
from app.services.embedding.retrieval_service import search_similar_chunks
from app.services.embedding.answer_service import generate_rag_answer

router = APIRouter(prefix="/chat", tags=["chat"])

embedding_service = EmbeddingService()

@router.post("", response_model=ChatResponse)
async def chat(req: ChatRequest, db: Session = Depends(get_db)):
    query_embedding = embedding_service.embed_text(req.question)
    contexts = search_similar_chunks(db, query_embedding, top_k=5)
    answer = await generate_rag_answer(req.question, contexts)

    return ChatResponse(
        answer=answer,
        sources=[
            SourceItem(
                title=c["title"],
                page_number=c["page_number"],
                content=c["content"][:300]
            )
            for c in contexts
        ]
    )
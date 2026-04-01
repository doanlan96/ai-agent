# schemas/chat.py
from pydantic import BaseModel

class ChatRequest(BaseModel):
    session_id: str
    question: str

class SourceItem(BaseModel):
    title: str
    page_number: int | None
    content: str

class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceItem]
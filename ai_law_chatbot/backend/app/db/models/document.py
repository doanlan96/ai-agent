import uuid
from datetime import datetime

from sqlalchemy import JSON
from sqlalchemy import String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    file_name: Mapped[str] = mapped_column(String(500), nullable=False)
    source_type: Mapped[str] = mapped_column(String(50), default="upload")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    chunks: Mapped[list["DocumentChunk"]] = relationship(back_populates="document")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id"), nullable=False)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    page_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    meta: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    document: Mapped["Document"] = relationship(back_populates="chunks")

from pgvector.sqlalchemy import Vector
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

# from app.db.base import Base
from app.db.models.document import Base

class ChunkEmbedding(Base):
    __tablename__ = "chunk_embeddings"

    chunk_id: Mapped[int] = mapped_column(
        ForeignKey("document_chunks.id"), primary_key=True
    )
    embedding: Mapped[list[float]] = mapped_column(Vector(3072))
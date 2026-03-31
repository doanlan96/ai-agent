from sqlalchemy import text
from sqlalchemy.orm import Session

def search_similar_chunks(db: Session, query_embedding: list[float], top_k: int = 5):
    sql = text("""
        SELECT
            dc.id,
            dc.content,
            dc.page_number,
            d.title,
            d.file_name,
            ce.embedding <=> CAST(:query_embedding AS vector) AS distance
        FROM chunk_embeddings ce
        JOIN document_chunks dc ON dc.id = ce.chunk_id
        JOIN documents d ON d.id = dc.document_id
        ORDER BY ce.embedding <=> CAST(:query_embedding AS vector)
        LIMIT :top_k
    """)

    result = db.execute(
        sql,
        {
            "query_embedding": str(query_embedding),
            "top_k": top_k,
        },
    )

    return [dict(row._mapping) for row in result]
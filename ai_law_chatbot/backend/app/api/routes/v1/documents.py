import os
from tempfile import NamedTemporaryFile

from fastapi import APIRouter, UploadFile, File, Depends

from app.db import get_db
# from app.api.deps import get_db
# from app.services.ingest_service import extract_text_from_pdf, ingest_document
from app.services.embedding.embedding_service import EmbeddingService
from app.services.embedding.ingest_service import extract_text_from_pdf, ingest_document

router = APIRouter()
embedding_service = EmbeddingService()

@router.post("/upload")
async def upload_document(
        db = Depends(get_db),
        file: UploadFile = File(...),

):
    suffix = os.path.splitext(file.filename)[1]

    with NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    pages = extract_text_from_pdf(tmp_path)
    doc_id = ingest_document(
        db=db,
        title=file.filename,
        file_name=file.filename,
        pages=pages,
        embedding_service=embedding_service,
    )

    os.unlink(tmp_path)

    return {"document_id": doc_id, "message": "Uploaded and indexed successfully"}

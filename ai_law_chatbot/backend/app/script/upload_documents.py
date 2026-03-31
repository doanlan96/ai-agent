from pathlib import Path

from app.db import SessionLocal
from app.services.embedding.embedding_service import EmbeddingService
from app.services.embedding.ingest_service import extract_text_from_pdf, ingest_document

DATA_DIR = Path(r"C:\Users\Admin\Vccorp\ai-agent\ai_law_chatbot\backend\app\data")


def upload_multiple_files_from_folder():
    if not DATA_DIR.exists() or not DATA_DIR.is_dir():
        print(f"Folder không tồn tại: {DATA_DIR.resolve()}")
        return

    embedding_service = EmbeddingService()
    db = SessionLocal()

    try:
        files = [f for f in DATA_DIR.iterdir() if f.is_file()]

        if not files:
            print(f"Không có file nào trong folder: {DATA_DIR.resolve()}")
            return

        for file_path in files:
            try:
                print(f"Đang xử lý: {file_path.name}")

                pages = extract_text_from_pdf(str(file_path))

                doc_id = ingest_document(
                    db=db,
                    title=file_path.name,
                    file_name=file_path.name,
                    pages=pages,
                    embedding_service=embedding_service,
                )

                print(f"OK - Uploaded và indexed: {file_path.name} | document_id = {doc_id}")

            except Exception as e:
                print(f"Lỗi khi xử lý file {file_path.name}: {e}")

        db.commit()

    except Exception as e:
        db.rollback()
        print(f"Lỗi tổng: {e}")

    finally:
        db.close()


if __name__ == "__main__":
    print("======= START RUN =======")
    # upload_multiple_files_from_folder()
    print("======= END =======")

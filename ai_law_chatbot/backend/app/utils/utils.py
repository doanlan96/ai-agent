def build_chunks_from_pages(pages: list[dict]) -> list[dict]:
    all_chunks = []
    chunk_index = 0

    for page in pages:
        page_chunks = chunk_text(page["text"], chunk_size=1000, overlap=150)
        for c in page_chunks:
            all_chunks.append({
                "chunk_index": chunk_index,
                "content": c,
                "page_number": page["page_number"],
                "meta": {"page_number": page["page_number"]}
            })
            chunk_index += 1

    return all_chunks

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 150) -> list[str]:
    chunks = []
    start = 0
    text = " ".join(text.split())

    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start += chunk_size - overlap

    return chunks
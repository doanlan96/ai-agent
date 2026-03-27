def build_rag_prompt(question: str, contexts: list[dict]) -> str:
    context_text = "\n\n".join(
        [
            f"[Nguồn: {c['title']} - trang {c['page_number']}]\n{c['content']}"
            for c in contexts
        ]
    )

    return f"""
Câu hỏi người dùng:
{question}

Thông tin tham chiếu:
{context_text}

Yêu cầu trả lời:
1. Chỉ dùng thông tin trong phần tham chiếu.
2. Nếu không đủ thông tin, trả lời: "Tôi không tìm thấy thông tin trong tài liệu."
3. Cuối mỗi ý quan trọng, trích nguồn như: [Tên tài liệu - trang X].
"""
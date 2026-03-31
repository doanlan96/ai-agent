
from pydantic_ai import Agent
from pydantic_ai.models.openrouter import OpenRouterModel
from pydantic_ai.providers.openrouter import OpenRouterProvider

from app.core.config import settings

provider = OpenRouterProvider(api_key=settings.OPENROUTER_API_KEY)

chat_model = OpenRouterModel(
    settings.AI_MODEL,
    provider=provider,
)

rag_agent = Agent(
    chat_model,
    instructions=(
        "Bạn là trợ lý AI cho hệ thống tra cứu tài liệu nội bộ. "
        "Chỉ được trả lời dựa trên context được cung cấp. "
        "Nếu context không đủ, hãy nói rõ bạn không tìm thấy thông tin. "
        "Luôn trích dẫn nguồn theo định dạng [Tên tài liệu - trang X]."
    ),
)

from app.agents.pydantic import rag_agent
from app.prompts.rag_prompt import build_rag_prompt


# async def generate_rag_answer(question: str, contexts: list[dict]) -> str:
#     prompt = build_rag_prompt(question, contexts)
#     result = await rag_agent.run(prompt)
#     return str(result.output)

async def generate_rag_answer(question: str, contexts: list[dict]) -> str:
    prompt = build_rag_prompt(question, contexts)
    result = await rag_agent.run(prompt)
    return result.output if hasattr(result, "output") else str(result)
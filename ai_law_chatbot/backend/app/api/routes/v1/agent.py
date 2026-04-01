"""AI Agent WebSocket routes with streaming support (PydanticAI)."""

import logging
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from pydantic_ai import (
    Agent,
    FinalResultEvent,
    FunctionToolCallEvent,
    FunctionToolResultEvent,
    PartDeltaEvent,
    PartStartEvent,
    TextPartDelta,
    ToolCallPartDelta,
)
from pydantic_ai.messages import (
    ModelRequest,
    ModelResponse,
    SystemPromptPart,
    TextPart,
    UserPromptPart,
)

from app.agents.assistant import Deps, get_agent
from app.api.deps import get_conversation_service, get_current_user_ws
from app.db import get_db
from app.db.models.user import User
from app.db.session import get_db_context
from app.schemas.conversation import (
    ConversationCreate,
    MessageCreate,
)
from app.services.embedding.answer_service import generate_rag_answer
from app.services.embedding.embedding_service import EmbeddingService
from app.services.embedding.retrieval_service import search_similar_chunks

logger = logging.getLogger(__name__)
db_gen = get_db()
db_session_local = next(db_gen)

router = APIRouter()
embedding_service = EmbeddingService()

class AgentConnectionManager:
    """WebSocket connection manager for AI agent."""

    def __init__(self) -> None:
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        """Accept and store a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Agent WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket) -> None:
        """Remove a WebSocket connection."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(
            f"Agent WebSocket disconnected. Total connections: {len(self.active_connections)}"
        )

    async def send_event(self, websocket: WebSocket, event_type: str, data: Any) -> bool:
        """Send a JSON event to a specific WebSocket client.

        Returns True if sent successfully, False if connection is closed.
        """
        try:
            await websocket.send_json({"type": event_type, "data": data})
            return True
        except (WebSocketDisconnect, RuntimeError):
            # Connection already closed
            return False


manager = AgentConnectionManager()


def build_message_history(history: list[dict[str, str]]) -> list[ModelRequest | ModelResponse]:
    """Convert conversation history to PydanticAI message format."""
    model_history: list[ModelRequest | ModelResponse] = []

    for msg in history:
        if msg["role"] == "user":
            model_history.append(ModelRequest(parts=[UserPromptPart(content=msg["content"])]))
        elif msg["role"] == "assistant":
            model_history.append(ModelResponse(parts=[TextPart(content=msg["content"])]))
        elif msg["role"] == "system":
            model_history.append(ModelRequest(parts=[SystemPromptPart(content=msg["content"])]))

    return model_history


# @router.websocket("/ws/agent")
# async def agent_websocket(
#     websocket: WebSocket,
#     user: User = Depends(get_current_user_ws),
# ) -> None:
#     """WebSocket endpoint for AI agent with full event streaming.
#
#     Uses PydanticAI iter() to stream all agent events including:
#     - user_prompt: When user input is received
#     - model_request_start: When model request begins
#     - text_delta: Streaming text from the model
#     - tool_call_delta: Streaming tool call arguments
#     - tool_call: When a tool is called (with full args)
#     - tool_result: When a tool returns a result
#     - final_result: When the final result is ready
#     - complete: When processing is complete
#     - error: When an error occurs
#
#     Expected input message format:
#     {
#         "message": "user message here",
#         "history": [{"role": "user|assistant|system", "content": "..."}],
#         "conversation_id": "optional-uuid-to-continue-existing-conversation"
#     }
#
#     Authentication: Requires a valid JWT token passed as a query parameter or header.
#
#     Persistence: Set 'conversation_id' to continue an existing conversation.
#     If not provided, a new conversation is created. The conversation_id is
#     returned in the 'conversation_created' event.
#     """
#
#     await manager.connect(websocket)
#
#     # Conversation state per connection
#     conversation_history: list[dict[str, str]] = []
#     deps = Deps()
#     current_conversation_id: str | None = None
#
#     try:
#         while True:
#             # Receive user message
#             data = await websocket.receive_json()
#             user_message = data.get("message", "")
#             bot_types = data.get("bot_types", "default")
#             # Optionally accept history from client (or use server-side tracking)
#             if "history" in data:
#                 conversation_history = data["history"]
#
#             if not user_message:
#                 await manager.send_event(websocket, "error", {"message": "Empty message"})
#                 continue
#
#             # Handle conversation persistence
#             try:
#                 async with get_db_context() as db:
#                     conv_service = get_conversation_service(db)
#
#                     # Get or create conversation
#                     requested_conv_id = data.get("conversation_id")
#                     if requested_conv_id:
#                         current_conversation_id = requested_conv_id
#                         # Verify conversation exists
#                         await conv_service.get_conversation(UUID(requested_conv_id))
#                     elif not current_conversation_id:
#                         # Create new conversation
#                         conv_data = ConversationCreate(
#                             user_id=user.id,
#                             title=user_message[:50] if len(user_message) > 50 else user_message,
#                         )
#                         conversation = await conv_service.create_conversation(conv_data)
#                         current_conversation_id = str(conversation.id)
#                         await manager.send_event(
#                             websocket,
#                             "conversation_created",
#                             {"conversation_id": current_conversation_id},
#                         )
#
#                     # Save user message
#                     await conv_service.add_message(
#                         UUID(current_conversation_id),
#                         MessageCreate(role="user", content=user_message),
#                     )
#             except Exception as e:
#                 logger.warning(f"Failed to persist conversation: {e}")
#                 # Continue without persistence
#
#             await manager.send_event(websocket, "user_prompt", {"content": user_message})
#
#             try:
#
#                 assistant = get_agent(bot_types=bot_types)
#                 model_history = build_message_history(conversation_history)
#
#                 # Use iter() on the underlying PydanticAI agent to stream all events
#                 async with assistant.agent.iter(
#                     user_message,
#                     deps=deps,
#                     message_history=model_history,
#                 ) as agent_run:
#                     async for node in agent_run:
#                         if Agent.is_user_prompt_node(node):
#                             await manager.send_event(
#                                 websocket,
#                                 "user_prompt_processed",
#                                 {"prompt": node.user_prompt},
#                             )
#
#                         elif Agent.is_model_request_node(node):
#                             await manager.send_event(websocket, "model_request_start", {})
#
#                             async with node.stream(agent_run.ctx) as request_stream:
#                                 async for event in request_stream:
#                                     if isinstance(event, PartStartEvent):
#                                         await manager.send_event(
#                                             websocket,
#                                             "part_start",
#                                             {
#                                                 "index": event.index,
#                                                 "part_type": type(event.part).__name__,
#                                             },
#                                         )
#                                         # Send initial content from TextPart if present
#                                         if isinstance(event.part, TextPart) and event.part.content:
#                                             await manager.send_event(
#                                                 websocket,
#                                                 "text_delta",
#                                                 {
#                                                     "index": event.index,
#                                                     "content": event.part.content,
#                                                 },
#                                             )
#
#                                     elif isinstance(event, PartDeltaEvent):
#                                         if isinstance(event.delta, TextPartDelta):
#                                             await manager.send_event(
#                                                 websocket,
#                                                 "text_delta",
#                                                 {
#                                                     "index": event.index,
#                                                     "content": event.delta.content_delta,
#                                                 },
#                                             )
#                                         elif isinstance(event.delta, ToolCallPartDelta):
#                                             await manager.send_event(
#                                                 websocket,
#                                                 "tool_call_delta",
#                                                 {
#                                                     "index": event.index,
#                                                     "args_delta": event.delta.args_delta,
#                                                 },
#                                             )
#
#                                     elif isinstance(event, FinalResultEvent):
#                                         await manager.send_event(
#                                             websocket,
#                                             "final_result_start",
#                                             {"tool_name": event.tool_name},
#                                         )
#
#                         elif Agent.is_call_tools_node(node):
#                             await manager.send_event(websocket, "call_tools_start", {})
#
#                             async with node.stream(agent_run.ctx) as handle_stream:
#                                 async for event in handle_stream:
#                                     if isinstance(event, FunctionToolCallEvent):
#                                         await manager.send_event(
#                                             websocket,
#                                             "tool_call",
#                                             {
#                                                 "tool_name": event.part.tool_name,
#                                                 "args": event.part.args,
#                                                 "tool_call_id": event.part.tool_call_id,
#                                             },
#                                         )
#
#                                     elif isinstance(event, FunctionToolResultEvent):
#                                         await manager.send_event(
#                                             websocket,
#                                             "tool_result",
#                                             {
#                                                 "tool_call_id": event.tool_call_id,
#                                                 "content": str(event.result.content),
#                                             },
#                                         )
#
#                         elif Agent.is_end_node(node) and agent_run.result is not None:
#                             await manager.send_event(
#                                 websocket,
#                                 "final_result",
#                                 {"output": agent_run.result.output},
#                             )
#
#                 # Update conversation history
#                 conversation_history.append({"role": "user", "content": user_message})
#                 if agent_run.result:
#                     conversation_history.append(
#                         {"role": "assistant", "content": agent_run.result.output}
#                     )
#
#                 # Save assistant response to database
#                 if current_conversation_id and agent_run.result:
#                     try:
#                         async with get_db_context() as db:
#                             conv_service = get_conversation_service(db)
#                             await conv_service.add_message(
#                                 UUID(current_conversation_id),
#                                 MessageCreate(
#                                     role="assistant",
#                                     content=agent_run.result.output,
#                                     model_name=assistant.model_name
#                                     if hasattr(assistant, "model_name")
#                                     else None,
#                                 ),
#                             )
#                     except Exception as e:
#                         logger.warning(f"Failed to persist assistant response: {e}")
#
#                 await manager.send_event(
#                     websocket,
#                     "complete",
#                     {
#                         "conversation_id": current_conversation_id,
#                     },
#                 )
#
#             except WebSocketDisconnect:
#                 # Client disconnected during processing - this is normal
#                 logger.info("Client disconnected during agent processing")
#                 break
#             except Exception as e:
#                 logger.exception(f"Error processing agent request: {e}")
#                 # Try to send error, but don't fail if connection is closed
#                 await manager.send_event(websocket, "error", {"message": str(e)})
#
#     except WebSocketDisconnect:
#         pass  # Normal disconnect
#     finally:
#         manager.disconnect(websocket)

@router.websocket("/ws/agent")
async def agent_websocket(
    websocket: WebSocket,
    user: User = Depends(get_current_user_ws),
) -> None:
    await manager.connect(websocket)

    conversation_history: list[dict[str, str]] = []
    deps = Deps()
    current_conversation_id: str | None = None

    try:
        while True:
            data = await websocket.receive_json()
            user_message = data.get("message", "")
            bot_types = data.get("bot_types", "default")

            if "history" in data:
                conversation_history = data["history"]

            if not user_message:
                await manager.send_event(websocket, "error", {"message": "Empty message"})
                continue

            # Handle conversation persistence
            try:
                async with get_db_context() as db:
                    conv_service = get_conversation_service(db)

                    requested_conv_id = data.get("conversation_id")
                    if requested_conv_id:
                        current_conversation_id = requested_conv_id
                        await conv_service.get_conversation(UUID(requested_conv_id))
                    elif not current_conversation_id:
                        conv_data = ConversationCreate(
                            user_id=user.id,
                            title=user_message[:50] if len(user_message) > 50 else user_message,
                        )
                        conversation = await conv_service.create_conversation(conv_data)
                        current_conversation_id = str(conversation.id)
                        await manager.send_event(
                            websocket,
                            "conversation_created",
                            {"conversation_id": current_conversation_id},
                        )

                    await conv_service.add_message(
                        UUID(current_conversation_id),
                        MessageCreate(role="user", content=user_message),
                    )
            except Exception as e:
                logger.warning(f"Failed to persist conversation: {e}")

            await manager.send_event(websocket, "user_prompt", {"content": user_message})

            try:
                ## Logic bot read document
                if bot_types == "document":
                    await manager.send_event(websocket, "model_request_start", {})

                    query_embedding = embedding_service.embed_text(user_message)
                    contexts = search_similar_chunks(db_session_local, query_embedding, top_k=5)
                    answer = await generate_rag_answer(user_message, contexts)

                    sources = [
                        {
                            "title": c["title"],
                            "page_number": c["page_number"],
                            "content": c["content"][:300],
                        }
                        for c in contexts
                    ]

                    # Nếu muốn giả lập streaming text đơn giản
                    await manager.send_event(
                        websocket,
                        "final_result",
                        {
                            "output": answer,
                            "sources": sources,
                            "bot_types": "document",
                        },
                    )

                    conversation_history.append({"role": "user", "content": user_message})
                    conversation_history.append({"role": "assistant", "content": answer})

                    if current_conversation_id:
                        try:
                            async with get_db_context() as db:
                                conv_service = get_conversation_service(db)
                                await conv_service.add_message(
                                    UUID(current_conversation_id),
                                    MessageCreate(
                                        role="assistant",
                                        content=answer,
                                        model_name="rag_agent",
                                    ),
                                )
                        except Exception as e:
                            logger.warning(f"Failed to persist assistant response: {e}")

                    await manager.send_event(
                        websocket,
                        "complete",
                        {"conversation_id": current_conversation_id},
                    )
                    continue

                # Default agen flow
                assistant = get_agent(bot_types=bot_types)
                model_history = build_message_history(conversation_history)

                async with assistant.agent.iter(
                    user_message,
                    deps=deps,
                    message_history=model_history,
                ) as agent_run:
                    async for node in agent_run:
                        if Agent.is_user_prompt_node(node):
                            await manager.send_event(
                                websocket,
                                "user_prompt_processed",
                                {"prompt": node.user_prompt},
                            )

                        elif Agent.is_model_request_node(node):
                            await manager.send_event(websocket, "model_request_start", {})

                            async with node.stream(agent_run.ctx) as request_stream:
                                async for event in request_stream:
                                    if isinstance(event, PartStartEvent):
                                        await manager.send_event(
                                            websocket,
                                            "part_start",
                                            {
                                                "index": event.index,
                                                "part_type": type(event.part).__name__,
                                            },
                                        )
                                        if isinstance(event.part, TextPart) and event.part.content:
                                            await manager.send_event(
                                                websocket,
                                                "text_delta",
                                                {
                                                    "index": event.index,
                                                    "content": event.part.content,
                                                },
                                            )

                                    elif isinstance(event, PartDeltaEvent):
                                        if isinstance(event.delta, TextPartDelta):
                                            await manager.send_event(
                                                websocket,
                                                "text_delta",
                                                {
                                                    "index": event.index,
                                                    "content": event.delta.content_delta,
                                                },
                                            )
                                        elif isinstance(event.delta, ToolCallPartDelta):
                                            await manager.send_event(
                                                websocket,
                                                "tool_call_delta",
                                                {
                                                    "index": event.index,
                                                    "args_delta": event.delta.args_delta,
                                                },
                                            )

                                    elif isinstance(event, FinalResultEvent):
                                        await manager.send_event(
                                            websocket,
                                            "final_result_start",
                                            {"tool_name": event.tool_name},
                                        )

                        elif Agent.is_call_tools_node(node):
                            await manager.send_event(websocket, "call_tools_start", {})

                            async with node.stream(agent_run.ctx) as handle_stream:
                                async for event in handle_stream:
                                    if isinstance(event, FunctionToolCallEvent):
                                        await manager.send_event(
                                            websocket,
                                            "tool_call",
                                            {
                                                "tool_name": event.part.tool_name,
                                                "args": event.part.args,
                                                "tool_call_id": event.part.tool_call_id,
                                            },
                                        )

                                    elif isinstance(event, FunctionToolResultEvent):
                                        await manager.send_event(
                                            websocket,
                                            "tool_result",
                                            {
                                                "tool_call_id": event.tool_call_id,
                                                "content": str(event.result.content),
                                            },
                                        )

                        elif Agent.is_end_node(node) and agent_run.result is not None:
                            await manager.send_event(
                                websocket,
                                "final_result",
                                {"output": agent_run.result.output},
                            )

                conversation_history.append({"role": "user", "content": user_message})
                if agent_run.result:
                    conversation_history.append(
                        {"role": "assistant", "content": agent_run.result.output}
                    )

                if current_conversation_id and agent_run.result:
                    try:
                        async with get_db_context() as db:
                            conv_service = get_conversation_service(db)
                            await conv_service.add_message(
                                UUID(current_conversation_id),
                                MessageCreate(
                                    role="assistant",
                                    content=agent_run.result.output,
                                    model_name=assistant.model_name
                                    if hasattr(assistant, "model_name")
                                    else None,
                                ),
                            )
                    except Exception as e:
                        logger.warning(f"Failed to persist assistant response: {e}")

                await manager.send_event(
                    websocket,
                    "complete",
                    {
                        "conversation_id": current_conversation_id,
                    },
                )

            except WebSocketDisconnect:
                logger.info("Client disconnected during agent processing")
                break
            except Exception as e:
                logger.exception(f"Error processing agent request: {e}")
                await manager.send_event(websocket, "error", {"message": str(e)})

    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket)
# [Task Verification] Phase 3: AI Pipeline - GPT & Multi-turn & Metadata
import os
import time
from .state import AgentState
from langchain_core.messages import AIMessage
from langchain_openai import ChatOpenAI
from utils.fallback import generate_fallback_response
from utils.embedding import search_menus
import logging

logger = logging.getLogger(__name__)


async def context_agent(state: AgentState) -> dict:
    """
    Context Chat Agent node.
    Handles multi-turn context handling, referencing prior conversation history.
    Captures OpenAI response metadata.
    """
    user_message = state["messages"][-1].content if state["messages"] else ""
    store_id = state.get("store_id", 0)

    # RAG context for multi-turn
    menu_docs = search_menus(store_id, user_message, n_results=3)
    menu_context = "\n".join(menu_docs) if menu_docs else "메뉴 정보 없음"

    openai_metadata = {}
    start_time = time.time()

    try:
        llm = ChatOpenAI(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            api_key=os.getenv("OPENAI_API_KEY"),
            max_retries=2,
            timeout=10.0,
            streaming=False
        )

        # Build conversation history, prepend system prompt
        history = []
        for m in state["messages"][:-1]:  # All but the last
            role = "assistant" if hasattr(m, "type") and m.type == "ai" else "user"
            history.append({"role": role, "content": m.content})

        system_msg = {
            "role": "system",
            "content": (
                "당신은 친절한 키오스크 주문 도우미입니다. "
                "이전 대화를 참고하여 고객의 요청을 처리하세요.\n\n"
                f"현재 매장 메뉴 참고 정보:\n{menu_context}"
            )
        }
        messages = [system_msg] + history + [{"role": "user", "content": user_message}]

        response = await llm.ainvoke(messages)
        latency_ms = (time.time() - start_time) * 1000
        response_text = response.content

        response_metadata = response.response_metadata or {}
        usage = response_metadata.get("token_usage", {})
        openai_metadata = {
            "model": response_metadata.get("model_name", os.getenv("OPENAI_MODEL", "gpt-4o-mini")),
            "routing_node": "context_agent",
            "is_fallback": False,
            "finish_reason": response_metadata.get("finish_reason", "stop"),
            "prompt_tokens": usage.get("prompt_tokens", 0),
            "completion_tokens": usage.get("completion_tokens", 0),
            "total_tokens": usage.get("total_tokens", 0),
            "latency_ms": round(latency_ms, 2)
        }
        cart_items = state.get("cart_items", [])

    except Exception as e:
        logger.error(f"OpenAI API error in context_agent: {e}")
        latency_ms = (time.time() - start_time) * 1000
        fallback_data = generate_fallback_response(user_message)
        response_text = fallback_data["message"]
        cart_items = fallback_data["cart_items"] or state.get("cart_items", [])
        openai_metadata = {
            "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            "routing_node": "context_agent",
            "is_fallback": True,
            "error": str(e),
            "latency_ms": round(latency_ms, 2)
        }

    return {
        "messages": [AIMessage(content=response_text)],
        "routing_node": "context_agent",
        "cart_items": cart_items,
        "openai_metadata": openai_metadata,
        "latency_ms": openai_metadata.get("latency_ms")
    }

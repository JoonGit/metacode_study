# [Task Verification] Phase 3: AI Pipeline - GPT & RAG & Metadata
import os
import time
from .state import AgentState
from langchain_core.messages import AIMessage
from langchain_openai import ChatOpenAI
from utils.fallback import generate_fallback_response
from utils.embedding import search_menus
import logging

logger = logging.getLogger(__name__)


async def info_agent(state: AgentState) -> dict:
    """
    Info & Recommend Agent node.
    Uses RAG (ChromaDB semantic search) to retrieve relevant menu context,
    then queries OpenAI GPT-4o-mini with that context.
    Captures OpenAI response metadata (model, usage, finish_reason, latency_ms).
    """
    user_message = state["messages"][-1].content if state["messages"] else ""
    store_id = state.get("store_id", 0)

    # --- RAG: Retrieve relevant menus from ChromaDB ---
    menu_docs = search_menus(store_id, user_message, n_results=5)
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

        system_prompt = (
            "당신은 친절한 키오스크 주문 도우미입니다. "
            "아래는 이 매장에서 판매 중인 메뉴 정보입니다:\n\n"
            f"{menu_context}\n\n"
            "위 메뉴 정보를 바탕으로 고객의 질문에 한국어로 친절하게 답변하세요."
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]

        response = await llm.ainvoke(messages)
        latency_ms = (time.time() - start_time) * 1000
        response_text = response.content

        # Capture OpenAI metadata
        response_metadata = response.response_metadata or {}
        usage = response_metadata.get("token_usage", {})
        openai_metadata = {
            "model": response_metadata.get("model_name", os.getenv("OPENAI_MODEL", "gpt-4o-mini")),
            "routing_node": "info_agent",
            "is_fallback": False,
            "finish_reason": response_metadata.get("finish_reason", "stop"),
            "prompt_tokens": usage.get("prompt_tokens", 0),
            "completion_tokens": usage.get("completion_tokens", 0),
            "total_tokens": usage.get("total_tokens", 0),
            "latency_ms": round(latency_ms, 2)
        }
        cart_items = state.get("cart_items", [])

    except Exception as e:
        logger.error(f"OpenAI API error in info_agent: {e}")
        latency_ms = (time.time() - start_time) * 1000
        fallback_data = generate_fallback_response(user_message)
        response_text = fallback_data["message"]
        cart_items = fallback_data["cart_items"] or state.get("cart_items", [])
        openai_metadata = {
            "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            "routing_node": "info_agent",
            "is_fallback": True,
            "error": str(e),
            "latency_ms": round(latency_ms, 2)
        }

    return {
        "messages": [AIMessage(content=response_text)],
        "routing_node": "info_agent",
        "cart_items": cart_items,
        "openai_metadata": openai_metadata,
        "latency_ms": openai_metadata.get("latency_ms")
    }

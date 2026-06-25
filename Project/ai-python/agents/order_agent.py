# [Task Verification] Phase 3: AI Pipeline - Order Execution Agent & Metadata
import os
import json
import time
from .state import AgentState
from langchain_core.messages import AIMessage
from langchain_openai import ChatOpenAI
from utils.fallback import generate_fallback_response
from utils.embedding import search_menus
import logging

logger = logging.getLogger(__name__)


async def order_agent(state: AgentState) -> dict:
    """
    Order Execution Agent node.
    Extracts ordered items using GPT structured output (JSON mode),
    merges with existing cart, captures OpenAI metadata.
    """
    user_message = state["messages"][-1].content if state["messages"] else ""
    store_id = state.get("store_id", 0)
    current_cart = state.get("cart_items") or []

    # RAG: find relevant menus to help the model identify menu_ids
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
            "당신은 키오스크 주문 처리 어시스턴트입니다. "
            "고객의 주문 의도를 분석하여 아래 JSON 형식으로만 응답하세요. "
            "다른 텍스트는 절대 포함하지 마세요.\n\n"
            "응답 형식:\n"
            "{\"message\": \"확인 메시지 (한국어)\", \"items\": [{\"menu_name\": \"메뉴명\", \"quantity\": 1}]}\n\n"
            f"현재 매장 메뉴 목록:\n{menu_context}"
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]

        response = await llm.ainvoke(messages)
        latency_ms = (time.time() - start_time) * 1000
        raw_text = response.content.strip()

        # Parse JSON response
        try:
            parsed = json.loads(raw_text)
            response_text = parsed.get("message", "주문이 처리되었습니다.")
            new_items = parsed.get("items", [])
            # Add cartItemId for frontend compatibility
            import time as t
            cart_additions = [
                {
                    "name": item.get("menu_name", ""),
                    "quantity": item.get("quantity", 1),
                    "price": 0,  # Will be validated by backend
                    "cartItemId": int(t.time() * 1000)
                }
                for item in new_items
            ]
            cart_items = current_cart + cart_additions
        except json.JSONDecodeError:
            response_text = raw_text if raw_text else "주문을 처리하겠습니다."
            cart_items = current_cart

        response_metadata = response.response_metadata or {}
        usage = response_metadata.get("token_usage", {})
        openai_metadata = {
            "model": response_metadata.get("model_name", os.getenv("OPENAI_MODEL", "gpt-4o-mini")),
            "routing_node": "order_agent",
            "is_fallback": False,
            "finish_reason": response_metadata.get("finish_reason", "stop"),
            "prompt_tokens": usage.get("prompt_tokens", 0),
            "completion_tokens": usage.get("completion_tokens", 0),
            "total_tokens": usage.get("total_tokens", 0),
            "latency_ms": round(latency_ms, 2)
        }

    except Exception as e:
        logger.error(f"OpenAI API error in order_agent: {e}")
        latency_ms = (time.time() - start_time) * 1000
        fallback_data = generate_fallback_response(user_message)
        response_text = fallback_data["message"]
        fallback_cart = fallback_data.get("cart_items") or []
        cart_items = current_cart + fallback_cart
        openai_metadata = {
            "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            "routing_node": "order_agent",
            "is_fallback": True,
            "error": str(e),
            "latency_ms": round(latency_ms, 2)
        }

    return {
        "messages": [AIMessage(content=response_text)],
        "routing_node": "order_agent",
        "cart_items": cart_items,
        "openai_metadata": openai_metadata,
        "latency_ms": openai_metadata.get("latency_ms")
    }

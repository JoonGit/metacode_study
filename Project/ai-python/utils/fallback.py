# [Task Verification] Phase 3: AI Pipeline - GPT & Fallback
import logging

logger = logging.getLogger(__name__)

def generate_fallback_response(user_message: str) -> dict:
    """
    OpenAI API 호출이 실패할 경우 로컬 규칙 기반으로 최소한의 응답을 제공하는 Fallback 엔진.
    """
    logger.warning("Using fallback rule-based response engine.")
    
    msg_lower = user_message.lower()
    
    response_text = "현재 시스템 접속이 원활하지 않아 기본 안내만 가능합니다."
    cart_items = []

    if "추천" in msg_lower:
        response_text += " 가장 인기 있는 메뉴는 아메리카노입니다."
    elif "아메리카노" in msg_lower:
        if "주문" in msg_lower or "담아" in msg_lower or "줘" in msg_lower:
            response_text += " 아메리카노 1잔을 장바구니에 담았습니다. (임시 처리)"
            cart_items.append({"menu_id": 1, "name": "아메리카노", "quantity": 1})
        else:
            response_text += " 아메리카노는 4500원입니다."
    elif "결제" in msg_lower:
        response_text += " 장바구니 화면에서 결제를 진행해주세요."
        
    return {
        "message": response_text,
        "cart_items": cart_items
    }

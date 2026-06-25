# [Task Verification] Phase 3: AI Pipeline - LangGraph
from .state import AgentState

def route_user_input(state: AgentState) -> str:
    """
    Mock router logic to determine which agent should handle the request.
    Returns the node name to route to.
    """
    if not state.get("messages"):
        return "info_agent"

    last_message = state["messages"][-1].content.lower()

    if "주문" in last_message or "장바구니" in last_message:
        return "order_agent"
    elif "아니" in last_message or "다른" in last_message:
        return "context_agent"
    else:
        return "info_agent"

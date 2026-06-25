# [Task Verification] Phase 3: AI Pipeline - LangGraph
from typing import TypedDict, Annotated, List, Dict, Any, Optional
from langgraph.graph.message import add_messages

class AgentState(TypedDict):
    messages: Annotated[list, add_messages]
    store_id: int
    session_id: str
    routing_node: Optional[str]
    cart_items: Optional[List[Dict[str, Any]]]
    openai_metadata: Optional[Dict[str, Any]]
    latency_ms: Optional[float]

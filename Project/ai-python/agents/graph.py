# [Task Verification] Phase 3: AI Pipeline - LangGraph
import os
import redis
from langgraph.graph import StateGraph, START, END

from .state import AgentState
from .router import route_user_input
from .info_agent import info_agent
from .context_agent import context_agent
from .order_agent import order_agent

def get_checkpointer():
    try:
        from langgraph.checkpoint.redis import AsyncRedisSaver
        REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
        REDIS_PORT = os.getenv("REDIS_PORT", "6379")
        REDIS_URI = f"redis://{REDIS_HOST}:{REDIS_PORT}/0"
        return AsyncRedisSaver(redis_url=REDIS_URI)
    except Exception as e:
        print(f"Warning: Falling back to AsyncMemorySaver due to {e}")
        from langgraph.checkpoint.memory import AsyncMemorySaver
        return AsyncMemorySaver()

def create_graph():
    workflow = StateGraph(AgentState)

    # Add nodes
    workflow.add_node("info_agent", info_agent)
    workflow.add_node("context_agent", context_agent)
    workflow.add_node("order_agent", order_agent)

    # Add conditional edges from START
    workflow.add_conditional_edges(
        START,
        route_user_input,
        {
            "info_agent": "info_agent",
            "context_agent": "context_agent",
            "order_agent": "order_agent"
        }
    )

    # All agents flow to END
    workflow.add_edge("info_agent", END)
    workflow.add_edge("context_agent", END)
    workflow.add_edge("order_agent", END)

    # Use RedisSaver for session state persistence
    checkpointer = get_checkpointer()

    # Compile the graph
    app = workflow.compile(checkpointer=checkpointer)
    return app

# Compile the graph globally so it can be imported
graph_app = create_graph()

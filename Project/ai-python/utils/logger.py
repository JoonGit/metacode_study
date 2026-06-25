# [Task Verification] Phase 3: AI Pipeline - Logging with OpenAI Metadata
import httpx
import json
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


async def log_ai_interaction(
    store_id: int,
    session_id: str,
    user_prompt: str,
    ai_response: str,
    routing_node: str,
    openai_metadata: Optional[Dict[str, Any]] = None,
    latency_ms: Optional[float] = None
):
    """
    Asynchronously sends AI interaction logs to the Java backend.
    Includes OpenAI metadata (model, usage, finish_reason, latency_ms, is_fallback).
    """
    url = "http://backend-java:8080/api/internal/ai-logs"
    payload = {
        "store_id": store_id,
        "session_id": session_id,
        "user_prompt": user_prompt,
        "ai_response": ai_response,
        "routing_node": routing_node,
        "openai_metadata": json.dumps(openai_metadata, ensure_ascii=False) if openai_metadata else None,
        "latency_ms": latency_ms
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, timeout=5.0)
            response.raise_for_status()
    except Exception as e:
        logger.error(f"Failed to log AI interaction for session {session_id}: {e}")

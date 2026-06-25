# [Task Verification] Phase 3: AI Pipeline - RAG Embedding
import os
import json
import logging
import redis.asyncio as redis
from typing import Optional, List
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env.local")

logger = logging.getLogger(__name__)

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
EMBED_QUEUE_KEY = "embed_queue"

_redis_client: Optional[redis.Redis] = None


def get_redis() -> redis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
    return _redis_client


async def enqueue_embed_task(task: dict):
    """
    Fire-and-Forget: Push embedding task to Redis queue.
    task = {"action": "upsert"|"delete", "store_id": int, "menu_id": int, "menu_name": str, "description": str}
    """
    try:
        r = get_redis()
        await r.lpush(EMBED_QUEUE_KEY, json.dumps(task, ensure_ascii=False))
        logger.info(f"Enqueued embed task: {task}")
    except Exception as e:
        logger.error(f"Failed to enqueue embed task: {e}")

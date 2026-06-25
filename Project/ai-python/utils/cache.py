# [Task Verification] Phase 3: AI Pipeline - Cache

import os
import json
import redis.asyncio as redis
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env.local")

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

# Redis Client
redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)

# Tier 1 Cache: In-memory dictionary
# Structure: { store_id: { ... } }
_local_cache: Dict[int, Any] = {}

async def get_menu_cache(store_id: int) -> Optional[Any]:
    """
    Retrieve menu cache using 2-Tier strategy.
    Tier 1: Local memory (Fast-path)
    Tier 2: Redis (AI Meta Cache)
    """
    # 1. Try Tier 1 (Local Memory)
    if store_id in _local_cache:
        return _local_cache[store_id]
        
    # 2. Try Tier 2 (Redis)
    redis_key = f"menu:{store_id}"
    cached_data = await redis_client.get(redis_key)
    
    if cached_data:
        menus = json.loads(cached_data)
        # Update Tier 1
        _local_cache[store_id] = menus
        return menus
        
    return None

async def set_menu_cache(store_id: int, data: Any):
    """
    Set menu cache in both Tier 1 and Tier 2.
    """
    # Update Tier 1 (Local Memory)
    _local_cache[store_id] = data
    
    # Update Tier 2 (Redis)
    redis_key = f"menu:{store_id}"
    await redis_client.set(redis_key, json.dumps(data))

async def delete_menu_cache(store_id: int):
    """
    Delete menu cache from both Tier 1 and Tier 2.
    """
    # Remove from Tier 1
    if store_id in _local_cache:
        del _local_cache[store_id]
        
    # Remove from Tier 2
    redis_key = f"menu:{store_id}"
    await redis_client.delete(redis_key)

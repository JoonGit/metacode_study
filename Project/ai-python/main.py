# [Task Verification] Phase 3: AI Pipeline - Logging & RAG & Embedding Queue
from fastapi import APIRouter, FastAPI, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from utils.cache import set_menu_cache
from utils.embedding_queue import enqueue_embed_task
from utils.embedding import run_embed_worker
from langchain_core.messages import HumanMessage
from agents.graph import graph_app
from utils.logger import log_ai_interaction
import json
import asyncio
import logging
from logging.handlers import TimedRotatingFileHandler
import os

os.makedirs("/app/logs", exist_ok=True)
log_handler = TimedRotatingFileHandler("/app/logs/ai-python.log", when="midnight", interval=1, backupCount=30)
log_handler.setFormatter(logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s"))
root_logger = logging.getLogger()
root_logger.setLevel(logging.INFO)
root_logger.addHandler(log_handler)
uvicorn_logger = logging.getLogger("uvicorn.access")
uvicorn_logger.addHandler(log_handler)

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="SmartOrder AI")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

router = APIRouter(prefix="/ai")


# ── Startup: launch embed worker background task ──────────────────────────────
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(run_embed_worker())
    logging.getLogger(__name__).info("Embed worker task started on startup.")
    
    # Initialize checkpointer indexes
    from agents.graph import graph_app
    try:
        if hasattr(graph_app.checkpointer, "setup"):
            await graph_app.checkpointer.setup()
            logging.getLogger(__name__).info("Redis checkpointer setup complete.")
    except Exception as e:
        logging.getLogger(__name__).error(f"Failed to setup checkpointer: {e}")


# ── Pydantic Models ───────────────────────────────────────────────────────────
class SyncMenuRequest(BaseModel):
    menus: List[Dict[str, Any]]


class ChatRequest(BaseModel):
    store_id: int
    session_id: str
    message: str


class ChatResponse(BaseModel):
    message: str
    routing_node: Optional[str]
    cart_items: Optional[List[Dict[str, Any]]]


class EmbedMenuRequest(BaseModel):
    store_id: int
    menu_id: int
    menu_name: str
    description: Optional[str] = ""


# ── Health ────────────────────────────────────────────────────────────────────
@router.get("/health")
async def health_check():
    return {"status": "ok"}


# ── Menu Cache Sync ───────────────────────────────────────────────────────────
@router.post("/internal/sync-menus")
async def sync_menus(store_id: int, request: SyncMenuRequest):
    await set_menu_cache(store_id, request.menus)
    return {"status": "synced", "store_id": store_id}


# ── Embedding Queue (Fire-and-Forget via Redis) ───────────────────────────────
@router.post("/internal/embed-menu")
async def embed_menu(request: EmbedMenuRequest):
    """
    Called by Java backend when a menu is created/updated.
    Enqueues an embedding task into Redis for async processing.
    """
    await enqueue_embed_task({
        "action": "upsert",
        "store_id": request.store_id,
        "menu_id": request.menu_id,
        "menu_name": request.menu_name,
        "description": request.description or ""
    })
    return {"status": "queued", "menu_id": request.menu_id}


@router.delete("/internal/embed-menu/{store_id}/{menu_id}")
async def delete_embed_menu(store_id: int, menu_id: int):
    """
    Called by Java backend when a menu is deleted.
    Enqueues a deletion task.
    """
    await enqueue_embed_task({
        "action": "delete",
        "store_id": store_id,
        "menu_id": menu_id
    })
    return {"status": "queued", "menu_id": menu_id}


# ── Chat (Non-streaming, returns after full response) ─────────────────────────
@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, background_tasks: BackgroundTasks):
    config = {"configurable": {"thread_id": request.session_id}}

    inputs = {
        "messages": [HumanMessage(content=request.message)],
        "store_id": request.store_id,
        "session_id": request.session_id
    }

    result = await graph_app.ainvoke(inputs, config=config)

    messages = result.get("messages", [])
    last_ai_message = messages[-1].content if messages else ""
    routing_node = result.get("routing_node")
    cart_items = result.get("cart_items", [])
    openai_metadata = result.get("openai_metadata")
    latency_ms = result.get("latency_ms")

    background_tasks.add_task(
        log_ai_interaction,
        store_id=request.store_id,
        session_id=request.session_id,
        user_prompt=request.message,
        ai_response=last_ai_message,
        routing_node=routing_node or "unknown",
        openai_metadata=openai_metadata,
        latency_ms=latency_ms
    )

    return ChatResponse(
        message=last_ai_message,
        routing_node=routing_node,
        cart_items=cart_items
    )


app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

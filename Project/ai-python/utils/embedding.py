# [Task Verification] Phase 3: AI Pipeline - RAG Embedding Worker
import os
import json
import asyncio
import logging
from typing import Optional
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env.local")

logger = logging.getLogger(__name__)

EMBED_QUEUE_KEY = "embed_queue"

# In-memory ChromaDB is replaced with Oracle 23ai Native Vector Search
def get_oracle_connection():
    import oracledb
    user = os.getenv("ORACLE_USER", "smartorder")
    password = os.getenv("ORACLE_PASSWORD", "smartorder")
    # Inside docker, this evaluates to oracle-db:1521/FREEPDB1
    dsn = os.getenv("ORACLE_DSN", "localhost:1521/FREEPDB1")
    return oracledb.connect(user=user, password=password, dsn=dsn)

def upsert_menu_embedding(store_id: int, menu_id: int, menu_name: str, description: str):
    """
    Generate OpenAI embedding for a menu item and store in Oracle Vector Store.
    """
    try:
        from langchain_openai import OpenAIEmbeddings
        from langchain_oracledb.vectorstores.oraclevs import OracleVS
        from langchain_community.vectorstores.utils import DistanceStrategy
        
        embeddings_model = OpenAIEmbeddings(
            model="text-embedding-3-small",
            api_key=os.getenv("OPENAI_API_KEY")
        )
        text = f"{menu_name}: {description}" if description else menu_name
        metadata = {"store_id": store_id, "menu_id": menu_id, "status": "ON_SALE"}
        
        conn = get_oracle_connection()
        vector_store = OracleVS(
            client=conn, 
            embedding_function=embeddings_model, 
            table_name="langchain_oraclevs",
            distance_strategy=DistanceStrategy.COSINE
        )
        
        # Attempt to delete old embedding if exists (ignoring errors if table/id doesn't exist)
        try:
            vector_store.delete(ids=[str(menu_id)])
        except Exception:
            pass
            
        vector_store.add_texts(texts=[text], metadatas=[metadata], ids=[str(menu_id)])
        conn.commit()
        conn.close()
        logger.info(f"Upserted embedding for menu_id={menu_id} store_id={store_id} into OracleVS")
    except Exception as e:
        logger.error(f"Failed to upsert embedding for menu_id={menu_id}: {e}")

def delete_menu_embedding(store_id: int, menu_id: int):
    """Remove a menu's embedding from Oracle Vector Store."""
    try:
        from langchain_openai import OpenAIEmbeddings
        from langchain_oracledb.vectorstores.oraclevs import OracleVS
        
        # We need embedding_function even for delete initialization in some langchain versions
        embeddings_model = OpenAIEmbeddings(
            model="text-embedding-3-small",
            api_key=os.getenv("OPENAI_API_KEY")
        )
        conn = get_oracle_connection()
        vector_store = OracleVS(
            client=conn, 
            embedding_function=embeddings_model, 
            table_name="langchain_oraclevs"
        )
        vector_store.delete(ids=[str(menu_id)])
        conn.commit()
        conn.close()
        logger.info(f"Deleted embedding for menu_id={menu_id} store_id={store_id} from OracleVS")
    except Exception as e:
        logger.error(f"Failed to delete embedding for menu_id={menu_id}: {e}")

def search_menus(store_id: int, query: str, n_results: int = 5) -> list:
    """
    Search menus by semantic similarity within a store using OracleVS.
    """
    try:
        from langchain_openai import OpenAIEmbeddings
        from langchain_oracledb.vectorstores.oraclevs import OracleVS
        from langchain_community.vectorstores.utils import DistanceStrategy
        
        embeddings_model = OpenAIEmbeddings(
            model="text-embedding-3-small",
            api_key=os.getenv("OPENAI_API_KEY")
        )
        conn = get_oracle_connection()
        vector_store = OracleVS(
            client=conn, 
            embedding_function=embeddings_model, 
            table_name="langchain_oraclevs",
            distance_strategy=DistanceStrategy.COSINE
        )
        
        # Filter by store_id
        docs = vector_store.similarity_search(query, k=n_results, filter={"store_id": store_id})
        conn.close()
        
        return [doc.page_content for doc in docs]
    except Exception as e:
        logger.error(f"Failed to search menus for store_id={store_id}: {e}")
        return []


async def run_embed_worker():
    """
    Background asyncio task: consumes embedding tasks from Redis queue (BRPOP).
    Fire-and-Forget pattern using Redis as message queue.
    """
    import redis.asyncio as aioredis
    REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
    r = aioredis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
    logger.info("Embedding worker started.")
    while True:
        try:
            result = await r.brpop(EMBED_QUEUE_KEY, timeout=5)
            if result is None:
                continue
            _, raw = result
            task = json.loads(raw)
            action = task.get("action")
            store_id = task.get("store_id")
            menu_id = task.get("menu_id")
            menu_name = task.get("menu_name", "")
            description = task.get("description", "")

            if action == "upsert":
                await asyncio.get_event_loop().run_in_executor(
                    None, upsert_menu_embedding, store_id, menu_id, menu_name, description
                )
            elif action == "delete":
                await asyncio.get_event_loop().run_in_executor(
                    None, delete_menu_embedding, store_id, menu_id
                )
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Embed worker error: {e}")
            await asyncio.sleep(1)

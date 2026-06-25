import os
import asyncio
import logging
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env.local")
logging.basicConfig(level=logging.INFO)

async def main():
    print("=" * 50)
    print("1. Testing Oracle Connection...")
    from utils.embedding import get_oracle_connection, upsert_menu_embedding, search_menus, delete_menu_embedding
    
    try:
        conn = get_oracle_connection()
        print(f"✅ Oracle Connected: {conn.version}")
        conn.close()
    except Exception as e:
        print(f"❌ Oracle Connection Failed: {e}")

    print("=" * 50)
    print("2. Testing OracleVS Embedding...")
    try:
        store_id = 9999
        menu_id = 8888
        print("-> Upserting test menu...")
        upsert_menu_embedding(store_id, menu_id, "테스트 아메리카노", "시원하고 맛있는 아메리카노")
        print("✅ Upsert successful")
        
        print("-> Searching for '시원한 커피'...")
        results = search_menus(store_id, "시원한 커피")
        print(f"✅ Search Results: {results}")
        
        print("-> Deleting test menu...")
        delete_menu_embedding(store_id, menu_id)
        print("✅ Delete successful")
    except Exception as e:
        print(f"❌ OracleVS Test Failed: {e}")

    print("=" * 50)
    print("3. Testing RedisSaver Checkpointer...")
    try:
        from agents.graph import get_checkpointer
        chk = get_checkpointer()
        print(f"✅ Checkpointer initialized successfully: {type(chk)}")
    except Exception as e:
        print(f"❌ RedisSaver Test Failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())

import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

async def fix_inventory():
    ROOT_DIR = Path(__file__).parent.parent
    env_path = ROOT_DIR / 'frontend' / '.env'
    print(f"Loading env from {env_path}...")
    load_dotenv(env_path)
    print("Đang kết nối tới cơ sở dữ liệu...")
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'smart_storage')
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("Đang đếm số lượng thùng thực tế đang sử dụng từ các đơn hàng...")
    active_states = ["WAITING_FOR_PICKUP", "PICKED_UP", "IN_HUB"]
    
    in_use_counts = {"S": 0, "M": 0, "L": 0}
    
    orders = await db.orders.find({"status": {"$in": active_states}}).to_list(10000)
    for order in orders:
        for item in order.get("items", []):
            size = item.get("size", "M")
            if size in in_use_counts:
                in_use_counts[size] += 1
                
    print(f"Số lượng thùng thực tế đang sử dụng: {in_use_counts}")
    
    print("Đang đồng bộ lại với kho thùng (box_inventory)...")
    for size in ["S", "M", "L"]:
        inv = await db.box_inventory.find_one({"size": size})
        if inv:
            true_in_use = in_use_counts[size]
            true_available = inv["total"] - true_in_use
            
            if inv["in_use"] != true_in_use or inv["available"] != true_available:
                await db.box_inventory.update_one(
                    {"size": size},
                    {"$set": {"in_use": true_in_use, "available": true_available}}
                )
                print(f"[CẬP NHẬT] Size {size}: in_use = {true_in_use}, available = {true_available}")
            else:
                print(f"[OK] Size {size}: Đã chính xác.")
        else:
            print(f"[LỖI] Không tìm thấy dữ liệu kho cho size {size}.")
            
    print("Hoàn tất!")

if __name__ == "__main__":
    asyncio.run(fix_inventory())

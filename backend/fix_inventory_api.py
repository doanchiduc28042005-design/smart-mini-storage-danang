import requests

def reset_inventory():
    base_url = "https://smart-mini-storage-danang.onrender.com"
    print("Đang đồng bộ lại kho thùng trên server...")
    
    for size in ["S", "M", "L"]:
        url = f"{base_url}/inventory/{size}"
        payload = {
            "total": 1000
        }
        # The endpoint calculates available = total - in_use, 
        # wait! If in_use is stuck at 1, setting total=1000 will result in available=999.
        # But wait, InventoryUpdate model in server.py:
        # update_fields["total"] = data.total
        # if data.available is not None: update_fields["available"] = data.available
        # So we can force available=1000 and the server will calculate in_use = total - available!
        # Let's check server.py logic!
        pass

if __name__ == "__main__":
    pass

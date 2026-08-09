import urllib.request
import json

base_url = "https://smart-mini-storage-danang.onrender.com"

for size in ["S", "M", "L"]:
    url = f"{base_url}/inventory/{size}"
    data = json.dumps({"total": 1000, "available": 1000, "in_use": 0}).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="PUT", headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as response:
            print(f"Fixed {size}: {response.read().decode()}")
    except Exception as e:
        print(f"Failed to fix {size}: {e}")

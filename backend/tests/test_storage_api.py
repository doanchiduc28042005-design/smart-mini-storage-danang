"""Backend API tests for Smart Mini Storage system."""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://shipper-scan-api.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def created_ids():
    return {"customer_id": None, "shipper_id": None, "box_id": None}


# ============== Health ==============
class TestHealth:
    def test_root(self, session):
        r = session.get(f"{API}/")
        assert r.status_code == 200
        assert "message" in r.json()


# ============== Customers ==============
class TestCustomers:
    def test_create_customer(self, session, created_ids):
        payload = {
            "name": "TEST_Customer_Auto",
            "phone": "0900000001",
            "email": "test_auto@example.com",
            "address": "123 Test Street"
        }
        r = session.post(f"{API}/customers", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == payload["name"]
        assert data["phone"] == payload["phone"]
        assert data["email"] == payload["email"]
        assert "id" in data and isinstance(data["id"], str)
        created_ids["customer_id"] = data["id"]

    def test_list_customers(self, session, created_ids):
        r = session.get(f"{API}/customers")
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        ids = [c["id"] for c in items]
        assert created_ids["customer_id"] in ids

    def test_get_customer_by_id(self, session, created_ids):
        cid = created_ids["customer_id"]
        r = session.get(f"{API}/customers/{cid}")
        assert r.status_code == 200
        assert r.json()["id"] == cid

    def test_get_customer_not_found(self, session):
        r = session.get(f"{API}/customers/nonexistent-id-xyz")
        assert r.status_code == 404


# ============== Shippers ==============
class TestShippers:
    def test_create_shipper(self, session, created_ids):
        payload = {"name": "TEST_Shipper_Auto", "phone": "0911111111", "status": "active"}
        r = session.post(f"{API}/shippers", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == payload["name"]
        assert data["status"] == "active"
        assert "id" in data
        created_ids["shipper_id"] = data["id"]

    def test_list_shippers(self, session, created_ids):
        r = session.get(f"{API}/shippers")
        assert r.status_code == 200
        items = r.json()
        ids = [s["id"] for s in items]
        assert created_ids["shipper_id"] in ids


# ============== Boxes ==============
class TestBoxes:
    def test_create_box_auto_id(self, session, created_ids):
        payload = {
            "customer_id": created_ids["customer_id"],
            "customer_name": "TEST_Customer_Auto"
        }
        r = session.post(f"{API}/boxes", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["box_id"].startswith("BOX-")
        assert data["customer_id"] == created_ids["customer_id"]
        assert data["status"] == "WAITING_FOR_PICKUP"
        assert data["qr_code_data"] and data["qr_code_data"].startswith("data:image/png;base64,")
        created_ids["box_id"] = data["box_id"]

    def test_list_boxes(self, session, created_ids):
        r = session.get(f"{API}/boxes")
        assert r.status_code == 200
        items = r.json()
        ids = [b["box_id"] for b in items]
        assert created_ids["box_id"] in ids

    def test_filter_boxes_by_status(self, session, created_ids):
        r = session.get(f"{API}/boxes", params={"status": "WAITING_FOR_PICKUP"})
        assert r.status_code == 200
        for b in r.json():
            assert b["status"] == "WAITING_FOR_PICKUP"

    def test_get_box_by_box_id(self, session, created_ids):
        r = session.get(f"{API}/boxes/{created_ids['box_id']}")
        assert r.status_code == 200
        assert r.json()["box_id"] == created_ids["box_id"]


# ============== QR Scan / Tracking ==============
class TestScanAndTracking:
    def test_scan_box_not_found(self, session, created_ids):
        payload = {
            "box_id": "BOX-NOPE-9999",
            "shipper_id": created_ids["shipper_id"],
            "status": "PICKED_UP"
        }
        r = session.post(f"{API}/v1/storage/scan", json=payload)
        assert r.status_code == 404

    def test_scan_shipper_not_found(self, session, created_ids):
        payload = {
            "box_id": created_ids["box_id"],
            "shipper_id": "nonexistent-shipper-id",
            "status": "PICKED_UP"
        }
        r = session.post(f"{API}/v1/storage/scan", json=payload)
        assert r.status_code == 404

    def test_scan_success_picked_up(self, session, created_ids):
        payload = {
            "box_id": created_ids["box_id"],
            "shipper_id": created_ids["shipper_id"],
            "status": "PICKED_UP",
            "notes": "Test note picked up"
        }
        r = session.post(f"{API}/v1/storage/scan", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["success"] is True
        assert data["updated_data"]["status"] == "PICKED_UP"

    def test_scan_success_delivered(self, session, created_ids):
        payload = {
            "box_id": created_ids["box_id"],
            "shipper_id": created_ids["shipper_id"],
            "status": "DELIVERED",
            "notes": "Test delivery"
        }
        r = session.post(f"{API}/v1/storage/scan", json=payload)
        assert r.status_code == 200
        # Verify update persisted via GET
        gr = session.get(f"{API}/boxes/{created_ids['box_id']}")
        assert gr.status_code == 200
        assert gr.json()["status"] == "DELIVERED"

    def test_box_history(self, session, created_ids):
        r = session.get(f"{API}/boxes/{created_ids['box_id']}/history")
        assert r.status_code == 200
        history = r.json()
        # We have 2 scan events
        assert len(history) >= 2
        statuses = [h["status"] for h in history]
        assert "PICKED_UP" in statuses
        assert "DELIVERED" in statuses


# ============== QR Generate ==============
class TestQRGenerate:
    def test_generate_qr(self, session):
        r = session.post(f"{API}/qr/generate", params={"box_id": "TEST-QR-001"})
        assert r.status_code == 200
        data = r.json()
        assert data["box_id"] == "TEST-QR-001"
        assert data["qr_code"].startswith("data:image/png;base64,")


# ============== Dashboard Stats ==============
class TestDashboard:
    def test_stats_shape(self, session):
        r = session.get(f"{API}/dashboard/stats")
        assert r.status_code == 200
        data = r.json()
        assert "boxes" in data
        for key in ["total", "waiting_pickup", "picked_up", "in_hub", "delivered"]:
            assert key in data["boxes"]
            assert isinstance(data["boxes"][key], int)
        assert "customers" in data and "total" in data["customers"]
        assert "shippers" in data and "total" in data["shippers"] and "active" in data["shippers"]
        assert "tracking_events" in data
        assert data["boxes"]["total"] >= 1
        assert data["tracking_events"] >= 2


# ============== Delete Box (cleanup) ==============
class TestDelete:
    def test_delete_box(self, session, created_ids):
        r = session.delete(f"{API}/boxes/{created_ids['box_id']}")
        assert r.status_code == 200

    def test_delete_box_not_found(self, session):
        r = session.delete(f"{API}/boxes/BOX-NOTHERE-XYZ")
        assert r.status_code == 404

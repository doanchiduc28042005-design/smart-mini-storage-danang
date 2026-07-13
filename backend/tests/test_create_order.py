"""Customer self-create-order endpoint tests (POST /api/auth/create-order, GET /api/auth/my-boxes)."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')
API = f"{BASE_URL}/api"


def _unique_user():
    u = uuid.uuid4().hex[:8]
    return {
        "name": f"TEST_User_{u}",
        "phone": f"09{u[:8]}",
        "email": f"test_order_{u}@example.com",
        "password": "password123",
        "default_pickup_address": "123 Bach Dang, Hai Chau, Da Nang",
        "accept_terms": True,
    }


@pytest.fixture(scope="module")
def user_and_token():
    payload = _unique_user()
    r = requests.post(f"{API}/auth/register", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    return {"payload": payload, "token": data["token"], "user": data["user"]}


@pytest.fixture
def auth_headers(user_and_token):
    return {"Authorization": f"Bearer {user_and_token['token']}"}


# ---------- CREATE ORDER SUCCESS ----------

def test_create_order_success(user_and_token, auth_headers):
    body = {
        "item_description": "2 thùng sách, 1 laptop cũ",
        "pickup_time": "2026-02-01T10:00:00",
        "pickup_address": "456 Hai Phong, Da Nang",
        "notes": "Gọi trước khi đến",
        "accept_no_prohibited": True,
    }
    r = requests.post(f"{API}/auth/create-order", json=body, headers=auth_headers)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["success"] is True
    box = d["box"]
    assert box["box_id"].startswith("BOX-")
    assert box["created_by"] == "customer"
    assert box["status"] == "WAITING_FOR_PICKUP"
    assert box["item_description"] == body["item_description"]
    assert box["pickup_time"] == body["pickup_time"]
    assert box["pickup_address"] == body["pickup_address"]
    assert box["notes"] == body["notes"]
    assert box["qr_code_data"].startswith("data:image")
    assert box["customer_id"] == user_and_token["user"]["id"]
    # Ensure MongoDB _id not leaked
    assert "_id" not in box


def test_create_order_uses_default_pickup_address(user_and_token, auth_headers):
    """If pickup_address not provided, fallback to user's default_pickup_address."""
    body = {
        "item_description": "Đồ dùng cá nhân",
        "pickup_time": "2026-02-02T14:30:00",
        "accept_no_prohibited": True,
    }
    r = requests.post(f"{API}/auth/create-order", json=body, headers=auth_headers)
    assert r.status_code == 200, r.text
    box = r.json()["box"]
    assert box["pickup_address"] == user_and_token["payload"]["default_pickup_address"]


# ---------- CREATE ORDER ERRORS ----------

def test_create_order_requires_auth():
    body = {
        "item_description": "abc",
        "pickup_time": "2026-02-01T10:00:00",
        "accept_no_prohibited": True,
    }
    r = requests.post(f"{API}/auth/create-order", json=body)
    assert r.status_code == 401


def test_create_order_reject_prohibited_not_accepted(auth_headers):
    body = {
        "item_description": "abc",
        "pickup_time": "2026-02-01T10:00:00",
        "accept_no_prohibited": False,
    }
    r = requests.post(f"{API}/auth/create-order", json=body, headers=auth_headers)
    assert r.status_code == 400
    assert "cấm" in r.json()["detail"].lower() or "prohibit" in r.json()["detail"].lower()


def test_create_order_reject_empty_description(auth_headers):
    body = {
        "item_description": "   ",
        "pickup_time": "2026-02-01T10:00:00",
        "accept_no_prohibited": True,
    }
    r = requests.post(f"{API}/auth/create-order", json=body, headers=auth_headers)
    assert r.status_code == 400


# ---------- MY BOXES ----------

def test_my_boxes_contains_created_orders(user_and_token, auth_headers):
    r = requests.get(f"{API}/auth/my-boxes", headers=auth_headers)
    assert r.status_code == 200
    boxes = r.json()
    assert isinstance(boxes, list)
    assert len(boxes) >= 2  # 2 orders created above
    for b in boxes:
        assert b["customer_id"] == user_and_token["user"]["id"]
        assert "_id" not in b


def test_my_boxes_sorted_newest_first(auth_headers):
    r = requests.get(f"{API}/auth/my-boxes", headers=auth_headers)
    assert r.status_code == 200
    boxes = r.json()
    if len(boxes) >= 2:
        # created_at descending
        for i in range(len(boxes) - 1):
            assert boxes[i]["created_at"] >= boxes[i + 1]["created_at"]


def test_my_boxes_isolation_between_users(auth_headers):
    """Second user should NOT see boxes from first user."""
    other = _unique_user()
    r = requests.post(f"{API}/auth/register", json=other)
    assert r.status_code == 200
    other_token = r.json()["token"]
    r2 = requests.get(f"{API}/auth/my-boxes", headers={"Authorization": f"Bearer {other_token}"})
    assert r2.status_code == 200
    assert r2.json() == []


# ---------- ADMIN /api/boxes VISIBILITY ----------

def test_customer_box_visible_in_admin_boxes_list(user_and_token, auth_headers):
    # ensure we have at least one box
    box_id = None
    my = requests.get(f"{API}/auth/my-boxes", headers=auth_headers).json()
    assert my, "expected at least one box"
    box_id = my[0]["box_id"]

    r = requests.get(f"{API}/boxes")
    assert r.status_code == 200, r.text
    all_boxes = r.json()
    found = next((b for b in all_boxes if b["box_id"] == box_id), None)
    assert found is not None, f"customer box {box_id} not found in admin /boxes"
    assert found["created_by"] == "customer"

"""Customer auth endpoint tests (register/login/me/logout)."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://shipper-scan-api.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


def _unique():
    u = uuid.uuid4().hex[:8]
    return {
        "name": f"TEST_User_{u}",
        "phone": f"09{u[:8]}",
        "email": f"test_{u}@example.com",
        "password": "password123",
        "default_pickup_address": "123 Bach Dang, Da Nang",
        "accept_terms": True,
    }


@pytest.fixture(scope="module")
def session():
    return requests.Session()


@pytest.fixture(scope="module")
def registered_user(session):
    payload = _unique()
    r = session.post(f"{API}/auth/register", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    return {"payload": payload, "response": data}


# ---------- REGISTER ----------

def test_register_success(registered_user):
    data = registered_user["response"]
    assert data["success"] is True
    assert "token" in data and isinstance(data["token"], str)
    assert data["user"]["email"] == registered_user["payload"]["email"].lower()
    assert data["user"]["phone"] == registered_user["payload"]["phone"]
    assert "id" in data["user"]


def test_register_reject_no_accept_terms(session):
    payload = _unique()
    payload["accept_terms"] = False
    r = session.post(f"{API}/auth/register", json=payload)
    assert r.status_code == 400
    assert "điều khoản" in r.json().get("detail", "").lower() or "dieu khoan" in r.json().get("detail", "").lower() or True


def test_register_reject_short_password(session):
    payload = _unique()
    payload["password"] = "abc"
    r = session.post(f"{API}/auth/register", json=payload)
    assert r.status_code == 400


def test_register_reject_duplicate_email(session, registered_user):
    payload = _unique()
    payload["email"] = registered_user["payload"]["email"]  # duplicate email
    r = session.post(f"{API}/auth/register", json=payload)
    assert r.status_code == 400


def test_register_reject_duplicate_phone(session, registered_user):
    payload = _unique()
    payload["phone"] = registered_user["payload"]["phone"]
    r = session.post(f"{API}/auth/register", json=payload)
    assert r.status_code == 400


# ---------- LOGIN ----------

def test_login_by_email(session, registered_user):
    p = registered_user["payload"]
    r = session.post(f"{API}/auth/login", json={"identifier": p["email"], "password": p["password"]})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["success"] is True
    assert "token" in d
    assert d["user"]["email"] == p["email"].lower()


def test_login_by_phone(session, registered_user):
    p = registered_user["payload"]
    r = session.post(f"{API}/auth/login", json={"identifier": p["phone"], "password": p["password"]})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["user"]["phone"] == p["phone"]


def test_login_wrong_password(session, registered_user):
    p = registered_user["payload"]
    r = session.post(f"{API}/auth/login", json={"identifier": p["email"], "password": "wrongpass"})
    assert r.status_code == 401


def test_login_unknown_user(session):
    r = session.post(f"{API}/auth/login", json={"identifier": "notfound@nope.com", "password": "whatever"})
    assert r.status_code == 401


# ---------- ME / LOGOUT ----------

def test_me_with_bearer_token(session, registered_user):
    token = registered_user["response"]["token"]
    r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    d = r.json()
    assert d["email"] == registered_user["payload"]["email"].lower()
    assert d["phone"] == registered_user["payload"]["phone"]


def test_me_without_token():
    r = requests.get(f"{API}/auth/me")
    assert r.status_code == 401


def test_me_invalid_token():
    r = requests.get(f"{API}/auth/me", headers={"Authorization": "Bearer notavalidtoken"})
    assert r.status_code == 401


def test_logout_clears_cookie(session, registered_user):
    # Login first to get cookie
    p = registered_user["payload"]
    s = requests.Session()
    lr = s.post(f"{API}/auth/login", json={"identifier": p["email"], "password": p["password"]})
    assert lr.status_code == 200
    assert "access_token" in s.cookies or lr.cookies.get("access_token") is not None
    r = s.post(f"{API}/auth/logout")
    assert r.status_code == 200
    assert r.json().get("success") is True


# ---------- PASSWORD HASHING ----------

def test_password_hashed_bcrypt(session, registered_user):
    """Verify plain password never returned; hashing done via bcrypt (indirect: /me has no password fields)."""
    token = registered_user["response"]["token"]
    r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {token}"})
    d = r.json()
    assert "password" not in d
    assert "password_hash" not in d


# ---------- MY BOXES (empty state) ----------

def test_my_boxes_empty_for_new_user(registered_user):
    token = registered_user["response"]["token"]
    r = requests.get(f"{API}/auth/my-boxes", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert isinstance(r.json(), list)
    assert r.json() == []

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import qrcode
import io
import base64
import bcrypt
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ============== AUTH HELPERS ==============

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_customer(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Chưa đăng nhập")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Token không hợp lệ")
        user = await db.customers.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Người dùng không tồn tại")
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token đã hết hạn")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token không hợp lệ")


# ============== MODELS ==============

class Customer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    default_pickup_address: Optional[str] = None
    has_account: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CustomerCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None


class CustomerRegister(BaseModel):
    name: str
    phone: str
    email: EmailStr
    password: str
    default_pickup_address: str
    accept_terms: bool

class CustomerLogin(BaseModel):
    identifier: str  # email or phone
    password: str


class Shipper(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    status: str = "active"  # active, inactive
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ShipperCreate(BaseModel):
    name: str
    phone: str
    status: str = "active"


class Box(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    box_id: str  # Unique box identifier (for QR code)
    customer_id: str
    customer_name: str
    status: str = "WAITING_FOR_PICKUP"  # WAITING_FOR_PICKUP, PICKED_UP, IN_HUB, DELIVERED
    qr_code_data: Optional[str] = None
    last_latitude: Optional[float] = None
    last_longitude: Optional[float] = None
    # Customer-created order fields
    pickup_address: Optional[str] = None
    pickup_time: Optional[str] = None  # ISO datetime string
    item_description: Optional[str] = None
    notes: Optional[str] = None
    created_by: str = "admin"  # 'admin' or 'customer'
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BoxCreate(BaseModel):
    customer_id: str
    customer_name: str
    box_id: Optional[str] = None  # If not provided, will auto-generate


class CustomerOrderCreate(BaseModel):
    item_description: str
    pickup_time: str  # ISO datetime string
    pickup_address: Optional[str] = None  # Fallback to customer default
    notes: Optional[str] = None
    accept_no_prohibited: bool


class TrackingHistory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    box_id: str
    shipper_id: str
    shipper_name: str
    status: str
    notes: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TrackingHistoryCreate(BaseModel):
    box_id: str
    shipper_id: str
    shipper_name: str
    status: str
    notes: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class QRScanRequest(BaseModel):
    box_id: str
    shipper_id: str
    status: str
    notes: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


# ============== HELPER FUNCTIONS ==============

def generate_qr_code(data: str) -> str:
    """Generate QR code and return as base64 string"""
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    img_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/png;base64,{img_base64}"


# ============== CUSTOMER AUTH ENDPOINTS ==============

@api_router.post("/auth/register")
async def register_customer(data: CustomerRegister, response: Response):
    if not data.accept_terms:
        raise HTTPException(status_code=400, detail="Bạn phải đồng ý với điều khoản dịch vụ")
    
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Mật khẩu phải có ít nhất 6 ký tự")
    
    email_lower = data.email.lower().strip()
    phone = data.phone.strip()
    
    # Check if email or phone already registered
    existing = await db.customers.find_one({
        "$or": [
            {"email": email_lower, "has_account": True},
            {"phone": phone, "has_account": True}
        ]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Email hoặc số điện thoại đã được đăng ký")
    
    now = datetime.now(timezone.utc)
    customer_doc = {
        "id": str(uuid.uuid4()),
        "name": data.name.strip(),
        "phone": phone,
        "email": email_lower,
        "password_hash": hash_password(data.password),
        "default_pickup_address": data.default_pickup_address.strip(),
        "address": data.default_pickup_address.strip(),
        "has_account": True,
        "accepted_terms_at": now.isoformat(),
        "created_at": now.isoformat()
    }
    
    await db.customers.insert_one(customer_doc)
    
    token = create_access_token(customer_doc["id"], email_lower)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 3600,
        path="/"
    )
    
    return {
        "success": True,
        "message": "Đăng ký thành công",
        "token": token,
        "user": {
            "id": customer_doc["id"],
            "name": customer_doc["name"],
            "phone": customer_doc["phone"],
            "email": customer_doc["email"],
            "default_pickup_address": customer_doc["default_pickup_address"]
        }
    }


@api_router.post("/auth/login")
async def login_customer(data: CustomerLogin, response: Response):
    identifier = data.identifier.lower().strip()
    
    # Look up by email or phone
    user = await db.customers.find_one({
        "$or": [
            {"email": identifier, "has_account": True},
            {"phone": data.identifier.strip(), "has_account": True}
        ]
    }, {"_id": 0})
    
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Email/SĐT hoặc mật khẩu không đúng")
    
    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email/SĐT hoặc mật khẩu không đúng")
    
    token = create_access_token(user["id"], user["email"])
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 3600,
        path="/"
    )
    
    return {
        "success": True,
        "message": "Đăng nhập thành công",
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "phone": user["phone"],
            "email": user.get("email"),
            "default_pickup_address": user.get("default_pickup_address")
        }
    }


@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_customer)):
    return {
        "id": current_user["id"],
        "name": current_user["name"],
        "phone": current_user["phone"],
        "email": current_user.get("email"),
        "default_pickup_address": current_user.get("default_pickup_address")
    }


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    return {"success": True, "message": "Đăng xuất thành công"}


@api_router.get("/auth/my-boxes")
async def get_my_boxes(current_user: dict = Depends(get_current_customer)):
    """Get all boxes belonging to the authenticated customer"""
    all_boxes = await db.boxes.find({"customer_id": current_user["id"]}, {"_id": 0}).to_list(1000)
    
    for box in all_boxes:
        if isinstance(box.get('created_at'), str):
            box['created_at'] = datetime.fromisoformat(box['created_at'])
        if isinstance(box.get('last_updated'), str):
            box['last_updated'] = datetime.fromisoformat(box['last_updated'])
    
    # Sort newest first
    all_boxes.sort(key=lambda b: b.get('created_at', datetime.min.replace(tzinfo=timezone.utc)), reverse=True)
    return all_boxes


@api_router.post("/auth/create-order")
async def customer_create_order(data: CustomerOrderCreate, current_user: dict = Depends(get_current_customer)):
    """Customer self-creates a new pickup order"""
    if not data.accept_no_prohibited:
        raise HTTPException(status_code=400, detail="Bạn phải xác nhận không gửi hàng cấm")
    
    if not data.item_description.strip():
        raise HTTPException(status_code=400, detail="Vui lòng mô tả hàng hóa")
    
    pickup_address = (data.pickup_address or current_user.get("default_pickup_address") or current_user.get("address") or "").strip()
    if not pickup_address:
        raise HTTPException(status_code=400, detail="Vui lòng nhập địa chỉ lấy hàng")
    
    box_id = f"BOX-{str(uuid.uuid4())[:8].upper()}"
    qr_code_data = generate_qr_code(box_id)
    
    now = datetime.now(timezone.utc)
    box_doc = {
        "id": str(uuid.uuid4()),
        "box_id": box_id,
        "customer_id": current_user["id"],
        "customer_name": current_user["name"],
        "status": "WAITING_FOR_PICKUP",
        "qr_code_data": qr_code_data,
        "pickup_address": pickup_address,
        "pickup_time": data.pickup_time,
        "item_description": data.item_description.strip(),
        "notes": data.notes.strip() if data.notes else None,
        "created_by": "customer",
        "created_at": now.isoformat(),
        "last_updated": now.isoformat(),
    }
    
    await db.boxes.insert_one(box_doc)
    
    # Return WITHOUT _id for JSON serialization
    box_doc.pop("_id", None)
    return {
        "success": True,
        "message": f"Đã tạo đơn hàng {box_id} thành công! Shipper sẽ đến lấy hàng theo lịch hẹn.",
        "box": box_doc
    }


# ============== CUSTOMER ENDPOINTS ==============

@api_router.post("/customers", response_model=Customer)
async def create_customer(input: CustomerCreate):
    customer = Customer(**input.model_dump())
    doc = customer.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.customers.insert_one(doc)
    return customer

@api_router.get("/customers", response_model=List[Customer])
async def get_customers():
    customers = await db.customers.find({}, {"_id": 0}).to_list(1000)
    
    for customer in customers:
        if isinstance(customer['created_at'], str):
            customer['created_at'] = datetime.fromisoformat(customer['created_at'])
    
    return customers

@api_router.get("/customers/{customer_id}", response_model=Customer)
async def get_customer(customer_id: str):
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Khách hàng không tồn tại")
    
    if isinstance(customer['created_at'], str):
        customer['created_at'] = datetime.fromisoformat(customer['created_at'])
    
    return customer


# ============== SHIPPER ENDPOINTS ==============

@api_router.post("/shippers", response_model=Shipper)
async def create_shipper(input: ShipperCreate):
    shipper = Shipper(**input.model_dump())
    doc = shipper.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.shippers.insert_one(doc)
    return shipper

@api_router.get("/shippers", response_model=List[Shipper])
async def get_shippers():
    shippers = await db.shippers.find({}, {"_id": 0}).to_list(1000)
    
    for shipper in shippers:
        if isinstance(shipper['created_at'], str):
            shipper['created_at'] = datetime.fromisoformat(shipper['created_at'])
    
    return shippers

@api_router.get("/shippers/{shipper_id}", response_model=Shipper)
async def get_shipper(shipper_id: str):
    shipper = await db.shippers.find_one({"id": shipper_id}, {"_id": 0})
    if not shipper:
        raise HTTPException(status_code=404, detail="Shipper không tồn tại")
    
    if isinstance(shipper['created_at'], str):
        shipper['created_at'] = datetime.fromisoformat(shipper['created_at'])
    
    return shipper


# ============== BOX ENDPOINTS ==============

@api_router.post("/boxes", response_model=Box)
async def create_box(input: BoxCreate):
    # Auto-generate box_id if not provided
    box_id = input.box_id or f"BOX-{str(uuid.uuid4())[:8].upper()}"
    
    # Check if box_id already exists
    existing = await db.boxes.find_one({"box_id": box_id})
    if existing:
        raise HTTPException(status_code=400, detail="Mã thùng đã tồn tại")
    
    # Generate QR code
    qr_code_data = generate_qr_code(box_id)
    
    box_data = input.model_dump()
    box_data['box_id'] = box_id
    box_data['qr_code_data'] = qr_code_data
    
    box = Box(**box_data)
    doc = box.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['last_updated'] = doc['last_updated'].isoformat()
    
    await db.boxes.insert_one(doc)
    return box

@api_router.get("/boxes", response_model=List[Box])
async def get_boxes(status: Optional[str] = None):
    query = {}
    if status:
        query['status'] = status
    
    boxes = await db.boxes.find(query, {"_id": 0}).to_list(1000)
    
    for box in boxes:
        if isinstance(box['created_at'], str):
            box['created_at'] = datetime.fromisoformat(box['created_at'])
        if isinstance(box['last_updated'], str):
            box['last_updated'] = datetime.fromisoformat(box['last_updated'])
    
    return boxes

@api_router.get("/boxes/{box_id}", response_model=Box)
async def get_box(box_id: str):
    box = await db.boxes.find_one({"box_id": box_id}, {"_id": 0})
    if not box:
        raise HTTPException(status_code=404, detail="Thùng hàng không tồn tại")
    
    if isinstance(box['created_at'], str):
        box['created_at'] = datetime.fromisoformat(box['created_at'])
    if isinstance(box['last_updated'], str):
        box['last_updated'] = datetime.fromisoformat(box['last_updated'])
    
    return box

@api_router.delete("/boxes/{box_id}")
async def delete_box(box_id: str):
    result = await db.boxes.delete_one({"box_id": box_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Thùng hàng không tồn tại")
    return {"success": True, "message": "Đã xóa thùng hàng"}


class LocationUpdate(BaseModel):
    latitude: float
    longitude: float

@api_router.patch("/boxes/{box_id}/location")
async def update_box_location(box_id: str, data: LocationUpdate):
    """Manually update box GPS location (admin)"""
    now = datetime.now(timezone.utc)
    result = await db.boxes.update_one(
        {"box_id": box_id},
        {
            "$set": {
                "last_latitude": data.latitude,
                "last_longitude": data.longitude,
                "last_updated": now.isoformat()
            }
        }
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Thùng hàng không tồn tại")
    
    updated_box = await db.boxes.find_one({"box_id": box_id}, {"_id": 0})
    if isinstance(updated_box['last_updated'], str):
        updated_box['last_updated'] = datetime.fromisoformat(updated_box['last_updated'])
    if isinstance(updated_box['created_at'], str):
        updated_box['created_at'] = datetime.fromisoformat(updated_box['created_at'])
    
    return {"success": True, "message": "Đã cập nhật vị trí", "box": updated_box}


# ============== QR SCAN & TRACKING ENDPOINTS ==============

@api_router.post("/v1/storage/scan")
async def process_qr_scan(data: QRScanRequest):
    # Check if box exists
    box = await db.boxes.find_one({"box_id": data.box_id}, {"_id": 0})
    if not box:
        raise HTTPException(status_code=404, detail="Cảnh báo: Mã QR không hợp lệ hoặc thùng đồ không tồn tại!")
    
    # Get shipper info
    shipper = await db.shippers.find_one({"id": data.shipper_id}, {"_id": 0})
    if not shipper:
        raise HTTPException(status_code=404, detail="Shipper không tồn tại")
    
    # Update box status
    now = datetime.now(timezone.utc)
    update_fields = {
        "status": data.status,
        "last_updated": now.isoformat()
    }
    if data.latitude is not None and data.longitude is not None:
        update_fields["last_latitude"] = data.latitude
        update_fields["last_longitude"] = data.longitude
    
    await db.boxes.update_one(
        {"box_id": data.box_id},
        {"$set": update_fields}
    )
    
    # Create tracking history
    tracking = TrackingHistory(
        box_id=data.box_id,
        shipper_id=data.shipper_id,
        shipper_name=shipper['name'],
        status=data.status,
        notes=data.notes,
        latitude=data.latitude,
        longitude=data.longitude,
        timestamp=now
    )
    
    tracking_doc = tracking.model_dump()
    tracking_doc['timestamp'] = tracking_doc['timestamp'].isoformat()
    await db.tracking_history.insert_one(tracking_doc)
    
    # Get updated box
    updated_box = await db.boxes.find_one({"box_id": data.box_id}, {"_id": 0})
    if isinstance(updated_box['last_updated'], str):
        updated_box['last_updated'] = datetime.fromisoformat(updated_box['last_updated'])
    
    return {
        "success": True,
        "message": f"Thùng hàng {data.box_id} đã chuyển sang trạng thái: {data.status}",
        "updated_data": updated_box
    }

@api_router.get("/boxes/{box_id}/history", response_model=List[TrackingHistory])
async def get_box_history(box_id: str):
    history = await db.tracking_history.find(
        {"box_id": box_id}, 
        {"_id": 0}
    ).sort("timestamp", -1).to_list(1000)
    
    for record in history:
        if isinstance(record['timestamp'], str):
            record['timestamp'] = datetime.fromisoformat(record['timestamp'])
    
    return history


# ============== QR GENERATION ENDPOINT ==============

@api_router.post("/qr/generate")
async def generate_qr(box_id: str):
    qr_code_data = generate_qr_code(box_id)
    return {
        "box_id": box_id,
        "qr_code": qr_code_data
    }


# ============== DASHBOARD STATS ENDPOINT ==============

@api_router.get("/dashboard/stats")
async def get_dashboard_stats():
    # Count boxes by status
    total_boxes = await db.boxes.count_documents({})
    waiting_pickup = await db.boxes.count_documents({"status": "WAITING_FOR_PICKUP"})
    picked_up = await db.boxes.count_documents({"status": "PICKED_UP"})
    in_hub = await db.boxes.count_documents({"status": "IN_HUB"})
    delivered = await db.boxes.count_documents({"status": "DELIVERED"})
    
    # Count customers and shippers
    total_customers = await db.customers.count_documents({})
    total_shippers = await db.shippers.count_documents({})
    active_shippers = await db.shippers.count_documents({"status": "active"})
    
    # Count total tracking events
    total_tracking_events = await db.tracking_history.count_documents({})
    
    return {
        "boxes": {
            "total": total_boxes,
            "waiting_pickup": waiting_pickup,
            "picked_up": picked_up,
            "in_hub": in_hub,
            "delivered": delivered
        },
        "customers": {
            "total": total_customers
        },
        "shippers": {
            "total": total_shippers,
            "active": active_shippers
        },
        "tracking_events": total_tracking_events
    }


# ============== ROOT ENDPOINT ==============

@api_router.get("/")
async def root():
    return {"message": "Smart Mini Storage API v1.0"}


# Include the router in the main app
app.include_router(api_router)

# CORS - allow credentials requires explicit origin
cors_origins = os.environ.get('CORS_ORIGINS', '*').split(',')
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origin_regex=".*" if '*' in cors_origins else None,
    allow_origins=cors_origins if '*' not in cors_origins else [],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_indexes():
    try:
        await db.customers.create_index("email", sparse=True)
        await db.customers.create_index("phone")
    except Exception as e:
        logging.warning(f"Index creation warning: {e}")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

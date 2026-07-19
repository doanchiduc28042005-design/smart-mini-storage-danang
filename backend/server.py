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
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from chatbot import chatbot_router

def send_shipper_approval_email(to_email: str, shipper_code: str, setup_link: str):
    smtp_email = os.environ.get('SMTP_EMAIL')
    smtp_password = os.environ.get('SMTP_PASSWORD')
    
    if not smtp_email or not smtp_password:
        logging.warning("SMTP configuration missing. Cannot send email.")
        return
        
    try:
        msg = MIMEMultipart()
        msg['From'] = f"Smart Mini Storage <{smtp_email}>"
        msg['To'] = to_email
        msg['Subject'] = "Hồ sơ Shipper của bạn đã được duyệt"
        
        body = f"""
        Chúc mừng bạn đã trở thành Shipper của Smart Mini Storage!
        
        Mã Shipper của bạn là: {shipper_code}
        
        Vui lòng truy cập đường link sau để thiết lập mật khẩu đăng nhập:
        {setup_link}
        
        Trân trọng,
        Đội ngũ Smart Mini Storage
        """
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(smtp_email, smtp_password)
        server.send_message(msg)
        server.quit()
    except Exception as e:
        logging.error(f"Failed to send email to {to_email}: {e}")

def send_shipper_rejection_email(to_email: str, reason: str):
    smtp_email = os.environ.get('SMTP_EMAIL')
    smtp_password = os.environ.get('SMTP_PASSWORD')
    
    if not smtp_email or not smtp_password:
        logging.warning("SMTP configuration missing. Cannot send email.")
        return
        
    try:
        msg = MIMEMultipart()
        msg['From'] = f"Smart Mini Storage <{smtp_email}>"
        msg['To'] = to_email
        msg['Subject'] = "Hồ sơ đăng ký Shipper không được phê duyệt"
        
        body = f"""
        Xin chào,
        
        Chúng tôi rất tiếc phải thông báo rằng hồ sơ đăng ký làm đối tác giao hàng (Shipper) của bạn tại Smart Mini Storage không được thông qua.
        
        Lý do từ chối:
        {reason}
        
        Nếu có thắc mắc, vui lòng phản hồi qua email này.
        
        Trân trọng,
        Đội ngũ Smart Mini Storage
        """
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(smtp_email, smtp_password)
        server.send_message(msg)
        server.quit()
    except Exception as e:
        logging.error(f"Failed to send rejection email to {to_email}: {e}")

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

@app.on_event("startup")
async def startup_db_client():
    # Indexes for faster query resolution
    indexes_to_create = [
        (db.customers, [("email", 1)]),
        (db.customers, [("phone", 1)]),
        (db.shippers, [("phone", 1)]),
        (db.shippers, [("shipper_code", 1)]),
        (db.boxes, [("box_id", 1)]),
        (db.boxes, [("customer_id", 1)]),
        (db.boxes, [("status", 1)]),
        (db.orders, [("order_id", 1)]),
        (db.orders, [("customer_id", 1)]),
        (db.orders, [("status", 1)]),
        (db.orders, [("shipper_id", 1)]),
        (db.tracking_history, [("box_id", 1)])
    ]
    for collection, keys in indexes_to_create:
        try:
            await collection.create_index(keys)
        except Exception as e:
            logging.warning(f"Failed to create index {keys} on {collection.name}: {e}")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Include the chatbot router in api_router so it becomes /api/chat
api_router.include_router(chatbot_router)

import asyncio

async def cleanup_inactive_shippers_task():
    while True:
        try:
            # 90 days ago
            cutoff_date = (datetime.now(timezone.utc) - timedelta(days=90)).isoformat()
            
            # Delete shippers who have a last_active_date older than 90 days
            result = await db.shippers.delete_many({
                "last_active_date": {"$lt": cutoff_date}
            })
            if result.deleted_count > 0:
                logging.info(f"Cleaned up {result.deleted_count} inactive shippers.")
                
        except Exception as e:
            logging.error(f"Error cleaning up inactive shippers: {e}")
            
        # Wait 24 hours
        await asyncio.sleep(86400)

@app.on_event("startup")
async def start_background_tasks():
    asyncio.create_task(cleanup_inactive_shippers_task())

# ============== AUTH HELPERS ==============
import asyncio

async def hash_password(password: str) -> str:
    def _hash():
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")
    return await asyncio.to_thread(_hash)

async def verify_password(plain: str, hashed: str) -> bool:
    def _verify():
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    return await asyncio.to_thread(_verify)

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Chưa đăng nhập")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("role") == "shipper":
            user = await db.shippers.find_one({"id": payload["sub"]}, {"_id": 0})
            if not user:
                raise HTTPException(status_code=401, detail="Shipper không tồn tại")
            user["role"] = "shipper"
            user.pop("password_hash", None)
            return user
            
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Token không hợp lệ")
        user = await db.customers.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Người dùng không tồn tại")
        user["role"] = "customer"
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
    email: str = ""
    cccd: str = ""
    license_photo: str = "" # base64
    shipper_code: str = ""
    password_hash: str = ""
    status: str = "active"  # active, inactive
    registration_status: str = "pending" # pending, approved, rejected
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ShipperCreate(BaseModel):
    name: str
    phone: str
    email: str
    cccd: str
    license_photo: str

class ShipperSetupPassword(BaseModel):
    shipper_code: str
    password: str

class ShipperLogin(BaseModel):
    shipper_code: str
    password: str

class ShipperReject(BaseModel):
    reason: str
class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    title: str
    message: str
    is_read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BoxDeleteRequest(BaseModel):
    reason: str


class Employee(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_code: str
    name: str
    email: str
    phone: str
    address: str
    role: str = "Nhân Viên" # Admin, Quản Lý, Nhân Viên
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EmployeeCreate(BaseModel):
    employee_code: str
    name: str
    email: str
    phone: str
    address: str
    role: str = "Nhân Viên"

class EmployeeUpdate(BaseModel):
    employee_code: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    role: Optional[str] = None


class BoxOrderItem(BaseModel):
    size: str = "M"
    item_description: str
    notes: Optional[str] = None

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str  # Unique identifier (for QR code)
    customer_id: str
    customer_name: str
    status: str = "WAITING_FOR_PICKUP"  # WAITING_FOR_PICKUP, PICKED_UP, IN_HUB, DELIVERED
    qr_code_data: Optional[str] = None
    last_latitude: Optional[float] = None
    last_longitude: Optional[float] = None
    pickup_address: Optional[str] = None
    pickup_time: Optional[str] = None  # ISO datetime string
    items: List[BoxOrderItem] = Field(default_factory=list)
    created_by: str = "admin"  # 'admin' or 'customer'
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderCreate(BaseModel):
    customer_id: str
    customer_name: str
    order_id: Optional[str] = None  # If not provided, will auto-generate

class CustomerOrderCreate(BaseModel):
    boxes: List[BoxOrderItem]
    pickup_time: str  # ISO datetime string
    pickup_address: Optional[str] = None  # Fallback to customer default
    accept_no_prohibited: bool


class TrackingHistory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str
    shipper_id: str
    shipper_name: str
    status: str
    notes: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TrackingHistoryCreate(BaseModel):
    order_id: str
    shipper_id: str
    shipper_name: str
    status: str
    notes: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class QRScanRequest(BaseModel):
    order_id: str
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
        "password_hash": await hash_password(data.password),
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
            "default_pickup_address": customer_doc["default_pickup_address"],
            "role": "customer"
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
    
    if not await verify_password(data.password, user["password_hash"]):
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
            "default_pickup_address": user.get("default_pickup_address"),
            "role": "customer"
        }
    }


@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") == "shipper":
        return {
            "id": current_user["id"],
            "name": current_user["name"],
            "phone": current_user["phone"],
            "email": current_user.get("email"),
            "role": "shipper",
            "shipper_code": current_user.get("shipper_code")
        }
    return {
        "id": current_user["id"],
        "name": current_user["name"],
        "phone": current_user["phone"],
        "email": current_user.get("email"),
        "default_pickup_address": current_user.get("default_pickup_address"),
        "role": "customer"
    }


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    return {"success": True, "message": "Đăng xuất thành công"}


@api_router.get("/auth/my-orders")
async def get_my_orders(current_user: dict = Depends(get_current_user)):
    """Get all orders belonging to the authenticated customer"""
    all_orders = await db.orders.find({"customer_id": current_user["id"]}, {"_id": 0}).to_list(1000)
    
    for order in all_orders:
        if isinstance(order.get('created_at'), str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
        if isinstance(order.get('last_updated'), str):
            order['last_updated'] = datetime.fromisoformat(order['last_updated'])
    
    # Sort newest first
    all_orders.sort(key=lambda b: b.get('created_at', datetime.min.replace(tzinfo=timezone.utc)), reverse=True)
    return all_orders


@api_router.post("/auth/create-order")
async def customer_create_order(data: CustomerOrderCreate, current_user: dict = Depends(get_current_user)):
    """Customer self-creates a new pickup order"""
    if not data.accept_no_prohibited:
        raise HTTPException(status_code=400, detail="Bạn phải xác nhận không gửi hàng cấm")
    
    if not data.boxes or len(data.boxes) == 0:
        raise HTTPException(status_code=400, detail="Vui lòng thêm ít nhất một thùng hàng")
    
    for box_item in data.boxes:
        if not box_item.item_description.strip():
            raise HTTPException(status_code=400, detail="Vui lòng mô tả hàng hóa cho tất cả các thùng")
    
    pickup_address = (data.pickup_address or current_user.get("default_pickup_address") or current_user.get("address") or "").strip()
    if not pickup_address:
        raise HTTPException(status_code=400, detail="Vui lòng nhập địa chỉ lấy hàng")
    
    order_id = f"ORD-{str(uuid.uuid4())[:8].upper()}"
    qr_code_data = generate_qr_code(order_id)
    
    order_items = []
    for box_item in data.boxes:
        order_items.append({
            "size": box_item.size,
            "item_description": box_item.item_description.strip(),
            "notes": box_item.notes.strip() if box_item.notes else None
        })
    
    now = datetime.now(timezone.utc)
    order_doc = {
        "id": str(uuid.uuid4()),
        "order_id": order_id,
        "customer_id": current_user["id"],
        "customer_name": current_user["name"],
        "status": "WAITING_FOR_PICKUP",
        "qr_code_data": qr_code_data,
        "pickup_address": pickup_address,
        "pickup_time": data.pickup_time,
        "items": order_items,
        "created_by": "customer",
        "created_at": now.isoformat(),
        "last_updated": now.isoformat(),
        "last_latitude": None,
        "last_longitude": None
    }
    
    await db.orders.insert_one(order_doc)
    
    return {
        "success": True,
        "message": f"Đã tạo đơn hàng thành công! Shipper sẽ đến lấy hàng theo lịch hẹn.",
        "order_id": order_id
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

@api_router.post("/shippers/register", response_model=Shipper)
async def register_shipper(input: ShipperCreate):
    shipper = Shipper(**input.model_dump())
    shipper.registration_status = "pending"
    doc = shipper.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.shippers.insert_one(doc)
    return shipper

@api_router.put("/shippers/{shipper_id}/approve")
async def approve_shipper(shipper_id: str, request: Request):
    # Retrieve the shipper
    shipper = await db.shippers.find_one({"id": shipper_id})
    if not shipper:
        raise HTTPException(status_code=404, detail="Shipper không tồn tại")
    if shipper.get("registration_status") == "approved":
        raise HTTPException(status_code=400, detail="Shipper đã được duyệt")
        
    # Generate Shipper Code (SP + 4 digits)
    count = await db.shippers.count_documents({"registration_status": "approved"})
    shipper_code = f"SP{(count + 1):04d}"
    
    await db.shippers.update_one(
        {"id": shipper_id},
        {"$set": {"registration_status": "approved", "shipper_code": shipper_code}}
    )
    
    # Send email
    frontend_url = os.environ.get('FRONTEND_URL', 'https://doanchiduc28042005-design.github.io/smart-mini-storage-danang')
    setup_link = f"{frontend_url}/shipper/setup-password"
    send_shipper_approval_email(shipper['email'], shipper_code, setup_link)
    
    return {"message": "Đã duyệt thành công và gửi email", "shipper_code": shipper_code}

@api_router.put("/shippers/{shipper_id}/reject")
async def reject_shipper(shipper_id: str, input: ShipperReject):
    shipper = await db.shippers.find_one({"id": shipper_id})
    if not shipper:
        raise HTTPException(status_code=404, detail="Shipper không tồn tại")
    if shipper.get("registration_status") == "approved":
        raise HTTPException(status_code=400, detail="Không thể từ chối shipper đã được duyệt")
        
    await db.shippers.update_one(
        {"id": shipper_id},
        {"$set": {"registration_status": "rejected", "rejection_reason": input.reason}}
    )
    
    # Send email
    send_shipper_rejection_email(shipper['email'], input.reason)
    
    return {"message": "Đã từ chối hồ sơ và gửi email thông báo"}

@api_router.post("/shippers/setup-password")
async def setup_shipper_password(input: ShipperSetupPassword):
    shipper = await db.shippers.find_one({"shipper_code": input.shipper_code})
    if not shipper:
        raise HTTPException(status_code=404, detail="Mã Shipper không hợp lệ")
    if shipper.get("password_hash"):
        raise HTTPException(status_code=400, detail="Tài khoản này đã có mật khẩu")
        
    pwd_hash = await hash_password(input.password)
    await db.shippers.update_one(
        {"shipper_code": input.shipper_code},
        {"$set": {"password_hash": pwd_hash}}
    )
    return {"message": "Tạo mật khẩu thành công"}

@api_router.post("/shippers/login")
async def login_shipper(input: ShipperLogin):
    shipper = await db.shippers.find_one({"shipper_code": input.shipper_code})
    if not shipper or not shipper.get("password_hash"):
        raise HTTPException(status_code=401, detail="Sai mã Shipper hoặc mật khẩu")
        
    if not await verify_password(input.password, shipper['password_hash']):
        raise HTTPException(status_code=401, detail="Sai mã Shipper hoặc mật khẩu")
        
    token_payload = {
        "sub": shipper['id'],
        "role": "shipper",
        "shipper_code": shipper['shipper_code'],
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    token = jwt.encode(token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    # Update last active date
    await db.shippers.update_one(
        {"id": shipper["id"]},
        {"$set": {"last_active_date": datetime.now(timezone.utc).isoformat()}}
    )
    
    shipper_dict = shipper.copy()
    if isinstance(shipper_dict.get('created_at'), str):
        shipper_dict['created_at'] = datetime.fromisoformat(shipper_dict['created_at'])
    
    shipper_dict.pop('_id', None)
    shipper_dict.pop('password_hash', None)
        
    return {"token": token, "shipper": shipper_dict}

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

@api_router.get("/shippers/{shipper_id}/orders")
async def get_shipper_orders(shipper_id: str):
    # Find all order IDs this shipper has interacted with
    history = await db.order_tracking_history.find({"shipper_id": shipper_id}).to_list(10000)
    order_ids = list(set([h["order_id"] for h in history]))
    
    orders = await db.orders.find({"order_id": {"$in": order_ids}}, {"_id": 0}).to_list(1000)
    
    for order in orders:
        if isinstance(order.get('created_at'), str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
        if isinstance(order.get('last_updated'), str):
            order['last_updated'] = datetime.fromisoformat(order['last_updated'])
            
    return orders

# ============== EMPLOYEE ENDPOINTS ==============

@api_router.post("/employees", response_model=Employee)
async def create_employee(input: EmployeeCreate):
    # Check if employee code already exists
    existing = await db.employees.find_one({"employee_code": input.employee_code})
    if existing:
        raise HTTPException(status_code=400, detail="Mã nhân viên đã tồn tại")
        
    employee = Employee(**input.model_dump())
    doc = employee.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.employees.insert_one(doc)
    return employee

@api_router.get("/employees", response_model=List[Employee])
async def get_employees():
    employees = await db.employees.find({}, {"_id": 0}).to_list(1000)
    for emp in employees:
        if isinstance(emp.get('created_at'), str):
            emp['created_at'] = datetime.fromisoformat(emp['created_at'])
    return employees

@api_router.put("/employees/{employee_id}", response_model=Employee)
async def update_employee(employee_id: str, input: EmployeeUpdate):
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    
    if update_data:
        result = await db.employees.update_one(
            {"id": employee_id},
            {"$set": update_data}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Nhân viên không tồn tại")
            
    employee = await db.employees.find_one({"id": employee_id}, {"_id": 0})
    if employee and isinstance(employee.get('created_at'), str):
        employee['created_at'] = datetime.fromisoformat(employee['created_at'])
    return employee

@api_router.delete("/employees/{employee_id}")
async def delete_employee(employee_id: str):
    result = await db.employees.delete_one({"id": employee_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Nhân viên không tồn tại")
    return {"message": "Đã xoá nhân viên thành công"}


# ============== ORDER ENDPOINTS ==============

@api_router.post("/orders", response_model=Order)
async def create_order(input: OrderCreate):
    # Auto-generate order_id if not provided
    order_id = input.order_id or f"ORD-{str(uuid.uuid4())[:8].upper()}"
    
    # Check if order_id already exists
    existing = await db.orders.find_one({"order_id": order_id})
    if existing:
        raise HTTPException(status_code=400, detail="Mã đơn hàng đã tồn tại")
    
    # Generate QR code
    qr_code_data = generate_qr_code(order_id)
    
    order_data = input.model_dump()
    order_data['order_id'] = order_id
    order_data['qr_code_data'] = qr_code_data
    
    order = Order(**order_data)
    doc = order.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['last_updated'] = doc['last_updated'].isoformat()
    
    await db.orders.insert_one(doc)
    return order

@api_router.get("/orders", response_model=List[Order])
async def get_orders(status: Optional[str] = None):
    query = {}
    if status:
        query['status'] = status
    
    orders = await db.orders.find(query, {"_id": 0}).to_list(1000)
    
    for order in orders:
        if isinstance(order.get('created_at'), str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
        if isinstance(order.get('last_updated'), str):
            order['last_updated'] = datetime.fromisoformat(order['last_updated'])
            
    # Sort newest first
    orders.sort(key=lambda b: b.get('created_at', datetime.min.replace(tzinfo=timezone.utc)), reverse=True)
    return orders

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Đơn hàng không tồn tại")
        
    if isinstance(order['created_at'], str):
        order['created_at'] = datetime.fromisoformat(order['created_at'])
    if isinstance(order['last_updated'], str):
        order['last_updated'] = datetime.fromisoformat(order['last_updated'])
        
    return order

@api_router.delete("/orders/{order_id}")
async def delete_order(order_id: str, input: BoxDeleteRequest):
    # Fetch order first to get customer_id
    order = await db.orders.find_one({"order_id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Đơn hàng không tồn tại")
        
    result = await db.orders.delete_one({"order_id": order_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Đơn hàng không tồn tại")
        
    # Also delete tracking history
    await db.order_tracking_history.delete_many({"order_id": order_id})
    
    # Send notification to customer
    notification = Notification(
        customer_id=order["customer_id"],
        title="Đơn hàng đã bị hủy",
        message=f"Đơn hàng {order_id} của bạn đã bị hủy. Lý do: {input.reason}"
    )
    doc = notification.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.notifications.insert_one(doc)
    
    return {"success": True, "message": "Đã xóa đơn hàng và thông báo cho khách hàng"}

@api_router.patch("/orders/{order_id}/location")
async def update_order_location(order_id: str, data: LocationUpdate):
    """Manually update order GPS location (admin)"""
    now = datetime.now(timezone.utc)
    
    # Need to fetch order first to get status
    order = await db.orders.find_one({"order_id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Đơn hàng không tồn tại")
        
    result = await db.orders.update_one(
        {"order_id": order_id},
        {
            "$set": {
                "last_latitude": data.latitude,
                "last_longitude": data.longitude,
                "last_updated": now.isoformat()
            }
        }
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Đơn hàng không tồn tại")
    
    updated_order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if isinstance(updated_order['last_updated'], str):
        updated_order['last_updated'] = datetime.fromisoformat(updated_order['last_updated'])
    if isinstance(updated_order['created_at'], str):
        updated_order['created_at'] = datetime.fromisoformat(updated_order['created_at'])
        
    # Create tracking history for map visibility
    tracking = TrackingHistory(
        order_id=order_id,
        shipper_id="admin",
        shipper_name="Hệ thống",
        status=updated_order.get('status', 'WAITING_FOR_PICKUP'),
        notes="Hệ thống cập nhật vị trí",
        latitude=data.latitude,
        longitude=data.longitude,
        timestamp=now
    )
    await db.order_tracking_history.insert_one(tracking.model_dump())
    
    return {"success": True, "message": "Đã cập nhật vị trí", "order": updated_order}


@api_router.get("/orders/{order_id}/history", response_model=List[TrackingHistory])
async def get_order_history(order_id: str):
    history = await db.order_tracking_history.find(
        {"order_id": order_id}, 
        {"_id": 0}
    ).sort("timestamp", -1).to_list(1000)
    
    for item in history:
        if isinstance(item['timestamp'], str):
            item['timestamp'] = datetime.fromisoformat(item['timestamp'])
            
    return history


@api_router.get("/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Chỉ khách hàng mới xem được thông báo")
    
    cursor = db.notifications.find({"customer_id": current_user["id"]}).sort("created_at", -1)
    notifications = await cursor.to_list(length=100)
    for n in notifications:
        n["_id"] = str(n["_id"])
    return notifications

@api_router.put("/notifications/{notif_id}/read")
async def mark_notification_read(notif_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.notifications.update_one(
        {"id": notif_id, "customer_id": current_user["id"]},
        {"$set": {"is_read": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Không tìm thấy thông báo")
    return {"success": True}


class LocationUpdate(BaseModel):
    latitude: float
    longitude: float

# ============== QR SCAN & TRACKING ENDPOINTS ==============

@api_router.post("/v1/storage/scan")
async def process_qr_scan(data: QRScanRequest):
    # Check if order exists
    order = await db.orders.find_one({"order_id": data.order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Cảnh báo: Mã QR không hợp lệ hoặc đơn hàng không tồn tại!")
    
    # Get shipper info
    shipper = await db.shippers.find_one({"id": data.shipper_id}, {"_id": 0})
    if not shipper:
        raise HTTPException(status_code=404, detail="Shipper không tồn tại")
    
    # Update order status
    now = datetime.now(timezone.utc)
    update_fields = {
        "status": data.status,
        "last_updated": now.isoformat()
    }
    if data.latitude is not None and data.longitude is not None:
        update_fields["last_latitude"] = data.latitude
        update_fields["last_longitude"] = data.longitude
    
    await db.orders.update_one(
        {"order_id": data.order_id},
        {"$set": update_fields}
    )
    
    # Update shipper last active date
    await db.shippers.update_one(
        {"id": data.shipper_id},
        {"$set": {"last_active_date": now.isoformat()}}
    )
    
    # Create tracking history
    hist_lat = data.latitude if data.latitude is not None else order.get('last_latitude')
    hist_lng = data.longitude if data.longitude is not None else order.get('last_longitude')
    
    tracking = TrackingHistory(
        order_id=data.order_id,
        shipper_id=data.shipper_id,
        shipper_name=shipper['name'],
        status=data.status,
        notes=data.notes,
        latitude=hist_lat,
        longitude=hist_lng,
        timestamp=now
    )
    
    tracking_doc = tracking.model_dump()
    tracking_doc['timestamp'] = tracking_doc['timestamp'].isoformat()
    await db.order_tracking_history.insert_one(tracking_doc)
    
    # Get updated order
    updated_order = await db.orders.find_one({"order_id": data.order_id}, {"_id": 0})
    if isinstance(updated_order['last_updated'], str):
        updated_order['last_updated'] = datetime.fromisoformat(updated_order['last_updated'])
    
    return {
        "success": True,
        "message": f"Đơn hàng {data.order_id} đã chuyển sang trạng thái: {data.status}",
        "updated_data": updated_order
    }

# ============== QR GENERATION ENDPOINT ==============

@api_router.post("/qr/generate")
async def generate_qr(order_id: str):
    qr_code_data = generate_qr_code(order_id)
    return {
        "order_id": order_id,
        "qr_code": qr_code_data
    }


# ============== DASHBOARD STATS ENDPOINT ==============

@api_router.get("/dashboard/stats")
async def get_dashboard_stats():
    # Count orders by status
    total_orders = await db.orders.count_documents({})
    waiting_pickup = await db.orders.count_documents({"status": "WAITING_FOR_PICKUP"})
    picked_up = await db.orders.count_documents({"status": "PICKED_UP"})
    in_hub = await db.orders.count_documents({"status": "IN_HUB"})
    delivered = await db.orders.count_documents({"status": "DELIVERED"})
    
    # Count customers and shippers
    total_customers = await db.customers.count_documents({})
    total_shippers = await db.shippers.count_documents({})
    active_shippers = await db.shippers.count_documents({"status": "active"})
    
    # Count total tracking events
    total_tracking_events = await db.order_tracking_history.count_documents({})
    
    return {
        "orders": {
            "total": total_orders,
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

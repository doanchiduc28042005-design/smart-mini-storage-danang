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


@api_router.get("/auth/my-boxes")
async def get_my_boxes(current_user: dict = Depends(get_current_user)):
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
async def customer_create_order(data: CustomerOrderCreate, current_user: dict = Depends(get_current_user)):
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
        
    pwd_hash = hash_password(input.password)
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
        
    if not bcrypt.checkpw(input.password.encode('utf-8'), shipper['password_hash'].encode('utf-8')):
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

@api_router.get("/shippers/{shipper_id}/boxes")
async def get_shipper_boxes(shipper_id: str):
    # Find all box IDs this shipper has interacted with
    history = await db.tracking_history.find({"shipper_id": shipper_id}).to_list(10000)
    box_ids = list(set([h["box_id"] for h in history]))
    
    boxes = await db.boxes.find({"box_id": {"$in": box_ids}}, {"_id": 0}).to_list(1000)
    
    for box in boxes:
        if isinstance(box.get('created_at'), str):
            box['created_at'] = datetime.fromisoformat(box['created_at'])
        if isinstance(box.get('last_updated'), str):
            box['last_updated'] = datetime.fromisoformat(box['last_updated'])
            
    return boxes

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
async def delete_box(box_id: str, input: BoxDeleteRequest):
    # Fetch box first to get customer_id
    box = await db.boxes.find_one({"box_id": box_id})
    if not box:
        raise HTTPException(status_code=404, detail="Thùng hàng không tồn tại")
        
    result = await db.boxes.delete_one({"box_id": box_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Thùng hàng không tồn tại")
        
    # Create notification
    notif = Notification(
        customer_id=box["customer_id"],
        title="Thùng hàng đã bị hủy",
        message=f"Thùng hàng {box_id} của bạn đã bị hủy bởi Quản trị viên. Lý do: {input.reason}"
    )
    await db.notifications.insert_one(notif.model_dump())
    
    return {"success": True, "message": "Đã xóa thùng hàng và gửi thông báo"}


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
    
    # Update shipper last active date
    await db.shippers.update_one(
        {"id": data.shipper_id},
        {"$set": {"last_active_date": now.isoformat()}}
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

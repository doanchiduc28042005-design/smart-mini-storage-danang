from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import qrcode
import io
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ============== MODELS ==============

class Customer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CustomerCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None


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
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BoxCreate(BaseModel):
    customer_id: str
    customer_name: str
    box_id: Optional[str] = None  # If not provided, will auto-generate


class TrackingHistory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    box_id: str
    shipper_id: str
    shipper_name: str
    status: str
    notes: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TrackingHistoryCreate(BaseModel):
    box_id: str
    shipper_id: str
    shipper_name: str
    status: str
    notes: Optional[str] = None


class QRScanRequest(BaseModel):
    box_id: str
    shipper_id: str
    status: str
    notes: Optional[str] = None


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
    await db.boxes.update_one(
        {"box_id": data.box_id},
        {
            "$set": {
                "status": data.status,
                "last_updated": now.isoformat()
            }
        }
    )
    
    # Create tracking history
    tracking = TrackingHistory(
        box_id=data.box_id,
        shipper_id=data.shipper_id,
        shipper_name=shipper['name'],
        status=data.status,
        notes=data.notes,
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

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

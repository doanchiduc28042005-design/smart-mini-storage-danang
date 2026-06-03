# Smart Mini Storage - PRD

## Original Problem Statement
Người dùng cung cấp đoạn code FastAPI cho "Smart Mini Storage API" - hệ thống quản lý kho lưu trữ nhỏ với quét QR code. Yêu cầu: triển khai hệ thống đầy đủ (backend + frontend) với MongoDB thực, App Shipper, Admin Dashboard, và tất cả tính năng quản lý (boxes, customers, shippers, tracking history, QR generation, dashboard stats).

## Architecture
- **Backend**: FastAPI + Motor (async MongoDB) + qrcode library
- **Frontend**: React 19 + React Router + Tailwind CSS + shadcn/ui + html5-qrcode
- **Database**: MongoDB (local)
- **Tech Stack**: Python, JavaScript, MongoDB

## User Personas
1. **Admin/Manager**: Quản lý toàn bộ hệ thống, theo dõi thống kê, CRUD boxes/customers/shippers
2. **Shipper**: Sử dụng app mobile để quét QR và cập nhật trạng thái thùng hàng

## Core Requirements (Static)
- Quét QR code để cập nhật trạng thái thùng hàng
- Quản lý CRUD: thùng hàng, khách hàng, shipper
- Trạng thái thùng: WAITING_FOR_PICKUP, PICKED_UP, IN_HUB, DELIVERED
- Tự động generate QR code khi tạo box
- Lịch sử tracking chi tiết với timestamp
- Dashboard thống kê real-time

## Features Implemented (2026-01)

### Backend APIs (All ✅ tested 20/20)
- POST `/api/customers` - Tạo khách hàng
- GET `/api/customers` - Danh sách khách hàng
- GET `/api/customers/{id}` - Chi tiết khách hàng
- POST `/api/shippers` - Tạo shipper
- GET `/api/shippers` - Danh sách shippers
- GET `/api/shippers/{id}` - Chi tiết shipper
- POST `/api/boxes` - Tạo box (auto-generate box_id + QR code)
- GET `/api/boxes` - Danh sách boxes (filter theo status)
- GET `/api/boxes/{box_id}` - Chi tiết box
- DELETE `/api/boxes/{box_id}` - Xóa box
- POST `/api/v1/storage/scan` - Quét QR và cập nhật trạng thái
- GET `/api/boxes/{box_id}/history` - Lịch sử tracking
- POST `/api/qr/generate` - Tạo QR code
- GET `/api/dashboard/stats` - Thống kê dashboard

### Frontend Pages (All ✅ tested)
- `/` - Landing page với 2 lựa chọn (Admin & Shipper)
- `/shipper` - Shipper App: QR scanner (camera + manual input), form cập nhật status
- `/admin` - Dashboard tổng quan với stats real-time (refresh mỗi 5s)
- `/admin/boxes` - Quản lý thùng: CRUD, filter, xem QR, in QR, xem lịch sử
- `/admin/customers` - Quản lý khách hàng
- `/admin/shippers` - Quản lý shippers

### Tính năng đặc biệt
- ✅ QR Code tự động generate base64 khi tạo box
- ✅ In QR code trực tiếp từ browser
- ✅ Lịch sử tracking timeline với badge màu theo status
- ✅ Dashboard refresh real-time
- ✅ Mobile-friendly responsive design
- ✅ Vietnamese UI

## Test Coverage
- Backend: 20/20 pytest tests passing
- Frontend: 100% E2E flows verified (landing → admin → boxes → customers → shippers → shipper app)
- E2E flow: Create customer → Create box → Shipper scan → Verify status updated → Verify dashboard stats

## Prioritized Backlog (Future)

### P1 - Nice to Have
- Pagination cho danh sách (>1000 records)
- Tách server.py thành multiple routers
- Phone/email format validation
- Toast notifications thay window.alert

### P2 - Future Features
- Authentication & authorization (JWT/OAuth)
- Real-time WebSocket cho dashboard
- Bulk QR code generation & batch print
- Export report (PDF/Excel)
- Email/SMS notification khi status changed
- Mobile native app
- Geolocation tracking
- Multi-tenancy (multi-warehouse)

## What's Been Implemented (2026-01)
- ✅ Complete backend with MongoDB persistence
- ✅ Full CRUD for all entities
- ✅ QR scan + tracking flow
- ✅ Admin dashboard with real-time stats
- ✅ Shipper app with manual + camera QR input
- ✅ Beautiful Vietnamese UI with Tailwind + shadcn

## Next Tasks
- Awaiting user feedback for next iteration
- Optional: Apply test-mode-friendly improvements (testids, 201 codes)

# Node.js App for Render

Ứng dụng Node.js đơn giản sử dụng Express.js, được thiết kế để deploy dễ dàng lên Render.

## 🚀 Tính năng

- RESTful API đơn giản
- Health check endpoint
- Echo API để test POST requests
- Middleware xử lý JSON
- Error handling cơ bản

## 📋 Yêu cầu

- Node.js >= 14.0.0
- npm hoặc yarn

## 🛠️ Cài đặt

1. Clone repository hoặc tải về source code
2. Cài đặt dependencies:

```bash
npm install
```

## 🏃‍♂️ Chạy ứng dụng

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

Ứng dụng sẽ chạy trên `http://localhost:3000`

## 📡 API Endpoints

### GET /
Endpoint chính trả về thông tin chào mừng

**Response:**
```json
{
  "message": "Chào mừng đến với ứng dụng Node.js của tôi!",
  "status": "success",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### GET /api/health
Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "uptime": 123.456,
  "memory": {...}
}
```

### GET /api/hello/:name
Endpoint chào hỏi với tham số

**Response:**
```json
{
  "message": "Xin chào John!",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### POST /api/echo
Echo API để test POST requests

**Request Body:**
```json
{
  "test": "data"
}
```

**Response:**
```json
{
  "message": "Echo API",
  "received_data": {"test": "data"},
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🌐 Deploy lên Render

### Bước 1: Tạo Git Repository
```bash
git init
git add .
git commit -m "Initial commit"
```

### Bước 2: Push lên GitHub
1. Tạo repository mới trên GitHub
2. Kết nối với remote repository:
```bash
git remote add origin https://github.com/username/repository-name.git
git branch -M main
git push -u origin main
```

### Bước 3: Deploy trên Render
1. Đăng nhập vào [Render](https://render.com)
2. Chọn "New +" → "Web Service"
3. Kết nối GitHub repository
4. Cấu hình deploy:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
   - **Region:** Chọn region gần nhất

### Bước 4: Biến môi trường (nếu cần)
Trong phần Environment Variables, có thể thêm:
- `NODE_ENV=production`
- Các biến môi trường khác nếu cần

## 🔧 Cấu trúc project

```
nodejs-render-app/
├── index.js          # File chính của ứng dụng
├── package.json      # Dependencies và scripts
├── .gitignore        # Files/folders được Git ignore
└── README.md         # Documentation
```

## 📝 Ghi chú

- Ứng dụng tự động sử dụng PORT từ biến môi trường (cần thiết cho Render)
- Health check endpoint giúp monitor ứng dụng
- Cấu trúc đơn giản, dễ mở rộng

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Hãy tạo issue hoặc pull request.

## 📄 License

MIT License
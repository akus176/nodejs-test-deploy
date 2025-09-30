const express = require('express');
const app = express();

// Lấy port từ biến môi trường hoặc sử dụng 3000 làm mặc định
const PORT = process.env.PORT || 3000;

// Middleware để parse JSON
app.use(express.json());

// Route chính
app.get('/', (req, res) => {
    res.json({
        message: 'Chào mừng đến với ứng dụng Node.js của tôi!',
        status: 'success',
        timestamp: new Date().toISOString()
    });
});

// Route API đơn giản
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

// Route với tham số
app.get('/api/hello/:name', (req, res) => {
    const { name } = req.params;
    res.json({
        message: `Xin chào ${name}!`,
        timestamp: new Date().toISOString()
    });
});

// Route POST đơn giản
app.post('/api/echo', (req, res) => {
    res.json({
        message: 'Echo API',
        received_data: req.body,
        timestamp: new Date().toISOString()
    });
});

// Middleware xử lý 404
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint không tồn tại',
        path: req.originalUrl
    });
});

// Khởi động server
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy trên port ${PORT}`);
    console.log(`🌐 Truy cập: http://localhost:${PORT}`);
});

module.exports = app;
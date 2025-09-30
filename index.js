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
        platform: 'Railway',
        timestamp: new Date().toISOString()
    });
});

// Route API đơn giản
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        platform: 'Railway'
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

// Biến để theo dõi bandwidth (Simplified for serverless)
let bandwidthStats = {
    totalRequests: 0,
    totalBytesIn: 0,
    totalBytesOut: 0,
    startTime: new Date(),
    requestsLog: []
};

// Middleware để theo dõi bandwidth (Simplified)
app.use((req, res, next) => {
    const startTime = Date.now();
    const originalSend = res.send;
    
    // Track incoming data
    const contentLength = parseInt(req.get('Content-Length') || '0');
    bandwidthStats.totalBytesIn += contentLength;
    bandwidthStats.totalRequests++;
    
    // Override res.send to track outgoing data
    res.send = function(data) {
        const responseSize = Buffer.byteLength(data || '', 'utf8');
        bandwidthStats.totalBytesOut += responseSize;
        
        // Log request details (keep last 10 only for serverless)
        bandwidthStats.requestsLog.push({
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.url,
            bytesIn: contentLength,
            bytesOut: responseSize,
            responseTime: Date.now() - startTime
        });
        
        // Keep only last 10 requests for serverless
        if (bandwidthStats.requestsLog.length > 10) {
            bandwidthStats.requestsLog = bandwidthStats.requestsLog.slice(-10);
        }
        
        return originalSend.call(this, data);
    };
    
    next();
});

// Route để xem thông tin disk (Railway)
app.get('/api/disk-info', async (req, res) => {
    try {
        // Railway disk info
        res.json({
            disk_usage: {
                note: "Railway provides persistent disk storage",
                disk_limit: "1 GB (Starter plan)",
                ram_limit: "512 MB",
                railway_limits: {
                    monthly_usage: "$5 credit/month",
                    disk_size: "1 GB",
                    bandwidth: "Unlimited"
                }
            },
            system_info: {
                platform: process.platform,
                architecture: process.arch,
                node_version: process.version,
                railway_environment: process.env.RAILWAY_ENVIRONMENT || 'unknown',
                railway_service: process.env.RAILWAY_SERVICE_NAME || 'unknown'
            },
            memory_usage: process.memoryUsage()
        });
        
    } catch (error) {
        res.status(500).json({
            error: "Could not retrieve disk information",
            message: error.message,
            note: "Vercel uses serverless functions without persistent storage"
        });
    }
});

// Route để xem thông tin bandwidth
app.get('/api/bandwidth-info', (req, res) => {
    const uptimeSeconds = process.uptime();
    const uptimeMinutes = uptimeSeconds / 60;
    
    res.json({
        bandwidth_usage: {
            session_requests: bandwidthStats.totalRequests,
            session_bytes_in: bandwidthStats.totalBytesIn,
            session_bytes_out: bandwidthStats.totalBytesOut,
            session_bytes_in_kb: (bandwidthStats.totalBytesIn / 1024).toFixed(2),
            session_bytes_out_kb: (bandwidthStats.totalBytesOut / 1024).toFixed(2),
            total_bandwidth_kb: ((bandwidthStats.totalBytesIn + bandwidthStats.totalBytesOut) / 1024).toFixed(2),
            railway_bandwidth_limit: "Unlimited"
        },
        railway_info: {
            app_uptime_seconds: uptimeSeconds.toFixed(2),
            app_uptime_minutes: uptimeMinutes.toFixed(2),
            note: "Persistent container - stats maintained across requests"
        },
        recent_requests: bandwidthStats.requestsLog.slice(-5), // Last 5 requests
        tracking_since: bandwidthStats.startTime.toISOString()
    });
});

// Route để reset bandwidth stats (useful for testing)
app.post('/api/bandwidth-reset', (req, res) => {
    bandwidthStats = {
        totalRequests: 0,
        totalBytesIn: 0,
        totalBytesOut: 0,
        startTime: new Date(),
        requestsLog: []
    };
    
    res.json({
        message: 'Bandwidth statistics reset successfully',
        reset_time: new Date().toISOString()
    });
});

// Route tổng hợp tất cả system info
app.get('/api/system-info', (req, res) => {
    res.json({
        server_info: {
            platform: "Railway",
            node_version: process.version,
            architecture: process.arch,
            app_uptime_seconds: process.uptime(),
            railway_environment: process.env.RAILWAY_ENVIRONMENT || 'unknown',
            railway_service: process.env.RAILWAY_SERVICE_NAME || 'unknown'
        },
        memory_info: {
            app_memory_mb: (process.memoryUsage().rss / 1024 / 1024).toFixed(2),
            heap_used_mb: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
            heap_total_mb: (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2),
            railway_memory_limit: "512 MB (Starter plan)"
        },
        railway_specs: {
            starter_plan: {
                memory: "512 MB",
                disk: "1 GB",
                bandwidth: "Unlimited",
                monthly_usage: "$5 credit",
                custom_domains: "Yes",
                persistent_storage: "Yes"
            }
        },
        quick_links: {
            disk_info: "/api/disk-info",
            bandwidth_info: "/api/bandwidth-info",
            health_check: "/api/health"
        }
    });
});

// Middleware xử lý 404
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint không tồn tại',
        path: req.originalUrl,
        platform: 'Railway'
    });
});

// Khởi động server cho Railway
app.listen(PORT, '0.0.0.0', () => {
    console.log(`� Server đang chạy trên Railway port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🚀 Railway Environment: ${process.env.RAILWAY_ENVIRONMENT || 'local'}`);
    console.log(`📡 Railway Service: ${process.env.RAILWAY_SERVICE_NAME || 'unknown'}`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);
});

module.exports = app;
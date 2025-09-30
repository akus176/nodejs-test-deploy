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

// Biến để theo dõi bandwidth
let bandwidthStats = {
    totalRequests: 0,
    totalBytesIn: 0,
    totalBytesOut: 0,
    startTime: new Date(),
    requestsLog: []
};

// Middleware để theo dõi bandwidth
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
        
        // Log request details
        bandwidthStats.requestsLog.push({
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.url,
            bytesIn: contentLength,
            bytesOut: responseSize,
            responseTime: Date.now() - startTime
        });
        
        // Keep only last 100 requests to prevent memory issues
        if (bandwidthStats.requestsLog.length > 100) {
            bandwidthStats.requestsLog = bandwidthStats.requestsLog.slice(-100);
        }
        
        return originalSend.call(this, data);
    };
    
    next();
});

// Route để xem thông tin disk
app.get('/api/disk-info', async (req, res) => {
    const fs = require('fs').promises;
    const path = require('path');
    const { execSync } = require('child_process');
    
    try {
        // Function to get directory size recursively
        const getDirectorySize = async (dirPath) => {
            let size = 0;
            try {
                const files = await fs.readdir(dirPath, { withFileTypes: true });
                for (const file of files) {
                    const filePath = path.join(dirPath, file.name);
                    if (file.isDirectory() && !file.name.startsWith('.')) {
                        size += await getDirectorySize(filePath);
                    } else {
                        try {
                            const stats = await fs.stat(filePath);
                            size += stats.size;
                        } catch (err) {
                            // Skip inaccessible files
                        }
                    }
                }
            } catch (err) {
                // Skip inaccessible directories
            }
            return size;
        };
        
        const appSize = await getDirectorySize(process.cwd());
        
        // Try to get system disk info (may not work on all hosting platforms)
        let diskInfo = null;
        try {
            diskInfo = execSync('df -h /', { encoding: 'utf8', timeout: 5000 });
        } catch (err) {
            diskInfo = `Could not retrieve disk info: ${err.message}`;
        }
        
        res.json({
            disk_usage: {
                app_size_bytes: appSize,
                app_size_mb: (appSize / 1024 / 1024).toFixed(2),
                app_size_gb: (appSize / 1024 / 1024 / 1024).toFixed(3),
                render_limit_gb: 1,
                usage_percentage: ((appSize / (1024 * 1024 * 1024)) * 100).toFixed(2) + '%'
            },
            system_info: {
                current_directory: process.cwd(),
                disk_command_output: diskInfo,
                platform: process.platform,
                architecture: process.arch
            },
            files_breakdown: {
                note: "Check individual directories for detailed breakdown"
            }
        });
        
    } catch (error) {
        res.status(500).json({
            error: "Could not retrieve disk information",
            message: error.message,
            fallback_info: {
                current_directory: process.cwd(),
                render_free_plan_limit: "1 GB SSD"
            }
        });
    }
});

// Route để xem thông tin bandwidth
app.get('/api/bandwidth-info', (req, res) => {
    const uptimeHours = (Date.now() - bandwidthStats.startTime.getTime()) / (1000 * 60 * 60);
    const uptimeDays = uptimeHours / 24;
    
    res.json({
        bandwidth_usage: {
            total_requests: bandwidthStats.totalRequests,
            total_bytes_in: bandwidthStats.totalBytesIn,
            total_bytes_out: bandwidthStats.totalBytesOut,
            total_bytes_in_mb: (bandwidthStats.totalBytesIn / 1024 / 1024).toFixed(2),
            total_bytes_out_mb: (bandwidthStats.totalBytesOut / 1024 / 1024).toFixed(2),
            total_bandwidth_mb: ((bandwidthStats.totalBytesIn + bandwidthStats.totalBytesOut) / 1024 / 1024).toFixed(2),
            render_monthly_limit_gb: 100,
            estimated_monthly_usage_gb: uptimeDays > 0 ? 
                (((bandwidthStats.totalBytesIn + bandwidthStats.totalBytesOut) / 1024 / 1024 / 1024) * (30 / uptimeDays)).toFixed(3) : 0
        },
        statistics: {
            uptime_hours: uptimeHours.toFixed(2),
            uptime_days: uptimeDays.toFixed(2),
            average_request_size_kb: bandwidthStats.totalRequests > 0 ? 
                ((bandwidthStats.totalBytesIn + bandwidthStats.totalBytesOut) / bandwidthStats.totalRequests / 1024).toFixed(2) : 0,
            requests_per_hour: uptimeHours > 0 ? (bandwidthStats.totalRequests / uptimeHours).toFixed(2) : 0
        },
        recent_requests: bandwidthStats.requestsLog.slice(-10), // Last 10 requests
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
    const os = require('os');
    
    res.json({
        server_info: {
            node_version: process.version,
            platform: os.platform(),
            architecture: os.arch(),
            uptime_seconds: process.uptime(),
            uptime_minutes: (process.uptime() / 60).toFixed(2),
            uptime_hours: (process.uptime() / 3600).toFixed(2)
        },
        memory_info: {
            total_memory_gb: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2),
            free_memory_gb: (os.freemem() / 1024 / 1024 / 1024).toFixed(2),
            used_memory_gb: ((os.totalmem() - os.freemem()) / 1024 / 1024 / 1024).toFixed(2),
            process_memory_mb: {
                rss: (process.memoryUsage().rss / 1024 / 1024).toFixed(2),
                heap_used: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
                heap_total: (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)
            }
        },
        cpu_info: {
            cpu_count: os.cpus().length,
            cpu_model: os.cpus()[0].model,
            load_average: os.loadavg()
        },
        render_specs: {
            free_plan: {
                ram: "512 MB",
                cpu: "0.1 vCPU (shared)",
                disk: "1 GB SSD",
                bandwidth: "100 GB/month",
                notes: "Sleeps after 15 minutes of inactivity"
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
        path: req.originalUrl
    });
});

// Khởi động server
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy trên port ${PORT}`);
    console.log(`🌐 Truy cập: http://localhost:${PORT}`);
});

module.exports = app;
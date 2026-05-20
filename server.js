const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Configure multer for file uploads (use /tmp on Vercel for serverless support)
const uploadDir = process.env.VERCEL ? '/tmp' : __dirname;
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Keep original filename
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Only accept CSV files for safety, but we can expand if needed
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    }
});

// Serve CSV files, prioritizing /tmp (uploads on Vercel) over __dirname (base files)
app.get('/:filename.csv', (req, res, next) => {
    const filename = req.params.filename + '.csv';
    const tmpPath = path.join('/tmp', filename);
    const localPath = path.join(__dirname, filename);
    
    if (fs.existsSync(tmpPath)) {
        return res.sendFile(tmpPath);
    } else if (fs.existsSync(localPath)) {
        return res.sendFile(localPath);
    }
    next();
});

// Serve static files (with html extensions enabled)
app.use(express.static(__dirname, { extensions: ['html'] }));

// ============================================
// HRMS Proxy Endpoints (Internal Network)
// ============================================

const HRMS_AUTH_URL = 'https://mobiledev.advanceagro.net/ws/api/idms/authentication/';
const HRMS_EMPLOYEE_URL = 'https://api-idms.advanceagro.net/hrms/employee/';

// POST /api/hrms/login — Proxy HRMS authentication
app.post('/api/hrms/login', async (req, res) => {
    try {
        const { account, password, Service, AgentId, AgentCode } = req.body;
        
        if (!account || !password) {
            return res.status(400).json({ error: 'Missing account or password' });
        }

        const params = new URLSearchParams({ account, password, Service, AgentId, AgentCode });
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(`${HRMS_AUTH_URL}?${params}`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('HRMS Auth proxy error:', error.message);
        if (error.name === 'AbortError') {
            return res.status(504).json({ error: 'HRMS server timeout' });
        }
        res.status(502).json({ error: `HRMS connection failed: ${error.message}` });
    }
});

// POST /api/hrms/profile — Proxy HRMS employee profile
app.post('/api/hrms/profile', async (req, res) => {
    try {
        const { empId } = req.body;
        
        if (!empId) {
            return res.status(400).json({ error: 'Missing empId' });
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(`${HRMS_EMPLOYEE_URL}${empId}`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('HRMS Profile proxy error:', error.message);
        res.status(502).json({ error: `Employee profile fetch failed: ${error.message}` });
    }
});

// ============================================
// File Upload Endpoints
// ============================================

// Upload master data (List.csv)
app.post('/api/upload-list-data', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        res.json({ success: true, message: 'List.csv uploaded successfully', file: req.file.filename });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Upload item master (ItemMaster.csv)
app.post('/api/upload-item-master', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        res.json({ success: true, message: 'ItemMaster.csv uploaded successfully', file: req.file.filename });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Upload GL account data (GL.csv)
app.post('/api/upload-gl-data', upload.single('file'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
        res.json({ success: true, message: 'GL.csv uploaded successfully', file: req.file.filename });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Upload Size mapping data (Size.csv)
app.post('/api/upload-size-data', upload.single('file'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
        res.json({ success: true, message: 'Size.csv uploaded successfully', file: req.file.filename });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Serving static files and accepting uploads...`);
    console.log(`HRMS proxy endpoints active: /api/hrms/login, /api/hrms/profile`);
});

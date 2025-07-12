const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const QRCode = require('qrcode');
const { marked } = require('marked');
const { v4: uuidv4 } = require('uuid');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('dist'));

// Rate limiting
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 uploads per windowMs
  message: 'Too many uploads, please try again later.'
});

const textLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 text shares per minute
  message: 'Too many messages, please slow down.'
});

// Storage configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    // Allowed file types
    const allowedTypes = [
      'image/', 'video/', 'audio/', 'text/', 'application/pdf',
      'application/zip', 'application/x-zip-compressed',
      'application/msword', 'application/vnd.openxmlformats-officedocument',
      'application/json', 'application/javascript'
    ];
    
    const isAllowed = allowedTypes.some(type => file.mimetype.startsWith(type));
    
    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

// In-memory storage for shared content
const sharedContent = new Map();
const connectedClients = new Set();

// Get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const interfaceName in interfaces) {
    for (const interfaceInfo of interfaces[interfaceName]) {
      if (interfaceInfo.family === 'IPv4' && !interfaceInfo.internal) {
        return interfaceInfo.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIP();
const PORT = process.env.PORT || 3001;

// For production, serve static files from dist directory
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
}

// Content expiration cleanup
setInterval(() => {
  const now = Date.now();
  for (const [id, content] of sharedContent.entries()) {
    if (now > content.expiresAt) {
      sharedContent.delete(id);
      io.emit('contentRemoved', id);
    }
  }
}, 30000); // Check every 30 seconds

// Socket.IO connection handling
io.on('connection', (socket) => {
  connectedClients.add(socket.id);
  
  // Send current content to new client
  const currentContent = Array.from(sharedContent.values());
  socket.emit('initialContent', currentContent);
  
  // Broadcast updated client count
  io.emit('clientCount', connectedClients.size);
  
  socket.on('disconnect', () => {
    connectedClients.delete(socket.id);
    io.emit('clientCount', connectedClients.size);
  });
});

// Routes
app.post('/api/upload', uploadLimiter, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileId = uuidv4();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    const fileData = {
      id: fileId,
      type: 'file',
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer,
      uploadedAt: Date.now(),
      expiresAt,
      downloadUrl: `/api/download/${fileId}`
    };
    
    sharedContent.set(fileId, fileData);
    
    // Broadcast to all clients
    const clientData = { ...fileData };
    delete clientData.buffer; // Don't send buffer to clients
    io.emit('newContent', clientData);
    
    res.json({ 
      success: true, 
      fileId,
      downloadUrl: fileData.downloadUrl,
      expiresAt
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.post('/api/share-text', textLimiter, (req, res) => {
  try {
    const { text, type = 'text' } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text content is required' });
    }
    
    const contentId = uuidv4();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    let processedContent = text;
    let metadata = {};
    
    // Process markdown
    if (type === 'markdown') {
      processedContent = marked(text);
    }
    
    // Extract URL for preview
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex);
    if (urls && urls.length > 0) {
      metadata.hasLinks = true;
      metadata.firstUrl = urls[0];
    }
    
    const contentData = {
      id: contentId,
      type: 'text',
      content: text,
      processedContent,
      metadata,
      sharedAt: Date.now(),
      expiresAt
    };
    
    sharedContent.set(contentId, contentData);
    
    // Broadcast to all clients
    io.emit('newContent', contentData);
    
    res.json({ 
      success: true, 
      contentId,
      expiresAt
    });
  } catch (error) {
    console.error('Text share error:', error);
    res.status(500).json({ error: 'Failed to share text' });
  }
});

app.get('/api/download/:fileId', (req, res) => {
  try {
    const { fileId } = req.params;
    const fileData = sharedContent.get(fileId);
    
    if (!fileData || fileData.type !== 'file') {
      return res.status(404).json({ error: 'File not found' });
    }
    
    if (Date.now() > fileData.expiresAt) {
      sharedContent.delete(fileId);
      return res.status(410).json({ error: 'File has expired' });
    }
    
    res.set({
      'Content-Type': fileData.mimetype,
      'Content-Disposition': `attachment; filename="${fileData.filename}"`,
      'Content-Length': fileData.size
    });
    
    res.send(fileData.buffer);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

app.get('/api/qr-code', async (req, res) => {
  try {
    const url = `http://${localIP}:${PORT}`;
    const qrCode = await QRCode.toDataURL(url);
    res.json({ qrCode, url });
  } catch (error) {
    console.error('QR code error:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

app.get('/api/status', (req, res) => {
  res.json({
    server: 'running',
    localIP,
    port: PORT,
    connectedClients: connectedClients.size,
    activeContent: sharedContent.size
  });
});

// Serve React app for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 File Sharing Server Running!`);
  console.log(`📱 Local Access: http://localhost:${PORT}`);
  console.log(`🌐 Network Access: http://${localIP}:${PORT}`);
  console.log(`📋 Share this URL with devices on your network\n`);
});
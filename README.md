# LocalShare - Real-time File & Text Sharing

A modern web application for seamless content sharing between devices on the same local network. Built with Node.js, Express, Socket.IO, and React.

## Features

### 🚀 Core Functionality
- **Real-time File Sharing**: Drag-and-drop file uploads with progress indicators
- **Text & Link Sharing**: Instant text message synchronization with markdown support
- **Live Updates**: WebSocket-based real-time communication across all devices
- **Network Discovery**: QR code generation for easy mobile device connection

### 🔒 Security & Safety
- **Auto-expiration**: All content expires in 10 minutes with countdown timers
- **Rate Limiting**: Protection against abuse with upload and message limits
- **File Type Restrictions**: Only safe file types allowed (max 100MB per file)
- **Local Network Only**: Restricted to local network access for security

### 🎨 User Experience
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Modern Interface**: Clean, minimal design with smooth animations
- **Toast Notifications**: Clear feedback for all actions and errors
- **Device Counter**: Real-time display of connected devices

## Quick Start

### Prerequisites
- Node.js 16+ installed
- Devices on the same WiFi network

### Installation & Setup

1. **Clone or download the project**
2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Access the application**:
   - Local: `http://localhost:3001`
   - Network: `http://[YOUR-IP]:3001`

5. **Connect other devices**:
   - Use the QR code shown in the app
   - Or manually enter the network URL

## Production Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start the production server**:
   ```bash
   npm run serve
   ```

## Supported File Types

### ✅ Allowed File Types
- **Images**: JPG, PNG, GIF, SVG, WebP
- **Videos**: MP4, WebM, AVI, MOV
- **Audio**: MP3, WAV, OGG, M4A
- **Documents**: PDF, DOC, DOCX, TXT, MD
- **Archives**: ZIP, RAR, 7Z
- **Code**: JS, JSON, HTML, CSS, XML

### 📏 File Limitations
- **Maximum file size**: 100MB per file
- **Content expiration**: 10 minutes
- **Rate limiting**: 10 uploads per 15 minutes per IP

## Technical Architecture

### Backend Stack
- **Node.js** with Express.js server framework
- **Socket.IO** for real-time WebSocket communication
- **Multer** for secure file upload handling
- **Express Rate Limit** for abuse prevention

### Frontend Stack
- **React 18** with TypeScript
- **Tailwind CSS** for responsive styling
- **Socket.IO Client** for real-time updates
- **React Dropzone** for drag-and-drop uploads

### Key Features Implementation
- **In-memory storage**: No persistent file storage for security
- **Automatic cleanup**: Expired content removal every 30 seconds
- **Network detection**: Local IP address discovery and QR code generation
- **Progress tracking**: Real-time upload progress indicators

## Security Considerations

### 🛡️ Built-in Security
- **File type validation**: Prevents malicious file uploads
- **Content expiration**: All content automatically deleted after 10 minutes
- **Rate limiting**: Prevents spam and abuse
- **Local network only**: No external network access
- **Memory-only storage**: No persistent file storage

### ⚠️ Important Notes
- **Network security**: Only use on trusted networks
- **Content privacy**: All users on the network can see shared content
- **Temporary storage**: Content is lost when server restarts
- **No authentication**: Anyone on the network can access the service

## Troubleshooting

### Common Issues

**Connection Problems**:
- Ensure all devices are on the same WiFi network
- Check firewall settings (port 3001)
- Try accessing via IP address instead of localhost

**Upload Failures**:
- Verify file size is under 100MB
- Check file type is supported
- Ensure stable network connection

**QR Code Issues**:
- Refresh the page to regenerate QR code
- Ensure mobile device has camera permissions
- Try manual URL entry if QR scan fails

### Performance Tips
- **Clear expired content**: Restart server to free memory
- **Network speed**: Use 5GHz WiFi for better performance
- **Device limits**: Optimal performance with under 10 connected devices

## Development

### Project Structure
```
├── server.js              # Main server file
├── src/
│   ├── components/         # React components
│   ├── hooks/              # Custom React hooks
│   └── App.tsx            # Main React application
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run serve` - Start production server
- `npm run lint` - Run ESLint

## License

This project is open source and available under the MIT License.
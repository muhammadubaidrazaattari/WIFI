import React, { useState, useEffect } from 'react';
import { Wifi, Users, QrCode, Copy, Check, AlertCircle } from 'lucide-react';

interface DeviceStatusProps {
  isConnected: boolean;
  connectedClients: number;
  onAddToast: (message: string, type: 'success' | 'error' | 'warning') => void;
}

interface QRCodeData {
  qrCode: string;
  url: string;
}

const DeviceStatus: React.FC<DeviceStatusProps> = ({ 
  isConnected, 
  connectedClients, 
  onAddToast 
}) => {
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [localIP, setLocalIP] = useState<string>('');

  useEffect(() => {
    const fetchQRCode = async () => {
      try {
        const response = await fetch('/api/qr-code');
        const data = await response.json();
        setQrData(data);
        setLocalIP(data.url);
      } catch (error) {
        console.error('Failed to fetch QR code:', error);
      }
    };

    fetchQRCode();
  }, []);

  const copyToClipboard = async () => {
    if (!qrData?.url) return;
    
    try {
      await navigator.clipboard.writeText(qrData.url);
      setCopied(true);
      onAddToast('URL copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      onAddToast('Failed to copy URL', 'error');
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Network Status</h3>
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
          isConnected 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          <Wifi className="w-4 h-4" />
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <Users className="w-5 h-5 text-blue-500" />
          <div>
            <p className="font-medium text-gray-800">{connectedClients}</p>
            <p className="text-sm text-gray-600">Connected Devices</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <Wifi className="w-5 h-5 text-green-500" />
          <div>
            <p className="font-medium text-gray-800">Local Network</p>
            <p className="text-sm text-gray-600">Same WiFi Required</p>
          </div>
        </div>
      </div>

      {localIP && (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-800">Share this URL</p>
              <p className="text-sm text-blue-600 font-mono truncate">{localIP}</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowQR(!showQR)}
                className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                title="Show QR Code"
              >
                <QrCode className="w-5 h-5" />
              </button>
              <button
                onClick={copyToClipboard}
                className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                title="Copy URL"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {showQR && qrData && (
            <div className="flex justify-center p-4 bg-white border border-gray-200 rounded-lg">
              <div className="text-center">
                <img 
                  src={qrData.qrCode} 
                  alt="QR Code" 
                  className="w-48 h-48 mx-auto mb-3"
                />
                <p className="text-sm text-gray-600">
                  Scan with your mobile device
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-start space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-medium">Security Note</p>
          <p>All content expires in 10 minutes and is only accessible on your local network.</p>
        </div>
      </div>
    </div>
  );
};

export default DeviceStatus;
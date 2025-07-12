import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Download, 
  Clock, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive, 
  File,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { SharedContent } from '../hooks/useSocket';

interface ContentListProps {
  content: SharedContent[];
  onAddToast: (message: string, type: 'success' | 'error' | 'warning') => void;
}

const ContentList: React.FC<ContentListProps> = ({ content, onAddToast }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getFileIcon = (mimetype?: string) => {
    if (!mimetype) return <File className="w-5 h-5" />;
    
    if (mimetype.startsWith('image/')) return <Image className="w-5 h-5 text-green-500" />;
    if (mimetype.startsWith('video/')) return <Video className="w-5 h-5 text-blue-500" />;
    if (mimetype.startsWith('audio/')) return <Music className="w-5 h-5 text-purple-500" />;
    if (mimetype.includes('zip') || mimetype.includes('archive')) return <Archive className="w-5 h-5 text-orange-500" />;
    if (mimetype.startsWith('text/') || mimetype.includes('document')) return <FileText className="w-5 h-5 text-blue-600" />;
    
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getTimeRemaining = (expiresAt: number) => {
    const now = Date.now();
    const remaining = expiresAt - now;
    
    if (remaining <= 0) return 'Expired';
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    if (minutes > 0) return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    return `${seconds}s`;
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      onAddToast('Copied to clipboard!', 'success');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      onAddToast('Failed to copy to clipboard', 'error');
    }
  };

  const handleDownload = async (downloadUrl: string, filename: string) => {
    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      onAddToast('File downloaded successfully!', 'success');
    } catch (error) {
      onAddToast('Failed to download file', 'error');
    }
  };

  if (content.length === 0) {
    return (
      <div className="text-center py-12">
        <File className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-500 mb-2">No content shared yet</h3>
        <p className="text-gray-400">Upload files or share text to see them here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">
          Shared Content ({content.length})
        </h3>
        <div className="text-sm text-gray-500">
          Auto-expires in 10 minutes
        </div>
      </div>

      <div className="space-y-3">
        {content.map((item) => (
          <ContentItem
            key={item.id}
            item={item}
            getFileIcon={getFileIcon}
            formatFileSize={formatFileSize}
            formatTimeAgo={formatTimeAgo}
            getTimeRemaining={getTimeRemaining}
            copyToClipboard={copyToClipboard}
            handleDownload={handleDownload}
            copiedId={copiedId}
          />
        ))}
      </div>
    </div>
  );
};

interface ContentItemProps {
  item: SharedContent;
  getFileIcon: (mimetype?: string) => React.ReactNode;
  formatFileSize: (bytes: number) => string;
  formatTimeAgo: (timestamp: number) => string;
  getTimeRemaining: (expiresAt: number) => string;
  copyToClipboard: (text: string, id: string) => void;
  handleDownload: (downloadUrl: string, filename: string) => void;
  copiedId: string | null;
}

const ContentItem: React.FC<ContentItemProps> = ({
  item,
  getFileIcon,
  formatFileSize,
  formatTimeAgo,
  getTimeRemaining,
  copyToClipboard,
  handleDownload,
  copiedId
}) => {
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      setTimeRemaining(getTimeRemaining(item.expiresAt));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [item.expiresAt, getTimeRemaining]);

  if (item.type === 'file') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {getFileIcon(item.mimetype)}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 truncate">{item.filename}</p>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>{formatFileSize(item.size || 0)}</span>
                <span>•</span>
                <span>{formatTimeAgo(item.uploadedAt || 0)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
              <Clock className="w-3 h-3" />
              <span>{timeRemaining}</span>
            </div>
            
            <button
              onClick={() => handleDownload(item.downloadUrl!, item.filename!)}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-blue-500" />
          <span className="font-medium text-gray-800">Text Message</span>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
            <Clock className="w-3 h-3" />
            <span>{timeRemaining}</span>
          </div>
          
          <button
            onClick={() => copyToClipboard(item.content!, item.id)}
            className="flex items-center space-x-1 px-2 py-1 text-gray-600 hover:text-blue-600 transition-colors"
          >
            {copiedId === item.id ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
      
      <div className="prose prose-sm max-w-none">
        {item.processedContent && item.content !== item.processedContent ? (
          <ReactMarkdown>{item.content!}</ReactMarkdown>
        ) : (
          <div className="whitespace-pre-wrap text-gray-700">{item.content}</div>
        )}
      </div>
      
      {item.metadata?.hasLinks && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <a
            href={item.metadata.firstUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Open Link</span>
          </a>
        </div>
      )}
      
      <div className="mt-3 text-xs text-gray-500">
        Shared {formatTimeAgo(item.sharedAt || 0)}
      </div>
    </div>
  );
};

export default ContentList;
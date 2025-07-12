import React, { useState } from 'react';
import { Share2, Upload, MessageSquare, Monitor } from 'lucide-react';
import { useSocket } from './hooks/useSocket';
import FileUpload from './components/FileUpload';
import TextShare from './components/TextShare';
import ContentList from './components/ContentList';
import DeviceStatus from './components/DeviceStatus';
import Toast, { ToastMessage } from './components/Toast';

function App() {
  const { isConnected, connectedClients, sharedContent } = useSocket();
  const [activeTab, setActiveTab] = useState<'upload' | 'text' | 'content' | 'devices'>('upload');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'warning') => {
    const id = Date.now().toString();
    const toast: ToastMessage = { id, message, type };
    setToasts(prev => [...prev, toast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    const result = await response.json();
    addToast(`File "${file.name}" uploaded successfully!`, 'success');
  };

  const handleTextShare = async (text: string, type?: string) => {
    const response = await fetch('/api/share-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, type }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to share text');
    }
  };

  const tabs = [
    { id: 'upload', label: 'Upload Files', icon: Upload },
    { id: 'text', label: 'Share Text', icon: MessageSquare },
    { id: 'content', label: 'Shared Content', icon: Share2 },
    { id: 'devices', label: 'Network', icon: Monitor },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Toast toasts={toasts} removeToast={removeToast} />
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Share2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">LocalShare</h1>
                <p className="text-xs text-gray-500">Real-time file & text sharing</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                isConnected 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span>{isConnected ? 'Online' : 'Offline'}</span>
              </div>
              
              <div className="text-sm text-gray-600">
                {connectedClients} {connectedClients === 1 ? 'device' : 'devices'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.id === 'content' && sharedContent.length > 0 && (
                    <span className="bg-blue-100 text-blue-800 text-xs rounded-full px-2 py-1">
                      {sharedContent.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {activeTab === 'upload' && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Files</h2>
                    <p className="text-gray-600">
                      Share files instantly with all connected devices. Files expire in 10 minutes.
                    </p>
                  </div>
                  <FileUpload onFileUpload={handleFileUpload} onAddToast={addToast} />
                </div>
              )}

              {activeTab === 'text' && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Share Text</h2>
                    <p className="text-gray-600">
                      Send text messages, links, or markdown content to all connected devices.
                    </p>
                  </div>
                  <TextShare onTextShare={handleTextShare} onAddToast={addToast} />
                </div>
              )}

              {activeTab === 'content' && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Shared Content</h2>
                    <p className="text-gray-600">
                      View and download all shared files and messages.
                    </p>
                  </div>
                  <ContentList content={sharedContent} onAddToast={addToast} />
                </div>
              )}

              {activeTab === 'devices' && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Network & Devices</h2>
                    <p className="text-gray-600">
                      Monitor connected devices and share connection details.
                    </p>
                  </div>
                  <DeviceStatus 
                    isConnected={isConnected}
                    connectedClients={connectedClients}
                    onAddToast={addToast}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            <DeviceStatus 
              isConnected={isConnected}
              connectedClients={connectedClients}
              onAddToast={addToast}
            />

            {/* Quick Stats */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Content</span>
                  <span className="font-medium">{sharedContent.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Connected Devices</span>
                  <span className="font-medium">{connectedClients}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className={`font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                    {isConnected ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            {sharedContent.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
                <div className="space-y-2">
                  {sharedContent.slice(0, 3).map((item) => (
                    <div key={item.id} className="text-sm">
                      <p className="text-gray-800 font-medium">
                        {item.type === 'file' ? item.filename : 'Text message'}
                      </p>
                      <p className="text-gray-500">
                        {new Date(item.uploadedAt || item.sharedAt || 0).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface SharedContent {
  id: string;
  type: 'file' | 'text';
  filename?: string;
  mimetype?: string;
  size?: number;
  downloadUrl?: string;
  content?: string;
  processedContent?: string;
  metadata?: {
    hasLinks?: boolean;
    firstUrl?: string;
  };
  uploadedAt?: number;
  sharedAt?: number;
  expiresAt: number;
}

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedClients, setConnectedClients] = useState(0);
  const [sharedContent, setSharedContent] = useState<SharedContent[]>([]);

  useEffect(() => {
    const newSocket = io(window.location.origin);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('clientCount', (count: number) => {
      setConnectedClients(count);
    });

    newSocket.on('initialContent', (content: SharedContent[]) => {
      setSharedContent(content);
    });

    newSocket.on('newContent', (content: SharedContent) => {
      setSharedContent(prev => [content, ...prev]);
    });

    newSocket.on('contentRemoved', (contentId: string) => {
      setSharedContent(prev => prev.filter(item => item.id !== contentId));
    });

    return () => {
      newSocket.close();
    };
  }, []);

  return {
    socket,
    isConnected,
    connectedClients,
    sharedContent,
    setSharedContent
  };
};
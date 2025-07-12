import React, { useState } from 'react';
import { Send, MessageSquare, Link, Type } from 'lucide-react';

interface TextShareProps {
  onTextShare: (text: string, type?: string) => Promise<void>;
  onAddToast: (message: string, type: 'success' | 'error' | 'warning') => void;
}

const TextShare: React.FC<TextShareProps> = ({ onTextShare, onAddToast }) => {
  const [text, setText] = useState('');
  const [shareType, setShareType] = useState<'text' | 'markdown'>('text');
  const [isSharing, setIsSharing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text.trim()) {
      onAddToast('Please enter some text to share', 'warning');
      return;
    }

    setIsSharing(true);
    try {
      await onTextShare(text, shareType);
      setText('');
      onAddToast('Text shared successfully!', 'success');
    } catch (error) {
      onAddToast('Failed to share text', 'error');
    } finally {
      setIsSharing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit(e);
    }
  };

  const detectContentType = (content: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const markdownRegex = /[*_`#\[\]]/;
    
    if (urlRegex.test(content)) {
      return 'Contains links';
    }
    if (markdownRegex.test(content)) {
      return 'Markdown detected';
    }
    return 'Plain text';
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setShareType('text')}
              className={`
                flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${shareType === 'text' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
                }
              `}
            >
              <Type className="w-4 h-4" />
              <span>Text</span>
            </button>
            <button
              type="button"
              onClick={() => setShareType('markdown')}
              className={`
                flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${shareType === 'markdown' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
                }
              `}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Markdown</span>
            </button>
          </div>
        </div>

        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter text, links, or markdown content to share..."
            className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSharing}
          />
          
          {text && (
            <div className="absolute bottom-2 left-4 flex items-center space-x-2">
              <div className="flex items-center space-x-1 bg-gray-100 rounded-full px-3 py-1">
                <Link className="w-3 h-3 text-gray-500" />
                <span className="text-xs text-gray-600">{detectContentType(text)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {text.length}/1000 characters • Press Ctrl+Enter to share
          </div>
          
          <button
            type="submit"
            disabled={!text.trim() || isSharing}
            className={`
              flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-all
              ${text.trim() && !isSharing
                ? 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            <Send className="w-4 h-4" />
            <span>{isSharing ? 'Sharing...' : 'Share'}</span>
          </button>
        </div>
      </form>

      {shareType === 'markdown' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">Markdown Support</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p><code>**bold**</code> • <code>*italic*</code> • <code>`code`</code></p>
            <p><code># Header</code> • <code>[link](url)</code> • <code>- list</code></p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextShare;
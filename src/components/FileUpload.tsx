import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File) => Promise<void>;
  onAddToast: (message: string, type: 'success' | 'error' | 'warning') => void;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, onAddToast }) => {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      // Check file size
      if (file.size > 100 * 1024 * 1024) {
        onAddToast(`File ${file.name} is too large (max 100MB)`, 'error');
        continue;
      }

      const uploadId = Date.now() + Math.random();
      const upload: UploadProgress = {
        file,
        progress: 0,
        status: 'uploading'
      };

      setUploads(prev => [...prev, upload]);

      try {
        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploads(prev => prev.map(u => 
            u.file === file ? { ...u, progress: Math.min(u.progress + 10, 90) } : u
          ));
        }, 100);

        await onFileUpload(file);

        clearInterval(progressInterval);
        setUploads(prev => prev.map(u => 
          u.file === file ? { ...u, progress: 100, status: 'success' } : u
        ));

        // Remove from list after 3 seconds
        setTimeout(() => {
          setUploads(prev => prev.filter(u => u.file !== file));
        }, 3000);

      } catch (error) {
        setUploads(prev => prev.map(u => 
          u.file === file ? { 
            ...u, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Upload failed' 
          } : u
        ));
      }
    }
  }, [onFileUpload, onAddToast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    maxSize: 100 * 1024 * 1024, // 100MB
  });

  const removeUpload = (file: File) => {
    setUploads(prev => prev.filter(u => u.file !== file));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${isDragActive 
            ? 'border-blue-400 bg-blue-50 scale-105' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }
        `}
      >
        <input {...getInputProps()} />
        <Upload className={`mx-auto w-12 h-12 mb-4 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
        <p className="text-lg font-medium text-gray-700 mb-2">
          {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className="text-sm text-gray-500 mb-4">
          or click to select files
        </p>
        <p className="text-xs text-gray-400">
          Maximum file size: 100MB • Supported: Images, Videos, Documents, Archives
        </p>
      </div>

      {uploads.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">Uploading Files</h4>
          {uploads.map((upload, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <File className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-sm text-gray-700">{upload.file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(upload.file.size)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {upload.status === 'success' && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {upload.status === 'error' && (
                    <button
                      onClick={() => removeUpload(upload.file)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
              
              {upload.status === 'uploading' && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              )}
              
              {upload.status === 'error' && (
                <p className="text-sm text-red-600">{upload.error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
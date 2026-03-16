import { useState } from 'react';
import { resumeAPI } from '../services/api';

export function ResumeUpload({ onUploadComplete, onCancel }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF or DOCX file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await resumeAPI.parse(formData);
      
      if (response.data) {
        onUploadComplete(response.data);
      } else {
        setError('Failed to parse resume. Please try again.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to parse resume. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Upload Resume</h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        )}
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : uploading
            ? 'border-gray-300 bg-gray-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".pdf,.docx,.doc"
          onChange={(e) => handleFile(e.target.files?.[0])}
          disabled={uploading}
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          {uploading ? (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <div className="text-lg font-medium">Uploading and parsing resume...</div>
              <div className="text-sm text-gray-500">This may take a few moments</div>
            </div>
          ) : (
            <>
              <div className="text-6xl mb-4">📄</div>
              <div className="text-xl font-medium mb-2">
                Drag & drop your resume here
              </div>
              <div className="text-sm text-gray-500 mb-4">
                or click to browse (PDF or DOCX)
              </div>
              <div className="text-xs text-gray-400 mt-2">
                Maximum file size: 10MB
              </div>
            </>
          )}
        </label>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-800 font-medium">Error</div>
          <div className="text-red-600 text-sm mt-1">{error}</div>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        <p className="mb-2">Supported formats:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>PDF documents (.pdf)</li>
          <li>Microsoft Word documents (.docx, .doc)</li>
        </ul>
        <p className="mt-2 text-xs">
          Note: Scanned PDFs (images) are not supported yet. Please use text-based PDFs or DOCX files.
        </p>
      </div>
    </div>
  );
}

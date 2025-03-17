import React, { useState } from 'react';
import { uploadFile, deleteFile } from '../utils/cloudinary';

const FileUpload = ({ onUploadSuccess, onUploadError }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files);
    setUploading(true);

    try {
      const uploadPromises = files.map(async (file) => {
        const result = await uploadFile(file);
        return {
          name: file.name,
          url: result.url,
          publicId: result.publicId
        };
      });

      const results = await Promise.all(uploadPromises);
      setUploadedFiles(prev => [...prev, ...results]);
      
      if (onUploadSuccess) {
        onUploadSuccess(results);
      }
    } catch (error) {
      console.error('Upload error:', error);
      if (onUploadError) {
        onUploadError(error);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (publicId) => {
    try {
      await deleteFile(publicId);
      setUploadedFiles(prev => prev.filter(file => file.publicId !== publicId));
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Upload Files
        </label>
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          disabled={uploading}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      {uploading && (
        <div className="mb-4">
          <p className="text-blue-500">Uploading...</p>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Uploaded Files:</h3>
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div key={file.publicId} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                <a 
                  href={file.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700"
                >
                  {file.name}
                </a>
                <button
                  onClick={() => handleDelete(file.publicId)}
                  className="text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload; 
import React, { useCallback } from 'react';
import { Upload, Lock } from 'lucide-react';
const ImageUploader = ({ onImageUpload, title, disabled = false }) => {
  const handleDrop = useCallback((e) => {
    if (disabled) return;
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const imageUrl = URL.createObjectURL(file);
      onImageUpload(imageUrl);
    }
  }, [onImageUpload, disabled]);
  const handleFileSelect = (e) => {
    if (disabled) return;
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      onImageUpload(imageUrl);
    }
  };
  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        disabled 
          ? 'border-gray-300 bg-gray-100 cursor-not-allowed' 
          : 'border-gray-300 hover:border-blue-400 bg-white cursor-pointer'
      }`}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {disabled ? (
        <Lock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      ) : (
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      )}
      <p className="text-lg font-semibold text-gray-700 mb-2">
        {title}
      </p>
      {disabled ? (
        <div className="space-y-2">
          <p className="text-gray-500">Complete Step 1 first</p>
          <p className="text-sm text-gray-400">Generate an AI image to enable upload</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-gray-500">Drag & drop an image or click to browse</p>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id={`file-input-${title}`}
          />
          <label
            htmlFor={`file-input-${title}`}
            className="bg-green-500 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-green-600 transition-colors inline-block"
          >
            Browse Files
          </label>
        </div>
      )}
    </div>
  );
};
export default ImageUploader;
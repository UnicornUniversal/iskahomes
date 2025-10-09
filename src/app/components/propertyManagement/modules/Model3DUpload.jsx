import React, { useState } from 'react';
import { uploadFileToStorage } from '@/lib/fileUpload';
import { toast } from 'react-toastify';

const Model3DUpload = ({ formData, updateFormData, accountType }) => {
  const [uploading, setUploading] = useState(false);

  // Only show for developers
  if (accountType !== 'developer') {
    return null;
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'model/gltf-binary',
      'model/gltf+json',
      'application/octet-stream' // For .glb files
    ];

    if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.glb')) {
      toast.error('Please upload a valid 3D model file (.glb format)');
      return;
    }

    // Validate file size (max 100MB for 3D models)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 100MB');
      return;
    }

    setUploading(true);
    try {
      const result = await uploadFileToStorage(file, 'iskaHomes', 'property-3d');
      
      if (result.success) {
        updateFormData({ model_3d: result.data });
        toast.success('3D model uploaded successfully!');
      } else {
        toast.error(result.error || 'Failed to upload 3D model');
      }
    } catch (error) {
      console.error('Error uploading 3D model:', error);
      toast.error('Error uploading 3D model');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveModel = () => {
    updateFormData({ model_3d: null });
    toast.success('3D model removed');
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          3D Model Upload
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Upload a 3D model file (.glb format) to showcase your property in 3D
        </p>
        
        {formData.model_3d ? (
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {formData.model_3d.originalName || formData.model_3d.filename}
                </p>
                <p className="text-xs text-gray-500">
                  {(formData.model_3d.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={handleRemoveModel}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              accept=".glb"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              id="3d-model-upload"
            />
            <label
              htmlFor="3d-model-upload"
              className="cursor-pointer block"
            >
              <div className="space-y-2">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="text-sm text-gray-600">
                  <span className="font-medium text-blue-600 hover:text-blue-500">
                    Click to upload
                  </span>
                  {' '}or drag and drop
                </div>
                <p className="text-xs text-gray-500">
                  GLB files only, max 100MB
                </p>
              </div>
            </label>
          </div>
        )}
        
        {uploading && (
          <div className="mt-2 text-sm text-blue-600">
            Uploading 3D model...
          </div>
        )}
      </div>
    </div>
  );
};

export default Model3DUpload;

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Input } from '../../ui/input'
import { cn } from '@/lib/utils'
import { toast } from 'react-toastify'
// React Icons imports
import { FaFilePdf, FaFileExcel, FaFileWord, FaFilePowerpoint, FaFileImage, FaFileAlt, FaTrash, FaUpload, FaEdit } from 'react-icons/fa'

const DevelopmentFiles = ({ formData, updateFormData, isEditMode }) => {
  const [allFiles, setAllFiles] = useState([])
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  // Initialize with form data
  useEffect(() => {
    if (formData.additional_files) {
      setAllFiles(formData.additional_files);
    }
  }, [formData.additional_files]);

  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return <FaFilePdf className="text-red-500" />;
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return <FaFileExcel className="text-green-500" />;
    if (fileType.includes('word') || fileType.includes('document')) return <FaFileWord className="" />;
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return <FaFilePowerpoint className="text-orange-500" />;
    if (fileType.includes('image')) return <FaFileImage className="text-purple-500" />;
    return <FaFileAlt className="" />;
  }


  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Calculate total size of all files (handles both File objects and existing file objects)
  const totalSize = useMemo(() => {
    return allFiles.reduce((total, file) => {
      // Handle both File objects and existing file objects from database
      if (file instanceof File) {
        return total + file.size;
      }
      // For existing files, use the size property
      return total + (file.size || 0);
    }, 0);
  }, [allFiles]);

  const maxTotalSize = 50 * 1024 * 1024; // 50MB in bytes
  const remainingSize = maxTotalSize - totalSize;
  const isSizeLimitReached = totalSize >= maxTotalSize;

  const getFileSizeColor = (bytes) => {
    return 'text-primary_color';
  }

  const handleFileUpload = (files) => {
    const fileArray = Array.from(files)
    
    // Calculate total size of new files
    const newFilesTotalSize = fileArray.reduce((total, file) => total + file.size, 0);
    
    // Check cumulative size limit (50MB)
    if (totalSize + newFilesTotalSize > maxTotalSize) {
      const availableMB = (remainingSize / (1024 * 1024)).toFixed(2);
      toast.error(`Total file size would exceed 50MB limit. You have ${availableMB}MB remaining.`);
      return;
    }
    
    const newFiles = fileArray.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      type: file.type,
      size: file.size,
      file: file, // Store the actual File object
      uploaded_at: new Date().toISOString()
    }));

    const updatedFiles = [...allFiles, ...newFiles];
    setAllFiles(updatedFiles);

    // Update form data
    updateFormData({
      additional_files: updatedFiles
    });
    
    toast.success(`${fileArray.length} file(s) added successfully`);
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  const removeFile = (fileId) => {
    const updatedFiles = allFiles.filter(file => file.id !== fileId);
    setAllFiles(updatedFiles);

    // Update form data
    updateFormData({
      additional_files: updatedFiles
    });
  }

  const replaceFile = (fileId, newFile) => {
    // Find the file being replaced to calculate size difference
    const fileToReplace = allFiles.find(f => f.id === fileId);
    const oldSize = fileToReplace?.size || 0;
    const sizeDifference = newFile.size - oldSize;
    
    // Check if replacement would exceed total size limit
    if (totalSize + sizeDifference > maxTotalSize) {
      const availableMB = (remainingSize / (1024 * 1024)).toFixed(2);
      toast.error(`Replacing this file would exceed the 50MB limit. You have ${availableMB}MB remaining.`);
      return;
    }

    const updatedFiles = allFiles.map(file => {
      if (file.id === fileId) {
        return {
          ...file,
          name: newFile.name,
          type: newFile.type,
          size: newFile.size,
          file: newFile,
          uploadedAt: new Date().toISOString()
        };
      }
      return file;
    });

    setAllFiles(updatedFiles);

    // Update form data
    updateFormData({
      additional_files: updatedFiles
    });
    
    toast.success('File replaced successfully');
  }


  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="mb-2">Development Files</h2>
        <p>
          {isEditMode ? 'Upload and manage documents for your development' : 'Upload documents, presentations, and other files for your development project'}
        </p>
      </div>

      <div className="space-y-6">
        {/* File Upload Area */}
        <div>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium ">
                Upload Files
              </label>
              <div className="text-sm ">
                {formatFileSize(totalSize)} / {formatFileSize(maxTotalSize)} • {allFiles.length} file(s)
              </div>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div
                className={cn(
                  "h-2.5 rounded-full transition-all duration-300",
                  totalSize / maxTotalSize > 0.9 ? "bg-red-500" :
                  totalSize / maxTotalSize > 0.7 ? "bg-yellow-500" : "bg-primary_color"
                )}
                style={{ width: `${Math.min((totalSize / maxTotalSize) * 100, 100)}%` }}
              />
            </div>
            <div className="text-xs text-gray-500">
              {isSizeLimitReached 
                ? 'Limit reached' 
                : `${formatFileSize(remainingSize)} remaining (${((remainingSize / maxTotalSize) * 100).toFixed(1)}%)`
              }
            </div>
          </div>
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300",
              isSizeLimitReached ? "opacity-50 cursor-not-allowed" : ""
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <FaUpload className="mx-auto h-12 w-12  mb-4" />
            <p className=" mb-2">Drag and drop files here or click to upload</p>
            <p className="text-sm  mb-4">
              Supports: PDF, Excel, Word, PowerPoint, and other documents (no images)
            </p>
            <p className={cn(
              "text-xs mb-4",
              isSizeLimitReached ? "text-red-500" : remainingSize < 5 * 1024 * 1024 ? "text-yellow-500" : "text-gray-500"
            )}>
              {isSizeLimitReached 
                ? '50MB limit reached • Remove files to add more'
                : `${formatFileSize(remainingSize)} remaining • No file count limit`
              }
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSizeLimitReached}
              className="primary_button"
            >
              {isSizeLimitReached ? 'Size limit reached' : 'Choose Files'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
          </div>
        </div>

        {/* Files Display */}
        {allFiles.length > 0 ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold ">
                Uploaded Files ({allFiles.length})
              </h3>
              <div className="flex space-x-2">
                <span className="text-sm ">
                  {allFiles.length} Additional Files
                </span>
              </div>
            </div>

            {/* Files List - Optimized */}
            <div className="space-y-2">
              {allFiles.map((file, index) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="text-2xl flex-shrink-0">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {file.name}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className={`text-xs font-medium ${getFileSizeColor(file.size)}`}>
                          {formatFileSize(file.size)}
                        </p>
                        <span className="text-xs ">•</span>
                        <p className="text-xs  truncate">{file.type}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          replaceFile(file.id, e.target.files[0]);
                        }
                      }}
                      className="hidden"
                      id={`replace-file-${file.id}`}
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById(`replace-file-${file.id}`)?.click()}
                      className="secondary_button p-2"
                      title="Replace File"
                    >
                      <FaEdit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFile(file.id)}
                      className="tertiary_button p-2"
                      title="Remove File"
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 ">
            <FaFileAlt className="mx-auto h-16 w-16 mb-4" />
            <p className="text-lg">No files uploaded yet</p>
            <p className="text-sm">Upload your first file to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default DevelopmentFiles

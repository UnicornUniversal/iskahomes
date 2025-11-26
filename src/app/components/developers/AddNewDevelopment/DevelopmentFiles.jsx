import React, { useState, useRef, useEffect } from 'react'
import { Input } from '../../ui/input'
import { cn } from '@/lib/utils'
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

  const getFileSizeColor = (bytes) => {
    const maxSize = 300 * 1024; // 300KB
    if (bytes > maxSize * 0.9) return 'text-red-500'; // 90% of limit
    if (bytes > maxSize * 0.7) return 'text-yellow-500'; // 70% of limit
    return 'text-green-500';
  }

  const handleFileUpload = (files) => {
    const fileArray = Array.from(files)
    
    // Check file count limit
    if (allFiles.length + fileArray.length > 15) {
      alert(`Maximum 15 files allowed. You currently have ${allFiles.length} files and are trying to upload ${fileArray.length} more.`);
      return;
    }

    // Check file size limit (300KB = 300 * 1024 bytes)
    const maxSize = 300 * 1024;
    const oversizedFiles = fileArray.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      const fileNames = oversizedFiles.map(f => f.name).join(', ');
      alert(`The following files exceed the 300KB size limit: ${fileNames}`);
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
    const fileArray = Array.from([newFile]);
    
    // Check file size limit (300KB = 300 * 1024 bytes)
    const maxSize = 300 * 1024;
    if (newFile.size > maxSize) {
      alert(`File "${newFile.name}" exceeds the 300KB size limit`);
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
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium ">
              Upload Files
            </label>
            <div className="text-sm ">
              {allFiles.length}/15 files • Max 300KB per file
            </div>
          </div>
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300",
              allFiles.length >= 15 ? "opacity-50 cursor-not-allowed" : ""
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
            <p className="text-xs text-red-500 mb-4">
              Maximum 15 files • 300KB per file limit
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={allFiles.length >= 15}
              className="primary_button"
            >
              {allFiles.length >= 15 ? 'Maximum files reached' : 'Choose Files'}
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

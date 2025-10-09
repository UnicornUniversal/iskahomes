import React, { useState, useRef, useEffect } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { cn } from '@/lib/utils'
// React Icons imports
import { FaFilePdf, FaFileExcel, FaFileWord, FaFilePowerpoint, FaFileImage, FaFileAlt, FaTrash, FaUpload, FaEdit } from 'react-icons/fa'

const PropertyFiles = ({ formData, updateFormData, isEditMode, accountType = 'developer' }) => {
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
    if (fileType.includes('word') || fileType.includes('document')) return <FaFileWord className="text-blue-500" />;
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return <FaFilePowerpoint className="text-orange-500" />;
    if (fileType.includes('image')) return <FaFileImage className="text-purple-500" />;
    return <FaFileAlt className="text-gray-500" />;
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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

  // Only render for developers
  if (accountType !== 'developer') {
    return null;
  }

  return (
    <div className="w-full p-6 bg-white rounded-lg shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Files</h2>
        <p className="text-gray-600">
          {isEditMode ? 'Upload and manage documents for your property' : 'Upload documents, presentations, and other files for your property'}
        </p>
      </div>

      <div className="space-y-6">
        {/* File Upload Area */}
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <FaUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            Drop files here or click to upload
          </p>
          <p className="text-sm text-gray-500 mb-4">
            PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, RTF files up to 300KB each
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="mb-2"
          >
            Choose Files
          </Button>
          <p className="text-xs text-gray-400">
            Maximum 15 files • Maximum 300KB per file
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
        </div>

        {/* Files List - Clean and Simple */}
        {allFiles.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Uploaded Files ({allFiles.length})
              </h3>
            </div>

            {/* Simple File List */}
            <div className="space-y-2">
              {allFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)} • {file.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          replaceFile(file.id, e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-500 hover:text-blue-700 p-2"
                      title="Replace File"
                    >
                      <FaEdit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFile(file.id)}
                      className="text-red-500 hover:text-red-700 p-2"
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
          <div className="text-center py-12 text-gray-500">
            <FaFileAlt className="mx-auto h-16 w-16 mb-4" />
            <p className="text-lg">No files uploaded yet</p>
            <p className="text-sm">Upload your first file to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default PropertyFiles
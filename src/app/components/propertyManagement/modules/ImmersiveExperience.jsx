"use client"
import React, { useState, useCallback } from 'react'
import Model3DViewer, { Model3DModal } from './Model3DViewer'
import VirtualTour from './VirtualTour'
import { Button } from '../../ui/button'

const ImmersiveExperience = ({ formData, updateFormData, mode, accountType = 'developer' }) => {
  const [showModelModal, setShowModelModal] = useState(false)
  const isViewMode = mode === 'view'

  const removeModel = useCallback(() => {
    updateFormData({
      model_3d: null
    })
  }, [updateFormData])

  const handleModelUpload = useCallback((e) => {
    const file = e.target.files[0]
    if (file) {
      updateFormData({
        model_3d: {
          file: file,
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file)
        }
      })
    }
  }, [updateFormData])

  const handleModelReplace = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.glb,.gltf'
    input.onchange = handleModelUpload
    input.click()
  }, [handleModelUpload])

  // Get model format
  const getModelFormat = () => {
    if (!formData.model_3d) return 'glb'
    const fileName = formData.model_3d.originalName || 
                     formData.model_3d.name || 
                     formData.model_3d.filename || 
                     ''
    if (fileName && fileName.includes('.')) {
      return fileName.split('.').pop().toLowerCase()
    }
    return 'glb'
  }

  return (
    <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-6'>
      <h3 className='text-lg font-semibold text-primary_color mb-6'>Immersive Experience</h3>
      
      <div className="space-y-8">
        {/* 3D Model Section - Only for developers */}
        {accountType === 'developer' && (
          <div>
            <div className="mb-4">
              <h4 className="text-base font-semibold text-gray-900 mb-2">3D Model</h4>
              <p className="text-sm text-gray-600">
                Upload a 3D model file (GLB, GLTF) to provide an immersive 3D view of your property
              </p>
            </div>

            {formData.model_3d ? (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 relative">
                  <Model3DViewer 
                    modelUrl={formData.model_3d.url}
                    modelFormat={getModelFormat()}
                    width="100%"
                    height="400px"
                    showControls={true}
                    autoRotate={true}
                  />
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="text-sm text-gray-600 flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {formData.model_3d.originalName || formData.model_3d.filename}
                    </div>
                    <div className="text-xs text-gray-500">
                      {(formData.model_3d.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => setShowModelModal(true)}
                      variant="outline"
                      size="sm"
                    >
                      View Fullscreen
                    </Button>
                    {!isViewMode && (
                      <>
                        <Button
                          type="button"
                          onClick={handleModelReplace}
                          variant="outline"
                          size="sm"
                        >
                          Replace
                        </Button>
                        <Button
                          type="button"
                          onClick={removeModel}
                          variant="destructive"
                          size="sm"
                        >
                          Remove
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : !isViewMode ? (
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer hover:border-gray-400"
                onClick={handleModelReplace}
              >
                <div className="space-y-2">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="text-sm text-gray-600">
                    Click to upload 3D model or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    GLB, GLTF files up to 100MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <svg className="mx-auto h-12 w-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p className="text-sm">No 3D model uploaded</p>
              </div>
            )}
          </div>
        )}

        {/* Virtual Tour Section */}
        <div className={accountType === 'developer' ? 'border-t pt-6' : ''}>
          <VirtualTour
            formData={formData}
            updateFormData={updateFormData}
            mode={isViewMode ? 'view' : 'edit'}
          />
        </div>
      </div>

      {/* 3D Model Modal */}
      {showModelModal && formData.model_3d && (
        <Model3DModal
          isOpen={showModelModal}
          onClose={() => setShowModelModal(false)}
          modelUrl={formData.model_3d.url}
          modelFormat={getModelFormat()}
          title="3D Model Viewer"
        />
      )}
    </div>
  )
}

export default ImmersiveExperience


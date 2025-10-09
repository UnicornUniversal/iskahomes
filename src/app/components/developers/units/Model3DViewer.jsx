"use client"
import React, { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, Html, useProgress } from '@react-three/drei'
import { useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import * as THREE from 'three'

// Loading component
function Loader() {
  const { progress } = useProgress()
  return (
    <Html center>
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-sm text-gray-600">Loading 3D Model...</div>
        <div className="text-xs text-gray-500">{Math.round(progress)}%</div>
      </div>
    </Html>
  )
}

// Model component that handles different file formats
const Model = React.forwardRef(({ url, format, onCenterChange }, ref) => {
  const meshRef = useRef()
  const [error, setError] = useState(null)
  const [model, setModel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modelCenter, setModelCenter] = useState([0, 0, 0])

  // Load model asynchronously to avoid re-render issues
  React.useEffect(() => {
    if (!url || !format) return

    setLoading(true)
    setError(null)
    setModel(null) // Clear previous model

    const loadModel = async () => {
      try {
        let loader
        switch (format.toLowerCase()) {
          case 'gltf':
          case 'glb':
            loader = new GLTFLoader()
            break
          case 'obj':
            loader = new OBJLoader()
            break
          case 'fbx':
            loader = new FBXLoader()
            break
          default:
            throw new Error(`Unsupported format: ${format}`)
        }

        const loadedModel = await new Promise((resolve, reject) => {
          loader.load(url, resolve, undefined, reject)
        })

        console.log('Model loaded successfully:', loadedModel)
        setModel(loadedModel)
        setLoading(false)
      } catch (err) {
        console.error('Error loading model:', err)
        setError(err.message)
        setLoading(false)
        setModel(null)
      }
    }

    loadModel()

    // Cleanup function to prevent memory leaks
    return () => {
      if (model) {
        console.log('Cleaning up model')
        // Don't dispose the model here as it might be used elsewhere
      }
    }
  }, [url, format])

  // Expose the model center to parent component (always call this hook)
  React.useImperativeHandle(ref, () => ({
    getCenter: () => modelCenter
  }))

  // Auto-rotate the model
  useFrame((state, delta) => {
    if (meshRef.current && model) {
      meshRef.current.rotation.y += delta * 0.2
    }
  })

  // Center and scale the model when it loads
  React.useEffect(() => {
    if (model && meshRef.current) {
      try {
        console.log('Initializing model positioning...')
        
        // Wait a bit for the model to be fully rendered
        setTimeout(() => {
          if (meshRef.current) {
            const box = new THREE.Box3().setFromObject(meshRef.current)
            const center = box.getCenter(new THREE.Vector3())
            const size = box.getSize(new THREE.Vector3())
            
            console.log('Model bounds:', { center, size })
            
            // Store the model center for orbit controls
            const centerArray = [center.x, center.y, center.z]
            setModelCenter(centerArray)
            if (onCenterChange) {
              onCenterChange(centerArray)
            }
            
            // Center the model at origin
            meshRef.current.position.sub(center)
            
            // Scale the model to be much larger and closer
            const maxDim = Math.max(size.x, size.y, size.z)
            if (maxDim > 0) {
              // Make the model much larger (was 2, now 8 for closer view)
              const scale = 8 / maxDim
              meshRef.current.scale.setScalar(scale)
              console.log('Model scaled by:', scale)
            }
          }
        }, 100) // Small delay to ensure model is rendered
      } catch (err) {
        console.error('Error initializing model:', err)
      }
    }
  }, [model, onCenterChange])

  if (loading) {
    return (
      <Html center>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-sm text-gray-600">Loading 3D Model...</div>
        </div>
      </Html>
    )
  }

  if (error) {
    return (
      <Html center>
        <div className="text-center text-red-600">
          <div className="text-lg font-semibold mb-2">Model Load Error</div>
          <div className="text-sm">{error}</div>
        </div>
      </Html>
    )
  }

  if (!model) {
    return (
      <Html center>
        <div className="text-center text-gray-500">
          <div className="text-lg font-semibold mb-2">No Model</div>
          <div className="text-sm">Model could not be loaded</div>
        </div>
      </Html>
    )
  }

  if (format.toLowerCase() === 'gltf' || format.toLowerCase() === 'glb') {
    return (
      <primitive 
        ref={meshRef} 
        object={model.scene} 
        dispose={null}
        onUpdate={(self) => {
          // Ensure the model stays visible
          if (self && self.visible === false) {
            self.visible = true
          }
        }}
      />
    )
  } else {
    return (
      <primitive 
        ref={meshRef} 
        object={model} 
        dispose={null}
        onUpdate={(self) => {
          // Ensure the model stays visible
          if (self && self.visible === false) {
            self.visible = true
          }
        }}
      />
    )
  }
})

// Main 3D Viewer Component
const Model3DViewer = ({ 
  modelUrl, 
  modelFormat = 'gltf', 
  width = '100%', 
  height = '400px',
  showControls = true,
  autoRotate = true,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modelCenter, setModelCenter] = useState([0, 0, 0])
  const modelRef = useRef()

  // Debug logging
  React.useEffect(() => {
    console.log('Model3DViewer props:', { modelUrl, modelFormat, isLoading, error })
  }, [modelUrl, modelFormat, isLoading, error])

  if (!modelUrl) {
    return (
      <div 
        className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="text-center text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
          <div className="text-lg font-semibold mb-2">No 3D Model</div>
          <div className="text-sm">Upload a 3D model to view it here</div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`bg-gray-900 rounded-lg overflow-hidden ${className}`}
      style={{ width, height }}
    >
      <Canvas
        camera={{ position: [0, 0, 2], fov: 60 }}
        onCreated={() => setIsLoading(false)}
        onError={(error) => {
          console.error('Canvas error:', error)
          setError('Failed to initialize 3D viewer')
        }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        
        {/* Environment */}
        <Environment preset="studio" />
        
        {/* Model */}
        <Suspense fallback={<Loader />}>
          <Model 
            ref={modelRef}
            url={modelUrl} 
            format={modelFormat}
            onCenterChange={setModelCenter}
          />
        </Suspense>
        
        {/* Controls */}
        {showControls && (
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            autoRotate={autoRotate}
            autoRotateSpeed={0.5}
            minDistance={0.5}
            maxDistance={5}
            target={modelCenter}
          />
        )}
      </Canvas>
      
      {/* Controls Info */}
      {showControls && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white text-xs p-2 rounded">
          <div>🖱️ Left click + drag: Rotate</div>
          <div>🖱️ Right click + drag: Pan</div>
          <div>🖱️ Scroll: Zoom</div>
        </div>
      )}
      
      {/* Error Display */}
      {error && (
        <div className="absolute inset-0 bg-red-50 flex items-center justify-center">
          <div className="text-center text-red-600">
            <div className="text-lg font-semibold mb-2">3D Viewer Error</div>
            <div className="text-sm">{error}</div>
          </div>
        </div>
      )}
    </div>
  )
}

// Compact viewer for thumbnails/previews
export const Model3DPreview = ({ modelUrl, modelFormat, className = '' }) => {
  return (
    <Model3DViewer
      modelUrl={modelUrl}
      modelFormat={modelFormat}
      width="100%"
      height="400px"
      showControls={true}
      autoRotate={true}
      className={className}
    />
  )
}

// Full-screen viewer modal
export const Model3DModal = ({ 
  isOpen, 
  onClose, 
  modelUrl, 
  modelFormat,
  title = "3D Model Viewer"
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg overflow-hidden max-w-6xl max-h-[90vh] w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        {/* 3D Viewer */}
        <div className="p-4">
          <Model3DViewer
            modelUrl={modelUrl}
            modelFormat={modelFormat}
            width="100%"
            height="80vh"
            showControls={true}
            autoRotate={false}
          />
        </div>
        
        {/* Footer */}
        <div className="flex justify-end p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default Model3DViewer

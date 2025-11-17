"use client"
import React, { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Environment, Html, useProgress } from '@react-three/drei'
import { useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import * as THREE from 'three'

// Improved helper function to fit camera to object with better positioning
function fitCameraToObject(camera, object, controls, canvasAspect, offset = 1.25) {
  const box = new THREE.Box3().setFromObject(object)
  const center = box.getCenter(new THREE.Vector3())

  // Compute the bounding sphere for more consistent sizing
  const sphere = new THREE.Sphere()
  box.getBoundingSphere(sphere)
  const radius = sphere.radius

  // Calculate the optimal distance to fit the object
  const fov = camera.fov * (Math.PI / 180)
  let distance
  
  if (canvasAspect >= 1) {
    distance = Math.abs(radius / Math.sin(fov / 2))
  } else {
    distance = Math.abs(radius / Math.sin(fov / 2)) / canvasAspect
  }

  distance *= offset

  // Position camera at eye level with 3/4 view angle
  const angleH = Math.PI / 4
  
  const cameraPosition = new THREE.Vector3(
    center.x + distance * Math.cos(angleH) * 0.9,
    center.y,
    center.z + distance * Math.sin(angleH) * 0.9
  )

  camera.position.copy(cameraPosition)
  camera.lookAt(center)
  
  // Set reasonable clip planes
  camera.near = Math.max(0.1, distance / 100)
  camera.far = Math.max(1000, distance * 100)
  camera.updateProjectionMatrix()

  // Update controls
  if (controls) {
    controls.target.copy(center)
    controls.update()
  }

  return { center, radius, distance }
}

// Loading component
function Loader() {
  return (
    <Html center>
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-sm text-gray-600">Loading 3D Model...</div>
      </div>
    </Html>
  )
}

// Progress loader component
function ProgressLoader() {
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

// Improved Model component with proper centering and one-time initialization
const Model = React.forwardRef(({ url, format, onModelReady, controlsRef, canvasAspect }, ref) => {
  const meshRef = useRef()
  const groupRef = useRef()
  const { camera, scene } = useThree()
  const [error, setError] = useState(null)
  const [model, setModel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  // Load model
  React.useEffect(() => {
    if (!url || !format) return

    setLoading(true)
    setError(null)
    setModel(null)
    setInitialized(false)

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
  }, [url, format])

  // Expose model data to parent
  React.useImperativeHandle(ref, () => ({
    getMesh: () => groupRef.current
  }))

  // Auto-rotate the model around its actual center
  useFrame((state, delta) => {
    if (groupRef.current && model && initialized) {
      groupRef.current.rotation.y += delta * 0.2
    }
  })

  // Center, scale, and fit camera - ONE TIME when model loads
  React.useEffect(() => {
    if (model && groupRef.current && !initialized) {
      console.log('Initializing model positioning...')
      
      const initializeModel = () => {
        try {
          // Calculate the bounding box and center
          const box = new THREE.Box3().setFromObject(groupRef.current)
          const center = box.getCenter(new THREE.Vector3())
          const size = box.getSize(new THREE.Vector3())
          
          console.log('Model bounds:', { center, size })
          
          // Calculate the bounding sphere for consistent sizing
          const sphere = new THREE.Sphere()
          box.getBoundingSphere(sphere)
          const radius = sphere.radius
          
          // Center the model at origin by offsetting the group
          groupRef.current.position.x = -center.x
          groupRef.current.position.y = -center.y
          groupRef.current.position.z = -center.z
          
          // Adaptive scaling - normalize to a reasonable size
          const targetSize = 2
          if (radius > 0) {
            const scaleFactor = targetSize / radius
            groupRef.current.scale.setScalar(scaleFactor)
            console.log('Model scaled by:', scaleFactor, 'Radius:', radius)
          }
          
          // Fit camera to the centered and scaled model
          if (controlsRef?.current) {
            const scaledRadius = radius * groupRef.current.scale.x
            console.log('Fitting camera to scaled model, radius:', scaledRadius)
            
            fitCameraToObject(camera, groupRef.current, controlsRef.current, canvasAspect, 1.5)
          }
          
          setInitialized(true)
          
          if (onModelReady) {
            onModelReady({
              center: [0, 0, 0],
              radius: radius * groupRef.current.scale.x
            })
          }
          
          console.log('Model initialization complete')
        } catch (err) {
          console.error('Error initializing model:', err)
        }
      }

      // Small delay to ensure everything is ready
      setTimeout(initializeModel, 100)
    }
  }, [model, initialized, camera, controlsRef, canvasAspect, onModelReady])

  if (loading) {
    return <Loader />
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

  // Wrap the model in a group for proper centering and rotation
  const modelElement = format.toLowerCase() === 'gltf' || format.toLowerCase() === 'glb' ? (
    <primitive 
      ref={meshRef} 
      object={model.scene} 
      dispose={null}
    />
  ) : (
    <primitive 
      ref={meshRef} 
      object={model} 
      dispose={null}
    />
  )

  return (
    <group ref={groupRef}>
      {modelElement}
    </group>
  )
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
  const [modelData, setModelData] = useState({ center: [0, 0, 0], radius: 1 })
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  const modelRef = useRef()
  const controlsRef = useRef()
  const canvasRef = useRef()

  // Get canvas aspect ratio for proper camera fitting
  const canvasAspect = canvasSize.width / canvasSize.height

  // Handle model ready event
  const handleModelReady = (data) => {
    console.log('Model ready with data:', data)
    setModelData(data)
  }

  // Monitor canvas size changes
  React.useEffect(() => {
    const updateSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        setCanvasSize({
          width: rect.width,
          height: rect.height
        })
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

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
      ref={canvasRef}
      className={`bg-gray-900 rounded-lg overflow-hidden ${className}`}
      style={{ width, height }}
    >
      <Canvas
        camera={{ position: [0, 2, 3], fov: 45 }}
        onCreated={(state) => {
          setIsLoading(false)
          console.log('Canvas created:', state)
        }}
        onError={(error) => {
          console.error('Canvas error:', error)
          setError('Failed to initialize 3D viewer')
        }}
      >
        {/* Improved Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[5, 5, 5]} 
          intensity={0.8} 
        />
        <pointLight position={[-5, -5, -5]} intensity={0.3} />
        
        {/* Environment */}
        <Environment preset="studio" />
        
        {/* Model - handles its own initialization */}
        <Suspense fallback={<Loader />}>
          <Model 
            ref={modelRef}
            url={modelUrl} 
            format={modelFormat}
            onModelReady={handleModelReady}
            controlsRef={controlsRef}
            canvasAspect={canvasAspect}
          />
        </Suspense>
        
        {/* Controls */}
        {showControls && (
          <OrbitControls
            ref={controlsRef}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            autoRotate={autoRotate}
            autoRotateSpeed={1}
            minDistance={0.1}
            maxDistance={50}
            target={modelData.center}
            makeDefault
          />
        )}
      </Canvas>
      
      {/* Controls Info */}
      {showControls && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white text-xs p-2 rounded hidden sm:block">
          <div>🖱️ Left click + drag: Rotate</div>
          <div>🖱️ Right click + drag: Pan</div>
          <div>🖱️ Scroll: Zoom</div>
        </div>
      )}
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-30">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-sm text-gray-300">Loading 3D Model...</div>
          </div>
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
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col">
      {/* Header - minimal */}
      <div className="flex justify-between items-center p-4 bg-black text-white border-b border-gray-700">
        <h3 className="text-lg font-semibold">{title}</h3>
        <button
          onClick={onClose}
          className="text-gray-300 hover:text-white text-2xl font-bold"
        >
          ×
        </button>
      </div>
      
      {/* 3D Viewer - takes remaining space */}
      <div className="flex-1">
        <Model3DViewer
          modelUrl={modelUrl}
          modelFormat={modelFormat}
          width="100%"
          height="100%"
          showControls={true}
          autoRotate={false}
          className="rounded-none"
        />
      </div>
    </div>
  )
}

export default Model3DViewer
'use client'

import React, { Suspense, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, useGLTF } from '@react-three/drei'
import { LoadingSpinner } from '@/app/components/ui/LoadingSpinner'

// 3D Model Component
function Model({ url }) {
  const { scene } = useGLTF(url)
  const modelRef = useRef()

  useFrame(() => {
    if (modelRef.current) {
      modelRef.current.rotation.y += 0.005
    }
  })

  return (
    <primitive 
      ref={modelRef} 
      object={scene} 
      scale={1} 
      position={[0, 0, 0]} 
    />
  )
}

// Loading Component
function ModelLoading() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-gray-600">Loading 3D Model...</p>
      </div>
    </div>
  )
}

// Error Component
function ModelError() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center text-gray-500">
        <div className="w-16 h-16 mx-auto mb-4">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p>Failed to load 3D model</p>
      </div>
    </div>
  )
}

const Model3DViewer = ({ modelUrl, className = "w-full h-96" }) => {
  if (!modelUrl) {
    return (
      <div className={`${className} bg-gray-100 rounded-lg flex items-center justify-center`}>
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p>No 3D model available</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className} bg-gray-900 rounded-lg overflow-hidden`}>
      <Suspense fallback={<ModelLoading />}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <pointLight position={[-10, -10, -5]} intensity={0.5} />
          
          <Model url={modelUrl} />
          
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={2}
            maxDistance={10}
          />
          
          <Environment preset="sunset" />
        </Canvas>
      </Suspense>
      
      {/* Controls Info */}
      <div className="absolute bottom-4 left-4 bg-black/50 text-white text-xs px-2 py-1 rounded">
        Drag to rotate • Scroll to zoom • Right-click to pan
      </div>
    </div>
  )
}

export default Model3DViewer

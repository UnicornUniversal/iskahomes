'use client'
import React, { useState } from 'react'
import AlbumGallery from '../components/propertyManagement/modules/AlbumGallery'

const page = () => {
  const [albums, setAlbums] = useState([])
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <AlbumGallery 
          albums={albums}
          onAlbumsChange={setAlbums}
          mode="edit"
        />
        
        {/* Debug: Show albums data */}
        {albums.length > 0 && (
          <div className="mt-8 p-4 bg-white rounded-lg border">
            <h3 className="font-semibold mb-2">Debug: Albums Data</h3>
            <pre className="text-xs overflow-auto max-h-64">
              {JSON.stringify(albums, (key, value) => {
                if (key === 'file' && value instanceof File) {
                  return { name: value.name, size: value.size, type: value.type, _type: 'File' }
                }
                return value
              }, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default page

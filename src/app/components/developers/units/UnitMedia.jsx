import React from 'react'

const UnitMedia = ({ mode = 'add' }) => {
  // In a real app, use form state and handlers here
  return (
    <div className='w-full'>
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Upload Photos of your property</h3>
      <div className="mb-8">
        <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer bg-gray-50">
          <span className="text-4xl text-gray-300 mb-2">&#8679;</span>
          <span className="text-gray-500 text-sm">Upload/Drag photos of your property</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-gray-700 mb-1 text-sm">Video from</label>
          <input type="text" placeholder="YouTube" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-gray-700 mb-1 text-sm">Embedded Video ID</label>
          <input type="text" placeholder="Video ID" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>
      <h4 className="text-lg font-semibold text-gray-900 mb-3">Virtual Tour</h4>
      <div className="mb-6">
        <label className="block text-gray-700 mb-1 text-sm">3D Model</label>
        <div className="flex items-center gap-2">
          <input type="file" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <button className="bg-gray-100 px-3 py-2 rounded-lg text-gray-700 text-sm">Upload</button>
        </div>
      </div>
      {/* Floor Plan Field */}
      <div className="mb-6">
        <label className="block text-gray-700 mb-1 text-sm">Floor Plan</label>
        <div className="flex items-center gap-2">
          <input type="file" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <button className="bg-gray-100 px-3 py-2 rounded-lg text-gray-700 text-sm">Upload</button>
        </div>
      </div>
    </div>
  )
}

export default UnitMedia

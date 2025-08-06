import React from 'react'
import { developments } from '@/app/components/Data/Data'
import CustomDropdown from './CustomDropdown'
import { useState } from 'react'

const UnitDescription = ({ mode = 'add' }) => {
  const [selectedDevelopment, setSelectedDevelopment] = useState('')
  // In a real app, use form state and handlers here
  return (
    <div className='w-full'>
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Unit Description</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-gray-700 mb-1">Unit Name</label>
          <input type="text" placeholder="Name of Unit" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-gray-700 mb-1">Development</label>
          <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm">
            <option value="">Select a development</option>
            <option value="dev1">Skyline Heights</option>
            <option value="dev2">Palm Grove Villa</option>
            <option value="dev3">Urban Nest Studio</option>
            <option value="dev4">Garden Estate Duplex</option>
            <option value="dev5">Central Business Office</option>
          </select>
        </div>
      </div>
      <div className="mb-6">
        <label className="block text-gray-700 mb-1">Description</label>
        <textarea placeholder="There are many variations of passages." className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[80px] text-sm" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div>
          <label className="block text-gray-700 mb-1">Furnishing Status</label>
          <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm">
            <option value="">Select furnishing status</option>
            <option value="furnished">Furnished</option>
            <option value="semi-furnished">Semi Furnished</option>
            <option value="unfurnished">Unfurnished</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-700 mb-1">Size (square feet)</label>
          <input type="number" placeholder="e.g. 1200" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-gray-700 mb-1">Unit Status</label>
          <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm">
            <option value="">Select unit status</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="uncompleted">Uncompleted</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div>
          <label className="block text-gray-700 mb-1">Sales Type</label>
          <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm">
            <option value="">Select sales type</option>
            <option value="lease">Lease</option>
            <option value="rent">Rent</option>
            <option value="for-sale">For Sale</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-700 mb-1">Currency</label>
          <input type="text" placeholder="Gh" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-gray-700 mb-1">Price</label>
          <input type="number" placeholder="200,000" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-gray-700 mb-1">Service charge / month</label>
          <input type="number" placeholder="200,000" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 mb-2">Unit Details</h4>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-gray-700 mb-1">Bedroom</label>
            <input type="number" placeholder="1" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Bathroom</label>
            <input type="number" placeholder="1" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Washrooms</label>
            <input type="number" placeholder="1" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Hall</label>
            <input type="number" placeholder="1" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Kitchen</label>
            <input type="number" placeholder="1" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
        </div>
      </div>
      <div>
        <label className="block text-gray-700 mb-1">Additional Unit Details</label>
        <textarea placeholder="There are many variations of passages." className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[60px] text-sm" />
      </div>
    </div>
  )
}

export default UnitDescription

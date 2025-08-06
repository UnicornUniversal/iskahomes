"use client"
import React, { useState } from 'react'
import UnitDescription from './UnitDescription'
import UnitAmenities from './UnitAmenities'
import UnitMedia from './UnitMedia'

const TABS = [
  { label: 'Description', key: 'description' },
  { label: 'Media', key: 'media' },
  { label: 'Amenities', key: 'amenities' },
]

const UnitComponent = ({ mode = 'add' }) => {
  // mode: 'add' | 'edit'
  const [currentTab, setCurrentTab] = useState(0)

  // Placeholder for form state (could be lifted up for real use)
  // const [unitData, setUnitData] = useState({ ... })

  return (
    <div className="bg-white rounded-xl shadow p-6 w-full flex-1">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">
        {mode === 'add' ? 'Add New Unit' : 'Edit Unit'}
      </h2>
      <p className="text-gray-500 mb-6">{mode === 'add' ? 'Fill in the details to add a new unit.' : 'Edit the details of this unit.'}</p>

      {/* Header Navigation */}
      <div className='flex gap-4 w-full mb-6'>
        {TABS.map((tab, idx) => (
          <button
            key={tab.key}
            onClick={() => setCurrentTab(idx)}
            style={{
              padding: '0.5rem 1rem',
              background: idx === currentTab ? '#333' : '#eee',
              color: idx === currentTab ? '#fff' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: idx === currentTab ? 'bold' : 'normal',
            }}
          >
            {idx + 1}. {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className='w-full'>
        {currentTab === 0 && <UnitDescription mode={mode} />}
        {currentTab === 1 && <UnitMedia mode={mode} />}
        {currentTab === 2 && <UnitAmenities mode={mode} />}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <button
          className="px-4 py-2 rounded bg-gray-100 text-gray-700 disabled:opacity-50"
          onClick={() => setCurrentTab((prev) => Math.max(prev - 1, 0))}
          disabled={currentTab === 0}
        >
          Previous
        </button>
        {currentTab < TABS.length - 1 ? (
          <button
            className="px-4 py-2 rounded bg-primary_color text-white"
            onClick={() => setCurrentTab((prev) => Math.min(prev + 1, TABS.length - 1))}
          >
            Next
          </button>
        ) : (
          <button
            className="px-4 py-2 rounded bg-primary_color text-white"
            // onClick={handleSubmit}
          >
            {mode === 'add' ? 'Add Unit' : 'Save Changes'}
          </button>
        )}
      </div>
    </div>
  )
}

export default UnitComponent

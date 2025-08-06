"use client"
import React from 'react'
import { units, developments } from '@/app/components/Data/Data'
import UnitCard from '@/app/components/developers/units/UnitCard'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

const AllUnits = () => {
  const router = useRouter()

  const handleAddUnit = () => {
    router.push('/developer/758594/units/addNewUnit')
  }

  return (
    <div className="w-full p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">All Units</h2>
        <button 
          onClick={handleAddUnit}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add New Unit
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {units.map((unit) => {
          const development = developments.find(d => d.id === unit.developmentId)
          return (
            <UnitCard 
              key={unit.id} 
              unit={unit} 
              development={development}
            />
          )
        })}
      </div>
    </div>
  )
}

export default AllUnits

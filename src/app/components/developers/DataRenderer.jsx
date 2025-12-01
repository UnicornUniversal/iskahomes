'use client'

import React from 'react'

const DataRenderer = ({ title, value, icon: Icon, onClick }) => {
  if (!value && value !== 0) return null

  const content = onClick ? (
    <button
      onClick={onClick}
      className="text-lg hover:underline transition-colors cursor-pointer text-left"
    >
      {value}
    </button>
  ) : (
    <div className="text-lg">{value}</div>
  )

  return (
    <div className="flex items-center gap-3 py-2 border-b border-primary_color/20">
      {Icon && (
        <div className="w-10 h-10 box_holder flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div className="flex-1">
        <div className="text-xs uppercase tracking-wider mb-1">{title}</div>
     <h5 className='text-lg'>    {content}</h5>
      </div>
    </div>
  )
}

export default DataRenderer


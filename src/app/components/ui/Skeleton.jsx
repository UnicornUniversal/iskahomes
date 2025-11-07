"use client"
import React from 'react'

export default function Skeleton({ className = "", rows = 0 }) {
  return (
    <div className={className}>
      {rows > 0 ? (
        <div className="space-y-2">
          {Array.from({ length: rows }).map((_, idx) => (
            <div key={idx} className="animate-pulse bg-gray-200 rounded h-4" />
          ))}
        </div>
      ) : (
        <div className="animate-pulse bg-gray-200 rounded w-full h-full" />
      )}
    </div>
  )
}



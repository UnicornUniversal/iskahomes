import React, { useState, useRef, useEffect } from 'react'

const CustomDropdown = ({ options, value, onChange, placeholder = 'Select an option', className = '' }) => {
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (option) => {
    onChange(option.value)
    setOpen(false)
  }

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ') setOpen(true)
      return
    }
    if (e.key === 'ArrowDown') {
      setHighlighted((prev) => (prev + 1) % options.length)
    } else if (e.key === 'ArrowUp') {
      setHighlighted((prev) => (prev - 1 + options.length) % options.length)
    } else if (e.key === 'Enter') {
      if (highlighted >= 0) handleSelect(options[highlighted])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const selectedLabel = options.find(opt => opt.value === value)?.label

  return (
    <div ref={ref} className={`relative w-full ${className}`} tabIndex={0} onKeyDown={handleKeyDown}>
      <button
        type="button"
        className="w-full bg-white/17 text-primary_color rounded-md px-4 py-[0.65em] shadow-lg text-[0.9em] hover:bg-primary_color/10 hover:border-primary_color outline-none shadow-primary_color/20 font-medium border border-1 border-white duration-500 flex justify-between items-center"
        style={{ lineHeight: '1' }}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span style={{ lineHeight: '1' }}>{selectedLabel || <span className="text-primary_color/60">{placeholder}</span>}</span>
        <svg 
          className={`w-3 h-3 ml-2 transition-transform duration-500 text-primary_color flex-shrink-0 ${open ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          viewBox="0 0 24 24"
          style={{ lineHeight: '1' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <ul className="absolute z-10 mt-1 w-full bg-white/95 backdrop-blur-sm border border-white rounded-md shadow-lg max-h-60 overflow-auto" role="listbox">
          {options.length === 0 && (
            <li className="px-4 py-2 text-primary_color/60">No options</li>
          )}
          {options.map((option, idx) => (
            <li
              key={option.value || idx}
              className={`px-4 py-2 cursor-pointer text-primary_color duration-200 ${
                value === option.value 
                  ? 'bg-primary_color/20 font-medium' 
                  : highlighted === idx 
                    ? 'bg-primary_color/10' 
                    : 'hover:bg-primary_color/5'
              }`}
              onClick={() => handleSelect(option)}
              onMouseEnter={() => setHighlighted(idx)}
              role="option"
              aria-selected={value === option.value}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default CustomDropdown 
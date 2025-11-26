"use client"
import React, { useState, useRef, useEffect } from 'react'
import { FiChevronDown } from 'react-icons/fi'
import { cn } from '@/lib/utils'

const CustomSelect = React.forwardRef(({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  required = false,
  className,
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const selectRef = useRef(null)
  const dropdownRef = useRef(null)
  const optionRefs = useRef([])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false)
        setFocusedIndex(-1)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusedIndex((prev) => {
          const next = prev < options.length - 1 ? prev + 1 : prev
          // Scroll into view
          if (optionRefs.current[next]) {
            optionRefs.current[next].scrollIntoView({ block: 'nearest' })
          }
          return next
        })
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusedIndex((prev) => {
          const next = prev > 0 ? prev - 1 : 0
          // Scroll into view
          if (optionRefs.current[next]) {
            optionRefs.current[next].scrollIntoView({ block: 'nearest' })
          }
          return next
        })
      } else if (e.key === 'Enter' && focusedIndex >= 0) {
        e.preventDefault()
        handleSelect(options[focusedIndex].value)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setIsOpen(false)
        setFocusedIndex(-1)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, focusedIndex, options])

  // Find selected option
  const selectedOption = options.find(opt => opt.value === value)

  const handleSelect = (selectedValue) => {
    if (onChange) {
      onChange({ target: { value: selectedValue } })
    }
    setIsOpen(false)
    setFocusedIndex(-1)
  }

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
      if (!isOpen) {
        // Set focus to selected option or first option
        const currentIndex = options.findIndex(opt => opt.value === value)
        setFocusedIndex(currentIndex >= 0 ? currentIndex : 0)
      }
    }
  }

  // Position dropdown
  useEffect(() => {
    if (isOpen && selectRef.current && dropdownRef.current) {
      const selectRect = selectRef.current.getBoundingClientRect()
      const dropdown = dropdownRef.current
      const dropdownHeight = dropdown.offsetHeight
      const spaceBelow = window.innerHeight - selectRect.bottom
      const spaceAbove = selectRect.top

      // If not enough space below but enough above, open upward
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        dropdown.style.bottom = `${selectRef.current.offsetHeight}px`
        dropdown.style.top = 'auto'
      } else {
        dropdown.style.top = `${selectRef.current.offsetHeight}px`
        dropdown.style.bottom = 'auto'
      }
    }
  }, [isOpen, options])

  return (
    <div className="relative w-full" ref={ref}>
      {/* Select Button */}
      <button
        type="button"
        ref={selectRef}
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          "w-full bg-white/17 text-primary_color rounded-md px-4 py-[0.5em] shadow-lg text-[0.9em] hover:bg-primary_color/10 hover:border-primary_color outline-none shadow-primary_color/20 font-medium border border-1 border-white duration-500 appearance-none cursor-pointer flex items-center justify-between",
          disabled && "opacity-50 cursor-not-allowed",
          isOpen && "border-primary_color border-b-2",
          className
        )}
        {...props}
      >
        <span className={cn(
          "truncate",
          !selectedOption && "text-gray-400"
        )}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <FiChevronDown
          className={cn(
            "w-4 h-4 transition-transform duration-200 flex-shrink-0 ml-2",
            isOpen && "transform rotate-180"
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto"
          style={{
            backgroundColor: 'white',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}
        >
          {options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              No options available
            </div>
          ) : (
            options.map((option, index) => {
              const isSelected = option.value === value
              const isFocused = index === focusedIndex
              
              return (
                <div
                  key={option.value}
                  ref={(el) => (optionRefs.current[index] = el)}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "px-4 py-3 text-sm cursor-pointer transition-colors duration-150",
                    isSelected && "bg-primary_color/10 text-primary_color font-medium",
                    isFocused && !isSelected && "bg-primary_color text-white",
                    !isFocused && !isSelected && "text-primary_color hover:bg-primary_color/5"
                  )}
                >
                  {option.label}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Hidden select for form validation */}
      {required && (
        <select
          value={value}
          onChange={() => {}}
          required
          className="absolute opacity-0 pointer-events-none h-0 w-0"
          tabIndex={-1}
          aria-hidden="true"
        >
          <option value="">{placeholder}</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}
    </div>
  )
})

CustomSelect.displayName = "CustomSelect"

export { CustomSelect }


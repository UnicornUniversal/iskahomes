"use client"
import { useEffect } from 'react'

/**
 * Global component to disable mouse wheel scroll behavior on number inputs
 * This prevents accidental value changes when scrolling over number inputs
 */
export default function DisableNumberInputScroll() {
  useEffect(() => {
    const handleWheel = (e) => {
      const target = e.target
      
      // Check if the target is a number input
      if (target && target.type === 'number') {
        // Prevent the default scroll behavior that changes the value
        e.preventDefault()
        // Stop the event from propagating
        e.stopPropagation()
        return false
      }
    }

    // Add event listener with passive: false to allow preventDefault
    // Use capture phase to catch the event early
    document.addEventListener('wheel', handleWheel, { passive: false, capture: true })
    
    // Also handle when the input is focused and user scrolls
    const handleFocus = (e) => {
      const target = e.target
      if (target && target.type === 'number') {
        // Add wheel listener specifically to this input
        const wheelHandler = (wheelEvent) => {
          wheelEvent.preventDefault()
          wheelEvent.stopPropagation()
          return false
        }
        target.addEventListener('wheel', wheelHandler, { passive: false })
        
        // Clean up when input loses focus
        const handleBlur = () => {
          target.removeEventListener('wheel', wheelHandler)
          target.removeEventListener('blur', handleBlur)
        }
        target.addEventListener('blur', handleBlur)
      }
    }

    document.addEventListener('focusin', handleFocus)

    // Cleanup
    return () => {
      document.removeEventListener('wheel', handleWheel, { capture: true })
      document.removeEventListener('focusin', handleFocus)
    }
  }, [])

  return null
}


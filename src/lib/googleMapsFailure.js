import { useEffect } from 'react'

const googleMapsFailureCallbacks = new Set()

export const subscribeToGoogleMapsFailure = (callback) => {
  googleMapsFailureCallbacks.add(callback)
  return () => googleMapsFailureCallbacks.delete(callback)
}

export const notifyGoogleMapsFailure = () => {
  googleMapsFailureCallbacks.forEach((callback) => callback())
}

export const isGoogleMapsRuntimeErrorMessage = (message) => (
  message.includes('BillingNotEnabledMapError') ||
  message.includes('Google Maps JavaScript API error') ||
  message.includes('ApiNotActivatedMapError') ||
  message.includes('InvalidKeyMapError') ||
  message.includes('RefererNotAllowedMapError')
)

export const hasGoogleMapsDomError = (root) => {
  if (!root) return false

  return !!(
    root.querySelector('.gm-err-container') ||
    root.querySelector('.gm-err-message') ||
    root.textContent?.includes("can't load Google Maps")
  )
}

export const installGoogleMapsFailureDetection = () => {
  if (typeof window === 'undefined' || window.__iskaGoogleMapsFailureDetectionInstalled) return

  window.__iskaGoogleMapsFailureDetectionInstalled = true

  const previousAuthFailure = window.gm_authFailure
  window.gm_authFailure = () => {
    notifyGoogleMapsFailure()
    if (typeof previousAuthFailure === 'function') previousAuthFailure()
  }

  const originalConsoleError = console.error.bind(console)
  console.error = (...args) => {
    const message = args.map((arg) => {
      if (typeof arg === 'string') return arg
      if (arg instanceof Error) return arg.message
      try { return JSON.stringify(arg) } catch { return String(arg) }
    }).join(' ')

    if (isGoogleMapsRuntimeErrorMessage(message)) {
      notifyGoogleMapsFailure()
      return
    }

    originalConsoleError(...args)
  }

  window.addEventListener('error', (event) => {
    if (isGoogleMapsRuntimeErrorMessage(event?.message || '')) {
      notifyGoogleMapsFailure()
    }
  })
}

export const GoogleMapsFailureSync = ({ failed, onFailure }) => {
  useEffect(() => {
    if (failed) onFailure()
  }, [failed, onFailure])

  return null
}

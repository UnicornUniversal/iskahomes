'use client'

import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

/**
 * Global toast container - must be at root so toasts persist when modals/components unmount.
 * Ensures instant visibility and proper dismissibility.
 */
export default function ToastProvider() {
  return (
    <ToastContainer
      position="bottom-center"
      autoClose={4000}
      hideProgressBar={false}
      newestOnTop={true}
      closeOnClick={true}
      closeButton={true}
      rtl={false}
      pauseOnFocusLoss={false}
      draggable={true}
      pauseOnHover={true}
      theme="light"
      style={{ zIndex: 99999 }}
      enableMultiContainer={false}
    />
  )
}

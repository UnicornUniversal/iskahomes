'use client'

import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export const AuthHeader = ({ title, subtitle }) => (
  <div className="mb-6">
    <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-primary_color">{title}</h1>
    <p className="mt-1.5 text-sm text-gray-500">{subtitle}</p>
  </div>
)

export const AuthField = ({ id, label, icon: Icon, className = '', ...inputProps }) => (
  <div>
    <label htmlFor={id} className="block text-xs font-medium text-gray-600 mb-1">
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <Icon
          size={18}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
        />
      )}
      <input
        id={id}
        className={`w-full h-11 ${Icon ? 'pl-11' : 'pl-4'} pr-4 border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-primary_color focus:ring-2 focus:ring-primary_color/20 ${className}`}
        {...inputProps}
      />
    </div>
  </div>
)

export const AuthPasswordField = ({ id, label = 'Password', icon: Icon, ...inputProps }) => {
  const [visible, setVisible] = useState(false)

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-gray-600 mb-1">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
        )}
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className={`w-full h-11 ${Icon ? 'pl-11' : 'pl-4'} pr-11 border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-primary_color focus:ring-2 focus:ring-primary_color/20`}
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  )
}

export const AuthSubmitButton = ({ loading, loadingLabel, children, ...buttonProps }) => (
  <button
    type="submit"
    disabled={loading}
    className="w-full h-11 bg-primary_color text-sm font-semibold text-white transition-all duration-200 hover:bg-primary_color/90 hover:shadow-lg hover:shadow-primary_color/25 focus:outline-none focus:ring-2 focus:ring-primary_color/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-none flex items-center justify-center gap-2"
    {...buttonProps}
  >
    {loading ? (
      <>
        <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
        {loadingLabel}
      </>
    ) : (
      children
    )}
  </button>
)

export const AuthDivider = ({ label = 'OR' }) => (
  <div className="flex items-center gap-4">
    <span className="h-px flex-1 bg-gray-200" />
    <span className="text-xs font-medium uppercase tracking-wider text-gray-400">{label}</span>
    <span className="h-px flex-1 bg-gray-200" />
  </div>
)

export const GoogleButton = ({ children = 'Continue with Google', ...buttonProps }) => (
  <button
    type="button"
    className="w-full h-11 border border-gray-200 bg-white text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary_color/20 flex items-center justify-center gap-3"
    {...buttonProps}
  >
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
    {children}
  </button>
)

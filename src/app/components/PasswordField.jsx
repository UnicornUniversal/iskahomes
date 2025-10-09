import React, { useState } from 'react'

const PasswordField = ({ name, value, onChange, required = true, placeholder = "Enter your password" }) => {
  const [showPassword, setShowPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: '',
    checks: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false
    }
  })

  const checkPasswordStrength = (password) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }

    const score = Object.values(checks).filter(Boolean).length
    let feedback = ''

    if (score === 0) feedback = 'Very Weak'
    else if (score === 1) feedback = 'Weak'
    else if (score === 2) feedback = 'Fair'
    else if (score === 3) feedback = 'Good'
    else if (score === 4) feedback = 'Strong'
    else if (score === 5) feedback = 'Very Strong'

    setPasswordStrength({
      score,
      feedback,
      checks
    })
  }

  const handleChange = (e) => {
    const { value } = e.target
    onChange(e)
    checkPasswordStrength(value)
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          name={name}
          value={value}
          onChange={handleChange}
          required={required}
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
          {showPassword ? (
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
      
      {/* Password Strength Indicator */}
      {value && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">Password Strength:</span>
            <span className={`text-xs font-medium ${
              passwordStrength.score <= 2 ? 'text-red-500' :
              passwordStrength.score === 3 ? 'text-yellow-500' :
              'text-green-500'
            }`}>
              {passwordStrength.feedback}
            </span>
          </div>
          
          {/* Strength Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                passwordStrength.score <= 2 ? 'bg-red-500' :
                passwordStrength.score === 3 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
            ></div>
          </div>
          
          {/* Password Requirements */}
          <div className="mt-2 space-y-1">
            <div className={`flex items-center text-xs ${
              passwordStrength.checks.length ? 'text-green-600' : 'text-gray-500'
            }`}>
              <svg className={`w-3 h-3 mr-1 ${passwordStrength.checks.length ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              At least 8 characters
            </div>
            <div className={`flex items-center text-xs ${
              passwordStrength.checks.uppercase ? 'text-green-600' : 'text-gray-500'
            }`}>
              <svg className={`w-3 h-3 mr-1 ${passwordStrength.checks.uppercase ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              One uppercase letter
            </div>
            <div className={`flex items-center text-xs ${
              passwordStrength.checks.lowercase ? 'text-green-600' : 'text-gray-500'
            }`}>
              <svg className={`w-3 h-3 mr-1 ${passwordStrength.checks.lowercase ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              One lowercase letter
            </div>
            <div className={`flex items-center text-xs ${
              passwordStrength.checks.number ? 'text-green-600' : 'text-gray-500'
            }`}>
              <svg className={`w-3 h-3 mr-1 ${passwordStrength.checks.number ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              One number
            </div>
            <div className={`flex items-center text-xs ${
              passwordStrength.checks.special ? 'text-green-600' : 'text-gray-500'
            }`}>
              <svg className={`w-3 h-3 mr-1 ${passwordStrength.checks.special ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              One special character
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PasswordField

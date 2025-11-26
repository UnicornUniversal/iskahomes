import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Formats large numbers into readable format
 * Examples: 200000 -> "200k", 23000000 -> "23 Mil", 1500000000 -> "1.5 Bil"
 * @param {number} num - The number to format
 * @returns {string} - Formatted number string
 */
export function formatCompactNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '0'
  
  const number = parseFloat(num)
  if (number === 0) return '0'
  
  const absNum = Math.abs(number)
  const sign = number < 0 ? '-' : ''
  
  if (absNum >= 1000000000) {
    // Billions
    const billions = absNum / 1000000000
    return `${sign}${billions % 1 === 0 ? billions : billions.toFixed(1)} Bil`
  } else if (absNum >= 1000000) {
    // Millions
    const millions = absNum / 1000000
    return `${sign}${millions % 1 === 0 ? millions : millions.toFixed(1)} Mil`
  } else if (absNum >= 1000) {
    // Thousands
    const thousands = absNum / 1000
    return `${sign}${thousands % 1 === 0 ? thousands : thousands.toFixed(1)}k`
  } else {
    // Less than 1000, return with commas
    return `${sign}${absNum.toLocaleString('en-US')}`
  }
}

/**
 * Formats currency values with compact number formatting for large amounts
 * Examples: GHS 200000 -> "GHS 200k", USD 23000000 -> "USD 23 Mil"
 * @param {number} amount - The amount to format
 * @param {string} currencyCode - The currency code (e.g., 'GHS', 'USD')
 * @returns {string} - Formatted currency string
 */
export function formatCurrency(amount, currencyCode = 'USD') {
  if (amount === null || amount === undefined || amount === 0) return `${currencyCode} 0`
  
  const number = parseFloat(amount)
  if (isNaN(number)) return `${currencyCode} 0`
  
  // Use compact formatting for amounts >= 1000
  if (Math.abs(number) >= 1000) {
    return `${currencyCode} ${formatCompactNumber(number)}`
  } else {
    // For amounts less than 1000, use regular formatting with commas
    return `${currencyCode} ${number.toLocaleString('en-US')}`
  }
} 
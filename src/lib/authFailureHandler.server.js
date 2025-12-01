/**
 * Server-side auth failure handler for API routes
 * This file should only be imported in API routes (server-side)
 */

import { NextResponse } from 'next/server';

/**
 * Server-side auth failure handler for API routes
 * Returns a NextResponse with 401 status and auth failure flag
 * Use this in Next.js API routes when token verification fails
 * 
 * @param {string} message - Error message to return
 * @returns {NextResponse} Response with 401 status and auth_failed flag
 */
export const createAuthFailureResponse = (message = 'Authentication failed') => {
  return NextResponse.json(
    { 
      error: message,
      auth_failed: true // Flag to indicate auth failure - client will handle logout
    },
    { status: 401 }
  );
};

/**
 * Helper function to verify token and return auth failure response if invalid
 * Use this in API routes to standardize auth checking
 * 
 * @param {string} token - JWT token to verify
 * @returns {Object} Object with valid flag, decoded token (if valid), or response (if invalid)
 */
export const verifyAuthToken = (token) => {
  if (!token) {
    return {
      valid: false,
      response: createAuthFailureResponse('Authorization token required')
    };
  }

  const { verifyToken } = require('@/lib/jwt');
  const decoded = verifyToken(token);

  if (!decoded) {
    return {
      valid: false,
      response: createAuthFailureResponse('Invalid or expired token')
    };
  }

  return {
    valid: true,
    decoded
  };
};


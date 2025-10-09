'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import { verifyToken } from '@/lib/jwt';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [developerToken, setDeveloperToken] = useState('');

  const loadUser = async () => {
    console.log('🚀 loadUser function called');
    try {
      const token = localStorage.getItem('developer_token');
      
      console.log('loadUser - Retrieved from localStorage:', {
        token: token ? 'exists' : 'missing',
        tokenLength: token ? token.length : 0,
        tokenValue: token ? token.substring(0, 50) + '...' : 'null'
      });
      
      if (token) {
        // Verify token is still valid
        const decoded = verifyToken(token);
        
        console.log('loadUser debug:', {
          token: token ? 'exists' : 'missing',
          token_preview: token ? token.substring(0, 50) + '...' : 'null',
          decoded: decoded ? {
            id: decoded.id,
            developer_id: decoded.developer_id,
            email: decoded.email,
            user_type: decoded.user_type
          } : null
        });

        console.log('🔍 Decoded token details:', {
          id: decoded?.id,
          developer_id: decoded?.developer_id,
          email: decoded?.email,
          user_type: decoded?.user_type
        });
        
        if (decoded && decoded.developer_id) {
          setDeveloperToken(token);
          
          // Get developer_id from decoded token
          const developerId = decoded.developer_id;
          
          // Fetch user data directly from Supabase using developer_id from token
          console.log('Fetching developer data from Supabase for developer_id:', developerId);
          
          const { data: userData, error } = await supabase
            .from('developers')
            .select('*')
            .eq('developer_id', developerId)
            .single();

          console.log('🔍 Supabase query result:', {
            userData: userData ? 'found' : 'not found',
            error: error ? error.message : 'none',
            developerId: developerId
          });

          if (error) {
            console.error('🚨 Supabase query failed:', error);
            
            // Only clear localStorage if it's a permission issue (token invalid)
            if (error.code === 'PGRST301' || error.message.includes('permission')) {
              console.log('Permission denied - clearing localStorage due to invalid token');
              localStorage.removeItem('developer_token');
              setDeveloperToken('');
            } else {
              console.log('Database error - keeping token, user can retry');
              // Don't clear localStorage for database errors
            }
          } else if (userData) {
            console.log('Developer data fetched successfully:', userData);
            
            // Structure the user data to match expected format
            setUser({
              id: userData.developer_id,
              email: userData.email,
              user_type: 'developer',
              profile: {
                id: userData.id,
                developer_id: userData.developer_id,
                name: userData.name,
                slug: userData.slug,
                account_status: userData.account_status,
                company_name: userData.name
              }
            });
          } else {
            console.log('No developer found with developer_id:', developerId);
            // Developer doesn't exist - clear token
            localStorage.removeItem('developer_token');
            setDeveloperToken('');
          }
        } else {
          // Token verification failed - clear storage
          console.error('🚨 Token verification failed, clearing localStorage');
          console.error('Decoded token:', decoded);
          console.error('Token exists:', !!token);
          
          localStorage.removeItem('developer_token');
          setDeveloperToken('');
        }
      }
    } catch (error) {
      console.error('🚨 Error loading user:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Only clear localStorage if it's a token verification error
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        console.log('Token verification error - clearing localStorage');
        localStorage.removeItem('developer_token');
        setDeveloperToken('');
      } else {
        console.log('Network or other error - keeping token, user can retry');
        // Don't clear localStorage for network errors
      }
    } finally {
      console.log('🏁 loadUser finally block - setting loading to false');
      setLoading(false);
    }
  };

  // Load user from token on mount
  useEffect(() => {
    console.log('AuthContext: useEffect triggered, calling loadUser()');
    
    // Check if there's a token in localStorage first
    const token = localStorage.getItem('developer_token');
    console.log('Initial token check:', {
      tokenExists: !!token,
      tokenValue: token ? token.substring(0, 50) + '...' : 'null'
    });
    
    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.user && data.user.user_type === 'developer' && data.token) {
          // Store only token
          localStorage.setItem('developer_token', data.token);
          
          console.log('Stored in localStorage:', {
            developer_token: data.token ? 'Yes' : 'No',
            token_preview: data.token ? data.token.substring(0, 50) + '...' : 'null',
            user_id: data.user.id,
            profile_id: data.user.profile?.id
          });
          
          setDeveloperToken(data.token);
          setUser(data.user);
          
          console.log('User set in context:', data.user);
          
          return { success: true, user: data.user };
        } else if (data.user && data.user.user_type === 'developer' && !data.token) {
          return { success: false, error: 'Developer profile not found. Please contact support.' };
        } else {
          return { success: false, error: 'Invalid user type' };
        }
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const logout = () => {
    localStorage.removeItem('developer_token');
    setDeveloperToken('');
    setUser(null);
  };

  const value = {
    user,
    loading,
    developerToken,
    login,
    logout,
    isAuthenticated: !!user && !!developerToken,
  };
  
  // Debug context value
  console.log('AuthContext value:', {
    user: user ? 'exists' : 'null',
    loading,
    developerToken: developerToken ? 'exists' : 'empty',
    isAuthenticated: !!user && !!developerToken
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

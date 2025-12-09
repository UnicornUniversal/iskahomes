'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import { verifyToken } from '@/lib/jwt';
import { supabase } from '@/lib/supabase';
import posthog from 'posthog-js';
import { handleAuthFailure } from '@/lib/authFailureHandler';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper function to enrich developer stats with category names
const enrichDeveloperStats = async (developerData) => {
  try {
    const enrichedData = { ...developerData };
    
    // Enrich property_purposes_stats
    if (developerData.property_purposes_stats && Array.isArray(developerData.property_purposes_stats) && developerData.property_purposes_stats.length > 0) {
      const purposeIds = developerData.property_purposes_stats.map(stat => stat.category_id);
      const { data: purposes } = await supabase
        .from('property_purposes')
        .select('id, name')
        .in('id', purposeIds);
      
      if (purposes) {
        // Create lookup map for O(1) access
        const purposeMap = {};
        purposes.forEach(purpose => {
          purposeMap[purpose.id] = purpose.name;
        });
        
        enrichedData.property_purposes_stats = developerData.property_purposes_stats.map(stat => ({
          ...stat,
          name: purposeMap[stat.category_id] || 'Unknown Purpose'
        }));
      }
    }
    
    // Enrich property_categories_stats
    if (developerData.property_categories_stats && Array.isArray(developerData.property_categories_stats) && developerData.property_categories_stats.length > 0) {
      const categoryIds = developerData.property_categories_stats.map(stat => stat.category_id);
      const { data: categories } = await supabase
        .from('property_categories')
        .select('id, name')
        .in('id', categoryIds);
      
      if (categories) {
        // Create lookup map for O(1) access
        const categoryMap = {};
        categories.forEach(category => {
          categoryMap[category.id] = category.name;
        });
        
        enrichedData.property_categories_stats = developerData.property_categories_stats.map(stat => ({
          ...stat,
          name: categoryMap[stat.category_id] || 'Unknown Category'
        }));
      }
    }
    
    // Enrich property_types_stats
    if (developerData.property_types_stats && Array.isArray(developerData.property_types_stats) && developerData.property_types_stats.length > 0) {
      const typeIds = developerData.property_types_stats.map(stat => stat.category_id);
      const { data: types } = await supabase
        .from('property_types')
        .select('id, name')
        .in('id', typeIds);
      
      if (types) {
        // Create lookup map for O(1) access
        const typeMap = {};
        types.forEach(type => {
          typeMap[type.id] = type.name;
        });
        
        enrichedData.property_types_stats = developerData.property_types_stats.map(stat => ({
          ...stat,
          name: typeMap[stat.category_id] || 'Unknown Type'
        }));
      }
    }
    
    // Enrich property_subtypes_stats
    if (developerData.property_subtypes_stats && Array.isArray(developerData.property_subtypes_stats) && developerData.property_subtypes_stats.length > 0) {
      const subtypeIds = developerData.property_subtypes_stats.map(stat => stat.category_id);
      const { data: subtypes } = await supabase
        .from('property_subtypes')
        .select('id, name')
        .in('id', subtypeIds);
      
      if (subtypes) {
        // Create lookup map for O(1) access
        const subtypeMap = {};
        subtypes.forEach(subtype => {
          subtypeMap[subtype.id] = subtype.name;
        });
        
        enrichedData.property_subtypes_stats = developerData.property_subtypes_stats.map(stat => ({
          ...stat,
          name: subtypeMap[stat.category_id] || 'Unknown Subtype'
        }));
      }
    }
    
    return enrichedData;
  } catch (error) {
    console.error('Error enriching developer stats:', error);
    // Return original data if enrichment fails
    return developerData;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [developerToken, setDeveloperToken] = useState('');
  const [propertySeekerToken, setPropertySeekerToken] = useState('');

  const loadUser = async () => {
    try {
      // Check for all possible token types
      const developerTokenValue = localStorage.getItem('developer_token');
      const propertySeekerTokenValue = localStorage.getItem('property_seeker_token');
      const agentTokenValue = localStorage.getItem('agent_token');
      const adminTokenValue = localStorage.getItem('admin_token');
      
      // Also check for generic 'token' key and migrate it if found
      const genericToken = localStorage.getItem('token');
      if (genericToken && !developerTokenValue && !propertySeekerTokenValue && !agentTokenValue && !adminTokenValue) {
        console.warn('Found generic "token" key, attempting to migrate...');
        // Try to decode and determine type
        const decoded = verifyToken(genericToken);
        if (decoded) {
          if (decoded.developer_id) {
            localStorage.setItem('developer_token', genericToken);
            localStorage.removeItem('token');
          } else if (decoded.user_type === 'property_seeker') {
            localStorage.setItem('property_seeker_token', genericToken);
            localStorage.removeItem('token');
          } else if (decoded.user_type === 'agent') {
            localStorage.setItem('agent_token', genericToken);
            localStorage.removeItem('token');
          } else if (decoded.user_type === 'admin') {
            localStorage.setItem('admin_token', genericToken);
            localStorage.removeItem('token');
          } else {
            // Unknown token type, remove it
            localStorage.removeItem('token');
          }
        } else {
          // Invalid token, remove it
          localStorage.removeItem('token');
        }
        // Reload after migration
        window.location.reload();
        return;
      }
      
      if (developerTokenValue) {
        // Verify developer token
        const decoded = verifyToken(developerTokenValue);
        
        if (decoded && decoded.developer_id) {
          setDeveloperToken(developerTokenValue);
          
          const developerId = decoded.developer_id;
          
          const { data: userData, error } = await supabase
            .from('developers')
            .select('*')
            .eq('developer_id', developerId)
            .single();

          if (error) {
            // Auth failure - logout and redirect
            console.error('Auth failure - Developer profile fetch error:', error);
              localStorage.removeItem('developer_token');
              setDeveloperToken('');
            setUser(null);
            // Handle auth failure (logout, clear storage, redirect)
            if (typeof window !== 'undefined') {
              handleAuthFailure('/signin');
            }
            return;
          } else if (userData) {
            // Enrich stats with category names
            const enrichedProfile = await enrichDeveloperStats(userData);
            
            setUser({
              id: userData.developer_id,
              email: userData.email,
              user_type: 'developer',
              profile: enrichedProfile // Store enriched developer profile
            });
          } else {
            // No user data found - auth failure
            console.error('Auth failure - Developer profile not found');
            localStorage.removeItem('developer_token');
            setDeveloperToken('');
            setUser(null);
            if (typeof window !== 'undefined') {
              if (handleAuthFailure) {
                handleAuthFailure('/signin');
              } else {
                window.location.href = '/signin';
              }
            }
            return;
          }
        } else {
          // Invalid token - auth failure
          console.error('Auth failure - Invalid developer token');
          localStorage.removeItem('developer_token');
          setDeveloperToken('');
          setUser(null);
          if (handleAuthFailure) {
            handleAuthFailure('/signin');
          } else {
            window.location.href = '/signin';
          }
          return;
        }
      } else if (propertySeekerTokenValue) {
        // Verify property seeker token
        const decoded = verifyToken(propertySeekerTokenValue);
        
        if (decoded && decoded.id) {
          setPropertySeekerToken(propertySeekerTokenValue);
          
          const seekerId = decoded.id;
          
          const { data: userData, error } = await supabase
            .from('property_seekers')
            .select('*')
            .eq('id', seekerId)
            .single();

          if (error) {
            // Auth failure - logout and redirect
            console.error('Auth failure - Property seeker profile fetch error:', error);
              localStorage.removeItem('property_seeker_token');
              setPropertySeekerToken('');
            setUser(null);
            // Handle auth failure (logout, clear storage, redirect)
            if (typeof window !== 'undefined') {
              handleAuthFailure('/signin');
            }
            return;
          } else if (userData) {
            console.log('🔍 Property Seeker Auth - User data:', userData)
            console.log('🔍 Property Seeker Auth - Token:', propertySeekerTokenValue)
            setUser({
              id: userData.id,
              email: userData.email,
              user_type: 'property_seeker',
              profile: {
                id: userData.id,
                user_id: userData.user_id,
                name: userData.name,
                slug: userData.slug,
                status: userData.status
              }
            });
          } else {
            // No user data found - auth failure
            console.error('Auth failure - Property seeker profile not found');
            localStorage.removeItem('property_seeker_token');
            setPropertySeekerToken('');
            setUser(null);
            if (typeof window !== 'undefined') {
              if (handleAuthFailure) {
                handleAuthFailure('/signin');
              } else {
                window.location.href = '/signin';
              }
            }
            return;
          }
        } else {
          // Invalid token - auth failure
          console.error('Auth failure - Invalid property seeker token');
          localStorage.removeItem('property_seeker_token');
          setPropertySeekerToken('');
          setUser(null);
          if (handleAuthFailure) {
            handleAuthFailure('/signin');
          } else {
            window.location.href = '/signin';
          }
          return;
        }
      } else {
        // No token found at all - user is not authenticated
        console.log('No authentication token found');
        setUser(null);
        setDeveloperToken('');
        setPropertySeekerToken('');
        
        // Check if we're on a protected route
        if (typeof window !== 'undefined') {
          const path = window.location.pathname;
          const protectedRoutes = ['/developer/', '/agents/', '/admin/', '/propertySeeker/', '/homeowner/', '/homeSeeker/'];
          const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
          const isPublicRoute = path === '/signin' || path === '/signup' || path === '/' || path.startsWith('/property/');
          
          // Only redirect if on a protected route (don't redirect from public pages)
          if (isProtectedRoute && !isPublicRoute) {
            console.log('No token found on protected route, redirecting to signin');
            handleAuthFailure('/signin');
            return;
          }
        }
      }
    } catch (error) {
      console.error('Auth failure - Error loading user:', error);
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        // Token error - clear everything and logout
        localStorage.removeItem('developer_token');
        localStorage.removeItem('property_seeker_token');
        setDeveloperToken('');
        setPropertySeekerToken('');
        setUser(null);
        if (handleAuthFailure) {
          handleAuthFailure('/signin');
        } else {
          window.location.href = '/signin';
        }
      } else {
        // Other errors - also logout for security
        localStorage.removeItem('developer_token');
        localStorage.removeItem('property_seeker_token');
        setDeveloperToken('');
        setPropertySeekerToken('');
        setUser(null);
        if (handleAuthFailure) {
          handleAuthFailure('/signin');
        } else {
          window.location.href = '/signin';
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Load user from token on mount
  useEffect(() => {
    
    // Check if there's a token in localStorage first
    const token = localStorage.getItem('developer_token');
    
    loadUser();
  }, []);

  const login = async (email, password, userType = null) => {
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, user_type: userType }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.user && data.token) {
          // Clear any old tokens first
          localStorage.removeItem('token'); // Remove generic token if exists
          localStorage.removeItem('developer_token');
          localStorage.removeItem('property_seeker_token');
          localStorage.removeItem('agent_token');
          localStorage.removeItem('admin_token');
          
          // Handle different user types
          if (data.user.user_type === 'developer') {
            // Store developer token
            localStorage.setItem('developer_token', data.token);
            setDeveloperToken(data.token);
            setUser(data.user);
            
            // Track login with PostHog
            posthog.identify(data.user.id, {
              email: data.user.email,
              user_type: data.user.user_type,
              name: data.user.profile?.name,
              developer_id: data.user.profile?.developer_id
            });
            
            posthog.capture('user_logged_in', {
              user_type: data.user.user_type,
              login_method: 'email'
            });
            
            return { success: true, user: data.user };
          } else if (data.user.user_type === 'property_seeker') {
            // Store property seeker token
            console.log('🔍 Property Seeker Login - Storing token:', data.token)
            console.log('🔍 Property Seeker Login - User data:', data.user)
            localStorage.setItem('property_seeker_token', data.token);
            setPropertySeekerToken(data.token);
            setUser(data.user);
            
            // Track login with PostHog
            posthog.identify(data.user.id, {
              email: data.user.email,
              user_type: data.user.user_type,
              name: data.user.profile?.name
            });
            
            posthog.capture('user_logged_in', {
              user_type: data.user.user_type,
              login_method: 'email'
            });
            
            return { success: true, user: data.user };
          } else if (data.user.user_type === 'agent') {
            // Store agent token
            localStorage.setItem('agent_token', data.token);
            setUser(data.user);
            
            posthog.identify(data.user.id, {
              email: data.user.email,
              user_type: data.user.user_type,
              name: data.user.profile?.name
            });
            
            posthog.capture('user_logged_in', {
              user_type: data.user.user_type,
              login_method: 'email'
            });
            
            return { success: true, user: data.user };
          } else if (data.user.user_type === 'admin') {
            // Store admin token
            localStorage.setItem('admin_token', data.token);
            setUser(data.user);
            
            posthog.identify(data.user.id, {
              email: data.user.email,
              user_type: data.user.user_type
            });
            
            posthog.capture('user_logged_in', {
              user_type: data.user.user_type,
              login_method: 'email'
            });
            
            return { success: true, user: data.user };
          } else {
            return { success: false, error: 'Invalid user type' };
          }
        } else {
          // No token returned - login failed
          console.error('Login failed: No token in response');
          return { success: false, error: 'Login failed: No authentication token received. Please try again.' };
        }
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = async () => {
    try {
      // Track logout
      posthog.capture('user_logged_out');
      posthog.reset();
      
      // Call server-side logout API to handle any server-side cleanup
      try {
        const currentToken = developerToken || propertySeekerToken;
        await fetch('/api/auth/signout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(currentToken && { 'Authorization': `Bearer ${currentToken}` })
          },
          body: JSON.stringify({
            token: currentToken
          })
        });
      } catch (apiError) {
        console.warn('Logout API call failed, continuing with client-side logout:', apiError);
        // Continue with client-side logout even if API fails
      }
      
      // Clear client-side tokens and state
      localStorage.removeItem('token'); // Remove generic token if exists
      localStorage.removeItem('developer_token');
      localStorage.removeItem('property_seeker_token');
      localStorage.removeItem('agent_token');
      localStorage.removeItem('admin_token');
      localStorage.removeItem('homeowner_token');
      localStorage.removeItem('homeseeker_token');
      setDeveloperToken('');
      setPropertySeekerToken('');
      setUser(null);
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      
      // Even if there's an error, clear local state to prevent stuck sessions
      localStorage.removeItem('token'); // Remove generic token if exists
      localStorage.removeItem('developer_token');
      localStorage.removeItem('property_seeker_token');
      localStorage.removeItem('agent_token');
      localStorage.removeItem('admin_token');
      localStorage.removeItem('homeowner_token');
      localStorage.removeItem('homeseeker_token');
      setDeveloperToken('');
      setPropertySeekerToken('');
      setUser(null);
      
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    loading,
    developerToken,
    propertySeekerToken,
    login,
    logout,
    isAuthenticated: !!user && (!!developerToken || !!propertySeekerToken),
  };
  

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

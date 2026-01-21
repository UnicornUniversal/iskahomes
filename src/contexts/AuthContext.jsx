'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import { verifyToken } from '@/lib/jwt';
import { supabase } from '@/lib/supabase';
import posthog from 'posthog-js';
import { handleAuthFailure } from '@/lib/authFailureHandler';
import { clearAnonymousId } from '@/lib/anonymousId';

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
  const [agencyToken, setAgencyToken] = useState('');
  const [agentToken, setAgentToken] = useState('');
  const [propertySeekerToken, setPropertySeekerToken] = useState('');

  // Helper function to fetch subscription data for a user
  const fetchUserSubscription = async (userId, userType) => {
    try {
      // Map user_type to database format
      const dbUserType = userType === 'developer' ? 'developer' : 
                        userType === 'agent' ? 'agent' : 
                        userType === 'agency' ? 'agency' : null

      if (!dbUserType) {
        return null
      }

      // Fetch active subscription with package details
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          subscriptions_package:package_id (
            id,
            name,
            description,
            features,
            local_currency_price,
            international_currency_price,
            duration,
            span,
            display_text,
            ideal_duration,
            user_type,
            is_active
          )
        `)
        .eq('user_id', userId)
        .eq('user_type', dbUserType)
        .in('status', ['pending', 'active', 'grace_period'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error('Error fetching subscription:', error)
        return null
      }

      return subscription
    } catch (error) {
      console.error('Error in fetchUserSubscription:', error)
      return null
    }
  }

  const loadUser = async () => {
    try {
      // Check for all possible token types
      const developerTokenValue = localStorage.getItem('developer_token');
      const agencyTokenValue = localStorage.getItem('agency_token');
      const propertySeekerTokenValue = localStorage.getItem('property_seeker_token');
      const agentTokenValue = localStorage.getItem('agent_token');
      const adminTokenValue = localStorage.getItem('admin_token');
      
      // Also check for generic 'token' key and migrate it if found
      const genericToken = localStorage.getItem('token');
      if (genericToken && !developerTokenValue && !agencyTokenValue && !propertySeekerTokenValue && !agentTokenValue && !adminTokenValue) {
        console.warn('Found generic "token" key, attempting to migrate...');
        // Try to decode and determine type
        const decoded = verifyToken(genericToken);
        if (decoded) {
          if (decoded.developer_id) {
            localStorage.setItem('developer_token', genericToken);
            localStorage.removeItem('token');
          } else if (decoded.agency_id) {
            localStorage.setItem('agency_token', genericToken);
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
        
        console.log('🔐 AUTH CONTEXT: Decoded token:', {
          hasDecoded: !!decoded,
          user_type: decoded?.user_type,
          hasDeveloperId: !!decoded?.developer_id,
          hasTeamMemberId: !!decoded?.team_member_id,
          organization_type: decoded?.organization_type
        });
        
        // Check if this is a team member token first (BEFORE checking developer_id)
        if (decoded && decoded.user_type === 'team_member' && decoded.team_member_id) {
          console.log('🔐 AUTH CONTEXT: Loading team member from developer_token');
          setDeveloperToken(developerTokenValue);
          
          // Load team member from organization_team_members
          const { data: teamMember, error: teamError } = await supabase
            .from('organization_team_members')
            .select(`
              *,
              role:organization_roles(id, name, description, is_system_role)
            `)
            .eq('id', decoded.team_member_id)
            .eq('status', 'active')
            .maybeSingle();
          
          if (teamError) {
            console.error('🔐 AUTH CONTEXT: Error loading team member:', teamError);
            // Don't clear token on database error, might be temporary
            setLoading(false);
            return;
          }
          
          if (!teamMember) {
            console.error('🔐 AUTH CONTEXT: Team member not found in database');
            localStorage.removeItem('developer_token');
            setDeveloperToken('');
            setUser(null);
            if (typeof window !== 'undefined') {
              handleAuthFailure('/home/signin');
            }
            return;
          }
          
          // Get organization details and developer_id
          let organizationSlug = null;
          let organizationName = null;
          let developerId = null;
          
          if (teamMember.organization_type === 'developer') {
            const { data: devOrg } = await supabase
              .from('developers')
              .select('slug, name, developer_id')
              .eq('id', teamMember.organization_id)
              .single();
            organizationSlug = devOrg?.slug;
            organizationName = devOrg?.name;
            developerId = devOrg?.developer_id; // Add developer_id for easy access
          } else if (teamMember.organization_type === 'agency') {
            const { data: agencyOrg } = await supabase
              .from('agencies')
              .select('slug, name, agency_id')
              .eq('agency_id', teamMember.organization_id)
              .single();
            organizationSlug = agencyOrg?.slug;
            organizationName = agencyOrg?.name;
          }
          
          const userData = {
            id: decoded.user_id,
            email: teamMember.email,
            user_type: 'team_member',
            profile: {
              id: teamMember.id,
              team_member_id: teamMember.id,
              organization_type: teamMember.organization_type,
              organization_id: teamMember.organization_id,
              organization_slug: organizationSlug,
              organization_name: organizationName,
              developer_id: developerId, // Add developer_id so components can use it directly
              role_id: teamMember.role_id,
              role_name: teamMember.role?.name,
              permissions: teamMember.permissions,
              email: teamMember.email,
              first_name: teamMember.first_name,
              last_name: teamMember.last_name
            }
          };
          setUser(userData);
          console.log('🔐 AUTH CONTEXT: Team member loaded successfully from developer_token');
          return;
        } else if (decoded && decoded.developer_id) {
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
              handleAuthFailure('/home/signin');
            }
            return;
          } else if (userData) {
            // CRITICAL: Check if developer is in organization_team_members (for permissions)
            // Even owners need to be in organization_team_members to have permissions loaded
            const { data: teamMember, error: teamError } = await supabase
              .from('organization_team_members')
              .select(`
                *,
                role:organization_roles(id, name, description, is_system_role)
              `)
              .eq('organization_type', 'developer')
              .eq('organization_id', userData.id)
              .eq('user_id', developerId)
              .eq('status', 'active')
              .maybeSingle()
            
            // Enrich stats with category names
            const enrichedProfile = await enrichDeveloperStats(userData);
            
            // Add permissions from organization_team_members if found
            if (teamMember && teamMember.permissions) {
              enrichedProfile.permissions = teamMember.permissions
              enrichedProfile.role_id = teamMember.role_id
              enrichedProfile.role_name = teamMember.role?.name
              enrichedProfile.team_member_id = teamMember.id
            } else {
              // Legacy user or not set up - set all permissions to true (Super Admin)
              console.warn('Developer not found in organization_team_members, using full permissions')
              enrichedProfile.permissions = null // null means all permissions (Super Admin)
            }
            
            // Fetch subscription data
            const subscription = await fetchUserSubscription(developerId, 'developer');
            
            setUser({
              id: userData.developer_id,
              email: userData.email,
              user_type: 'developer',
              profile: enrichedProfile, // Store enriched developer profile with permissions
              subscription: subscription || null // Add subscription data
            });
          } else {
            // No user data found - auth failure
            console.error('Auth failure - Developer profile not found');
            localStorage.removeItem('developer_token');
            setDeveloperToken('');
            setUser(null);
            if (typeof window !== 'undefined') {
              if (handleAuthFailure) {
                handleAuthFailure('/home/signin');
              } else {
                window.location.href = '/home/signin';
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
            handleAuthFailure('/home/signin');
          } else {
            window.location.href = '/home/signin';
          }
          return;
        }
      } else if (agencyTokenValue) {
        // Verify agency token
        const decoded = verifyToken(agencyTokenValue);
        
        console.log('🔐 AUTH CONTEXT: Decoded agency token:', {
          hasDecoded: !!decoded,
          user_type: decoded?.user_type,
          hasAgencyId: !!decoded?.agency_id,
          hasTeamMemberId: !!decoded?.team_member_id,
          organization_type: decoded?.organization_type
        });
        
        // Check if this is a team member token first
        if (decoded && decoded.user_type === 'team_member' && decoded.team_member_id) {
          console.log('🔐 AUTH CONTEXT: Loading team member from agency token');
          setAgencyToken(agencyTokenValue);
          
          // Load team member from organization_team_members
          const { data: teamMember, error: teamError } = await supabase
            .from('organization_team_members')
            .select(`
              *,
              role:organization_roles(id, name, description, is_system_role)
            `)
            .eq('id', decoded.team_member_id)
            .eq('status', 'active')
            .maybeSingle();
          
          if (teamError) {
            console.error('🔐 AUTH CONTEXT: Error loading team member:', teamError);
            // Don't clear token on database error, might be temporary
            setLoading(false);
            return;
          }
          
          if (!teamMember) {
            console.error('🔐 AUTH CONTEXT: Team member not found in database');
            localStorage.removeItem('agency_token');
            setAgencyToken('');
            setUser(null);
            if (typeof window !== 'undefined') {
              handleAuthFailure('/home/signin');
            }
            return;
          }
          
          // Get organization details and developer_id
          let organizationSlug = null;
          let organizationName = null;
          let developerId = null;
          
          if (teamMember.organization_type === 'developer') {
            const { data: devOrg } = await supabase
              .from('developers')
              .select('slug, name, developer_id')
              .eq('id', teamMember.organization_id)
              .single();
            organizationSlug = devOrg?.slug;
            organizationName = devOrg?.name;
            developerId = devOrg?.developer_id; // Add developer_id for easy access
          } else if (teamMember.organization_type === 'agency') {
            const { data: agencyOrg } = await supabase
              .from('agencies')
              .select('slug, name, agency_id')
              .eq('agency_id', teamMember.organization_id)
              .single();
            organizationSlug = agencyOrg?.slug;
            organizationName = agencyOrg?.name;
          }
          
          setUser({
            id: decoded.user_id,
            email: teamMember.email,
            user_type: 'team_member',
            profile: {
              id: teamMember.id,
              team_member_id: teamMember.id,
              organization_type: teamMember.organization_type,
              organization_id: teamMember.organization_id,
              organization_slug: organizationSlug,
              organization_name: organizationName,
              developer_id: developerId, // Add developer_id so components can use it directly
              role_id: teamMember.role_id,
              role_name: teamMember.role?.name,
              permissions: teamMember.permissions,
              email: teamMember.email,
              first_name: teamMember.first_name,
              last_name: teamMember.last_name
            }
          });
          console.log('🔐 AUTH CONTEXT: Team member loaded successfully from agency_token');
          return;
        } else if (decoded && decoded.agency_id) {
          setAgencyToken(agencyTokenValue);
          
          const agencyId = decoded.agency_id;
          
          const { data: userData, error } = await supabase
            .from('agencies')
            .select('*')
            .eq('agency_id', agencyId)
            .single();

          if (error) {
            // Auth failure - logout and redirect
            console.error('Auth failure - Agency profile fetch error:', error);
            localStorage.removeItem('agency_token');
            setAgencyToken('');
            setUser(null);
            // Handle auth failure (logout, clear storage, redirect)
            if (typeof window !== 'undefined') {
              handleAuthFailure('/home/signin');
            }
            return;
          } else if (userData) {
            // CRITICAL: Check if agency is in organization_team_members (for permissions)
            // Even owners need to be in organization_team_members to have permissions loaded
            const { data: teamMember, error: teamError } = await supabase
              .from('organization_team_members')
              .select(`
                *,
                role:organization_roles(id, name, description, is_system_role)
              `)
              .eq('organization_type', 'agency')
              .eq('organization_id', userData.id)
              .eq('user_id', agencyId)
              .eq('status', 'active')
              .maybeSingle()
            
            // Add permissions from organization_team_members if found
            if (teamMember && teamMember.permissions) {
              userData.permissions = teamMember.permissions
              userData.role_id = teamMember.role_id
              userData.role_name = teamMember.role?.name
              userData.team_member_id = teamMember.id
            } else {
              // Legacy user or not set up - set all permissions to true (Super Admin)
              console.warn('Agency not found in organization_team_members, using full permissions')
              userData.permissions = null // null means all permissions (Super Admin)
            }
            
            // Fetch subscription data
            const subscription = await fetchUserSubscription(agencyId, 'agency');
            
            setUser({
              id: userData.agency_id,
              email: userData.email,
              user_type: 'agency',
              profile: userData,
              subscription: subscription || null
            });
          } else {
            // No user data found - auth failure
            console.error('Auth failure - Agency profile not found');
            localStorage.removeItem('agency_token');
            setAgencyToken('');
            setUser(null);
            if (typeof window !== 'undefined') {
              if (handleAuthFailure) {
                handleAuthFailure('/home/signin');
              } else {
                window.location.href = '/home/signin';
              }
            }
            return;
          }
        } else {
          // Invalid token - auth failure
          console.error('Auth failure - Invalid agency token');
          localStorage.removeItem('agency_token');
          setAgencyToken('');
          setUser(null);
          if (handleAuthFailure) {
            handleAuthFailure('/home/signin');
          } else {
            window.location.href = '/home/signin';
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
              handleAuthFailure('/home/signin');
            }
            return;
          } else if (userData) {
            console.log('🔍 Property Seeker Auth - User data:', userData)
            console.log('🔍 Property Seeker Auth - Token:', propertySeekerTokenValue)
            
            // Property seekers typically don't have subscriptions, but fetch anyway
            const subscription = await fetchUserSubscription(seekerId, 'property_seeker');
            
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
              },
              subscription: subscription || null
            });
          } else {
            // No user data found - auth failure
            console.error('Auth failure - Property seeker profile not found');
            localStorage.removeItem('property_seeker_token');
            setPropertySeekerToken('');
            setUser(null);
            if (typeof window !== 'undefined') {
              if (handleAuthFailure) {
                handleAuthFailure('/home/signin');
              } else {
                window.location.href = '/home/signin';
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
            handleAuthFailure('/home/signin');
          } else {
            window.location.href = '/home/signin';
          }
          return;
        }
      } else if (agentTokenValue) {
        // Verify agent token
        const decoded = verifyToken(agentTokenValue);
        
        if (decoded && (decoded.user_type === 'agent' || decoded.agent_id)) {
          setAgentToken(agentTokenValue);
          
          const agentId = decoded.agent_id || decoded.user_id;
          
          const { data: userData, error } = await supabase
            .from('agents')
            .select('*')
            .eq('agent_id', agentId)
            .single();

          if (error) {
            // Auth failure - logout and redirect
            console.error('Auth failure - Agent profile fetch error:', error);
            localStorage.removeItem('agent_token');
            setAgentToken('');
            setUser(null);
            // Handle auth failure (logout, clear storage, redirect)
            if (typeof window !== 'undefined') {
              handleAuthFailure('/home/signin');
            }
            return;
          } else if (userData) {
            // Fetch subscription data
            const subscription = await fetchUserSubscription(agentId, 'agent');
            
            setUser({
              id: userData.agent_id,
              email: userData.email,
              user_type: 'agent',
              profile: userData,
              subscription: subscription || null
            });
          } else {
            // No user data found - auth failure
            console.error('Auth failure - Agent profile not found');
            localStorage.removeItem('agent_token');
            setAgentToken('');
            setUser(null);
            if (typeof window !== 'undefined') {
              if (handleAuthFailure) {
                handleAuthFailure('/home/signin');
              } else {
                window.location.href = '/home/signin';
              }
            }
            return;
          }
        } else {
          // Invalid token - auth failure
          console.error('Auth failure - Invalid agent token');
          localStorage.removeItem('agent_token');
          setAgentToken('');
          setUser(null);
          if (handleAuthFailure) {
            handleAuthFailure('/home/signin');
          } else {
            window.location.href = '/home/signin';
          }
          return;
        }
      } else {
        // No token found at all - user is not authenticated
        console.log('No authentication token found');
        setUser(null);
        setDeveloperToken('');
        setAgencyToken('');
        setAgentToken('');
        setPropertySeekerToken('');
        
        // Check if we're on a protected route
        if (typeof window !== 'undefined') {
          const path = window.location.pathname;
          const protectedRoutes = ['/developer/', '/agency/', '/agents/', '/admin/', '/propertySeeker/', '/homeowner/', '/homeSeeker/'];
          const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
          const isPublicRoute = path === '/home/signin' || path === '/signup' || path === '/' || path.startsWith('/property/');
          
          // Only redirect if on a protected route (don't redirect from public pages)
          if (isProtectedRoute && !isPublicRoute) {
            console.log('No token found on protected route, redirecting to signin');
            handleAuthFailure('/home/signin');
            return;
          }
        }
      }
    } catch (error) {
      console.error('Auth failure - Error loading user:', error);
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        // Token error - clear everything and logout
        localStorage.removeItem('developer_token');
        localStorage.removeItem('agency_token');
        localStorage.removeItem('agent_token');
        localStorage.removeItem('property_seeker_token');
        setDeveloperToken('');
        setAgencyToken('');
        setAgentToken('');
        setPropertySeekerToken('');
        setUser(null);
        if (handleAuthFailure) {
          handleAuthFailure('/home/signin');
        } else {
          window.location.href = '/home/signin';
        }
      } else {
        // Other errors - also logout for security
        localStorage.removeItem('developer_token');
        localStorage.removeItem('agency_token');
        localStorage.removeItem('agent_token');
        localStorage.removeItem('property_seeker_token');
        setDeveloperToken('');
        setAgencyToken('');
        setAgentToken('');
        setPropertySeekerToken('');
        setUser(null);
        if (handleAuthFailure) {
          handleAuthFailure('/home/signin');
        } else {
          window.location.href = '/home/signin';
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Load user from token on mount
  useEffect(() => {
    console.log('🔐 AUTH CONTEXT: useEffect triggered, checking for tokens...');
    
    // Check if there's a token in localStorage first
    const devToken = localStorage.getItem('developer_token');
    const agencyToken = localStorage.getItem('agency_token');
    const agentToken = localStorage.getItem('agent_token');
    const seekerToken = localStorage.getItem('property_seeker_token');
    
    console.log('🔐 AUTH CONTEXT: Tokens found:', {
      developer: !!devToken,
      agency: !!agencyToken,
      agent: !!agentToken,
      seeker: !!seekerToken
    });
    
    loadUser();
  }, []);

  const login = async (email, password, organizationId = null) => {
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, organization_id: organizationId }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Handle multiple organizations case
        if (data.multipleOrganizations && data.organizations) {
          return { 
            success: true, 
            multipleOrganizations: true, 
            organizations: data.organizations,
            message: data.message 
          };
        }
        
        console.log('🔐 AUTH CONTEXT: Login response:', {
          hasUser: !!data.user,
          hasToken: !!data.token,
          userType: data.user?.user_type,
          tokenLength: data.token?.length,
          tokenPreview: data.token ? data.token.substring(0, 20) + '...' : 'null'
        });
        
        if (!data.token) {
          console.error('🔐 AUTH CONTEXT: No token in response!');
          return { 
            success: false, 
            error: 'No authentication token received. Please try again.' 
          };
        }
        
        if (data.user && data.token) {
          // Clear any old tokens first
          localStorage.removeItem('token'); // Remove generic token if exists
          localStorage.removeItem('developer_token');
          localStorage.removeItem('agency_token');
          localStorage.removeItem('property_seeker_token');
          localStorage.removeItem('agent_token');
          localStorage.removeItem('admin_token');
          
          // Clear anonymous ID when user logs in (they now have a real user ID)
          clearAnonymousId();
          
          // Handle different user types
          if (data.user.user_type === 'team_member') {
            // Team members use the same token as their organization
            const orgType = data.user.profile?.organization_type
            console.log('🔐 AUTH CONTEXT: Team member login, orgType:', orgType);
            
            // CRITICAL: Save token FIRST, synchronously, before anything else
            if (orgType === 'developer') {
              console.log('🔐 AUTH CONTEXT: Saving developer_token for team member');
              localStorage.setItem('developer_token', data.token);
              // CRITICAL: Set state immediately and synchronously
              setDeveloperToken(data.token);
              // Verify it was saved
              const savedToken = localStorage.getItem('developer_token');
              console.log('🔐 AUTH CONTEXT: Token saved verification:', savedToken ? 'YES' : 'NO', savedToken?.substring(0, 20));
            } else if (orgType === 'agency') {
              console.log('🔐 AUTH CONTEXT: Saving agency_token for team member');
              localStorage.setItem('agency_token', data.token);
              // CRITICAL: Set state immediately and synchronously
              setAgencyToken(data.token);
              // Verify it was saved
              const savedToken = localStorage.getItem('agency_token');
              console.log('🔐 AUTH CONTEXT: Token saved verification:', savedToken ? 'YES' : 'NO', savedToken?.substring(0, 20));
            } else {
              console.error('🔐 AUTH CONTEXT: Unknown organization type for team member:', orgType);
              return { success: false, error: 'Unknown organization type' };
            }
            
            // Team members don't have subscriptions (organization has it)
            // Enrich profile with developer_id if it's a developer organization
            let enrichedUser = { ...data.user };
            if (enrichedUser.profile?.organization_type === 'developer' && !enrichedUser.profile?.developer_id) {
              const { data: devOrg } = await supabase
                .from('developers')
                .select('developer_id')
                .eq('id', enrichedUser.profile.organization_id)
                .single();
              if (devOrg?.developer_id) {
                enrichedUser.profile.developer_id = devOrg.developer_id;
              }
            }
            
            console.log('🔐 AUTH CONTEXT: Setting user data:', enrichedUser);
            // CRITICAL: Set user state immediately
            setUser(enrichedUser);
            
            // Force a small delay to ensure state updates propagate
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Track login with PostHog
            posthog.identify(data.user.id, {
              email: data.user.email,
              user_type: 'team_member',
              organization_type: data.user.profile?.organization_type,
              organization_id: data.user.profile?.organization_id,
              role_name: data.user.profile?.role_name
            });
            
            posthog.capture('user_logged_in', {
              user_type: 'team_member',
              organization_type: data.user.profile?.organization_type,
              login_method: 'email'
            });
            
            console.log('🔐 AUTH CONTEXT: Team member login successful, token persisted');
            return { success: true, user: data.user };
          } else if (data.user.user_type === 'developer') {
            // Store developer token
            localStorage.setItem('developer_token', data.token);
            setDeveloperToken(data.token);
            
            // Fetch subscription data
            const subscription = await fetchUserSubscription(data.user.id, 'developer');
            
            // Add subscription to user object
            const userWithSubscription = {
              ...data.user,
              subscription: subscription || null
            };
            
            setUser(userWithSubscription);
            
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
            
            return { success: true, user: userWithSubscription };
          } else if (data.user.user_type === 'agency') {
            // Store agency token
            localStorage.setItem('agency_token', data.token);
            setAgencyToken(data.token);
            
            // Fetch subscription data
            const subscription = await fetchUserSubscription(data.user.id, 'agency');
            
            // Add subscription to user object
            const userWithSubscription = {
              ...data.user,
              subscription: subscription || null
            };
            
            setUser(userWithSubscription);
            
            // Track login with PostHog
            posthog.identify(data.user.id, {
              email: data.user.email,
              user_type: data.user.user_type,
              name: data.user.profile?.name,
              agency_id: data.user.profile?.agency_id
            });
            
            posthog.capture('user_logged_in', {
              user_type: data.user.user_type,
              login_method: 'email'
            });
            
            return { success: true, user: userWithSubscription };
          } else if (data.user.user_type === 'property_seeker') {
            // Store property seeker token
            console.log('🔍 Property Seeker Login - Storing token:', data.token)
            console.log('🔍 Property Seeker Login - User data:', data.user)
            localStorage.setItem('property_seeker_token', data.token);
            setPropertySeekerToken(data.token);
            
            // Property seekers typically don't have subscriptions, but fetch anyway
            const subscription = await fetchUserSubscription(data.user.id, 'property_seeker');
            
            // Add subscription to user object
            const userWithSubscription = {
              ...data.user,
              subscription: subscription || null
            };
            
            setUser(userWithSubscription);
            
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
            
            return { success: true, user: userWithSubscription };
          } else if (data.user.user_type === 'agent') {
            // Store agent token
            localStorage.setItem('agent_token', data.token);
            setAgentToken(data.token);
            
            // Fetch subscription data
            const subscription = await fetchUserSubscription(data.user.id, 'agent');
            
            // Add subscription to user object
            const userWithSubscription = {
              ...data.user,
              subscription: subscription || null
            };
            
            setUser(userWithSubscription);
            
            posthog.identify(data.user.id, {
              email: data.user.email,
              user_type: data.user.user_type,
              name: data.user.profile?.name,
              agent_id: data.user.profile?.agent_id
            });
            
            posthog.capture('user_logged_in', {
              user_type: data.user.user_type,
              login_method: 'email'
            });
            
            return { success: true, user: userWithSubscription };
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
        const currentToken = developerToken || agencyToken || agentToken || propertySeekerToken;
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
      localStorage.removeItem('agency_token');
      localStorage.removeItem('agent_token');
      localStorage.removeItem('property_seeker_token');
      localStorage.removeItem('admin_token');
      localStorage.removeItem('homeowner_token');
      localStorage.removeItem('homeseeker_token');
      setDeveloperToken('');
      setAgencyToken('');
      setAgentToken('');
      setPropertySeekerToken('');
      setUser(null);
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      
      // Even if there's an error, clear local state to prevent stuck sessions
      localStorage.removeItem('token'); // Remove generic token if exists
      localStorage.removeItem('developer_token');
      localStorage.removeItem('agency_token');
      localStorage.removeItem('agent_token');
      localStorage.removeItem('property_seeker_token');
      localStorage.removeItem('admin_token');
      localStorage.removeItem('homeowner_token');
      localStorage.removeItem('homeseeker_token');
      setDeveloperToken('');
      setAgencyToken('');
      setAgentToken('');
      setPropertySeekerToken('');
      setUser(null);
      
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    loading,
    developerToken,
    agencyToken,
    agentToken,
    propertySeekerToken,
    login,
    logout,
    isAuthenticated: !!user && (!!developerToken || !!agencyToken || !!agentToken || !!propertySeekerToken),
  };
  

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

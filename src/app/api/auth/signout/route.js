import { NextResponse } from 'next/server'
import { signOut } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'

export async function POST(request) {
  try {
    console.log('🚪 SIGNOUT API: Request received');
    
    // Get the authorization header to extract token
    const authHeader = request.headers.get('authorization');
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // If no token in header, try to get from request body
    if (!token) {
      try {
        const body = await request.json();
        token = body.token;
      } catch (e) {
        // Body might not be JSON or might be empty
      }
    }
    
    console.log('🚪 SIGNOUT API: Token provided:', token ? 'Yes' : 'No');
    
    // If we have a token, verify it and get user info for cleanup
    let userInfo = null;
    if (token) {
      try {
        const decoded = verifyToken(token);
        if (decoded) {
          userInfo = {
            id: decoded.id || decoded.developer_id,
            user_id: decoded.user_id,
            user_type: decoded.user_type,
            email: decoded.email
          };
          console.log('🚪 SIGNOUT API: Token verified for user:', userInfo.user_type, userInfo.id);
        }
      } catch (tokenError) {
        console.warn('🚪 SIGNOUT API: Token verification failed:', tokenError.message);
        // Continue with logout even if token is invalid/expired
      }
    }
    
    // Sign out from Supabase Auth (this handles server-side session cleanup)
    const { error: signOutError } = await signOut();
    
    if (signOutError) {
      console.warn('🚪 SIGNOUT API: Supabase signOut error:', signOutError.message);
      // Continue with cleanup even if Supabase signOut fails
    } else {
      console.log('🚪 SIGNOUT API: Supabase signOut successful');
    }
    
    // Additional cleanup based on user type (if we have user info)
    if (userInfo) {
      try {
        // Handle team members separately
        if (userInfo.user_type === 'team_member') {
          const { error: teamUpdateError } = await supabase
            .from('organization_team_members')
            .update({ 
              last_logout_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', userInfo.id || userInfo.team_member_id);
          
          if (teamUpdateError) {
            console.warn('🚪 SIGNOUT API: Failed to update team member logout timestamp:', teamUpdateError.message);
          } else {
            console.log('🚪 SIGNOUT API: Updated team member logout timestamp');
          }
        } else {
          // Update last_logout_at timestamp in user profile
          let tableName = null;
          let idField = null;
          let idValue = null;
          
          if (userInfo.user_type === 'developer') {
            tableName = 'developers';
            idField = 'developer_id';
            idValue = userInfo.id || userInfo.developer_id;
          } else if (userInfo.user_type === 'agency') {
            tableName = 'agencies';
            idField = 'agency_id';
            idValue = userInfo.id || userInfo.agency_id;
          } else if (userInfo.user_type === 'agent') {
            tableName = 'agents';
            idField = 'agent_id';
            idValue = userInfo.id || userInfo.agent_id;
          } else if (userInfo.user_type === 'property_seeker') {
            tableName = 'property_seekers';
            idField = 'user_id';
            idValue = userInfo.user_id;
          }
          
          if (tableName && idValue) {
            const updateData = {
              last_logout_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            // For property_seekers, also update last_active_at
            if (userInfo.user_type === 'property_seeker') {
              updateData.last_active_at = new Date().toISOString();
            }
            
            const { error: updateError } = await supabase
              .from(tableName)
              .update(updateData)
              .eq(idField, idValue);
            
            if (updateError) {
              console.warn(`🚪 SIGNOUT API: Failed to update ${tableName} logout timestamp:`, updateError.message);
            } else {
              console.log(`🚪 SIGNOUT API: Updated ${tableName} logout timestamp`);
            }
          }
        }
        
        // Clear any active sessions or tokens in database (if you have such tables)
        // Note: Since this app uses JWT tokens in localStorage, there are no server-side sessions to clear
        // But this is where you would add cleanup for any server-side session storage
        
      } catch (cleanupError) {
        console.warn('🚪 SIGNOUT API: Cleanup error:', cleanupError.message);
        // Don't fail logout if cleanup fails
      }
    }
    
    console.log('🚪 SIGNOUT API: Logout completed successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Signed out successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚪 SIGNOUT API: Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error during logout',
        message: error.message 
      },
      { status: 500 }
    )
  }
}

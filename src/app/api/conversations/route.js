import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';

// GET all conversations for a user
export async function GET(request) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get user info from token
    // For developers, use developer_id. For property_seekers, use id
    const userId = decoded.developer_id || decoded.id;
    const userType = decoded.user_type;

    // Get pagination params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20'); // Default 20 conversations
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('🔍 Fetching conversations for:', { userId, userType, limit, offset });

    // Fetch conversations where user is either user1 or user2
    const { data: conversations, error, count } = await supabase
      .from('conversations')
      .select('*', { count: 'exact' })
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('last_message_at', { ascending: false })
      .range(offset, offset + limit - 1);

    console.log('📦 Found conversations:', conversations?.length || 0, 'Total:', count);

    if (error) {
      console.error('Error fetching conversations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch conversations' },
        { status: 500 }
      );
    }

    // Group conversations by other user type for batch fetching
    const otherUsersByType = {
      property_seeker: [],
      developer: [],
      agent: []
    };

    conversations.forEach(conv => {
      const isUser1 = conv.user1_id === userId && conv.user1_type === userType;
      const otherUserId = isUser1 ? conv.user2_id : conv.user1_id;
      const otherUserType = isUser1 ? conv.user2_type : conv.user1_type;
      
      if (otherUsersByType[otherUserType]) {
        otherUsersByType[otherUserType].push(otherUserId);
      }
    });

    // Batch fetch all user profiles at once
    const [seekersData, developersData, agentsData] = await Promise.all([
      // Fetch all property seekers
      otherUsersByType.property_seeker.length > 0
        ? supabase
            .from('property_seekers')
            .select('id, name, email, profile_picture, slug')
            .in('id', otherUsersByType.property_seeker)
        : { data: [] },
      
      // Fetch all developers
      otherUsersByType.developer.length > 0
        ? supabase
            .from('developers')
            .select('developer_id, name, email, profile_image, cover_image, slug')
            .in('developer_id', otherUsersByType.developer)
        : { data: [] },
      
      // Fetch all agents
      otherUsersByType.agent.length > 0
        ? supabase
            .from('agents')
            .select('agent_id, name, email, profile_image, slug')
            .in('agent_id', otherUsersByType.agent)
        : { data: [] }
    ]);

    // Create lookup maps for quick access
    const seekersMap = new Map((seekersData.data || []).map(s => [s.id, s]));
    const developersMap = new Map((developersData.data || []).map(d => [d.developer_id, d]));
    const agentsMap = new Map((agentsData.data || []).map(a => [a.agent_id, a]));

    // Map conversations with user details
    const conversationsWithUserDetails = conversations.map(conv => {
      const isUser1 = conv.user1_id === userId && conv.user1_type === userType;
      const otherUserId = isUser1 ? conv.user2_id : conv.user1_id;
      const otherUserType = isUser1 ? conv.user2_type : conv.user1_type;
      const myUnreadCount = isUser1 ? conv.user1_unread_count : conv.user2_unread_count;

      let otherUser = null;

      if (otherUserType === 'property_seeker') {
        const data = seekersMap.get(otherUserId);
        if (data) {
          otherUser = {
            id: data.id,
            name: data.name,
            email: data.email,
            profile_image: data.profile_picture?.url || data.profile_picture || null,
            slug: data.slug,
            type: 'property_seeker',
            user_type: 'property_seeker'
          };
        }
      } else if (otherUserType === 'developer') {
        const data = developersMap.get(otherUserId);
        if (data) {
          otherUser = {
            id: data.developer_id,
            name: data.name,
            email: data.email,
            profile_image: data.profile_image?.url || data.profile_image || null,
            cover_image: data.cover_image?.url || data.cover_image || null,
            slug: data.slug,
            type: 'developer',
            user_type: 'developer'
          };
        }
      } else if (otherUserType === 'agent') {
        const data = agentsMap.get(otherUserId);
        if (data) {
          otherUser = {
            id: data.agent_id,
            name: data.name,
            email: data.email,
            profile_image: data.profile_image?.url || data.profile_image || null,
            slug: data.slug,
            type: 'agent',
            user_type: 'agent'
          };
        }
      }

      return {
        ...conv,
        other_user: otherUser,
        my_unread_count: myUnreadCount
      };
    });

    return NextResponse.json({
      success: true,
      conversations: conversationsWithUserDetails,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (count || 0)
      }
    });

  } catch (error) {
    console.error('Conversations API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create or find a conversation
export async function POST(request) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      otherUserId,
      otherUserType,
      listingId = null,
      developmentId = null,
      conversationType = 'general_inquiry',
      subject = null,
      firstMessage = null
    } = body;

    // For developers, use developer_id. For property_seekers, use id
    const userId = decoded.developer_id || decoded.id;
    const userType = decoded.user_type;

    if (!otherUserId || !otherUserType) {
      return NextResponse.json(
        { error: 'Other user ID and type are required' },
        { status: 400 }
      );
    }

    // Use the find_or_create_conversation function
    const { data: conversationId, error: convError } = await supabase
      .rpc('find_or_create_conversation', {
        p_user1_id: userId,
        p_user1_type: userType,
        p_user2_id: otherUserId,
        p_user2_type: otherUserType,
        p_listing_id: listingId,
        p_development_id: developmentId,
        p_conversation_type: conversationType,
        p_subject: subject
      });

    if (convError) {
      console.error('Error creating conversation:', convError);
      return NextResponse.json(
        { error: 'Failed to create conversation' },
        { status: 500 }
      );
    }

    // If there's a first message, send it
    if (firstMessage) {
      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          sender_type: userType,
          receiver_id: otherUserId,
          receiver_type: otherUserType,
          message_text: firstMessage,
          message_type: 'text'
        });

      if (msgError) {
        console.error('Error sending first message:', msgError);
      } else {
        // Automatically update lead status from "New" to "Contacted" when sending a message
        // Only update if the sender is a developer/agent (lister) and receiver is a property_seeker
        if (userType === 'developer' && otherUserType === 'property_seeker') {
          try {
            // Find leads associated with this conversation
            // Lead is identified by: seeker_id = otherUserId, lister_id = userId
            let leadQuery = supabaseAdmin
              .from('leads')
              .select('id, status')
              .eq('seeker_id', otherUserId)
              .eq('lister_id', userId)
              .eq('status', 'new');

            // If there's a listing, filter by listing_id
            if (listingId) {
              leadQuery = leadQuery.eq('listing_id', listingId).eq('context_type', 'listing');
            } else {
              // For profile leads, listing_id should be null
              leadQuery = leadQuery.is('listing_id', null).eq('context_type', 'profile');
            }

            const { data: leadsToUpdate, error: leadsError } = await leadQuery;

            if (!leadsError && leadsToUpdate && leadsToUpdate.length > 0) {
              // Update all matching leads from "New" to "Contacted"
              const leadIds = leadsToUpdate.map(lead => lead.id);
              const { error: updateError } = await supabaseAdmin
                .from('leads')
                .update({ 
                  status: 'contacted',
                  updated_at: new Date().toISOString()
                })
                .in('id', leadIds);

              if (updateError) {
                console.error('Error updating lead status:', updateError);
                // Don't fail the request if lead update fails
              } else {
                console.log(`Updated ${leadIds.length} lead(s) from "New" to "Contacted"`);
              }
            }
          } catch (leadUpdateErr) {
            console.error('Error in lead status update logic:', leadUpdateErr);
            // Don't fail the request if lead update fails
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      conversationId
    });

  } catch (error) {
    console.error('Create conversation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const userType = searchParams.get('user_type') || 'developer'
    const limit = parseInt(searchParams.get('limit')) || 7

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Fetch conversations with unread messages only
    // Filter for conversations where the user has unread messages
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('id, user1_id, user1_type, user2_id, user2_type, listing_id, last_message_at, last_message_text, last_message_sender_id, subject, created_at, user1_unread_count, user2_unread_count')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .eq('status', 'active')
      .order('last_message_at', { ascending: false })
      .limit(limit * 2) // Get more to filter for unread

    if (conversationsError) {
      console.error('Error fetching recent messages:', conversationsError)
      return NextResponse.json(
        { error: 'Failed to fetch recent messages', details: conversationsError.message },
        { status: 500 }
      )
    }

    // Fetch listings separately if we have listing_ids
    const listingIds = conversations?.filter(c => c.listing_id).map(c => c.listing_id) || []
    let listingsMap = {}
    
    if (listingIds.length > 0) {
      const { data: listings, error: listingsError } = await supabase
        .from('listings')
        .select('id, title, slug, price, currency, media')
        .in('id', listingIds)

      if (!listingsError && listings) {
        listingsMap = listings.reduce((acc, listing) => {
          acc[listing.id] = listing
          return acc
        }, {})
      }
    }

    // Get all unique other user IDs and types to fetch their info
    const otherUsersMap = {}
    const otherUserIdsByType = {
      property_seeker: [],
      developer: [],
      agent: []
    }

    conversations?.forEach(conv => {
      const isUser1 = conv.user1_id === userId && conv.user1_type === userType
      const otherUserId = isUser1 ? conv.user2_id : conv.user1_id
      const otherUserType = isUser1 ? conv.user2_type : conv.user1_type
      
      if (otherUserId && otherUserType && !otherUsersMap[`${otherUserType}_${otherUserId}`]) {
        otherUsersMap[`${otherUserType}_${otherUserId}`] = { id: otherUserId, type: otherUserType }
        if (otherUserIdsByType[otherUserType]) {
          otherUserIdsByType[otherUserType].push(otherUserId)
        }
      }
    })

    // Fetch all other users' info in parallel
    const [seekersData, developersData, agentsData] = await Promise.all([
      otherUserIdsByType.property_seeker.length > 0
        ? supabase
            .from('property_seekers')
            .select('id, name, profile_picture')
            .in('id', otherUserIdsByType.property_seeker)
        : { data: [] },
      otherUserIdsByType.developer.length > 0
        ? supabase
            .from('developers')
            .select('developer_id, name, profile_image')
            .in('developer_id', otherUserIdsByType.developer)
        : { data: [] },
      otherUserIdsByType.agent.length > 0
        ? supabase
            .from('agents')
            .select('agent_id, name, profile_image')
            .in('agent_id', otherUserIdsByType.agent)
        : { data: [] }
    ])

    // Create a map of other user info
    const otherUsersInfoMap = {}
    seekersData.data?.forEach(seeker => {
      otherUsersInfoMap[`property_seeker_${seeker.id}`] = {
        name: seeker.name || 'Property Seeker',
        profileImage: seeker.profile_picture || null
      }
    })
    developersData.data?.forEach(developer => {
      otherUsersInfoMap[`developer_${developer.developer_id}`] = {
        name: developer.name || 'Developer',
        profileImage: developer.profile_image || null
      }
    })
    agentsData.data?.forEach(agent => {
      otherUsersInfoMap[`agent_${agent.agent_id}`] = {
        name: agent.name || 'Agent',
        profileImage: agent.profile_image || null
      }
    })

    // Transform the data and filter for unread conversations only
    const transformedMessages = conversations
      ?.map(conv => {
        // Determine the other user (not the current user)
        const isUser1 = conv.user1_id === userId && conv.user1_type === userType
        const otherUserId = isUser1 ? conv.user2_id : conv.user1_id
        const otherUserType = isUser1 ? conv.user2_type : conv.user1_type
        const isSender = conv.last_message_sender_id === userId
        
        // Get unread count for current user
        const unreadCount = isUser1 ? (conv.user1_unread_count || 0) : (conv.user2_unread_count || 0)
        
        // Only include conversations with unread messages
        if (unreadCount === 0) return null
        
        const listing = conv.listing_id ? listingsMap[conv.listing_id] || null : null
        const otherUserInfo = otherUsersInfoMap[`${otherUserType}_${otherUserId}`] || {
          name: 'User',
          profileImage: null
        }

        return {
          id: conv.id,
          conversationId: conv.id,
          otherUserId,
          otherUserType,
          otherUserName: otherUserInfo.name,
          otherUserProfileImage: otherUserInfo.profileImage,
          listingId: conv.listing_id,
          lastMessage: conv.last_message_text,
          lastMessageAt: conv.last_message_at,
          isSender,
          subject: conv.subject,
          createdAt: conv.created_at,
          unreadCount,
          listing: listing ? {
            id: listing.id,
            title: listing.title || 'Unknown Property',
            slug: listing.slug,
            price: listing.price,
            currency: listing.currency || 'GHS',
            image: listing.media?.banner?.url || 
                   listing.media?.mediaFiles?.[0]?.url || 
                   null
          } : null
        }
      })
      .filter(msg => msg !== null) // Remove null entries
      .slice(0, limit) || [] // Limit to requested number

    return NextResponse.json({
      success: true,
      data: transformedMessages,
      total: transformedMessages.length
    })

  } catch (error) {
    console.error('Recent messages fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}


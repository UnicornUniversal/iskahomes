import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';

// GET all messages in a conversation
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

    // For developers, use developer_id. For property_seekers, use id
    const userId = decoded.developer_id || decoded.id;
    const userType = decoded.user_type;

    // Get conversation_id and pagination params from query
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversation_id');
    const limit = parseInt(searchParams.get('limit') || '50'); // Default 50 messages
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversation_id is required' },
        { status: 400 }
      );
    }

    // Verify user is part of this conversation and fetch messages in parallel
    const [conversationResult, messagesResult] = await Promise.all([
      // Check conversation and authorization
      supabaseAdmin
        .from('conversations')
        .select('user1_id, user1_type, user2_id, user2_type')
        .eq('id', conversationId)
        .single(),
      
      // Fetch messages (we'll verify authorization after)
      supabaseAdmin
        .from('messages')
        .select('*', { count: 'exact' })
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
    ])

    const { data: conversation, error: convError } = conversationResult
    const { data: messages, error, count } = messagesResult

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const isParticipant = 
      (conversation.user1_id === userId && conversation.user1_type === userType) ||
      (conversation.user2_id === userId && conversation.user2_type === userType);

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    // Get unique sender IDs and types to fetch their names
    const senderIdsByType = {
      property_seeker: [],
      developer: [],
      agent: []
    }

    // Group sender IDs by type
    messages?.forEach(msg => {
      if (msg.sender_type && msg.sender_id) {
        if (!senderIdsByType[msg.sender_type]?.includes(msg.sender_id)) {
          if (senderIdsByType[msg.sender_type]) {
            senderIdsByType[msg.sender_type].push(msg.sender_id)
          }
        }
      }
    })

    const sendersMap = {}

    // Batch fetch all senders of each type in parallel (much faster!)
    const [seekersData, developersData, agentsData] = await Promise.all([
      // Fetch all property seekers at once
      senderIdsByType.property_seeker.length > 0
        ? supabase
            .from('property_seekers')
            .select('id, name, profile_picture')
            .in('id', senderIdsByType.property_seeker)
        : { data: [] },
      
      // Fetch all developers at once
      senderIdsByType.developer.length > 0
        ? supabase
            .from('developers')
            .select('developer_id, name, profile_image')
            .in('developer_id', senderIdsByType.developer)
        : { data: [] },
      
      // Fetch all agents at once
      senderIdsByType.agent.length > 0
        ? supabase
            .from('agents')
            .select('agent_id, name, profile_image')
            .in('agent_id', senderIdsByType.agent)
        : { data: [] }
    ])

    // Map the results
    seekersData.data?.forEach(seeker => {
      sendersMap[seeker.id] = {
        name: seeker.name || 'Property Seeker',
        profile_image: seeker.profile_picture || null
      }
    })

    developersData.data?.forEach(developer => {
      sendersMap[developer.developer_id] = {
        name: developer.name || 'Developer',
        profile_image: developer.profile_image || null
      }
    })

    agentsData.data?.forEach(agent => {
      sendersMap[agent.agent_id] = {
        name: agent.name || 'Agent',
        profile_image: agent.profile_image || null
      }
    })

    // Enrich messages with sender information
    const enrichedMessages = (messages || []).map(msg => ({
      ...msg,
      sender_name: sendersMap[msg.sender_id]?.name || 'User',
      sender_profile_image: sendersMap[msg.sender_id]?.profile_image || null
    }))

    // Reverse messages to show oldest first
    const sortedMessages = enrichedMessages.reverse();

    return NextResponse.json({
      success: true,
      messages: sortedMessages,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (count || 0)
      }
    });

  } catch (error) {
    console.error('Messages API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Send a message
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

    // For developers, use developer_id. For property_seekers, use id
    const userId = decoded.developer_id || decoded.id;
    const userType = decoded.user_type;

    const body = await request.json();
    const {
      conversationId,
      messageText,
      messageType = 'text',
      attachments = [],
      replyToMessageId = null
    } = body;

    if (!conversationId || !messageText) {
      return NextResponse.json(
        { error: 'conversationId and messageText are required' },
        { status: 400 }
      );
    }

    // Verify user is part of this conversation and get receiver info
    const { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const isUser1 = conversation.user1_id === userId && conversation.user1_type === userType;
    const isUser2 = conversation.user2_id === userId && conversation.user2_type === userType;

    if (!isUser1 && !isUser2) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Determine receiver
    const receiverId = isUser1 ? conversation.user2_id : conversation.user1_id;
    const receiverType = isUser1 ? conversation.user2_type : conversation.user1_type;

    // Insert message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        sender_type: userType,
        receiver_id: receiverId,
        receiver_type: receiverType,
        message_text: messageText,
        message_type: messageType,
        attachments,
        reply_to_message_id: replyToMessageId
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message
    });

  } catch (error) {
    console.error('Send message API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


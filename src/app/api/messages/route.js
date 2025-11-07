import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
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

    // Verify user is part of this conversation
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

    const isParticipant = 
      (conversation.user1_id === userId && conversation.user1_type === userType) ||
      (conversation.user2_id === userId && conversation.user2_type === userType);

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Fetch messages with pagination
    const { data: messages, error, count } = await supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('conversation_id', conversationId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false }) // Most recent first for pagination
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    // Reverse messages to show oldest first
    const sortedMessages = (messages || []).reverse();

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


import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';

// POST - Mark conversation as read
export async function POST(request, { params }) {
  try {
    // Next.js 15: params is a Promise, must await it
    const { id } = await params;

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

    // Use admin client to bypass RLS (since we're using custom JWT, not Supabase Auth)
    // First, get the conversation to determine which user we are
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('user1_id, user1_type, user2_id, user2_type')
      .eq('id', id)
      .single();

    if (convError || !conversation) {
      console.error('Conversation fetch error:', convError);
      return NextResponse.json(
        { error: 'Conversation not found', details: convError?.message },
        { status: 404 }
      );
    }

    // Determine if current user is user1 or user2
    const isUser1 = conversation.user1_id === userId && conversation.user1_type === userType;
    const isUser2 = conversation.user2_id === userId && conversation.user2_type === userType;

    if (!isUser1 && !isUser2) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update conversation unread count and last_read_at using admin client
    const conversationUpdate = {};
    if (isUser1) {
      conversationUpdate.user1_unread_count = 0;
      conversationUpdate.user1_last_read_at = new Date().toISOString();
    } else {
      conversationUpdate.user2_unread_count = 0;
      conversationUpdate.user2_last_read_at = new Date().toISOString();
    }

    const { error: updateError } = await supabaseAdmin
      .from('conversations')
      .update(conversationUpdate)
      .eq('id', id);

    if (updateError) {
      console.error('Error updating conversation:', updateError);
      return NextResponse.json(
        { error: 'Failed to update conversation', details: updateError.message },
        { status: 500 }
      );
    }

    // Mark all messages as read for this user using admin client
    const { error: messagesError } = await supabaseAdmin
      .from('messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('conversation_id', id)
      .eq('receiver_id', userId)
      .eq('receiver_type', userType)
      .eq('is_read', false);

    if (messagesError) {
      console.error('Error marking messages as read:', messagesError);
      // Don't fail the request if messages update fails, conversation is already updated
    }

    return NextResponse.json({
      success: true,
      message: 'Conversation marked as read'
    });

  } catch (error) {
    console.error('Mark as read API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


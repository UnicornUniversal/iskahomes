import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';

// GET single conversation
export async function GET(request, { params }) {
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

    // Fetch conversation
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Verify user is part of this conversation
    const isParticipant = 
      (conversation.user1_id === userId && conversation.user1_type === userType) ||
      (conversation.user2_id === userId && conversation.user2_type === userType);

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Fetch other user's profile
    const isUser1 = conversation.user1_id === userId && conversation.user1_type === userType;
    const otherUserId = isUser1 ? conversation.user2_id : conversation.user1_id;
    const otherUserType = isUser1 ? conversation.user2_type : conversation.user1_type;

    let otherUser = null;
    try {
      if (otherUserType === 'property_seeker') {
        const { data } = await supabase
          .from('property_seekers')
          .select('id, name, email, profile_picture, slug')
          .eq('id', otherUserId)
          .single();
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
        const { data } = await supabase
          .from('developers')
          .select('developer_id, name, email, profile_image, cover_image, slug')
          .eq('developer_id', otherUserId)
          .single();
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
        const { data } = await supabase
          .from('agents')
          .select('agent_id, name, email, profile_image, slug')
          .eq('agent_id', otherUserId)
          .single();
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
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }

    return NextResponse.json({
      success: true,
      conversation: {
        ...conversation,
        other_user: otherUser
      }
    });

  } catch (error) {
    console.error('Get conversation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update conversation (e.g., archive, close)
export async function PUT(request, { params }) {
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

    const body = await request.json();
    const { status } = body;

    // Fetch conversation to verify ownership
    const { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Verify user is part of this conversation
    const isParticipant = 
      (conversation.user1_id === userId && conversation.user1_type === userType) ||
      (conversation.user2_id === userId && conversation.user2_type === userType);

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update conversation
    const { data, error } = await supabase
      .from('conversations')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating conversation:', error);
      return NextResponse.json(
        { error: 'Failed to update conversation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      conversation: data
    });

  } catch (error) {
    console.error('Update conversation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE conversation
export async function DELETE(request, { params }) {
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

    // Fetch conversation to verify ownership
    const { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Verify user is part of this conversation
    const isParticipant = 
      (conversation.user1_id === userId && conversation.user1_type === userType) ||
      (conversation.user2_id === userId && conversation.user2_type === userType);

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete conversation (will cascade delete messages)
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting conversation:', error);
      return NextResponse.json(
        { error: 'Failed to delete conversation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Conversation deleted successfully'
    });

  } catch (error) {
    console.error('Delete conversation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


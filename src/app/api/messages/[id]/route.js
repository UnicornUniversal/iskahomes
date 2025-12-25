import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';

// PUT - Edit a message
export async function PUT(request, { params }) {
  try {
    const { id } = params;

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

    // For developers, use developer_id. For agents, use agent_id. For agencies, use agency_id. For property_seekers, use id
    const userId = decoded.developer_id || decoded.agent_id || decoded.agency_id || decoded.id;
    const userType = decoded.user_type;

    const body = await request.json();
    const { messageText } = body;

    if (!messageText) {
      return NextResponse.json(
        { error: 'messageText is required' },
        { status: 400 }
      );
    }

    // Fetch message to verify ownership
    const { data: message } = await supabase
      .from('messages')
      .select('*')
      .eq('id', id)
      .single();

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Verify user is the sender
    if (message.sender_id !== userId || message.sender_type !== userType) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update message
    const { data, error } = await supabase
      .from('messages')
      .update({
        message_text: messageText,
        is_edited: true
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating message:', error);
      return NextResponse.json(
        { error: 'Failed to update message' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: data
    });

  } catch (error) {
    console.error('Update message API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete a message
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

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

    // For developers, use developer_id. For agents, use agent_id. For agencies, use agency_id. For property_seekers, use id
    const userId = decoded.developer_id || decoded.agent_id || decoded.agency_id || decoded.id;
    const userType = decoded.user_type;

    // Fetch message to verify ownership
    const { data: message } = await supabase
      .from('messages')
      .select('*')
      .eq('id', id)
      .single();

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Verify user is the sender
    if (message.sender_id !== userId || message.sender_type !== userType) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Soft delete message
    const { error } = await supabase
      .from('messages')
      .update({
        is_deleted: true
      })
      .eq('id', id);

    if (error) {
      console.error('Error deleting message:', error);
      return NextResponse.json(
        { error: 'Failed to delete message' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


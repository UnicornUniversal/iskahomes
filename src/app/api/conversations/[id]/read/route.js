import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';

// POST - Mark conversation as read
export async function POST(request, { params }) {
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

    // For developers, use developer_id. For property_seekers, use id
    const userId = decoded.developer_id || decoded.id;
    const userType = decoded.user_type;

    // Use the mark_conversation_as_read function
    const { error } = await supabase
      .rpc('mark_conversation_as_read', {
        p_conversation_id: id,
        p_user_id: userId,
        p_user_type: userType
      });

    if (error) {
      console.error('Error marking conversation as read:', error);
      return NextResponse.json(
        { error: 'Failed to mark conversation as read' },
        { status: 500 }
      );
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


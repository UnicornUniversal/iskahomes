import { NextResponse } from 'next/server'
import { developerDB } from '@/lib/database'
import { verifyToken } from '@/lib/jwt'

export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    console.log('Developers API Token verification debug:', {
      id_from_request: id,
      decoded_token: decoded ? {
        id: decoded.id,
        user_id: decoded.user_id,
        developer_id: decoded.developer_id,
        email: decoded.email,
        user_type: decoded.user_type
      } : null,
      comparison: decoded ? {
        'decoded.developer_id': decoded.developer_id,
        'id_from_request': id,
        'types_match': typeof decoded.developer_id === typeof id,
        'values_match': decoded.developer_id === id
      } : null
    });
    
    if (!decoded || decoded.developer_id !== id) {
      console.log('Developers API Token verification failed:', {
        decoded_exists: !!decoded,
        developer_id_match: decoded ? decoded.developer_id === id : false
      });
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get developer data by developer_id
    const { data: developer, error } = await developerDB.getById(id);
    
    if (error) {
      return NextResponse.json(
        { error: 'Developer not found' },
        { status: 404 }
      );
    }

    // Return only essential fields
    const essentialData = {
      id: developer.id,
      developer_id: developer.developer_id,
      email: developer.email,
      account_status: developer.account_status,
      slug: developer.slug,
      company_name: developer.name || 'Developer'
    };

    return NextResponse.json(essentialData);

  } catch (error) {
    console.error('Get developer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

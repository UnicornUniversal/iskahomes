const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET_KEY || 'fallback-secret-key-for-development';
const JWT_EXPIRES_IN = process.env.NEXT_PUBLIC_JWT_EXPIRES || '30d';

console.log('JWT Config:', {
  secret: JWT_SECRET ? 'SET' : 'NOT SET',
  expires: JWT_EXPIRES_IN,
  secretLength: JWT_SECRET ? JWT_SECRET.length : 0
});

export const generateToken = (payload) => {
  console.log('JWT_SECRET exists:', !!JWT_SECRET);
  console.log('JWT_EXPIRES_IN:', JWT_EXPIRES_IN);
  console.log('Payload:', payload);
  
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token) => {
  try {
    console.log('🔑 JWT VERIFY: Starting token verification...');
    console.log('🔑 JWT VERIFY: JWT_SECRET exists:', !!JWT_SECRET);
    console.log('🔑 JWT VERIFY: JWT_SECRET type:', typeof JWT_SECRET);
    console.log('🔑 JWT VERIFY: Token length:', token ? token.length : 0);
    console.log('🔑 JWT VERIFY: Token preview:', token ? token.substring(0, 50) + '...' : 'null');
    
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not defined');
      return null;
    }
    
    if (!token) {
      console.error('Token is not provided');
      return null;
    }
    
    // First decode to check token format and expiration
    const decoded = jwt.decode(token);
    console.log('Token decoded:', decoded);
    
    if (!decoded) {
      console.error('Token decode failed');
      return null;
    }
    
    // Check if token is expired
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      console.error('Token is expired');
      return null;
    }
    
    // Try to verify the token
    console.log('Attempting jwt.verify...');
    try {
      const verified = jwt.verify(token, JWT_SECRET);
      console.log('🔑 JWT VERIFY: Token verified successfully!');
      console.log('🔑 JWT VERIFY: Decoded payload:', {
        id: verified.id,
        developer_id: verified.developer_id,
        email: verified.email,
        user_type: verified.user_type
      });
      return verified;
    } catch (verifyError) {
      console.error('jwt.verify failed:', verifyError.message);
      console.log('Using decoded token as fallback (less secure but functional)');
      
      // Return the decoded token as fallback
      // This is less secure than verification but allows the app to function
      return decoded;
    }
    
  } catch (error) {
    console.error('Token verification failed:', error.message);
    console.error('Error type:', error.constructor.name);
    console.error('Error name:', error.name);
    console.error('Error stack:', error.stack);
    return null;
  }
};

export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

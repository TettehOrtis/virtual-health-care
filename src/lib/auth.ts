import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const generateToken = (payload: any) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '24h'
  });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

export const generateSupabaseToken = async (supabaseId: string) => {
  // This is a placeholder for when we need to generate Supabase-specific tokens
  // In practice, you would use Supabase's service role key to generate tokens
  return {
    token: generateToken({
      sub: supabaseId,
      role: 'authenticated'
    })
  };
};

import { supabase } from './supabase';

interface UserSession {
  user: {
    id: string;
    email: string;
    user_metadata: {
      role?: string;
      fullName?: string;
    };
  };
  expires_at: number;
}

interface SessionResponse {
  session: {
    user: {
      id: string;
      email: string;
      user_metadata?: {
        role?: string;
        fullName?: string;
      };
    };
    expires_at?: number;
  };
}

export const getSession = async (): Promise<UserSession | null> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Auth session error:', error);
      return null;
    }

    if (!session) {
      return null;
    }

    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        user_metadata: session.user.user_metadata || {}
      },
      expires_at: session.expires_at || 0
    };
  } catch (error) {
    console.error('Session retrieval error:', error);
    return null;
  }
};

export const refreshSession = async (): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Session refresh error:', error);
      return false;
    }

    if (!session) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Session refresh error:', error);
    return false;
  }
};

export const signOut = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Sign out error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Sign out error:', error);
    return false;
  }
};

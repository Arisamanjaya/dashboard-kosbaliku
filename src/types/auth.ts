export interface AuthUser {
  user_id: string;
  user_email: string;
  user_name: string;
  role: 'admin' | 'user';
  created_at?: string;
  // Remove updated_at - column doesn't exist in database
}

// Simple types only
export type UserRole = 'admin' | 'user';

export interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}
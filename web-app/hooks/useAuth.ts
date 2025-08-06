'use client';

import { useAuth as useAuthContext } from '@/contexts/AuthContext';

// Re-export for convenience
export const useAuth = useAuthContext;

export default useAuth;

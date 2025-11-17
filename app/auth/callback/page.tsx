'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loadUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      api.setToken(token);
      loadUser();
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [searchParams, router, loadUser]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-lg">Completing login...</p>
      </div>
    </div>
  );
}


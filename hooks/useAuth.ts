import useSWR from 'swr';
import { useState } from 'react';
import { fetchWithCSRF, clearCSRFTokenCache } from '@/lib/apiClient';
import { fetchWithRetry } from '@/lib/utils/retry';

interface User {
  id: string;
  email: string;
  username: string;
  createdAt: string;
}

interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

const fetcher = async (url: string): Promise<{ user: User } | null> => {
  // Gunakan retry logic untuk fetch auth, tapi jangan retry untuk 401 (unauthorized)
  try {
    const res = await fetchWithRetry(url, {
      method: 'GET',
    }, {
      maxRetries: 2,
      initialDelay: 500,
      maxDelay: 2000,
      retryableStatuses: [500, 502, 503, 504], // Jangan retry untuk 401
    });
    
    if (!res.ok) {
      // 401 adalah kondisi normal ketika user belum login, bukan error
      if (res.status === 401) {
        return null;
      }
      // Untuk error lainnya, tetap throw error
      const error = await res.json();
      throw new Error(error.error || 'Terjadi kesalahan');
    }
    
    const data: AuthResponse = await res.json();
    // Konversi AuthResponse ke format yang diharapkan useSWR
    return data.user ? { user: data.user } : null;
  } catch (error) {
    // Jika error adalah 401, return null (user belum login)
    if (error instanceof Response && error.status === 401) {
      return null;
    }
    throw error;
  }
};

export function useAuth() {
  const { data, error, isLoading, mutate } = useSWR<{ user: User } | null>(
    '/api/auth/me',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 2000, // Prevent duplicate requests within 2 seconds
      errorRetryCount: 2,
      errorRetryInterval: 1000,
    }
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const login = async (email: string, password: string): Promise<void> => {
    setIsSubmitting(true);
    try {
      const res = await fetchWithCSRF('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      }, {
        maxRetries: 2,
        initialDelay: 500,
        maxDelay: 2000,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login gagal');
      }

      await mutate();
    } finally {
      setIsSubmitting(false);
    }
  };

  const register = async (
    email: string,
    username: string,
    password: string
  ): Promise<void> => {
    setIsSubmitting(true);
    try {
      const res = await fetchWithCSRF('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, username, password }),
      }, {
        maxRetries: 2,
        initialDelay: 500,
        maxDelay: 2000,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registrasi gagal');
      }

      await mutate();
    } finally {
      setIsSubmitting(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetchWithCSRF('/api/auth/logout', {
        method: 'POST',
      }, {
        maxRetries: 1, // Hanya 1 retry untuk logout
        initialDelay: 500,
        maxDelay: 1000,
      });
      clearCSRFTokenCache();
      await mutate(undefined, false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    user: data?.user,
    isLoading,
    // isAuthenticated: true jika ada user dan tidak ada error (kecuali 401 yang sudah ditangani)
    isAuthenticated: !!data?.user && !error,
    isSubmitting,
    // Hanya return error jika bukan 401 (karena 401 adalah kondisi normal)
    error: error?.message,
    login,
    register,
    logout,
    mutate,
  };
}


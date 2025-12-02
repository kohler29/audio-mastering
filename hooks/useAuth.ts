import useSWR from 'swr';
import { useState, useEffect } from 'react';
import { fetchWithCSRF, clearCSRFTokenCache } from '@/lib/apiClient';

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
  const res = await fetch(url);
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
};

export function useAuth() {
  const { data, error, isLoading, mutate } = useSWR<{ user: User } | null>(
    '/api/auth/me',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
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


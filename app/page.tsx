"use client";

import { AudioMasteringPlugin } from '@/components/AudioMasteringPlugin';
import { AuthPage } from '@/components/AuthPage';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Halaman utama - Dashboard Mastering
 * - Jika sudah login: tampilkan AudioMasteringPlugin
 * - Jika belum login: wajib login (tampilkan AuthPage)
 */
export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md p-8">
          <Skeleton className="h-20 w-20 rounded-2xl mx-auto" />
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  // Jika sudah login, tampilkan dashboard mastering
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <AudioMasteringPlugin />
      </div>
    );
  }

  // Jika belum login, wajib login
  return <AuthPage />;
}

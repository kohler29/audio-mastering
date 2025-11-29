"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';

/**
 * Halaman Logout: memanggil API logout, menampilkan skeleton,
 * lalu mengarahkan kembali ke beranda.
 */
export default function LogoutPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    let canceled = false;
    const run = async (): Promise<void> => {
      try {
        await logout();
      } finally {
        if (!canceled) {
          setIsProcessing(false);
          router.replace('/');
        }
      }
    };
    void run();
    return () => {
      canceled = true;
    };
  }, [logout, router]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md p-8">
          <Skeleton className="h-20 w-20 rounded-2xl mx-auto" />
          <Skeleton className="h-6 w-40 mx-auto" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center">
      <div className="text-center text-zinc-300">Anda telah logout.</div>
    </div>
  );
}

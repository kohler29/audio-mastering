"use client";

import { useState } from 'react';

import { AudioMasteringPlugin } from '@/components/AudioMasteringPlugin';
import { AuthPage } from '@/components/AuthPage';
import { LandingPage } from '@/components/LandingPage';
import { FeaturesPage } from '@/components/FeaturesPage';
import { DocumentationPage } from '@/components/DocumentationPage';
import { AboutPage } from '@/components/AboutPage';
import { SupportPage } from '@/components/SupportPage';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

type PublicPage =
  | 'landing'
  | 'features'
  | 'documentation'
  | 'about'
  | 'support'
  | 'auth';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const [activePage, setActivePage] = useState<PublicPage>('landing');

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

  // Setelah user login, selalu tampilkan plugin utama
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <AudioMasteringPlugin />
      </div>
    );
  }

  // Belum login → tampilkan halaman publik berdasarkan state
  if (activePage === 'features') {
    return (
      <FeaturesPage
        onBack={() => setActivePage('landing')}
        onGetStarted={() => setActivePage('auth')}
      />
    );
  }

  if (activePage === 'documentation') {
    return (
      <DocumentationPage
        onBack={() => setActivePage('landing')}
        onGetStarted={() => setActivePage('auth')}
      />
    );
  }

  if (activePage === 'about') {
    return (
      <AboutPage
        onBack={() => setActivePage('landing')}
        onGetStarted={() => setActivePage('auth')}
      />
    );
  }

  if (activePage === 'support') {
    return (
      <SupportPage
        onBack={() => setActivePage('landing')}
        onGetStarted={() => setActivePage('auth')}
      />
    );
  }

  if (activePage === 'auth') {
    return <AuthPage />;
  }

  // Default: Landing page
  return (
    <LandingPage
      onGetStarted={() => setActivePage('auth')}
      onViewFeatures={() => setActivePage('features')}
      onViewAbout={() => setActivePage('about')}
      onViewSupport={() => setActivePage('support')}
      onViewDocumentation={() => setActivePage('documentation')}
    />
  );
}

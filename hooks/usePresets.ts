"use client";

import { useCallback } from 'react';
import useSWR from 'swr';
import { useAuth } from './useAuth';
import { fetchWithCSRF } from '@/lib/apiClient';
import { fetchWithRetry } from '@/lib/utils/retry';

export interface PresetSettings {
  inputGain: number;
  outputGain: number;
  compressor: {
    enabled: boolean;
    threshold: number;
    ratio: number;
    attack: number;
    release: number;
    gain: number;
  };
  limiter: {
    enabled: boolean;
    threshold: number;
  };
  stereoWidth: {
    enabled: boolean;
    width: number;
  };
  reverb: {
    enabled: boolean;
    mix: number;
    size: number;
    decay: number;
    damping: number;
  };
  multibandCompressor?: {
    enabled: boolean;
    bands: Array<{
      name: string;
      lowFreq: number;
      highFreq: number;
      threshold: number;
      ratio: number;
      gain: number;
      active: boolean;
    }>;
  };
}

export interface Preset {
  id: string;
  name: string;
  userId: string;
  folder: string | null;
  genre: string | null;
  isPublic: boolean;
  settings: PresetSettings;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
  };
}

export interface PresetsResponse {
  presets: Preset[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UsePresetsReturn {
  presets: Preset[];
  isLoading: boolean;
  error: string | null;
  savePreset: (preset: { name: string; settings: PresetSettings; isPublic: boolean; folder?: string | null; genre?: string | null }) => Promise<Preset>;
  loadPreset: (id: string) => Promise<Preset | null>;
  deletePreset: (id: string) => Promise<boolean>;
  updatePreset: (id: string, updates: Partial<Preset>) => Promise<Preset | null>;
  bulkDeletePresets: (presetIds: string[]) => Promise<number>;
  renameFolder: (oldFolder: string | null, newFolder: string) => Promise<number>;
  deleteFolder: (folder: string, action?: 'delete' | 'move') => Promise<number>;
  refreshPresets: () => Promise<void>;
  presetNameExists: (name: string, folder?: string | null, excludeId?: string) => boolean;
  mutate: () => Promise<PresetsResponse | undefined>;
}

const fetcher = async (url: string): Promise<PresetsResponse> => {
  // Gunakan retry logic untuk fetch presets
  const res = await fetchWithRetry(url, {
    method: 'GET',
  }, {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
  });
  
  if (!res.ok) {
    // Jika masih error setelah retry, throw error
    const errorData = await res.json().catch(() => ({ error: 'Failed to load presets' }));
    throw new Error(errorData.error || 'Failed to load presets');
  }
  
  const data = await res.json();
  // Handle both old format (just presets array) and new format (with pagination)
  if (Array.isArray(data.presets)) {
    return data;
  }
  return { presets: data.presets || [] };
};

export function usePresets(): UsePresetsReturn {
  const { isAuthenticated } = useAuth();
  
  const { data, error, isLoading, mutate } = useSWR<PresetsResponse>(
    isAuthenticated ? '/api/presets' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 2000, // Prevent duplicate requests within 2 seconds
      errorRetryCount: 3,
      errorRetryInterval: 1000,
    }
  );

  const presets = data?.presets || [];
  const errorMessage = error instanceof Error ? error.message : (error ? 'Failed to load presets' : null);

  const savePreset = useCallback(async (preset: { name: string; settings: PresetSettings; isPublic: boolean; folder?: string | null; genre?: string | null }): Promise<Preset> => {
    try {
      const res = await fetchWithCSRF('/api/presets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preset),
      }, {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 10000,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to save preset' }));
        throw new Error(errorData.error || 'Failed to save preset');
      }

      const responseData = await res.json();
      const newPreset = responseData.preset;
      
      // Update SWR cache
      await mutate();
      
      return newPreset;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save preset';
      throw new Error(errorMessage);
    }
  }, [mutate]);

  const loadPresetById = useCallback(async (id: string): Promise<Preset | null> => {
    try {
      const res = await fetchWithRetry(`/api/presets/${id}`, {
        method: 'GET',
      }, {
        maxRetries: 2,
        initialDelay: 500,
        maxDelay: 2000,
      });
      if (!res.ok) {
        throw new Error('Failed to load preset');
      }
      const data = await res.json();
      return data.preset || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load preset';
      return null;
    }
  }, []);

  const deletePreset = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetchWithCSRF(`/api/presets/${id}`, {
        method: 'DELETE',
      }, {
        maxRetries: 2,
        initialDelay: 500,
        maxDelay: 2000,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete preset');
      }

      // Update SWR cache
      await mutate();
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete preset';
      throw new Error(errorMessage);
    }
  }, [mutate]);

  const updatePreset = useCallback(async (id: string, updates: Partial<Preset>): Promise<Preset | null> => {
    try {
      const res = await fetchWithCSRF(`/api/presets/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      }, {
        maxRetries: 2,
        initialDelay: 500,
        maxDelay: 2000,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update preset');
      }

      const updated = data.preset;
      
      // Update SWR cache
      await mutate();
      
      return updated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update preset';
      throw new Error(errorMessage);
    }
  }, [mutate]);

  const bulkDeletePresets = useCallback(async (presetIds: string[]): Promise<number> => {
    try {
      const res = await fetchWithCSRF('/api/presets/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ presetIds }),
      }, {
        maxRetries: 2,
        initialDelay: 1000,
        maxDelay: 5000,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete presets');
      }

      const data = await res.json();
      
      // Update SWR cache
      await mutate();
      
      return data.deletedCount || 0;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete presets';
      throw new Error(errorMessage);
    }
  }, [mutate]);

  const renameFolder = useCallback(async (oldFolder: string | null, newFolder: string): Promise<number> => {
    try {
      const res = await fetchWithCSRF('/api/presets/folders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ oldFolder, newFolder }),
      }, {
        maxRetries: 2,
        initialDelay: 500,
        maxDelay: 2000,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to rename folder');
      }

      const data = await res.json();
      
      // Update SWR cache
      await mutate();
      
      return data.updatedCount || 0;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to rename folder';
      throw new Error(errorMessage);
    }
  }, [mutate]);

  const deleteFolder = useCallback(async (folder: string, action: 'delete' | 'move' = 'move'): Promise<number> => {
    try {
      const url = `/api/presets/folders?folder=${encodeURIComponent(folder)}&action=${action}`;
      const res = await fetchWithCSRF(url, {
        method: 'DELETE',
      }, {
        maxRetries: 2,
        initialDelay: 500,
        maxDelay: 2000,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete folder');
      }

      const data = await res.json();
      
      // Update SWR cache
      await mutate();
      
      return action === 'delete' ? (data.deletedCount || 0) : (data.movedCount || 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete folder';
      throw new Error(errorMessage);
    }
  }, [mutate]);

  const checkPresetNameExists = useCallback((name: string, folder?: string | null, excludeId?: string): boolean => {
    const targetFolder = folder ?? null;
    return presets.some(p => 
      p.name === name && 
      p.folder === targetFolder && 
      p.id !== excludeId
    );
  }, [presets]);

  const refreshPresets = useCallback(async () => {
    await mutate();
  }, [mutate]);

  return {
    presets,
    isLoading,
    error: errorMessage,
    savePreset,
    loadPreset: loadPresetById,
    deletePreset,
    updatePreset,
    bulkDeletePresets,
    renameFolder,
    deleteFolder,
    refreshPresets,
    presetNameExists: checkPresetNameExists,
    mutate,
  };
}

"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { fetchWithCSRF } from '@/lib/apiClient';

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
  isPublic: boolean;
  settings: PresetSettings;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
  };
}

export interface UsePresetsReturn {
  presets: Preset[];
  isLoading: boolean;
  error: string | null;
  savePreset: (preset: { name: string; settings: PresetSettings; isPublic: boolean; folder?: string | null }) => Promise<Preset>;
  loadPreset: (id: string) => Promise<Preset | null>;
  deletePreset: (id: string) => Promise<boolean>;
  updatePreset: (id: string, updates: Partial<Preset>) => Promise<Preset | null>;
  refreshPresets: () => Promise<void>;
  presetNameExists: (name: string, folder?: string | null, excludeId?: string) => boolean;
}

export function usePresets(): UsePresetsReturn {
  const { isAuthenticated } = useAuth();
  const [presets, setPresets] = useState<Preset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshPresets = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/presets');
      if (!res.ok) {
        throw new Error('Failed to load presets');
      }
      const data = await res.json();
      setPresets(data.presets || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load presets';
      setError(errorMessage);
      setPresets([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshPresets();
  }, [refreshPresets]);

  const savePreset = useCallback(async (preset: { name: string; settings: PresetSettings; isPublic: boolean; folder?: string | null }): Promise<Preset> => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetchWithCSRF('/api/presets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preset),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to save preset' }));
        throw new Error(errorData.error || 'Failed to save preset');
      }

      const data = await res.json();

      const newPreset = data.preset;
      setPresets(prev => [newPreset, ...prev]);
      setIsLoading(false);
      return newPreset;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save preset';
      setError(errorMessage);
      setIsLoading(false);
      throw err;
    }
  }, []);

  const loadPresetById = useCallback(async (id: string): Promise<Preset | null> => {
    try {
      const res = await fetch(`/api/presets/${id}`);
      if (!res.ok) {
        throw new Error('Failed to load preset');
      }
      const data = await res.json();
      return data.preset || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load preset';
      setError(errorMessage);
      return null;
    }
  }, []);

  const deletePreset = useCallback(async (id: string): Promise<boolean> => {
    setError(null);

    try {
      const res = await fetchWithCSRF(`/api/presets/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete preset');
      }

      setPresets(prev => prev.filter(p => p.id !== id));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete preset';
      setError(errorMessage);
      return false;
    }
  }, []);

  const updatePreset = useCallback(async (id: string, updates: Partial<Preset>): Promise<Preset | null> => {
    setError(null);

    try {
      const res = await fetchWithCSRF(`/api/presets/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update preset');
      }

      const updated = data.preset;
      setPresets(prev => prev.map(p => p.id === id ? updated : p));
      return updated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update preset';
      setError(errorMessage);
      return null;
    }
  }, []);

  const checkPresetNameExists = useCallback((name: string, folder?: string | null, excludeId?: string): boolean => {
    const targetFolder = folder ?? null;
    return presets.some(p => 
      p.name === name && 
      p.folder === targetFolder && 
      p.id !== excludeId
    );
  }, [presets]);

  return {
    presets,
    isLoading,
    error,
    savePreset,
    loadPreset: loadPresetById,
    deletePreset,
    updatePreset,
    refreshPresets,
    presetNameExists: checkPresetNameExists,
  };
}

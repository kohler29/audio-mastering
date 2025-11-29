"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { AudioEngine, AudioEngineSettings, AudioAnalysisData } from '@/lib/audio/audioEngine';

export interface UseAudioEngineReturn {
  engine: AudioEngine | null;
  isInitialized: boolean;
  isLoading: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  analysisData: AudioAnalysisData | null;
  error: string | null;
  contextState: AudioContextState | null;
  loadAudioFile: (file: File) => Promise<void>;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  updateSettings: (settings: Partial<AudioEngineSettings>) => void;
  setupAudioChain: (settings: AudioEngineSettings) => void;
  exportAudio: (settings: AudioEngineSettings, format?: 'wav' | 'mp3') => Promise<Blob>;
  resumeContext: () => Promise<void>;
  getWaveformData: (width?: number) => Float32Array | null;
}

export function useAudioEngine(): UseAudioEngineReturn {
  const [engine, setEngine] = useState<AudioEngine | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [analysisData, setAnalysisData] = useState<AudioAnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [contextState, setContextState] = useState<AudioContextState | null>(null);
  const analysisFrameRef = useRef<number | null>(null);

  // Initialize audio engine
  useEffect(() => {
    const audioEngine = new AudioEngine();
    
    audioEngine.initialize()
      .then(() => {
        setEngine(audioEngine);
        setIsInitialized(true);
        setContextState(audioEngine.getContextState());
        setError(null);
      })
      .catch((err) => {
        setError(err.message || 'Failed to initialize audio engine');
        console.error('Audio engine initialization error:', err);
      });

    // Cleanup on unmount
    return () => {
      audioEngine.destroy();
    };
  }, []);

  // Setup time update callback
  useEffect(() => {
    if (!engine) return;

    engine.setOnTimeUpdate((time) => {
      setCurrentTime(time);
      setIsPlaying(engine.getIsPlaying());
    });

    return () => {
      engine.setOnTimeUpdate(() => {});
    };
  }, [engine]);

  // Real-time analysis
  useEffect(() => {
    if (!engine || !isInitialized) return;

    const updateAnalysis = () => {
      const data = engine.getAnalysisData();
      if (data) {
        setAnalysisData(data);
      }
      analysisFrameRef.current = requestAnimationFrame(updateAnalysis);
    };

    updateAnalysis();

    return () => {
      if (analysisFrameRef.current !== null) {
        cancelAnimationFrame(analysisFrameRef.current);
      }
    };
  }, [engine, isInitialized]);

  const loadAudioFile = useCallback(async (file: File) => {
    if (!engine) {
      throw new Error('Audio engine not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      await engine.loadAudioFile(file);
      setDuration(engine.getDuration());
      setCurrentTime(0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load audio file';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [engine]);

  const play = useCallback(() => {
    if (!engine) return;

    try {
      engine.play();
      setIsPlaying(true);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to play audio';
      setError(errorMessage);
    }
  }, [engine]);

  const pause = useCallback(() => {
    if (!engine) return;

    try {
      engine.pause();
      setIsPlaying(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pause audio';
      setError(errorMessage);
    }
  }, [engine]);

  const stop = useCallback(() => {
    if (!engine) return;

    try {
      engine.stop();
      setIsPlaying(false);
      setCurrentTime(0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop audio';
      setError(errorMessage);
    }
  }, [engine]);

  const seek = useCallback((time: number) => {
    if (!engine) return;

    try {
      engine.seek(time);
      setCurrentTime(time);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to seek';
      setError(errorMessage);
    }
  }, [engine]);

  const updateSettings = useCallback((settings: Partial<AudioEngineSettings>) => {
    if (!engine) return;

    try {
      engine.updateSettings(settings);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update settings';
      setError(errorMessage);
    }
  }, [engine]);

  const setupAudioChain = useCallback((settings: AudioEngineSettings) => {
    if (!engine) return;

    try {
      engine.setupAudioChain(settings);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to setup audio chain';
      setError(errorMessage);
    }
  }, [engine]);

  const exportAudio = useCallback(async (settings: AudioEngineSettings, format: 'wav' | 'mp3' = 'wav'): Promise<Blob> => {
    if (!engine) {
      throw new Error('Audio engine not initialized');
    }

    try {
      return await engine.exportAudio(settings, format);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export audio';
      setError(errorMessage);
      throw err;
    }
  }, [engine]);

  const resumeContext = useCallback(async () => {
    if (!engine) {
      throw new Error('Audio engine not initialized');
    }

    try {
      await engine.resumeContext();
      setContextState(engine.getContextState());
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resume audio context';
      setError(errorMessage);
      throw err;
    }
  }, [engine]);

  // Update context state periodically
  useEffect(() => {
    if (!engine) return;

    const interval = setInterval(() => {
      const state = engine.getContextState();
      if (state) {
        setContextState(state);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [engine]);

  const getWaveformData = useCallback((width?: number): Float32Array | null => {
    if (!engine) return null;
    return engine.getWaveformData(width);
  }, [engine]);

  return {
    engine,
    isInitialized,
    isLoading,
    isPlaying,
    currentTime,
    duration,
    analysisData,
    error,
    contextState,
    loadAudioFile,
    play,
    pause,
    stop,
    seek,
    updateSettings,
    setupAudioChain,
    exportAudio,
    resumeContext,
    getWaveformData,
  };
}


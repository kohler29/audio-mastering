"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Play, Pause, SkipBack, SkipForward, Bell, Save, Upload, Download, LogOut, X, Edit, Trash2, Folder, ChevronUp, ChevronDown } from 'lucide-react';
import { Waveform } from './audio/Waveform';
import { SpectrumAnalyzer } from './audio/SpectrumAnalyzer';
import { Knob } from './audio/Knob';
import { VUMeter } from './audio/VUMeter';
import { MultibandCompressor } from './audio/MultibandCompressor';
import { Reverb } from './audio/Reverb';
import { ExportModal } from './audio/ExportModal';
import { LoudnessMeter } from './audio/LoudnessMeter';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { usePresets, type PresetSettings } from '@/hooks/usePresets';
import { useAuth } from '@/hooks/useAuth';
import { AudioEngineSettings } from '@/lib/audio/audioEngine';
import { effectPresets, calculateLimiterGainReduction } from '@/lib/audio/audioEffects';
import { ToastContainer, type Toast } from '@/components/ui/Toast';


interface DisclaimerModalProps {
  title: string;
  text: string;
  acceptLabel: string;
  closeLabel: string;
  isOpen: boolean;
  onAccept: () => void;
  onClose: () => void;
}

/**
 * Popup disclaimer yang muncul saat user masuk dashboard.
 */
function DisclaimerModal({ title, text, acceptLabel, closeLabel, isOpen, onAccept, onClose }: DisclaimerModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-zinc-800 rounded-xl p-6 w-full max-w-md border border-zinc-700 shadow-xl">
        <h2 className="text-zinc-100 mb-2">{title}</h2>
        <p className="text-zinc-300 text-sm mb-4">{text}</p>
        <div className="flex gap-2">
          <button
            onClick={onAccept}
            className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {acceptLabel}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 px-4 py-2 rounded-lg transition-colors"
          >
            {closeLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AudioMasteringPlugin() {
  const FEATURE_REVERB = process.env.NEXT_PUBLIC_FEATURE_REVERB === 'true';
  const DISCLAIMER_TEXT = process.env.NEXT_PUBLIC_DISCLAIMER_NO_STORAGE_TEXT || 'Kami tidak menyimpan data audio apapun di website ini.';
  const DISCLAIMER_STORAGE_KEY = process.env.NEXT_PUBLIC_DISCLAIMER_STORAGE_KEY || 'DISCLAIMER_ACK';
  const DISCLAIMER_TITLE = process.env.NEXT_PUBLIC_DISCLAIMER_TITLE || 'Pernyataan Privasi & Keamanan Data';
  const DISCLAIMER_ACCEPT_LABEL = process.env.NEXT_PUBLIC_DISCLAIMER_ACCEPT_LABEL || 'Saya Mengerti';
  const DISCLAIMER_CLOSE_LABEL = process.env.NEXT_PUBLIC_DISCLAIMER_CLOSE_LABEL || 'Tutup';
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const DEFAULT_FADE_MS = Number(process.env.NEXT_PUBLIC_FADE_DURATION_MS || 3000);
  const [fadeDurationMs, setFadeDurationMs] = useState<number>(DEFAULT_FADE_MS);
  const [exportFadeInMs, setExportFadeInMs] = useState<number>(DEFAULT_FADE_MS);
  const [exportFadeOutMs, setExportFadeOutMs] = useState<number>(DEFAULT_FADE_MS);
  const {
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
    getStereoWaveformData,
    measureOfflineLoudness,
    toggleMasterBypass,
    getMasterBypassState,
  } = useAudioEngine();

  const { savePreset, presets: dbPresets, isLoading: presetsLoading, loadPreset, updatePreset, deletePreset, refreshPresets } = usePresets();
  const { user, logout } = useAuth();

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioFileName, setAudioFileName] = useState<string>('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [showEditPresetModal, setShowEditPresetModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deletingPresetId, setDeletingPresetId] = useState<string | null>(null);
  const [deletingPresetName, setDeletingPresetName] = useState<string>('');
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [presetName, setPresetName] = useState('');
  const [presetFolder, setPresetFolder] = useState<string>('');
  const [isShowingOriginal, setIsShowingOriginal] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [presetIsPublic, setPresetIsPublic] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [leftWaveformData, setLeftWaveformData] = useState<Float32Array | null>(null);
  const [rightWaveformData, setRightWaveformData] = useState<Float32Array | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Control states
  const [inputGain, setInputGain] = useState(0);
  const [outputGain, setOutputGain] = useState(0);
  const [targetLUFS, setTargetLUFS] = useState(-14);
  
  // Multiband Compressor states
  const [multibandEnabled, setMultibandEnabled] = useState(true);
  const [multibandBands, setMultibandBands] = useState([
    { name: 'LOW', color: 'rgb(239, 68, 68)', lowFreq: 20, highFreq: 150, threshold: -20, ratio: 3, gain: 0, active: true },
    { name: 'LOW-MID', color: 'rgb(234, 179, 8)', lowFreq: 150, highFreq: 800, threshold: -18, ratio: 4, gain: 0, active: true },
    { name: 'MID', color: 'rgb(34, 197, 94)', lowFreq: 800, highFreq: 3000, threshold: -15, ratio: 3.5, gain: 0, active: true },
    { name: 'HIGH-MID', color: 'rgb(59, 130, 246)', lowFreq: 3000, highFreq: 10000, threshold: -16, ratio: 3, gain: 0, active: true },
    { name: 'HIGH', color: 'rgb(168, 85, 247)', lowFreq: 10000, highFreq: 20000, threshold: -12, ratio: 2.5, gain: 0, active: true },
  ]);
  
  // Compressor states
  const [compressorEnabled, setCompressorEnabled] = useState(true);
  const [compThreshold, setCompThreshold] = useState(-20);
  const [compRatio, setCompRatio] = useState(4);
  const [compAttack, setCompAttack] = useState(10);
  const [compRelease, setCompRelease] = useState(100);
  const [compGain, setCompGain] = useState(0);
  
  // Limiter states
  const [limiterEnabled, setLimiterEnabled] = useState(true);
  const [limiterThreshold, setLimiterThreshold] = useState(-0.3);
  
  // Stereo Width states
  const [stereoEnabled, setStereoEnabled] = useState(true);
  const [stereoWidth, setStereoWidth] = useState(100);
  
  // Reverb states
  const [reverbEnabled, setReverbEnabled] = useState(true);
  const [reverbMix, setReverbMix] = useState(20);
  const [reverbSize, setReverbSize] = useState(50);
  const [reverbDecay, setReverbDecay] = useState(2.5);
  const [reverbDamping, setReverbDamping] = useState(50);
  
  
  // Vintage Drive states
  
  const presetNames = useMemo(() => [
    'Default', 
    'Mastering', 
    'Loud', 
    'Warm', 
    'Bright', 
    'Vintage',
    'Punchy',
    'Smooth',
    'Aggressive',
    'Clean',
    'Deep',
    'Crisp',
    'Wide',
    'Intimate',
    'Epic',
    'Modern',
    'Rock',
    'Electronic',
    'Acoustic',
    'Cinematic',
  ], []);
  const [selectedPreset, setSelectedPreset] = useState('default');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // Get current settings object
  const getCurrentSettings = useCallback((): AudioEngineSettings => {
    return {
      inputGain,
      outputGain,
      compressor: {
        enabled: compressorEnabled,
        threshold: compThreshold,
        ratio: compRatio,
        attack: compAttack,
        release: compRelease,
        gain: compGain,
      },
      limiter: {
        enabled: limiterEnabled,
        threshold: limiterThreshold,
      },
      stereoWidth: {
        enabled: stereoEnabled,
        width: stereoWidth,
      },
      reverb: {
        enabled: reverbEnabled,
        mix: reverbMix,
        size: reverbSize,
        decay: reverbDecay,
        damping: reverbDamping,
      },
      multibandCompressor: {
        enabled: multibandEnabled,
        bands: multibandBands.map(band => ({
          name: band.name,
          lowFreq: band.lowFreq,
          highFreq: band.highFreq,
          threshold: band.threshold,
          ratio: band.ratio,
          gain: band.gain,
          active: band.active,
        })),
      },
    };
  }, [
    inputGain, outputGain, 
    compressorEnabled, compThreshold, compRatio, compAttack, compRelease, compGain,
    limiterEnabled, limiterThreshold, 
    stereoEnabled, stereoWidth,
    reverbEnabled, reverbMix, reverbSize, reverbDecay, reverbDamping, 
    multibandEnabled, multibandBands,
  ]);

  // Setup audio chain only when file is loaded (not when settings change)
  // This prevents audio from stopping when adjusting effects during playback
  useEffect(() => {
    if (isInitialized && audioFile) {
      const settings = getCurrentSettings();
      setupAudioChain(settings);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, audioFile, setupAudioChain]); // getCurrentSettings intentionally excluded to prevent re-creating chain on every setting change

  // Update audio engine settings when controls change
  useEffect(() => {
    if (isInitialized) {
      updateSettings(getCurrentSettings());
    }
  }, [isInitialized, updateSettings, getCurrentSettings]);

  // Reset A/B state when new audio file is loaded
  useEffect(() => {
    if (audioFile && isInitialized) {
      setIsShowingOriginal(false);
      toggleMasterBypass(false);
    }
  }, [audioFile, isInitialized, toggleMasterBypass]);

  const processAudioFile = async (file: File) => {
    if (!isInitialized) {
      showToast('Audio engine sedang diinisialisasi. Silakan tunggu sebentar...', 'error');
      return;
    }

    try {
      // Pastikan playback sebelumnya berhenti sebelum memuat file baru
      stop();

      // Muat file baru ke engine
      await loadAudioFile(file);

      // Set state file di UI
      setAudioFile(file);
      setAudioFileName(file.name);

      // Rebuild audio chain untuk file baru segera
      const settings = getCurrentSettings();
      setupAudioChain(settings);

      setTimeout(() => {
        const stereoData = getStereoWaveformData(2000);
        if (stereoData) {
          setLeftWaveformData(stereoData.left);
          setRightWaveformData(stereoData.right);
        }
      }, 100);

      setCompressorEnabled(false);
      setLimiterEnabled(false);
      setStereoEnabled(false);
      setReverbEnabled(false);
      setMultibandEnabled(false);
  } catch (err) {
      console.error('Failed to load audio file:', err);
      Sentry.captureException(err, {
        tags: { component: 'AudioMasteringPlugin', action: 'loadAudioFile' },
        extra: { fileName: file?.name, fileSize: file?.size, fileType: file?.type },
      });
      const errorMessage = err instanceof Error ? err.message : 'Failed to load audio file';
      showToast(errorMessage, 'error');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processAudioFile(file);
    event.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('audio/')) {
      showToast('File harus bertipe audio', 'error');
      return;
    }
    await processAudioFile(file);
  };

  const handleFileInputClick = (e: React.MouseEvent<HTMLLabelElement>) => {
    // Prevent label click from triggering file input multiple times on mobile
    if (!isInitialized || isLoading) {
      e.preventDefault();
    }
  };

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, pause, play]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.key !== ' ') return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      e.preventDefault();
      if (!audioFile || isLoading) return;
      handlePlayPause();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [audioFile, isLoading, handlePlayPause]);

  const handleStop = () => {
    stop();
  };

  const handleToggleAB = () => {
    const newState = !isShowingOriginal;
    setIsShowingOriginal(newState);
    toggleMasterBypass(newState);
    showToast(newState ? 'Showing Original (A)' : 'Showing Mastered (B)', 'info');
  };

  const handleSeek = (time: number) => {
    seek(time);
  };

  const handleNormalizeLoudness = async () => {
    if (!audioFile) {
      showToast('Please load an audio file first.', 'error');
      return;
    }
    try {
      const settings = getCurrentSettings();
      const { integrated } = await measureOfflineLoudness(settings);
      const delta = targetLUFS - integrated;
      setOutputGain((prev) => prev + delta);
      showToast(`Normalized to ${targetLUFS} LUFS (measured ${integrated.toFixed(1)} LUFS)`, 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to normalize loudness';
      showToast(errorMessage, 'error');
    }
  };

  // Get all available presets in order (built-in + database presets)
  const getAllPresets = useCallback(() => {
    const allPresets: Array<{ type: 'built-in' | 'db'; id: string; name: string; value: string }> = [];
    
    // Add built-in presets
    presetNames.forEach(name => {
      allPresets.push({
        type: 'built-in',
        id: name.toLowerCase(),
        name,
        value: name.toLowerCase(),
      });
    });
    
    // Add user's own presets
    const myPresets = dbPresets.filter(p => p.userId === user?.id);
    const folders = Array.from(new Set(myPresets.map(p => p.folder).filter((f): f is string => f !== null)));
    folders.sort();
    
    myPresets.filter(p => !p.folder).forEach(preset => {
      allPresets.push({
        type: 'db',
        id: preset.id,
        name: preset.name,
        value: `db-${preset.id}`,
      });
    });
    
    folders.forEach(folder => {
      myPresets.filter(p => p.folder === folder).forEach(preset => {
        allPresets.push({
          type: 'db',
          id: preset.id,
          name: preset.name,
          value: `db-${preset.id}`,
        });
      });
    });
    
    // Add published presets from others
    dbPresets.filter(p => p.isPublic && p.userId !== user?.id).forEach(preset => {
      allPresets.push({
        type: 'db',
        id: preset.id,
        name: `${preset.name} by ${preset.user?.username || 'Unknown'}`,
        value: `db-${preset.id}`,
      });
    });
    
    return allPresets;
  }, [dbPresets, user?.id, presetNames]);

  const applyPresetSettings = useCallback((settings: Partial<AudioEngineSettings> | PresetSettings) => {
    setCompressorEnabled(true);
    setLimiterEnabled(true);
    setStereoEnabled(true);
    setReverbEnabled(false);
    
    if (settings.inputGain !== undefined) setInputGain(settings.inputGain);
    if (settings.outputGain !== undefined) setOutputGain(settings.outputGain);
    
    if (settings.compressor) {
      if (settings.compressor.enabled !== undefined) setCompressorEnabled(settings.compressor.enabled);
      if (settings.compressor.threshold !== undefined) setCompThreshold(settings.compressor.threshold);
      if (settings.compressor.ratio !== undefined) setCompRatio(settings.compressor.ratio);
      if (settings.compressor.attack !== undefined) setCompAttack(settings.compressor.attack);
      if (settings.compressor.release !== undefined) setCompRelease(settings.compressor.release);
      if (settings.compressor.gain !== undefined) setCompGain(settings.compressor.gain);
    }
    if (settings.limiter) {
      if (settings.limiter.enabled !== undefined) setLimiterEnabled(settings.limiter.enabled);
      if (settings.limiter.threshold !== undefined) setLimiterThreshold(settings.limiter.threshold);
    }
    if (settings.stereoWidth) {
      if (settings.stereoWidth.enabled !== undefined) setStereoEnabled(settings.stereoWidth.enabled);
      if (settings.stereoWidth.width !== undefined) setStereoWidth(settings.stereoWidth.width);
    }
    // Abaikan HAAS dari preset hingga pengembangan ulang
    // Harmonizer, reverb, dan saturation diabaikan untuk semua preset
    if (settings.multibandCompressor) {
      if (settings.multibandCompressor.enabled !== undefined) setMultibandEnabled(settings.multibandCompressor.enabled);
      if (settings.multibandCompressor.bands) {
        // Map bands to include color property
        const colors = ['rgb(239, 68, 68)', 'rgb(234, 179, 8)', 'rgb(34, 197, 94)', 'rgb(59, 130, 246)', 'rgb(168, 85, 247)'];
        const bandsWithColor = settings.multibandCompressor.bands.map((band, index) => ({
          ...band,
          color: 'color' in band && typeof band.color === 'string' ? band.color : colors[index % colors.length],
        }));
        setMultibandBands(bandsWithColor);
      }
    }
  }, []);

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const handlePresetChange = useCallback(async (value: string) => {
    // Check if it's a database preset (starts with "db-")
    if (value.startsWith('db-')) {
      const presetId = value.replace('db-', '');
      setSelectedPresetId(presetId);
      setSelectedPreset('');
      
      try {
        const preset = await loadPreset(presetId);
        if (preset && preset.settings) {
          applyPresetSettings(preset.settings);
          showToast(`Loaded preset: ${preset.name}${preset.user ? ` by ${preset.user.username}` : ''}`, 'success');
        }
      } catch (err) {
        console.error('Failed to load preset:', err);
        Sentry.captureException(err, {
          tags: { component: 'AudioMasteringPlugin', action: 'loadPreset' },
          extra: { presetId },
        });
        showToast('Failed to load preset', 'error');
      }
    } else {
      // Built-in preset
      setSelectedPreset(value);
      setSelectedPresetId(null);
      
      const preset = effectPresets[value.toLowerCase()];
      if (preset && preset.settings) {
        const convertedSettings: Partial<AudioEngineSettings> = {
          ...(preset.settings.compressor && {
            compressor: {
              enabled: true,
              threshold: preset.settings.compressor.threshold,
              ratio: preset.settings.compressor.ratio,
              attack: preset.settings.compressor.attack,
              release: preset.settings.compressor.release,
              gain: preset.settings.compressor.gain || 0,
            },
          }),
          ...(preset.settings.limiter && {
            limiter: {
              enabled: preset.settings.limiter.enabled,
              threshold: preset.settings.limiter.threshold,
            },
          }),
          ...(preset.settings.stereoWidth && {
            stereoWidth: {
              enabled: preset.settings.stereoWidth.enabled,
              width: preset.settings.stereoWidth.width,
            },
          }),
          ...(preset.settings.multibandCompressor && {
            multibandCompressor: {
              enabled: preset.settings.multibandCompressor.enabled,
              bands: preset.settings.multibandCompressor.bands,
            },
          }),
        };
        applyPresetSettings(convertedSettings);
      }
    }
  }, [loadPreset, applyPresetSettings, showToast]);

  const handlePresetNavigate = useCallback((direction: 'next' | 'prev') => {
    const allPresets = getAllPresets();
    if (allPresets.length === 0) return;
    
    const currentValue = selectedPresetId ? `db-${selectedPresetId}` : selectedPreset;
    const currentIndex = allPresets.findIndex(p => p.value === currentValue);
    
    if (currentIndex === -1) {
      // If current preset not found, start from first
      handlePresetChange(allPresets[0].value);
      return;
    }
    
    let newIndex: number;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % allPresets.length;
    } else {
      newIndex = currentIndex === 0 ? allPresets.length - 1 : currentIndex - 1;
    }
    
    handlePresetChange(allPresets[newIndex].value);
  }, [selectedPresetId, selectedPreset, getAllPresets, handlePresetChange]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      showToast('Masukkan nama preset', 'error');
      return;
    }

    try {
      const settings = getCurrentSettings();
      await savePreset({
        name: presetName,
        settings,
        isPublic: presetIsPublic,
        folder: presetFolder.trim() || null,
      });
      setShowSavePresetModal(false);
      setPresetName('');
      setPresetFolder('');
      setPresetIsPublic(false);
      await refreshPresets();
      showToast(`Preset "${presetName}" berhasil disimpan!`, 'success');
    } catch (err) {
      console.error('Failed to save preset:', err);
      Sentry.captureException(err, {
        tags: { component: 'AudioMasteringPlugin', action: 'savePreset' },
        extra: { presetName, isPublic: presetIsPublic, folder: presetFolder },
      });
      showToast(err instanceof Error ? err.message : 'Gagal menyimpan preset', 'error');
    }
  };

  const handleEditPreset = (presetId: string) => {
    const preset = dbPresets.find(p => p.id === presetId);
    if (!preset || preset.userId !== user?.id) {
      showToast('Tidak memiliki izin untuk mengedit preset ini', 'error');
      return;
    }
    setEditingPresetId(presetId);
    setPresetName(preset.name);
    setPresetFolder(preset.folder || '');
    setPresetIsPublic(preset.isPublic);
    setShowEditPresetModal(true);
  };

  const handleUpdatePreset = async () => {
    if (!editingPresetId || !presetName.trim()) {
      showToast('Masukkan nama preset', 'error');
      return;
    }

    try {
      const settings = getCurrentSettings();
      await updatePreset(editingPresetId, {
        name: presetName,
        settings,
        isPublic: presetIsPublic,
        folder: presetFolder.trim() || null,
      });
      setShowEditPresetModal(false);
      setEditingPresetId(null);
      setPresetName('');
      setPresetFolder('');
      setPresetIsPublic(false);
      await refreshPresets();
      showToast(`Preset "${presetName}" berhasil diupdate!`, 'success');
    } catch (err) {
      console.error('Failed to update preset:', err);
      Sentry.captureException(err, {
        tags: { component: 'AudioMasteringPlugin', action: 'updatePreset' },
        extra: { presetId: editingPresetId, presetName, isPublic: presetIsPublic, folder: presetFolder },
      });
      showToast(err instanceof Error ? err.message : 'Gagal mengupdate preset', 'error');
    }
  };

  const handleDeletePresetClick = (presetId: string) => {
    const preset = dbPresets.find(p => p.id === presetId);
    if (!preset || preset.userId !== user?.id) {
      showToast('Tidak memiliki izin untuk menghapus preset ini', 'error');
      return;
    }
    setDeletingPresetId(presetId);
    setDeletingPresetName(preset.name);
    setShowDeleteConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingPresetId) return;

    try {
      const success = await deletePreset(deletingPresetId);
      if (success) {
        await refreshPresets();
        showToast(`Preset "${deletingPresetName}" berhasil dihapus!`, 'success');
        if (selectedPresetId === deletingPresetId) {
          setSelectedPresetId(null);
          setSelectedPreset('default');
        }
      } else {
        showToast('Gagal menghapus preset', 'error');
      }
    } catch (err) {
      console.error('Failed to delete preset:', err);
      Sentry.captureException(err, {
        tags: { component: 'AudioMasteringPlugin', action: 'deletePreset' },
        extra: { presetId: deletingPresetId },
      });
      showToast('Gagal menghapus preset', 'error');
    } finally {
      setShowDeleteConfirmModal(false);
      setDeletingPresetId(null);
      setDeletingPresetName('');
    }
  };

  const handleExportWithFormat = async (format: string, quality: string) => {
    try {
      if (!audioFile) {
        showToast('Please load an audio file first.', 'error');
        return;
      }

      const settings = getCurrentSettings();
      const exportSettings = { ...settings, exportFadeInMs, exportFadeOutMs };
      console.log('Exporting with settings:', exportSettings);
      
      const blob = await exportAudio(exportSettings, format as 'wav' | 'mp3' | 'flac');
      
      if (!blob || blob.size === 0) {
        throw new Error('Exported blob is empty');
      }
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = audioFileName 
        ? `${audioFileName.replace(/\.[^/.]+$/, '')}_mastered.${format}`
        : `mastered.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const qualityLabel = format === 'mp3' ? '320 kbps' : format === 'flac' ? 'lossless' : quality;
      showToast(`Export successful! Audio exported as ${format.toUpperCase()}${qualityLabel ? ` (${qualityLabel})` : ''}.`, 'success');
    } catch (err) {
      console.error('Export failed:', err);
      Sentry.captureException(err, {
        tags: { component: 'AudioMasteringPlugin', action: 'exportAudio' },
        extra: { format, quality, audioFileName },
      });
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      showToast(`Failed to export audio: ${errorMessage}. Please try again.`, 'error');
    }
  };

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const acknowledged = window.localStorage.getItem(DISCLAIMER_STORAGE_KEY);
        if (!acknowledged) {
          setShowDisclaimer(true);
        }
        
        // Check if user has seen latest changelog
        const CHANGELOG_VERSION = 'v2.1.0'; // Update this when adding new features
        const CHANGELOG_STORAGE_KEY = 'CHANGELOG_VIEWED';
        const lastViewedVersion = window.localStorage.getItem(CHANGELOG_STORAGE_KEY);
        if (lastViewedVersion !== CHANGELOG_VERSION) {
          setShowChangelog(true);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, [DISCLAIMER_STORAGE_KEY]);

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-zinc-800 via-zinc-900 to-zinc-950 border border-zinc-700/60 shadow-2xl px-4 py-6 md:p-8">
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6 mb-6">
        <div className="order-1 md:order-0">
          <h1 className="text-zinc-100 tracking-wider">MASTER PRO</h1>
          <p className="text-zinc-500 text-xs mt-1">Professional Audio Mastering Plugin</p>
          {audioFileName && (
            <p className="text-cyan-400 text-xs mt-1">📁 {audioFileName}</p>
          )}
          {!isInitialized && (
            <p className="text-yellow-400 text-xs mt-1">Initializing audio engine...</p>
          )}
          {isInitialized && contextState === 'suspended' && (
            <div className="mt-2">
              <button
                onClick={async () => {
                  try {
                    await resumeContext();
                    showToast('Audio engine activated!', 'success');
                  } catch {
                    showToast('Failed to activate audio engine', 'error');
                  }
                }}
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded text-xs transition-colors"
              >
                Activate Audio Engine
              </button>
            </div>
          )}
          {isLoading && (
            <p className="text-yellow-400 text-xs mt-1">Loading audio...</p>
          )}
        </div>
        <div className="flex items-center gap-2 md:gap-4 flex-wrap md:flex-nowrap order-2 md:order-0 w-full md:w-auto overflow-x-auto whitespace-nowrap">
          {/* Upload Button */}
          <label 
            aria-label="Upload audio file" 
            onClick={handleFileInputClick}
            className={`bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-500 text-zinc-100 px-4 py-2 rounded-lg border border-zinc-600 transition-colors flex items-center gap-2 touch-manipulation ${
              !isInitialized || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span className="text-sm">Upload</span>
            <input
              type="file"
              accept="audio/*,.mp3,.wav,.flac,.ogg,.aac,.m4a,.mp4"
              onChange={handleFileUpload}
              className="hidden"
              disabled={!isInitialized || isLoading}
              aria-label="Choose audio file"
              multiple={false}
            />
          </label>

          {/* Export Button */}
          <button 
            onClick={() => setShowExportModal(true)}
            disabled={!audioFile || isLoading}
            aria-label="Export mastered audio"
            className="bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg border border-emerald-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Export</span>
          </button>

          <div className="relative flex items-center gap-1">
            <button
              onClick={() => handlePresetNavigate('prev')}
              disabled={presetsLoading}
              className="bg-zinc-700 hover:bg-zinc-600 text-zinc-100 p-1.5 rounded-lg border border-zinc-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Preset Sebelumnya (↑)"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <select 
              value={selectedPresetId ? `db-${selectedPresetId}` : selectedPreset}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="bg-zinc-700 text-zinc-100 px-3 md:px-4 py-2 rounded-lg border border-zinc-600 focus:outline-none focus:border-cyan-500 text-sm min-w-[140px] sm:min-w-[180px] md:min-w-[200px]"
              disabled={presetsLoading}
            >
              <optgroup label="Built-in Presets">
                {presetNames.map(p => (
                  <option key={p} value={p.toLowerCase()}>{p}</option>
                ))}
              </optgroup>
              {(() => {
                const myPresets = dbPresets.filter(p => p.userId === user?.id);
                const folders = Array.from(new Set(myPresets.map(p => p.folder).filter((f): f is string => f !== null)));
                folders.sort();
                
                if (myPresets.length > 0) {
                  return (
                    <>
                      {myPresets.filter(p => !p.folder).length > 0 && (
                        <optgroup label="My Presets">
                          {myPresets.filter(p => !p.folder).map(p => (
                            <option key={p.id} value={`db-${p.id}`}>
                              {p.name} {p.isPublic ? '🌐' : '🔒'}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {folders.map(folder => (
                        <optgroup key={folder} label={`📁 ${folder}`}>
                          {myPresets.filter(p => p.folder === folder).map(p => (
                            <option key={p.id} value={`db-${p.id}`}>
                              {p.name} {p.isPublic ? '🌐' : '🔒'}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </>
                  );
                }
                return null;
              })()}
              {dbPresets.filter(p => p.isPublic && p.userId !== user?.id).length > 0 && (
                <optgroup label="Published by Others">
                  {dbPresets.filter(p => p.isPublic && p.userId !== user?.id).map(p => (
                    <option key={p.id} value={`db-${p.id}`}>
                      {p.name} by {p.user?.username || 'Unknown'}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <button
              onClick={() => handlePresetNavigate('next')}
              disabled={presetsLoading}
              className="bg-zinc-700 hover:bg-zinc-600 text-zinc-100 p-1.5 rounded-lg border border-zinc-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Preset Berikutnya (↓)"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            {selectedPresetId && dbPresets.find(p => p.id === selectedPresetId && p.userId === user?.id) && (
              <div className="flex gap-1">
                <button
                  onClick={() => handleEditPreset(selectedPresetId)}
                  className="bg-zinc-700 hover:bg-zinc-600 text-zinc-100 p-2 rounded-lg border border-zinc-600 transition-colors"
                  title="Edit Preset"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeletePresetClick(selectedPresetId)}
                  className="bg-red-700 hover:bg-red-600 text-white p-2 rounded-lg border border-red-600 transition-colors"
                  title="Delete Preset"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          <button 
            onClick={() => setShowSavePresetModal(true)}
            aria-label="Save preset"
            className="bg-zinc-700 hover:bg-zinc-600 text-zinc-100 p-2 rounded-lg border border-zinc-600 transition-colors"
            title="Save Preset"
          >
            <Save className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setShowChangelog(true)}
            aria-label="What's New"
            className="bg-zinc-700 hover:bg-zinc-600 text-zinc-100 p-2 rounded-lg border border-zinc-600 transition-colors relative"
            title="What's New - Latest Features"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
          </button>
          <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 rounded-lg border border-zinc-700 max-w-full">
            <span className="text-zinc-400 text-xs">{user?.username}</span>
          </div>
          <button 
            onClick={logout}
            aria-label="Logout"
            className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-lg border border-red-600 transition-colors flex items-center gap-2"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </div>

      {/* Disclaimer Popup */}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column - Input/Output & Meters */}
        <div className="col-span-12 md:col-span-3 lg:col-span-2 space-y-4">
          <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
            <h3 className="text-zinc-400 text-xs mb-3 tracking-wider">INPUT</h3>
            <Knob 
              value={inputGain} 
              onChange={setInputGain}
              min={-24}
              max={24}
              label="GAIN"
              unit="dB"
            />
            <div className="mt-2 flex justify-center">
              <input
                type="number"
                step="0.1"
                value={inputGain}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (!isNaN(val)) {
                    setInputGain(Math.max(-24, Math.min(24, val)));
                  }
                }}
                className="w-20 bg-zinc-700 text-zinc-100 px-2 py-1 rounded border border-zinc-600 focus:outline-none focus:border-cyan-500 text-xs text-center"
              />
              <span className="text-zinc-500 text-xs ml-1 self-center">dB</span>
            </div>
          </div>
          
          <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
            <h3 className="text-zinc-400 text-xs mb-3 tracking-wider">METERS</h3>
            <div className="flex gap-2 justify-center h-40">
              <VUMeter 
                label="L" 
                value={analysisData?.vuLeft ?? -60} 
              />
              <VUMeter 
                label="R" 
                value={analysisData?.vuRight ?? -60} 
              />
            </div>
          </div>

          <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
            <h3 className="text-zinc-400 text-xs mb-3 tracking-wider">OUTPUT</h3>
            <Knob 
              value={outputGain} 
              onChange={setOutputGain}
              min={-24}
              max={24}
              label="GAIN"
              unit="dB"
            />
            <div className="mt-2 flex justify-center">
              <input
                type="number"
                step="0.1"
                value={outputGain}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (!isNaN(val)) {
                    setOutputGain(Math.max(-24, Math.min(24, val)));
                  }
                }}
                className="w-20 bg-zinc-700 text-zinc-100 px-2 py-1 rounded border border-zinc-600 focus:outline-none focus:border-cyan-500 text-xs text-center"
              />
              <span className="text-zinc-500 text-xs ml-1 self-center">dB</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div>
                <label className="text-zinc-400 text-xs block mb-1">Target LUFS</label>
                <input
                  type="number"
                  step="0.1"
                  value={targetLUFS}
                  onChange={(e) => setTargetLUFS(Number(e.target.value))}
                  className="w-full bg-zinc-700 text-zinc-100 px-3 py-2 rounded border border-zinc-600 focus:outline-none focus:border-cyan-500 text-xs"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleNormalizeLoudness}
                  disabled={!audioFile || isLoading}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-2 rounded border border-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                >
                  Normalize
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column - Visualizers & Multiband Compressor */}
        <div className="col-span-12 md:col-span-6 lg:col-span-7 space-y-4">
          {/* Waveform Display */}
          <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700 relative">
            <div className="flex flex-col gap-3 mb-3">
              <div className="flex items-center justify-between">
                <h3 className="text-zinc-400 text-xs tracking-wider">WAVEFORM</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* Playback Controls */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleSeek(0)}
                    aria-label="Seek to start"
                    className="bg-zinc-700 hover:bg-zinc-600 text-zinc-300 p-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!audioFile || isLoading}
                  >
                    <SkipBack className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={handlePlayPause}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white p-1.5 rounded transition-colors disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed"
                    disabled={!audioFile || isLoading}
                    title={isPlaying ? 'Pause (Spasi)' : 'Play (Spasi)'}
                  >
                    {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  </button>
                  <button 
                    onClick={handleStop}
                    aria-label="Stop"
                    className="bg-zinc-700 hover:bg-zinc-600 text-zinc-300 p-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!audioFile || isLoading}
                  >
                    <SkipForward className="w-3 h-3" />
                  </button>
                </div>
                {/* A/B Toggle */}
                <button
                  onClick={handleToggleAB}
                  aria-label={isShowingOriginal ? 'Show Mastered (B)' : 'Show Original (A)'}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isShowingOriginal
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-purple-600 hover:bg-purple-500 text-white'
                  }`}
                  disabled={!audioFile || isLoading}
                  title={isShowingOriginal ? 'Currently showing Original (A) - Click to show Mastered (B)' : 'Currently showing Mastered (B) - Click to show Original (A)'}
                >
                  {isShowingOriginal ? 'A' : 'B'}
                </button>
                {/* Fade Controls */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={10000}
                      step={100}
                      value={fadeDurationMs}
                      onChange={(e) => setFadeDurationMs(Number(e.target.value))}
                      className="w-16 sm:w-20 bg-zinc-700 text-zinc-100 px-2 py-1 rounded border border-zinc-600 focus:outline-none focus:border-cyan-500 text-xs"
                    />
                    <span className="text-zinc-500 text-xs whitespace-nowrap">ms</span>
                  </div>
                  <button
                    onClick={() => { setExportFadeInMs(fadeDurationMs); showToast(`Fade In export: ${fadeDurationMs} ms`, 'info'); }}
                    className="bg-emerald-700 hover:bg-emerald-600 text-white px-2 py-1 rounded text-xs border border-emerald-600 whitespace-nowrap"
                    disabled={!audioFile || isLoading}
                  >
                    Fade In
                  </button>
                  <button
                    onClick={() => { setExportFadeOutMs(fadeDurationMs); showToast(`Fade Out export: ${fadeDurationMs} ms`, 'info'); }}
                    className="bg-red-700 hover:bg-red-600 text-white px-2 py-1 rounded text-xs border border-red-600 whitespace-nowrap"
                    disabled={!audioFile || isLoading}
                  >
                    Fade Out
                  </button>
                </div>
              </div>
            </div>
            <Waveform 
              isPlaying={isPlaying} 
              leftWaveformData={leftWaveformData}
              rightWaveformData={rightWaveformData}
              currentTime={currentTime}
              duration={duration}
              onSeek={seek}
            />
            {isLoading && (
              <div className="absolute inset-0 m-4 rounded-xl bg-zinc-900/60 flex items-center justify-center">
                <div className="w-3/4 h-24 md:h-28 grid grid-cols-8 gap-2 animate-pulse">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="bg-zinc-700/60 rounded" />
                  ))}
                </div>
              </div>
            )}
            {!audioFile && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`absolute inset-0 flex items-center justify-center rounded-xl m-4 border-2 border-dashed transition-colors ${dragActive ? 'border-cyan-500 bg-cyan-900/20' : 'border-zinc-700 bg-zinc-900/80'}`}
              >
                <div className="text-center">
                  <Upload className={`w-8 h-8 mx-auto mb-2 ${dragActive ? 'text-cyan-400' : 'text-zinc-600'}`} />
                  <p className="text-zinc-500 text-sm">Upload an audio file to start mastering</p>
                  <p className="text-zinc-600 text-xs mt-1">Drag & Drop file audio di sini</p>
                </div>
              </div>
            )}
          </div>

          {/* Spectrum Analyzer */}
          <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
            <h3 className="text-zinc-400 text-xs tracking-wider mb-3">SPECTRUM ANALYZER</h3>
            <SpectrumAnalyzer isPlaying={isPlaying} analysisData={analysisData} loading={isLoading} />
          </div>

          {/* Loudness Meter */}
          <LoudnessMeter analysisData={analysisData} />

          {/* Multiband Compressor */}
          <div className={`bg-zinc-800/50 rounded-xl p-4 border ${multibandEnabled ? 'border-zinc-700' : 'border-zinc-800 opacity-60'}`}>
            <MultibandCompressor 
              enabled={multibandEnabled}
              onToggle={setMultibandEnabled}
              bands={multibandBands}
              onBandsChange={setMultibandBands}
            />
          </div>
        </div>

        {/* Right Column - Processing Controls */}
        <div className="col-span-12 md:col-span-3 space-y-4">
          {/* Compressor */}
          <div className={`bg-zinc-800/50 rounded-xl p-4 border ${compressorEnabled ? 'border-zinc-700' : 'border-zinc-800 opacity-60'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-zinc-400 text-xs tracking-wider">COMPRESSOR</h3>
              <button
                onClick={() => setCompressorEnabled(!compressorEnabled)}
                className={`px-3 py-1 rounded text-xs transition-all ${
                  compressorEnabled 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' 
                    : 'bg-zinc-700 text-zinc-400'
                }`}
              >
                {compressorEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className={`grid grid-cols-2 gap-4 ${!compressorEnabled ? 'pointer-events-none opacity-50' : ''}`}>
              <div className="flex flex-col items-center">
                <Knob 
                  value={compThreshold} 
                  onChange={setCompThreshold}
                  min={-60}
                  max={0}
                  label="THRESHOLD"
                  unit="dB"
                  size="small"
                />
                <input
                  type="number"
                  step="0.1"
                  value={compThreshold}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!isNaN(val)) {
                      setCompThreshold(Math.max(-60, Math.min(0, val)));
                    }
                  }}
                  className="w-16 mt-1 bg-zinc-700 text-zinc-100 px-1.5 py-0.5 rounded border border-zinc-600 focus:outline-none focus:border-cyan-500 text-xs text-center"
                />
              </div>
              <div className="flex flex-col items-center">
                <Knob 
                  value={compRatio} 
                  onChange={setCompRatio}
                  min={1}
                  max={20}
                  label="RATIO"
                  unit=":1"
                  size="small"
                />
                <input
                  type="number"
                  step="0.1"
                  value={compRatio}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!isNaN(val)) {
                      setCompRatio(Math.max(1, Math.min(20, val)));
                    }
                  }}
                  className="w-16 mt-1 bg-zinc-700 text-zinc-100 px-1.5 py-0.5 rounded border border-zinc-600 focus:outline-none focus:border-cyan-500 text-xs text-center"
                />
              </div>
              <div className="flex flex-col items-center">
                <Knob 
                  value={compAttack} 
                  onChange={setCompAttack}
                  min={0.1}
                  max={100}
                  label="ATTACK"
                  unit="ms"
                  size="small"
                />
                <input
                  type="number"
                  step="0.1"
                  value={compAttack}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!isNaN(val)) {
                      setCompAttack(Math.max(0.1, Math.min(100, val)));
                    }
                  }}
                  className="w-16 mt-1 bg-zinc-700 text-zinc-100 px-1.5 py-0.5 rounded border border-zinc-600 focus:outline-none focus:border-cyan-500 text-xs text-center"
                />
              </div>
              <div className="flex flex-col items-center">
                <Knob 
                  value={compRelease} 
                  onChange={setCompRelease}
                  min={10}
                  max={1000}
                  label="RELEASE"
                  unit="ms"
                  size="small"
                />
                <input
                  type="number"
                  step="1"
                  value={compRelease}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!isNaN(val)) {
                      setCompRelease(Math.max(10, Math.min(1000, val)));
                    }
                  }}
                  className="w-16 mt-1 bg-zinc-700 text-zinc-100 px-1.5 py-0.5 rounded border border-zinc-600 focus:outline-none focus:border-cyan-500 text-xs text-center"
                />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-zinc-700">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 text-xs">GAIN REDUCTION</span>
                <div className="flex items-center gap-2">
                  <Knob 
                    value={compGain} 
                    onChange={setCompGain}
                    min={-12}
                    max={12}
                    label=""
                    unit="dB"
                    size="small"
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={compGain}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (!isNaN(val)) {
                        setCompGain(Math.max(-12, Math.min(12, val)));
                      }
                    }}
                    className="w-16 bg-zinc-700 text-zinc-100 px-1.5 py-0.5 rounded border border-zinc-600 focus:outline-none focus:border-cyan-500 text-xs text-center"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Limiter */}
          <div className={`bg-zinc-800/50 rounded-xl p-4 border ${limiterEnabled ? 'border-zinc-700' : 'border-zinc-800 opacity-60'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-zinc-400 text-xs tracking-wider">LIMITER</h3>
              <button
                onClick={() => setLimiterEnabled(!limiterEnabled)}
                className={`px-3 py-1 rounded text-xs transition-all ${
                  limiterEnabled 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' 
                    : 'bg-zinc-700 text-zinc-400'
                }`}
              >
                {limiterEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className={`flex flex-col items-center ${!limiterEnabled ? 'pointer-events-none opacity-50' : ''}`}>
              <Knob 
                value={limiterThreshold} 
                onChange={setLimiterThreshold}
                min={-12}
                max={0}
                label="CEILING"
                unit="dB"
              />
              <input
                type="number"
                step="0.1"
                value={limiterThreshold}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (!isNaN(val)) {
                    setLimiterThreshold(Math.max(-12, Math.min(0, val)));
                  }
                }}
                className="w-20 mt-2 bg-zinc-700 text-zinc-100 px-2 py-1 rounded border border-zinc-600 focus:outline-none focus:border-cyan-500 text-xs text-center"
              />
            </div>
            <div className="mt-3 pt-3 border-t border-zinc-700">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-xs">Reduction</span>
                <span className="text-red-400 text-xs">
                  {(() => {
                    if (!limiterEnabled || !analysisData) return '0.0 dB';
                    // Calculate peak level from analysis data
                    const peakLeft = analysisData.vuLeft;
                    const peakRight = analysisData.vuRight;
                    const peakLevel = Math.max(peakLeft, peakRight);
                    const reduction = calculateLimiterGainReduction(peakLevel, limiterThreshold);
                    return reduction > 0 ? `-${reduction.toFixed(1)} dB` : '0.0 dB';
                  })()}
                </span>
              </div>
            </div>
          </div>

          {/* Stereo Width */}
          <div className={`bg-zinc-800/50 rounded-xl p-4 border ${stereoEnabled ? 'border-zinc-700' : 'border-zinc-800 opacity-60'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-zinc-400 text-xs tracking-wider">STEREO</h3>
              <button
                onClick={() => setStereoEnabled(!stereoEnabled)}
                className={`px-3 py-1 rounded text-xs transition-all ${
                  stereoEnabled 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' 
                    : 'bg-zinc-700 text-zinc-400'
                }`}
              >
                {stereoEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className={`flex flex-col items-center ${!stereoEnabled ? 'pointer-events-none opacity-50' : ''}`}>
              <Knob 
                value={stereoWidth} 
                onChange={setStereoWidth}
                min={0}
                max={200}
                label="WIDTH"
                unit="%"
              />
              <input
                type="number"
                step="1"
                value={stereoWidth}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (!isNaN(val)) {
                    setStereoWidth(Math.max(0, Math.min(200, val)));
                  }
                }}
                className="w-20 mt-2 bg-zinc-700 text-zinc-100 px-2 py-1 rounded border border-zinc-600 focus:outline-none focus:border-cyan-500 text-xs text-center"
              />
            </div>
          </div>


          {FEATURE_REVERB && (
            <Reverb 
              enabled={reverbEnabled}
              onToggle={setReverbEnabled}
              mix={reverbMix}
              setMix={setReverbMix}
              size={reverbSize}
              setSize={setReverbSize}
              decay={reverbDecay}
              setDecay={setReverbDecay}
              damping={reverbDamping}
              setDamping={setReverbDamping}
            />
          )}


        </div>
      </div>

      {/* Export Modal */}
      <ExportModal 
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExportWithFormat}
      />

      {/* Save Preset Modal */}
      {showSavePresetModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-zinc-800 rounded-xl p-6 w-full max-w-md border border-zinc-700">
            <h2 className="text-zinc-100 mb-4">Simpan Preset</h2>
            <div className="mb-4">
              <label className="text-zinc-300 text-sm block mb-2">Nama Preset</label>
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Nama preset"
                className="w-full bg-zinc-700 text-zinc-100 px-4 py-2 rounded-lg border border-zinc-600 focus:outline-none focus:border-cyan-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSavePreset();
                  }
                }}
              />
            </div>
            <div className="mb-4">
              <label className="text-zinc-300 text-sm flex items-center gap-2 mb-2">
                <Folder className="w-4 h-4" />
                Folder (opsional)
              </label>
              <input
                type="text"
                value={presetFolder}
                onChange={(e) => setPresetFolder(e.target.value)}
                placeholder="Nama folder"
                className="w-full bg-zinc-700 text-zinc-100 px-4 py-2 rounded-lg border border-zinc-600 focus:outline-none focus:border-cyan-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSavePreset();
                  }
                }}
              />
              <p className="text-zinc-500 text-xs mt-1">
                Kosongkan jika tidak ingin menggunakan folder
              </p>
            </div>
            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={presetIsPublic}
                  onChange={(e) => setPresetIsPublic(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-600 bg-zinc-700 text-cyan-600 focus:ring-cyan-500 focus:ring-2"
                />
                <span className="text-zinc-300 text-sm">
                  Publish preset (dapat digunakan oleh user lain)
                </span>
              </label>
              {presetIsPublic && (
                <p className="text-zinc-500 text-xs mt-2 ml-6">
                  Preset yang dipublish akan terlihat dan dapat digunakan oleh semua user
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSavePreset}
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Simpan
              </button>
              <button
                onClick={() => {
                  setShowSavePresetModal(false);
                  setPresetName('');
                  setPresetFolder('');
                  setPresetIsPublic(false);
                }}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 px-4 py-2 rounded-lg transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Preset Modal */}
      {showEditPresetModal && editingPresetId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-zinc-800 rounded-xl p-6 w-full max-w-md border border-zinc-700">
            <h2 className="text-zinc-100 mb-4">Edit Preset</h2>
            <div className="mb-4">
              <label className="text-zinc-300 text-sm block mb-2">Nama Preset</label>
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Nama preset"
                className="w-full bg-zinc-700 text-zinc-100 px-4 py-2 rounded-lg border border-zinc-600 focus:outline-none focus:border-cyan-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUpdatePreset();
                  }
                }}
              />
            </div>
            <div className="mb-4">
              <label className="text-zinc-300 text-sm flex items-center gap-2 mb-2">
                <Folder className="w-4 h-4" />
                Folder (opsional)
              </label>
              <input
                type="text"
                value={presetFolder}
                onChange={(e) => setPresetFolder(e.target.value)}
                placeholder="Nama folder"
                className="w-full bg-zinc-700 text-zinc-100 px-4 py-2 rounded-lg border border-zinc-600 focus:outline-none focus:border-cyan-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUpdatePreset();
                  }
                }}
              />
              <p className="text-zinc-500 text-xs mt-1">
                Kosongkan jika tidak ingin menggunakan folder
              </p>
            </div>
            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={presetIsPublic}
                  onChange={(e) => setPresetIsPublic(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-600 bg-zinc-700 text-cyan-600 focus:ring-cyan-500 focus:ring-2"
                />
                <span className="text-zinc-300 text-sm">
                  Publish preset (dapat digunakan oleh user lain)
                </span>
              </label>
              {presetIsPublic && (
                <p className="text-zinc-500 text-xs mt-2 ml-6">
                  Preset yang dipublish akan terlihat dan dapat digunakan oleh semua user
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleUpdatePreset}
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Update
              </button>
              <button
                onClick={() => {
                  setShowEditPresetModal(false);
                  setEditingPresetId(null);
                  setPresetName('');
                  setPresetFolder('');
                  setPresetIsPublic(false);
                }}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 px-4 py-2 rounded-lg transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-zinc-800 rounded-xl p-6 w-full max-w-md border border-zinc-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-900/30 p-2 rounded-lg">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h2 className="text-zinc-100 text-xl font-semibold">Hapus Preset</h2>
            </div>
            <p className="text-zinc-300 mb-2">
              Apakah Anda yakin ingin menghapus preset <span className="font-semibold text-zinc-100">&quot;{deletingPresetName}&quot;</span>?
            </p>
            <p className="text-zinc-500 text-sm mb-6">
              Tindakan ini tidak dapat dibatalkan. Preset akan dihapus secara permanen.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleConfirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                Ya, Hapus
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setDeletingPresetId(null);
                  setDeletingPresetName('');
                }}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 px-4 py-2 rounded-lg transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer Modal */}
      <DisclaimerModal
        title={DISCLAIMER_TITLE}
        text={DISCLAIMER_TEXT}
        acceptLabel={DISCLAIMER_ACCEPT_LABEL}
        closeLabel={DISCLAIMER_CLOSE_LABEL}
        isOpen={showDisclaimer}
        onAccept={() => {
          try {
            if (typeof window !== 'undefined') {
              window.localStorage.setItem(DISCLAIMER_STORAGE_KEY, '1');
            }
          } catch {
            // Ignore storage errors
          }
          setShowDisclaimer(false);
        }}
        onClose={() => setShowDisclaimer(false)}
      />

      {/* Changelog Modal */}
      {showChangelog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-zinc-800 rounded-xl p-6 w-full max-w-2xl border border-zinc-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-zinc-100 text-xl font-semibold flex items-center gap-2">
                <Bell className="w-5 h-5 text-cyan-400" />
                What&apos;s New
              </h2>
              <button 
                onClick={() => {
                  setShowChangelog(false);
                  try {
                    if (typeof window !== 'undefined') {
                      window.localStorage.setItem('CHANGELOG_VIEWED', 'v2.1.0');
                    }
                  } catch {
                    // Ignore storage errors
                  }
                }}
                className="text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                <h3 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
                  <span className="text-lg">📁</span> Preset Management dengan Folder
                </h3>
                <p className="text-zinc-300 text-sm leading-relaxed mb-2">
                  Sekarang Anda dapat mengorganisir preset dengan folder! Setiap user memiliki folder sendiri untuk mengelompokkan preset mereka.
                </p>
                <ul className="text-zinc-300 text-sm space-y-1 ml-4 list-disc">
                  <li>Buat folder untuk mengorganisir preset Anda</li>
                  <li>Preset ditampilkan berdasarkan folder di dropdown</li>
                  <li>Setiap user hanya bisa mengelola preset mereka sendiri</li>
                </ul>
              </div>

              <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
                <h3 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
                  <span className="text-lg">✏️</span> CRUD Lengkap untuk Preset
                </h3>
                <p className="text-zinc-300 text-sm leading-relaxed mb-2">
                  Sekarang Anda memiliki kontrol penuh atas preset Anda:
                </p>
                <ul className="text-zinc-300 text-sm space-y-1 ml-4 list-disc">
                  <li><span className="font-semibold">Create</span> - Simpan preset dengan folder</li>
                  <li><span className="font-semibold">Read</span> - Lihat preset yang terorganisir per folder</li>
                  <li><span className="font-semibold">Update</span> - Edit preset dan folder dengan tombol Edit</li>
                  <li><span className="font-semibold">Delete</span> - Hapus preset dengan konfirmasi yang jelas</li>
                </ul>
              </div>

              <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
                <h3 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                  <span className="text-lg">🗑️</span> Modal Konfirmasi Delete yang Lebih Baik
                </h3>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  Hapus preset sekarang lebih aman dengan modal konfirmasi yang jelas. Anda akan melihat nama preset yang akan dihapus dan peringatan bahwa tindakan ini tidak dapat dibatalkan.
                </p>
              </div>

              <div className="bg-cyan-900/20 border border-cyan-700/50 rounded-lg p-4">
                <h3 className="text-cyan-400 font-semibold mb-2 flex items-center gap-2">
                  <span className="text-lg">✨</span> A/B Comparison Feature
                </h3>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  Compare your audio before and after mastering in real-time! Click the <span className="font-semibold text-cyan-400">A/B button</span> next to the play controls to switch between original (A) and mastered (B) audio instantly.
                </p>
              </div>

              <div className="bg-emerald-900/20 border border-emerald-700/50 rounded-lg p-4">
                <h3 className="text-emerald-400 font-semibold mb-2 flex items-center gap-2">
                  <span className="text-lg">🎵</span> Enhanced Export Options
                </h3>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  Export your mastered audio in multiple formats:
                </p>
                <ul className="text-zinc-300 text-sm mt-2 space-y-1 ml-4 list-disc">
                  <li><span className="font-semibold">MP3</span> - High quality 320 kbps</li>
                  <li><span className="font-semibold">FLAC</span> - Lossless audio format</li>
                  <li><span className="font-semibold">WAV</span> - Multiple quality options (16-bit, 24-bit, 32-bit)</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-700">
              <button
                onClick={() => {
                  setShowChangelog(false);
                  try {
                    if (typeof window !== 'undefined') {
                      window.localStorage.setItem('CHANGELOG_VIEWED', 'v2.1.0');
                    }
                  } catch {
                    // Ignore storage errors
                  }
                }}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                Mengerti!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

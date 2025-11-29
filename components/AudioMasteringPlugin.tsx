"use client";

import { useState, useEffect, useCallback } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Play, Pause, SkipBack, SkipForward, Settings, Save, Upload, Download, LogOut } from 'lucide-react';
import { Waveform } from './audio/Waveform';
import { SpectrumAnalyzer } from './audio/SpectrumAnalyzer';
import { Knob } from './audio/Knob';
import { VUMeter } from './audio/VUMeter';
import { MultibandCompressor } from './audio/MultibandCompressor';
import { Harmonizer } from './audio/Harmonizer';
import { Reverb } from './audio/Reverb';
import { Saturation } from './audio/Saturation';
import { ExportModal } from './audio/ExportModal';
import { LoudnessMeter } from './audio/LoudnessMeter';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { usePresets, type PresetSettings } from '@/hooks/usePresets';
import { useAuth } from '@/hooks/useAuth';
import { AudioEngineSettings } from '@/lib/audio/audioEngine';
import { effectPresets } from '@/lib/audio/audioEffects';
import { ToastContainer, type Toast } from '@/components/ui/Toast';

interface DisclaimerProps {
  text: string;
}

/**
 * Menampilkan disclaimer singkat di halaman utama.
 */
function Disclaimer({ text }: DisclaimerProps) {
  return (
    <div className="mb-4 p-3 bg-zinc-800/40 border border-zinc-700 rounded-lg">
      <p className="text-zinc-400 text-xs">{text}</p>
    </div>
  );
}

export function AudioMasteringPlugin() {
  const FEATURE_HAAS = process.env.NEXT_PUBLIC_FEATURE_HAAS === 'true';
  const FEATURE_REVERB = process.env.NEXT_PUBLIC_FEATURE_REVERB === 'true';
  const FEATURE_HARMONIZER = process.env.NEXT_PUBLIC_FEATURE_HARMONIZER === 'true';
  const DISCLAIMER_TEXT = process.env.NEXT_PUBLIC_DISCLAIMER_NO_STORAGE_TEXT || 'Kami tidak menyimpan data audio apapun di website ini.';
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
  } = useAudioEngine();

  const { savePreset, presets: dbPresets, isLoading: presetsLoading, loadPreset } = usePresets();
  const { user, logout } = useAuth();

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioFileName, setAudioFileName] = useState<string>('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [presetName, setPresetName] = useState('');
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
  // Haas widener states
  const [haasEnabled, setHaasEnabled] = useState(false);
  const [haasDelayMs, setHaasDelayMs] = useState(12);
  const [haasMix, setHaasMix] = useState(30);
  
  // Harmonizer states
  const [harmonizerEnabled, setHarmonizerEnabled] = useState(true);
  const [harmonizerMix, setHarmonizerMix] = useState(30);
  const [harmonizerDepth, setHarmonizerDepth] = useState(50);
  const [harmonizerTone, setHarmonizerTone] = useState(0);
  
  // Reverb states
  const [reverbEnabled, setReverbEnabled] = useState(true);
  const [reverbMix, setReverbMix] = useState(20);
  const [reverbSize, setReverbSize] = useState(50);
  const [reverbDecay, setReverbDecay] = useState(2.5);
  const [reverbDamping, setReverbDamping] = useState(50);
  
  // Saturation states
  const [saturationEnabled, setSaturationEnabled] = useState(true);
  const [saturationDrive, setSaturationDrive] = useState(25);
  const [saturationMix, setSaturationMix] = useState(40);
  const [saturationBias, setSaturationBias] = useState(0);
  const [saturationMode, setSaturationMode] = useState<'tube' | 'tape' | 'soft'>('soft');

  const presetNames = [
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
  ];
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
      haas: {
        enabled: haasEnabled,
        delayMs: haasDelayMs,
        mix: haasMix,
      },
      harmonizer: {
        enabled: harmonizerEnabled,
        mix: harmonizerMix,
        depth: harmonizerDepth,
        tone: harmonizerTone,
      },
      reverb: {
        enabled: reverbEnabled,
        mix: reverbMix,
        size: reverbSize,
        decay: reverbDecay,
        damping: reverbDamping,
      },
      saturation: {
        enabled: saturationEnabled,
        drive: saturationDrive,
        mix: saturationMix,
        bias: saturationBias,
        mode: saturationMode,
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
    stereoEnabled, stereoWidth, haasEnabled, haasDelayMs, haasMix,
    harmonizerEnabled, harmonizerMix, harmonizerDepth, harmonizerTone,
    reverbEnabled, reverbMix, reverbSize, reverbDecay, reverbDamping, 
    saturationEnabled, saturationDrive, saturationMix, saturationBias, saturationMode,
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

  const processAudioFile = async (file: File) => {
    if (!isInitialized) {
      showToast('Audio engine sedang diinisialisasi. Silakan tunggu sebentar...', 'error');
      return;
    }

    try {
      await loadAudioFile(file);
      setAudioFile(file);
      setAudioFileName(file.name);
      stop();

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
    setHarmonizerEnabled(false);
    setReverbEnabled(false);
    setSaturationEnabled(false);
    setMultibandEnabled(false);
    setHaasEnabled(false);
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

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handleStop = () => {
    stop();
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

  const handlePresetChange = async (value: string) => {
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
        };
        applyPresetSettings(convertedSettings);
      }
    }
  };

  const applyPresetSettings = (settings: Partial<AudioEngineSettings> | PresetSettings) => {
    setCompressorEnabled(true);
    setLimiterEnabled(true);
    setStereoEnabled(true);
    setHarmonizerEnabled(false);
    setReverbEnabled(false);
    setSaturationEnabled(false);
    setHaasEnabled(false);
    
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
  };

  const showToast = (message: string, type: Toast['type'] = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      showToast('Please enter a preset name', 'error');
      return;
    }

    try {
      const settings = getCurrentSettings();
      await savePreset({
        name: presetName,
        settings,
        isPublic: presetIsPublic,
      });
      setShowSavePresetModal(false);
      setPresetName('');
      setPresetIsPublic(false);
      showToast(`Preset "${presetName}" saved successfully!`, 'success');
    } catch (err) {
      console.error('Failed to save preset:', err);
      Sentry.captureException(err, {
        tags: { component: 'AudioMasteringPlugin', action: 'savePreset' },
        extra: { presetName, isPublic: presetIsPublic },
      });
      showToast(err instanceof Error ? err.message : 'Failed to save preset', 'error');
    }
  };

  const handleExportWithFormat = async (format: string, quality: string) => {
    try {
      if (!audioFile) {
        showToast('Please load an audio file first.', 'error');
        return;
      }

      const settings = getCurrentSettings();
      console.log('Exporting with settings:', settings);
      
      const blob = await exportAudio(settings, format as 'wav' | 'mp3');
      
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

      showToast(`Export successful! Audio exported as ${format.toUpperCase()} with ${quality} quality.`, 'success');
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
          <label aria-label="Upload audio file" className={`bg-zinc-700 hover:bg-zinc-600 text-zinc-100 px-4 py-2 rounded-lg border border-zinc-600 transition-colors flex items-center gap-2 ${
            !isInitialized || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}>
            <Upload className="w-4 h-4" />
            <span className="text-sm">Upload</span>
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={!isInitialized || isLoading}
              aria-label="Choose audio file"
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
            {dbPresets.length > 0 && (
              <optgroup label="My Presets">
                {dbPresets.filter(p => p.userId === user?.id).map(p => (
                  <option key={p.id} value={`db-${p.id}`}>
                    {p.name} {p.isPublic ? '🌐' : '🔒'}
                  </option>
                ))}
              </optgroup>
            )}
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
            onClick={() => setShowSavePresetModal(true)}
            aria-label="Save preset"
            className="bg-zinc-700 hover:bg-zinc-600 text-zinc-100 p-2 rounded-lg border border-zinc-600 transition-colors"
            title="Save Preset"
          >
            <Save className="w-4 h-4" />
          </button>
          <button aria-label="Settings" className="bg-zinc-700 hover:bg-zinc-600 text-zinc-100 p-2 rounded-lg border border-zinc-600 transition-colors">
            <Settings className="w-4 h-4" />
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

      <Disclaimer text={DISCLAIMER_TEXT} />

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
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-zinc-400 text-xs tracking-wider">WAVEFORM</h3>
              <div className="flex gap-2">
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
              <Knob 
                value={compThreshold} 
                onChange={setCompThreshold}
                min={-60}
                max={0}
                label="THRESHOLD"
                unit="dB"
                size="small"
              />
              <Knob 
                value={compRatio} 
                onChange={setCompRatio}
                min={1}
                max={20}
                label="RATIO"
                unit=":1"
                size="small"
              />
              <Knob 
                value={compAttack} 
                onChange={setCompAttack}
                min={0.1}
                max={100}
                label="ATTACK"
                unit="ms"
                size="small"
              />
              <Knob 
                value={compRelease} 
                onChange={setCompRelease}
                min={10}
                max={1000}
                label="RELEASE"
                unit="ms"
                size="small"
              />
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
            <div className={`flex justify-center ${!limiterEnabled ? 'pointer-events-none opacity-50' : ''}`}>
              <Knob 
                value={limiterThreshold} 
                onChange={setLimiterThreshold}
                min={-12}
                max={0}
                label="CEILING"
                unit="dB"
              />
            </div>
            <div className="mt-3 pt-3 border-t border-zinc-700">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-xs">Reduction</span>
                <span className="text-red-400 text-xs">-1.5 dB</span>
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
            <div className={`flex justify-center ${!stereoEnabled ? 'pointer-events-none opacity-50' : ''}`}>
              <Knob 
                value={stereoWidth} 
                onChange={setStereoWidth}
                min={0}
                max={200}
                label="WIDTH"
                unit="%"
              />
            </div>
          </div>

          {FEATURE_HAAS && (
            <div className={`bg-zinc-800/50 rounded-xl p-4 border ${haasEnabled ? 'border-zinc-700' : 'border-zinc-800 opacity-60'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-zinc-400 text-xs tracking-wider">HAAS</h3>
                <button
                  onClick={() => setHaasEnabled(!haasEnabled)}
                  className={`px-3 py-1 rounded text-xs transition-all ${
                    haasEnabled 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' 
                      : 'bg-zinc-700 text-zinc-400'
                  }`}
                >
                  {haasEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className={`grid grid-cols-2 gap-4 ${!haasEnabled ? 'pointer-events-none opacity-50' : ''}`}>
                <Knob 
                  value={haasDelayMs} 
                  onChange={setHaasDelayMs}
                  min={0}
                  max={30}
                  label="DELAY"
                  unit="ms"
                  size="small"
                />
                <Knob 
                  value={haasMix} 
                  onChange={setHaasMix}
                  min={0}
                  max={100}
                  label="MIX"
                  unit="%"
                  size="small"
                />
              </div>
            </div>
          )}

          {FEATURE_HARMONIZER && (
            <Harmonizer 
              enabled={harmonizerEnabled}
              onToggle={setHarmonizerEnabled}
              mix={harmonizerMix}
              setMix={setHarmonizerMix}
              depth={harmonizerDepth}
              setDepth={setHarmonizerDepth}
              tone={harmonizerTone}
              setTone={setHarmonizerTone}
            />
          )}

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

          {/* Saturation */}
          <Saturation 
            enabled={saturationEnabled}
            onToggle={setSaturationEnabled}
            drive={saturationDrive}
            setDrive={setSaturationDrive}
            mix={saturationMix}
            setMix={setSaturationMix}
            bias={saturationBias}
            setBias={setSaturationBias}
            mode={saturationMode}
            setMode={setSaturationMode}
          />
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
            <h2 className="text-zinc-100 mb-4">Save Preset</h2>
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Preset name"
              className="w-full bg-zinc-700 text-zinc-100 px-4 py-2 rounded-lg border border-zinc-600 focus:outline-none focus:border-cyan-500 mb-4"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSavePreset();
                }
              }}
            />
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
                Save
              </button>
              <button
                onClick={() => {
                  setShowSavePresetModal(false);
                  setPresetName('');
                  setPresetIsPublic(false);
                }}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
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

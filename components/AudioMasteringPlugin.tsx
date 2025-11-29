"use client";

import { useState, useEffect, useCallback } from 'react';
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

export function AudioMasteringPlugin() {
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
    getWaveformData,
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
  const [waveformData, setWaveformData] = useState<Float32Array | null>(null);
  
  // Control states
  const [inputGain, setInputGain] = useState(0);
  const [outputGain, setOutputGain] = useState(0);
  
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
    stereoEnabled, stereoWidth, 
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if audio engine is initialized
    if (!isInitialized) {
      showToast('Audio engine sedang diinisialisasi. Silakan tunggu sebentar...', 'error');
      // Reset input
      event.target.value = '';
      return;
    }

    try {
      await loadAudioFile(file);
      setAudioFile(file);
      setAudioFileName(file.name);
      stop();
      
      // Generate waveform data after a short delay to ensure audio buffer is ready
      setTimeout(() => {
        // Use a reasonable width for waveform (will be scaled to canvas size)
        const data = getWaveformData(2000);
        if (data) {
          setWaveformData(data);
        }
      }, 100);
      
      // Reset semua effects ke OFF saat audio baru di-load
      setCompressorEnabled(false);
      setLimiterEnabled(false);
      setStereoEnabled(false);
      setHarmonizerEnabled(false);
      setReverbEnabled(false);
      setSaturationEnabled(false);
      setMultibandEnabled(false);
    } catch (err) {
      console.error('Failed to load audio file:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load audio file';
      showToast(errorMessage, 'error');
      // Reset input on error
      event.target.value = '';
    }
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
        showToast('Failed to load preset', 'error');
      }
    } else {
      // Built-in preset
      setSelectedPreset(value);
      setSelectedPresetId(null);
      
      const preset = effectPresets[value.toLowerCase()];
      if (preset && preset.settings) {
        // Convert EffectPreset settings to AudioEngineSettings format
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
          ...(preset.settings.reverb && {
            reverb: {
              enabled: true,
              mix: preset.settings.reverb.mix,
              size: preset.settings.reverb.size,
              decay: preset.settings.reverb.decay,
              damping: preset.settings.reverb.damping,
            },
          }),
          ...(preset.settings.saturation && {
            saturation: {
              enabled: true,
              drive: preset.settings.saturation.drive,
              mix: preset.settings.saturation.mix,
              bias: preset.settings.saturation.bias,
              mode: 'soft' as const,
            },
          }),
        };
        applyPresetSettings(convertedSettings);
      }
    }
  };

  const applyPresetSettings = (settings: Partial<AudioEngineSettings> | PresetSettings) => {
    // Reset all enabled states to true for presets
    setCompressorEnabled(true);
    setLimiterEnabled(true);
    setStereoEnabled(true);
    setHarmonizerEnabled(true);
    setReverbEnabled(true);
    setSaturationEnabled(true);
    
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
    if (settings.harmonizer) {
      if (settings.harmonizer.enabled !== undefined) setHarmonizerEnabled(settings.harmonizer.enabled);
      if (settings.harmonizer.mix !== undefined) setHarmonizerMix(settings.harmonizer.mix);
      if (settings.harmonizer.depth !== undefined) setHarmonizerDepth(settings.harmonizer.depth);
      if (settings.harmonizer.tone !== undefined) setHarmonizerTone(settings.harmonizer.tone);
    }
    if (settings.reverb) {
      if (settings.reverb.enabled !== undefined) setReverbEnabled(settings.reverb.enabled);
      if (settings.reverb.mix !== undefined) setReverbMix(settings.reverb.mix);
      if (settings.reverb.size !== undefined) setReverbSize(settings.reverb.size);
      if (settings.reverb.decay !== undefined) setReverbDecay(settings.reverb.decay);
      if (settings.reverb.damping !== undefined) setReverbDamping(settings.reverb.damping);
    }
    if (settings.saturation) {
      if (settings.saturation.enabled !== undefined) setSaturationEnabled(settings.saturation.enabled);
      if (settings.saturation.drive !== undefined) setSaturationDrive(settings.saturation.drive);
      if (settings.saturation.mix !== undefined) setSaturationMix(settings.saturation.mix);
      if (settings.saturation.bias !== undefined) setSaturationBias(settings.saturation.bias);
      if (settings.saturation.mode && 
          (settings.saturation.mode === 'tube' || 
           settings.saturation.mode === 'tape' || 
           settings.saturation.mode === 'soft')) {
        setSaturationMode(settings.saturation.mode);
      }
    }
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
      <div className="flex items-center justify-between mb-6">
        <div>
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
        <div className="flex items-center gap-4">
          {/* Upload Button */}
          <label className={`bg-zinc-700 hover:bg-zinc-600 text-zinc-100 px-4 py-2 rounded-lg border border-zinc-600 transition-colors flex items-center gap-2 ${
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
            />
          </label>

          {/* Export Button */}
          <button 
            onClick={() => setShowExportModal(true)}
            disabled={!audioFile || isLoading}
            className="bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg border border-emerald-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Export</span>
          </button>

          <select 
            value={selectedPresetId ? `db-${selectedPresetId}` : selectedPreset}
            onChange={(e) => handlePresetChange(e.target.value)}
            className="bg-zinc-700 text-zinc-100 px-4 py-2 rounded-lg border border-zinc-600 focus:outline-none focus:border-cyan-500 text-sm min-w-[200px]"
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
            className="bg-zinc-700 hover:bg-zinc-600 text-zinc-100 p-2 rounded-lg border border-zinc-600 transition-colors"
            title="Save Preset"
          >
            <Save className="w-4 h-4" />
          </button>
          <button className="bg-zinc-700 hover:bg-zinc-600 text-zinc-100 p-2 rounded-lg border border-zinc-600 transition-colors">
            <Settings className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 rounded-lg border border-zinc-700">
            <span className="text-zinc-400 text-xs">{user?.username}</span>
          </div>
          <button 
            onClick={logout}
            className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-lg border border-red-600 transition-colors flex items-center gap-2"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Input/Output & Meters */}
        <div className="col-span-2 space-y-4">
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
          </div>
        </div>

        {/* Middle Column - Visualizers & Multiband Compressor */}
        <div className="col-span-7 space-y-4">
          {/* Waveform Display */}
          <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700 relative">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-zinc-400 text-xs tracking-wider">WAVEFORM</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleSeek(0)}
                  className="bg-zinc-700 hover:bg-zinc-600 text-zinc-300 p-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!audioFile || isLoading}
                >
                  <SkipBack className="w-3 h-3" />
                </button>
                <button 
                  onClick={handlePlayPause}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white p-1.5 rounded transition-colors disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed"
                  disabled={!audioFile || isLoading}
                >
                  {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                </button>
                <button 
                  onClick={handleStop}
                  className="bg-zinc-700 hover:bg-zinc-600 text-zinc-300 p-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!audioFile || isLoading}
                >
                  <SkipForward className="w-3 h-3" />
                </button>
              </div>
            </div>
            <Waveform 
              isPlaying={isPlaying} 
              waveformData={waveformData}
              currentTime={currentTime}
              duration={duration}
              onSeek={seek}
            />
            {!audioFile && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 rounded-xl m-4">
                <div className="text-center">
                  <Upload className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-zinc-500 text-sm">Upload an audio file to start mastering</p>
                </div>
              </div>
            )}
          </div>

          {/* Spectrum Analyzer */}
          <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
            <h3 className="text-zinc-400 text-xs tracking-wider mb-3">SPECTRUM ANALYZER</h3>
            <SpectrumAnalyzer isPlaying={isPlaying} analysisData={analysisData} />
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
        <div className="col-span-3 space-y-4">
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

          {/* Harmonizer */}
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

          {/* Reverb */}
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

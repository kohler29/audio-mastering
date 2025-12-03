export interface AudioEngineSettings {
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
  multibandCompressor: {
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
  exportFadeInMs?: number;
  exportFadeOutMs?: number;
}

export interface AudioAnalysisData {
  waveform: Uint8Array;
  spectrum: Uint8Array;
  floatSpectrum: Float32Array;
  sampleRate: number;
  frequencyBinCount: number;
  minDecibels: number;
  maxDecibels: number;
  vuLeft: number;
  vuRight: number;
  loudness: {
    momentary: number;
    shortTerm: number;
    integrated: number;
    truePeak: number;
    lra: number;
  };
}

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private analyserNode: AnalyserNode | null = null;
  private gainNodes: {
    input: GainNode | null;
    output: GainNode | null;
  } = { input: null, output: null };
  private compressorNode: DynamicsCompressorNode | null = null;
  private compressorGainNode: GainNode | null = null;
  private limiterNode: DynamicsCompressorNode | null = null;
  private convolverNode: ConvolverNode | null = null;
  private reverbGainNode: GainNode | null = null;
  private dryGainNode: GainNode | null = null;
  private reverbDelayNode: DelayNode | null = null;
  private reverbFeedbackGain: GainNode | null = null;
  private reverbDampingFilter: BiquadFilterNode | null = null;
  private reverbMix: GainNode | null = null;
  private reverbBypass: GainNode | null = null;
  private reverbOutput: GainNode | null = null;
  private splitterNode: ChannelSplitterNode | null = null;
  private mergerNode: ChannelMergerNode | null = null;
  private stereoMidGain: GainNode | null = null;
  private stereoSideGain: GainNode | null = null;
  // Stereo width gain nodes (for real-time updates)
  private stereoLeftDirect: GainNode | null = null;
  private stereoRightDirect: GainNode | null = null;
  private stereoLeftCrossfeed: GainNode | null = null;
  private stereoRightCrossfeed: GainNode | null = null;
  private stereoOutput: GainNode | null = null;
  // Master fade gain (untuk kontrol manual fade in/out pada playback)
  private masterFade: GainNode | null = null;
  private multibandFilters: Array<{
    lowpass: BiquadFilterNode;
    highpass: BiquadFilterNode;
    compressor: DynamicsCompressorNode;
    gain: GainNode;
  }> = [];
  private multibandMerger: ChannelMergerNode | null = null;
  private multibandBypass: GainNode | null = null;
  private multibandOutput: GainNode | null = null;
  // Audio graph nodes (persistent, tidak di-recreate)
  private compressorMix: GainNode | null = null;
  private compressorBypass: GainNode | null = null;
  private compressorOutput: GainNode | null = null;
  private limiterMix: GainNode | null = null;
  private limiterBypass: GainNode | null = null;
  private limiterOutput: GainNode | null = null;
  private multibandMix: GainNode | null = null;
  // Master bypass for A/B comparison (bypass all effects)
  private masterBypass: GainNode | null = null;
  private masterMix: GainNode | null = null;
  private masterOutput: GainNode | null = null;
  // Gain reduction tracking
  private gainReductionCallback: ((reduction: number) => void) | null = null;
  private gainReductionFrameId: number | null = null;
  private isPlaying = false;
  private startTime = 0;
  private pausedTime = 0;
  private currentTime = 0;
  private duration = 0;
  private onTimeUpdate: ((time: number) => void) | null = null;
  private animationFrameId: number | null = null;
  private sourceNodeStarted = false;
  private audioGraphBuilt = false;
  // Loudness meter state (EBU R128)
  private loudnessBuffer: Float32Array[] = [];
  private momentaryBuffer: number[] = [];
  private shortTermBuffer: number[] = [];
  private integratedSamples: number[] = [];
  private truePeakMax = -Infinity;
  private loudnessHistory: number[] = [];
  private loudnessStartTime: number | null = null;

  async initialize(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

      // Setup analyser terlebih dahulu
      this.setupAnalyser();

      // Set up listener untuk state changes
      this.audioContext.addEventListener('statechange', () => {
        // Audio context state changed
      });

      // Jangan menunggu resume() - langsung resolve untuk menghindari hang
      // Resume akan dilakukan nanti saat user interaction (melalui resumeContext())
      // Ini membuat initialization lebih cepat dan tidak blocking
      if (this.audioContext.state === 'suspended') {
        // Coba resume secara async tanpa blocking initialization
        // Gunakan fire-and-forget pattern
        this.audioContext.resume().catch(() => {
          // Resume gagal - tidak masalah, user bisa resume nanti
          // Tidak perlu log karena ini normal behavior
        });
      }

      // Langsung resolve tanpa menunggu resume()
      // Engine sudah siap digunakan, resume bisa dilakukan nanti
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      throw new Error('Failed to initialize audio engine. Your browser may not support Web Audio API.');
    }
  }

  /**
   * Resume audio context (untuk handle browser autoplay policy)
   */
  async resumeContext(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.error('Failed to resume audio context:', error);
        throw new Error('Failed to resume audio context. Please try again.');
      }
    }
  }

  /**
   * Get audio context state
   */
  getContextState(): AudioContextState | null {
    return this.audioContext?.state || null;
  }

  /**
   * setupAnalyser
   * Mengonfigurasi AnalyserNode dengan ukuran FFT dinamis berdasarkan viewport
   * untuk keseimbangan akurasi dan performa pada mobile/desktop.
   */
  private setupAnalyser(): void {
    if (!this.audioContext) return;

    this.analyserNode = this.audioContext.createAnalyser();
    const w = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const isMobile = w <= 640;
    const isTablet = w > 640 && w <= 1024;

    this.analyserNode.fftSize = isMobile ? 1024 : isTablet ? 2048 : 2048;
    this.analyserNode.smoothingTimeConstant = isMobile ? 0.7 : isTablet ? 0.8 : 0.8;
  }

  /**
   * Muat file audio baru dengan hard reset:
   * - Hentikan semua source
   * - Tutup dan buat AudioContext baru
   * - Decode dari FileReader (fresh ArrayBuffer)
   */
  async loadAudioFile(file: File): Promise<void> {
    try {
      // Pastikan playback berhenti dan graph dibersihkan
      this.stop();
      this.cleanup();

      // Tutup AudioContext lama jika ada
      if (this.audioContext) {
        try {
          await this.audioContext.close();
        } catch {
          // Abaikan error penutupan context
        }
        this.audioContext = null;
      }

      // Reset semua node agar tidak ada referensi cross-context
      this.resetAllNodes();

      // Buat AudioContext baru dan analyser
      await this.initialize();
      if (!this.audioContext) {
        throw new Error('Audio context not initialized');
      }

      // Baca file via FileReader agar buffer benar-benar fresh
      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result;
          if (result instanceof ArrayBuffer) {
            resolve(result);
          } else {
            reject(new Error('Invalid file data'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
      });

      // Decode audio
      const audioContext = this.audioContext as AudioContext;
      const buffer = await audioContext.decodeAudioData(arrayBuffer);
      this.audioBuffer = buffer;
      this.duration = buffer.duration;

      // Reset state playback
      this.pausedTime = 0;
      this.currentTime = 0;
      this.startTime = 0;
      this.sourceNode = null;
      this.sourceNodeStarted = false;

      // Paksa rebuild graph untuk file baru
      this.audioGraphBuilt = false;

      // Pastikan master fade tidak mute pada context baru
      this.masterFade = null;
    } catch (error) {
      console.error('Failed to load audio file:', error);
      throw new Error('Failed to load audio file. The file may be corrupted or in an unsupported format.');
    }
  }

  /**
   * Reset semua AudioNode instance ke null agar aman saat membuat AudioContext baru
   */
  private resetAllNodes(): void {
    this.analyserNode = null;
    this.gainNodes = { input: null, output: null };
    this.compressorNode = null;
    this.compressorGainNode = null;
    this.compressorMix = null;
    this.compressorBypass = null;
    this.compressorOutput = null;
    this.convolverNode = null;
    this.reverbGainNode = null;
    this.dryGainNode = null;
    this.reverbDelayNode = null;
    this.reverbFeedbackGain = null;
    this.reverbDampingFilter = null;
    this.reverbMix = null;
    this.reverbBypass = null;
    this.reverbOutput = null;
    this.splitterNode = null;
    this.mergerNode = null;
    this.stereoMidGain = null;
    this.stereoSideGain = null;
    this.stereoLeftDirect = null;
    this.stereoRightDirect = null;
    this.stereoLeftCrossfeed = null;
    this.stereoRightCrossfeed = null;
    this.stereoOutput = null;
    this.limiterNode = null;
    this.limiterMix = null;
    this.limiterBypass = null;
    this.limiterOutput = null;
    this.multibandFilters = [];
    this.multibandMerger = null;
    this.multibandBypass = null;
    this.multibandOutput = null;
    this.multibandMix = null;
    this.masterFade = null;
    this.masterBypass = null;
    this.masterMix = null;
    this.masterOutput = null;
  }

  // Build audio graph sekali saja (dipanggil saat file loaded)
  private async buildAudioGraph(settings: AudioEngineSettings): Promise<void> {
    if (!this.audioContext || !this.audioBuffer) {
      throw new Error('Audio context or buffer not initialized');
    }

    // Cleanup existing graph jika ada
    this.cleanupGraph();

    // Input gain
    this.gainNodes.input = this.audioContext.createGain();
    this.gainNodes.input.gain.value = this.dbToGain(settings.inputGain);

    // Multiband Compressor setup
    this.setupMultibandCompressor(settings.multibandCompressor);

    // Compressor
    this.compressorNode = this.audioContext.createDynamicsCompressor();
    this.compressorNode.threshold.value = settings.compressor.threshold;
    this.compressorNode.ratio.value = settings.compressor.ratio;
    this.compressorNode.attack.value = settings.compressor.attack / 1000;
    this.compressorNode.release.value = settings.compressor.release / 1000;
    this.compressorNode.knee.value = 30;

    // Compressor makeup gain
    this.compressorGainNode = this.audioContext.createGain();
    this.compressorGainNode.gain.value = this.dbToGain(settings.compressor.gain);

    this.compressorMix = this.audioContext.createGain();
    this.compressorBypass = this.audioContext.createGain();
    this.compressorMix.gain.value = settings.compressor.enabled ? 1 : 0;
    this.compressorBypass.gain.value = settings.compressor.enabled ? 0 : 1;
    this.compressorOutput = this.audioContext.createGain();

    // Reverb setup
    this.setupReverb(settings.reverb);

    // Stereo width
    this.setupStereoWidth(settings.stereoWidth.width);

    // Limiter (optimized for professional mastering)
    // Using higher ratio and optimized attack/release for smooth limiting
    this.limiterNode = this.audioContext.createDynamicsCompressor();
    this.limiterNode.threshold.value = settings.limiter.threshold;
    this.limiterNode.ratio.value = 20; // Maximum for DynamicsCompressorNode (acts as brickwall)
    this.limiterNode.attack.value = 0.003; // 3ms - optimized to prevent distortion on transients
    this.limiterNode.release.value = 0.05; // 50ms - smoother release, prevents pumping
    this.limiterNode.knee.value = 0; // Hard knee for true limiting

    this.limiterMix = this.audioContext.createGain();
    this.limiterBypass = this.audioContext.createGain();
    this.limiterMix.gain.value = settings.limiter.enabled ? 1 : 0;
    this.limiterBypass.gain.value = settings.limiter.enabled ? 0 : 1;
    this.limiterOutput = this.audioContext.createGain();

    // Master bypass for A/B comparison (bypass all effects)
    this.masterBypass = this.audioContext.createGain();
    this.masterBypass.gain.value = 0; // Default: show mastered (bypass off)
    this.masterMix = this.audioContext.createGain();
    this.masterMix.gain.value = 1; // Default: show mastered
    this.masterOutput = this.audioContext.createGain();

    // Output gain
    this.gainNodes.output = this.audioContext.createGain();
    this.gainNodes.output.gain.value = this.dbToGain(settings.outputGain);

    // Connect audio graph (sekali saja)
    this.connectAudioGraph(settings);
  }

  // Connect audio graph (dipanggil sekali saat build)
  private connectAudioGraph(settings: AudioEngineSettings): void {
    if (!this.audioContext || !this.gainNodes.input) return;
    
    // Ensure master bypass nodes are created
    if (!this.masterBypass || !this.masterMix || !this.masterOutput) {
      this.masterBypass = this.audioContext.createGain();
      this.masterBypass.gain.value = 0;
      this.masterMix = this.audioContext.createGain();
      this.masterMix.gain.value = 1;
      this.masterOutput = this.audioContext.createGain();
    }

    // Multiband Compressor - always route through multibandMix
    // This ensures routing is always correct even when enabled state changes
    let multibandInput: GainNode = this.gainNodes.input;

    // Always create and connect multiband routing if nodes exist
    if (this.multibandMix && this.multibandBypass && this.multibandOutput) {
      // Always connect input to bypass path (bypass gain controls whether signal passes)
      this.gainNodes.input.connect(this.multibandBypass);

      // Connect input to each band's highpass filter (if bands exist)
      // This ensures bands are always connected, even if disabled initially
      if (this.multibandFilters.length > 0) {
        this.multibandFilters.forEach(filter => {
          this.gainNodes.input!.connect(filter.highpass);
        });
      }

      // Always use multibandMix as output (it mixes bypass and multiband output)
      multibandInput = this.multibandMix;
    } else {
      // Fallback: if multiband nodes don't exist, use input directly
      multibandInput = this.gainNodes.input;
    }

    // Compressor with bypass
    multibandInput.connect(this.compressorNode!);
    multibandInput.connect(this.compressorBypass!);
    this.compressorNode!.connect(this.compressorGainNode!);
    this.compressorGainNode!.connect(this.compressorMix!);
    this.compressorMix!.connect(this.compressorOutput!);
    this.compressorBypass!.connect(this.compressorOutput!);

    // Reverb in parallel dengan bypass
    if (settings.reverb.enabled &&
      this.reverbDelayNode &&
      this.reverbGainNode &&
      this.dryGainNode) {
      // Connect input ke delay (untuk reverb) dan dry path
      this.compressorOutput!.connect(this.reverbDelayNode);
      this.compressorOutput!.connect(this.dryGainNode);

      // Mix dry dan wet
      const reverbMixNode = this.audioContext.createGain();
      this.dryGainNode.connect(reverbMixNode);
      this.reverbGainNode.connect(reverbMixNode);
      reverbMixNode.connect(this.reverbMix!);
    } else {
      // Bypass reverb
      this.compressorOutput!.connect(this.reverbMix!);
    }
    this.compressorOutput!.connect(this.reverbBypass!);
    this.reverbMix!.connect(this.reverbOutput!);
    this.reverbBypass!.connect(this.reverbOutput!);

    // Stereo Width - always route through stereo processing if stereo audio
    // This ensures routing is always correct even when enabled state changes
    const stereoInputSource = this.reverbOutput!;
    let stereoInput: GainNode = stereoInputSource;

    // Only apply stereo width if audio is stereo (2+ channels)
    if (this.audioBuffer &&
      this.audioBuffer.numberOfChannels >= 2 &&
      this.splitterNode &&
      this.mergerNode) {
      // Always connect stereo input source to splitter (routing always ready)
      stereoInputSource.connect(this.splitterNode);

      // Create gain nodes for proper stereo width processing (save as instance variables)
      // These are created once and reused
      if (!this.stereoLeftDirect) {
        this.stereoLeftDirect = this.audioContext.createGain();
        this.stereoRightDirect = this.audioContext.createGain();
        this.stereoLeftCrossfeed = this.audioContext.createGain();
        this.stereoRightCrossfeed = this.audioContext.createGain();

        // Connect splitter to gains (always connected)
        this.splitterNode.connect(this.stereoLeftDirect, 0); // L -> leftDirect
        this.splitterNode.connect(this.stereoRightDirect, 1); // R -> rightDirect
        this.splitterNode.connect(this.stereoLeftCrossfeed, 1); // R -> leftCrossfeed
        this.splitterNode.connect(this.stereoRightCrossfeed, 0); // L -> rightCrossfeed

        // Sum left and right channels
        const leftSum = this.audioContext.createGain();
        const rightSum = this.audioContext.createGain();
        this.stereoLeftDirect.connect(leftSum);
        this.stereoLeftCrossfeed.connect(leftSum);
        this.stereoRightDirect.connect(rightSum);
        this.stereoRightCrossfeed.connect(rightSum);

        // Merge back to stereo
        leftSum.connect(this.mergerNode, 0, 0);
        rightSum.connect(this.mergerNode, 0, 1);

        this.stereoOutput = this.audioContext.createGain();
        this.mergerNode.connect(this.stereoOutput);
      }

      // Proper stereo width formula:
      // L' = L * (1 + width)/2 + R * (1 - width)/2
      // R' = R * (1 + width)/2 + L * (1 - width)/2
      // Width = 0: mono (L+R)/2, Width = 1: original, Width > 1: wider
      const width = settings.stereoWidth.width / 100;

      // Update gain values based on enabled state and width
      if (settings.stereoWidth.enabled && this.stereoLeftDirect && this.stereoRightDirect &&
        this.stereoLeftCrossfeed && this.stereoRightCrossfeed) {
        // Direct signal gains
        this.stereoLeftDirect.gain.value = (1 + width) / 2;
        this.stereoRightDirect.gain.value = (1 + width) / 2;
        // Crossfeed gains (opposite channel)
        this.stereoLeftCrossfeed.gain.value = (1 - width) / 2; // R -> L
        this.stereoRightCrossfeed.gain.value = (1 - width) / 2; // L -> R

        // Use stereo output
        stereoInput = this.stereoOutput!;
      } else {
        // When disabled, set gains to pass-through (width = 1, no crossfeed)
        if (this.stereoLeftDirect && this.stereoRightDirect &&
          this.stereoLeftCrossfeed && this.stereoRightCrossfeed) {
          this.stereoLeftDirect.gain.value = 1;
          this.stereoRightDirect.gain.value = 1;
          this.stereoLeftCrossfeed.gain.value = 0;
          this.stereoRightCrossfeed.gain.value = 0;
        }
        // Still use stereo output (it will pass through unchanged)
        stereoInput = this.stereoOutput || stereoInputSource;
      }
    }

    // Limiter with bypass
    stereoInput.connect(this.limiterNode!);
    stereoInput.connect(this.limiterBypass!);
    this.limiterNode!.connect(this.limiterMix!);
    this.limiterMix!.connect(this.limiterOutput!);
    this.limiterBypass!.connect(this.limiterOutput!);

    // Master bypass for A/B comparison
    if (this.masterBypass && this.masterMix && this.masterOutput) {
      // Original signal (bypass all effects) - connect input gain directly
      this.gainNodes.input!.connect(this.masterBypass);
      // Mastered signal (through all effects) - connect limiter output
      this.limiterOutput!.connect(this.masterMix);
      // Mix original and mastered
      this.masterBypass.connect(this.masterOutput);
      this.masterMix.connect(this.masterOutput);
      // Connect master output to output gain
      this.masterOutput.connect(this.gainNodes.output!);
    } else {
      // Fallback: connect limiter output directly to output gain if master bypass not available
      this.limiterOutput!.connect(this.gainNodes.output!);
    }

    // Connect to analyser and destination
    this.gainNodes.output!.connect(this.analyserNode!);
    this.analyserNode!.connect(this.audioContext.destination);
  }

  // Setup audio chain untuk playback (hanya create source node, graph sudah ada)
  async setupAudioChain(settings: AudioEngineSettings): Promise<void> {
    if (!this.audioContext || !this.audioBuffer) {
      throw new Error('Audio context or buffer not initialized');
    }

    // Jika graph belum dibangun, build sekarang
    if (!this.audioGraphBuilt) {
      await this.buildAudioGraph(settings);
      this.audioGraphBuilt = true;
    }

    // Hanya create source node baru untuk playback (graph sudah ada)
    if (this.sourceNode && this.sourceNodeStarted) {
      try {
        this.sourceNode.stop();
      } catch {
        // Ignore
      }
      this.sourceNode.disconnect();
    }

    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;

    // Connect source ke input gain (graph sudah terhubung)
    this.sourceNode.connect(this.gainNodes.input!);

    // Handle playback end
    this.sourceNode.onended = () => {
      this.isPlaying = false;
      this.sourceNodeStarted = false;
      this.pausedTime = 0;
      this.currentTime = 0;
      this.stopGainReductionTracking();
      if (this.onTimeUpdate) {
        this.onTimeUpdate(0);
      }
    };
  }

  private setupReverb(settings: { enabled: boolean; mix: number; size: number; decay: number; damping: number }): void {
    if (!this.audioContext) return;

    // Create delay-based reverb dengan feedback loop
    const maxDelayTime = 0.1; // Max 100ms untuk reverb yang lebih natural
    this.reverbDelayNode = this.audioContext.createDelay(maxDelayTime);
    const delayTime = settings.size / 100 * 0.1; // Max 100ms delay
    this.reverbDelayNode.delayTime.value = delayTime;

    // Feedback gain untuk decay control
    this.reverbFeedbackGain = this.audioContext.createGain();
    this.reverbFeedbackGain.gain.value = Math.min(0.95, settings.decay / 10 * 0.3); // Max 0.3 feedback, cap at 0.95 untuk stabilitas

    // Damping filter untuk high frequency rolloff
    this.reverbDampingFilter = this.audioContext.createBiquadFilter();
    this.reverbDampingFilter.type = 'lowpass';
    this.reverbDampingFilter.frequency.value = 20000 - (settings.damping / 100 * 15000);
    this.reverbDampingFilter.Q.value = 1;

    // Setup feedback loop: delay -> damping -> feedback -> delay
    this.reverbDelayNode.connect(this.reverbDampingFilter);
    this.reverbDampingFilter.connect(this.reverbFeedbackGain);
    this.reverbFeedbackGain.connect(this.reverbDelayNode);

    // Wet gain (reverb signal)
    this.reverbGainNode = this.audioContext.createGain();
    this.reverbGainNode.gain.value = settings.mix / 100;

    // Dry gain (original signal)
    this.dryGainNode = this.audioContext.createGain();
    this.dryGainNode.gain.value = 1 - (settings.mix / 100);

    // Connect delay output to wet gain
    this.reverbDelayNode.connect(this.reverbGainNode);

    // Bypass nodes
    this.reverbMix = this.audioContext.createGain();
    this.reverbBypass = this.audioContext.createGain();
    this.reverbMix.gain.value = settings.enabled ? 1 : 0;
    this.reverbBypass.gain.value = settings.enabled ? 0 : 1;
    this.reverbOutput = this.audioContext.createGain();

    // Update current settings
    this.currentSettings.reverb = { ...settings };
  }





  private setupStereoWidth(width: number): void {
    if (!this.audioContext) return;

    // Stereo width effect using proper mid-side processing
    // Mid = (L + R) / 2, Side = (L - R) / 2
    // Width > 100: widen (increase side), Width < 100: narrow (decrease side)
    this.splitterNode = this.audioContext.createChannelSplitter(2);
    this.mergerNode = this.audioContext.createChannelMerger(2);

    const widthGain = width / 100;

    // Create gain nodes for mid and side
    this.stereoMidGain = this.audioContext.createGain();
    this.stereoSideGain = this.audioContext.createGain();

    // Mid stays constant (1.0), side is adjusted by width
    this.stereoMidGain.gain.value = 1.0;
    this.stereoSideGain.gain.value = widthGain;

    // Note: Actual mid-side matrix will be implemented in connectAudioGraph
    // using ScriptProcessorNode or AudioWorklet would be ideal, but for now
    // we'll use a simplified approach with gain adjustments
  }

  private setupMultibandCompressor(settings: { enabled: boolean; bands: Array<{ name: string; lowFreq: number; highFreq: number; threshold: number; ratio: number; gain: number; active: boolean }> }): void {
    if (!this.audioContext) return;

    // Cleanup existing multiband
    this.multibandFilters = [];

    // Always create bypass, output, and mix nodes
    this.multibandBypass = this.audioContext.createGain();
    this.multibandOutput = this.audioContext.createGain();
    this.multibandMix = this.audioContext.createGain();

    // Always connect multiband output and bypass to mix
    // This ensures routing is always correct even when enabled state changes
    if (this.multibandOutput && this.multibandBypass) {
      this.multibandOutput.connect(this.multibandMix);
      this.multibandBypass.connect(this.multibandMix);
    }

    // Check if there are any active bands
    const hasActiveBands = settings.bands.length > 0 && settings.bands.some(band => band.active);

    // Set bypass/output gains based on enabled state and active bands
    // When enabled with active bands, use multiband output
    // Otherwise, use bypass to prevent silence
    if (settings.enabled && hasActiveBands) {
      this.multibandBypass.gain.value = 0;
      this.multibandOutput.gain.value = 1;
    } else {
      this.multibandBypass.gain.value = 1;
      this.multibandOutput.gain.value = 0;
    }

    // Always create bands structure (even if disabled) so routing is ready when enabled

    // Create filter and compressor for each band
    // Only create bands that are active
    settings.bands.forEach((band) => {
      if (!band.active) return; // Skip inactive bands
      // Highpass filter for lower frequency cutoff
      const highpass = this.audioContext!.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = band.lowFreq;
      highpass.Q.value = 0.7;

      // Lowpass filter for upper frequency cutoff
      const lowpass = this.audioContext!.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = band.highFreq;
      lowpass.Q.value = 0.7;

      // Compressor for this band
      const compressor = this.audioContext!.createDynamicsCompressor();
      compressor.threshold.value = band.threshold;
      compressor.ratio.value = band.ratio;
      compressor.attack.value = 0.003; // 3ms attack
      compressor.release.value = 0.1; // 100ms release
      compressor.knee.value = 30;

      // Gain for makeup gain
      const gain = this.audioContext!.createGain();
      gain.gain.value = this.dbToGain(band.gain);

      // Connect band chain
      highpass.connect(lowpass);
      lowpass.connect(compressor);
      compressor.connect(gain);

      // Connect each band output to multiband output (sum all bands)
      gain.connect(this.multibandOutput!);

      this.multibandFilters.push({ lowpass, highpass, compressor, gain });
    });
  }

  async play(): Promise<void> {
    if (!this.audioContext || !this.audioBuffer) {
      throw new Error('Audio not loaded');
    }

    // Reset loudness meter when starting playback
    this.resetLoudnessMeter();

    if (this.isPlaying) return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    // Pastikan graph sudah dibangun
    if (!this.audioGraphBuilt) {
      await this.buildAudioGraph(this.getCurrentSettings());
      this.audioGraphBuilt = true;
    }

    // Pastikan master fade tidak pada posisi mute
    if (this.masterFade) {
      const now = this.audioContext.currentTime;
      this.masterFade.gain.setValueAtTime(1, now);
    }

    // Stop dan cleanup source node yang ada (jika ada)
    // PASTIKAN benar-benar di-stop sebelum membuat yang baru
    if (this.sourceNode) {
      // Remove onended handler untuk mencegah callback yang tidak diinginkan
      this.sourceNode.onended = null;

      if (this.sourceNodeStarted) {
        try {
          this.sourceNode.stop();
        } catch {
          // Ignore
        }
      }

      try {
        this.sourceNode.disconnect();
      } catch {
        // Node mungkin sudah ter-disconnect, ignore
      }

      // Clear reference
      this.sourceNode = null;
      this.sourceNodeStarted = false;
    }

    // Buat source node baru (pastikan sourceNode sudah null)
    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;

    // Connect source ke input gain (graph sudah terhubung)
    this.sourceNode.connect(this.gainNodes.input!);

    // Handle playback end
    this.sourceNode.onended = () => {
      this.isPlaying = false;
      this.sourceNodeStarted = false;
      this.pausedTime = 0;
      this.currentTime = 0;
      this.stopTimeUpdate();
      if (this.onTimeUpdate) {
        this.onTimeUpdate(0);
      }
    };

    this.startTime = this.audioContext.currentTime - this.pausedTime;
    this.sourceNode.start(0, this.pausedTime);
    this.sourceNodeStarted = true;
    this.isPlaying = true;

    this.startTimeUpdate();
    this.startGainReductionTracking();
  }

  // Gain reduction tracking untuk meter (DAW-style)
  private startGainReductionTracking(): void {
    if (!this.compressorNode || !this.gainReductionCallback) return;

    const track = () => {
      if (!this.compressorNode || !this.isPlaying) {
        this.gainReductionFrameId = null;
        return;
      }

      // Read gain reduction dari DynamicsCompressorNode
      // Note: Web Audio API tidak expose gain reduction secara langsung
      // Kita perlu estimate dari threshold dan ratio
      // Atau gunakan AnalyserNode untuk measure input vs output
      if (this.gainReductionCallback) {
        // Simplified: estimate dari compressor settings
        // Real implementation akan perlu measure actual reduction
        const threshold = this.compressorNode.threshold.value;
        const ratio = this.compressorNode.ratio.value;
        // Estimate gain reduction (simplified)
        const estimatedReduction = Math.max(0, -threshold / ratio);
        this.gainReductionCallback(estimatedReduction);
      }

      this.gainReductionFrameId = requestAnimationFrame(track);
    };

    this.gainReductionFrameId = requestAnimationFrame(track);
  }

  private stopGainReductionTracking(): void {
    if (this.gainReductionFrameId !== null) {
      cancelAnimationFrame(this.gainReductionFrameId);
      this.gainReductionFrameId = null;
    }
  }

  setGainReductionCallback(callback: (reduction: number) => void): void {
    this.gainReductionCallback = callback;
  }

  pause(): void {
    if (!this.isPlaying || !this.sourceNode || !this.audioContext) return;

    // Remove onended handler untuk mencegah callback yang tidak diinginkan
    this.sourceNode.onended = null;

    if (this.sourceNodeStarted) {
      try {
        this.sourceNode.stop();
      } catch {
        // Source node mungkin sudah berakhir, ignore
      }
      this.sourceNodeStarted = false;
    }

    // Jangan disconnect atau clear source node saat pause
    // Biarkan tetap terhubung untuk bisa resume nanti
    // Tapi kita tidak akan menggunakan source node yang sama, akan buat baru saat play()

    this.pausedTime = this.currentTime;
    this.isPlaying = false;
    this.stopTimeUpdate();
    this.stopGainReductionTracking();
  }

  stop(): void {
    if (!this.sourceNode) return;

    if (this.isPlaying && this.sourceNodeStarted) {
      try {
        this.sourceNode.stop();
      } catch (error) {
        // Source node may have already ended
        console.warn('Failed to stop source node:', error);
      }
      this.sourceNodeStarted = false;
    }
    this.isPlaying = false;
    this.pausedTime = 0;
    this.currentTime = 0;
    this.stopTimeUpdate();
    this.stopGainReductionTracking();
    if (this.onTimeUpdate) {
      this.onTimeUpdate(0);
    }
  }

  seek(time: number): void {
    if (!this.audioBuffer || !this.audioContext) return;

    const wasPlaying = this.isPlaying;
    const seekTime = Math.max(0, Math.min(time, this.duration));

    // Stop dan cleanup source node yang sedang playing (jika ada)
    // PASTIKAN benar-benar di-stop sebelum membuat yang baru
    if (this.sourceNode) {
      // Remove onended handler untuk mencegah callback yang tidak diinginkan
      this.sourceNode.onended = null;

      if (this.sourceNodeStarted) {
        try {
          this.sourceNode.stop();
        } catch {
          // Source node mungkin sudah berakhir, ignore
        }
      }

      try {
        this.sourceNode.disconnect();
      } catch {
        // Node mungkin sudah ter-disconnect, ignore
      }

      // Clear reference
      this.sourceNode = null;
      this.sourceNodeStarted = false;
    }

    // Stop time update tracking sebelum membuat source node baru
    this.stopTimeUpdate();
    this.stopGainReductionTracking();

    // Update waktu
    this.pausedTime = seekTime;
    this.currentTime = seekTime;

    // Jika sedang playing, langsung buat source node baru dan play
    if (wasPlaying) {
      // Pastikan graph sudah dibangun
      if (!this.audioGraphBuilt) {
        this.buildAudioGraph(this.getCurrentSettings());
        this.audioGraphBuilt = true;
      }

      // Reset loudness meter
      this.resetLoudnessMeter();

      // Buat source node baru (pastikan sourceNode sudah null)
      this.sourceNode = this.audioContext.createBufferSource();
      this.sourceNode.buffer = this.audioBuffer;

      // Connect ke input gain
      this.sourceNode.connect(this.gainNodes.input!);

      // Handle playback end
      this.sourceNode.onended = () => {
        // Pastikan ini adalah source node yang masih aktif
        if (this.sourceNode && this.sourceNodeStarted) {
          this.isPlaying = false;
          this.sourceNodeStarted = false;
          this.pausedTime = 0;
          this.currentTime = 0;
          this.stopTimeUpdate();
          if (this.onTimeUpdate) {
            this.onTimeUpdate(0);
          }
        }
      };

      // Start dari posisi yang di-seek
      this.startTime = this.audioContext.currentTime - seekTime;
      this.sourceNode.start(0, seekTime);
      this.sourceNodeStarted = true;
      this.isPlaying = true;

      // Start time update tracking (ini akan trigger onTimeUpdate secara berkala)
      this.startTimeUpdate();
      this.startGainReductionTracking();

      // Update time callback segera setelah seek (untuk UI update)
      if (this.onTimeUpdate) {
        this.onTimeUpdate(seekTime);
      }
    } else {
      // Jika tidak playing, cukup update waktu
      if (this.onTimeUpdate) {
        this.onTimeUpdate(seekTime);
      }
    }
  }

  private startTimeUpdate(): void {
    const update = () => {
      if (!this.audioContext || !this.isPlaying) return;

      this.currentTime = this.audioContext.currentTime - this.startTime;

      if (this.currentTime >= this.duration) {
        this.stop();
        return;
      }

      if (this.onTimeUpdate) {
        this.onTimeUpdate(this.currentTime);
      }

      this.animationFrameId = requestAnimationFrame(update);
    };

    update();
  }

  private stopTimeUpdate(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Get waveform data from audio buffer (for static waveform visualization)
   */
  getWaveformData(width: number = 1000): Float32Array | null {
    if (!this.audioBuffer) return null;

    const channelData = this.audioBuffer.getChannelData(0); // Use first channel
    const length = channelData.length;
    const samplesPerPixel = Math.floor(length / width);

    // Downsample untuk performa
    const waveform = new Float32Array(width);
    for (let i = 0; i < width; i++) {
      const start = i * samplesPerPixel;
      const end = Math.min(start + samplesPerPixel, length);

      // Get peak value in this range
      let max = 0;
      for (let j = start; j < end; j++) {
        const abs = Math.abs(channelData[j]);
        if (abs > max) max = abs;
      }
      waveform[i] = max;
    }

    return waveform;
  }

  /**
   * Get stereo waveform data from audio buffer (for DAW-style stereo visualization)
   * Returns separate left and right channel data
   */
  getStereoWaveformData(width: number = 1000): { left: Float32Array; right: Float32Array } | null {
    if (!this.audioBuffer) return null;

    const numberOfChannels = this.audioBuffer.numberOfChannels;
    const leftChannelData = this.audioBuffer.getChannelData(0);

    // Untuk stereo: ambil channel 1, untuk mono: copy channel 0 (bukan reference yang sama)
    let rightChannelData: Float32Array;
    if (numberOfChannels > 1) {
      // Stereo: ambil channel 1 secara terpisah
      rightChannelData = this.audioBuffer.getChannelData(1);
    } else {
      // Mono: copy channel 0 ke array baru supaya tidak share reference
      rightChannelData = new Float32Array(leftChannelData);
    }

    const length = leftChannelData.length;
    const samplesPerPixel = Math.floor(length / width);

    const leftWaveform = new Float32Array(width);
    const rightWaveform = new Float32Array(width);

    for (let i = 0; i < width; i++) {
      const start = i * samplesPerPixel;
      const end = Math.min(start + samplesPerPixel, length);

      // Get peak value in this range for left channel
      let maxLeft = 0;
      for (let j = start; j < end; j++) {
        const abs = Math.abs(leftChannelData[j]);
        if (abs > maxLeft) maxLeft = abs;
      }
      leftWaveform[i] = maxLeft;

      // Get peak value in this range for right channel
      let maxRight = 0;
      for (let j = start; j < end; j++) {
        const abs = Math.abs(rightChannelData[j]);
        if (abs > maxRight) maxRight = abs;
      }
      rightWaveform[i] = maxRight;
    }

    return { left: leftWaveform, right: rightWaveform };
  }

  getAnalysisData(): AudioAnalysisData | null {
    if (!this.analyserNode || !this.audioContext) return null;

    const waveform = new Uint8Array(this.analyserNode.fftSize);
    const spectrum = new Uint8Array(this.analyserNode.frequencyBinCount);
    const floatSpectrum = new Float32Array(this.analyserNode.frequencyBinCount);

    this.analyserNode.getByteTimeDomainData(waveform);
    this.analyserNode.getByteFrequencyData(spectrum);
    this.analyserNode.getFloatFrequencyData(floatSpectrum);

    // Get Float32Array for accurate loudness calculation
    const waveformFloat = new Float32Array(this.analyserNode.fftSize);
    this.analyserNode.getFloatTimeDomainData(waveformFloat);

    // Calculate VU levels from Float32Array for better accuracy
    const numberOfChannels = this.audioBuffer ? this.audioBuffer.numberOfChannels : 2;
    const stereoVU = this.calculateStereoVU(waveformFloat, numberOfChannels);
    const vuLeft = stereoVU.left;
    const vuRight = stereoVU.right;

    // Calculate accurate EBU R128 loudness
    const loudness = this.calculateEBUR128Loudness(waveformFloat);

    return {
      waveform,
      spectrum,
      floatSpectrum,
      sampleRate: this.audioContext.sampleRate,
      frequencyBinCount: this.analyserNode.frequencyBinCount,
      minDecibels: this.analyserNode.minDecibels,
      maxDecibels: this.analyserNode.maxDecibels,
      vuLeft,
      vuRight,
      loudness,
    };
  }

  private calculateVU(data: Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const sample = (data[i] - 128) / 128;
      sum += sample * sample;
    }
    const rms = Math.sqrt(sum / data.length);
    const db = 20 * Math.log10(rms + 0.0001);
    return Math.max(-60, Math.min(0, db));
  }

  // Calculate VU from Float32Array for better accuracy
  private calculateVUFromFloat(data: Float32Array): number {
    let sumSquares = 0;
    for (let i = 0; i < data.length; i++) {
      const sample = data[i];
      sumSquares += sample * sample;
    }
    const rms = Math.sqrt(sumSquares / data.length);
    const db = 20 * Math.log10(Math.max(0.0001, rms));
    return Math.max(-60, Math.min(0, db));
  }

  // Calculate stereo VU levels (left and right separately)
  private calculateStereoVU(waveformFloat: Float32Array, numberOfChannels: number): { left: number; right: number } {
    if (numberOfChannels === 1) {
      // Mono: use same value for both
      const vu = this.calculateVUFromFloat(waveformFloat);
      return { left: vu, right: vu };
    }

    // Stereo: split channels
    const samplesPerChannel = waveformFloat.length / numberOfChannels;
    const leftChannel = new Float32Array(samplesPerChannel);
    const rightChannel = new Float32Array(samplesPerChannel);

    for (let i = 0; i < samplesPerChannel; i++) {
      leftChannel[i] = waveformFloat[i * numberOfChannels];
      if (numberOfChannels >= 2) {
        rightChannel[i] = waveformFloat[i * numberOfChannels + 1];
      } else {
        rightChannel[i] = waveformFloat[i * numberOfChannels];
      }
    }

    const vuLeft = this.calculateVUFromFloat(leftChannel);
    const vuRight = this.calculateVUFromFloat(rightChannel);

    return { left: vuLeft, right: vuRight };
  }

  private resetLoudnessMeter(): void {
    this.loudnessBuffer = [];
    this.momentaryBuffer = [];
    this.shortTermBuffer = [];
    this.integratedSamples = [];
    this.truePeakMax = -Infinity;
    this.loudnessHistory = [];
    this.loudnessStartTime = null;
  }

  // Calculate accurate EBU R128 / ITU-R BS.1770-4 loudness
  private calculateEBUR128Loudness(data: Float32Array): {
    momentary: number;
    shortTerm: number;
    integrated: number;
    truePeak: number;
    lra: number;
  } {
    if (!this.audioContext) {
      return { momentary: -23, shortTerm: -23, integrated: -23, truePeak: -1, lra: 0 };
    }

    const sampleRate = this.audioContext.sampleRate;

    // Add to buffer for time-windowed calculations
    this.loudnessBuffer.push(new Float32Array(data));

    // Keep only recent buffers (last 3 seconds at 48kHz = ~144k samples)
    const maxBuffers = Math.ceil((3 * sampleRate) / data.length);
    if (this.loudnessBuffer.length > maxBuffers) {
      this.loudnessBuffer.shift();
    }

    // Calculate true peak with oversampling (4x)
    let truePeak = -Infinity;
    for (let i = 0; i < data.length; i++) {
      // Oversample for true peak detection
      for (let os = 0; os < 4; os++) {
        // Linear interpolation for oversampling
        const nextIdx = Math.min(i + 1, data.length - 1);
        const interpolated = data[i] + (data[nextIdx] - data[i]) * (os / 4);
        const peak = Math.abs(interpolated);
        if (peak > truePeak) {
          truePeak = peak;
        }
      }
    }

    // Convert to dBTP (True Peak in dB)
    const truePeakDb = 20 * Math.log10(Math.max(0.0001, truePeak));
    if (truePeakDb > this.truePeakMax) {
      this.truePeakMax = truePeakDb;
    }

    // Calculate RMS with K-weighting approximation
    // K-weighting: high-shelf at 1.5kHz with +4dB gain
    let sumSquares = 0;
    let sampleCount = 0;

    for (let i = 0; i < data.length; i++) {
      const sample = data[i];
      // Simplified K-weighting: boost high frequencies
      // Real implementation would use proper IIR filter
      const freq = (i * sampleRate) / (data.length * 2);
      let weighted = sample;

      // Approximate high-shelf boost at 1.5kHz
      if (freq > 1500) {
        const boost = 1 + (freq - 1500) / 10000; // Approximate boost
        weighted = sample * Math.min(boost, 1.58); // +4dB = ~1.58x
      }

      sumSquares += weighted * weighted;
      sampleCount++;
    }

    const rms = Math.sqrt(sumSquares / sampleCount);
    const power = rms * rms;

    // Convert to LUFS (Loudness Units relative to Full Scale)
    // LUFS = -0.691 + 10 * log10(power) for K-weighted signal
    const lufs = -0.691 + 10 * Math.log10(Math.max(0.0000001, power));

    // Time constants for EBU R128
    const momentaryWindow = 0.4; // 400ms
    const shortTermWindow = 3.0; // 3 seconds
    const samplesPerBuffer = data.length;
    const timePerBuffer = samplesPerBuffer / sampleRate;

    // Add to momentary buffer (400ms window)
    this.momentaryBuffer.push(lufs);
    const momentarySamples = Math.ceil(momentaryWindow / timePerBuffer);
    if (this.momentaryBuffer.length > momentarySamples) {
      this.momentaryBuffer.shift();
    }

    // Add to short-term buffer (3s window)
    this.shortTermBuffer.push(lufs);
    const shortTermSamples = Math.ceil(shortTermWindow / timePerBuffer);
    if (this.shortTermBuffer.length > shortTermSamples) {
      this.shortTermBuffer.shift();
    }

    // Integrated loudness (overall, with gating)
    if (this.loudnessStartTime === null) {
      this.loudnessStartTime = this.audioContext.currentTime;
    }

    // Only add to integrated if above absolute threshold (-70 LUFS)
    if (lufs > -70) {
      this.integratedSamples.push(lufs);
      this.loudnessHistory.push(lufs);

      // Keep history for LRA calculation (last 20 seconds)
      const maxHistorySamples = Math.ceil((20 * sampleRate) / samplesPerBuffer);
      if (this.loudnessHistory.length > maxHistorySamples) {
        this.loudnessHistory.shift();
      }
    }

    // Calculate momentary (400ms average)
    let momentary = -23;
    if (this.momentaryBuffer.length > 0) {
      const sum = this.momentaryBuffer.reduce((a, b) => a + b, 0);
      momentary = sum / this.momentaryBuffer.length;
    }

    // Calculate short-term (3s average)
    let shortTerm = -23;
    if (this.shortTermBuffer.length > 0) {
      const sum = this.shortTermBuffer.reduce((a, b) => a + b, 0);
      shortTerm = sum / this.shortTermBuffer.length;
    }

    // Calculate integrated (overall average with gating)
    let integrated = -23;
    if (this.integratedSamples.length > 0) {
      // Apply relative gate (-10 LU relative to ungated loudness)
      const ungatedSum = this.integratedSamples.reduce((a, b) => a + b, 0);
      const ungatedLoudness = ungatedSum / this.integratedSamples.length;
      const gateThreshold = ungatedLoudness - 10;

      const gatedSamples = this.integratedSamples.filter(l => l >= gateThreshold);
      if (gatedSamples.length > 0) {
        const gatedSum = gatedSamples.reduce((a, b) => a + b, 0);
        integrated = gatedSum / gatedSamples.length;
      } else {
        integrated = ungatedLoudness;
      }
    }

    // Calculate LRA (Loudness Range) - 10th to 95th percentile
    let lra = 0;
    if (this.loudnessHistory.length > 100) {
      const sorted = [...this.loudnessHistory].sort((a, b) => a - b);
      const p10 = sorted[Math.floor(sorted.length * 0.1)];
      const p95 = sorted[Math.floor(sorted.length * 0.95)];
      lra = p95 - p10;
    }

    return {
      momentary: Math.max(-70, Math.min(0, momentary)),
      shortTerm: Math.max(-70, Math.min(0, shortTerm)),
      integrated: Math.max(-70, Math.min(0, integrated)),
      truePeak: Math.max(-60, Math.min(10, this.truePeakMax)),
      lra: Math.max(0, Math.min(20, lra)),
    };
  }

  private calculateLoudness(data: Uint8Array): {
    momentary: number;
    shortTerm: number;
    integrated: number;
    truePeak: number;
    lra: number;
  } {
    // Legacy method - now uses calculateEBUR128Loudness
    const waveformFloat = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) {
      waveformFloat[i] = (data[i] - 128) / 128;
    }
    return this.calculateEBUR128Loudness(waveformFloat);
  }

  setOnTimeUpdate(callback: (time: number) => void): void {
    this.onTimeUpdate = callback;
  }

  getCurrentTime(): number {
    return this.currentTime;
  }

  getDuration(): number {
    return this.duration;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  updateSettings(settings: Partial<AudioEngineSettings>): void {
    if (!this.audioContext) return;

    const currentSettings = this.getCurrentSettings();
    const newSettings = { ...currentSettings, ...settings };
    const now = this.audioContext.currentTime;

    // Update dengan setValueAtTime untuk realtime automation (DAW-style)
    if (settings.inputGain !== undefined && this.gainNodes.input) {
      this.gainNodes.input.gain.setValueAtTime(this.dbToGain(settings.inputGain), now);
    }

    if (settings.outputGain !== undefined && this.gainNodes.output) {
      this.gainNodes.output.gain.setValueAtTime(this.dbToGain(settings.outputGain), now);
    }

    if (settings.compressor && this.compressorNode) {
      if (settings.compressor.enabled !== undefined && this.compressorMix && this.compressorBypass) {
        this.compressorMix.gain.setValueAtTime(settings.compressor.enabled ? 1 : 0, now);
        this.compressorBypass.gain.setValueAtTime(settings.compressor.enabled ? 0 : 1, now);
      }
      if (settings.compressor.threshold !== undefined) {
        this.compressorNode.threshold.setValueAtTime(settings.compressor.threshold, now);
      }
      if (settings.compressor.ratio !== undefined) {
        this.compressorNode.ratio.setValueAtTime(settings.compressor.ratio, now);
      }
      if (settings.compressor.attack !== undefined) {
        this.compressorNode.attack.setValueAtTime(settings.compressor.attack / 1000, now);
      }
      if (settings.compressor.release !== undefined) {
        this.compressorNode.release.setValueAtTime(settings.compressor.release / 1000, now);
      }
      if (settings.compressor.gain !== undefined && this.compressorGainNode) {
        this.compressorGainNode.gain.setValueAtTime(this.dbToGain(settings.compressor.gain), now);
      }
    }

    if (settings.limiter && this.limiterNode) {
      if (settings.limiter.enabled !== undefined && this.limiterMix && this.limiterBypass) {
        this.limiterMix.gain.setValueAtTime(settings.limiter.enabled ? 1 : 0, now);
        this.limiterBypass.gain.setValueAtTime(settings.limiter.enabled ? 0 : 1, now);
      }
      if (settings.limiter.threshold !== undefined) {
        this.limiterNode.threshold.setValueAtTime(settings.limiter.threshold, now);
      }
    }

    // Update reverb parameters
    if (settings.reverb) {
      if (settings.reverb.enabled !== undefined && this.reverbMix && this.reverbBypass) {
        this.reverbMix.gain.setValueAtTime(settings.reverb.enabled ? 1 : 0, now);
        this.reverbBypass.gain.setValueAtTime(settings.reverb.enabled ? 0 : 1, now);
      }
      if (this.reverbGainNode && settings.reverb.mix !== undefined) {
        this.reverbGainNode.gain.setValueAtTime(settings.reverb.mix / 100, now);
      }
      if (this.dryGainNode && settings.reverb.mix !== undefined) {
        this.dryGainNode.gain.setValueAtTime(1 - (settings.reverb.mix / 100), now);
      }
      if (this.reverbDelayNode && settings.reverb.size !== undefined) {
        const delayTime = settings.reverb.size / 100 * 0.1; // Max 100ms
        this.reverbDelayNode.delayTime.setValueAtTime(delayTime, now);
      }
      if (this.reverbFeedbackGain && settings.reverb.decay !== undefined) {
        // Cap feedback at 0.95 untuk stabilitas
        const feedbackValue = Math.min(0.95, settings.reverb.decay / 10 * 0.3);
        this.reverbFeedbackGain.gain.setValueAtTime(feedbackValue, now);
      }
      if (this.reverbDampingFilter && settings.reverb.damping !== undefined) {
        this.reverbDampingFilter.frequency.setValueAtTime(20000 - (settings.reverb.damping / 100 * 15000), now);
      }
    }

    // Update stereo width (real-time update)
    if (settings.stereoWidth) {
      if (this.stereoLeftDirect && this.stereoRightDirect &&
        this.stereoLeftCrossfeed && this.stereoRightCrossfeed) {
        const width = settings.stereoWidth.width !== undefined
          ? settings.stereoWidth.width / 100
          : this.currentSettings.stereoWidth.width / 100;

        // Update based on enabled state
        if (settings.stereoWidth.enabled !== undefined
          ? settings.stereoWidth.enabled
          : this.currentSettings.stereoWidth.enabled) {
          // When enabled, apply stereo width formula
          this.stereoLeftDirect.gain.setValueAtTime((1 + width) / 2, now);
          this.stereoRightDirect.gain.setValueAtTime((1 + width) / 2, now);
          this.stereoLeftCrossfeed.gain.setValueAtTime((1 - width) / 2, now);
          this.stereoRightCrossfeed.gain.setValueAtTime((1 - width) / 2, now);
        } else {
          // When disabled, set to pass-through (width = 1, no crossfeed)
          this.stereoLeftDirect.gain.setValueAtTime(1, now);
          this.stereoRightDirect.gain.setValueAtTime(1, now);
          this.stereoLeftCrossfeed.gain.setValueAtTime(0, now);
          this.stereoRightCrossfeed.gain.setValueAtTime(0, now);
        }
      }
    }

    // Update multiband compressor parameters
    if (settings.multibandCompressor) {
      if (settings.multibandCompressor.enabled !== undefined) {
        if (this.multibandOutput && this.multibandBypass) {
          // Check if there are any active bands
          const bands = settings.multibandCompressor.bands ?? [];
          const hasActiveBands = bands.length > 0 && bands.some(band => band.active);

          if (settings.multibandCompressor.enabled && hasActiveBands) {
            // When enabled with active bands, use multiband output
            this.multibandOutput.gain.setValueAtTime(1, now);
            this.multibandBypass.gain.setValueAtTime(0, now);
          } else {
            // When disabled or no active bands, use bypass to prevent silence
            this.multibandOutput.gain.setValueAtTime(0, now);
            this.multibandBypass.gain.setValueAtTime(1, now);
          }
        }
      }
      if (settings.multibandCompressor.bands) {
        settings.multibandCompressor.bands.forEach((band, index) => {
          if (this.multibandFilters[index]) {
            const filter = this.multibandFilters[index];
            if (band.threshold !== undefined) {
              filter.compressor.threshold.setValueAtTime(band.threshold, now);
            }
            if (band.ratio !== undefined) {
              filter.compressor.ratio.setValueAtTime(band.ratio, now);
            }
            if (band.gain !== undefined) {
              filter.gain.gain.setValueAtTime(this.dbToGain(band.gain), now);
            }
            if (band.lowFreq !== undefined) {
              filter.highpass.frequency.setValueAtTime(band.lowFreq, now);
            }
            if (band.highFreq !== undefined) {
              filter.lowpass.frequency.setValueAtTime(band.highFreq, now);
            }
            // Note: active state would need to be handled by recreating the chain or using bypass nodes
          }
        });
      }
    }

    // Store current settings for reference
    this.currentSettings = newSettings;
  }

  /**
   * Default settings
   */
  private currentSettings: AudioEngineSettings = {
    inputGain: 0,
    outputGain: 0,
    compressor: { enabled: true, threshold: -20, ratio: 4, attack: 10, release: 100, gain: 0 },
    limiter: { enabled: true, threshold: -0.3 },
    stereoWidth: { enabled: true, width: 100 },
    reverb: { enabled: false, mix: 0, size: 0, decay: 0, damping: 0 },
    multibandCompressor: {
      enabled: true,
      bands: [
        { name: 'LOW', lowFreq: 20, highFreq: 150, threshold: -20, ratio: 3, gain: 0, active: true },
        { name: 'LOW-MID', lowFreq: 150, highFreq: 800, threshold: -18, ratio: 4, gain: 0, active: true },
        { name: 'MID', lowFreq: 800, highFreq: 3000, threshold: -15, ratio: 3.5, gain: 0, active: true },
        { name: 'HIGH-MID', lowFreq: 3000, highFreq: 10000, threshold: -16, ratio: 3, gain: 0, active: true },
        { name: 'HIGH', lowFreq: 10000, highFreq: 20000, threshold: -12, ratio: 2.5, gain: 0, active: true },
      ],
    },
  };

  private getCurrentSettings(): AudioEngineSettings {
    return this.currentSettings;
  }

  setCurrentSettings(settings: AudioEngineSettings): void {
    this.currentSettings = settings;
  }

  private dbToGain(db: number): number {
    return Math.pow(10, db / 20);
  }

  // Cleanup graph nodes (dipanggil saat rebuild graph)
  private cleanupGraph(): void {
    // Disconnect semua nodes tapi jangan destroy
    if (this.compressorNode) {
      try {
        this.compressorNode.disconnect();
      } catch {
        // Ignore
      }
    }
    if (this.compressorGainNode) {
      try {
        this.compressorGainNode.disconnect();
      } catch {
        // Ignore
      }
    }
    if (this.limiterNode) {
      try {
        this.limiterNode.disconnect();
      } catch {
        // Ignore
      }
    }
    if (this.gainNodes.input) {
      try {
        this.gainNodes.input.disconnect();
      } catch {
        // Ignore
      }
    }
    if (this.gainNodes.output) {
      try {
        this.gainNodes.output.disconnect();
      } catch {
        // Ignore
      }
    }
    // Cleanup multiband
    this.multibandFilters.forEach(filter => {
      try {
        filter.lowpass.disconnect();
        filter.highpass.disconnect();
        filter.compressor.disconnect();
        filter.gain.disconnect();
      } catch {
        // Ignore
      }
    });
    this.multibandFilters = [];
    if (this.multibandOutput) {
      try {
        this.multibandOutput.disconnect();
      } catch {
        // Ignore
      }
    }
    if (this.multibandBypass) {
      try {
        this.multibandBypass.disconnect();
      } catch {
        // Ignore
      }
    }
    if (this.multibandMix) {
      try {
        this.multibandMix.disconnect();
      } catch {
        // Ignore
      }
    }
    // Cleanup reverb
    if (this.reverbDelayNode) {
      try {
        this.reverbDelayNode.disconnect();
      } catch {
        // Ignore
      }
    }
    if (this.reverbFeedbackGain) {
      try {
        this.reverbFeedbackGain.disconnect();
      } catch {
        // Ignore
      }
    }
    if (this.reverbDampingFilter) {
      try {
        this.reverbDampingFilter.disconnect();
      } catch {
        // Ignore
      }
    }
    if (this.reverbGainNode) {
      try {
        this.reverbGainNode.disconnect();
      } catch {
        // Ignore
      }
    }
    if (this.dryGainNode) {
      try {
        this.dryGainNode.disconnect();
      } catch {
        // Ignore
      }
    }
    if (this.reverbMix) {
      try {
        this.reverbMix.disconnect();
      } catch {
        // Ignore
      }
    }
    if (this.reverbBypass) {
      try {
        this.reverbBypass.disconnect();
      } catch {
        // Ignore
      }
    }
    if (this.reverbOutput) {
      try {
        this.reverbOutput.disconnect();
      } catch {
        // Ignore
      }
    }
  }

  private cleanup(): void {
    if (this.sourceNode) {
      if (this.sourceNodeStarted) {
        try {
          this.sourceNode.stop();
        } catch {
          // Ignore errors - node may have already ended
        }
        this.sourceNodeStarted = false;
      }
      try {
        this.sourceNode.disconnect();
      } catch {
        // Ignore errors
      }
    }

    // Disconnect all nodes
    const nodes = [
      this.gainNodes.input,
      this.gainNodes.output,
      this.compressorNode,
      this.limiterNode,
      this.convolverNode,
      this.reverbGainNode,
      this.dryGainNode,
    ];

    nodes.forEach(node => {
      if (node) {
        try {
          node.disconnect();
        } catch {
          // Ignore errors
        }
      }
    });
  }

  /**
   * Ekspor audio dalam format WAV, MP3 (320kbps), atau FLAC.
   * Untuk MP3/FLAC, proses: render buffer -> tulis WAV in-memory -> transcode via ffmpeg.wasm.
   *
   * quality:
   * - WAV:
   *   - '16bit' | '24bit' -> gunakan sample rate asli buffer
   *   - 'wav_24_96' -> 24-bit / 96 kHz (hi-res)
   *   - 'wav_24_192' -> 24-bit / 192 kHz (hi-res+)
   * - MP3: '320k'
   * - FLAC: 'lossless'
   */
  async exportAudio(
    settings: AudioEngineSettings,
    format: 'wav' | 'mp3' | 'flac' = 'wav',
    quality?: '16bit' | '24bit' | 'wav_24_96' | 'wav_24_192' | '320k' | 'lossless'
  ): Promise<Blob> {
    console.log('[Export] Format:', format, 'Quality:', quality);
    if (!this.audioBuffer) {
      throw new Error('No audio loaded');
    }

    try {
      const sourceSampleRate = this.audioBuffer.sampleRate;
      // Tentukan sample rate target untuk WAV hi-res tanpa FFmpeg jika memungkinkan
      let sampleRate = sourceSampleRate;
      if (format === 'wav' && quality) {
        if (quality === 'wav_24_96') sampleRate = 96000;
        if (quality === 'wav_24_192') sampleRate = 192000;
      }
      // Hitung panjang target berdasarkan durasi dan sample rate target
      const length = Math.max(1, Math.round(this.audioBuffer.duration * sampleRate));
      const numberOfChannels = this.audioBuffer.numberOfChannels;

      // Create offline context
      const offlineContext = new OfflineAudioContext(numberOfChannels, length, sampleRate);

      // Create source
      const source = offlineContext.createBufferSource();
      source.buffer = this.audioBuffer;

      // Setup audio chain (similar to setupAudioChain but for offline)
      const inputGain = offlineContext.createGain();
      inputGain.gain.value = this.dbToGain(settings.inputGain);

      // Multiband Compressor setup
      let multibandInput: GainNode = inputGain;
      let multibandOutput: GainNode | null = null;
      let multibandBypass: GainNode | null = null;

      if (settings.multibandCompressor.enabled && settings.multibandCompressor.bands.length > 0) {
        multibandBypass = offlineContext.createGain();
        multibandBypass.gain.value = 0;
        multibandOutput = offlineContext.createGain();
        multibandOutput.gain.value = 1;

        // Create filters and compressors for each band
        settings.multibandCompressor.bands.forEach((band) => {
          if (!band.active) return;

          // Highpass filter for lower frequency cutoff
          const highpass = offlineContext.createBiquadFilter();
          highpass.type = 'highpass';
          highpass.frequency.value = band.lowFreq;
          highpass.Q.value = 0.7;

          // Lowpass filter for upper frequency cutoff
          const lowpass = offlineContext.createBiquadFilter();
          lowpass.type = 'lowpass';
          lowpass.frequency.value = band.highFreq;
          lowpass.Q.value = 0.7;

          // Compressor for this band
          const bandCompressor = offlineContext.createDynamicsCompressor();
          bandCompressor.threshold.value = band.threshold;
          bandCompressor.ratio.value = band.ratio;
          bandCompressor.attack.value = 0.003; // 3ms attack
          bandCompressor.release.value = 0.1; // 100ms release
          bandCompressor.knee.value = 30;

          // Gain for makeup gain
          const bandGain = offlineContext.createGain();
          bandGain.gain.value = this.dbToGain(band.gain);

          // Connect band chain
          inputGain.connect(highpass);
          highpass.connect(lowpass);
          lowpass.connect(bandCompressor);
          bandCompressor.connect(bandGain);
          bandGain.connect(multibandOutput!);
        });

        // Also connect input to bypass path
        inputGain.connect(multibandBypass);

        // Mix multiband output and bypass
        const multibandMix = offlineContext.createGain();
        multibandOutput!.connect(multibandMix);
        multibandBypass.connect(multibandMix);
        multibandInput = multibandMix;
      } else {
        multibandBypass = offlineContext.createGain();
        multibandBypass.gain.value = 1;
        inputGain.connect(multibandBypass);
        multibandInput = multibandBypass;
      }

      // Compressor with bypass
      const compressor = offlineContext.createDynamicsCompressor();
      compressor.threshold.value = settings.compressor.threshold;
      compressor.ratio.value = settings.compressor.ratio;
      compressor.attack.value = settings.compressor.attack / 1000;
      compressor.release.value = settings.compressor.release / 1000;
      compressor.knee.value = 30;

      const compressorGain = offlineContext.createGain();
      compressorGain.gain.value = this.dbToGain(settings.compressor.gain);

      const compressorMix = offlineContext.createGain();
      const compressorBypass = offlineContext.createGain();
      compressorMix.gain.value = settings.compressor.enabled ? 1 : 0;
      compressorBypass.gain.value = settings.compressor.enabled ? 0 : 1;
      const compressorOutput = offlineContext.createGain();

      // Limiter with bypass (optimized for professional mastering)
      const limiter = offlineContext.createDynamicsCompressor();
      limiter.threshold.value = settings.limiter.threshold;
      limiter.ratio.value = 20; // Maximum for DynamicsCompressorNode (acts as brickwall)
      limiter.attack.value = 0.003; // 3ms - optimized to prevent distortion on transients
      limiter.release.value = 0.05; // 50ms - smoother release, prevents pumping
      limiter.knee.value = 0; // Hard knee for true limiting

      const limiterMix = offlineContext.createGain();
      const limiterBypass = offlineContext.createGain();
      limiterMix.gain.value = settings.limiter.enabled ? 1 : 0;
      limiterBypass.gain.value = settings.limiter.enabled ? 0 : 1;
      const limiterOutput = offlineContext.createGain();

      const outputGain = offlineContext.createGain();
      outputGain.gain.value = this.dbToGain(settings.outputGain);


      // Connect chain
      source.connect(inputGain);

      // Multiband Compressor (already connected above)
      // multibandInput is now the output from multiband or bypass

      // Compressor with bypass
      multibandInput.connect(compressor);
      multibandInput.connect(compressorBypass);
      compressor.connect(compressorGain);
      compressorGain.connect(compressorMix);
      compressorMix.connect(compressorOutput);
      compressorBypass.connect(compressorOutput);

      // Reverb in parallel (if enabled) - simplified for export
      let reverbOutput: GainNode | null = null;
      if (settings.reverb.enabled) {
        const maxDelayTime = 0.1; // Max 100ms
        const reverbDelay = offlineContext.createDelay(maxDelayTime);
        const delayTime = settings.reverb.size / 100 * 0.1; // Max 100ms
        reverbDelay.delayTime.value = delayTime;

        const reverbFeedback = offlineContext.createGain();
        // Cap feedback at 0.95 untuk stabilitas
        const feedbackValue = Math.min(0.95, settings.reverb.decay / 10 * 0.3);
        reverbFeedback.gain.value = feedbackValue;

        const reverbDamping = offlineContext.createBiquadFilter();
        reverbDamping.type = 'lowpass';
        reverbDamping.frequency.value = 20000 - (settings.reverb.damping / 100 * 15000);

        reverbDelay.connect(reverbDamping);
        reverbDamping.connect(reverbFeedback);
        reverbFeedback.connect(reverbDelay);

        const reverbWetGain = offlineContext.createGain();
        const reverbDryGain = offlineContext.createGain();
        reverbWetGain.gain.value = settings.reverb.mix / 100;
        reverbDryGain.gain.value = 1 - (settings.reverb.mix / 100);

        compressorOutput.connect(reverbDryGain);
        compressorOutput.connect(reverbDelay);
        reverbDelay.connect(reverbWetGain);

        reverbOutput = offlineContext.createGain();
        reverbDryGain.connect(reverbOutput);
        reverbWetGain.connect(reverbOutput);
      }

      // Stereo Width (if enabled and stereo) - same proper implementation as playback
      let stereoOutput: GainNode = reverbOutput || compressorOutput;
      if (settings.stereoWidth.enabled && numberOfChannels >= 2) {
        const splitter = offlineContext.createChannelSplitter(2);
        const merger = offlineContext.createChannelMerger(2);
        const width = settings.stereoWidth.width / 100;

        // Same proper formula as playback
        const leftDirect = offlineContext.createGain();
        const rightDirect = offlineContext.createGain();
        const leftCrossfeed = offlineContext.createGain();
        const rightCrossfeed = offlineContext.createGain();

        leftDirect.gain.value = (1 + width) / 2;
        rightDirect.gain.value = (1 + width) / 2;
        leftCrossfeed.gain.value = (1 - width) / 2;
        rightCrossfeed.gain.value = (1 - width) / 2;

        (reverbOutput || compressorOutput).connect(splitter);
        splitter.connect(leftDirect, 0);
        splitter.connect(rightDirect, 1);
        splitter.connect(leftCrossfeed, 1);
        splitter.connect(rightCrossfeed, 0);

        const leftSum = offlineContext.createGain();
        const rightSum = offlineContext.createGain();
        leftDirect.connect(leftSum);
        leftCrossfeed.connect(leftSum);
        rightDirect.connect(rightSum);
        rightCrossfeed.connect(rightSum);

        leftSum.connect(merger, 0, 0);
        rightSum.connect(merger, 0, 1);

        stereoOutput = offlineContext.createGain();
        merger.connect(stereoOutput);
      }

      // Limiter with bypass
      stereoOutput.connect(limiter);
      stereoOutput.connect(limiterBypass);
      limiter.connect(limiterMix);
      limiterMix.connect(limiterOutput);
      limiterBypass.connect(limiterOutput);

      // Apply export-only fade in/out
      const fadeGain = offlineContext.createGain();
      const totalSec = length / sampleRate;
      const fadeInSec = Math.max(0, (settings.exportFadeInMs || 0) / 1000);
      const fadeOutSec = Math.max(0, (settings.exportFadeOutMs || 0) / 1000);

      // Default to full volume
      fadeGain.gain.setValueAtTime(1, 0);
      // Fade in from 0 to 1
      if (fadeInSec > 0) {
        fadeGain.gain.setValueAtTime(0, 0);
        fadeGain.gain.linearRampToValueAtTime(1, fadeInSec);
      }
      // Fade out from 1 to 0 at end
      if (fadeOutSec > 0) {
        const startOut = Math.max(0, totalSec - fadeOutSec);
        fadeGain.gain.setValueAtTime(1, startOut);
        fadeGain.gain.linearRampToValueAtTime(0, totalSec);
      }

      limiterOutput.connect(fadeGain);
      fadeGain.connect(outputGain);
      outputGain.connect(offlineContext.destination);

      // Render
      source.start(0);
      const renderedBuffer = await offlineContext.startRendering();

      if (!renderedBuffer) {
        throw new Error('Failed to render audio buffer');
      }

      // Convert to WAV (juga digunakan sebagai input transcode untuk MP3/FLAC)
      {
        try {
          // audiobuffer-to-wav uses CommonJS default export
          const audioBufferToWavModule = await import('audiobuffer-to-wav');
          const audioBufferToWav = (audioBufferToWavModule.default || audioBufferToWavModule) as (buffer: AudioBuffer) => ArrayBuffer;

          if (typeof audioBufferToWav !== 'function') {
            throw new Error('audioBufferToWav is not a function. Module structure: ' + JSON.stringify(Object.keys(audioBufferToWavModule)));
          }

          const wav = audioBufferToWav(renderedBuffer);
          if (!wav || (wav instanceof ArrayBuffer && wav.byteLength === 0)) {
            throw new Error('WAV conversion produced empty buffer');
          }
          // Jika format target WAV, handle opsi hi-res 24-bit via FFmpeg lalu return
          if (format === 'wav') {
            if (quality === 'wav_24_96' || quality === 'wav_24_192') {
              try {
                const { createFFmpegFn, fetchFileFn } = await this.getFFmpegLoader();
                const corePath = (process.env.NEXT_PUBLIC_FFMPEG_CORE_URL || '').trim() || '/ffmpeg/ffmpeg-core.js';
                const ffmpeg = createFFmpegFn({ log: false, corePath });
                await ffmpeg.load();

                const inputName = 'input.wav';
                const inputData = await fetchFileFn(new Blob([wav], { type: 'audio/wav' }));
                ffmpeg.FS('writeFile', inputName, inputData as Uint8Array);

                const targetSampleRate = quality === 'wav_24_192' ? '192000' : '96000';
                const outputName = `output_${quality}_24bit.wav`;
                await ffmpeg.run(
                  '-i', inputName,
                  '-af', `aresample=${targetSampleRate}`,
                  '-ar', targetSampleRate,
                  '-ac', '2',
                  '-acodec', 'pcm_s24le',
                  '-sample_fmt', 's24',
                  '-f', 'wav',
                  '-y', outputName
                );
                const data = ffmpeg.FS('readFile', outputName) as Uint8Array;
                const ab = new ArrayBuffer(data.byteLength);
                const view = new Uint8Array(ab);
                view.set(data);
                return new Blob([ab], { type: 'audio/wav' });
              } catch (ffmpegErr: unknown) {
                console.error('[Export] FFmpeg WAV 24-bit conversion failed:', ffmpegErr);
                // Fallback ke WAV standar jika FFmpeg gagal
                return new Blob([wav], { type: 'audio/wav' });
              }
            }
            // Return WAV standar jika tidak meminta hi-res
            return new Blob([wav], { type: 'audio/wav' });
          }

          // Untuk MP3/FLAC, transcode dengan ffmpeg.wasm
          try {
            const { createFFmpegFn, fetchFileFn } = await this.getFFmpegLoader();
            const corePath = (process.env.NEXT_PUBLIC_FFMPEG_CORE_URL || '').trim() || '/ffmpeg/ffmpeg-core.js';
            const ffmpeg = createFFmpegFn({ log: false, corePath });
            await ffmpeg.load();

            // Tulis input WAV ke FS
            const inputName = 'input.wav';
            const inputData = await fetchFileFn(new Blob([wav], { type: 'audio/wav' }));
            ffmpeg.FS('writeFile', inputName, inputData as Uint8Array);

            // WAV hi-res ditangani di atas sebelum return

            if (format === 'mp3') {
              // MP3 320kbps CBR
              const outputName = 'output_320k.mp3';
              await ffmpeg.run('-i', inputName, '-b:a', '320k', '-codec:a', 'libmp3lame', outputName);
              const data = ffmpeg.FS('readFile', outputName) as Uint8Array;
              const ab = new ArrayBuffer(data.byteLength);
              const view = new Uint8Array(ab);
              view.set(data);
              return new Blob([ab], { type: 'audio/mpeg' });
            }

            if (format === 'flac') {
              // FLAC lossless
              const outputName = 'output.flac';
              await ffmpeg.run('-i', inputName, '-c:a', 'flac', outputName);
              const data = ffmpeg.FS('readFile', outputName) as Uint8Array;
              const ab = new ArrayBuffer(data.byteLength);
              const view = new Uint8Array(ab);
              view.set(data);
              return new Blob([ab], { type: 'audio/flac' });
            }
          } catch (ffmpegErr: unknown) {
            console.error('[Export] FFmpeg conversion failed:', ffmpegErr);
            // Fallback ke WAV jika FFmpeg gagal
            console.warn(`[Export] Falling back to WAV format due to FFmpeg error`);
            throw new Error(
              `Cannot export as ${format.toUpperCase()} - FFmpeg not available. ` +
              `Please download as WAV instead. ` +
              `Error: ${ffmpegErr instanceof Error ? ffmpegErr.message : 'Unknown error'}`
            );
          }
        } catch (err: unknown) {
          console.error('WAV conversion error:', err);
          throw new Error(`Failed to convert to WAV: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }
      // If code reaches here, format is not supported
      throw new Error('Unsupported export format');
    } catch (err: unknown) {
      console.error('Export audio error:', err);
      throw err;
    }
  }

  async measureOfflineLoudness(settings: AudioEngineSettings): Promise<{ integrated: number; truePeak: number }> {
    if (!this.audioBuffer) {
      throw new Error('No audio loaded');
    }

    const sampleRate = this.audioBuffer.sampleRate;
    const length = this.audioBuffer.length;
    const numberOfChannels = this.audioBuffer.numberOfChannels;

    const offlineContext = new OfflineAudioContext(numberOfChannels, length, sampleRate);

    const source = offlineContext.createBufferSource();
    source.buffer = this.audioBuffer;

    const inputGain = offlineContext.createGain();
    inputGain.gain.value = this.dbToGain(settings.inputGain);

    let chainInput: GainNode = inputGain;

    let multibandOutput: GainNode | null = null;
    let multibandBypass: GainNode | null = null;
    if (settings.multibandCompressor.enabled && settings.multibandCompressor.bands.length > 0) {
      multibandBypass = offlineContext.createGain();
      multibandBypass.gain.value = 0;
      multibandOutput = offlineContext.createGain();
      multibandOutput.gain.value = 1;

      settings.multibandCompressor.bands.forEach((band) => {
        if (!band.active) return;
        const highpass = offlineContext.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = band.lowFreq;
        highpass.Q.value = 0.7;

        const lowpass = offlineContext.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = band.highFreq;
        lowpass.Q.value = 0.7;

        const bandCompressor = offlineContext.createDynamicsCompressor();
        bandCompressor.threshold.value = band.threshold;
        bandCompressor.ratio.value = band.ratio;
        bandCompressor.attack.value = 0.003;
        bandCompressor.release.value = 0.1;
        bandCompressor.knee.value = 30;

        const bandGain = offlineContext.createGain();
        bandGain.gain.value = this.dbToGain(band.gain);

        inputGain.connect(highpass);
        highpass.connect(lowpass);
        lowpass.connect(bandCompressor);
        bandCompressor.connect(bandGain);
        bandGain.connect(multibandOutput!);
      });

      inputGain.connect(multibandBypass);
      const multibandMix = offlineContext.createGain();
      multibandOutput!.connect(multibandMix);
      multibandBypass.connect(multibandMix);
      chainInput = multibandMix;
    }

    const compressor = offlineContext.createDynamicsCompressor();
    compressor.threshold.value = settings.compressor.threshold;
    compressor.ratio.value = settings.compressor.ratio;
    compressor.attack.value = settings.compressor.attack / 1000;
    compressor.release.value = settings.compressor.release / 1000;
    compressor.knee.value = 30;

    const compressorGain = offlineContext.createGain();
    compressorGain.gain.value = this.dbToGain(settings.compressor.gain);

    const compressorMix = offlineContext.createGain();
    const compressorBypass = offlineContext.createGain();
    compressorMix.gain.value = settings.compressor.enabled ? 1 : 0;
    compressorBypass.gain.value = settings.compressor.enabled ? 0 : 1;
    const compressorOutput = offlineContext.createGain();

    let reverbOutput: GainNode | null = null;
    if (settings.reverb.enabled) {
      const maxDelayTime = 0.1;
      const reverbDelay = offlineContext.createDelay(maxDelayTime);
      const delayTime = settings.reverb.size / 100 * 0.1;
      reverbDelay.delayTime.value = delayTime;
      const reverbFeedback = offlineContext.createGain();
      const feedbackValue = Math.min(0.95, settings.reverb.decay / 10 * 0.3);
      reverbFeedback.gain.value = feedbackValue;
      const reverbDamping = offlineContext.createBiquadFilter();
      reverbDamping.type = 'lowpass';
      reverbDamping.frequency.value = 20000 - (settings.reverb.damping / 100 * 15000);
      reverbDelay.connect(reverbDamping);
      reverbDamping.connect(reverbFeedback);
      reverbFeedback.connect(reverbDelay);
      const reverbWetGain = offlineContext.createGain();
      const reverbDryGain = offlineContext.createGain();
      reverbWetGain.gain.value = settings.reverb.mix / 100;
      reverbDryGain.gain.value = 1 - (settings.reverb.mix / 100);
      compressorOutput.connect(reverbDryGain);
      compressorOutput.connect(reverbDelay);
      reverbDelay.connect(reverbWetGain);
      reverbOutput = offlineContext.createGain();
      reverbDryGain.connect(reverbOutput);
      reverbWetGain.connect(reverbOutput);
    }

    chainInput.connect(compressor);
    chainInput.connect(compressorBypass);
    compressor.connect(compressorGain);
    compressorGain.connect(compressorMix);
    compressorMix.connect(compressorOutput);
    compressorBypass.connect(compressorOutput);

    let stereoOutput: GainNode = reverbOutput || compressorOutput;
    if (settings.stereoWidth.enabled && numberOfChannels >= 2) {
      const splitter = offlineContext.createChannelSplitter(2);
      const merger = offlineContext.createChannelMerger(2);
      const width = settings.stereoWidth.width / 100;
      const leftDirect = offlineContext.createGain();
      const rightDirect = offlineContext.createGain();
      const leftCrossfeed = offlineContext.createGain();
      const rightCrossfeed = offlineContext.createGain();
      leftDirect.gain.value = (1 + width) / 2;
      rightDirect.gain.value = (1 + width) / 2;
      leftCrossfeed.gain.value = (1 - width) / 2;
      rightCrossfeed.gain.value = (1 - width) / 2;
      (reverbOutput || compressorOutput).connect(splitter);
      splitter.connect(leftDirect, 0);
      splitter.connect(rightDirect, 1);
      splitter.connect(leftCrossfeed, 1);
      splitter.connect(rightCrossfeed, 0);
      const leftSum = offlineContext.createGain();
      const rightSum = offlineContext.createGain();
      leftDirect.connect(leftSum);
      leftCrossfeed.connect(leftSum);
      rightDirect.connect(rightSum);
      rightCrossfeed.connect(rightSum);
      leftSum.connect(merger, 0, 0);
      rightSum.connect(merger, 0, 1);
      stereoOutput = offlineContext.createGain();
      merger.connect(stereoOutput);
    }

    const limiter = offlineContext.createDynamicsCompressor();
    limiter.threshold.value = settings.limiter.threshold;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.05;
    limiter.knee.value = 0;
    const limiterMix = offlineContext.createGain();
    const limiterBypass = offlineContext.createGain();
    limiterMix.gain.value = settings.limiter.enabled ? 1 : 0;
    limiterBypass.gain.value = settings.limiter.enabled ? 0 : 1;
    const limiterOutput = offlineContext.createGain();

    const outputGain = offlineContext.createGain();
    outputGain.gain.value = this.dbToGain(settings.outputGain);

    source.connect(inputGain);
    stereoOutput.connect(limiter);
    stereoOutput.connect(limiterBypass);
    limiter.connect(limiterMix);
    limiterMix.connect(limiterOutput);
    limiterBypass.connect(limiterOutput);
    limiterOutput.connect(outputGain);
    outputGain.connect(offlineContext.destination);

    source.start(0);
    const renderedBuffer = await offlineContext.startRendering();

    if (!renderedBuffer) {
      throw new Error('Failed to render audio buffer');
    }

    const renderedLength = renderedBuffer.length;
    const renderedRate = renderedBuffer.sampleRate;
    const ch = Array.from({ length: renderedBuffer.numberOfChannels }, (_, idx) => renderedBuffer.getChannelData(idx));
    const mono = new Float32Array(renderedLength);
    for (let i = 0; i < renderedLength; i++) {
      let sum = 0;
      for (let c = 0; c < ch.length; c++) {
        sum += ch[c][i];
      }
      mono[i] = sum / ch.length;
    }

    let truePeak = -Infinity;
    for (let i = 0; i < mono.length; i++) {
      const nextIdx = Math.min(i + 1, mono.length - 1);
      for (let os = 0; os < 4; os++) {
        const interpolated = mono[i] + (mono[nextIdx] - mono[i]) * (os / 4);
        const peak = Math.abs(interpolated);
        if (peak > truePeak) truePeak = peak;
      }
    }
    const truePeakDb = 20 * Math.log10(Math.max(0.0001, truePeak));

    const frameSize = 2048;
    const lufsFrames: number[] = [];
    const totalFrames = Math.ceil(mono.length / frameSize);
    for (let f = 0; f < totalFrames; f++) {
      const start = f * frameSize;
      const end = Math.min(start + frameSize, mono.length);
      let sumSquares = 0;
      let count = 0;
      for (let i = start; i < end; i++) {
        const sample = mono[i];
        const freq = (i * renderedRate) / (mono.length * 2);
        let weighted = sample;
        if (freq > 1500) {
          const boost = 1 + (freq - 1500) / 10000;
          weighted = sample * Math.min(boost, 1.58);
        }
        sumSquares += weighted * weighted;
        count++;
      }
      const rms = Math.sqrt(sumSquares / Math.max(1, count));
      const power = rms * rms;
      const lufs = -0.691 + 10 * Math.log10(Math.max(0.0000001, power));
      if (lufs > -70) {
        lufsFrames.push(lufs);
      }
    }

    let integrated = -23;
    if (lufsFrames.length > 0) {
      const ungatedAvg = lufsFrames.reduce((a, b) => a + b, 0) / lufsFrames.length;
      const gateThreshold = ungatedAvg - 10;
      const gated = lufsFrames.filter(v => v >= gateThreshold);
      integrated = (gated.length > 0 ? gated.reduce((a, b) => a + b, 0) / gated.length : ungatedAvg);
    }

    return { integrated: Math.max(-70, Math.min(0, integrated)), truePeak: Math.max(-60, Math.min(10, truePeakDb)) };
  }

  /**
   * Cache untuk FFmpeg loader agar tidak perlu load ulang
   */
  private ffmpegLoaderCache: {
    createFFmpegFn: (opts: { log: boolean; corePath?: string }) => {
      load: () => Promise<void>;
      FS: (op: string, path: string, data?: Uint8Array) => unknown;
      run: (...args: string[]) => Promise<void>;
    };
    fetchFileFn: (input: Blob | File | string) => Promise<Uint8Array> | Uint8Array;
  } | null = null;

  /**
   * Loader FFmpeg yang robust: gunakan UMD di browser untuk kompatibilitas maksimal
   */
  private async getFFmpegLoader(): Promise<{
    createFFmpegFn: (opts: { log: boolean; corePath?: string }) => {
      load: () => Promise<void>;
      FS: (op: string, path: string, data?: Uint8Array) => unknown;
      run: (...args: string[]) => Promise<void>;
    };
    fetchFileFn: (input: Blob | File | string) => Promise<Uint8Array> | Uint8Array;
  }> {
    // Return cached instance if available
    if (this.ffmpegLoaderCache) {
      return this.ffmpegLoaderCache;
    }

    type FF = {
      createFFmpeg?: (opts: { log: boolean; corePath?: string }) => {
        load: () => Promise<void>;
        FS: (op: string, path: string, data?: Uint8Array) => unknown;
        run: (...args: string[]) => Promise<void>;
      };
      fetchFile?: (input: Blob | File | string) => Promise<Uint8Array> | Uint8Array;
      default?: FF;
    };

    // Di browser, langsung gunakan UMD untuk kompatibilitas maksimal
    if (typeof window !== 'undefined') {

      // Cek apakah sudah ada di global
      const g = globalThis as any;

      // Coba berbagai kemungkinan lokasi global FFmpeg
      const checkGlobal = () => {
        return g.FFmpeg || g.window?.FFmpeg || (window as any).FFmpeg;
      };

      let ffmpegGlobal = checkGlobal();
      if (ffmpegGlobal?.createFFmpeg && ffmpegGlobal?.fetchFile) {
        this.ffmpegLoaderCache = {
          createFFmpegFn: ffmpegGlobal.createFFmpeg,
          fetchFileFn: ffmpegGlobal.fetchFile
        };
        return this.ffmpegLoaderCache;
      }

      // Load UMD script
      const umdUrl = (process.env.NEXT_PUBLIC_FFMPEG_UMD_URL || '').trim() || 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/umd/ffmpeg.min.js';

      try {
        await this.loadScript(umdUrl);

        // Tunggu sebentar untuk memastikan script selesai inisialisasi
        await new Promise(resolve => setTimeout(resolve, 100));

        // Check global again dengan berbagai kemungkinan
        ffmpegGlobal = checkGlobal();

        const createFFmpegFn = ffmpegGlobal?.createFFmpeg;
        const fetchFileFn = ffmpegGlobal?.fetchFile;

        if (!createFFmpegFn || !fetchFileFn) {
          const w = window as unknown as { createFFmpeg?: FF['createFFmpeg']; fetchFile?: FF['fetchFile'] };
          const altCreate = w.createFFmpeg;
          const altFetch = w.fetchFile;

          if (altCreate && altFetch) {
            this.ffmpegLoaderCache = {
              createFFmpegFn: altCreate,
              fetchFileFn: altFetch
            };
            return this.ffmpegLoaderCache;
          }

          try {
            const mod = (await import('@ffmpeg/ffmpeg')) as unknown as FF;
            const esmCreate = mod.createFFmpeg || mod.default?.createFFmpeg;
            const esmFetch = mod.fetchFile || mod.default?.fetchFile;
            if (esmCreate && esmFetch) {
              this.ffmpegLoaderCache = { createFFmpegFn: esmCreate, fetchFileFn: esmFetch };
              return this.ffmpegLoaderCache;
            }
          } catch (esmErr) {
            console.error('[FFmpeg] ESM import (browser) failed:', esmErr);
          }

          throw new Error('FFmpeg UMD loaded but functions not found in global scope');
        }

        this.ffmpegLoaderCache = { createFFmpegFn, fetchFileFn };
        return this.ffmpegLoaderCache;
      } catch (err) {
        console.error('[FFmpeg] UMD loading failed:', err);
        throw new Error(`Failed to load FFmpeg: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    // Server-side: try ESM import
    try {
      const mod = (await import('@ffmpeg/ffmpeg')) as unknown as FF;
      const createFFmpegFn = mod.createFFmpeg || mod.default?.createFFmpeg;
      const fetchFileFn = mod.fetchFile || mod.default?.fetchFile;

      if (createFFmpegFn && fetchFileFn) {
        this.ffmpegLoaderCache = { createFFmpegFn, fetchFileFn };
        return this.ffmpegLoaderCache;
      }
    } catch (err) {
      console.error('[FFmpeg] ESM import failed:', err);
    }

    throw new Error('FFmpeg not available in this environment');
  }

  /**
   * Memuat script eksternal ke halaman dan menunggu onload.
   */
  private async loadScript(src: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(s);
    });
  }

  /**
   * Melakukan fade in pada playback dengan durasi tertentu (ms)
   */
  fadeIn(durationMs: number): void {
    if (!this.audioContext || !this.masterFade) return;
    const now = this.audioContext.currentTime;
    const dur = Math.max(0, durationMs) / 1000;
    this.masterFade.gain.setValueAtTime(0, now);
    this.masterFade.gain.linearRampToValueAtTime(1, now + dur);
  }

  /**
   * Melakukan fade out pada playback dengan durasi tertentu (ms)
   */
  fadeOut(durationMs: number): void {
    if (!this.audioContext || !this.masterFade) return;
    const now = this.audioContext.currentTime;
    const dur = Math.max(0, durationMs) / 1000;
    const current = this.masterFade.gain.value;
    this.masterFade.gain.setValueAtTime(current, now);
    this.masterFade.gain.linearRampToValueAtTime(0, now + dur);
  }

  /**
   * Toggle master bypass untuk A/B comparison
   * @param showOriginal - true untuk show original (bypass all), false untuk show mastered
   */
  toggleMasterBypass(showOriginal: boolean): void {
    if (!this.audioContext || !this.masterBypass || !this.masterMix) return;
    
    const now = this.audioContext.currentTime;
    
    if (showOriginal) {
      // Show original: bypass all effects
      this.masterBypass.gain.setValueAtTime(1, now);
      this.masterMix.gain.setValueAtTime(0, now);
    } else {
      // Show mastered: through all effects
      this.masterBypass.gain.setValueAtTime(0, now);
      this.masterMix.gain.setValueAtTime(1, now);
    }
  }

  /**
   * Get current master bypass state
   * @returns true if showing original (bypass), false if showing mastered
   */
  getMasterBypassState(): boolean {
    if (!this.masterBypass) return false;
    return this.masterBypass.gain.value > 0.5;
  }

  destroy(): void {
    this.stop();
    this.cleanup();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

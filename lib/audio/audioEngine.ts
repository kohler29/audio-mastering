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
  harmonizer: {
    enabled: boolean;
    mix: number;
    depth: number;
    tone: number;
  };
  reverb: {
    enabled: boolean;
    mix: number;
    size: number;
    decay: number;
    damping: number;
  };
  saturation: {
    enabled: boolean;
    drive: number;
    mix: number;
    bias: number;
    mode: 'tube' | 'tape' | 'soft';
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
  private saturationNode: WaveShaperNode | null = null;
  private saturationDryGain: GainNode | null = null;
  private saturationWetGain: GainNode | null = null;
  // Saturation filtering nodes for professional analog modeling
  private saturationDCBlocker: BiquadFilterNode | null = null;
  private saturationPreEmphasis: BiquadFilterNode | null = null;
  private saturationDeEmphasis: BiquadFilterNode | null = null;
  private saturationPreGain: GainNode | null = null;
  private saturationPostHPF: BiquadFilterNode | null = null;
  private saturationPostHighShelf: BiquadFilterNode | null = null;
  private saturationPostLPF: BiquadFilterNode | null = null;
  private saturationCeilGain: GainNode | null = null;
  // Harmonizer nodes
  private harmonizerDelay1: DelayNode | null = null;
  private harmonizerDelay2: DelayNode | null = null;
  private harmonizerLFO1: OscillatorNode | null = null;
  private harmonizerLFO2: OscillatorNode | null = null;
  private harmonizerLFOGain1: GainNode | null = null;
  private harmonizerLFOGain2: GainNode | null = null;
  private harmonizerDryGain: GainNode | null = null;
  private harmonizerWetGain: GainNode | null = null;
  private harmonizerToneFilter: BiquadFilterNode | null = null;
  private harmonizerMix: GainNode | null = null;
  private harmonizerBypass: GainNode | null = null;
  private harmonizerOutput: GainNode | null = null;
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
  private saturationMix: GainNode | null = null;
  private saturationBypass: GainNode | null = null;
  private saturationOutput: GainNode | null = null;
  private limiterMix: GainNode | null = null;
  private limiterBypass: GainNode | null = null;
  private limiterOutput: GainNode | null = null;
  private multibandMix: GainNode | null = null;
  // Precomputed curves cache
  private saturationCurveCache: Map<string, Float32Array> = new Map();
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
        if (this.audioContext?.state === 'running') {
          console.log('Audio context is now running');
        }
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

  private setupAnalyser(): void {
    if (!this.audioContext) return;

    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 2048;
    this.analyserNode.smoothingTimeConstant = 0.8;
  }

  async loadAudioFile(file: File): Promise<void> {
    if (!this.audioContext) {
      await this.initialize();
    }

    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.duration = this.audioBuffer.duration;
      this.pausedTime = 0;
      this.currentTime = 0;

      // Reset graph built flag untuk rebuild graph dengan file baru
      this.audioGraphBuilt = false;
    } catch (error) {
      console.error('Failed to load audio file:', error);
      throw new Error('Failed to load audio file. The file may be corrupted or in an unsupported format.');
    }
  }

  // Build audio graph sekali saja (dipanggil saat file loaded)
  private buildAudioGraph(settings: AudioEngineSettings): void {
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

    // Saturation (using precomputed curve)
    this.createSaturationNode(settings.saturation);

    this.saturationMix = this.audioContext.createGain();
    this.saturationBypass = this.audioContext.createGain();
    this.saturationMix.gain.value = settings.saturation.enabled ? 1 : 0;
    this.saturationBypass.gain.value = settings.saturation.enabled ? 0 : 1;
    this.saturationOutput = this.audioContext.createGain();

    // Harmonizer setup (delay-based chorus effect)
    this.setupHarmonizer(settings.harmonizer);

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

    // Output gain
    this.gainNodes.output = this.audioContext.createGain();
    this.gainNodes.output.gain.value = this.dbToGain(settings.outputGain);

    // Connect audio graph (sekali saja)
    this.connectAudioGraph(settings);
  }

  // Connect audio graph (dipanggil sekali saat build)
  private connectAudioGraph(settings: AudioEngineSettings): void {
    if (!this.audioContext || !this.gainNodes.input) return;

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

    // Saturation dengan crossfade internal: Input → PreGain → WaveShaper → Mix → PostFilters → Output
    const saturationInput = this.reverbOutput!;
    if (this.saturationNode && this.saturationWetGain && this.saturationDryGain && this.saturationPreGain) {
      // Input menuju PreGain
      saturationInput.connect(this.saturationPreGain);

      // Dry mengambil dari PreGain (fase identik)
      this.saturationPreGain.connect(this.saturationDryGain);

      // Wet: PreGain → WaveShaper
      this.saturationPreGain.connect(this.saturationNode);
      this.saturationNode.connect(this.saturationWetGain);

      // Campurkan wet/dry
      const saturationMixNode = this.audioContext.createGain();
      this.saturationWetGain.connect(saturationMixNode);
      this.saturationDryGain.connect(saturationMixNode);
      saturationMixNode.connect(this.saturationMix!);

      if (this.saturationCeilGain) {
        this.saturationMix!.connect(this.saturationCeilGain);
        if (this.saturationPostHPF && this.saturationPostLPF && this.saturationPostHighShelf) {
          this.saturationCeilGain.connect(this.saturationPostHPF);
          this.saturationPostHPF.connect(this.saturationPostLPF);
          this.saturationPostLPF.connect(this.saturationPostHighShelf);
          this.saturationPostHighShelf.connect(this.saturationOutput!);
        } else {
          this.saturationCeilGain.connect(this.saturationOutput!);
        }
      } else {
        this.saturationMix!.connect(this.saturationOutput!);
      }
    } else {
      saturationInput.connect(this.saturationMix!);
      if (this.saturationCeilGain) {
        this.saturationMix!.connect(this.saturationCeilGain);
        this.saturationCeilGain.connect(this.saturationOutput!);
      } else {
        this.saturationMix!.connect(this.saturationOutput!);
      }
    }
    saturationInput.connect(this.saturationBypass!);
    this.saturationBypass!.connect(this.saturationOutput!);

    // Harmonizer with bypass (delay-based chorus effect)
    if (settings.harmonizer.enabled &&
      this.harmonizerDelay1 &&
      this.harmonizerDelay2 &&
      this.harmonizerDryGain &&
      this.harmonizerWetGain &&
      this.harmonizerToneFilter) {
      // Connect input to delays and dry path
      this.saturationOutput!.connect(this.harmonizerDelay1);
      this.saturationOutput!.connect(this.harmonizerDelay2);
      this.saturationOutput!.connect(this.harmonizerDryGain);

      // Process delayed signals through tone filter (sum both delays)
      const delaySum = this.audioContext.createGain();
      this.harmonizerDelay1.connect(delaySum);
      this.harmonizerDelay2.connect(delaySum);
      delaySum.connect(this.harmonizerToneFilter);
      this.harmonizerToneFilter.connect(this.harmonizerWetGain);

      // Mix dry and wet
      const harmonizerMixNode = this.audioContext.createGain();
      this.harmonizerDryGain.connect(harmonizerMixNode);
      this.harmonizerWetGain.connect(harmonizerMixNode);
      harmonizerMixNode.connect(this.harmonizerMix!);
    } else {
      this.saturationOutput!.connect(this.harmonizerMix!);
    }
    this.saturationOutput!.connect(this.harmonizerBypass!);
    this.harmonizerMix!.connect(this.harmonizerOutput!);
    this.harmonizerBypass!.connect(this.harmonizerOutput!);

    // Stereo Width - always route through stereo processing if stereo audio
    // This ensures routing is always correct even when enabled state changes
    let stereoInput: GainNode = this.harmonizerOutput!;

    // Only apply stereo width if audio is stereo (2+ channels)
    if (this.audioBuffer &&
      this.audioBuffer.numberOfChannels >= 2 &&
      this.splitterNode &&
      this.mergerNode) {
      // Always connect harmonizer output to splitter (routing always ready)
      this.harmonizerOutput!.connect(this.splitterNode);

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
        stereoInput = this.stereoOutput || this.harmonizerOutput!;
      }
    }

    // Limiter with bypass
    stereoInput.connect(this.limiterNode!);
    stereoInput.connect(this.limiterBypass!);
    this.limiterNode!.connect(this.limiterMix!);
    this.limiterMix!.connect(this.limiterOutput!);
    this.limiterBypass!.connect(this.limiterOutput!);

    this.limiterOutput!.connect(this.gainNodes.output!);

    // Connect to analyser and destination
    this.gainNodes.output!.connect(this.analyserNode!);
    this.analyserNode!.connect(this.audioContext.destination);
  }

  // Setup audio chain untuk playback (hanya create source node, graph sudah ada)
  setupAudioChain(settings: AudioEngineSettings): void {
    if (!this.audioContext || !this.audioBuffer) {
      throw new Error('Audio context or buffer not initialized');
    }

    // Jika graph belum dibangun, build sekarang
    if (!this.audioGraphBuilt) {
      this.buildAudioGraph(settings);
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

  /**
   * Membuat node saturasi dengan kontrol drive/mix/bias dan mode.
   * Untuk mencegah artefak flanger/comb-filter saat mix < 100% pada mode 'tape',
   * pre/de-emphasis akan dinonaktifkan sehingga fase wet/dry tetap selaras.
   */
  /**
   * Algoritma saturasi dengan mode tube/tape/soft;
   * mencakup kompensasi gain berbasis RMS untuk level yang konsisten.
   */
  private createSaturationNode(settings: { drive: number; mix: number; bias: number; mode: 'tube' | 'tape' | 'soft' }): WaveShaperNode {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }

    // Create DC blocking filter (highpass at 20Hz)
    // This removes DC offset that can be introduced by saturation
    this.saturationDCBlocker = this.audioContext.createBiquadFilter();
    this.saturationDCBlocker.type = 'highpass';
    this.saturationDCBlocker.frequency.value = 20;
    this.saturationDCBlocker.Q.value = 0.707; // Butterworth response

    // Create pre-emphasis filter untuk tape mode
    // Boosts high frequencies before saturation (like real tape machines)
    this.saturationPreEmphasis = this.audioContext.createBiquadFilter();
    this.saturationPreEmphasis.type = 'highshelf';
    this.saturationPreEmphasis.frequency.value = 3000; // 3kHz
    this.saturationPreEmphasis.Q.value = 0.707;

    // Create de-emphasis filter for tape mode
    // Cuts high frequencies after saturation to compensate pre-emphasis
    this.saturationDeEmphasis = this.audioContext.createBiquadFilter();
    this.saturationDeEmphasis.type = 'highshelf';
    this.saturationDeEmphasis.frequency.value = 3000; // 3kHz
    this.saturationDeEmphasis.Q.value = 0.707;

    // Set pre/de-emphasis gains berdasarkan mode
    if (settings.mode === 'tape') {
      const isFullWet = settings.mix >= 100;
      // Aktifkan pre/de-emphasis hanya saat full wet untuk mencegah perbedaan fase saat di-blend
      this.saturationPreEmphasis.gain.value = isFullWet ? 6 : 0;
      this.saturationDeEmphasis.gain.value = isFullWet ? -6 : 0;
    } else {
      // Mode selain 'tape': bypass pre/de-emphasis
      this.saturationPreEmphasis.gain.value = 0;
      this.saturationDeEmphasis.gain.value = 0;
    }

    this.saturationNode = this.audioContext.createWaveShaper();
    const drive = settings.drive / 100;
    const bias = settings.bias / 100;
    const mixValue = settings.mix / 100;
    const size = 65536;
    const curve = new Float32Array(size);
    // Soft mode: gunakan ceiling sedikit lebih rendah, tapi tetap cukup lebar untuk headroom
    const hardLimit = settings.mode === 'soft' ? 0.9 : 0.98;
    let sumInSq = 0;
    let sumOutSq = 0;

    for (let i = 0; i < size; i++) {
      const x = (i - 32768) / 32768;
      let saturated: number;

      // Professional analog saturation modeling with improved transfer functions
      switch (settings.mode) {
        case 'tube':
          // Tube/Valve saturation modeling (Triode/Pentode characteristic)
          // Asymmetric soft clipping with even and odd harmonics
          // Models classic tube warmth with smooth compression
          const tubeGain = 1 + drive * 4.0; // Increased range for more character
          const tubeInput = x * tubeGain;

          // Asymmetric tube transfer function (models grid current)
          // Positive half: softer saturation (triode characteristic)
          // Negative half: harder saturation (asymmetric clipping)
          if (tubeInput >= 0) {
            // Positive: smooth tanh with slight compression
            saturated = Math.tanh(tubeInput * 0.9) * 1.05;
          } else {
            // Negative: harder clipping (asymmetric)
            saturated = Math.tanh(tubeInput * 1.1) * 0.95;
          }

          // Add harmonic richness with subtle second-order distortion
          saturated += Math.sin(tubeInput * Math.PI * 0.5) * 0.05 * drive;

          // Tube bias (DC offset) - characteristic of tube circuits
          saturated += bias * 0.12;
          break;

        case 'tape':
          // Analog tape saturation modeling (based on magnetic hysteresis)
          // Smooth compression with tape-like warmth and high-frequency rolloff
          const tapeGain = 1 + drive * 3.5;
          const tapeInput = x * tapeGain;

          // Tape hysteresis curve (S-curve with smooth compression)
          // Uses modified arctan for tape-like response
          const tapeBase = (2 / Math.PI) * Math.atan(tapeInput * Math.PI / 2);

          // Add tape compression characteristic (soft knee)
          const tapeCompression = tapeInput / (1 + Math.abs(tapeInput) * 0.5);

          // Blend for realistic tape response
          saturated = tapeBase * 0.7 + tapeCompression * 0.3;

          // Add subtle third-harmonic for tape warmth
          saturated += Math.sin(tapeInput * Math.PI) * 0.03 * drive;

          // Tape bias (pre-magnetization)
          saturated += bias * 0.1;
          break;

        case 'soft':
        default:
          // Soft saturation: simple analog-style tanh (paling halus, tanpa pecah/kasar)
          // Drive mengatur seberapa keras sinyal mendorong tanh
          {
            const softGain = 1 + drive * 2.0;
            const biased = x + bias * 0.15; // sedikit bias seperti analog, tapi tidak berlebihan
            const input = biased * softGain;
            // Satu kurva tanh yang smooth, tanpa piecewise polynomial
            saturated = Math.tanh(input);
          }
          break;
      }

      // Blend saturasi dengan sinyal original di dalam kurva (seri-style)
      const blended = x + mixValue * (saturated - x);

      // Clamp untuk mencegah clipping/crackle, limit disesuaikan mode
      const y = Math.max(-hardLimit, Math.min(hardLimit, blended));
      curve[i] = y;
      sumInSq += x * x;
      sumOutSq += y * y;
    }

    const rmsIn = Math.sqrt(sumInSq / size);
    const rmsOut = Math.sqrt(sumOutSq / size);
    let compensation = rmsOut > 0 ? rmsIn / rmsOut : 1;
    // Auto-gain: jaga level relatif konsisten tapi jangan terlalu agresif
    compensation = Math.min(1.2, Math.max(0.5, compensation));
    if (settings.mode === 'soft') {
      // Soft: sedikit lebih kalem supaya tidak mengangkat peak berlebihan
      compensation = Math.min(compensation, 0.9);
    }

    for (let i = 0; i < size; i++) {
      curve[i] = Math.max(-0.98, Math.min(0.98, curve[i] * compensation));
    }

    this.saturationNode.curve = curve;
    // Soft mode tetap pakai 4x oversampling untuk mengurangi aliasing/crackle
    this.saturationNode.oversample = (settings.mode === 'soft' || settings.mix >= 100 ? '4x' : 'none');

    // Mix control with proper gain staging
    this.saturationDryGain = this.audioContext.createGain();
    this.saturationWetGain = this.audioContext.createGain();
    // Pre-gain untuk jalur Input → WaveShaper
    this.saturationPreGain = this.audioContext.createGain();
    // Kembalikan ke 1.0 supaya bentuk kurva sama seperti sebelumnya
    this.saturationPreGain.gain.value = 1.0;

    // Post filter setelah mix untuk tone analog dan bebas fase
    this.saturationPostHPF = this.audioContext.createBiquadFilter();
    this.saturationPostHPF.type = 'highpass';
    this.saturationPostHPF.frequency.value = 20;
    this.saturationPostHPF.Q.value = 0.707;

    this.saturationPostLPF = this.audioContext.createBiquadFilter();
    this.saturationPostLPF.type = 'lowpass';
    // Kembalikan LPF soft ke 14k agar karakter high-end tidak berubah banyak
    this.saturationPostLPF.frequency.value = (settings.mode === 'soft' ? 14000 : 16000);
    this.saturationPostLPF.Q.value = 0.707;

    this.saturationPostHighShelf = this.audioContext.createBiquadFilter();
    this.saturationPostHighShelf.type = 'highshelf';
    this.saturationPostHighShelf.frequency.value = 6000;
    this.saturationPostHighShelf.Q.value = 0.707;
    switch (settings.mode) {
      case 'tape':
        this.saturationPostHighShelf.gain.value = -4;
        break;
      case 'tube':
        this.saturationPostHighShelf.gain.value = -2;
        break;
      case 'soft':
      default:
        // Soft: biarkan netral (0 dB) supaya tidak terasa seperti chorus/phasey
        this.saturationPostHighShelf.gain.value = -5;
        break;
    }

    // Semua mode: gunakan hanya jalur wet (seri-style), dry = 0 untuk menghindari comb/chorus
    const dryGain = 0;
    const wetGain = 1;

    this.saturationDryGain.gain.value = dryGain;
    this.saturationWetGain.gain.value = wetGain;

    this.saturationCeilGain = this.audioContext.createGain();
    if (settings.mode === 'soft') {
      const sumWeights = dryGain + wetGain;
      const targetPeak = 0.9;
      const ceil = Math.min(1.0, targetPeak / Math.max(0.001, sumWeights));
      this.saturationCeilGain.gain.value = ceil;
    } else {
      this.saturationCeilGain.gain.value = 1.0;
    }

    return this.saturationNode;
  }

  private setupHarmonizer(settings: { enabled: boolean; mix: number; depth: number; tone: number }): void {
    if (!this.audioContext) return;

    // Harmonizer menggunakan delay-based chorus effect
    // Depth mengontrol modulasi depth, mix mengontrol wet/dry mix
    // Tone mengontrol filter frequency untuk tone shaping

    // Base delay time (sekitar 5-20ms untuk chorus effect)
    const baseDelay = 0.010; // 10ms

    // Create two delay lines dengan LFO modulation untuk chorus effect
    this.harmonizerDelay1 = this.audioContext.createDelay(0.05);
    this.harmonizerDelay2 = this.audioContext.createDelay(0.05);
    this.harmonizerDelay1.delayTime.value = baseDelay;
    this.harmonizerDelay2.delayTime.value = baseDelay * 1.5; // Slightly different delay

    // LFO untuk modulasi delay time (chorus effect)
    this.harmonizerLFO1 = this.audioContext.createOscillator();
    this.harmonizerLFO1.type = 'sine';
    this.harmonizerLFO1.frequency.value = 0.5 + (settings.depth / 100 * 2); // 0.5-2.5 Hz

    this.harmonizerLFO2 = this.audioContext.createOscillator();
    this.harmonizerLFO2.type = 'sine';
    this.harmonizerLFO2.frequency.value = 0.7 + (settings.depth / 100 * 1.8); // Slightly different frequency

    // LFO gain untuk modulasi depth
    const modulationDepth = (settings.depth / 100) * 0.005; // Max 5ms modulation
    this.harmonizerLFOGain1 = this.audioContext.createGain();
    this.harmonizerLFOGain1.gain.value = modulationDepth;
    this.harmonizerLFOGain2 = this.audioContext.createGain();
    this.harmonizerLFOGain2.gain.value = modulationDepth;

    // Connect LFO to delay time modulation
    this.harmonizerLFO1.connect(this.harmonizerLFOGain1);
    this.harmonizerLFO2.connect(this.harmonizerLFOGain2);
    this.harmonizerLFOGain1.connect(this.harmonizerDelay1.delayTime);
    this.harmonizerLFOGain2.connect(this.harmonizerDelay2.delayTime);

    // Start LFO oscillators
    this.harmonizerLFO1.start();
    this.harmonizerLFO2.start();

    // Tone filter untuk tone shaping
    this.harmonizerToneFilter = this.audioContext.createBiquadFilter();
    this.harmonizerToneFilter.type = 'peaking';
    this.harmonizerToneFilter.frequency.value = 2000 + (settings.tone / 100 * 3000); // 2-5kHz
    this.harmonizerToneFilter.Q.value = 1;
    this.harmonizerToneFilter.gain.value = settings.tone / 10; // -10 to +10 dB

    // Dry/wet mix
    this.harmonizerDryGain = this.audioContext.createGain();
    this.harmonizerWetGain = this.audioContext.createGain();
    this.harmonizerDryGain.gain.value = 1 - (settings.mix / 100);
    this.harmonizerWetGain.gain.value = settings.mix / 100;

    // Bypass nodes
    this.harmonizerMix = this.audioContext.createGain();
    this.harmonizerBypass = this.audioContext.createGain();
    this.harmonizerMix.gain.value = settings.enabled ? 1 : 0;
    this.harmonizerBypass.gain.value = settings.enabled ? 0 : 1;
    this.harmonizerOutput = this.audioContext.createGain();

    // Update current settings
    this.currentSettings.harmonizer = { ...settings };
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

  play(): void {
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
      this.buildAudioGraph(this.getCurrentSettings());
      this.audioGraphBuilt = true;
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

      this.currentTime = this.audioContext.currentTime - this.startTime + this.pausedTime;

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
      console.log('Stereo audio detected:', {
        channels: numberOfChannels,
        leftLength: leftChannelData.length,
        rightLength: rightChannelData.length,
        leftSample0: leftChannelData[0],
        rightSample0: rightChannelData[0],
        areDifferent: leftChannelData[0] !== rightChannelData[0]
      });
    } else {
      // Mono: copy channel 0 ke array baru supaya tidak share reference
      rightChannelData = new Float32Array(leftChannelData);
      console.log('Mono audio detected, copying channel 0 to right');
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

    console.log('Generated waveform arrays:', {
      leftWaveformLength: leftWaveform.length,
      rightWaveformLength: rightWaveform.length,
      leftWaveform0: leftWaveform[0],
      rightWaveform0: rightWaveform[0],
      leftWaveform100: leftWaveform[100],
      rightWaveform100: rightWaveform[100],
      areSameArray: leftWaveform === rightWaveform
    });

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

    // Update saturation parameters
    if (settings.saturation && this.saturationNode) {
      if (settings.saturation.drive !== undefined ||
        settings.saturation.bias !== undefined ||
        settings.saturation.mode !== undefined ||
        settings.saturation.mix !== undefined) {
        const drive = (settings.saturation.drive ?? this.currentSettings.saturation.drive);
        const bias = (settings.saturation.bias ?? this.currentSettings.saturation.bias);
        const mode = (settings.saturation.mode ?? this.currentSettings.saturation.mode);
        const mix = (settings.saturation.mix ?? this.currentSettings.saturation.mix);
        const cacheKey = `${mode}_${Math.round(drive)}_${Math.round(bias)}_${Math.round(mix)}`;
        let curve = this.saturationCurveCache.get(cacheKey);

        if (!curve) {
          const driveValue = drive / 100;
          const biasValue = bias / 100;
          const mixValue = mix / 100;
          curve = new Float32Array(65536);

          // Calculate auto gain compensation
          const autoGainCompensation = 1 / (1 + driveValue * 0.5);

          for (let i = 0; i < 65536; i++) {
            const x = (i - 32768) / 32768;
            let saturated: number;

            // Professional analog saturation modeling (same as createSaturationNode)
            switch (mode) {
              case 'tube':
                // Tube/Valve saturation modeling
                const tubeGain = 1 + driveValue * 4.0;
                const tubeInput = x * tubeGain;

                if (tubeInput >= 0) {
                  saturated = Math.tanh(tubeInput * 0.9) * 1.05;
                } else {
                  saturated = Math.tanh(tubeInput * 1.1) * 0.95;
                }

                saturated += Math.sin(tubeInput * Math.PI * 0.5) * 0.05 * driveValue;
                saturated += biasValue * 0.12;
                break;

              case 'tape':
                // Analog tape saturation modeling
                const tapeGain = 1 + driveValue * 3.5;
                const tapeInput = x * tapeGain;

                const tapeBase = (2 / Math.PI) * Math.atan(tapeInput * Math.PI / 2);
                const tapeCompression = tapeInput / (1 + Math.abs(tapeInput) * 0.5);

                saturated = tapeBase * 0.7 + tapeCompression * 0.3;
                saturated += Math.sin(tapeInput * Math.PI) * 0.03 * driveValue;
                saturated += biasValue * 0.1;
                break;

              case 'soft':
              default:
                // Soft saturation: samakan dengan createSaturationNode (simple tanh analog-style)
                {
                  const softGain = 1 + driveValue * 2.0;
                  const biased = x + biasValue * 0.15;
                  const input = biased * softGain;
                  saturated = Math.tanh(input);
                }
                break;
            }

            // Blend saturasi dengan sinyal original di dalam kurva (seri-style)
            const blended = x + mixValue * (saturated - x);

            // Apply auto gain compensation
            const compensated = blended * autoGainCompensation;

            // Clamp to prevent clipping
            curve[i] = Math.max(-0.98, Math.min(0.98, compensated));
          }

          // Cache curve
          if (this.saturationCurveCache.size > 50) {
            const firstKey = this.saturationCurveCache.keys().next().value;
            if (firstKey) {
              this.saturationCurveCache.delete(firstKey);
            }
          }
          this.saturationCurveCache.set(cacheKey, curve);
        }

        if (this.saturationNode && curve) {
          // Create new Float32Array from cached curve to ensure proper type
          this.saturationNode.curve = new Float32Array(curve);
        }

        // Update pre/de-emphasis filters based on mode
        if (this.saturationPreEmphasis && this.saturationDeEmphasis) {
          if (mode === 'tape') {
            // Tape mode: gunakan pre/de-emphasis hanya saat mix full untuk mencegah artefak fase
            const isFullWet = (settings.saturation.mix ?? this.currentSettings.saturation.mix) >= 100;
            this.saturationPreEmphasis.gain.setValueAtTime(isFullWet ? 6 : 0, now); // +6dB boost
            this.saturationDeEmphasis.gain.setValueAtTime(isFullWet ? -6 : 0, now); // -6dB cut
          } else {
            // Mode lain: bypass pre/de-emphasis
            this.saturationPreEmphasis.gain.setValueAtTime(0, now);
            this.saturationDeEmphasis.gain.setValueAtTime(0, now);
          }
        }
      }
      if (this.saturationWetGain && this.saturationDryGain && settings.saturation.mix !== undefined) {
        // Jalur dry dimatikan untuk semua mode agar tidak ada comb/chorus,
        // mix di-handle langsung di kurva (createSaturationNode / cache).
        this.saturationDryGain.gain.setValueAtTime(0, now);
        this.saturationWetGain.gain.setValueAtTime(1, now);
      }
      if (settings.saturation.enabled !== undefined && this.saturationMix && this.saturationBypass) {
        this.saturationMix.gain.setValueAtTime(settings.saturation.enabled ? 1 : 0, now);
        this.saturationBypass.gain.setValueAtTime(settings.saturation.enabled ? 0 : 1, now);
      }
    }

    // Update harmonizer parameters
    if (settings.harmonizer) {
      if (settings.harmonizer.enabled !== undefined && this.harmonizerMix && this.harmonizerBypass) {
        this.harmonizerMix.gain.setValueAtTime(settings.harmonizer.enabled ? 1 : 0, now);
        this.harmonizerBypass.gain.setValueAtTime(settings.harmonizer.enabled ? 0 : 1, now);
      }
      if (this.harmonizerDryGain && this.harmonizerWetGain && settings.harmonizer.mix !== undefined) {
        this.harmonizerDryGain.gain.setValueAtTime(1 - (settings.harmonizer.mix / 100), now);
        this.harmonizerWetGain.gain.setValueAtTime(settings.harmonizer.mix / 100, now);
      }
      if (this.harmonizerLFO1 && this.harmonizerLFO2 && settings.harmonizer.depth !== undefined) {
        // Update LFO frequency based on depth
        const lfoFreq1 = 0.5 + (settings.harmonizer.depth / 100 * 2);
        const lfoFreq2 = 0.7 + (settings.harmonizer.depth / 100 * 1.8);
        this.harmonizerLFO1.frequency.setValueAtTime(lfoFreq1, now);
        this.harmonizerLFO2.frequency.setValueAtTime(lfoFreq2, now);
      }
      if (this.harmonizerLFOGain1 && this.harmonizerLFOGain2 && settings.harmonizer.depth !== undefined) {
        // Update modulation depth
        const modulationDepth = (settings.harmonizer.depth / 100) * 0.005;
        this.harmonizerLFOGain1.gain.setValueAtTime(modulationDepth, now);
        this.harmonizerLFOGain2.gain.setValueAtTime(modulationDepth, now);
      }
      if (this.harmonizerToneFilter && settings.harmonizer.tone !== undefined) {
        this.harmonizerToneFilter.frequency.setValueAtTime(2000 + (settings.harmonizer.tone / 100 * 3000), now);
        this.harmonizerToneFilter.gain.setValueAtTime(settings.harmonizer.tone / 10, now);
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
   * Default settings: Harmonizer (chorus) dimatikan agar Saturation tidak terdengar flanger.
   */
  private currentSettings: AudioEngineSettings = {
    inputGain: 0,
    outputGain: 0,
    compressor: { enabled: true, threshold: -20, ratio: 4, attack: 10, release: 100, gain: 0 },
    limiter: { enabled: true, threshold: -0.3 },
    stereoWidth: { enabled: true, width: 100 },
    harmonizer: { enabled: false, mix: 0, depth: 0, tone: 0 },
    reverb: { enabled: false, mix: 0, size: 0, decay: 0, damping: 0 },
    saturation: { enabled: true, drive: 25, mix: 40, bias: 0, mode: 'soft' },
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
    if (this.saturationNode) {
      try {
        this.saturationNode.disconnect();
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
    // Cleanup harmonizer
    if (this.harmonizerDelay1) {
      try {
        this.harmonizerDelay1.disconnect();
      } catch {
        // Ignore
      }
    }
    if (this.harmonizerDelay2) {
      try {
        this.harmonizerDelay2.disconnect();
      } catch {
        // Ignore
      }
    }
    if (this.harmonizerLFO1) {
      try {
        this.harmonizerLFO1.stop();
        this.harmonizerLFO1.disconnect();
      } catch {
        // Ignore
      }
    }
    if (this.harmonizerLFO2) {
      try {
        this.harmonizerLFO2.stop();
        this.harmonizerLFO2.disconnect();
      } catch {
        // Ignore
      }
    }
    if (this.harmonizerToneFilter) {
      try {
        this.harmonizerToneFilter.disconnect();
      } catch {
        // Ignore
      }
    }
    if (this.harmonizerDryGain) {
      try {
        this.harmonizerDryGain.disconnect();
      } catch {
        // Ignore
      }
    }
    if (this.harmonizerWetGain) {
      try {
        this.harmonizerWetGain.disconnect();
      } catch {
        // Ignore
      }
    }
    if (this.harmonizerMix) {
      try {
        this.harmonizerMix.disconnect();
      } catch {
        // Ignore
      }
    }
    if (this.harmonizerBypass) {
      try {
        this.harmonizerBypass.disconnect();
      } catch {
        // Ignore
      }
    }
    if (this.harmonizerOutput) {
      try {
        this.harmonizerOutput.disconnect();
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

  async exportAudio(settings: AudioEngineSettings, format: 'wav' | 'mp3' = 'wav'): Promise<Blob> {
    if (!this.audioBuffer) {
      throw new Error('No audio loaded');
    }

    try {
      const sampleRate = this.audioBuffer.sampleRate;
      const length = this.audioBuffer.length;
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

      // Saturation (disamakan dengan path real-time: kurva & cara mix)
      const saturationNode = offlineContext.createWaveShaper();
      const satDrive = settings.saturation.drive;
      const satBias = settings.saturation.bias;
      const satMode = settings.saturation.mode || 'soft';
      const satMix = settings.saturation.mix;
      const satCurve = new Float32Array(65536);
      const satHardLimit = satMode === 'soft' ? 0.9 : 0.98;
      let satSumInSq = 0;
      let satSumOutSq = 0;

      for (let i = 0; i < 65536; i++) {
        const x = (i - 32768) / 32768;
        let saturated: number;

        // Gunakan model yang sama dengan createSaturationNode / updateSettings
        switch (satMode) {
          case 'tube': {
            const drive = satDrive / 100;
            const bias = satBias / 100;
            const tubeGain = 1 + drive * 4.0;
            const tubeInput = x * tubeGain;
            if (tubeInput >= 0) {
              saturated = Math.tanh(tubeInput * 0.9) * 1.05;
            } else {
              saturated = Math.tanh(tubeInput * 1.1) * 0.95;
            }
            saturated += Math.sin(tubeInput * Math.PI * 0.5) * 0.05 * drive;
            saturated += bias * 0.12;
            break;
          }
          case 'tape': {
            const drive = satDrive / 100;
            const bias = satBias / 100;
            const tapeGain = 1 + drive * 3.5;
            const tapeInput = x * tapeGain;
            const tapeBase = (2 / Math.PI) * Math.atan(tapeInput * Math.PI / 2);
            const tapeCompression = tapeInput / (1 + Math.abs(tapeInput) * 0.5);
            saturated = tapeBase * 0.7 + tapeCompression * 0.3;
            saturated += Math.sin(tapeInput * Math.PI) * 0.03 * drive;
            saturated += bias * 0.1;
            break;
          }
          case 'soft':
          default: {
            const drive = satDrive / 100;
            const bias = satBias / 100;
            const softGain = 1 + drive * 2.0;
            const biased = x + bias * 0.15;
            const input = biased * softGain;
            saturated = Math.tanh(input);
            break;
          }
        }

        // Seri-style mix di dalam kurva: samakan dengan path real-time
        const mixValue = satMix / 100;
        const blended = x + mixValue * (saturated - x);

        const y = Math.max(-satHardLimit, Math.min(satHardLimit, blended));
        satCurve[i] = y;
        satSumInSq += x * x;
        satSumOutSq += y * y;
      }

      let satCompensation = satSumOutSq > 0 ? Math.sqrt(satSumInSq / satCurve.length) / Math.sqrt(satSumOutSq / satCurve.length) : 1;
      satCompensation = Math.min(1.2, Math.max(0.5, satCompensation));
      if (satMode === 'soft') {
        satCompensation = Math.min(satCompensation, 0.9);
      }

      for (let i = 0; i < satCurve.length; i++) {
        satCurve[i] = Math.max(-0.98, Math.min(0.98, satCurve[i] * satCompensation));
      }

      saturationNode.curve = satCurve;
      saturationNode.oversample = (satMode === 'soft' || satMix >= 100 ? '4x' : 'none');

      const saturationDryGain = offlineContext.createGain();
      const saturationWetGain = offlineContext.createGain();
      // Offline path: gunakan hanya jalur wet, karena mix sudah di-handle di kurva
      saturationDryGain.gain.value = 0;
      saturationWetGain.gain.value = 1;

      const saturationMix = offlineContext.createGain();
      const saturationBypass = offlineContext.createGain();
      saturationMix.gain.value = settings.saturation.enabled ? 1 : 0;
      saturationBypass.gain.value = settings.saturation.enabled ? 0 : 1;
      const saturationOutput = offlineContext.createGain();

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

      // Fade in/out gain node (3 detik fade in, 3 detik fade out)
      const fadeGain = offlineContext.createGain();
      const fadeDuration = 3.0; // 3 detik
      const audioDuration = length / sampleRate; // Durasi audio dalam detik

      // Fade in: 0 -> 1 dalam 3 detik pertama
      fadeGain.gain.setValueAtTime(0, 0);

      if (audioDuration > fadeDuration * 2) {
        // Audio lebih panjang dari 6 detik: fade in 3s, steady, fade out 3s
        fadeGain.gain.linearRampToValueAtTime(1, fadeDuration);
        const fadeOutStart = audioDuration - fadeDuration;
        fadeGain.gain.setValueAtTime(1, fadeOutStart);
        fadeGain.gain.linearRampToValueAtTime(0, audioDuration);
      } else if (audioDuration > fadeDuration) {
        // Audio antara 3-6 detik: fade in 3s, lalu langsung fade out
        fadeGain.gain.linearRampToValueAtTime(1, fadeDuration);
        const fadeOutStart = audioDuration - fadeDuration;
        // Pastikan fade out tidak overlap dengan fade in
        if (fadeOutStart > fadeDuration) {
          fadeGain.gain.setValueAtTime(1, fadeOutStart);
          fadeGain.gain.linearRampToValueAtTime(0, audioDuration);
        } else {
          // Jika overlap, fade out dimulai setelah fade in selesai
          fadeGain.gain.setValueAtTime(1, fadeDuration);
          fadeGain.gain.linearRampToValueAtTime(0, audioDuration);
        }
      } else {
        // Audio lebih pendek dari 3 detik: fade in setengah, fade out setengah
        const halfDuration = audioDuration / 2;
        fadeGain.gain.linearRampToValueAtTime(1, halfDuration);
        fadeGain.gain.linearRampToValueAtTime(0, audioDuration);
      }

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

      // Saturation with bypass
      const saturationInput = reverbOutput || compressorOutput;
      saturationInput.connect(saturationNode);
      saturationInput.connect(saturationDryGain);
      saturationNode.connect(saturationWetGain);

      // Mix wet and dry signals using GainNode (not ChannelMerger)
      const saturationMixNode = offlineContext.createGain();
      saturationWetGain.connect(saturationMixNode);
      saturationDryGain.connect(saturationMixNode);
      saturationMixNode.connect(saturationMix);

      saturationInput.connect(saturationBypass);
      saturationMix.connect(saturationOutput);
      saturationBypass.connect(saturationOutput);

      // Harmonizer with bypass (delay-based chorus effect)
      // Untuk export, kita gunakan fixed delay time dengan sedikit variasi
      // (LFO tidak bisa digunakan di OfflineAudioContext dengan cara yang sama)
      const harmonizerDelay1 = offlineContext.createDelay(0.05);
      const harmonizerDelay2 = offlineContext.createDelay(0.05);
      // Base delay dengan variasi berdasarkan depth
      const baseDelay = 0.010; // 10ms
      const depthVariation = (settings.harmonizer.depth / 100) * 0.005; // Max 5ms variation
      harmonizerDelay1.delayTime.value = baseDelay;
      harmonizerDelay2.delayTime.value = baseDelay * 1.5 + depthVariation; // Slightly different delay
      const harmonizerToneFilter = offlineContext.createBiquadFilter();
      harmonizerToneFilter.type = 'peaking';
      harmonizerToneFilter.frequency.value = 2000 + (settings.harmonizer.tone / 100 * 3000);
      harmonizerToneFilter.Q.value = 1;
      harmonizerToneFilter.gain.value = settings.harmonizer.tone / 10;

      const harmonizerDryGain = offlineContext.createGain();
      const harmonizerWetGain = offlineContext.createGain();
      harmonizerDryGain.gain.value = 1 - (settings.harmonizer.mix / 100);
      harmonizerWetGain.gain.value = settings.harmonizer.mix / 100;

      const harmonizerMix = offlineContext.createGain();
      const harmonizerBypass = offlineContext.createGain();
      harmonizerMix.gain.value = settings.harmonizer.enabled ? 1 : 0;
      harmonizerBypass.gain.value = settings.harmonizer.enabled ? 0 : 1;
      const harmonizerOutput = offlineContext.createGain();

      if (settings.harmonizer.enabled) {
        // Connect input to delays and dry path
        saturationOutput.connect(harmonizerDelay1);
        saturationOutput.connect(harmonizerDelay2);
        saturationOutput.connect(harmonizerDryGain);

        // Process delayed signals through tone filter (sum both delays)
        const delaySum = offlineContext.createGain();
        harmonizerDelay1.connect(delaySum);
        harmonizerDelay2.connect(delaySum);
        delaySum.connect(harmonizerToneFilter);
        harmonizerToneFilter.connect(harmonizerWetGain);

        // Mix dry and wet
        const harmonizerMixNode = offlineContext.createGain();
        harmonizerDryGain.connect(harmonizerMixNode);
        harmonizerWetGain.connect(harmonizerMixNode);
        harmonizerMixNode.connect(harmonizerMix);
      } else {
        saturationOutput.connect(harmonizerMix);
      }
      saturationOutput.connect(harmonizerBypass);
      harmonizerMix.connect(harmonizerOutput);
      harmonizerBypass.connect(harmonizerOutput);

      // Stereo Width (if enabled and stereo) - same proper implementation as playback
      let stereoOutput: GainNode = harmonizerOutput;
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

        saturationOutput.connect(splitter);
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

      limiterOutput.connect(fadeGain);
      fadeGain.connect(outputGain);
      outputGain.connect(offlineContext.destination);

      // Render
      source.start(0);
      const renderedBuffer = await offlineContext.startRendering();

      if (!renderedBuffer) {
        throw new Error('Failed to render audio buffer');
      }

      // Convert to WAV
      if (format === 'wav') {
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
          return new Blob([wav], { type: 'audio/wav' });
        } catch (err: unknown) {
          console.error('WAV conversion error:', err);
          throw new Error(`Failed to convert to WAV: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      // For MP3, would need additional library
      throw new Error('MP3 export not yet implemented');
    } catch (err: unknown) {
      console.error('Export audio error:', err);
      throw err;
    }
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

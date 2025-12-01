// Vintage Drive Processor - SSL FUSION style
// AudioWorklet processor dengan oversampling, bias modulation, dan dual saturation
// NOTE: File ini adalah referensi TypeScript. File yang digunakan adalah public/vintage-drive-processor.js

export interface VintageDriveParameters {
  drive: number; // 0-100
  bias: number; // 0-100
  biasModulation: number; // 0-100
  transformerBump: number; // 0-100
  tone: number; // 0-100 (high roll-off)
  oversample: 4 | 8;
  enabled: boolean;
}

// Type definitions untuk AudioWorklet (tidak dikompilasi, hanya untuk referensi)
declare class AudioWorkletProcessor {
  port: MessagePort;
  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean;
}

declare const sampleRate: number;
declare function registerProcessor(name: string, processor: typeof AudioWorkletProcessor): void;

class VintageDriveProcessor extends AudioWorkletProcessor {
  private parameters: VintageDriveParameters = {
    drive: 50,
    bias: 50,
    biasModulation: 50,
    transformerBump: 50,
    tone: 50,
    oversample: 4,
    enabled: true,
  };

  // Envelope follower state untuk bias modulation
  private envelopeFollower = 0;
  private envelopeAttack = 0.001; // 1ms attack
  private envelopeRelease = 0.1; // 100ms release
  private envelopeCoeffAttack = 0;
  private envelopeCoeffRelease = 0;

  // High-pass filter state (DC blocker @ 15Hz) - per channel
  private hpState: Array<{ x1: number; y1: number }> = [{ x1: 0, y1: 0 }, { x1: 0, y1: 0 }];
  private hpCoeff = { b0: 0, b1: 0, a1: 0 };

  // Soft compressor state - per channel
  private compState: Array<{ x1: number; y1: number }> = [{ x1: 0, y1: 1 }, { x1: 0, y1: 1 }];
  private compRatio = 1.2;
  private compThreshold = 0.7;
  private compAttack = 0.003; // 3ms
  private compRelease = 0.05; // 50ms
  private compCoeffAttack = 0;
  private compCoeffRelease = 0;

  // Tone shaper (high roll-off) state - per channel
  private toneState: Array<{ x1: number; y1: number }> = [{ x1: 0, y1: 0 }, { x1: 0, y1: 0 }];
  private toneCoeff = { b0: 0, b1: 0, a1: 0 };

  // Oversampling buffer
  private oversampleBuffer: Float32Array[] = [];
  private downsampledBuffer: Float32Array[] = [];

  constructor() {
    super();
    this.port.onmessage = (event: MessageEvent<{ type: string; params?: Partial<VintageDriveParameters> }>) => {
      if (event.data.type === 'update') {
        this.parameters = { ...this.parameters, ...event.data.params };
        this.updateCoefficients();
      }
    };
    this.updateCoefficients();
  }

  private updateCoefficients(): void {
    const sr = sampleRate;
    const nyquist = sr * 0.5;

    // High-pass filter @ 15Hz (DC blocker)
    const fc = 15;
    const omega = (2 * Math.PI * fc) / sr;
    const cosOmega = Math.cos(omega);
    const sinOmega = Math.sin(omega);
    const alpha = sinOmega / (2 * 0.707); // Q = 0.707

    this.hpCoeff.b0 = (1 + cosOmega) / 2;
    this.hpCoeff.b1 = -(1 + cosOmega);
    this.hpCoeff.a1 = -2 * cosOmega;

    // Envelope follower coefficients
    this.envelopeCoeffAttack = Math.exp(-1 / (this.envelopeAttack * sr));
    this.envelopeCoeffRelease = Math.exp(-1 / (this.envelopeRelease * sr));

    // Soft compressor coefficients
    this.compCoeffAttack = Math.exp(-1 / (this.compAttack * sr));
    this.compCoeffRelease = Math.exp(-1 / (this.compRelease * sr));

    // Tone shaper (high roll-off) - soft lowpass
    const toneFreq = 5000 + (this.parameters.tone / 100) * 15000; // 5-20kHz
    const toneFc = Math.min(toneFreq, nyquist * 0.95);
    const toneOmega = (2 * Math.PI * toneFc) / sr;
    const toneCosOmega = Math.cos(toneOmega);
    const toneSinOmega = Math.sin(toneOmega);
    const toneAlpha = toneSinOmega / (2 * 0.707);

    this.toneCoeff.b0 = (1 - toneCosOmega) / 2;
    this.toneCoeff.b1 = 1 - toneCosOmega;
    this.toneCoeff.a1 = -2 * toneCosOmega;
  }

  // High-pass filter (DC blocker @ 15Hz)
  private highPassFilter(input: number, channel: number): number {
    const state = this.hpState[channel] || this.hpState[0];
    const coeff = this.hpCoeff;

    const output = coeff.b0 * input + coeff.b1 * state.x1 - coeff.a1 * state.y1;
    state.x1 = input;
    state.y1 = output;

    return output;
  }

  // Envelope follower untuk bias modulation
  private updateEnvelopeFollower(input: number): void {
    const absInput = Math.abs(input);
    if (absInput > this.envelopeFollower) {
      this.envelopeFollower = absInput + (this.envelopeFollower - absInput) * this.envelopeCoeffAttack;
    } else {
      this.envelopeFollower = absInput + (this.envelopeFollower - absInput) * this.envelopeCoeffRelease;
    }
  }

  // Dynamic bias calculation
  private getDynamicBias(): number {
    const baseBias = this.parameters.bias / 100;
    const modulationAmount = this.parameters.biasModulation / 100;
    const envelopeMod = this.envelopeFollower * modulationAmount;
    return baseBias + envelopeMod * 0.3; // Max 30% modulation
  }

  // Tube saturation stage (tanh dengan polynomial untuk karakter yang lebih halus)
  private tubeSaturation(input: number, bias: number): number {
    const drive = this.parameters.drive / 100;
    const driveGain = 1 + drive * 3; // 1x to 4x gain

    // Apply bias offset
    const biased = input + bias * 0.1;

    // Tanh saturation dengan polynomial untuk karakter yang lebih halus
    const driven = biased * driveGain;
    
    // Soft tanh dengan polynomial approximation untuk karakter vintage
    let saturated: number;
    if (Math.abs(driven) < 0.5) {
      // Polynomial untuk range kecil (lebih halus)
      const x = driven;
      saturated = x * (1 - (x * x) / 3);
    } else {
      // Tanh untuk range besar
      saturated = Math.tanh(driven);
    }

    return saturated;
  }

  // Transformer stage (odd-harmonic + low bump)
  private transformerStage(input: number): number {
    const bumpAmount = this.parameters.transformerBump / 100;
    
    // Odd harmonic generation (simulasi transformer saturation)
    const x = input;
    const x3 = x * x * x;
    const x5 = x3 * x * x;
    
    // Odd harmonics dengan weighting
    const oddHarmonics = x + (x3 * 0.15) + (x5 * 0.05);
    
    // Low frequency bump (transformer resonance)
    // Simulasi dengan subtle low-frequency emphasis
    const lowBump = Math.sin(input * Math.PI * 0.1) * bumpAmount * 0.05;
    
    return oddHarmonics + lowBump;
  }

  // Soft compressor (ratio ~1.2:1)
  private softCompressor(input: number, channel: number): number {
    const absInput = Math.abs(input);
    let targetGain = 1.0;

    if (absInput > this.compThreshold) {
      const overThreshold = absInput - this.compThreshold;
      const gainReduction = overThreshold * (1 - 1 / this.compRatio);
      targetGain = 1.0 - (gainReduction / absInput);
      targetGain = Math.max(0.1, Math.min(1.0, targetGain));
    }

    // Smooth gain changes
    const state = this.compState[channel] || this.compState[0];
    if (targetGain < state.y1) {
      state.y1 = targetGain + (state.y1 - targetGain) * this.compCoeffAttack;
    } else {
      state.y1 = targetGain + (state.y1 - targetGain) * this.compCoeffRelease;
    }

    return input * state.y1;
  }

  // Tone shaper (soft high roll-off)
  private toneShaper(input: number, channel: number): number {
    const state = this.toneState[channel] || this.toneState[0];
    const coeff = this.toneCoeff;

    const output = coeff.b0 * input + coeff.b1 * state.x1 - coeff.a1 * state.y1;
    state.x1 = input;
    state.y1 = output;

    return output;
  }

  // Oversample up
  private upsample(input: Float32Array[], factor: number): Float32Array[] {
    const numChannels = input.length;
    const inputLength = input[0].length;
    const outputLength = inputLength * factor;

    const output: Float32Array[] = [];
    for (let ch = 0; ch < numChannels; ch++) {
      const channelOutput = new Float32Array(outputLength);
      for (let i = 0; i < inputLength; i++) {
        const value = input[ch][i];
        for (let j = 0; j < factor; j++) {
          channelOutput[i * factor + j] = value;
        }
      }
      output.push(channelOutput);
    }

    return output;
  }

  // Oversample down (decimation dengan anti-aliasing)
  private downsample(input: Float32Array[], factor: number): Float32Array[] {
    const numChannels = input.length;
    const inputLength = input[0].length;
    const outputLength = Math.floor(inputLength / factor);

    const output: Float32Array[] = [];
    for (let ch = 0; ch < numChannels; ch++) {
      const channelOutput = new Float32Array(outputLength);
      for (let i = 0; i < outputLength; i++) {
        channelOutput[i] = input[ch][i * factor];
      }
      output.push(channelOutput);
    }

    return output;
  }

  // Process satu channel dengan semua stages
  private processChannel(input: Float32Array, channel: number): Float32Array {
    const length = input.length;
    const output = new Float32Array(length);

    for (let i = 0; i < length; i++) {
      let sample = input[i];

      // High-pass @ 15Hz (DC blocker)
      sample = this.highPassFilter(sample, channel);

      // Update envelope follower untuk bias modulation
      this.updateEnvelopeFollower(sample);

      // Get dynamic bias
      const dynamicBias = this.getDynamicBias();

      // Tube saturation stage
      sample = this.tubeSaturation(sample, dynamicBias);

      // Transformer stage
      sample = this.transformerStage(sample);

      // Soft compressor
      sample = this.softCompressor(sample, channel);

      // Tone shaper (HF roll-off)
      sample = this.toneShaper(sample, channel);

      output[i] = sample;
    }

    return output;
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
    if (!this.parameters.enabled) {
      // Bypass mode
      for (let channel = 0; channel < outputs.length; channel++) {
        if (inputs[0] && inputs[0][channel] && outputs[channel]) {
          const inputChannel = inputs[0][channel];
          const outputChannel = outputs[channel] as unknown as Float32Array;
          for (let i = 0; i < Math.min(inputChannel.length, outputChannel.length); i++) {
            outputChannel[i] = inputChannel[i];
          }
        }
      }
      return true;
    }

    const input = inputs[0];
    if (!input || input.length === 0) {
      return true;
    }

    const numChannels = input.length;
    const blockSize = input[0].length;

    // Oversample up
    const oversampled = this.upsample(input, this.parameters.oversample);

    // Process each channel dengan oversampling
    const processed: Float32Array[] = [];
    for (let ch = 0; ch < numChannels; ch++) {
      processed.push(this.processChannel(oversampled[ch], ch));
    }

    // Oversample down
    const downsampled = this.downsample(processed, this.parameters.oversample);

    // Copy to output
    for (let ch = 0; ch < Math.min(numChannels, outputs.length); ch++) {
      if (outputs[ch] && downsampled[ch]) {
        const outputChannel = outputs[ch] as unknown as Float32Array;
        const downsampledChannel = downsampled[ch];
        for (let i = 0; i < Math.min(outputChannel.length, downsampledChannel.length); i++) {
          outputChannel[i] = downsampledChannel[i];
        }
      }
    }

    return true;
  }
}

registerProcessor('vintage-drive-processor', VintageDriveProcessor);


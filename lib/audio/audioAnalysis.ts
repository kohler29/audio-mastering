// Real-time audio analysis utilities
// These functions process audio data from AnalyserNode

export interface WaveformData {
  samples: Float32Array;
  peak: number;
  rms: number;
}

export interface SpectrumData {
  frequencies: Uint8Array;
  peakFrequency: number;
  energy: number;
}

export interface VUData {
  left: number;
  right: number;
  peak: number;
}

export interface LoudnessData {
  momentary: number;
  shortTerm: number;
  integrated: number;
  truePeak: number;
  lra: number;
}

/**
 * Extract waveform data from AnalyserNode
 */
export function extractWaveform(data: Uint8Array): WaveformData {
  const samples = new Float32Array(data.length);
  let peak = 0;
  let sumSquares = 0;

  for (let i = 0; i < data.length; i++) {
    // Convert byte data (0-255) to float (-1 to 1)
    const sample = (data[i] - 128) / 128;
    samples[i] = sample;
    
    const abs = Math.abs(sample);
    if (abs > peak) {
      peak = abs;
    }
    
    sumSquares += sample * sample;
  }

  const rms = Math.sqrt(sumSquares / data.length);

  return { samples, peak, rms };
}

/**
 * Extract spectrum data from AnalyserNode frequency data
 */
export function extractSpectrum(data: Uint8Array, sampleRate: number): SpectrumData {
  let peakFrequency = 0;
  let peakValue = 0;
  let energy = 0;

  for (let i = 0; i < data.length; i++) {
    const value = data[i];
    energy += value;

    if (value > peakValue) {
      peakValue = value;
      peakFrequency = (i * sampleRate) / (data.length * 2);
    }
  }

  return {
    frequencies: data,
    peakFrequency,
    energy: energy / data.length,
  };
}

/**
 * Calculate VU meter levels from audio data
 */
export function calculateVU(data: Uint8Array): number {
  let sumSquares = 0;
  
  for (let i = 0; i < data.length; i++) {
    const sample = (data[i] - 128) / 128;
    sumSquares += sample * sample;
  }

  const rms = Math.sqrt(sumSquares / data.length);
  
  // Convert to dB, with minimum of -60dB
  const db = 20 * Math.log10(rms + 0.0001);
  return Math.max(-60, Math.min(0, db));
}

/**
 * Calculate VU for stereo (simplified - assumes interleaved data)
 */
export function calculateStereoVU(data: Uint8Array): VUData {
  // For simplicity, calculate from same data
  // In real implementation, would separate left/right channels
  const left = calculateVU(data);
  const right = calculateVU(data);
  
  const peak = Math.max(left, right);

  return { left, right, peak };
}

/**
 * Simplified EBU R128 loudness calculation
 * Note: Real EBU R128 requires more complex processing with K-weighting filter
 */
export function calculateLoudness(
  waveformData: Uint8Array,
): LoudnessData {
  // Calculate RMS
  let sumSquares = 0;
  for (let i = 0; i < waveformData.length; i++) {
    const sample = (waveformData[i] - 128) / 128;
    sumSquares += sample * sample;
  }

  const rms = Math.sqrt(sumSquares / waveformData.length);
  const db = 20 * Math.log10(rms + 0.0001);

  // Approximate LUFS conversion (simplified)
  // Real EBU R128 requires K-weighting filter and gating
  const lufs = db - 23; // Approximate offset

  // Calculate true peak (simplified)
  let truePeak = db;
  for (let i = 0; i < waveformData.length; i++) {
    const sample = Math.abs((waveformData[i] - 128) / 128);
    const sampleDb = 20 * Math.log10(sample + 0.0001);
    if (sampleDb > truePeak) {
      truePeak = sampleDb;
    }
  }

  return {
    momentary: lufs,
    shortTerm: lufs * 0.95, // Simplified
    integrated: lufs * 0.9, // Simplified
    truePeak: truePeak + 3, // Add headroom
    lra: 6.5, // Simplified - would need longer analysis
  };
}

/**
 * Smooth audio data for visualization
 */
export function smoothData(data: Uint8Array, smoothing: number = 0.8): Uint8Array {
  const smoothed = new Uint8Array(data.length);
  let previous = data[0];

  for (let i = 0; i < data.length; i++) {
    smoothed[i] = Math.round(previous * smoothing + data[i] * (1 - smoothing));
    previous = smoothed[i];
  }

  return smoothed;
}

/**
 * Downsample data for performance
 */
export function downsample(data: Uint8Array, factor: number): Uint8Array {
  const length = Math.ceil(data.length / factor);
  const downsampled = new Uint8Array(length);

  for (let i = 0; i < length; i++) {
    let sum = 0;
    const start = i * factor;
    const end = Math.min(start + factor, data.length);
    
    for (let j = start; j < end; j++) {
      sum += data[j];
    }
    
    downsampled[i] = sum / (end - start);
  }

  return downsampled;
}


// Audio effects utilities and helpers
// Most effects are implemented directly in audioEngine.ts
// This file contains helper functions and effect presets

export interface EffectPreset {
  name: string;
  settings: {
    compressor?: {
      threshold: number;
      ratio: number;
      attack: number;
      release: number;
      gain?: number;
    };
    limiter?: {
      enabled: boolean;
      threshold: number;
    };
    stereoWidth?: {
      enabled: boolean;
      width: number;
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
  };
}

export const effectPresets: Record<string, EffectPreset> = {
  default: {
    name: 'Default',
    settings: {
      limiter: { enabled: true, threshold: -0.3 },
      stereoWidth: { enabled: true, width: 100 },
      multibandCompressor: {
        enabled: true,
        bands: [
          { name: 'LOW', lowFreq: 20, highFreq: 150, threshold: -20, ratio: 3, gain: 0, active: true },
          { name: 'LOW-MID', lowFreq: 150, highFreq: 800, threshold: -18, ratio: 3.5, gain: 0, active: true },
          { name: 'MID', lowFreq: 800, highFreq: 3000, threshold: -16, ratio: 3, gain: 0, active: true },
          { name: 'HIGH-MID', lowFreq: 3000, highFreq: 10000, threshold: -17, ratio: 3, gain: 0, active: true },
          { name: 'HIGH', lowFreq: 10000, highFreq: 20000, threshold: -15, ratio: 2.5, gain: 0, active: true },
        ],
      },
    },
  },
  mastering: {
    name: 'Mastering',
    settings: {
      compressor: {
        threshold: -18,
        ratio: 3,
        attack: 5,
        release: 80,
        gain: 1,
      },
      limiter: { enabled: true, threshold: -0.3 },
      stereoWidth: { enabled: true, width: 110 },
      multibandCompressor: {
        enabled: true,
        bands: [
          { name: 'LOW', lowFreq: 20, highFreq: 150, threshold: -22, ratio: 3, gain: 0.5, active: true },
          { name: 'LOW-MID', lowFreq: 150, highFreq: 800, threshold: -20, ratio: 3.5, gain: 0, active: true },
          { name: 'MID', lowFreq: 800, highFreq: 3000, threshold: -18, ratio: 3.5, gain: 0.5, active: true },
          { name: 'HIGH-MID', lowFreq: 3000, highFreq: 10000, threshold: -19, ratio: 3, gain: 0, active: true },
          { name: 'HIGH', lowFreq: 10000, highFreq: 20000, threshold: -17, ratio: 2.5, gain: 0, active: true },
        ],
      },
    },
  },
  loud: {
    name: 'Loud',
    settings: {
      compressor: {
        threshold: -12,
        ratio: 6,
        attack: 3,
        release: 50,
        gain: 5,
      },
      limiter: { enabled: true, threshold: -0.3 },
      stereoWidth: { enabled: true, width: 110 },
      multibandCompressor: {
        enabled: true,
        bands: [
          { name: 'LOW', lowFreq: 20, highFreq: 150, threshold: -15, ratio: 5, gain: 1, active: true },
          { name: 'LOW-MID', lowFreq: 150, highFreq: 800, threshold: -13, ratio: 5.5, gain: 1, active: true },
          { name: 'MID', lowFreq: 800, highFreq: 3000, threshold: -12, ratio: 5, gain: 1, active: true },
          { name: 'HIGH-MID', lowFreq: 3000, highFreq: 10000, threshold: -13, ratio: 4.5, gain: 0.5, active: true },
          { name: 'HIGH', lowFreq: 10000, highFreq: 20000, threshold: -11, ratio: 4, gain: 0.5, active: true },
        ],
      },
    },
  },
  warm: {
    name: 'Warm',
    settings: {
      compressor: {
        threshold: -18,
        ratio: 3,
        attack: 5,
        release: 80,
        gain: 4,
      },
      limiter: { enabled: true, threshold: -0.3 },
      stereoWidth: { enabled: true, width: 105 },
      multibandCompressor: {
        enabled: true,
        bands: [
          { name: 'LOW', lowFreq: 20, highFreq: 150, threshold: -22, ratio: 2.5, gain: 1.5, active: true },
          { name: 'LOW-MID', lowFreq: 150, highFreq: 800, threshold: -20, ratio: 3, gain: 1, active: true },
          { name: 'MID', lowFreq: 800, highFreq: 3000, threshold: -19, ratio: 2.5, gain: 3, active: true },
          { name: 'HIGH-MID', lowFreq: 3000, highFreq: 10000, threshold: -21, ratio: 2, gain: -0.5, active: true },
          { name: 'HIGH', lowFreq: 10000, highFreq: 20000, threshold: -23, ratio: 2, gain: -1, active: true },
        ],
      },
    },
  },
  bright: {
    name: 'Bright',
    settings: {
      compressor: {
        threshold: -20,
        ratio: 2.5,
        attack: 8,
        release: 120,
        gain: 2,
      },
      limiter: { enabled: true, threshold: -0.3 },
      stereoWidth: { enabled: true, width: 115 },
      multibandCompressor: {
        enabled: true,
        bands: [
          { name: 'LOW', lowFreq: 20, highFreq: 150, threshold: -24, ratio: 2, gain: -0.5, active: true },
          { name: 'LOW-MID', lowFreq: 150, highFreq: 800, threshold: -22, ratio: 2.5, gain: 0, active: true },
          { name: 'MID', lowFreq: 800, highFreq: 3000, threshold: -20, ratio: 2.5, gain: 0.5, active: true },
          { name: 'HIGH-MID', lowFreq: 3000, highFreq: 10000, threshold: -18, ratio: 3, gain: 1, active: true },
          { name: 'HIGH', lowFreq: 10000, highFreq: 20000, threshold: -16, ratio: 2.5, gain: 2.5, active: true },
        ],
      },
    },
  },
  vintage: {
    name: 'Vintage',
    settings: {
      compressor: {
        threshold: -25,
        ratio: 2.5,
        attack: 8,
        release: 120,
        gain: 2,
      },
      limiter: { enabled: true, threshold: -0.3 },
      stereoWidth: { enabled: true, width: 100 },
      multibandCompressor: {
        enabled: true,
        bands: [
          { name: 'LOW', lowFreq: 20, highFreq: 150, threshold: -21, ratio: 2.5, gain: 1, active: true },
          { name: 'LOW-MID', lowFreq: 150, highFreq: 800, threshold: -19, ratio: 3, gain: 0.5, active: true },
          { name: 'MID', lowFreq: 800, highFreq: 3000, threshold: -18, ratio: 2.8, gain: 0, active: true },
          { name: 'HIGH-MID', lowFreq: 3000, highFreq: 10000, threshold: -20, ratio: 2.5, gain: -0.5, active: true },
          { name: 'HIGH', lowFreq: 10000, highFreq: 20000, threshold: -22, ratio: 2, gain: -3, active: true },
        ],
      },
    },
  },
  punchy: {
    name: 'Punchy',
    settings: {
      compressor: {
        threshold: -15,
        ratio: 4.5,
        attack: 2,
        release: 60,
        gain: 5,
      },
      limiter: { enabled: true, threshold: -0.3 },
      stereoWidth: { enabled: true, width: 110 },
      multibandCompressor: {
        enabled: true,
        bands: [
          { name: 'LOW', lowFreq: 20, highFreq: 150, threshold: -18, ratio: 4, gain: 1, active: true },
          { name: 'LOW-MID', lowFreq: 150, highFreq: 800, threshold: -14, ratio: 5, gain: 2, active: true },
          { name: 'MID', lowFreq: 800, highFreq: 3000, threshold: -16, ratio: 4, gain: 1, active: true },
          { name: 'HIGH-MID', lowFreq: 3000, highFreq: 10000, threshold: -17, ratio: 3.5, gain: 0.5, active: true },
          { name: 'HIGH', lowFreq: 10000, highFreq: 20000, threshold: -15, ratio: 3, gain: 0.5, active: true },
        ],
      },
    },
  },
  smooth: {
    name: 'Smooth',
    settings: {
      compressor: {
        threshold: -22,
        ratio: 2,
        attack: 15,
        release: 150,
        gain: 1,
      },
      limiter: { enabled: true, threshold: -0.3 },
      stereoWidth: { enabled: true, width: 100 },
      multibandCompressor: {
        enabled: true,
        bands: [
          { name: 'LOW', lowFreq: 20, highFreq: 150, threshold: -24, ratio: 2, gain: 0, active: true },
          { name: 'LOW-MID', lowFreq: 150, highFreq: 800, threshold: -22, ratio: 2.2, gain: 0, active: true },
          { name: 'MID', lowFreq: 800, highFreq: 3000, threshold: -21, ratio: 2, gain: 0, active: true },
          { name: 'HIGH-MID', lowFreq: 3000, highFreq: 10000, threshold: -22, ratio: 2, gain: 0, active: true },
          { name: 'HIGH', lowFreq: 10000, highFreq: 20000, threshold: -20, ratio: 1.8, gain: 0, active: true },
        ],
      },
    },
  },
  aggressive: {
    name: 'Aggressive',
    settings: {
      compressor: {
        threshold: -10,
        ratio: 8,
        attack: 1,
        release: 40,
        gain: 6,
      },
      limiter: { enabled: true, threshold: -0.3 },
      stereoWidth: { enabled: true, width: 115 },
      multibandCompressor: {
        enabled: true,
        bands: [
          { name: 'LOW', lowFreq: 20, highFreq: 150, threshold: -12, ratio: 7, gain: 2, active: true },
          { name: 'LOW-MID', lowFreq: 150, highFreq: 800, threshold: -10, ratio: 8, gain: 2.5, active: true },
          { name: 'MID', lowFreq: 800, highFreq: 3000, threshold: -11, ratio: 7.5, gain: 2, active: true },
          { name: 'HIGH-MID', lowFreq: 3000, highFreq: 10000, threshold: -12, ratio: 6.5, gain: 1.5, active: true },
          { name: 'HIGH', lowFreq: 10000, highFreq: 20000, threshold: -10, ratio: 6, gain: 1.5, active: true },
        ],
      },
    },
  },
  clean: {
    name: 'Clean',
    settings: {
      compressor: {
        threshold: -24,
        ratio: 2,
        attack: 10,
        release: 100,
        gain: 1,
      },
      limiter: { enabled: true, threshold: -0.3 },
      stereoWidth: { enabled: true, width: 100 },
      multibandCompressor: {
        enabled: true,
        bands: [
          { name: 'LOW', lowFreq: 20, highFreq: 150, threshold: -26, ratio: 1.8, gain: 0, active: true },
          { name: 'LOW-MID', lowFreq: 150, highFreq: 800, threshold: -24, ratio: 2, gain: 0, active: true },
          { name: 'MID', lowFreq: 800, highFreq: 3000, threshold: -23, ratio: 2, gain: 0, active: true },
          { name: 'HIGH-MID', lowFreq: 3000, highFreq: 10000, threshold: -24, ratio: 1.8, gain: 0, active: true },
          { name: 'HIGH', lowFreq: 10000, highFreq: 20000, threshold: -22, ratio: 1.8, gain: 0, active: true },
        ],
      },
    },
  },
  deep: {
    name: 'Deep',
    settings: {
      compressor: {
        threshold: -16,
        ratio: 3.5,
        attack: 5,
        release: 90,
      },
      limiter: { enabled: true, threshold: -0.3 },
      stereoWidth: { enabled: true, width: 110 },
      multibandCompressor: {
        enabled: true,
        bands: [
          { name: 'LOW', lowFreq: 20, highFreq: 150, threshold: -18, ratio: 3, gain: 2, active: true },
          { name: 'LOW-MID', lowFreq: 150, highFreq: 800, threshold: -17, ratio: 3.5, gain: 1.5, active: true },
          { name: 'MID', lowFreq: 800, highFreq: 3000, threshold: -19, ratio: 3, gain: 0.5, active: true },
          { name: 'HIGH-MID', lowFreq: 3000, highFreq: 10000, threshold: -20, ratio: 2.5, gain: 0, active: true },
          { name: 'HIGH', lowFreq: 10000, highFreq: 20000, threshold: -22, ratio: 2, gain: -0.5, active: true },
        ],
      },
    },
  },
  crisp: {
    name: 'Crisp',
    settings: {
      compressor: {
        threshold: -19,
        ratio: 3,
        attack: 6,
        release: 110,
      },
      limiter: { enabled: true, threshold: -0.3 },
      stereoWidth: { enabled: true, width: 115 },
      multibandCompressor: {
        enabled: true,
        bands: [
          { name: 'LOW', lowFreq: 20, highFreq: 150, threshold: -23, ratio: 2.5, gain: -0.5, active: true },
          { name: 'LOW-MID', lowFreq: 150, highFreq: 800, threshold: -21, ratio: 2.8, gain: 0, active: true },
          { name: 'MID', lowFreq: 800, highFreq: 3000, threshold: -19, ratio: 3, gain: 0.5, active: true },
          { name: 'HIGH-MID', lowFreq: 3000, highFreq: 10000, threshold: -17, ratio: 3.2, gain: 1.5, active: true },
          { name: 'HIGH', lowFreq: 10000, highFreq: 20000, threshold: -15, ratio: 3, gain: 2, active: true },
        ],
      },
    },
  },
  wide: {
    name: 'Wide',
    settings: {
      compressor: {
        threshold: -20,
        ratio: 2.5,
        attack: 8,
        release: 120,
      },
      limiter: { enabled: true, threshold: -0.3 },
      stereoWidth: { enabled: true, width: 150 },
      multibandCompressor: {
        enabled: true,
        bands: [
          { name: 'LOW', lowFreq: 20, highFreq: 150, threshold: -22, ratio: 2.5, gain: 0.5, active: true },
          { name: 'LOW-MID', lowFreq: 150, highFreq: 800, threshold: -20, ratio: 2.8, gain: 0, active: true },
          { name: 'MID', lowFreq: 800, highFreq: 3000, threshold: -19, ratio: 2.5, gain: 0, active: true },
          { name: 'HIGH-MID', lowFreq: 3000, highFreq: 10000, threshold: -20, ratio: 2.5, gain: 0.5, active: true },
          { name: 'HIGH', lowFreq: 10000, highFreq: 20000, threshold: -18, ratio: 2.5, gain: 0.5, active: true },
        ],
      },
    },
  },
  intimate: {
    name: 'Intimate',
    settings: {
      compressor: {
        threshold: -25,
        ratio: 1.8,
        attack: 12,
        release: 130,
      },
      limiter: { enabled: true, threshold: -0.3 },
      stereoWidth: { enabled: true, width: 90 },
      multibandCompressor: {
        enabled: true,
        bands: [
          { name: 'LOW', lowFreq: 20, highFreq: 150, threshold: -27, ratio: 1.8, gain: 0, active: true },
          { name: 'LOW-MID', lowFreq: 150, highFreq: 800, threshold: -25, ratio: 2, gain: 0, active: true },
          { name: 'MID', lowFreq: 800, highFreq: 3000, threshold: -24, ratio: 2, gain: 0.5, active: true },
          { name: 'HIGH-MID', lowFreq: 3000, highFreq: 10000, threshold: -25, ratio: 1.8, gain: 0, active: true },
          { name: 'HIGH', lowFreq: 10000, highFreq: 20000, threshold: -23, ratio: 1.8, gain: 0, active: true },
        ],
      },
    },
  },
  epic: {
    name: 'Epic',
    settings: {
      compressor: {
        threshold: -14,
        ratio: 5,
        attack: 4,
        release: 70,
        gain: 2.5,
      },
      limiter: { enabled: true, threshold: -0.3 },
      stereoWidth: { enabled: true, width: 130 },
      multibandCompressor: {
        enabled: true,
        bands: [
          { name: 'LOW', lowFreq: 20, highFreq: 150, threshold: -16, ratio: 4.5, gain: 2, active: true },
          { name: 'LOW-MID', lowFreq: 150, highFreq: 800, threshold: -15, ratio: 4.5, gain: 1.5, active: true },
          { name: 'MID', lowFreq: 800, highFreq: 3000, threshold: -16, ratio: 4, gain: 1, active: true },
          { name: 'HIGH-MID', lowFreq: 3000, highFreq: 10000, threshold: -15, ratio: 4, gain: 1.5, active: true },
          { name: 'HIGH', lowFreq: 10000, highFreq: 20000, threshold: -13, ratio: 3.5, gain: 2, active: true },
        ],
      },
    },
  },
  modern: {
    name: 'Modern',
    settings: {
      compressor: {
        threshold: -17,
        ratio: 3.5,
        attack: 4,
        release: 85,
        gain: 1.5,
      },
      limiter: { enabled: true, threshold: -0.3 },
      stereoWidth: { enabled: true, width: 110 },
      multibandCompressor: {
        enabled: true,
        bands: [
          { name: 'LOW', lowFreq: 20, highFreq: 150, threshold: -19, ratio: 3.5, gain: 1, active: true },
          { name: 'LOW-MID', lowFreq: 150, highFreq: 800, threshold: -18, ratio: 3.8, gain: 0.5, active: true },
          { name: 'MID', lowFreq: 800, highFreq: 3000, threshold: -17, ratio: 3.5, gain: 0.5, active: true },
          { name: 'HIGH-MID', lowFreq: 3000, highFreq: 10000, threshold: -18, ratio: 3.2, gain: 0.5, active: true },
          { name: 'HIGH', lowFreq: 10000, highFreq: 20000, threshold: -16, ratio: 3, gain: 1, active: true },
        ],
      },
    },
  },
  rock: {
    name: 'Rock',
    settings: {
      compressor: {
        threshold: -13,
        ratio: 5.5,
        attack: 2.5,
        release: 55,
        gain: 2,
      },
      limiter: { enabled: true, threshold: -0.3 },
      stereoWidth: { enabled: true, width: 115 },
      multibandCompressor: {
        enabled: true,
        bands: [
          { name: 'LOW', lowFreq: 20, highFreq: 150, threshold: -15, ratio: 5, gain: 1.5, active: true },
          { name: 'LOW-MID', lowFreq: 150, highFreq: 800, threshold: -13, ratio: 5.5, gain: 2, active: true },
          { name: 'MID', lowFreq: 800, highFreq: 3000, threshold: -14, ratio: 5, gain: 1.5, active: true },
          { name: 'HIGH-MID', lowFreq: 3000, highFreq: 10000, threshold: -15, ratio: 4.5, gain: 1, active: true },
          { name: 'HIGH', lowFreq: 10000, highFreq: 20000, threshold: -13, ratio: 4, gain: 1, active: true },
        ],
      },
    },
  },
  electronic: {
    name: 'Electronic',
    settings: {
      compressor: {
        threshold: -11,
        ratio: 7,
        attack: 1.5,
        release: 45,
        gain: 3,
      },
      limiter: { enabled: true, threshold: -0.3 },
      stereoWidth: { enabled: true, width: 120 },
      multibandCompressor: {
        enabled: true,
        bands: [
          { name: 'LOW', lowFreq: 20, highFreq: 150, threshold: -13, ratio: 6.5, gain: 2, active: true },
          { name: 'LOW-MID', lowFreq: 150, highFreq: 800, threshold: -11, ratio: 7, gain: 2.5, active: true },
          { name: 'MID', lowFreq: 800, highFreq: 3000, threshold: -12, ratio: 6.5, gain: 2, active: true },
          { name: 'HIGH-MID', lowFreq: 3000, highFreq: 10000, threshold: -11, ratio: 6, gain: 2, active: true },
          { name: 'HIGH', lowFreq: 10000, highFreq: 20000, threshold: -9, ratio: 5.5, gain: 2.5, active: true },
        ],
      },
    },
  },
  acoustic: {
    name: 'Acoustic',
    settings: {
      compressor: {
        threshold: -21,
        ratio: 2.2,
        attack: 9,
        release: 115,
      },
      limiter: { enabled: true, threshold: -0.3 },
      stereoWidth: { enabled: true, width: 105 },
      multibandCompressor: {
        enabled: true,
        bands: [
          { name: 'LOW', lowFreq: 20, highFreq: 150, threshold: -23, ratio: 2, gain: 0.5, active: true },
          { name: 'LOW-MID', lowFreq: 150, highFreq: 800, threshold: -21, ratio: 2.2, gain: 0, active: true },
          { name: 'MID', lowFreq: 800, highFreq: 3000, threshold: -20, ratio: 2.2, gain: 0.5, active: true },
          { name: 'HIGH-MID', lowFreq: 3000, highFreq: 10000, threshold: -21, ratio: 2, gain: 0, active: true },
          { name: 'HIGH', lowFreq: 10000, highFreq: 20000, threshold: -19, ratio: 2, gain: 0.5, active: true },
        ],
      },
    },
  },
  cinematic: {
    name: 'Cinematic',
    settings: {
      compressor: {
        threshold: -16,
        ratio: 4,
        attack: 5,
        release: 80,
        gain: 2,
      },
      limiter: { enabled: true, threshold: -0.3 },
      stereoWidth: { enabled: true, width: 130 },
      multibandCompressor: {
        enabled: true,
        bands: [
          { name: 'LOW', lowFreq: 20, highFreq: 150, threshold: -18, ratio: 3.5, gain: 2, active: true },
          { name: 'LOW-MID', lowFreq: 150, highFreq: 800, threshold: -17, ratio: 4, gain: 1.5, active: true },
          { name: 'MID', lowFreq: 800, highFreq: 3000, threshold: -16, ratio: 3.8, gain: 1, active: true },
          { name: 'HIGH-MID', lowFreq: 3000, highFreq: 10000, threshold: -17, ratio: 3.5, gain: 1.5, active: true },
          { name: 'HIGH', lowFreq: 10000, highFreq: 20000, threshold: -15, ratio: 3.2, gain: 2, active: true },
        ],
      },
    },
  },
};

// Wave shaping curves for saturation
export function createSaturationCurve(drive: number, bias: number): Float32Array {
  const curve = new Float32Array(65536);
  const driveValue = drive / 100;
  const biasValue = bias / 100;

  for (let i = 0; i < 65536; i++) {
    const x = (i - 32768) / 32768;
    // Soft saturation using tanh
    const saturated = Math.tanh(x * (1 + driveValue * 2)) + biasValue * 0.1;
    curve[i] = Math.max(-1, Math.min(1, saturated));
  }

  return curve;
}

// Convert dB to linear gain
export function dbToGain(db: number): number {
  return Math.pow(10, db / 20);
}

// Convert linear gain to dB
export function gainToDb(gain: number): number {
  return 20 * Math.log10(Math.max(0.0001, gain));
}

// Calculate compressor gain reduction (for visualization)
export function calculateCompressorGainReduction(
  inputLevel: number,
  threshold: number,
  ratio: number
): number {
  if (inputLevel <= threshold) {
    return 0;
  }

  const overThreshold = inputLevel - threshold;
  const gainReduction = overThreshold - (overThreshold / ratio);
  return gainReduction;
}

// Stereo width calculation
export function calculateStereoWidth(width: number): { midGain: number; sideGain: number } {
  const widthValue = width / 100;
  const midGain = 1;
  const sideGain = widthValue;
  return { midGain, sideGain };
}

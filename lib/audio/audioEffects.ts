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
  };
}

export const effectPresets: Record<string, EffectPreset> = {
  default: {
    name: 'Default',
    settings: {},
  },
  mastering: {
    name: 'Mastering',
    settings: {
      compressor: {
        threshold: -18,
        ratio: 3,
        attack: 5,
        release: 80,
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
      },
    },
  },
  warm: {
    name: 'Warm',
    settings: {
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
      },
    },
  },
  vintage: {
    name: 'Vintage',
    settings: {},
  },
  punchy: {
    name: 'Punchy',
    settings: {
      compressor: {
        threshold: -15,
        ratio: 4.5,
        attack: 2,
        release: 60,
        gain: 2,
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
        gain: 3,
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

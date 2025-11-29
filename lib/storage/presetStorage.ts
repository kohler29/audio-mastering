export interface Preset {
  id: string;
  name: string;
  timestamp: number;
  settings: {
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
  };
}

const STORAGE_KEY = 'master-pro-presets';

/**
 * Save preset to localStorage
 */
export function savePreset(preset: Omit<Preset, 'id' | 'timestamp'>): Preset {
  const presets = loadAllPresets();
  
  const newPreset: Preset = {
    ...preset,
    id: `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
  };

  presets.push(newPreset);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    return newPreset;
  } catch (error) {
    console.error('Failed to save preset:', error);
    throw new Error('Failed to save preset. LocalStorage may be full.');
  }
}

/**
 * Load preset by ID
 */
export function loadPreset(id: string): Preset | null {
  const presets = loadAllPresets();
  return presets.find(p => p.id === id) || null;
}

/**
 * Load all presets from localStorage
 */
export function loadAllPresets(): Preset[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    return JSON.parse(data) as Preset[];
  } catch (error) {
    console.error('Failed to load presets:', error);
    return [];
  }
}

/**
 * Delete preset by ID
 */
export function deletePreset(id: string): boolean {
  const presets = loadAllPresets();
  const filtered = presets.filter(p => p.id !== id);
  
  if (filtered.length === presets.length) {
    return false; // Preset not found
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Failed to delete preset:', error);
    throw new Error('Failed to delete preset.');
  }
}

/**
 * Update existing preset
 */
export function updatePreset(id: string, updates: Partial<Preset>): Preset | null {
  const presets = loadAllPresets();
  const index = presets.findIndex(p => p.id === id);
  
  if (index === -1) {
    return null;
  }

  const updated: Preset = {
    ...presets[index],
    ...updates,
    id, // Ensure ID doesn't change
    timestamp: Date.now(), // Update timestamp
  };

  presets[index] = updated;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    return updated;
  } catch (error) {
    console.error('Failed to update preset:', error);
    throw new Error('Failed to update preset.');
  }
}

/**
 * Clear all presets
 */
export function clearAllPresets(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear presets:', error);
    throw new Error('Failed to clear presets.');
  }
}

/**
 * Get preset count
 */
export function getPresetCount(): number {
  return loadAllPresets().length;
}

/**
 * Check if preset name already exists
 */
export function presetNameExists(name: string, excludeId?: string): boolean {
  const presets = loadAllPresets();
  return presets.some(p => p.name === name && p.id !== excludeId);
}


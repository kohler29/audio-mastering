/**
 * Parameter Manager - Terpisah dari React UI
 * Menggunakan debounce/throttle untuk optimasi update
 */
import type { AudioEngineSettings } from '@/lib/audio/audioEngine';

export type ParameterUpdate = Partial<AudioEngineSettings>;

type UpdateCallback = (settings: ParameterUpdate) => void;

export class ParameterManager {
  private updateCallback: UpdateCallback;
  private pendingUpdates: ParameterUpdate = {};
  private updateTimer: number | null = null;
  private readonly debounceMs = 16; // ~60fps untuk smooth updates
  private readonly throttleMs = 8; // Untuk critical parameters

  constructor(updateCallback: UpdateCallback) {
    this.updateCallback = updateCallback;
  }

  /**
   * Update parameter dengan debounce (untuk non-critical updates)
   */
  updateParameter<K extends keyof ParameterUpdate>(key: K, value: ParameterUpdate[K]): void {
    this.pendingUpdates[key] = value as ParameterUpdate[K];

    if (this.updateTimer !== null) {
      clearTimeout(this.updateTimer);
    }

    this.updateTimer = window.setTimeout(() => {
      this.flushUpdates();
    }, this.debounceMs);
  }

  /**
   * Update parameter secara immediate (untuk critical parameters seperti gain)
   */
  updateParameterImmediate<K extends keyof ParameterUpdate>(key: K, value: ParameterUpdate[K]): void {
    this.pendingUpdates[key] = value as ParameterUpdate[K];
    this.flushUpdates();
  }

  /**
   * Batch update multiple parameters
   */
  updateParameters(updates: ParameterUpdate): void {
    Object.assign(this.pendingUpdates, updates);

    if (this.updateTimer !== null) {
      clearTimeout(this.updateTimer);
    }

    this.updateTimer = window.setTimeout(() => {
      this.flushUpdates();
    }, this.debounceMs);
  }

  /**
   * Flush pending updates ke audio engine
   */
  private flushUpdates(): void {
    if (Object.keys(this.pendingUpdates).length === 0) {
      return;
    }

    const updates = { ...this.pendingUpdates };
    this.pendingUpdates = {};
    this.updateTimer = null;

    this.updateCallback(updates);
  }

  /**
   * Cancel pending updates
   */
  cancelPendingUpdates(): void {
    if (this.updateTimer !== null) {
      clearTimeout(this.updateTimer);
      this.updateTimer = null;
    }
    this.pendingUpdates = {};
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.cancelPendingUpdates();
    this.updateCallback = () => {};
  }
}

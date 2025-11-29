"use client";

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: string, quality: string) => Promise<void>;
}

export function ExportModal({ isOpen, onClose, onExport }: ExportModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>('wav');

  if (!isOpen) return null;

  const handleExport = async (format: string, quality: string) => {
    setIsExporting(true);
    try {
      await onExport(format, quality);
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export audio. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-zinc-800 rounded-xl p-6 w-full max-w-md border border-zinc-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-zinc-100">Export Audio</h2>
          <button 
            onClick={onClose}
            disabled={isExporting}
            className="text-zinc-400 hover:text-zinc-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isExporting ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-4" />
            <p className="text-zinc-300">Processing audio...</p>
            <p className="text-zinc-500 text-sm mt-2">This may take a moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Format Selection */}
            <div>
              <label className="text-zinc-400 text-sm block mb-2">Format</label>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => setSelectedFormat('wav')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedFormat === 'wav'
                      ? 'bg-cyan-600 text-white'
                      : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100'
                  }`}
                >
                  WAV
                </button>
                <button 
                  onClick={() => setSelectedFormat('mp3')}
                  disabled
                  className="px-4 py-2 rounded-lg bg-zinc-700 text-zinc-500 cursor-not-allowed opacity-50"
                  title="MP3 export coming soon"
                >
                  MP3
                </button>
                <button 
                  onClick={() => setSelectedFormat('flac')}
                  disabled
                  className="px-4 py-2 rounded-lg bg-zinc-700 text-zinc-500 cursor-not-allowed opacity-50"
                  title="FLAC export coming soon"
                >
                  FLAC
                </button>
              </div>
            </div>

            {/* Quality Selection */}
            <div>
              <label className="text-zinc-400 text-sm block mb-2">Quality</label>
              <div className="space-y-2">
                <button 
                  onClick={() => {
                    handleExport(selectedFormat, '16bit');
                  }}
                  className="w-full bg-zinc-700 hover:bg-cyan-600 text-zinc-100 px-4 py-2 rounded-lg transition-colors text-left"
                >
                  16-bit / 44.1kHz (CD Quality)
                </button>
                <button 
                  onClick={() => {
                    handleExport(selectedFormat, '24bit');
                  }}
                  className="w-full bg-zinc-700 hover:bg-cyan-600 text-zinc-100 px-4 py-2 rounded-lg transition-colors text-left"
                >
                  24-bit / 48kHz (Studio Quality)
                </button>
                <button 
                  onClick={() => {
                    handleExport(selectedFormat, '32bit');
                  }}
                  className="w-full bg-zinc-700 hover:bg-cyan-600 text-zinc-100 px-4 py-2 rounded-lg transition-colors text-left"
                >
                  32-bit / 96kHz (High-Res)
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-700">
              <p className="text-zinc-500 text-xs">
                * Audio akan diproses dengan semua efek yang telah Anda atur dan diekspor sebagai file audio.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

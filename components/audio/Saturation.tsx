"use client";

import { Knob } from './Knob';

interface SaturationProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  drive: number;
  setDrive: (value: number) => void;
  mix: number;
  setMix: (value: number) => void;
  bias: number;
  setBias: (value: number) => void;
  mode: 'tube' | 'tape' | 'soft';
  setMode: (mode: 'tube' | 'tape' | 'soft') => void;
}

export function Saturation({ enabled, onToggle, drive, setDrive, mix, setMix, bias, setBias, mode, setMode }: SaturationProps) {
  return (
    <div className={`bg-zinc-800/50 rounded-xl p-4 border ${enabled ? 'border-zinc-700' : 'border-zinc-800 opacity-60'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-zinc-400 text-xs tracking-wider">SATURATION</h3>
        <button
          onClick={() => onToggle(!enabled)}
          className={`px-3 py-1 rounded text-xs transition-all ${
            enabled 
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' 
              : 'bg-zinc-700 text-zinc-400'
          }`}
        >
          {enabled ? 'ON' : 'OFF'}
        </button>
      </div>
      <div className={`grid grid-cols-3 gap-3 ${!enabled ? 'pointer-events-none opacity-50' : ''}`}>
        <Knob 
          value={drive} 
          onChange={setDrive}
          min={0}
          max={100}
          label="DRIVE"
          unit="%"
          size="small"
        />
        <Knob 
          value={mix} 
          onChange={setMix}
          min={0}
          max={100}
          label="MIX"
          unit="%"
          size="small"
        />
        <Knob 
          value={bias} 
          onChange={setBias}
          min={-100}
          max={100}
          label="BIAS"
          unit=""
          size="small"
        />
      </div>
      <div className="mt-3 pt-3 border-t border-zinc-700">
        <div className="grid grid-cols-3 gap-2">
          <button 
            onClick={() => setMode('tube')}
            className={`text-xs py-1.5 rounded transition-colors ${
              mode === 'tube'
                ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
            } ${!enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!enabled}
          >
            Tube
          </button>
          <button 
            onClick={() => setMode('tape')}
            className={`text-xs py-1.5 rounded transition-colors ${
              mode === 'tape'
                ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
            } ${!enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!enabled}
          >
            Tape
          </button>
          <button 
            onClick={() => setMode('soft')}
            className={`text-xs py-1.5 rounded transition-colors ${
              mode === 'soft'
                ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
            } ${!enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!enabled}
          >
            Soft
          </button>
        </div>
      </div>
    </div>
  );
}


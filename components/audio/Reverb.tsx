"use client";

import { Knob } from './Knob';

interface ReverbProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  mix: number;
  setMix: (value: number) => void;
  size: number;
  setSize: (value: number) => void;
  decay: number;
  setDecay: (value: number) => void;
  damping: number;
  setDamping: (value: number) => void;
}

export function Reverb({ enabled, onToggle, mix, setMix, size, setSize, decay, setDecay, damping, setDamping }: ReverbProps) {
  return (
    <div className={`bg-zinc-800/50 rounded-xl p-4 border ${enabled ? 'border-zinc-700' : 'border-zinc-800 opacity-60'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-zinc-400 text-xs tracking-wider">REVERB</h3>
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
      <div className={`grid grid-cols-2 gap-4 ${!enabled ? 'pointer-events-none opacity-50' : ''}`}>
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
          value={size} 
          onChange={setSize}
          min={0}
          max={100}
          label="SIZE"
          unit="%"
          size="small"
        />
        <Knob 
          value={decay} 
          onChange={setDecay}
          min={0.1}
          max={10}
          label="DECAY"
          unit="s"
          size="small"
        />
        <Knob 
          value={damping} 
          onChange={setDamping}
          min={0}
          max={100}
          label="DAMPING"
          unit="%"
          size="small"
        />
      </div>
      <div className="mt-3 pt-3 border-t border-zinc-700">
        <div className="grid grid-cols-3 gap-2">
          <button className="bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs py-1.5 rounded transition-colors">
            Hall
          </button>
          <button className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs py-1.5 rounded transition-colors">
            Room
          </button>
          <button className="bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs py-1.5 rounded transition-colors">
            Plate
          </button>
        </div>
      </div>
    </div>
  );
}


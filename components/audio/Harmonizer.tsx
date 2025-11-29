"use client";

import { Knob } from './Knob';

interface HarmonizerProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  mix: number;
  setMix: (value: number) => void;
  depth: number;
  setDepth: (value: number) => void;
  tone: number;
  setTone: (value: number) => void;
}

export function Harmonizer({ enabled, onToggle, mix, setMix, depth, setDepth, tone, setTone }: HarmonizerProps) {
  return (
    <div className={`bg-zinc-800/50 rounded-xl p-4 border ${enabled ? 'border-zinc-700' : 'border-zinc-800 opacity-60'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-zinc-400 text-xs tracking-wider">HARMONIZER</h3>
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
          value={mix} 
          onChange={setMix}
          min={0}
          max={100}
          label="MIX"
          unit="%"
          size="small"
        />
        <Knob 
          value={depth} 
          onChange={setDepth}
          min={0}
          max={100}
          label="DEPTH"
          unit="%"
          size="small"
        />
        <Knob 
          value={tone} 
          onChange={setTone}
          min={-100}
          max={100}
          label="TONE"
          unit=""
          size="small"
        />
      </div>
      <div className="mt-3 pt-3 border-t border-zinc-700">
        <div className="flex gap-2">
          <button className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs py-1.5 rounded transition-colors">
            2nd
          </button>
          <button className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs py-1.5 rounded transition-colors">
            3rd
          </button>
          <button className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs py-1.5 rounded transition-colors">
            5th
          </button>
        </div>
      </div>
    </div>
  );
}


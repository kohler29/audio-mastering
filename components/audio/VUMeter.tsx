"use client";

import { useEffect, useRef, useState } from 'react';

interface VUMeterProps {
  label: string;
  value: number; // dB value from audio engine
}

export function VUMeter({ label, value }: VUMeterProps) {
  const currentValueRef = useRef(value);
  const peakValueRef = useRef(value);
  const [currentValue, setCurrentValue] = useState(value);
  const [peakValue, setPeakValue] = useState(value);
  const peakTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    // Update refs immediately for real-time response
    currentValueRef.current = value;
    
    // Jangan panggil setState langsung di effect; update peak di animasi

    // Use requestAnimationFrame for smooth, real-time updates
    const animate = () => {
      // Smooth current value dengan fast attack, slow release (VU meter behavior)
      const targetValue = currentValueRef.current;
      const current = currentValueRef.current;
      
      let newValue: number;
      if (targetValue > current) {
        // Fast attack (0.8 = 80% towards target per frame)
        newValue = current + (targetValue - current) * 0.8;
      } else {
        // Slow release (0.1 = 10% towards target per frame)
        newValue = current + (targetValue - current) * 0.1;
      }
      
      currentValueRef.current = newValue;
      setCurrentValue(newValue);

      // Peak update dilakukan di sini agar tidak setState di effect
      if (newValue > peakValueRef.current) {
        peakValueRef.current = newValue;
        setPeakValue(newValue);

        if (peakTimeoutRef.current) {
          clearTimeout(peakTimeoutRef.current);
        }
        peakTimeoutRef.current = setTimeout(() => {
          peakValueRef.current = currentValueRef.current;
          setPeakValue(currentValueRef.current);
        }, 1500);
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (peakTimeoutRef.current) {
        clearTimeout(peakTimeoutRef.current);
      }
    };
  }, [value]);

  const segments = 20;
  const percentage = ((currentValue + 60) / 60) * 100;
  const peakPercentage = ((peakValue + 60) / 60) * 100;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-zinc-400 text-xs">{label}</div>
      <div className="relative h-full w-8 bg-zinc-900/50 rounded-full border border-zinc-700 overflow-hidden">
        {/* Segments */}
        <div className="absolute inset-0 flex flex-col-reverse gap-0.5 p-1">
          {Array.from({ length: segments }).map((_, i) => {
            const segmentPercentage = ((i + 1) / segments) * 100;
            const isActive = segmentPercentage <= percentage;
            
            let color = 'bg-emerald-500';
            if (segmentPercentage > 75) {
              color = 'bg-red-500';
            } else if (segmentPercentage > 60) {
              color = 'bg-yellow-500';
            }

            return (
              <div
                key={i}
                className={`h-full rounded-sm transition-all duration-75 ${
                  isActive ? `${color} shadow-lg` : 'bg-zinc-800'
                }`}
                style={{
                  boxShadow: isActive ? '0 0 8px currentColor' : 'none',
                }}
              />
            );
          })}
        </div>

        {/* Peak indicator */}
        <div
          className="absolute left-0 right-0 h-0.5 bg-white transition-all duration-100"
          style={{
            bottom: `${peakPercentage}%`,
            boxShadow: '0 0 8px white',
          }}
        />
      </div>
      <div className="text-cyan-400 text-xs tabular-nums">
        {currentValue.toFixed(1)}
      </div>
    </div>
  );
}

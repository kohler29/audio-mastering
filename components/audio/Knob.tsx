"use client";

import { useState, useRef, useEffect } from 'react';

interface KnobProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  label: string;
  unit?: string;
  size?: 'small' | 'medium' | 'large';
}

export function Knob({ value, onChange, min, max, label, unit = '', size = 'medium' }: KnobProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const startValueRef = useRef(0);

  const sizeClasses = {
    small: { container: 'w-16 h-16', value: 'text-xs' },
    medium: { container: 'w-20 h-20', value: 'text-sm' },
    large: { container: 'w-24 h-24', value: 'text-base' }
  };

  const normalizedValue = ((value - min) / (max - min)) * 270 - 135;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startYRef.current = e.clientY;
    startValueRef.current = value;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaY = startYRef.current - e.clientY;
      const range = max - min;
      const sensitivity = range / 200;
      const newValue = Math.max(min, Math.min(max, startValueRef.current + deltaY * sensitivity));
      onChange(Number(newValue.toFixed(1)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, min, max, onChange]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        className={`relative ${sizeClasses[size].container} cursor-ns-resize select-none`}
        onMouseDown={handleMouseDown}
      >
        {/* Knob body */}
        <div className="absolute inset-0 rounded-full bg-linear-to-br from-zinc-700 to-zinc-800 shadow-lg border-2 border-zinc-600">
          {/* Inner circle */}
          <div className="absolute inset-2 rounded-full bg-linear-to-br from-zinc-800 to-zinc-900 shadow-inner" />
          
          {/* Indicator line */}
          <div 
            className="absolute inset-0 flex items-start justify-center"
            style={{ transform: `rotate(${normalizedValue}deg)` }}
          >
            <div className="w-0.5 h-1/3 bg-cyan-500 rounded-full shadow-lg shadow-cyan-500/50 mt-1" />
          </div>

          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-zinc-600" />
          </div>
        </div>

        {/* Value arc background */}
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(34, 34, 34, 0.5)"
            strokeWidth="2"
            strokeDasharray="212 360"
            strokeLinecap="round"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgb(6, 182, 212)"
            strokeWidth="2"
            strokeDasharray={`${((value - min) / (max - min)) * 212} 360`}
            strokeLinecap="round"
            className="transition-all duration-100"
          />
        </svg>
      </div>

      {/* Value display */}
      <div className="text-center">
        <div className={`text-cyan-400 ${sizeClasses[size].value}`}>
          {value}{unit}
        </div>
        <div className="text-zinc-500 text-xs mt-0.5">{label}</div>
      </div>
    </div>
  );
}


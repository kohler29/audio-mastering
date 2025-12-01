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
  defaultValue?: number; // Default value untuk double-click reset
}

export function Knob({ value, onChange, min, max, label, unit = '', size = 'medium', defaultValue }: KnobProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const startYRef = useRef(0);
  const startValueRef = useRef(0);
  const knobRef = useRef<HTMLDivElement>(null);
  const hasMovedRef = useRef(false); // Track if mouse has moved after mousedown

  const sizeClasses = {
    small: { container: 'w-16 h-16', value: 'text-xs' },
    medium: { container: 'w-20 h-20', value: 'text-sm' },
    large: { container: 'w-24 h-24', value: 'text-base' }
  };

  const normalizedValue = ((value - min) / (max - min)) * 270 - 135;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMouseDown(true);
    hasMovedRef.current = false;
    startYRef.current = e.clientY;
    startValueRef.current = value;
    // Don't set isDragging immediately - wait for actual mouse movement
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startYRef.current = e.touches[0].clientY;
    startValueRef.current = value;
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Reset to default value if provided, otherwise use midpoint
    const resetValue = defaultValue !== undefined ? defaultValue : (min + max) / 2;
    onChange(Number(resetValue.toFixed(1)));
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Only start dragging if mouse is down and has actually moved
      if (!isDragging && isMouseDown && !hasMovedRef.current) {
        const moveDistance = Math.abs(e.clientY - startYRef.current);
        if (moveDistance > 3) { // Threshold untuk detect actual drag (3px)
          setIsDragging(true);
          hasMovedRef.current = true;
        } else {
          return; // Don't drag if just a click (no movement)
        }
      }

      if (!isDragging) return;

      const deltaY = startYRef.current - e.clientY;
      const range = max - min;
      const sensitivity = range / 200;
      const newValue = Math.max(min, Math.min(max, startValueRef.current + deltaY * sensitivity));
      onChange(Number(newValue.toFixed(1)));
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;

      const deltaY = startYRef.current - e.touches[0].clientY;
      const range = max - min;
      const sensitivity = range / 200;
      const newValue = Math.max(min, Math.min(max, startValueRef.current + deltaY * sensitivity));
      onChange(Number(newValue.toFixed(1)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsMouseDown(false);
      hasMovedRef.current = false;
      startYRef.current = 0; // Reset
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    // Listen for mousemove to detect drag start (only when mouse is down on knob)
    if (isMouseDown || isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, isMouseDown, min, max, onChange, value]);

  // Add wheel event listener dengan passive: false untuk prevent default scroll
  useEffect(() => {
    const knobElement = knobRef.current;
    if (!knobElement) return;

    const handleWheelNative = (e: WheelEvent) => {
      // Prevent page scroll - sangat penting!
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      const range = max - min;
      const sensitivity = range / 100;
      const delta = e.deltaY > 0 ? -sensitivity : sensitivity;
      const newValue = Math.max(min, Math.min(max, value + delta));
      onChange(Number(newValue.toFixed(1)));
      
      return false;
    };

    // Use capture phase untuk catch event lebih awal dan prevent scroll
    knobElement.addEventListener('wheel', handleWheelNative, { 
      passive: false,
      capture: true 
    });

    return () => {
      knobElement.removeEventListener('wheel', handleWheelNative, { capture: true });
    };
  }, [min, max, value, onChange]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        ref={knobRef}
        className={`relative ${sizeClasses[size].container} cursor-ns-resize select-none touch-none`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onDoubleClick={handleDoubleClick}
        title={defaultValue !== undefined ? `Double-click to reset to ${defaultValue.toFixed(1)}${unit}` : 'Double-click to reset'}
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
          {Number(value).toFixed(1)}{unit ? ` ${unit}` : ''}
        </div>
        <div className="text-zinc-500 text-xs mt-0.5">{label}</div>
      </div>
    </div>
  );
}

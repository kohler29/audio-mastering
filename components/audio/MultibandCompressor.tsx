"use client";

import { useEffect, useRef, useState } from 'react';

interface Band {
  name: string;
  color: string;
  lowFreq: number;
  highFreq: number;
  threshold: number;
  ratio: number;
  gain: number;
  active: boolean;
}

interface DragState {
  isDragging: boolean;
  type: 'threshold' | 'crossover' | null;
  bandIndex: number;
}

interface MultibandCompressorProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  bands: Band[];
  onBandsChange: (bands: Band[]) => void;
}

export function MultibandCompressor({ enabled, onToggle, bands, onBandsChange }: MultibandCompressorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const gainReductionRef = useRef<number[]>([0, 0, 0, 0, 0]);
  const dragStateRef = useRef<DragState>({ isDragging: false, type: null, bandIndex: -1 });
  const [selectedBand, setSelectedBand] = useState(0);
  const [hoveredElement, setHoveredElement] = useState<{ type: 'threshold' | 'crossover' | 'band' | null; index: number }>({ type: null, index: -1 });

  const toggleBand = (index: number) => {
    const newBands = [...bands];
    newBands[index].active = !newBands[index].active;
    onBandsChange(newBands);
  };

  const updateThreshold = (index: number, value: number) => {
    const newBands = [...bands];
    newBands[index].threshold = Math.max(-60, Math.min(0, value));
    onBandsChange(newBands);
  };

  const updateRatio = (index: number, value: number) => {
    const newBands = [...bands];
    newBands[index].ratio = value;
    onBandsChange(newBands);
  };

  const updateGain = (index: number, value: number) => {
    const newBands = [...bands];
    newBands[index].gain = value;
    onBandsChange(newBands);
  };

  const updateHighFreq = (index: number, value: number) => {
    const newBands = [...bands];
    newBands[index].highFreq = value;
    // Update the next band's low frequency to match
    if (index < newBands.length - 1) {
      newBands[index + 1].lowFreq = value;
    }
    onBandsChange(newBands);
  };

  const formatFrequency = (freq: number) => {
    if (freq >= 1000) {
      return `${(freq / 1000).toFixed(1)}k`;
    }
    return `${Math.round(freq)}`;
  };

  // Convert frequency to logarithmic position (20Hz to 20kHz)
  const freqToPosition = (freq: number, width: number) => {
    const minFreq = Math.log10(20);
    const maxFreq = Math.log10(20000);
    const logFreq = Math.log10(Math.max(20, Math.min(20000, freq)));
    return ((logFreq - minFreq) / (maxFreq - minFreq)) * width;
  };

  // Convert position to frequency
  const positionToFreq = (x: number, width: number) => {
    const minFreq = Math.log10(20);
    const maxFreq = Math.log10(20000);
    const logFreq = minFreq + (x / width) * (maxFreq - minFreq);
    return Math.pow(10, logFreq);
  };

  // Convert Y position to dB value
  const positionToDb = (y: number, height: number) => {
    const normalized = 1 - (y / height);
    return normalized * 60 - 60;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const width = rect.width;
    const height = rect.height;

    // Check if clicking on a crossover point
    for (let i = 1; i < bands.length; i++) {
      const crossoverX = freqToPosition(bands[i].lowFreq, width);
      if (Math.abs(x - crossoverX) < 10) {
        dragStateRef.current = { isDragging: true, type: 'crossover', bandIndex: i - 1 };
        return;
      }
    }

    // Check if clicking on a threshold line
    for (let i = 0; i < bands.length; i++) {
      const x1 = freqToPosition(bands[i].lowFreq, width);
      const x2 = freqToPosition(bands[i].highFreq, width);
      const normalizedThreshold = Math.max(0, Math.min(1, (bands[i].threshold + 60) / 60));
      const thresholdY = height * (1 - normalizedThreshold);

      if (x >= x1 && x <= x2 && Math.abs(y - thresholdY) < 15) {
        dragStateRef.current = { isDragging: true, type: 'threshold', bandIndex: i };
        setSelectedBand(i);
        return;
      }
    }

    // Check if clicking in a band area
    for (let i = 0; i < bands.length; i++) {
      const x1 = freqToPosition(bands[i].lowFreq, width);
      const x2 = freqToPosition(bands[i].highFreq, width);
      if (x >= x1 && x <= x2) {
        setSelectedBand(i);
        return;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const width = rect.width;
    const height = rect.height;

    if (dragStateRef.current.isDragging) {
      if (dragStateRef.current.type === 'threshold') {
        const db = positionToDb(y, height);
        updateThreshold(dragStateRef.current.bandIndex, db);
      } else if (dragStateRef.current.type === 'crossover') {
        const freq = positionToFreq(x, width);
        const index = dragStateRef.current.bandIndex;
        
        // Constrain frequency between adjacent bands
        const minFreq = index === 0 ? 30 : bands[index].lowFreq + 20;
        const maxFreq = index === bands.length - 2 ? 18000 : bands[index + 1].highFreq - 20;
        const constrainedFreq = Math.max(minFreq, Math.min(maxFreq, freq));
        
        updateHighFreq(index, Math.round(constrainedFreq));
      }
      return;
    }

    // Update hover state
    let newHover: { type: 'threshold' | 'crossover' | 'band' | null; index: number } = { type: null, index: -1 };

    // Check crossover hover
    for (let i = 1; i < bands.length; i++) {
      const crossoverX = freqToPosition(bands[i].lowFreq, width);
      if (Math.abs(x - crossoverX) < 10) {
        newHover = { type: 'crossover', index: i - 1 };
        canvas.style.cursor = 'ew-resize';
        setHoveredElement(newHover);
        return;
      }
    }

    // Check threshold hover
    for (let i = 0; i < bands.length; i++) {
      const x1 = freqToPosition(bands[i].lowFreq, width);
      const x2 = freqToPosition(bands[i].highFreq, width);
      const normalizedThreshold = Math.max(0, Math.min(1, (bands[i].threshold + 60) / 60));
      const thresholdY = height * (1 - normalizedThreshold);

      if (x >= x1 && x <= x2 && Math.abs(y - thresholdY) < 15) {
        newHover = { type: 'threshold', index: i };
        canvas.style.cursor = 'ns-resize';
        setHoveredElement(newHover);
        return;
      }
    }

    // Check band hover
    for (let i = 0; i < bands.length; i++) {
      const x1 = freqToPosition(bands[i].lowFreq, width);
      const x2 = freqToPosition(bands[i].highFreq, width);
      if (x >= x1 && x <= x2) {
        newHover = { type: 'band', index: i };
        canvas.style.cursor = 'pointer';
        setHoveredElement(newHover);
        return;
      }
    }

    canvas.style.cursor = 'default';
    setHoveredElement({ type: null, index: -1 });
  };

  const handleMouseUp = () => {
    dragStateRef.current = { isDragging: false, type: null, bandIndex: -1 };
  };

  const handleMouseLeave = () => {
    dragStateRef.current = { isDragging: false, type: null, bandIndex: -1 };
    setHoveredElement({ type: null, index: -1 });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      // Draw background grid
      ctx.strokeStyle = 'rgba(82, 82, 91, 0.15)';
      ctx.lineWidth = 1;

      // Horizontal grid lines (dB levels)
      for (let i = 0; i <= 6; i++) {
        const y = (height / 6) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        // dB labels
        if (i <= 4) {
          const db = -i * 15;
          ctx.fillStyle = 'rgba(161, 161, 170, 0.4)';
          ctx.font = '10px monospace';
          ctx.fillText(`${db}dB`, 5, y + 12);
        }
      }

      // Vertical grid lines (frequency markers)
      const freqMarkers = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
      freqMarkers.forEach(freq => {
        const x = freqToPosition(freq, width);
        ctx.strokeStyle = 'rgba(82, 82, 91, 0.15)';
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      });

      // Simulate gain reduction animation
      gainReductionRef.current = gainReductionRef.current.map((val, i) => {
        const target = bands[i].active ? Math.random() * 6 : 0;
        return val * 0.85 + target * 0.15;
      });

      // Draw each band
      bands.forEach((band, index) => {
        const x1 = freqToPosition(band.lowFreq, width);
        const x2 = freqToPosition(band.highFreq, width);
        const bandWidth = x2 - x1;

        if (!band.active) {
          // Draw inactive band with minimal opacity
          ctx.fillStyle = 'rgba(82, 82, 91, 0.05)';
          ctx.fillRect(x1, 0, bandWidth, height);
          return;
        }

        // Calculate compression visualization
        const normalizedThreshold = Math.max(0, Math.min(1, (band.threshold + 60) / 60));
        const thresholdY = height * (1 - normalizedThreshold);
        const compressionHeight = height - thresholdY;

        // Band background
        const rgbMatch = band.color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        const bandColorBg = rgbMatch 
          ? `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, 0.08)`
          : 'rgba(6, 182, 212, 0.08)';
        
        ctx.fillStyle = bandColorBg;
        ctx.fillRect(x1, 0, bandWidth, height);

        // Highlight selected band
        if (index === selectedBand) {
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
          ctx.lineWidth = 2;
          ctx.strokeRect(x1 + 1, 1, bandWidth - 2, height - 2);
        }

        // Highlight hovered band
        if (hoveredElement.type === 'band' && hoveredElement.index === index) {
          ctx.fillStyle = rgbMatch 
            ? `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, 0.15)`
            : 'rgba(6, 182, 212, 0.15)';
          ctx.fillRect(x1, 0, bandWidth, height);
        }

        // Draw compression zone with gradient
        const gradient = ctx.createLinearGradient(0, thresholdY, 0, height);
        const bandColorTop = rgbMatch 
          ? `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, 0.4)`
          : 'rgba(6, 182, 212, 0.4)';
        const bandColorBottom = rgbMatch 
          ? `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, 0.15)`
          : 'rgba(6, 182, 212, 0.15)';
        
        gradient.addColorStop(0, bandColorTop);
        gradient.addColorStop(1, bandColorBottom);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x1, thresholdY, bandWidth, compressionHeight);

        // Draw threshold line with hover effect
        const isThresholdHovered = hoveredElement.type === 'threshold' && hoveredElement.index === index;
        const isThresholdDragging = dragStateRef.current.isDragging && dragStateRef.current.type === 'threshold' && dragStateRef.current.bandIndex === index;
        
        ctx.strokeStyle = band.color;
        ctx.lineWidth = isThresholdHovered || isThresholdDragging ? 3 : 2;
        ctx.setLineDash(isThresholdHovered || isThresholdDragging ? [6, 3] : [4, 4]);
        ctx.shadowColor = isThresholdHovered || isThresholdDragging ? band.color : 'transparent';
        ctx.shadowBlur = isThresholdHovered || isThresholdDragging ? 10 : 0;
        
        ctx.beginPath();
        ctx.moveTo(x1, thresholdY);
        ctx.lineTo(x2, thresholdY);
        ctx.stroke();
        
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.setLineDash([]);

        // Draw threshold handle circles on hover/drag
        if (isThresholdHovered || isThresholdDragging) {
          const handleX = x1 + bandWidth / 2;
          ctx.fillStyle = band.color;
          ctx.beginPath();
          ctx.arc(handleX, thresholdY, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Draw animated gain reduction bars
        const grHeight = (gainReductionRef.current[index] / 60) * height;
        const barCount = Math.max(8, Math.floor(bandWidth / 12));
        const barWidth = (bandWidth - 4) / barCount;
        
        for (let i = 0; i < barCount; i++) {
          const randomVariation = Math.random() * 0.3 + 0.7;
          const barH = grHeight * randomVariation;
          
          const barGradient = ctx.createLinearGradient(0, height - barH, 0, height);
          barGradient.addColorStop(0, band.color);
          const rgbMatch2 = band.color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
          if (rgbMatch2) {
            barGradient.addColorStop(1, `rgba(${rgbMatch2[1]}, ${rgbMatch2[2]}, ${rgbMatch2[3]}, 0.3)`);
          }
          
          ctx.fillStyle = barGradient;
          ctx.fillRect(
            x1 + 2 + i * barWidth,
            height - barH,
            barWidth - 1,
            barH
          );
        }

        // Draw crossover divider (except for first band)
        if (index > 0) {
          const isCrossoverHovered = hoveredElement.type === 'crossover' && hoveredElement.index === index - 1;
          const isCrossoverDragging = dragStateRef.current.isDragging && dragStateRef.current.type === 'crossover' && dragStateRef.current.bandIndex === index - 1;
          
          ctx.strokeStyle = isCrossoverHovered || isCrossoverDragging ? 'rgba(6, 182, 212, 1)' : 'rgba(200, 200, 210, 0.8)';
          ctx.lineWidth = isCrossoverHovered || isCrossoverDragging ? 3 : 2;
          ctx.shadowColor = isCrossoverHovered || isCrossoverDragging ? 'rgba(6, 182, 212, 0.8)' : 'transparent';
          ctx.shadowBlur = isCrossoverHovered || isCrossoverDragging ? 15 : 0;
          
          ctx.beginPath();
          ctx.moveTo(x1, 0);
          ctx.lineTo(x1, height);
          ctx.stroke();
          
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;

          // Draw handle on crossover when hovered/dragging
          if (isCrossoverHovered || isCrossoverDragging) {
            ctx.fillStyle = 'rgba(6, 182, 212, 0.9)';
            ctx.fillRect(x1 - 3, height / 2 - 20, 6, 40);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x1 - 3, height / 2 - 20, 6, 40);
          }

          // Crossover frequency label with background
          ctx.font = 'bold 11px monospace';
          const freqText = formatFrequency(band.lowFreq) + 'Hz';
          const textWidth = ctx.measureText(freqText).width;
          const textX = x1 - textWidth / 2;
          const textY = height - 35;
          
          // Background for text
          ctx.fillStyle = isCrossoverHovered || isCrossoverDragging ? 'rgba(6, 182, 212, 0.2)' : 'rgba(24, 24, 27, 0.95)';
          ctx.fillRect(textX - 4, textY - 12, textWidth + 8, 16);
          
          // Border
          ctx.strokeStyle = isCrossoverHovered || isCrossoverDragging ? 'rgba(6, 182, 212, 1)' : 'rgba(6, 182, 212, 0.6)';
          ctx.lineWidth = isCrossoverHovered || isCrossoverDragging ? 2 : 1;
          ctx.strokeRect(textX - 4, textY - 12, textWidth + 8, 16);
          
          // Text
          ctx.fillStyle = isCrossoverHovered || isCrossoverDragging ? 'rgb(6, 255, 255)' : 'rgb(6, 182, 212)';
          ctx.fillText(freqText, textX, textY);
        }

        // Band name and info
        const centerX = x1 + bandWidth / 2;
        
        // Band name with background
        ctx.font = 'bold 14px monospace';
        const nameWidth = ctx.measureText(band.name).width;
        
        // Name background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(centerX - nameWidth / 2 - 4, 8, nameWidth + 8, 18);
        
        // Name border
        ctx.strokeStyle = band.color;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(centerX - nameWidth / 2 - 4, 8, nameWidth + 8, 18);
        
        // Band name text
        ctx.fillStyle = band.color;
        ctx.fillText(band.name, centerX - nameWidth / 2, 20);

        // Info background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(centerX - 35, 32, 70, 45);

        // Ratio
        ctx.font = '11px monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        const ratioText = `Ratio: ${band.ratio.toFixed(1)}:1`;
        const ratioWidth = ctx.measureText(ratioText).width;
        ctx.fillText(ratioText, centerX - ratioWidth / 2, 46);

        // Gain
        const gainText = `Gain: ${band.gain > 0 ? '+' : ''}${band.gain.toFixed(1)}dB`;
        const gainWidth = ctx.measureText(gainText).width;
        ctx.fillStyle = band.gain > 0 ? 'rgb(34, 197, 94)' : band.gain < 0 ? 'rgb(239, 68, 68)' : 'rgba(255, 255, 255, 0.7)';
        ctx.fillText(gainText, centerX - gainWidth / 2, 59);

        // GR indicator
        ctx.font = '10px monospace';
        ctx.fillStyle = 'rgba(6, 182, 212, 0.9)';
        const grText = `GR: -${gainReductionRef.current[index].toFixed(1)}dB`;
        const grWidth = ctx.measureText(grText).width;
        ctx.fillText(grText, centerX - grWidth / 2, 72);
      });

      // Draw frequency scale at bottom
      ctx.font = '9px monospace';
      ctx.fillStyle = 'rgba(161, 161, 170, 0.6)';
      freqMarkers.forEach(freq => {
        const x = freqToPosition(freq, width);
        const label = freq >= 1000 ? `${freq/1000}k` : `${freq}`;
        const labelWidth = ctx.measureText(label).width;
        ctx.fillText(label, x - labelWidth / 2, height - 3);
      });

      // Draw 20Hz label at start
      ctx.fillStyle = 'rgba(161, 161, 170, 0.8)';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('20Hz', 5, height - 20);
      
      // Draw 20kHz label at end
      const endLabel = '20kHz';
      const endLabelWidth = ctx.measureText(endLabel).width;
      ctx.fillText(endLabel, width - endLabelWidth - 5, height - 20);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [bands, selectedBand, hoveredElement]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  return (
    <div className={`space-y-3 ${!enabled ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-zinc-400 text-xs tracking-wider">MULTIBAND COMPRESSOR</h3>
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
      <div className={`relative ${!enabled ? 'pointer-events-none opacity-50' : ''}`}>
        <canvas
          ref={canvasRef}
          className="w-full rounded-lg bg-zinc-900/30 border border-zinc-800"
          style={{ width: '100%', height: '200px' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
        {/* Helper tooltip */}
        {hoveredElement.type && (
          <div className="absolute top-2 right-2 bg-zinc-900/95 border border-cyan-500/50 rounded-lg px-3 py-1.5 text-xs text-cyan-400">
            {hoveredElement.type === 'threshold' && '↕ Drag to adjust threshold'}
            {hoveredElement.type === 'crossover' && '↔ Drag to adjust crossover'}
            {hoveredElement.type === 'band' && 'Click to select band'}
          </div>
        )}
      </div>
      
      {/* Selected Band Controls */}
      <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full shadow-lg"
              style={{ 
                backgroundColor: bands[selectedBand].color,
                boxShadow: `0 0 8px ${bands[selectedBand].color}60`
              }}
            />
            <span className="text-zinc-100">{bands[selectedBand].name}</span>
            <span className="text-zinc-500 text-xs">
              ({formatFrequency(bands[selectedBand].lowFreq)}-{formatFrequency(bands[selectedBand].highFreq)}Hz)
            </span>
          </div>
          <button
            onClick={() => toggleBand(selectedBand)}
            className={`px-3 py-1 rounded text-xs transition-all ${
              bands[selectedBand].active 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' 
                : 'bg-zinc-700 text-zinc-400'
            }`}
          >
            {bands[selectedBand].active ? '● Active' : '○ Bypass'}
          </button>
        </div>

        <div className={`grid grid-cols-4 gap-3 ${!enabled ? 'pointer-events-none opacity-50' : ''}`}>
          {/* Frequency Range */}
          {selectedBand < bands.length - 1 && (
            <div>
              <label className="text-zinc-500 text-xs block mb-1">Crossover</label>
              <input
                type="range"
                min={selectedBand === 0 ? "80" : Math.max(bands[selectedBand].lowFreq + 10, 80)}
                max={selectedBand === bands.length - 2 ? "18000" : Math.min(bands[selectedBand + 1].highFreq - 10, 18000)}
                step="10"
                value={bands[selectedBand].highFreq}
                onChange={(e) => updateHighFreq(selectedBand, Number(e.target.value))}
                className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                style={{
                  accentColor: bands[selectedBand].color,
                }}
                disabled={!enabled}
              />
              <span className="text-xs text-cyan-400">{formatFrequency(bands[selectedBand].highFreq)}Hz</span>
            </div>
          )}

          {/* Threshold */}
          <div>
            <label className="text-zinc-500 text-xs block mb-1">Threshold</label>
            <input
              type="range"
              min="-60"
              max="0"
              value={bands[selectedBand].threshold}
              onChange={(e) => updateThreshold(selectedBand, Number(e.target.value))}
              className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
              style={{
                accentColor: bands[selectedBand].color,
              }}
              disabled={!enabled}
            />
            <span className="text-xs text-cyan-400">{bands[selectedBand].threshold}dB</span>
          </div>

          {/* Ratio */}
          <div>
            <label className="text-zinc-500 text-xs block mb-1">Ratio</label>
            <input
              type="range"
              min="1"
              max="20"
              step="0.5"
              value={bands[selectedBand].ratio}
              onChange={(e) => updateRatio(selectedBand, Number(e.target.value))}
              className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
              style={{
                accentColor: bands[selectedBand].color,
              }}
              disabled={!enabled}
            />
            <span className="text-xs text-cyan-400">{bands[selectedBand].ratio.toFixed(1)}:1</span>
          </div>

          {/* Gain */}
          <div>
            <label className="text-zinc-500 text-xs block mb-1">Gain</label>
            <input
              type="range"
              min="-12"
              max="12"
              step="0.5"
              value={bands[selectedBand].gain}
              onChange={(e) => updateGain(selectedBand, Number(e.target.value))}
              className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
              style={{
                accentColor: bands[selectedBand].color,
              }}
              disabled={!enabled}
            />
            <span className="text-xs text-cyan-400">
              {bands[selectedBand].gain > 0 ? '+' : ''}{bands[selectedBand].gain.toFixed(1)}dB
            </span>
          </div>
        </div>
      </div>

      {/* Band Selection Tabs */}
      <div className={`grid grid-cols-5 gap-2 ${!enabled ? 'pointer-events-none opacity-50' : ''}`}>
        {bands.map((band, index) => (
          <button
            key={index}
            onClick={() => setSelectedBand(index)}
            className={`px-2 py-2 rounded-lg text-xs transition-all border ${
              selectedBand === index
                ? 'border-cyan-500 shadow-lg'
                : 'border-zinc-700 hover:border-zinc-600'
            }`}
            disabled={!enabled}
            style={{
              backgroundColor: selectedBand === index 
                ? `${band.color}20` 
                : 'rgba(24, 24, 27, 0.5)',
              opacity: band.active ? 1 : 0.5,
              boxShadow: selectedBand === index ? `0 0 15px ${band.color}30` : 'none',
            }}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <div 
                className={`w-2 h-2 rounded-full transition-all ${!band.active ? 'opacity-30' : ''}`}
                style={{ 
                  backgroundColor: band.color,
                  boxShadow: band.active ? `0 0 6px ${band.color}` : 'none',
                }}
              />
              <span className={band.active ? 'text-zinc-100' : 'text-zinc-500'}>
                {band.name}
              </span>
            </div>
            <div className="text-xs text-zinc-500">
              {formatFrequency(band.lowFreq)}-{formatFrequency(band.highFreq)}Hz
            </div>
            {!band.active && (
              <div className="text-xs text-zinc-600 mt-0.5">BYPASS</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}


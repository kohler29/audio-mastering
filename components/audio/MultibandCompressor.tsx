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
  const [thresholdInputs, setThresholdInputs] = useState<Record<number, string>>({});
  const [gainInputs, setGainInputs] = useState<Record<number, string>>({});

  const toggleBand = (index: number) => {
    const newBands = [...bands];
    newBands[index].active = !newBands[index].active;
    onBandsChange(newBands);
  };

  const updateThreshold = (index: number, value: number) => {
    const newBands = [...bands];
    newBands[index].threshold = Math.max(-60, Math.min(0, value));
    onBandsChange(newBands);
    setThresholdInputs(prev => ({ ...prev, [index]: value.toString() }));
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
    setGainInputs(prev => ({ ...prev, [index]: value.toString() }));
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

  // Helper function to get coordinates from mouse or touch event
  const getEventCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    rect: DOMRect
  ): { x: number; y: number } => {
    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    // Type guard untuk MouseEvent
    if ('clientX' in e) {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
    // Fallback (shouldn't happen)
    return { x: 0, y: 0 };
  };

  const handleInteraction = (x: number, y: number, width: number, height: number) => {
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

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const { x, y } = getEventCoordinates(e, rect);
    handleInteraction(x, y, rect.width, rect.height);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const { x, y } = getEventCoordinates(e, rect);
    handleInteraction(x, y, rect.width, rect.height);
  };

  const handleMove = (x: number, y: number, width: number, height: number, canvas: HTMLCanvasElement) => {
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

    // Update hover state (only for mouse, not touch)
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

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const { x, y } = getEventCoordinates(e, rect);
    handleMove(x, y, rect.width, rect.height, canvas);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const { x, y } = getEventCoordinates(e, rect);
    handleMove(x, y, rect.width, rect.height, canvas);
  };

  const handleMouseUp = () => {
    dragStateRef.current = { isDragging: false, type: null, bandIndex: -1 };
  };

  const handleTouchEnd = () => {
    dragStateRef.current = { isDragging: false, type: null, bandIndex: -1 };
  };

  const handleMouseLeave = () => {
    dragStateRef.current = { isDragging: false, type: null, bandIndex: -1 };
    setHoveredElement({ type: null, index: -1 });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { 
      alpha: true,
      desynchronized: true, // Better performance
      willReadFrequently: false 
    });
    if (!ctx) return;

    // Enable anti-aliasing for smoother graphics
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    let lastTime = performance.now();
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      
      // Frame rate limiting untuk smooth animation
      if (deltaTime < frameInterval) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      
      lastTime = currentTime - (deltaTime % frameInterval);

      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Use save/restore untuk better performance
      ctx.save();
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

      // Simulate gain reduction animation dengan smoothing yang lebih baik
      // Menggunakan exponential moving average dengan adaptive smoothing
      const smoothingFactor = 0.92; // Lebih smooth (0.92 = lebih lambat decay, lebih smooth)
      const attackFactor = 0.25; // Lebih cepat attack
      
      gainReductionRef.current = gainReductionRef.current.map((val, i) => {
        if (!bands[i].active) {
          // Smooth decay to zero when inactive
          return val * 0.9;
        }
        
        // Simulate realistic gain reduction dengan noise yang lebih natural
        // Menggunakan perlin-like noise untuk lebih smooth
        const time = currentTime * 0.001;
        const noise = Math.sin(time * 2 + i * 0.5) * 0.5 + 
                     Math.sin(time * 3.7 + i * 0.3) * 0.3 +
                     Math.sin(time * 7.3 + i * 0.7) * 0.2;
        const normalizedNoise = (noise + 1) * 0.5; // Normalize to 0-1
        
        // Calculate target based on threshold (lebih banyak compression = lebih banyak GR)
        const thresholdFactor = Math.max(0, (bands[i].threshold + 60) / 60);
        const maxGR = thresholdFactor * 8; // Max gain reduction based on threshold
        const target = normalizedNoise * maxGR;
        
        // Exponential moving average dengan different rates untuk attack/decay
        if (target > val) {
          // Attack: lebih cepat
          return val * (1 - attackFactor) + target * attackFactor;
        } else {
          // Decay: lebih smooth
          return val * smoothingFactor + target * (1 - smoothingFactor);
        }
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

        // Draw threshold line with hover effect (optimized)
        const isThresholdHovered = hoveredElement.type === 'threshold' && hoveredElement.index === index;
        const isThresholdDragging = dragStateRef.current.isDragging && dragStateRef.current.type === 'threshold' && dragStateRef.current.bandIndex === index;
        
        ctx.save(); // Save state untuk threshold line
        ctx.strokeStyle = band.color;
        ctx.lineWidth = isThresholdHovered || isThresholdDragging ? 3 : 2;
        ctx.setLineDash(isThresholdHovered || isThresholdDragging ? [6, 3] : [4, 4]);
        ctx.lineCap = 'round'; // Smooth line caps
        ctx.lineJoin = 'round';
        
        if (isThresholdHovered || isThresholdDragging) {
          ctx.shadowColor = band.color;
          ctx.shadowBlur = 12;
        }
        
        ctx.beginPath();
        ctx.moveTo(x1, thresholdY);
        ctx.lineTo(x2, thresholdY);
        ctx.stroke();
        
        ctx.restore(); // Restore state

        // Draw threshold handle circles on hover/drag (optimized dengan gradient)
        if (isThresholdHovered || isThresholdDragging) {
          const handleX = x1 + bandWidth / 2;
          const handleRadius = isThresholdDragging ? 7 : 6;
          
          // Create radial gradient untuk 3D effect
          const handleGradient = ctx.createRadialGradient(
            handleX - 2, thresholdY - 2, 0,
            handleX, thresholdY, handleRadius
          );
          const rgbMatch3 = band.color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
          if (rgbMatch3) {
            handleGradient.addColorStop(0, `rgba(${rgbMatch3[1]}, ${rgbMatch3[2]}, ${rgbMatch3[3]}, 1)`);
            handleGradient.addColorStop(0.7, band.color);
            handleGradient.addColorStop(1, `rgba(${rgbMatch3[1]}, ${rgbMatch3[2]}, ${rgbMatch3[3]}, 0.6)`);
          } else {
            handleGradient.addColorStop(0, 'rgba(6, 255, 255, 1)');
            handleGradient.addColorStop(1, band.color);
          }
          
          ctx.save();
          ctx.fillStyle = handleGradient;
          ctx.beginPath();
          ctx.arc(handleX, thresholdY, handleRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        }

        // Draw animated gain reduction bars dengan optimasi
        const grHeight = Math.max(0, (gainReductionRef.current[index] / 60) * height);
        
        if (grHeight > 0) {
          // Optimize bar count berdasarkan width
          const barCount = Math.max(6, Math.min(20, Math.floor(bandWidth / 10)));
          const barSpacing = 2;
          const totalSpacing = barSpacing * (barCount - 1);
          const barWidth = (bandWidth - 4 - totalSpacing) / barCount;
          
          // Pre-calculate gradient untuk performance
          const barGradient = ctx.createLinearGradient(0, height - grHeight, 0, height);
          const rgbMatch2 = band.color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
          if (rgbMatch2) {
            barGradient.addColorStop(0, band.color);
            barGradient.addColorStop(0.5, `rgba(${rgbMatch2[1]}, ${rgbMatch2[2]}, ${rgbMatch2[3]}, 0.7)`);
            barGradient.addColorStop(1, `rgba(${rgbMatch2[1]}, ${rgbMatch2[2]}, ${rgbMatch2[3]}, 0.2)`);
          } else {
            barGradient.addColorStop(0, band.color);
            barGradient.addColorStop(1, 'rgba(6, 182, 212, 0.2)');
          }
          
          // Draw bars dengan smooth variation
          for (let i = 0; i < barCount; i++) {
            // Smooth variation menggunakan sine wave untuk lebih natural
            const variation = Math.sin((currentTime * 0.002) + (i * 0.3)) * 0.15 + 0.85;
            const barH = grHeight * Math.max(0.3, Math.min(1.0, variation));
            
            ctx.fillStyle = barGradient;
            ctx.fillRect(
              x1 + 2 + i * (barWidth + barSpacing),
              height - barH,
              barWidth,
              barH
            );
          }
        }

        // Draw crossover divider (except for first band) - optimized
        if (index > 0) {
          const isCrossoverHovered = hoveredElement.type === 'crossover' && hoveredElement.index === index - 1;
          const isCrossoverDragging = dragStateRef.current.isDragging && dragStateRef.current.type === 'crossover' && dragStateRef.current.bandIndex === index - 1;
          
          ctx.save();
          ctx.strokeStyle = isCrossoverHovered || isCrossoverDragging ? 'rgba(6, 182, 212, 1)' : 'rgba(200, 200, 210, 0.8)';
          ctx.lineWidth = isCrossoverHovered || isCrossoverDragging ? 3 : 2;
          ctx.lineCap = 'round';
          
          if (isCrossoverHovered || isCrossoverDragging) {
            ctx.shadowColor = 'rgba(6, 182, 212, 0.8)';
            ctx.shadowBlur = 15;
          }
          
          ctx.beginPath();
          ctx.moveTo(x1, 0);
          ctx.lineTo(x1, height);
          ctx.stroke();
          ctx.restore();

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

      ctx.restore(); // Restore context state

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

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
          className="w-full rounded-lg bg-zinc-900/30 border border-zinc-800 touch-none"
          style={{ width: '100%', height: '200px' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
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
              <div className="flex items-center gap-1 mt-1">
                <input
                  type="number"
                  step="10"
                  value={bands[selectedBand].highFreq}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!isNaN(val)) {
                      const min = selectedBand === 0 ? 80 : Math.max(bands[selectedBand].lowFreq + 10, 80);
                      const max = selectedBand === bands.length - 2 ? 18000 : Math.min(bands[selectedBand + 1].highFreq - 10, 18000);
                      updateHighFreq(selectedBand, Math.max(min, Math.min(max, val)));
                    }
                  }}
                  className="w-20 bg-zinc-700 text-zinc-100 px-1.5 py-0.5 rounded border border-zinc-600 focus:outline-none focus:border-cyan-500 text-xs text-center"
                  disabled={!enabled}
                />
                <span className="text-xs text-cyan-400">Hz</span>
              </div>
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
              <div className="flex items-center gap-1 mt-1">
                <input
                  type="text"
                  inputMode="decimal"
                  value={thresholdInputs[selectedBand] ?? bands[selectedBand].threshold.toString()}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || val === '-' || /^-?\d*\.?\d*$/.test(val)) {
                      setThresholdInputs(prev => ({ ...prev, [selectedBand]: val }));
                      if (val !== '' && val !== '-' && val !== '.' && val !== '-.') {
                        const numVal = Number(val);
                        if (!isNaN(numVal)) {
                          updateThreshold(selectedBand, Math.max(-60, Math.min(0, numVal)));
                        }
                      }
                    }
                  }}
                  onFocus={(e) => {
                    e.target.select();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    }
                  }}
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (val === '' || val === '-' || val === '.' || val === '-.') {
                      updateThreshold(selectedBand, -20);
                    } else {
                      const numVal = Number(val);
                      if (isNaN(numVal)) {
                        updateThreshold(selectedBand, -20);
                      } else {
                        updateThreshold(selectedBand, Math.max(-60, Math.min(0, numVal)));
                      }
                    }
                  }}
                  className="w-20 bg-zinc-700 text-zinc-100 px-1.5 py-0.5 rounded border border-zinc-600 focus:outline-none focus:border-cyan-500 text-xs text-center"
                  disabled={!enabled}
                />
                <span className="text-xs text-cyan-400">dB</span>
              </div>
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
            <div className="flex items-center gap-1 mt-1">
              <input
                type="number"
                step="0.1"
                value={bands[selectedBand].ratio}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (!isNaN(val)) {
                    updateRatio(selectedBand, Math.max(1, Math.min(20, val)));
                  }
                }}
                className="w-20 bg-zinc-700 text-zinc-100 px-1.5 py-0.5 rounded border border-zinc-600 focus:outline-none focus:border-cyan-500 text-xs text-center"
                disabled={!enabled}
              />
              <span className="text-xs text-cyan-400">:1</span>
            </div>
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
              <div className="flex items-center gap-1 mt-1">
                <input
                  type="text"
                  inputMode="decimal"
                  value={gainInputs[selectedBand] ?? bands[selectedBand].gain.toString()}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || val === '-' || /^-?\d*\.?\d*$/.test(val)) {
                      setGainInputs(prev => ({ ...prev, [selectedBand]: val }));
                      if (val !== '' && val !== '-' && val !== '.' && val !== '-.') {
                        const numVal = Number(val);
                        if (!isNaN(numVal)) {
                          updateGain(selectedBand, Math.max(-12, Math.min(12, numVal)));
                        }
                      }
                    }
                  }}
                  onFocus={(e) => {
                    e.target.select();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    }
                  }}
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (val === '' || val === '-' || val === '.' || val === '-.') {
                      updateGain(selectedBand, 0);
                    } else {
                      const numVal = Number(val);
                      if (isNaN(numVal)) {
                        updateGain(selectedBand, 0);
                      } else {
                        updateGain(selectedBand, Math.max(-12, Math.min(12, numVal)));
                      }
                    }
                  }}
                  className="w-20 bg-zinc-700 text-zinc-100 px-1.5 py-0.5 rounded border border-zinc-600 focus:outline-none focus:border-cyan-500 text-xs text-center"
                  disabled={!enabled}
                />
                <span className="text-xs text-cyan-400">dB</span>
              </div>
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



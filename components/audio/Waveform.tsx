"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface WaveformProps {
  isPlaying: boolean;
  leftWaveformData: Float32Array | null;
  rightWaveformData: Float32Array | null;
  currentTime: number;
  duration: number;
  onSeek?: (time: number) => void;
}

export function Waveform({ leftWaveformData, rightWaveformData, currentTime, duration, onSeek }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rulerCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  
  // Interaction states
  const [isHovering, setIsHovering] = useState(false);
  const [hoverX, setHoverX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  
  // Zoom and scroll states
  const [zoom, setZoom] = useState(1);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);


  // Update max scroll when zoom changes
  useEffect(() => {
    if (canvasRef.current) {
      const maxScrollValue = Math.max(0, (canvasRef.current.width * zoom) - canvasRef.current.width);
      setMaxScroll(maxScrollValue);
      setScrollOffset(prev => Math.min(prev, maxScrollValue));
    }
  }, [zoom]);

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Helper function to draw a single channel with peak detection (min/max)
  const drawChannel = useCallback((
    ctx: CanvasRenderingContext2D,
    data: Float32Array,
    offsetY: number,
    channelHeight: number,
    width: number,
    strokeColor: string,
    fillColor: string
  ) => {
    const sampleCount = data.length;
    const centerY = offsetY + channelHeight / 2;
    const visibleSamples = Math.ceil(sampleCount / zoom);
    const startSample = Math.floor((scrollOffset / (width * zoom)) * sampleCount);
    const samplesPerPixel = Math.max(1, Math.floor(visibleSamples / width));
    
    // Enable anti-aliasing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Prepare peak data (min/max untuk setiap pixel)
    const peaks: Array<{ min: number; max: number }> = [];
    
    for (let i = 0; i < width; i++) {
      const pixelStart = startSample + (i * samplesPerPixel);
      const pixelEnd = Math.min(pixelStart + samplesPerPixel, sampleCount);
      
      if (pixelStart >= sampleCount) break;
      
      let min = Infinity;
      let max = -Infinity;
      
      // Cari min/max dalam range pixel ini (peak detection)
      for (let j = pixelStart; j < pixelEnd; j++) {
        const sample = data[j];
        if (sample < min) min = sample;
        if (sample > max) max = sample;
      }
      
      peaks.push({ min: isFinite(min) ? min : 0, max: isFinite(max) ? max : 0 });
    }
    
    // Draw filled waveform dengan gradient
    const gradient = ctx.createLinearGradient(0, offsetY, 0, offsetY + channelHeight);
    gradient.addColorStop(0, fillColor);
    gradient.addColorStop(0.5, fillColor.replace('0.5', '0.3'));
    gradient.addColorStop(1, fillColor.replace('0.5', '0.1'));
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    
    // Top half (max values)
    for (let i = 0; i < peaks.length; i++) {
      const peak = peaks[i];
      const amplitude = Math.abs(peak.max) * (channelHeight / 2) * 0.9;
      const x = i;
      const yTop = centerY - amplitude;
      
      if (i === 0) {
        ctx.moveTo(x, yTop);
      } else {
        ctx.lineTo(x, yTop);
      }
    }
    
    // Bottom half (min values, reversed)
    for (let i = peaks.length - 1; i >= 0; i--) {
      const peak = peaks[i];
      const amplitude = Math.abs(peak.min) * (channelHeight / 2) * 0.9;
      const x = i;
      const yBottom = centerY + amplitude;
      
      ctx.lineTo(x, yBottom);
    }
    
    ctx.closePath();
    ctx.fill();
    
    // Draw waveform outline dengan stroke yang lebih halus
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    
    // Top outline (max)
    for (let i = 0; i < peaks.length; i++) {
      const peak = peaks[i];
      const amplitude = Math.abs(peak.max) * (channelHeight / 2) * 0.9;
      const x = i;
      const y = centerY - amplitude;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    // Bottom outline (min)
    for (let i = 0; i < peaks.length; i++) {
      const peak = peaks[i];
      const amplitude = Math.abs(peak.min) * (channelHeight / 2) * 0.9;
      const x = i;
      const y = centerY + amplitude;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
  }, [zoom, scrollOffset]);

  // Draw time ruler
  const drawRuler = useCallback(() => {
    const canvas = rulerCanvasRef.current;
    if (!canvas || duration <= 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Background
    ctx.fillStyle = 'rgba(24, 24, 27, 0.8)';
    ctx.fillRect(0, 0, width, height);
    
    // Calculate visible time range
    const visibleWidth = width / zoom;
    const startTime = (scrollOffset / (width * zoom)) * duration;
    const endTime = startTime + (duration * (visibleWidth / width));
    
    // Determine time interval for markers
    const pixelsPerSecond = (width * zoom) / duration;
    let interval = 1; // seconds
    
    if (pixelsPerSecond < 50) interval = 10;
    else if (pixelsPerSecond < 100) interval = 5;
    else if (pixelsPerSecond < 200) interval = 2;
    else if (pixelsPerSecond > 500) interval = 0.1;
    else if (pixelsPerSecond > 300) interval = 0.5;
    
    // Draw time markers
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(161, 161, 170, 0.9)';
    ctx.strokeStyle = 'rgba(161, 161, 170, 0.3)';
    ctx.lineWidth = 1;
    
    let time = Math.floor(startTime / interval) * interval;
    while (time <= endTime) {
      const x = ((time / duration) * width * zoom) - scrollOffset;
      
      if (x >= 0 && x <= width) {
        // Draw tick
        ctx.beginPath();
        ctx.moveTo(x, height - 8);
        ctx.lineTo(x, height);
        ctx.stroke();
        
        // Draw time label
        const label = formatTime(time);
        const textWidth = ctx.measureText(label).width;
        if (x - textWidth / 2 > 0 && x + textWidth / 2 < width) {
          ctx.fillText(label, x - textWidth / 2, height - 12);
        }
      }
      
      time += interval;
    }
  }, [duration, zoom, scrollOffset]);

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      // Gunakan ukuran CSS (setelah scaling), bukan ukuran internal canvas
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      
      ctx.clearRect(0, 0, width, height);
      
      // Background
      ctx.fillStyle = 'rgba(9, 9, 11, 0.95)';
      ctx.fillRect(0, 0, width, height);
      
      // Draw center line (separator antara L dan R channel)
      ctx.strokeStyle = 'rgba(82, 82, 91, 0.6)';
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      
      // Draw horizontal grid lines
      const gridLines = 8;
      ctx.strokeStyle = 'rgba(82, 82, 91, 0.15)';
      for (let i = 1; i < gridLines; i++) {
        const y = (height / gridLines) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      
      // Draw vertical grid lines based on time
      if (duration > 0) {
        const visibleWidth = width / zoom;
        const startTime = (scrollOffset / (width * zoom)) * duration;
        const endTime = startTime + (duration * (visibleWidth / width));
        
        const pixelsPerSecond = (width * zoom) / duration;
        let interval = 1;
        
        if (pixelsPerSecond < 50) interval = 10;
        else if (pixelsPerSecond < 100) interval = 5;
        else if (pixelsPerSecond < 200) interval = 2;
        else if (pixelsPerSecond > 500) interval = 0.1;
        else if (pixelsPerSecond > 300) interval = 0.5;
        
        let time = Math.floor(startTime / interval) * interval;
        while (time <= endTime) {
          const x = ((time / duration) * width * zoom) - scrollOffset;
          
          if (x >= 0 && x <= width) {
            ctx.strokeStyle = 'rgba(82, 82, 91, 0.2)';
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
          }
          
          time += interval;
        }
      }

      // Draw stereo waveforms
      // Handle both stereo and mono audio
      const hasLeftData = leftWaveformData && leftWaveformData.length > 0;
      const hasRightData = rightWaveformData && rightWaveformData.length > 0;
      
      if (hasLeftData || hasRightData) {
        const channelHeight = height / 2;
        
        // Use left data for both channels if right is missing (mono audio)
        const leftData = leftWaveformData || rightWaveformData;
        const rightData = rightWaveformData || leftWaveformData;
        
        if (leftData && rightData) {
          // Draw LEFT channel (top half: y = 0 to channelHeight) - Brighter blue
          drawChannel(ctx, leftData, 0, channelHeight, width, 'rgba(96, 165, 250, 1)', 'rgba(96, 165, 250, 0.5)');
          
          // Draw RIGHT channel (bottom half: y = channelHeight to height) - Vibrant pink/magenta
          // offsetY = channelHeight berarti channel dimulai dari tengah canvas ke bawah
          drawChannel(ctx, rightData, channelHeight, channelHeight, width, 'rgba(244, 114, 182, 1)', 'rgba(244, 114, 182, 0.5)');
          
          // Draw channel labels
          ctx.font = 'bold 11px sans-serif';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fillText('L', 8, 16);
          ctx.fillText('R', 8, channelHeight + 16);
          
          // Draw stereo/mono indicator
          const isMono = !hasRightData || !hasLeftData || 
                        (leftWaveformData && rightWaveformData && 
                         leftWaveformData.length === rightWaveformData.length &&
                         leftWaveformData.every((val, idx) => Math.abs(val - rightWaveformData[idx]) < 0.0001));
          if (isMono) {
            ctx.font = 'bold 10px sans-serif';
            ctx.fillStyle = 'rgba(251, 191, 36, 0.8)';
            ctx.fillText('MONO', width - 45, 16);
          } else {
            ctx.font = 'bold 10px sans-serif';
            ctx.fillStyle = 'rgba(34, 197, 94, 0.8)';
            ctx.fillText('STEREO', width - 55, 16);
          }
        } else {
          // Debug: log jika data tidak ada
          if (!leftData || !rightData) {
            console.warn('Waveform drawing: missing data', { hasLeftData, hasRightData, leftData: !!leftData, rightData: !!rightData });
          }
        }
      } else {
        // No waveform data - show placeholder
        ctx.fillStyle = 'rgba(161, 161, 170, 0.3)';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No waveform data', width / 2, height / 2);
        ctx.textAlign = 'left';
      }

      // Draw selection region
      if (dragStart !== null && dragEnd !== null) {
        const startX = Math.min(dragStart, dragEnd);
        const endX = Math.max(dragStart, dragEnd);
        
        ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
        ctx.fillRect(startX, 0, endX - startX, height);
        
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(startX, 0, endX - startX, height);
      }

      // Draw playhead (current playback position)
      if (duration > 0) {
        const playheadX = ((currentTime / duration) * width * zoom) - scrollOffset;
        
        if (playheadX >= 0 && playheadX <= width) {
          // Playhead shadow/glow effect
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'rgba(251, 191, 36, 0.5)';
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          
          // Playhead line (thicker and more visible)
          ctx.strokeStyle = 'rgba(251, 191, 36, 1)';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(playheadX, 0);
          ctx.lineTo(playheadX, height);
          ctx.stroke();
          
          // Reset shadow
          ctx.shadowBlur = 0;
          
          // Playhead triangle at top (more prominent)
          ctx.fillStyle = 'rgba(251, 191, 36, 1)';
          ctx.beginPath();
          ctx.moveTo(playheadX, 0);
          ctx.lineTo(playheadX - 8, 12);
          ctx.lineTo(playheadX + 8, 12);
          ctx.closePath();
          ctx.fill();
          
          // Triangle border
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Draw hover cursor (mouse position indicator)
      if (isHovering && duration > 0 && !isDragging) {
        // Pastikan hoverX dalam batas canvas
        const clampedHoverX = Math.max(0, Math.min(hoverX, width));
        
        // Hover cursor line (more visible)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(clampedHoverX, 0);
        ctx.lineTo(clampedHoverX, height);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Hover cursor dot at center
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(clampedHoverX, height / 2, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Show time tooltip with better styling - pastikan sejajar dengan garis
        const hoverTime = ((clampedHoverX + scrollOffset) / (width * zoom)) * duration;
        const tooltip = formatTime(hoverTime);
        
        ctx.font = 'bold 11px monospace';
        const textWidth = ctx.measureText(tooltip).width;
        // Tooltip diposisikan tepat di atas garis cursor (centered)
        const tooltipX = Math.min(Math.max(clampedHoverX - textWidth / 2, 4), width - textWidth - 4);
        const tooltipY = 18;
        
        // Tooltip background with rounded corners effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(tooltipX - 6, tooltipY - 12, textWidth + 12, 18);
        
        // Tooltip border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(tooltipX - 6, tooltipY - 12, textWidth + 12, 18);
        
        // Tooltip text
        ctx.fillStyle = 'rgba(251, 191, 36, 1)';
        ctx.fillText(tooltip, tooltipX, tooltipY);
        
        // Garis kecil dari tooltip ke cursor untuk visual connection
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(clampedHoverX, tooltipY + 6);
        ctx.lineTo(clampedHoverX, tooltipY - 6);
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [leftWaveformData, rightWaveformData, currentTime, duration, isHovering, hoverX, zoom, scrollOffset, dragStart, dragEnd, isDragging, drawChannel]);

  // Draw ruler
  useEffect(() => {
    drawRuler();
  }, [drawRuler]);

  // Canvas resize handler
  useEffect(() => {
    const canvas = canvasRef.current;
    const rulerCanvas = rulerCanvasRef.current;
    if (!canvas || !rulerCanvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      
      const rulerRect = rulerCanvas.getBoundingClientRect();
      rulerCanvas.width = rulerRect.width * window.devicePixelRatio;
      rulerCanvas.height = rulerRect.height * window.devicePixelRatio;
      
      const ctx = canvas.getContext('2d');
      const rulerCtx = rulerCanvas.getContext('2d');
      
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
      if (rulerCtx) {
        rulerCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Helper function to get X coordinate from mouse or touch event
  const getEventX = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, rect: DOMRect): number => {
    if ('touches' in e && e.touches.length > 0) {
      return e.touches[0].clientX - rect.left;
    }
    // Type guard untuk MouseEvent
    if ('clientX' in e) {
      return e.clientX - rect.left;
    }
    // Fallback (shouldn't happen)
    return 0;
  };

  // Mouse event handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !duration) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    setHoverX(x);
    setIsHovering(true);
    
    if (isDragging && dragStart !== null) {
      setDragEnd(x);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !duration) return;

    e.preventDefault();
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    if (e.shiftKey) {
      setIsDragging(true);
      setDragStart(x);
      setDragEnd(x);
    } else {
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
      
      const clickTime = ((x + scrollOffset) / (rect.width * zoom)) * duration;
      const seekTime = Math.max(0, Math.min(clickTime, duration));
      onSeek?.(seekTime);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    
    if (dragStart !== null && dragEnd !== null) {
      const dragDistance = Math.abs(dragEnd - dragStart);
      if (dragDistance < 5) {
        setDragStart(null);
        setDragEnd(null);
      }
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setIsDragging(false);
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !duration) return;

    e.preventDefault();
    
    const rect = canvas.getBoundingClientRect();
    const x = getEventX(e, rect);
    
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
    
    const clickTime = ((x + scrollOffset) / (rect.width * zoom)) * duration;
    const seekTime = Math.max(0, Math.min(clickTime, duration));
    onSeek?.(seekTime);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !duration) return;

    e.preventDefault();
    
    const rect = canvas.getBoundingClientRect();
    const x = getEventX(e, rect);
    
    if (isDragging && dragStart !== null) {
      setDragEnd(x);
    } else {
      // Start dragging on touch move
      if (dragStart === null) {
        setIsDragging(true);
        setDragStart(x);
      }
      setDragEnd(x);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    if (dragStart !== null && dragEnd !== null) {
      const dragDistance = Math.abs(dragEnd - dragStart);
      if (dragDistance < 5) {
        setDragStart(null);
        setDragEnd(null);
      }
    }
  };

  // Global mouse up handler untuk memastikan state ter-reset bahkan jika mouse keluar dari canvas
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    const handleGlobalTouchEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalTouchEnd);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, []);

  // Handle wheel events with native listener to allow preventDefault
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      if (e.ctrlKey || e.metaKey) {
        // Zoom
        const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(prev => Math.max(1, Math.min(prev * zoomDelta, 50)));
      } else {
        // Scroll
        const scrollDelta = e.deltaY;
        setScrollOffset(prev => Math.max(0, Math.min(prev + scrollDelta, maxScroll)));
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [maxScroll]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.5, 50));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.5, 1));
  };

  const handleZoomReset = () => {
    setZoom(1);
    setScrollOffset(0);
  };

  return (
    <div className="space-y-2">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="bg-zinc-700 hover:bg-zinc-600 text-zinc-300 p-1.5 rounded transition-colors"
            title="Zoom Out (Ctrl + Scroll)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomIn}
            className="bg-zinc-700 hover:bg-zinc-600 text-zinc-300 p-1.5 rounded transition-colors"
            title="Zoom In (Ctrl + Scroll)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomReset}
            className="bg-zinc-700 hover:bg-zinc-600 text-zinc-300 p-1.5 rounded transition-colors"
            title="Reset Zoom"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <span className="text-zinc-500 text-xs ml-2">
            Zoom: {zoom.toFixed(1)}x
          </span>
        </div>
        
        <div className="text-zinc-500 text-xs">
          {dragStart !== null && dragEnd !== null && (
            <span className="text-emerald-400">
              Region selected • Hold Shift to select
            </span>
          )}
          {!isDragging && (
            <span>
              Scroll to pan • Ctrl+Scroll to zoom • Shift+Click to select
            </span>
          )}
        </div>
      </div>
      
      {/* Time Ruler */}
      <canvas 
        ref={rulerCanvasRef}
        className="w-full rounded-t-lg"
        style={{ width: '100%', height: '24px' }}
      />
      
      {/* Waveform */}
      <div 
        ref={containerRef}
        className="relative"
      >
        <canvas 
          ref={canvasRef}
          className="w-full rounded-b-lg cursor-crosshair touch-none"
          style={{ width: '100%', height: '400px' }}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
        
        {/* Scrollbar */}
        {zoom > 1 && (
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-zinc-800/50 rounded-b-lg">
            <div 
              className="h-full bg-cyan-600/50 rounded-b-lg cursor-pointer hover:bg-cyan-600/70 transition-colors"
              style={{ 
                width: `${(1 / zoom) * 100}%`,
                marginLeft: `${(scrollOffset / (maxScroll || 1)) * (100 - (1 / zoom) * 100)}%`
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

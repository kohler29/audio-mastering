"use client";

import { useEffect, useRef, useState } from 'react';

interface WaveformProps {
  isPlaying: boolean;
  waveformData: Float32Array | null;
  currentTime: number;
  duration: number;
  onSeek?: (time: number) => void;
}

export function Waveform({ isPlaying, waveformData, currentTime, duration, onSeek }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [isHovering, setIsHovering] = useState(false);
  const [hoverX, setHoverX] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);
      
      // Draw grid
      ctx.strokeStyle = 'rgba(82, 82, 91, 0.2)';
      ctx.lineWidth = 1;
      
      // Horizontal grid lines
      for (let i = 0; i <= 4; i++) {
        const y = (height / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      
      // Vertical grid lines
      for (let i = 0; i <= 8; i++) {
        const x = (width / 8) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Draw waveform from audio buffer data
      if (waveformData && waveformData.length > 0) {
        const sampleCount = waveformData.length;
        const centerY = height / 2;
        
        // Draw waveform (mirrored for better visualization)
        ctx.strokeStyle = 'rgb(6, 182, 212)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();

        for (let i = 0; i < sampleCount; i++) {
          const x = (width / sampleCount) * i;
          const sample = waveformData[i]; // Already normalized (0-1)
          const amplitude = sample * (height * 0.45); // Use 45% of height for amplitude
          
          // Draw mirrored waveform
          const topY = centerY - amplitude;
          const bottomY = centerY + amplitude;

          if (i === 0) {
            ctx.moveTo(x, topY);
          } else {
            ctx.lineTo(x, topY);
          }
        }
        
        // Draw bottom half (mirrored)
        for (let i = sampleCount - 1; i >= 0; i--) {
          const x = (width / sampleCount) * i;
          const sample = waveformData[i];
          const amplitude = sample * (height * 0.45);
          const bottomY = centerY + amplitude;
          ctx.lineTo(x, bottomY);
        }
        
        ctx.closePath();
        
        // Fill with gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(6, 182, 212, 0.3)');
        gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.1)');
        gradient.addColorStop(1, 'rgba(6, 182, 212, 0.3)');
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Draw outline
        ctx.strokeStyle = 'rgb(6, 182, 212)';
        ctx.stroke();
      } else {
        // Fallback: draw simulated waveform if no data
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();

        const samples = 200;
        for (let i = 0; i < samples; i++) {
          const x = (width / samples) * i;
          const frequency = 0.02;
          const amplitude = height * 0.3;
          
          let y = height / 2;
          y += Math.sin(i * frequency) * amplitude * 0.6;
          y += Math.sin(i * frequency * 2) * amplitude * 0.2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.stroke();
      }

      // Draw playhead based on currentTime
      if (duration > 0) {
        const playheadX = (currentTime / duration) * width;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(playheadX, 0);
        ctx.lineTo(playheadX, height);
        ctx.stroke();
        
        // Draw playhead circle
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(playheadX, height / 2, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw hover cursor
      if (isHovering && duration > 0) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(hoverX, 0);
        ctx.lineTo(hoverX, height);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, waveformData, currentTime, duration, isHovering, hoverX]);

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

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !duration) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const scale = rect.width / canvas.width;
    setHoverX(x / scale);
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !duration || !onSeek) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const scale = rect.width / canvas.width;
    const clickX = x / scale;
    const clickTime = (clickX / canvas.width) * duration;
    
    onSeek(Math.max(0, Math.min(clickTime, duration)));
  };

  return (
    <canvas 
      ref={canvasRef}
      className="w-full h-32 rounded-lg cursor-pointer"
      style={{ width: '100%', height: '128px' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    />
  );
}

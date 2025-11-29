"use client";

import { useEffect, useRef } from 'react';
import { AudioAnalysisData } from '@/lib/audio/audioEngine';

interface SpectrumAnalyzerProps {
  isPlaying?: boolean;
  analysisData: AudioAnalysisData | null;
}

export function SpectrumAnalyzer({ isPlaying = false, analysisData }: SpectrumAnalyzerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const barsRef = useRef<number[]>(Array(64).fill(0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);

      // Draw frequency labels
      const frequencies = ['20Hz', '100Hz', '1kHz', '10kHz', '20kHz'];
      ctx.fillStyle = 'rgba(161, 161, 170, 0.5)';
      ctx.font = '10px monospace';
      frequencies.forEach((freq, i) => {
        const x = (width / (frequencies.length - 1)) * i;
        ctx.fillText(freq, x, height - 5);
      });

      // Draw dB lines
      ctx.strokeStyle = 'rgba(82, 82, 91, 0.2)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = (height / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw spectrum bars from real audio data
      if (analysisData && analysisData.spectrum) {
        const spectrum = analysisData.spectrum;
        const barCount = 64;
        const barWidth = width / barCount - 2;

        // Downsample spectrum data to bar count
        const samplesPerBar = Math.floor(spectrum.length / barCount);

        for (let i = 0; i < barCount; i++) {
          let sum = 0;
          const start = i * samplesPerBar;
          const end = Math.min(start + samplesPerBar, spectrum.length);
          
          for (let j = start; j < end; j++) {
            sum += spectrum[j];
          }
          
          const avgValue = sum / (end - start);
          
          // Smooth with previous value
          barsRef.current[i] = barsRef.current[i] * 0.7 + (avgValue / 255) * 0.3;
          
          const x = (width / barCount) * i;
          const barHeight = barsRef.current[i] * (height - 20);
          
          // Create gradient for bars
          const gradient = ctx.createLinearGradient(0, height - 20 - barHeight, 0, height - 20);
          gradient.addColorStop(0, 'rgb(6, 182, 212)');
          gradient.addColorStop(0.5, 'rgb(8, 145, 178)');
          gradient.addColorStop(1, 'rgb(14, 116, 144)');
          
          ctx.fillStyle = gradient;
          ctx.fillRect(x, height - 20 - barHeight, barWidth, barHeight);

          // Add glow effect
          ctx.shadowBlur = 10;
          ctx.shadowColor = 'rgba(6, 182, 212, 0.5)';
          ctx.fillRect(x, height - 20 - barHeight, barWidth, barHeight);
          ctx.shadowBlur = 0;
        }
      } else {
        // Fallback: draw simulated bars if no data
        const barCount = barsRef.current.length;
        const barWidth = width / barCount - 2;

        barsRef.current.forEach((value, i) => {
          const x = (width / barCount) * i;
          
          // Update bar values
          if (isPlaying) {
            const target = Math.random() * (1 - i / barCount * 0.7);
            barsRef.current[i] = barsRef.current[i] * 0.8 + target * 0.2;
          } else {
            barsRef.current[i] *= 0.95;
          }

          const barHeight = barsRef.current[i] * (height - 20);
          
          // Create gradient for bars
          const gradient = ctx.createLinearGradient(0, height - 20 - barHeight, 0, height - 20);
          gradient.addColorStop(0, 'rgb(6, 182, 212)');
          gradient.addColorStop(0.5, 'rgb(8, 145, 178)');
          gradient.addColorStop(1, 'rgb(14, 116, 144)');
          
          ctx.fillStyle = gradient;
          ctx.fillRect(x, height - 20 - barHeight, barWidth, barHeight);

          // Add glow effect
          ctx.shadowBlur = 10;
          ctx.shadowColor = 'rgba(6, 182, 212, 0.5)';
          ctx.fillRect(x, height - 20 - barHeight, barWidth, barHeight);
          ctx.shadowBlur = 0;
        });
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, analysisData]);

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
    <canvas 
      ref={canvasRef}
      className="w-full h-32 rounded-lg"
      style={{ width: '100%', height: '128px' }}
    />
  );
}

"use client";

import { useEffect, useRef } from 'react';
import { AudioAnalysisData } from '@/lib/audio/audioEngine';

interface SpectrumAnalyzerProps {
  isPlaying?: boolean;
  analysisData: AudioAnalysisData | null;
  loading?: boolean;
}

/**
 * SpectrumAnalyzer
 * Menganalisa spektrum dengan log-binning dan normalisasi dB.
 */
export function SpectrumAnalyzer({ isPlaying = false, analysisData, loading = false }: SpectrumAnalyzerProps) {
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

      // Draw spectrum bars from real audio data (log-frequency binning, dB normalization)
      if (analysisData && (analysisData.floatSpectrum || analysisData.spectrum)) {
        const barCount = 64;
        const barWidth = width / barCount - 2;

        const sampleRate = analysisData.sampleRate || 44100;
        const nyquist = sampleRate / 2;
        const maxFreq = Math.min(20000, nyquist);
        const minFreq = 20;

        const floatSpectrum = analysisData.floatSpectrum;
        const byteSpectrum = analysisData.spectrum;
        const bins = analysisData.frequencyBinCount || (byteSpectrum ? byteSpectrum.length : 0);
        const minDb = analysisData.minDecibels ?? -100;
        const maxDb = analysisData.maxDecibels ?? 0;

        const edges: number[] = [];
        for (let i = 0; i <= barCount; i++) {
          const t = i / barCount;
          const f = minFreq * Math.pow(maxFreq / minFreq, t);
          const idx = Math.max(0, Math.min(bins - 1, Math.floor((f / nyquist) * bins)));
          edges.push(idx);
        }

        for (let i = 0; i < barCount; i++) {
          const start = edges[i];
          const end = Math.max(start + 1, edges[i + 1]);
          let sumDb = 0;
          let count = 0;

          for (let j = start; j < end; j++) {
            const db = floatSpectrum ? floatSpectrum[j] : ((byteSpectrum![j] / 255) * (maxDb - minDb) + minDb);
            sumDb += db;
            count++;
          }

          const avgDb = count > 0 ? sumDb / count : minDb;
          const norm = Math.max(0, Math.min(1, (avgDb - minDb) / (maxDb - minDb)));

          const prev = barsRef.current[i];
          const target = norm;
          const coeff = target > prev ? 0.6 : 0.2;
          barsRef.current[i] = prev + (target - prev) * coeff;

          const x = (width / barCount) * i;
          const barHeight = barsRef.current[i] * (height - 20);

          const gradient = ctx.createLinearGradient(0, height - 20 - barHeight, 0, height - 20);
          gradient.addColorStop(0, 'rgb(6, 182, 212)');
          gradient.addColorStop(0.5, 'rgb(8, 145, 178)');
          gradient.addColorStop(1, 'rgb(14, 116, 144)');

          ctx.fillStyle = gradient;
          ctx.fillRect(x, height - 20 - barHeight, barWidth, barHeight);

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
    <div className="relative">
      <canvas 
        ref={canvasRef}
        className="w-full h-24 sm:h-28 md:h-32 rounded-lg"
        style={{ width: '100%' }}
      />
      {loading && (
        <div className="absolute inset-0 rounded-lg bg-zinc-900/60 flex items-center justify-center">
          <div className="w-3/4 h-16 grid grid-cols-10 gap-2 animate-pulse">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-zinc-700/60 rounded" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

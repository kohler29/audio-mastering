"use client";

import { useEffect, useRef, useState } from 'react';
import { Activity } from 'lucide-react';
import { AudioAnalysisData } from '@/lib/audio/audioEngine';

interface LoudnessMeterProps {
  analysisData: AudioAnalysisData | null;
}

export function LoudnessMeter({ analysisData }: LoudnessMeterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  
  // Loudness values using refs to avoid re-render loops
  const integratedRef = useRef(-14.5);
  const shortTermRef = useRef(-12.3);
  const momentaryRef = useRef(-10.8);
  const truePeakRef = useRef(-1.2);
  const lraRef = useRef(6.5);
  
  // Display states (only update occasionally for UI)
  const [integrated, setIntegrated] = useState(-14.5);
  const [shortTerm, setShortTerm] = useState(-12.3);
  const [momentary, setMomentary] = useState(-10.8);
  const [truePeak, setTruePeak] = useState(-1.2);
  const [lra, setLra] = useState(6.5);

  // Update from analysis data
  useEffect(() => {
    if (analysisData && analysisData.loudness) {
      const loudness = analysisData.loudness;
      
      // Smooth updates
      momentaryRef.current = momentaryRef.current * 0.7 + loudness.momentary * 0.3;
      shortTermRef.current = shortTermRef.current * 0.85 + loudness.shortTerm * 0.15;
      integratedRef.current = integratedRef.current * 0.95 + loudness.integrated * 0.05;
      truePeakRef.current = truePeakRef.current * 0.8 + loudness.truePeak * 0.2;
      lraRef.current = loudness.lra;
    }
  }, [analysisData]);

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

      // Draw scale background
      const meterX = 20;
      const meterWidth = width - 40;
      const meterHeight = height - 60;
      const meterY = 30;

      // Draw background
      ctx.fillStyle = 'rgba(24, 24, 27, 0.5)';
      ctx.fillRect(meterX, meterY, meterWidth, meterHeight);

      // Draw scale markings (from -60 to 0 LUFS)
      const scaleMin = -60;
      const scaleMax = 0;
      const scaleRange = scaleMax - scaleMin;

      // Helper function to convert LUFS to X position (for horizontal scale)
      const lufsToX = (lufs: number) => {
        const normalized = (lufs - scaleMin) / scaleRange;
        return meterX + (normalized * meterWidth);
      };

      // Draw horizontal grid lines and labels
      const majorMarks = [-60, -50, -40, -30, -23, -18, -14, -9, -6, -3, 0];
      
      majorMarks.forEach(db => {
        const x = lufsToX(db);
        
        // Grid line
        ctx.strokeStyle = db === -23 || db === -14 ? 'rgba(6, 182, 212, 0.3)' : 'rgba(82, 82, 91, 0.2)';
        ctx.lineWidth = db === -23 || db === -14 ? 1.5 : 1;
        ctx.beginPath();
        ctx.moveTo(x, meterY);
        ctx.lineTo(x, meterY + meterHeight);
        ctx.stroke();

        // Label at bottom
        ctx.fillStyle = db === -23 || db === -14 ? 'rgba(6, 182, 212, 0.9)' : 'rgba(161, 161, 170, 0.7)';
        ctx.font = db === -23 || db === -14 ? 'bold 9px monospace' : '8px monospace';
        const label = db.toString();
        const labelWidth = ctx.measureText(label).width;
        ctx.fillText(label, x - labelWidth / 2, meterY + meterHeight + 15);
      });

      // Draw reference zones (colored backgrounds)
      const drawZone = (startDb: number, endDb: number, color: string, alpha: number = 0.1) => {
        const x1 = lufsToX(startDb);
        const x2 = lufsToX(endDb);
        ctx.fillStyle = color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
        ctx.fillRect(x1, meterY, x2 - x1, meterHeight);
      };

      drawZone(-60, -40, 'rgb(59, 130, 246)', 0.05); // Too quiet
      drawZone(-23, -13, 'rgb(34, 197, 94)', 0.15); // Broadcast standard
      drawZone(-9, 0, 'rgb(239, 68, 68)', 0.1); // Too loud

      // Draw -23 LUFS reference line (EBU R128 broadcast standard)
      const ref23X = lufsToX(-23);
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(ref23X, meterY);
      ctx.lineTo(ref23X, meterY + meterHeight);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw -14 LUFS reference line (Streaming platforms)
      const ref14X = lufsToX(-14);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(ref14X, meterY);
      ctx.lineTo(ref14X, meterY + meterHeight);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw meter bars
      const barHeight = 20;
      const barSpacing = 25;
      let currentY = meterY + 10;

      // Momentary bar
      const momentaryX = lufsToX(Math.max(scaleMin, Math.min(scaleMax, momentaryRef.current)));
      const momentaryWidth = momentaryX - meterX;
      
      const momentaryGradient = ctx.createLinearGradient(meterX, 0, momentaryX, 0);
      momentaryGradient.addColorStop(0, 'rgba(168, 85, 247, 0.3)');
      momentaryGradient.addColorStop(1, 'rgba(168, 85, 247, 1)');
      
      ctx.fillStyle = momentaryGradient;
      ctx.fillRect(meterX, currentY, momentaryWidth, barHeight);
      
      // Bar border
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(meterX, currentY, meterWidth, barHeight);

      currentY += barSpacing;

      // Short-term bar
      const shortTermX = lufsToX(Math.max(scaleMin, Math.min(scaleMax, shortTermRef.current)));
      const shortTermWidth = shortTermX - meterX;
      
      const shortTermGradient = ctx.createLinearGradient(meterX, 0, shortTermX, 0);
      shortTermGradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
      shortTermGradient.addColorStop(1, 'rgba(59, 130, 246, 1)');
      
      ctx.fillStyle = shortTermGradient;
      ctx.fillRect(meterX, currentY, shortTermWidth, barHeight);
      
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(meterX, currentY, meterWidth, barHeight);

      currentY += barSpacing;

      // Integrated bar
      const integratedX = lufsToX(Math.max(scaleMin, Math.min(scaleMax, integratedRef.current)));
      const integratedWidth = integratedX - meterX;
      
      const integratedGradient = ctx.createLinearGradient(meterX, 0, integratedX, 0);
      integratedGradient.addColorStop(0, 'rgba(6, 182, 212, 0.3)');
      integratedGradient.addColorStop(1, 'rgba(6, 182, 212, 1)');
      
      ctx.fillStyle = integratedGradient;
      ctx.fillRect(meterX, currentY, integratedWidth, barHeight);
      
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(meterX, currentY, meterWidth, barHeight);

      // Draw "LUFS" label on top
      ctx.fillStyle = 'rgba(161, 161, 170, 0.7)';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('LUFS', width - 35, meterY - 5);

      // Update display values occasionally (every ~10 frames to reduce re-renders)
      if (animationRef.current && animationRef.current % 10 === 0) {
        setMomentary(momentaryRef.current);
        setShortTerm(shortTermRef.current);
        setIntegrated(integratedRef.current);
        setTruePeak(truePeakRef.current);
        setLra(lraRef.current);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

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

  const getColorForLufs = (lufs: number) => {
    if (lufs > -9) return 'text-red-400';
    if (lufs > -13) return 'text-cyan-400';
    if (lufs > -23) return 'text-emerald-400';
    return 'text-blue-400';
  };

  return (
    <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="text-zinc-400 text-xs tracking-wider">LOUDNESS METER</h3>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="text-zinc-500">EBU R128 / ITU-R BS.1770-4</span>
        </div>
      </div>

      {/* Canvas Meter */}
      <canvas
        ref={canvasRef}
        className="w-full rounded-lg bg-zinc-900/30 mb-3"
        style={{ width: '100%', height: '120px' }}
      />

      {/* Numerical Displays */}
      <div className="grid grid-cols-5 gap-2">
        {/* Momentary */}
        <div className="bg-zinc-900/50 rounded-lg p-2 border border-zinc-700">
          <div className="text-zinc-500 text-xs mb-1">Momentary</div>
          <div className={`text-lg tabular-nums ${getColorForLufs(momentary)}`}>
            {momentary.toFixed(1)}
          </div>
          <div className="text-zinc-600 text-xs">LUFS</div>
          <div className="text-zinc-600 text-xs mt-1">400ms</div>
        </div>

        {/* Short-term */}
        <div className="bg-zinc-900/50 rounded-lg p-2 border border-zinc-700">
          <div className="text-zinc-500 text-xs mb-1">Short-term</div>
          <div className={`text-lg tabular-nums ${getColorForLufs(shortTerm)}`}>
            {shortTerm.toFixed(1)}
          </div>
          <div className="text-zinc-600 text-xs">LUFS</div>
          <div className="text-zinc-600 text-xs mt-1">3 sec</div>
        </div>

        {/* Integrated */}
        <div className="bg-zinc-900/50 rounded-lg p-2 border border-cyan-700/50 shadow-lg shadow-cyan-500/10">
          <div className="text-cyan-400 text-xs mb-1">Integrated</div>
          <div className={`text-lg tabular-nums ${getColorForLufs(integrated)}`}>
            {integrated.toFixed(1)}
          </div>
          <div className="text-zinc-600 text-xs">LUFS</div>
          <div className="text-zinc-600 text-xs mt-1">Overall</div>
        </div>

        {/* LRA */}
        <div className="bg-zinc-900/50 rounded-lg p-2 border border-zinc-700">
          <div className="text-zinc-500 text-xs mb-1">LRA</div>
          <div className="text-lg text-emerald-400 tabular-nums">
            {lra.toFixed(1)}
          </div>
          <div className="text-zinc-600 text-xs">LU</div>
          <div className="text-zinc-600 text-xs mt-1">Range</div>
        </div>

        {/* True Peak */}
        <div className="bg-zinc-900/50 rounded-lg p-2 border border-zinc-700">
          <div className="text-zinc-500 text-xs mb-1">True Peak</div>
          <div className={`text-lg tabular-nums ${truePeak > -1 ? 'text-red-400' : 'text-emerald-400'}`}>
            {truePeak.toFixed(1)}
          </div>
          <div className="text-zinc-600 text-xs">dBTP</div>
          <div className="text-zinc-600 text-xs mt-1">Max</div>
        </div>
      </div>

      {/* Reference Standards */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        <div className="bg-zinc-900/30 rounded px-2 py-1.5 border border-emerald-700/30">
          <div className="text-xs text-emerald-400">Broadcast</div>
          <div className="text-xs text-zinc-500">-23 LUFS</div>
        </div>
        <div className="bg-zinc-900/30 rounded px-2 py-1.5 border border-cyan-700/30">
          <div className="text-xs text-cyan-400">Streaming</div>
          <div className="text-xs text-zinc-500">-14 LUFS</div>
        </div>
        <div className="bg-zinc-900/30 rounded px-2 py-1.5 border border-zinc-700/30">
          <div className="text-xs text-zinc-400">Current</div>
          <div className={`text-xs ${getColorForLufs(integrated)}`}>
            {integrated.toFixed(1)} LUFS
          </div>
        </div>
      </div>
    </div>
  );
}

import { motion } from 'framer-motion';
import { 
  Sliders, 
  Radio, 
  Waves, 
  Gauge, 
  Zap, 
  Music, 
  Volume2,
  Activity,
  BarChart3,
  Settings,
  Maximize2,
  ArrowLeft,
  PlayCircle,
  CheckCircle
} from 'lucide-react';

interface FeaturesPageProps {
  onBack: () => void;
  onGetStarted: () => void;
}

const SPECTRUM_BAR_HEIGHTS: number[] = Array.from({ length: 40 }, (_, i) => {
  const base = 40;
  const variation = (i % 5) * 8;
  return base + variation;
});

export function FeaturesPage({ onBack, onGetStarted }: FeaturesPageProps) {
  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Header */}
      <motion.header 
        className="relative z-10 px-6 py-6 border-b border-zinc-800"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              onClick={onBack}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 text-zinc-400" />
            </motion.button>
            <div>
              <h1 className="text-xl text-white">Features Overview</h1>
              <p className="text-xs text-cyan-400">Professional Audio Mastering Tools</p>
            </div>
          </div>
          <motion.button
            onClick={onGetStarted}
            className="px-6 py-2 bg-linear-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 rounded-lg text-white shadow-lg shadow-cyan-500/30 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Try Now
          </motion.button>
        </div>
      </motion.header>

      {/* Hero Section */}
      <div className="relative px-6 py-20">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1 
            className="text-5xl md:text-6xl text-white mb-6"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            Everything You Need to
            <br />
            <span className="text-transparent bg-clip-text bg-linear-gradient-to-r from-cyan-400 to-purple-400">
              Master Like a Pro
            </span>
          </motion.h1>
          <motion.p 
            className="text-xl text-zinc-400 mb-10 max-w-3xl mx-auto"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            MasterPro combines professional-grade processing tools with an intuitive interface, 
            giving you complete control over every aspect of your audio mastering workflow.
          </motion.p>
        </div>
      </div>

      {/* Feature 1: Multiband Compression */}
      <div className="relative px-6 py-20 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-linear-to-br from-cyan-500/20 to-cyan-600/20 rounded-xl flex items-center justify-center">
                  <Sliders className="w-6 h-6 text-cyan-400" />
                </div>
                <h2 className="text-3xl text-white">Multiband Compression</h2>
              </div>
              <p className="text-zinc-400 text-lg mb-6 leading-relaxed">
                Surgical precision across 5 frequency bands with independent control over each range. 
                Interactive frequency analyzer lets you see and adjust compression in real-time.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-1" />
                  <div>
                    <h4 className="text-white mb-1">5 Independent Bands</h4>
                    <p className="text-zinc-500 text-sm">LOW, LOW-MID, MID, HIGH-MID, HIGH with customizable crossover points</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-1" />
                  <div>
                    <h4 className="text-white mb-1">Interactive Analyzer</h4>
                    <p className="text-zinc-500 text-sm">Click and drag to adjust threshold and crossover frequencies visually</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-1" />
                  <div>
                    <h4 className="text-white mb-1">Real-time Visualization</h4>
                    <p className="text-zinc-500 text-sm">See gain reduction and frequency response across the full spectrum</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 hover:border-cyan-500/50 transition-all"
              initial={{ x: 50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="bg-zinc-950 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-zinc-500">20Hz - 20kHz</span>
                  <span className="text-xs text-cyan-400">Full Spectrum</span>
                </div>
                <div className="h-40 bg-linear-gradient-to-t from-cyan-500/10 to-purple-500/10 rounded-lg relative overflow-hidden">
                  {/* Simulated frequency bands */}
                  <div className="absolute inset-0 flex">
                    <motion.div 
                      className="flex-1 bg-red-500/20 border-r border-zinc-700"
                      animate={{ opacity: [0.2, 0.4, 0.2] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div 
                      className="flex-1 bg-yellow-500/20 border-r border-zinc-700"
                      animate={{ opacity: [0.3, 0.5, 0.3] }}
                      transition={{ duration: 2.2, repeat: Infinity }}
                    />
                    <motion.div 
                      className="flex-1 bg-green-500/20 border-r border-zinc-700"
                      animate={{ opacity: [0.25, 0.45, 0.25] }}
                      transition={{ duration: 2.4, repeat: Infinity }}
                    />
                    <motion.div 
                      className="flex-1 bg-blue-500/20 border-r border-zinc-700"
                      animate={{ opacity: [0.2, 0.35, 0.2] }}
                      transition={{ duration: 2.6, repeat: Infinity }}
                    />
                    <motion.div 
                      className="flex-1 bg-purple-500/20"
                      animate={{ opacity: [0.3, 0.4, 0.3] }}
                      transition={{ duration: 2.8, repeat: Infinity }}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {['LOW', 'L-MID', 'MID', 'H-MID', 'HIGH'].map((band, i) => (
                  <div key={i} className="bg-zinc-800/50 rounded px-2 py-1.5 text-center">
                    <div className="text-xs text-zinc-400">{band}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Feature 2: Spectrum Analyzer */}
      <div className="relative px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 hover:border-purple-500/50 transition-all order-2 lg:order-1"
              initial={{ x: -50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="bg-zinc-950 rounded-lg p-4">
                <div className="h-48 relative">
                  {/* Simulated spectrum bars */}
                  <div className="absolute inset-0 flex items-end gap-1">
                    {SPECTRUM_BAR_HEIGHTS.map((height, i) => (
                      <motion.div
                        key={i}
                        className="flex-1 bg-linear-to-t from-purple-500 to-cyan-500 rounded-t"
                        initial={{ height: 0 }}
                        animate={{ 
                          height: `${height}%`,
                        }}
                        transition={{
                          duration: 0.3,
                          repeat: Infinity,
                          repeatType: "reverse",
                          delay: i * 0.05
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-zinc-500">
                  <span>20Hz</span>
                  <span>1kHz</span>
                  <span>20kHz</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="order-1 lg:order-2"
              initial={{ x: 50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-linear-to-br from-purple-500/20 to-purple-600/20 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-purple-400" />
                </div>
                <h2 className="text-3xl text-white">Spectrum Analyzer</h2>
              </div>
              <p className="text-zinc-400 text-lg mb-6 leading-relaxed">
                Real-time frequency visualization from 20Hz to 20kHz with precise peak detection 
                and hold. Monitor your audio spectrum with professional-grade accuracy.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-400 shrink-0 mt-1" />
                  <div>
                    <h4 className="text-white mb-1">Full Frequency Range</h4>
                    <p className="text-zinc-500 text-sm">20Hz to 20kHz logarithmic scale display</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-400 shrink-0 mt-1" />
                  <div>
                    <h4 className="text-white mb-1">Peak Detection</h4>
                    <p className="text-zinc-500 text-sm">Automatic peak hold and decay for accurate monitoring</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-400 shrink-0 mt-1" />
                  <div>
                    <h4 className="text-white mb-1">Smooth Animation</h4>
                    <p className="text-zinc-500 text-sm">60fps real-time visualization with gradient coloring</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Feature 3: Loudness Metering */}
      <div className="relative px-6 py-20 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-linear-to-br from-emerald-500/20 to-emerald-600/20 rounded-xl flex items-center justify-center">
                  <Gauge className="w-6 h-6 text-emerald-400" />
                </div>
                <h2 className="text-3xl text-white">LUFS Loudness Metering</h2>
              </div>
              <p className="text-zinc-400 text-lg mb-6 leading-relaxed">
                Professional loudness metering compliant with EBU R128 and ITU-R BS.1770-4 standards. 
                Ensure your masters meet broadcast and streaming platform requirements.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-1" />
                  <div>
                    <h4 className="text-white mb-1">Integrated, Short-term & Momentary</h4>
                    <p className="text-zinc-500 text-sm">Complete LUFS measurements with LRA and True Peak</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-1" />
                  <div>
                    <h4 className="text-white mb-1">Broadcast Standards</h4>
                    <p className="text-zinc-500 text-sm">-23 LUFS for broadcast, -14 LUFS for streaming platforms</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-1" />
                  <div>
                    <h4 className="text-white mb-1">Visual Metering</h4>
                    <p className="text-zinc-500 text-sm">Color-coded bars and numerical displays for quick reference</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 hover:border-emerald-500/50 transition-all"
              initial={{ x: 50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="space-y-4">
                {/* Meter bars */}
                <div className="space-y-2">
                  {['Momentary', 'Short-term', 'Integrated'].map((label, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs text-zinc-400 mb-1">
                        <span>{label}</span>
                        <span className="text-cyan-400">-{(14 - i * 2).toFixed(1)} LUFS</span>
                      </div>
                      <div className="h-6 bg-zinc-950 rounded-lg overflow-hidden">
                        <motion.div
                          className={`h-full bg-linear-gradient-to-r ${
                            i === 0 ? 'from-purple-500 to-purple-600' :
                            i === 1 ? 'from-blue-500 to-blue-600' :
                            'from-cyan-500 to-cyan-600'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${60 + i * 10}%` }}
                          transition={{ duration: 1, delay: i * 0.2 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Numerical displays */}
                <div className="grid grid-cols-3 gap-3 mt-6">
                  <div className="bg-zinc-950 rounded-lg p-3 border border-cyan-700/50">
                    <div className="text-xs text-cyan-400 mb-1">Integrated</div>
                    <div className="text-xl text-white">-14.2</div>
                    <div className="text-xs text-zinc-600">LUFS</div>
                  </div>
                  <div className="bg-zinc-950 rounded-lg p-3">
                    <div className="text-xs text-zinc-500 mb-1">LRA</div>
                    <div className="text-xl text-emerald-400">6.5</div>
                    <div className="text-xs text-zinc-600">LU</div>
                  </div>
                  <div className="bg-zinc-950 rounded-lg p-3">
                    <div className="text-xs text-zinc-500 mb-1">True Peak</div>
                    <div className="text-xl text-emerald-400">-1.2</div>
                    <div className="text-xs text-zinc-600">dBTP</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="relative px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl text-white mb-4">Additional Features</h2>
            <p className="text-zinc-400 text-lg">Complete suite of professional mastering tools</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Waveform */}
            <motion.div
              className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 hover:border-cyan-500/50 rounded-2xl p-6 transition-all"
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -5 }}
            >
              <div className="w-12 h-12 bg-linear-to-br from-cyan-500/20 to-cyan-600/20 rounded-xl flex items-center justify-center mb-4">
                <Waves className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-white text-xl mb-2">Waveform Display</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                High-resolution stereo waveform visualization with real-time monitoring and playback tracking.
              </p>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                  Stereo channel display
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                  Real-time playback cursor
                </li>
              </ul>
            </motion.div>

            {/* Harmonizer */}
            <motion.div
              className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 hover:border-purple-500/50 rounded-2xl p-6 transition-all"
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -5 }}
            >
              <div className="w-12 h-12 bg-linear-to-br from-purple-500/20 to-purple-600/20 rounded-xl flex items-center justify-center mb-4">
                <Music className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-white text-xl mb-2">Harmonizer</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                Add harmonic richness and depth with adjustable harmonics control and blend amount.
              </p>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                  Odd/Even harmonic control
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                  Mix blend knob
                </li>
              </ul>
            </motion.div>

            {/* Saturation */}
            <motion.div
              className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 hover:border-emerald-500/50 rounded-2xl p-6 transition-all"
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -5 }}
            >
              <div className="w-12 h-12 bg-linear-to-br from-emerald-500/20 to-emerald-600/20 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-white text-xl mb-2">Saturation</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                Warm analog-style saturation with multiple drive modes: Tube, Tape, and Digital.
              </p>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  3 saturation types
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  Adjustable drive amount
                </li>
              </ul>
            </motion.div>

            {/* Reverb */}
            <motion.div
              className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 hover:border-blue-500/50 rounded-2xl p-6 transition-all"
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              whileHover={{ y: -5 }}
            >
              <div className="w-12 h-12 bg-linear-to-br from-blue-500/20 to-blue-600/20 rounded-xl flex items-center justify-center mb-4">
                <Radio className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-white text-xl mb-2">Reverb</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                Professional reverb with size and mix controls for adding spatial dimension to your masters.
              </p>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                  Room size control
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                  Wet/Dry mix
                </li>
              </ul>
            </motion.div>

            {/* Stereo Width */}
            <motion.div
              className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 hover:border-pink-500/50 rounded-2xl p-6 transition-all"
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              whileHover={{ y: -5 }}
            >
              <div className="w-12 h-12 bg-linear-to-br from-pink-500/20 to-pink-600/20 rounded-xl flex items-center justify-center mb-4">
                <Maximize2 className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="text-white text-xl mb-2">Stereo Width</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                Precise stereo field control from mono to ultra-wide with phase correlation metering.
              </p>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-pink-400 rounded-full" />
                  0-200% width range
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-pink-400 rounded-full" />
                  Phase correlation meter
                </li>
              </ul>
            </motion.div>

            {/* VU Meters */}
            <motion.div
              className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 hover:border-orange-500/50 rounded-2xl p-6 transition-all"
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.6 }}
              whileHover={{ y: -5 }}
            >
              <div className="w-12 h-12 bg-linear-to-br from-orange-500/20 to-orange-600/20 rounded-xl flex items-center justify-center mb-4">
                <Activity className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-white text-xl mb-2">VU Meters</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                Classic analog-style VU meters with peak hold and RMS averaging for accurate level monitoring.
              </p>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
                  Stereo L/R meters
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
                  Peak hold indicators
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Technical Specs */}
      <div className="relative px-6 py-20 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl text-white mb-4">Technical Specifications</h2>
            <p className="text-zinc-400 text-lg">Professional-grade performance</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl p-6 text-center"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, type: "spring" }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-3xl text-cyan-400 mb-2">32-bit</div>
              <div className="text-zinc-400 text-sm">Float Processing</div>
            </motion.div>

            <motion.div
              className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl p-6 text-center"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1, type: "spring" }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-3xl text-purple-400 mb-2">192kHz</div>
              <div className="text-zinc-400 text-sm">Sample Rate</div>
            </motion.div>

            <motion.div
              className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl p-6 text-center"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-3xl text-emerald-400 mb-2">0ms</div>
              <div className="text-zinc-400 text-sm">Latency</div>
            </motion.div>

            <motion.div
              className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl p-6 text-center"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3, type: "spring" }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-3xl text-blue-400 mb-2">60fps</div>
              <div className="text-zinc-400 text-sm">Visual Updates</div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="relative px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 
            className="text-4xl text-white mb-6"
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Ready to Experience These Features?
          </motion.h2>
          <motion.p 
            className="text-zinc-400 text-lg mb-10"
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Start mastering your audio like a professional today
          </motion.p>
          <motion.button
            onClick={onGetStarted}
            className="px-10 py-5 bg-linear-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 rounded-xl text-white text-lg shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all flex items-center justify-center gap-3 mx-auto"
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4, type: "spring" }}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.98 }}
          >
            <PlayCircle className="w-6 h-6" />
            Get Started Now
          </motion.button>
        </div>
      </div>
    </div>
  );
}

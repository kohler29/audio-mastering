import { Zap, Sliders, Radio, Waves, Gauge, AudioWaveform, Play, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface LandingPageProps {
  onGetStarted: () => void;
  onViewFeatures: () => void;
  onViewAbout: () => void;
  onViewSupport: () => void;
  onViewDocumentation: () => void;
}

export function LandingPage({ onGetStarted, onViewFeatures, onViewAbout, onViewSupport, onViewDocumentation }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-950 overflow-hidden">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            className="absolute -top-1/2 -left-1/2 w-full h-full bg-cyan-500/5 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-purple-500/5 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />
          
          {/* Floating Orbs */}
          <motion.div
            className="absolute top-1/4 left-1/4 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl"
            animate={{
              y: [-20, 20, -20],
              x: [-10, 10, -10],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl"
            animate={{
              y: [20, -20, 20],
              x: [10, -10, 10],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        {/* Header */}
        <motion.header 
          className="relative z-10 px-6 py-6"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
            >
              <div className="relative">
                <motion.div 
                  className="absolute inset-0 bg-cyan-500/30 blur-xl rounded-full"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <AudioWaveform className="w-8 h-8 text-cyan-400 relative" />
              </div>
              <div>
                <h1 className="text-xl text-white">MasterPro</h1>
                <p className="text-xs text-cyan-400">Audio Mastering Suite</p>
              </div>
            </motion.div>
            <motion.button
              onClick={onGetStarted}
              className="px-4 py-2 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-cyan-500/50 rounded-lg text-zinc-300 hover:text-cyan-400 transition-all text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Sign In
            </motion.button>
          </div>
        </motion.header>

        {/* Hero Content */}
        <div className="relative z-10 px-6 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full mb-6"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Zap className="w-4 h-4 text-cyan-400" />
              </motion.div>
              <span className="text-cyan-400 text-sm">Professional Audio Mastering</span>
            </motion.div>
            
            <motion.h1 
              className="text-5xl md:text-7xl text-white mb-6"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              Master Your Sound
              <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-purple-400">
                Like a Pro
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              Professional-grade audio mastering plugin with advanced multiband compression, 
              real-time spectrum analysis, and LUFS loudness metering.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              <motion.button
                onClick={onGetStarted}
                className="group px-8 py-4 bg-linear-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 rounded-xl text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all flex items-center justify-center gap-2"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Play className="w-5 h-5" />
                Get Started
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              </motion.button>
              
              <motion.button 
                onClick={onViewFeatures}
                className="px-8 py-4 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-cyan-500/50 rounded-xl text-zinc-300 hover:text-cyan-400 transition-all"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                View Features
              </motion.button>
            </motion.div>
          </div>
        </div>

        {/* Feature Preview Cards */}
        <div className="relative z-10 px-6 pb-20">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Real-time Processing */}
            <motion.div 
              className="group bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 hover:border-cyan-500/50 rounded-2xl p-6 transition-all hover:shadow-xl hover:shadow-cyan-500/10"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
            >
              <motion.div 
                className="w-12 h-12 bg-linear-to-br from-cyan-500/20 to-cyan-600/20 rounded-xl flex items-center justify-center mb-4"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Waves className="w-6 h-6 text-cyan-400" />
              </motion.div>
              <h3 className="text-white text-lg mb-2">Real-time Processing</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Process your audio in real-time with zero-latency monitoring and instant visual feedback.
              </p>
            </motion.div>

            {/* Advanced Metering */}
            <motion.div 
              className="group bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 hover:border-purple-500/50 rounded-2xl p-6 transition-all hover:shadow-xl hover:shadow-purple-500/10"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.1 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
            >
              <motion.div 
                className="w-12 h-12 bg-linear-to-br from-purple-500/20 to-purple-600/20 rounded-xl flex items-center justify-center mb-4"
                whileHover={{ scale: 1.1, rotate: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Gauge className="w-6 h-6 text-purple-400" />
              </motion.div>
              <h3 className="text-white text-lg mb-2">Advanced Metering</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Professional LUFS loudness metering compliant with EBU R128 and ITU-R BS.1770-4 standards.
              </p>
            </motion.div>

            {/* Multiband Compression */}
            <motion.div 
              className="group bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 hover:border-emerald-500/50 rounded-2xl p-6 transition-all hover:shadow-xl hover:shadow-emerald-500/10"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.3 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
            >
              <motion.div 
                className="w-12 h-12 bg-linear-to-br from-emerald-500/20 to-emerald-600/20 rounded-xl flex items-center justify-center mb-4"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Sliders className="w-6 h-6 text-emerald-400" />
              </motion.div>
              <h3 className="text-white text-lg mb-2">Multiband Compression</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                5-band compressor with interactive frequency analyzer and independent band control.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 px-6 py-20 bg-zinc-900/30">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            <motion.h2 
              className="text-4xl text-white mb-4"
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              Complete Mastering Suite
            </motion.h2>
            <motion.p 
              className="text-zinc-400 text-lg"
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Everything you need for professional audio mastering
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <motion.div 
                className="flex gap-4"
                initial={{ x: -50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                whileHover={{ x: 10 }}
              >
                <motion.div 
                  className="shrink-0 w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <Radio className="w-5 h-5 text-cyan-400" />
                </motion.div>
                <div>
                  <h3 className="text-white mb-2">Spectrum Analyzer</h3>
                  <p className="text-zinc-400 text-sm">
                    Full-range 20Hz-20kHz spectrum analyzer with real-time frequency visualization and peak detection.
                  </p>
                </div>
              </motion.div>

              <motion.div 
                className="flex gap-4"
                initial={{ x: -50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                whileHover={{ x: 10 }}
              >
                <motion.div 
                  className="shrink-0 w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center"
                  whileHover={{ scale: 1.1, rotate: -5 }}
                >
                  <Waves className="w-5 h-5 text-purple-400" />
                </motion.div>
                <div>
                  <h3 className="text-white mb-2">Waveform Display</h3>
                  <p className="text-zinc-400 text-sm">
                    High-resolution waveform visualization with stereo imaging and phase correlation metering.
                  </p>
                </div>
              </motion.div>

              <motion.div 
                className="flex gap-4"
                initial={{ x: -50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                whileHover={{ x: 10 }}
              >
                <motion.div 
                  className="shrink-0 w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <Sliders className="w-5 h-5 text-emerald-400" />
                </motion.div>
                <div>
                  <h3 className="text-white mb-2">Dynamic Processing</h3>
                  <p className="text-zinc-400 text-sm">
                    Advanced compressor and limiter with sidechain filtering and lookahead capabilities.
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <motion.div 
                className="flex gap-4"
                initial={{ x: 50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                whileHover={{ x: -10 }}
              >
                <motion.div 
                  className="shrink-0 w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center"
                  whileHover={{ scale: 1.1, rotate: -5 }}
                >
                  <Zap className="w-5 h-5 text-blue-400" />
                </motion.div>
                <div>
                  <h3 className="text-white mb-2">Harmonizer & Saturation</h3>
                  <p className="text-zinc-400 text-sm">
                    Add warmth and character with tube, tape, and digital saturation algorithms.
                  </p>
                </div>
              </motion.div>

              <motion.div 
                className="flex gap-4"
                initial={{ x: 50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                whileHover={{ x: -10 }}
              >
                <motion.div 
                  className="shrink-0 w-10 h-10 bg-pink-500/10 rounded-lg flex items-center justify-center"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <Radio className="w-5 h-5 text-pink-400" />
                </motion.div>
                <div>
                  <h3 className="text-white mb-2">Reverb & Spatial</h3>
                  <p className="text-zinc-400 text-sm">
                    Professional reverb with stereo width control for dimensional enhancement.
                  </p>
                </div>
              </motion.div>

              <motion.div 
                className="flex gap-4"
                initial={{ x: 50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                whileHover={{ x: -10 }}
              >
                <motion.div 
                  className="shrink-0 w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center"
                  whileHover={{ scale: 1.1, rotate: -5 }}
                >
                  <Gauge className="w-5 h-5 text-orange-400" />
                </motion.div>
                <div>
                  <h3 className="text-white mb-2">VU Meters</h3>
                  <p className="text-zinc-400 text-sm">
                    Classic VU meters with peak hold and RMS averaging for accurate level monitoring.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="relative z-10 px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, type: "spring" }}
              whileHover={{ scale: 1.1, y: -5 }}
            >
              <motion.div 
                className="text-4xl text-cyan-400 mb-2"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
              >
                5
              </motion.div>
              <div className="text-zinc-400 text-sm">Frequency Bands</div>
            </motion.div>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1, type: "spring" }}
              whileHover={{ scale: 1.1, y: -5 }}
            >
              <motion.div 
                className="text-4xl text-purple-400 mb-2"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.1 }}
              >
                20k
              </motion.div>
              <div className="text-zinc-400 text-sm">Max Frequency</div>
            </motion.div>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
              whileHover={{ scale: 1.1, y: -5 }}
            >
              <motion.div 
                className="text-4xl text-emerald-400 mb-2"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.2 }}
              >
                60dB
              </motion.div>
              <div className="text-zinc-400 text-sm">Dynamic Range</div>
            </motion.div>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3, type: "spring" }}
              whileHover={{ scale: 1.1, y: -5 }}
            >
              <motion.div 
                className="text-4xl text-blue-400 mb-2"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.3 }}
              >
                0ms
              </motion.div>
              <div className="text-zinc-400 text-sm">Latency</div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="relative z-10 px-6 py-20 bg-linear-to-br from-zinc-900/50 to-zinc-950/50">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.h2 
              className="text-4xl text-white mb-4"
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              Trusted by Professionals
            </motion.h2>
            <motion.p 
              className="text-zinc-400 text-lg"
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              See what audio engineers and producers are saying about MasterPro
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Testimonial 1 */}
            <motion.div
              className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 hover:border-cyan-500/50 rounded-2xl p-6 transition-all hover:shadow-xl hover:shadow-cyan-500/10"
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.3 + i * 0.1 }}
                  >
                    <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  </motion.div>
                ))}
              </div>
              <p className="text-zinc-300 mb-4 leading-relaxed">
                &quot;MasterPro completely transformed my workflow. The multiband compression is incredibly precise, and the LUFS metering ensures my tracks are broadcast-ready every time.&quot;
              </p>
              <div className="flex items-center gap-3">
                <motion.div 
                  className="w-12 h-12 bg-linear-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <span className="text-white">SM</span>
                </motion.div>
                <div>
                  <div className="text-white">Sarah Mitchell</div>
                  <div className="text-zinc-500 text-sm">Mastering Engineer</div>
                </div>
              </div>
            </motion.div>

            {/* Testimonial 2 */}
            <motion.div
              className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 hover:border-purple-500/50 rounded-2xl p-6 transition-all hover:shadow-xl hover:shadow-purple-500/10"
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.4 + i * 0.1 }}
                  >
                    <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  </motion.div>
                ))}
              </div>
              <p className="text-zinc-300 mb-4 leading-relaxed">
                &quot;The real-time spectrum analyzer and intuitive controls make this the best mastering tool I&apos;ve used. It&apos;s like having a professional mastering suite right in my DAW.&quot;
              </p>
              <div className="flex items-center gap-3">
                <motion.div 
                  className="w-12 h-12 bg-linear-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center"
                  whileHover={{ scale: 1.1, rotate: -5 }}
                >
                  <span className="text-white">JC</span>
                </motion.div>
                <div>
                  <div className="text-white">James Chen</div>
                  <div className="text-zinc-500 text-sm">Music Producer</div>
                </div>
              </div>
            </motion.div>

            {/* Testimonial 3 */}
            <motion.div
              className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 hover:border-emerald-500/50 rounded-2xl p-6 transition-all hover:shadow-xl hover:shadow-emerald-500/10"
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.5 + i * 0.1 }}
                  >
                    <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  </motion.div>
                ))}
              </div>
              <p className="text-zinc-300 mb-4 leading-relaxed">
                &quot;Outstanding plugin! The harmonizer and saturation add that professional warmth I was missing. My mixes have never sounded this polished and radio-ready.&quot;
              </p>
              <div className="flex items-center gap-3">
                <motion.div 
                  className="w-12 h-12 bg-linear-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <span className="text-white">AR</span>
                </motion.div>
                <div>
                  <div className="text-white">Alex Rodriguez</div>
                  <div className="text-zinc-500 text-sm">Audio Engineer</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Additional Testimonials Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Testimonial 4 */}
            <motion.div
              className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 hover:border-blue-500/50 rounded-2xl p-6 transition-all hover:shadow-xl hover:shadow-blue-500/10"
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.6 + i * 0.1 }}
                  >
                    <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  </motion.div>
                ))}
              </div>
              <p className="text-zinc-300 mb-4 leading-relaxed">
                &quot;The stereo width control and VU meters give me complete control over my soundstage. This plugin has become an essential part of my mastering chain.&quot;
              </p>
              <div className="flex items-center gap-3">
                <motion.div 
                  className="w-12 h-12 bg-linear-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center"
                  whileHover={{ scale: 1.1, rotate: -5 }}
                >
                  <span className="text-white">MK</span>
                </motion.div>
                <div>
                  <div className="text-white">Maya Kim</div>
                  <div className="text-zinc-500 text-sm">Mixing Engineer</div>
                </div>
              </div>
            </motion.div>

            {/* Testimonial 5 */}
            <motion.div
              className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 hover:border-pink-500/50 rounded-2xl p-6 transition-all hover:shadow-xl hover:shadow-pink-500/10"
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.7 + i * 0.1 }}
                  >
                    <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  </motion.div>
                ))}
              </div>
              <p className="text-zinc-300 mb-4 leading-relaxed">
                &quot;Incredible value and performance! The interactive frequency analyzer helps me make precise decisions, and my tracks are hitting streaming platform targets perfectly.&quot;
              </p>
              <div className="flex items-center gap-3">
                <motion.div 
                  className="w-12 h-12 bg-linear-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <span className="text-white">DT</span>
                </motion.div>
                <div>
                  <div className="text-white">David Thompson</div>
                  <div className="text-zinc-500 text-sm">Studio Owner</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Trust Badges */}
          <motion.div
            className="mt-12 flex flex-wrap justify-center items-center gap-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <motion.div 
              className="flex items-center gap-2 text-zinc-400"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm">10,000+ Users</span>
            </motion.div>
            <motion.div 
              className="flex items-center gap-2 text-zinc-400"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <span className="text-sm">4.9/5 Rating</span>
            </motion.div>
            <motion.div 
              className="flex items-center gap-2 text-zinc-400"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm">Industry Standard</span>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 px-6 py-20 bg-linear-to-br from-cyan-950/20 to-purple-950/20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 
            className="text-4xl text-white mb-6"
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Ready to Master Your Sound?
          </motion.h2>
          <motion.p 
            className="text-zinc-400 text-lg mb-10"
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Join thousands of producers and engineers using MasterPro for professional audio mastering.
          </motion.p>
          <motion.button
            onClick={onGetStarted}
            className="group px-10 py-5 bg-linear-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 rounded-xl text-white text-lg shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all flex items-center justify-center gap-3 mx-auto"
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4, type: "spring" }}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.98 }}
          >
            <Play className="w-6 h-6" />
            Start Mastering Now
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowRight className="w-6 h-6" />
            </motion.div>
          </motion.button>
        </div>
      </div>

      {/* Footer */}
      <motion.footer 
        className="relative z-10 px-6 py-8 border-t border-zinc-800"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
          >
            <AudioWaveform className="w-6 h-6 text-cyan-400" />
            <span className="text-zinc-400 text-sm">© 2025 MasterPro. Professional Audio Mastering.</span>
          </motion.div>
          <div className="flex gap-6 text-sm text-zinc-400">
            <motion.button onClick={onViewFeatures} className="hover:text-cyan-400 transition-colors" whileHover={{ y: -2 }}>Features</motion.button>
            <motion.button onClick={onViewDocumentation} className="hover:text-cyan-400 transition-colors" whileHover={{ y: -2 }}>Documentation</motion.button>
            <motion.button onClick={onViewSupport} className="hover:text-cyan-400 transition-colors" whileHover={{ y: -2 }}>Support</motion.button>
            <motion.button onClick={onViewAbout} className="hover:text-cyan-400 transition-colors" whileHover={{ y: -2 }}>About</motion.button>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}

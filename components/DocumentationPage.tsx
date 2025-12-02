import { motion } from 'framer-motion';
import { useState } from 'react';
import { 
  ArrowLeft,
  BookOpen,
  Search,
  ChevronRight,
  Home,
  Sliders,
  BarChart3,
  Gauge,
  Download,
  Keyboard,
  AlertCircle,
  Lightbulb,
  Play,
  Settings,
  Zap,
  Radio,
  Music,
  Maximize2,
  Activity,
  FileText,
  CheckCircle,
  Copy
} from 'lucide-react';

interface DocumentationPageProps {
  onBack: () => void;
  onGetStarted: () => void;
}

export function DocumentationPage({ onBack, onGetStarted }: DocumentationPageProps) {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');

  const menuItems = [
    { id: 'getting-started', icon: Home, label: 'Getting Started', color: 'cyan' },
    { id: 'multiband-compressor', icon: Sliders, label: 'Multiband Compressor', color: 'purple' },
    { id: 'spectrum-analyzer', icon: BarChart3, label: 'Spectrum Analyzer', color: 'emerald' },
    { id: 'lufs-metering', icon: Gauge, label: 'LUFS Metering', color: 'blue' },
    { id: 'audio-effects', icon: Zap, label: 'Audio Effects', color: 'orange' },
    { id: 'export-options', icon: Download, label: 'Export Options', color: 'pink' },
    { id: 'keyboard-shortcuts', icon: Keyboard, label: 'Keyboard Shortcuts', color: 'yellow' },
    { id: 'best-practices', icon: Lightbulb, label: 'Best Practices', color: 'green' },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Header */}
      <motion.header 
        className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800"
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
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              <h1 className="text-xl text-white">Documentation</h1>
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

      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <motion.aside 
              className="lg:col-span-1"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <div className="lg:sticky lg:top-24 space-y-6">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search docs..."
                    className="w-full pl-10 pr-4 py-2 bg-zinc-900/50 border border-zinc-800 focus:border-cyan-500/50 rounded-lg text-white text-sm placeholder:text-zinc-500 outline-none transition-all"
                  />
                </div>

                {/* Navigation */}
                <nav className="space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    return (
                      <motion.button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left ${
                          isActive 
                            ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400' 
                            : 'text-zinc-400 hover:bg-zinc-800/50 border border-transparent'
                        }`}
                        whileHover={{ x: 5 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-zinc-500'}`} />
                        <span className="text-sm">{item.label}</span>
                        {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                      </motion.button>
                    );
                  })}
                </nav>
              </div>
            </motion.aside>

            {/* Main Content */}
            <motion.main 
              className="lg:col-span-3"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
                <Home className="w-4 h-4" />
                <ChevronRight className="w-4 h-4" />
                <span className="text-cyan-400">
                  {menuItems.find(item => item.id === activeSection)?.label}
                </span>
              </div>

              {/* Content based on active section */}
              {activeSection === 'getting-started' && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-4xl text-white mb-4">Getting Started with MasterPro</h1>
                    <p className="text-zinc-400 text-lg leading-relaxed">
                      Welcome to MasterPro! This guide will help you get started with professional audio mastering 
                      in just a few simple steps.
                    </p>
                  </div>

                  {/* Quick Start */}
                  <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                        <Play className="w-5 h-5 text-cyan-400" />
                      </div>
                      <h2 className="text-2xl text-white">Quick Start</h2>
                    </div>
                    <div className="space-y-6">
                      <div className="flex gap-4">
                        <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center shrink-0 text-cyan-400">
                          1
                        </div>
                        <div>
                          <h3 className="text-white mb-2">Create an Account</h3>
                          <p className="text-zinc-400 text-sm leading-relaxed">
                            Sign up for a free account to access MasterPro. You&apos;ll get instant access to all 
                            essential mastering tools with no credit card required.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center shrink-0 text-cyan-400">
                          2
                        </div>
                        <div>
                          <h3 className="text-white mb-2">Load Your Audio</h3>
                          <p className="text-zinc-400 text-sm leading-relaxed">
                            Click the &quot;Load Audio&quot; button and select your audio file. Supported formats: WAV, MP3, 
                            FLAC, AIFF, OGG. Maximum file size: 100MB (free) / Unlimited (pro).
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center shrink-0 text-cyan-400">
                          3
                        </div>
                        <div>
                          <h3 className="text-white mb-2">Apply Processing</h3>
                          <p className="text-zinc-400 text-sm leading-relaxed">
                            Use our professional tools to shape your sound. Start with a preset or create your 
                            own custom chain. All processing happens in real-time.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center shrink-0 text-cyan-400">
                          4
                        </div>
                        <div>
                          <h3 className="text-white mb-2">Export Your Master</h3>
                          <p className="text-zinc-400 text-sm leading-relaxed">
                            When you&apos;re satisfied with the sound, click &quot;Export&quot; and choose your desired format 
                            and quality settings. Your mastered file will be ready in seconds.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* System Requirements */}
                  <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl p-6">
                    <h2 className="text-2xl text-white mb-4">System Requirements</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-cyan-400 mb-3">Recommended</h3>
                        <ul className="space-y-2 text-zinc-400 text-sm">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                            Modern web browser (Chrome, Firefox, Edge, Safari)
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                            4GB+ RAM for optimal performance
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                            Stable internet connection
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                            Screen resolution 1280x720 or higher
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h3 className="text-purple-400 mb-3">Audio Interface</h3>
                        <ul className="space-y-2 text-zinc-400 text-sm">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                            Quality headphones or studio monitors
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                            Audio interface (optional but recommended)
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                            Acoustically treated room (for critical listening)
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'multiband-compressor' && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-4xl text-white mb-4">Multiband Compressor</h1>
                    <p className="text-zinc-400 text-lg leading-relaxed">
                      The Multiband Compressor is one of the most powerful tools in MasterPro, allowing you to 
                      apply different compression settings to different frequency ranges.
                    </p>
                  </div>

                  {/* Overview */}
                  <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl p-6">
                    <h2 className="text-2xl text-white mb-4">Overview</h2>
                    <p className="text-zinc-400 leading-relaxed mb-4">
                      The Multiband Compressor splits your audio into 5 frequency bands and applies independent 
                      compression to each band. This allows for precise control over your mix&apos;s dynamics across 
                      the entire frequency spectrum.
                    </p>
                    
                    <div className="bg-zinc-950 rounded-lg p-4 my-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-zinc-500">Frequency Bands</span>
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        <div className="bg-red-500/10 border border-red-500/30 rounded p-2 text-center">
                          <div className="text-red-400 text-xs mb-1">LOW</div>
                          <div className="text-zinc-400 text-xs">20-250Hz</div>
                        </div>
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2 text-center">
                          <div className="text-yellow-400 text-xs mb-1">LOW-MID</div>
                          <div className="text-zinc-400 text-xs">250-1kHz</div>
                        </div>
                        <div className="bg-green-500/10 border border-green-500/30 rounded p-2 text-center">
                          <div className="text-green-400 text-xs mb-1">MID</div>
                          <div className="text-zinc-400 text-xs">1-4kHz</div>
                        </div>
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2 text-center">
                          <div className="text-blue-400 text-xs mb-1">HIGH-MID</div>
                          <div className="text-zinc-400 text-xs">4-8kHz</div>
                        </div>
                        <div className="bg-purple-500/10 border border-purple-500/30 rounded p-2 text-center">
                          <div className="text-purple-400 text-xs mb-1">HIGH</div>
                          <div className="text-zinc-400 text-xs">8-20kHz</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl p-6">
                    <h2 className="text-2xl text-white mb-4">Controls</h2>
                    <div className="space-y-4">
                      <div className="border-l-2 border-cyan-500 pl-4">
                        <h3 className="text-white mb-2">Threshold</h3>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                          Sets the level at which compression begins. Signals above this level will be compressed. 
                          Range: -60dB to 0dB. Click and drag on the analyzer to adjust visually.
                        </p>
                      </div>

                      <div className="border-l-2 border-purple-500 pl-4">
                        <h3 className="text-white mb-2">Ratio</h3>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                          Controls how much compression is applied. Higher ratios = more compression. 
                          Range: 1:1 (no compression) to 20:1 (heavy limiting).
                        </p>
                      </div>

                      <div className="border-l-2 border-emerald-500 pl-4">
                        <h3 className="text-white mb-2">Attack</h3>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                          How quickly the compressor responds to signals above the threshold. 
                          Fast attack (1-10ms) for transient control, slow attack (20-100ms) for preserving punch.
                        </p>
                      </div>

                      <div className="border-l-2 border-blue-500 pl-4">
                        <h3 className="text-white mb-2">Release</h3>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                          How quickly the compressor stops working after the signal drops below threshold. 
                          Range: 10ms to 2000ms.
                        </p>
                      </div>

                      <div className="border-l-2 border-orange-500 pl-4">
                        <h3 className="text-white mb-2">Gain</h3>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                          Makeup gain to compensate for level reduction from compression. 
                          Range: -12dB to +12dB.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tips */}
                  <div className="bg-linear-to-br from-cyan-950/20 to-purple-950/20 border border-cyan-500/20 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Lightbulb className="w-5 h-5 text-cyan-400" />
                      <h3 className="text-white">Pro Tips</h3>
                    </div>
                    <ul className="space-y-2 text-zinc-400 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400">•</span>
                        Start with gentle ratios (2:1 to 4:1) and gradually increase if needed
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400">•</span>
                        Use the analyzer&apos;s drag functionality to adjust crossover points between bands
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400">•</span>
                        Solo individual bands to hear how compression affects each frequency range
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400">•</span>
                        Watch the gain reduction meters to ensure you&apos;re not over-compressing
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {activeSection === 'spectrum-analyzer' && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-4xl text-white mb-4">Spectrum Analyzer</h1>
                    <p className="text-zinc-400 text-lg leading-relaxed">
                      The Spectrum Analyzer provides real-time visualization of your audio&apos;s frequency content, 
                      helping you make informed decisions about your processing.
                    </p>
                  </div>

                  <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl p-6">
                    <h2 className="text-2xl text-white mb-4">Features</h2>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-cyan-400 mb-2">Real-time Analysis</h3>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                          60fps visualization updates showing frequency content from 20Hz to 20kHz on a logarithmic scale.
                        </p>
                      </div>
                      <div>
                        <h3 className="text-purple-400 mb-2">Peak Hold</h3>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                          Captures and displays peak levels with automatic decay, making it easy to identify 
                          resonances and problem frequencies.
                        </p>
                      </div>
                      <div>
                        <h3 className="text-emerald-400 mb-2">Gradient Display</h3>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                          Color-coded visualization from purple (low) to cyan (high) for easy frequency identification.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'lufs-metering' && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-4xl text-white mb-4">LUFS Metering</h1>
                    <p className="text-zinc-400 text-lg leading-relaxed">
                      Professional loudness metering compliant with EBU R128 and ITU-R BS.1770-4 standards.
                    </p>
                  </div>

                  <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl p-6">
                    <h2 className="text-2xl text-white mb-4">Understanding LUFS</h2>
                    <p className="text-zinc-400 leading-relaxed mb-4">
                      LUFS (Loudness Units Full Scale) measures perceived loudness rather than peak levels. 
                      This is crucial for meeting broadcast and streaming platform requirements.
                    </p>

                    <div className="bg-zinc-950 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400 text-sm">Streaming (Spotify, Apple Music)</span>
                        <span className="text-cyan-400">-14 LUFS</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400 text-sm">YouTube</span>
                        <span className="text-purple-400">-13 to -15 LUFS</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400 text-sm">Broadcast (TV/Radio)</span>
                        <span className="text-emerald-400">-23 LUFS</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400 text-sm">Mastering Target</span>
                        <span className="text-orange-400">-8 to -12 LUFS</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl p-6">
                    <h2 className="text-2xl text-white mb-4">Meter Types</h2>
                    <div className="space-y-4">
                      <div className="border-l-2 border-cyan-500 pl-4">
                        <h3 className="text-white mb-2">Integrated LUFS</h3>
                        <p className="text-zinc-400 text-sm">
                          Overall loudness of the entire program. This is the primary target for mastering.
                        </p>
                      </div>
                      <div className="border-l-2 border-purple-500 pl-4">
                        <h3 className="text-white mb-2">Short-term LUFS</h3>
                        <p className="text-zinc-400 text-sm">
                          Loudness over the last 3 seconds. Useful for monitoring dynamic changes.
                        </p>
                      </div>
                      <div className="border-l-2 border-emerald-500 pl-4">
                        <h3 className="text-white mb-2">Momentary LUFS</h3>
                        <p className="text-zinc-400 text-sm">
                          Loudness over the last 400ms. Shows instant loudness fluctuations.
                        </p>
                      </div>
                      <div className="border-l-2 border-blue-500 pl-4">
                        <h3 className="text-white mb-2">LRA (Loudness Range)</h3>
                        <p className="text-zinc-400 text-sm">
                          Measures dynamic range. Lower values = more compressed, higher values = more dynamic.
                        </p>
                      </div>
                      <div className="border-l-2 border-orange-500 pl-4">
                        <h3 className="text-white mb-2">True Peak</h3>
                        <p className="text-zinc-400 text-sm">
                          Actual peak level including inter-sample peaks. Should stay below -1.0 dBTP for streaming.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'audio-effects' && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-4xl text-white mb-4">Audio Effects</h1>
                    <p className="text-zinc-400 text-lg leading-relaxed">
                      MasterPro includes a comprehensive suite of audio effects for professional mastering.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Zap className="w-6 h-6 text-emerald-400" />
                        <h2 className="text-xl text-white">Saturation</h2>
                      </div>
                      <p className="text-zinc-400 text-sm mb-4">
                        Adds harmonic warmth and character. Choose from Tube, Tape, or Digital modes.
                      </p>
                      <div className="text-xs text-zinc-500">
                        Controls: Drive, Mix
                      </div>
                    </div>

                    <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Radio className="w-6 h-6 text-blue-400" />
                        <h2 className="text-xl text-white">Reverb</h2>
                      </div>
                      <p className="text-zinc-400 text-sm mb-4">
                        Professional reverb for adding spatial dimension and depth.
                      </p>
                      <div className="text-xs text-zinc-500">
                        Controls: Size, Mix
                      </div>
                    </div>

                    <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Music className="w-6 h-6 text-purple-400" />
                        <h2 className="text-xl text-white">Harmonizer</h2>
                      </div>
                      <p className="text-zinc-400 text-sm mb-4">
                        Adds harmonic richness with adjustable odd/even harmonics.
                      </p>
                      <div className="text-xs text-zinc-500">
                        Controls: Harmonics, Mix
                      </div>
                    </div>

                    <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Maximize2 className="w-6 h-6 text-pink-400" />
                        <h2 className="text-xl text-white">Stereo Width</h2>
                      </div>
                      <p className="text-zinc-400 text-sm mb-4">
                        Control stereo field from mono to ultra-wide with phase metering.
                      </p>
                      <div className="text-xs text-zinc-500">
                        Controls: Width (0-200%)
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'export-options' && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-4xl text-white mb-4">Export Options</h1>
                    <p className="text-zinc-400 text-lg leading-relaxed">
                      Export your mastered audio in various formats and quality settings.
                    </p>
                  </div>

                  <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl p-6">
                    <h2 className="text-2xl text-white mb-4">Supported Formats</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-zinc-950 rounded-lg p-4">
                        <h3 className="text-cyan-400 mb-2">WAV</h3>
                        <p className="text-zinc-500 text-sm">Uncompressed, highest quality</p>
                      </div>
                      <div className="bg-zinc-950 rounded-lg p-4">
                        <h3 className="text-purple-400 mb-2">MP3</h3>
                        <p className="text-zinc-500 text-sm">Compressed, universal compatibility</p>
                      </div>
                      <div className="bg-zinc-950 rounded-lg p-4">
                        <h3 className="text-emerald-400 mb-2">FLAC</h3>
                        <p className="text-zinc-500 text-sm">Lossless compression</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl p-6">
                    <h2 className="text-2xl text-white mb-4">Quality Settings</h2>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-white mb-2">Bit Depth</h3>
                        <div className="flex gap-3">
                          <span className="px-3 py-1 bg-zinc-800 rounded text-sm text-zinc-400">16-bit</span>
                          <span className="px-3 py-1 bg-zinc-800 rounded text-sm text-zinc-400">24-bit</span>
                          <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded text-sm text-cyan-400">32-bit</span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-white mb-2">Sample Rate</h3>
                        <div className="flex gap-3 flex-wrap">
                          <span className="px-3 py-1 bg-zinc-800 rounded text-sm text-zinc-400">44.1kHz</span>
                          <span className="px-3 py-1 bg-zinc-800 rounded text-sm text-zinc-400">48kHz</span>
                          <span className="px-3 py-1 bg-zinc-800 rounded text-sm text-zinc-400">88.2kHz</span>
                          <span className="px-3 py-1 bg-zinc-800 rounded text-sm text-zinc-400">96kHz</span>
                          <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded text-sm text-cyan-400">192kHz</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'keyboard-shortcuts' && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-4xl text-white mb-4">Keyboard Shortcuts</h1>
                    <p className="text-zinc-400 text-lg leading-relaxed">
                      Speed up your workflow with these keyboard shortcuts.
                    </p>
                  </div>

                  <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-zinc-950">
                        <tr>
                          <th className="px-6 py-4 text-left text-cyan-400 text-sm">Action</th>
                          <th className="px-6 py-4 text-left text-cyan-400 text-sm">Shortcut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800">
                        {[
                          { action: 'Play/Pause', shortcut: 'Space' },
                          { action: 'Load Audio', shortcut: 'Ctrl/Cmd + O' },
                          { action: 'Export Audio', shortcut: 'Ctrl/Cmd + E' },
                          { action: 'Save Preset', shortcut: 'Ctrl/Cmd + S' },
                          { action: 'Toggle Bypass', shortcut: 'B' },
                          { action: 'Reset All', shortcut: 'Ctrl/Cmd + R' },
                          { action: 'Undo', shortcut: 'Ctrl/Cmd + Z' },
                          { action: 'Redo', shortcut: 'Ctrl/Cmd + Shift + Z' },
                        ].map((item, i) => (
                          <tr key={i} className="hover:bg-zinc-800/30">
                            <td className="px-6 py-4 text-zinc-300">{item.action}</td>
                            <td className="px-6 py-4">
                              <code className="px-3 py-1 bg-zinc-950 border border-zinc-700 rounded text-cyan-400 text-sm">
                                {item.shortcut}
                              </code>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeSection === 'best-practices' && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-4xl text-white mb-4">Best Practices</h1>
                    <p className="text-zinc-400 text-lg leading-relaxed">
                      Tips and techniques for getting the best results from MasterPro.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-linear-to-br from-cyan-950/20 to-blue-950/20 border border-cyan-500/20 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Lightbulb className="w-6 h-6 text-cyan-400" />
                        <h2 className="text-xl text-white">General Tips</h2>
                      </div>
                      <ul className="space-y-3 text-zinc-400 text-sm">
                        <li className="flex items-start gap-3">
                          <span className="text-cyan-400 mt-1">•</span>
                          <span>Always use high-quality source material (24-bit, 48kHz or higher)</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-cyan-400 mt-1">•</span>
                          <span>Leave at least -3dB headroom in your mix before mastering</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-cyan-400 mt-1">•</span>
                          <span>Use reference tracks to compare your master</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-cyan-400 mt-1">•</span>
                          <span>Take breaks every 30-45 minutes to avoid ear fatigue</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-cyan-400 mt-1">•</span>
                          <span>Test your master on different playback systems</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-linear-to-br from-purple-950/20 to-pink-950/20 border border-purple-500/20 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <AlertCircle className="w-6 h-6 text-purple-400" />
                        <h2 className="text-xl text-white">Common Mistakes to Avoid</h2>
                      </div>
                      <ul className="space-y-3 text-zinc-400 text-sm">
                        <li className="flex items-start gap-3">
                          <span className="text-purple-400 mt-1">•</span>
                          <span>Don&apos;t over-compress - preserve dynamics for a more natural sound</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-purple-400 mt-1">•</span>
                          <span>Avoid excessive limiting - aim for -1dB true peak maximum</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-purple-400 mt-1">•</span>
                          <span>Don&apos;t boost too much in any single frequency band</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-purple-400 mt-1">•</span>
                          <span>Never compare at different volume levels - loudness bias is real</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-linear-to-br from-emerald-950/20 to-cyan-950/20 border border-emerald-500/20 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <CheckCircle className="w-6 h-6 text-emerald-400" />
                        <h2 className="text-xl text-white">Mastering Workflow</h2>
                      </div>
                      <ol className="space-y-3 text-zinc-400 text-sm">
                        <li className="flex items-start gap-3">
                          <span className="text-emerald-400 mt-1 font-mono">1.</span>
                          <span>Load your audio and analyze with spectrum analyzer</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-emerald-400 mt-1 font-mono">2.</span>
                          <span>Apply multiband compression to balance frequency ranges</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-emerald-400 mt-1 font-mono">3.</span>
                          <span>Add saturation or harmonics for warmth (optional)</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-emerald-400 mt-1 font-mono">4.</span>
                          <span>Adjust stereo width if needed</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-emerald-400 mt-1 font-mono">5.</span>
                          <span>Apply final limiting to reach target LUFS</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-emerald-400 mt-1 font-mono">6.</span>
                          <span>Check LUFS meters to ensure compliance with standards</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-emerald-400 mt-1 font-mono">7.</span>
                          <span>Export and test on different systems</span>
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Footer */}
              <div className="mt-16 pt-8 border-t border-zinc-800 flex items-center justify-between">
                <div className="text-sm text-zinc-500">
                  Last updated: December 2025
                </div>
                <motion.button
                  onClick={onGetStarted}
                  className="px-6 py-3 bg-linear-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 rounded-lg text-white shadow-lg shadow-cyan-500/30 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Try MasterPro Now
                </motion.button>
              </div>
            </motion.main>
          </div>
        </div>
      </div>
    </div>
  );
}

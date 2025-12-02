import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  Code,
  Music,
  MapPin,
  Github,
  Linkedin,
  Instagram,
  Mail,
  Globe,
  Headphones,
  Heart,
  Zap,
  Award,
  Coffee,
  Volume2,
  Activity,
  Waves,
  Palette
} from 'lucide-react';

interface AboutPageProps {
  onBack: () => void;
  onGetStarted: () => void;
}

// Komponen untuk menampilkan logo teknologi
function TechLogo({ name, className }: { name: string; className?: string }) {
  const logoClass = className || 'w-8 h-8 mx-auto mb-2';
  
  switch (name) {
    case 'React':
      return (
        <svg className={logoClass} viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="2" fill="#61DAFB" />
          <ellipse cx="12" cy="12" rx="11" ry="4.2" fill="none" stroke="#61DAFB" strokeWidth="1" />
          <ellipse cx="12" cy="12" rx="11" ry="4.2" fill="none" stroke="#61DAFB" strokeWidth="1" transform="rotate(60 12 12)" />
          <ellipse cx="12" cy="12" rx="11" ry="4.2" fill="none" stroke="#61DAFB" strokeWidth="1" transform="rotate(-60 12 12)" />
        </svg>
      );
    case 'TypeScript':
      return (
        <svg className={logoClass} viewBox="0 0 24 24" fill="#3178C6">
          <rect width="24" height="24" rx="4" fill="#3178C6" />
          <path d="M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.717-.26 5.453 5.453 0 0 0-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 0 0-.623.242c-.17.104-.3.229-.393.374a.888.888 0 0 0-.14.49c0 .196.053.373.156.529.104.156.252.304.443.444s.423.276.696.41c.273.135.582.274.926.416.47.197.892.407 1.266.628.374.222.695.473.963.753.268.279.472.598.614.957.142.359.214.776.214 1.253 0 .657-.125 1.21-.373 1.656a3.033 3.033 0 0 1-1.012 1.085 4.38 4.38 0 0 1-1.487.596c-.566.12-1.163.18-1.79.18a9.916 9.916 0 0 1-1.84-.164 5.544 5.544 0 0 1-1.512-.493v-2.63a5.033 5.033 0 0 0 3.237 1.2c.333 0 .624-.03.872-.09.249-.06.456-.144.623-.25.166-.108.29-.234.373-.38a1.023 1.023 0 0 0-.074-1.089 2.12 2.12 0 0 0-.537-.5 5.597 5.597 0 0 0-.807-.444 8.916 8.916 0 0 0-1.007-.436c-.918-.383-1.602-.852-2.053-1.405-.45-.553-.676-1.222-.676-2.005 0-.614.123-1.141.369-1.582.246-.441.58-.804.999-1.089a4.494 4.494 0 0 1 1.43-.629 5.414 5.414 0 0 1 1.713-.272zm-15.113.188h9.563v2.166H9.506v9.646H6.789v-9.646H3.375z" fill="white" />
        </svg>
      );
    case 'Tailwind CSS':
      return (
        <svg className={logoClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 6c-2.67 0-4.33 1.33-5 4 1-1.33 2.17-1.83 3.5-1.5.76.19 1.31.74 1.91 1.35.98 1 2.12 2.15 4.09 2.15 2.67 0 4.33-1.33 5-4-1 1.33-2.17 1.83-3.5 1.5-.76-.19-1.31-.74-1.91-1.35C15.61 7.15 14.47 6 12 6zm-5 6c-2.67 0-4.33 1.33-5 4 1-1.33 2.17-1.83 3.5-1.5.76.19 1.31.74 1.91 1.35.98 1 2.12 2.15 4.09 2.15 2.67 0 4.33-1.33 5-4-1 1.33-2.17 1.83-3.5 1.5-.76-.19-1.31-.74-1.91-1.35C10.61 13.15 9.47 12 7 12z" fill="#06B6D4" />
        </svg>
      );
    case 'Motion':
      return (
        <svg className={logoClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2.4c5.302 0 9.6 4.298 9.6 9.6S17.302 21.6 12 21.6 2.4 17.302 2.4 12 6.698 2.4 12 2.4zm-1.2 4.8v9.6l7.2-4.8-7.2-4.8z" fill="#FF0055" />
        </svg>
      );
    case 'Web Audio API':
      return <Waves className={logoClass} />;
    case 'Canvas API':
      return <Palette className={logoClass} />;
    case 'Next JS':
      return (
        <svg className={logoClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.57 23.995l-.006-.002a.299.299 0 01-.128-.027l-9.5-5.5a.3.3 0 01-.15-.26V5.79a.3.3 0 01.15-.26l9.5-5.5a.3.3 0 01.3 0l9.5 5.5a.3.3 0 01.15.26v12.42a.3.3 0 01-.15.26l-9.5 5.5a.3.3 0 01-.172.025zm-.01-1.36l.006.002 8.82-5.1V6.46l-8.82-5.1-8.82 5.1v11.08l8.814 5.1z" fill="currentColor" />
          <path d="M6.774 7.9v8.2l5.364-3.1v-2.1L8.4 12l3.738-2.1V7.9L6.774 7.9zm10.452 0v8.2l-5.364-3.1v-2.1L15.6 12l-3.738-2.1V7.9l5.364 0z" fill="currentColor" />
        </svg>
      );
    case 'Lucide Icons':
      return (
        <svg className={logoClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2v20M2 12h20" />
        </svg>
      );
    default:
      return <Code className={logoClass} />;
  }
}

export function AboutPage({ onBack, onGetStarted }: AboutPageProps) {
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
              <h1 className="text-xl text-white">About MasterPro</h1>
              <p className="text-xs text-cyan-400">Meet the Creator</p>
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
      <div className="relative px-6 py-20 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"
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
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"
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
        </div>

        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Heart className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400 text-sm">Made with passion by a dedicated team</span>
          </motion.div>

          <motion.h1 
            className="text-5xl md:text-6xl text-white mb-6"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            About MasterPro
          </motion.h1>

          <motion.p 
            className="text-zinc-400 text-lg md:text-xl leading-relaxed max-w-3xl mx-auto mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            A professional audio mastering plugin built by a team of passionate audio and software engineers 
            from Indonesia, combining years of studio experience with cutting-edge web technology.
          </motion.p>

          <motion.div 
            className="flex items-center justify-center gap-3 text-zinc-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <MapPin className="w-5 h-5 text-emerald-400" />
            <span>Built in Indonesia</span>
          </motion.div>
        </div>
      </div>

      {/* Team Section */}
      <div className="relative px-6 py-20 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl text-white mb-4">Meet the Team</h2>
            <p className="text-zinc-400 text-lg">The minds behind MasterPro</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Team Member 1 - Boedi */}
            <motion.div
              className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 hover:border-cyan-500/50 rounded-2xl p-8 transition-all"
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileHover={{ y: -10 }}
            >
              <motion.div
                className="relative w-32 h-32 mx-auto mb-6"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="absolute inset-0 bg-linear-to-br from-cyan-500 to-purple-600 rounded-full" />
                <motion.div 
                  className="absolute inset-1 bg-zinc-900 rounded-full flex items-center justify-center"
                  animate={{
                    boxShadow: [
                      "0 0 15px rgba(6, 182, 212, 0.3)",
                      "0 0 25px rgba(6, 182, 212, 0.5)",
                      "0 0 15px rgba(6, 182, 212, 0.3)",
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <div className="text-3xl text-white">BMF</div>
                </motion.div>
              </motion.div>

              <h3 className="text-2xl text-white text-center mb-2">Boedi Moelya MF</h3>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-center gap-2 text-cyan-400 text-sm">
                  <Code className="w-4 h-4" />
                  <span>Software Engineer</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-purple-400 text-sm">
                  <Headphones className="w-4 h-4" />
                  <span>Audio Engineer</span>
                </div>
              </div>

              <p className="text-zinc-400 text-sm text-center leading-relaxed mb-6">
                Lead developer and audio specialist, bringing studio-grade processing to the web with modern technologies.
              </p>

              <div className="flex justify-center gap-2">
                <motion.a
                  href="https://bmmf.site/"
                  target="_blank"
                  className="p-2 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-cyan-500/50 rounded-lg transition-all"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Globe className="w-4 h-4 text-zinc-300" />
                </motion.a>
                <motion.a
                  href="https://www.instagram.com/moehammadfiqih/"
                  target="_blank"
                  className="p-2 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-cyan-500/50 rounded-lg transition-all"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Instagram className="w-4 h-4 text-zinc-300" />
                </motion.a>
                
              </div>
            </motion.div>

            {/* Team Member 2 - Agus */}
            <motion.div
              className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 hover:border-purple-500/50 rounded-2xl p-8 transition-all"
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              whileHover={{ y: -10 }}
            >
              <motion.div
                className="relative w-32 h-32 mx-auto mb-6"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="absolute inset-0 bg-linear-to-br from-purple-500 to-pink-600 rounded-full" />
                <motion.div 
                  className="absolute inset-1 bg-zinc-900 rounded-full flex items-center justify-center"
                  animate={{
                    boxShadow: [
                      "0 0 15px rgba(168, 85, 247, 0.3)",
                      "0 0 25px rgba(168, 85, 247, 0.5)",
                      "0 0 15px rgba(168, 85, 247, 0.3)",
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <div className="text-3xl text-white">AH</div>
                </motion.div>
              </motion.div>

              <h3 className="text-2xl text-white text-center mb-2">Agus Hardiman</h3>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-center gap-2 text-purple-400 text-sm">
                  <Music className="w-4 h-4" />
                  <span>Producer</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-cyan-400 text-sm">
                  <Code className="w-4 h-4" />
                  <span>Software Engineer</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-pink-400 text-sm">
                  <Headphones className="w-4 h-4" />
                  <span>Audio Engineer</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-orange-400 text-sm">
                  <Zap className="w-4 h-4" />
                  <span>Content Creator</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-yellow-400 text-sm">
                  <Zap className="w-4 h-4" />
                  <span>Audio Educator</span>
                </div>
              </div>

              <p className="text-zinc-400 text-sm text-center leading-relaxed mb-6">
                Multi-talented producer and engineer, ensuring MasterPro meets real-world production needs while creating content to help users.
              </p>

              <div className="flex justify-center gap-2">
                <motion.a
                  href="https://agushardiman.tv/"
                  target="_blank"
                  className="p-2 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-purple-500/50 rounded-lg transition-all"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Globe className="w-4 h-4 text-zinc-300" />
                </motion.a>
                <motion.a
                  href="https://www.instagram.com/agushardiman/"
                  target="_blank"
                  className="p-2 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-purple-500/50 rounded-lg transition-all"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Instagram className="w-4 h-4 text-zinc-300" />
                </motion.a>
                
              </div>
            </motion.div>

            {/* Team Member 3 - Deby */}
            <motion.div
              className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 hover:border-emerald-500/50 rounded-2xl p-8 transition-all"
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ y: -10 }}
            >
              <motion.div
                className="relative w-32 h-32 mx-auto mb-6"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="absolute inset-0 bg-linear-to-br from-emerald-500 to-cyan-600 rounded-full" />
                <motion.div 
                  className="absolute inset-1 bg-zinc-900 rounded-full flex items-center justify-center"
                  animate={{
                    boxShadow: [
                      "0 0 15px rgba(16, 185, 129, 0.3)",
                      "0 0 25px rgba(16, 185, 129, 0.5)",
                      "0 0 15px rgba(16, 185, 129, 0.3)",
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <div className="text-3xl text-white">DP</div>
                </motion.div>
              </motion.div>

              <h3 className="text-2xl text-white text-center mb-2">Deby Pamungkas</h3>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm">
                  <Volume2 className="w-4 h-4" />
                  <span>Live Sound Engineer</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-cyan-400 text-sm">
                  <Activity className="w-4 h-4" />
                  <span>Audio Software Engineer Enthusiast</span>
                </div>
              </div>

              <p className="text-zinc-400 text-sm text-center leading-relaxed mb-6">
                Live sound specialist bringing real-time processing expertise and performance optimization to ensure MasterPro runs flawlessly.
              </p>

              <div className="flex justify-center gap-2">
                <motion.a
                  href="https://www.debypamungkas.com/"
                  className="p-2 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-emerald-500/50 rounded-lg transition-all"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Globe className="w-4 h-4 text-zinc-300" />
                </motion.a>
                <motion.a
                  href="https://www.instagram.com/debypamungkas/"
                  className="p-2 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-emerald-500/50 rounded-lg transition-all"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Instagram className="w-4 h-4 text-zinc-300" />
                </motion.a>
                
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Journey Section */}
      <div className="relative px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl text-white mb-4">The Journey</h2>
            <p className="text-zinc-400 text-lg">From passion to professional tools</p>
          </motion.div>

          <div className="space-y-8">
            {/* Story Card 1 */}
            <motion.div
              className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 hover:border-cyan-500/50 rounded-2xl p-8 transition-all"
              initial={{ x: -50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileHover={{ x: 10 }}
            >
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-linear-to-br from-cyan-500/20 to-cyan-600/20 rounded-xl flex items-center justify-center shrink-0">
                  <Music className="w-8 h-8 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-2xl text-white mb-3">Audio Engineering Background</h3>
                  <p className="text-zinc-400 leading-relaxed">
                    Our team started with a deep passion for music production and mastering. 
                    We spent years working in studios and live venues, understanding the nuances of professional 
                    audio processing and the tools that make great masters.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Story Card 2 */}
            <motion.div
              className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 hover:border-purple-500/50 rounded-2xl p-8 transition-all"
              initial={{ x: 50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              whileHover={{ x: -10 }}
            >
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-linear-to-br from-purple-500/20 to-purple-600/20 rounded-xl flex items-center justify-center shrink-0">
                  <Code className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-2xl text-white mb-3">Software Development Expertise</h3>
                  <p className="text-zinc-400 leading-relaxed">
                    We transitioned into software engineering, mastering modern web technologies and building 
                    sophisticated applications. Our team specializes in creating intuitive, high-performance interfaces 
                    that professionals rely on daily.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Story Card 3 */}
            <motion.div
              className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 hover:border-emerald-500/50 rounded-2xl p-8 transition-all"
              initial={{ x: -50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ x: 10 }}
            >
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-linear-to-br from-emerald-500/20 to-emerald-600/20 rounded-xl flex items-center justify-center shrink-0">
                  <Zap className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-2xl text-white mb-3">MasterPro Creation</h3>
                  <p className="text-zinc-400 leading-relaxed">
                    Together, we combined our expertise from both worlds to create MasterPro - a professional audio 
                    mastering plugin that brings studio-grade processing to everyone. Built with modern web technologies 
                    and informed by years of collective audio engineering experience.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Skills & Expertise */}
      <div className="relative px-6 py-20 bg-zinc-900/30">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl text-white mb-4">Skills & Expertise</h2>
            <p className="text-zinc-400 text-lg">Dual expertise in audio and software</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Audio Skills */}
            <motion.div
              className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8"
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-linear-to-br from-cyan-500/20 to-cyan-600/20 rounded-xl flex items-center justify-center">
                  <Headphones className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-2xl text-white">Audio Engineering</h3>
              </div>
              <div className="space-y-3">
                {[
                  'Audio Mastering',
                  'Mixing & Production',
                  'DSP Processing',
                  'Acoustic Treatment',
                  'Sound Design',
                  'Music Theory'
                ].map((skill, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center gap-3 text-zinc-400"
                    initial={{ x: -20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: i * 0.1 }}
                  >
                    <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                    {skill}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Software Skills */}
            <motion.div
              className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8"
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-linear-to-br from-purple-500/20 to-purple-600/20 rounded-xl flex items-center justify-center">
                  <Code className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-2xl text-white">Software Development</h3>
              </div>
              <div className="space-y-3">
                {[
                  'React & TypeScript',
                  'Web Audio API',
                  'UI/UX Design',
                  'Performance Optimization',
                  'Real-time Processing',
                  'Modern Web Stack'
                ].map((skill, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center gap-3 text-zinc-400"
                    initial={{ x: 20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: i * 0.1 }}
                  >
                    <div className="w-2 h-2 bg-purple-400 rounded-full" />
                    {skill}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Mission & Values */}
      <div className="relative px-6 py-20 bg-zinc-900/30">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl text-white mb-4">Mission & Values</h2>
            <p className="text-zinc-400 text-lg">What drives our team</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 hover:border-cyan-500/50 rounded-2xl p-6 text-center transition-all"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, type: "spring" }}
              whileHover={{ y: -5 }}
            >
              <div className="w-16 h-16 bg-linear-to-br from-cyan-500/20 to-cyan-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-white text-xl mb-2">Professional Quality</h3>
              <p className="text-zinc-400 text-sm">
                Delivering studio-grade tools with professional standards and precision
              </p>
            </motion.div>

            <motion.div
              className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 hover:border-purple-500/50 rounded-2xl p-6 text-center transition-all"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1, type: "spring" }}
              whileHover={{ y: -5 }}
            >
              <div className="w-16 h-16 bg-linear-to-br from-purple-500/20 to-purple-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-white text-xl mb-2">User-Centric Design</h3>
              <p className="text-zinc-400 text-sm">
                Creating intuitive interfaces that make professional tools accessible to everyone
              </p>
            </motion.div>

            <motion.div
              className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 hover:border-emerald-500/50 rounded-2xl p-6 text-center transition-all"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
              whileHover={{ y: -5 }}
            >
              <div className="w-16 h-16 bg-linear-to-br from-emerald-500/20 to-emerald-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Coffee className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-white text-xl mb-2">Continuous Innovation</h3>
              <p className="text-zinc-400 text-sm">
                Always improving, learning, and pushing the boundaries of what&apos;s possible
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="relative px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl text-white mb-4">Built With</h2>
            <p className="text-zinc-400 text-lg">Modern technologies powering MasterPro</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'React', color: 'cyan' },
              { name: 'TypeScript', color: 'blue' },
              { name: 'Tailwind CSS', color: 'purple' },
              { name: 'Motion', color: 'pink' },
              { name: 'Web Audio API', color: 'emerald' },
              { name: 'Canvas API', color: 'orange' },
              { name: 'Next JS', color: 'yellow' },
              { name: 'Lucide Icons', color: 'red' }
            ].map((tech, i) => (
              <motion.div
                key={i}
                className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 hover:border-cyan-500/50 rounded-xl p-4 text-center transition-all"
                initial={{ scale: 0, rotate: -180 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05, type: "spring" }}
                whileHover={{ scale: 1.1, y: -5 }}
              >
                <div className="mb-2 flex items-center justify-center">
                  <TechLogo name={tech.name} className={`w-8 h-8 text-${tech.color}-400`} />
                </div>
                <div className="text-zinc-300 text-sm">{tech.name}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="relative px-6 py-20 bg-linear-to-br from-cyan-950/20 to-purple-950/20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 
            className="text-4xl text-white mb-6"
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Let&apos;s Create Amazing Audio Together
          </motion.h2>
          <motion.p 
            className="text-zinc-400 text-lg mb-10"
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Experience the power of professional audio mastering built by a team who understands both the art and the technology
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
            <Music className="w-6 h-6" />
            Start Mastering Now
          </motion.button>
        </div>
      </div>
    </div>
  );
}

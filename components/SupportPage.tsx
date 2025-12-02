import { motion } from 'framer-motion';
import { useState } from 'react';
import { 
  ArrowLeft,
  HelpCircle,
  MessageCircle,
  Mail,
  Send,
  BookOpen,
  Video,
  FileText,
  Search,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Users,
  Clock,
  Zap,
  Shield,
  Globe,
  Github
} from 'lucide-react';

interface SupportPageProps {
  onBack: () => void;
  onGetStarted: () => void;
}

export function SupportPage({ onBack, onGetStarted }: SupportPageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const faqs = [
    {
      question: "How do I get started with MasterPro?",
      answer: "Simply sign up for an account, and you'll have immediate access to the plugin. Load your audio file, and start using our professional mastering tools. We recommend watching our quick start video tutorial to familiarize yourself with the interface."
    },
    {
      question: "What audio formats are supported?",
      answer: "MasterPro supports all major audio formats including WAV, MP3, FLAC, AIFF, and OGG. For best quality, we recommend using uncompressed formats like WAV or FLAC with 24-bit depth and sample rates up to 192kHz."
    },
    {
      question: "Can I use MasterPro for commercial projects?",
      answer: "Yes! All our plans include commercial usage rights. You can use MasterPro to master audio for client work, streaming platforms, broadcast, and any other commercial applications."
    },
    {
      question: "How does the Multiband Compressor work?",
      answer: "The Multiband Compressor splits your audio into 5 frequency bands (LOW, LOW-MID, MID, HIGH-MID, HIGH) and allows independent compression control for each. Click and drag on the analyzer to adjust crossover points and threshold levels visually."
    },
    {
      question: "What are LUFS and why are they important?",
      answer: "LUFS (Loudness Units Full Scale) is a standardized measurement of perceived loudness. It's crucial for meeting broadcast standards (typically -23 LUFS) and streaming platform requirements (typically -14 LUFS). Our built-in LUFS metering ensures your masters meet these standards."
    },
    {
      question: "Can I export my mastered audio?",
      answer: "Yes! You can export your mastered audio in various formats and quality settings. Choose from WAV, MP3, FLAC with different bit depths (16/24/32-bit) and sample rates (44.1kHz to 192kHz)."
    },
    {
      question: "Is there a limit on file size or duration?",
      answer: "Free accounts can process files up to 10 minutes and 100MB. Pro accounts have no limits on file size or duration, allowing you to master full albums and extended mixes."
    },
    {
      question: "How do I save my settings as presets?",
      answer: "Click the 'Save Preset' button in the top right corner of the plugin. Name your preset and it will be available in the preset menu for future sessions. You can create unlimited custom presets."
    },
    {
      question: "Does MasterPro work offline?",
      answer: "MasterPro is a web-based application that requires an internet connection for initial loading. However, once loaded, the audio processing happens entirely in your browser for maximum performance and privacy."
    },
    {
      question: "How can I get help if I'm stuck?",
      answer: "We offer multiple support channels: email support (support@masterpro.audio), live chat during business hours, comprehensive documentation, video tutorials, and an active community forum where our team and users can help you."
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Support form submitted:', formData);
    // Here you would send the form data to your backend
    alert('Thank you for contacting us! We\'ll get back to you within 24 hours.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

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
              <h1 className="text-xl text-white">Support Center</h1>
              <p className="text-xs text-cyan-400">We&apos;re here to help</p>
            </div>
          </div>
          <motion.button
            onClick={onGetStarted}
            className="px-6 py-2 bg-linear-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 rounded-lg text-white shadow-lg shadow-cyan-500/30 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Get Started
          </motion.button>
        </div>
      </motion.header>

      {/* Hero Section */}
      <div className="relative px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1 
            className="text-5xl md:text-6xl text-white mb-6"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            How can we help you?
          </motion.h1>
          <motion.p 
            className="text-xl text-zinc-400 mb-10"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Find answers, tutorials, and get in touch with our support team
          </motion.p>

          {/* Search Bar */}
          <motion.div
            className="relative max-w-2xl mx-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search for help articles, tutorials, or guides..."
              className="w-full pl-12 pr-4 py-4 bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 focus:border-cyan-500/50 rounded-xl text-white placeholder:text-zinc-500 outline-none transition-all"
            />
          </motion.div>
        </div>
      </div>

      {/* Quick Help Cards */}
      <div className="relative px-6 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 hover:border-cyan-500/50 rounded-xl p-6 text-center transition-all cursor-pointer"
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -5 }}
            >
              <div className="w-12 h-12 bg-linear-to-br from-cyan-500/20 to-cyan-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-white mb-2">Documentation</h3>
              <p className="text-zinc-500 text-sm">Complete guides and references</p>
            </motion.div>

            <motion.div
              className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 hover:border-purple-500/50 rounded-xl p-6 text-center transition-all cursor-pointer"
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -5 }}
            >
              <div className="w-12 h-12 bg-linear-to-br from-purple-500/20 to-purple-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Video className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-white mb-2">Video Tutorials</h3>
              <p className="text-zinc-500 text-sm">Step-by-step video guides</p>
            </motion.div>

            <motion.div
              className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 hover:border-emerald-500/50 rounded-xl p-6 text-center transition-all cursor-pointer"
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -5 }}
            >
              <div className="w-12 h-12 bg-linear-to-br from-emerald-500/20 to-emerald-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-white mb-2">Community</h3>
              <p className="text-zinc-500 text-sm">Join our user community</p>
            </motion.div>

            <motion.div
              className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 hover:border-orange-500/50 rounded-xl p-6 text-center transition-all cursor-pointer"
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -5 }}
            >
              <div className="w-12 h-12 bg-linear-to-br from-orange-500/20 to-orange-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-white mb-2">Live Chat</h3>
              <p className="text-zinc-500 text-sm">Chat with our team</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="relative px-6 py-20 bg-zinc-900/30">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-zinc-400 text-lg">Quick answers to common questions</p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl overflow-hidden transition-all"
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-zinc-800/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center shrink-0">
                      <HelpCircle className="w-5 h-5 text-cyan-400" />
                    </div>
                    <h3 className="text-white">{faq.question}</h3>
                  </div>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-cyan-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-zinc-500 shrink-0" />
                  )}
                </button>
                
                <motion.div
                  initial={false}
                  animate={{
                    height: openFaq === index ? 'auto' : 0,
                    opacity: openFaq === index ? 1 : 0
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 pl-20">
                    <p className="text-zinc-400 leading-relaxed">{faq.answer}</p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Form */}
      <div className="relative px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Form */}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl text-white mb-4">Get in Touch</h2>
              <p className="text-zinc-400 mb-8">
                Can&apos;t find what you&apos;re looking for? Send us a message and we&apos;ll get back to you within 24 hours.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 focus:border-cyan-500/50 rounded-lg text-white placeholder:text-zinc-500 outline-none transition-all"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 focus:border-cyan-500/50 rounded-lg text-white placeholder:text-zinc-500 outline-none transition-all"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Subject</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 focus:border-cyan-500/50 rounded-lg text-white placeholder:text-zinc-500 outline-none transition-all"
                    placeholder="How can we help?"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Message</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={6}
                    className="w-full px-4 py-3 bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 focus:border-cyan-500/50 rounded-lg text-white placeholder:text-zinc-500 outline-none transition-all resize-none"
                    placeholder="Tell us more about your question or issue..."
                  />
                </div>

                <motion.button
                  type="submit"
                  className="w-full py-4 bg-linear-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 rounded-lg text-white shadow-lg shadow-cyan-500/30 transition-all flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Send className="w-5 h-5" />
                  Send Message
                </motion.button>
              </form>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl p-8">
                <h3 className="text-2xl text-white mb-6">Contact Information</h3>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-cyan-500/10 rounded-lg flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h4 className="text-white mb-1">Email Support</h4>
                      <p className="text-zinc-400 text-sm">support@masterpro.audio</p>
                      <p className="text-zinc-500 text-xs mt-1">Response within 24 hours</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center shrink-0">
                      <MessageCircle className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-white mb-1">Live Chat</h4>
                      <p className="text-zinc-400 text-sm">Available Mon-Fri</p>
                      <p className="text-zinc-500 text-xs mt-1">9:00 AM - 5:00 PM WIB</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-white mb-1">Community Forum</h4>
                      <p className="text-zinc-400 text-sm">community.masterpro.audio</p>
                      <p className="text-zinc-500 text-xs mt-1">Ask questions and share tips</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center shrink-0">
                      <Github className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <h4 className="text-white mb-1">GitHub</h4>
                      <p className="text-zinc-400 text-sm">github.com/masterpro</p>
                      <p className="text-zinc-500 text-xs mt-1">Report bugs and feature requests</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Response Time */}
              <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  <h4 className="text-white">Average Response Time</h4>
                </div>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-4xl text-cyan-400">4.2</span>
                  <span className="text-zinc-400 mb-2">hours</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>Usually faster during business hours</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Support Stats */}
      <div className="relative px-6 py-20 bg-zinc-900/30">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl text-white mb-4">Our Commitment to You</h2>
            <p className="text-zinc-400 text-lg">We&apos;re dedicated to providing excellent support</p>
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
              <div className="text-4xl text-cyan-400 mb-2">24h</div>
              <div className="text-zinc-400 text-sm">Response Time</div>
            </motion.div>

            <motion.div
              className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl p-6 text-center"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1, type: "spring" }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-4xl text-purple-400 mb-2">98%</div>
              <div className="text-zinc-400 text-sm">Satisfaction Rate</div>
            </motion.div>

            <motion.div
              className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl p-6 text-center"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-4xl text-emerald-400 mb-2">5k+</div>
              <div className="text-zinc-400 text-sm">Help Articles</div>
            </motion.div>

            <motion.div
              className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl p-6 text-center"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3, type: "spring" }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-4xl text-orange-400 mb-2">24/7</div>
              <div className="text-zinc-400 text-sm">Documentation Access</div>
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
            Ready to Get Started?
          </motion.h2>
          <motion.p 
            className="text-zinc-400 text-lg mb-10"
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Join thousands of producers and engineers using MasterPro
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
            <Zap className="w-6 h-6" />
            Start Mastering Now
          </motion.button>
        </div>
      </div>
    </div>
  );
}

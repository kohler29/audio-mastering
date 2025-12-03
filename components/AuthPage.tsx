"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Waves, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function AuthPage() {
  const { login, register, isSubmitting, error: authError } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!username.trim()) {
          setError('Username harus diisi');
          return;
        }
        await register(email, username, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setUsername('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-20 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"
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
          className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"
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

      {/* Floating Audio Waves */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 bg-cyan-500/10"
            style={{
              left: `${i * 5}%`,
              height: '100%',
            }}
            animate={{
              scaleY: [0.3, 0.8, 0.3],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.1
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Brand */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 bg-linear-to-br from-cyan-500 to-purple-600 rounded-2xl mb-4 shadow-2xl shadow-cyan-500/20"
            animate={{
              rotateY: [0, 360],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <Waves className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-zinc-100 tracking-wider mb-1">MASTER PRO</h1>
          <p className="text-zinc-500 text-sm">Professional Audio Mastering</p>
        </motion.div>

        {/* Auth Card */}
        <motion.div
          className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Tab Switcher */}
          <div className="flex border-b border-zinc-800">
            <button
              onClick={() => isLogin || switchMode()}
              className={`flex-1 py-4 text-sm transition-all relative ${
                isLogin ? 'text-cyan-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Login
              {isLogin && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500"
                  layoutId="activeTab"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
            <button
              onClick={() => !isLogin || switchMode()}
              className={`flex-1 py-4 text-sm transition-all relative ${
                !isLogin ? 'text-cyan-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Sign Up
              {!isLogin && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500"
                  layoutId="activeTab"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          </div>

          {/* Form Content */}
          <div className="p-8">
            <AnimatePresence mode="wait">
              <motion.form
                key={isLogin ? 'login' : 'signup'}
                onSubmit={handleSubmit}
                initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                {/* Username field (Sign Up only) */}
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <label className="text-zinc-400 text-sm block mb-2">Username</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-11 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                        placeholder="Enter your username"
                        required={!isLogin}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Email field */}
                <div>
                  <label className="text-zinc-400 text-sm block mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <motion.input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-11 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                      placeholder="Enter your email"
                      required
                      whileFocus={{ scale: 1.01 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    />
                  </div>
                </div>

                {/* Password field */}
                <div>
                  <label className="text-zinc-400 text-sm block mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <motion.input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-11 py-3 pr-11 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                      placeholder="Enter your password"
                      required
                      whileFocus={{ scale: 1.01 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {(error || authError) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error || authError}</span>
                  </motion.div>
                )}

                {/* Forgot Password (Login only) */}
                {isLogin && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-linear-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white py-3 rounded-xl shadow-lg shadow-cyan-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.div
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      Processing...
                    </span>
                  ) : (
                    <span>{isLogin ? 'Login' : 'Create Account'}</span>
                  )}
                  
                  {/* Button shine effect */}
                  <motion.div
                    className="absolute inset-0 bg-linear-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3,
                      ease: "linear"
                    }}
                  />
                </motion.button>
              </motion.form>
            </AnimatePresence>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 text-zinc-500 bg-zinc-900">or continue with</span>
              </div>
            </div>

            {/* Social Login */}
            <div>
              <motion.button
                type="button"
                onClick={() => {
                  window.location.href = '/api/auth/google/authorize';
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-300 text-sm transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Footer Text */}
        <motion.p
          className="text-center text-zinc-500 text-sm mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          By continuing, you agree to our{' '}
          <button className="text-cyan-400 hover:text-cyan-300 transition-colors">
            Terms of Service
          </button>
          {' '}and{' '}
          <button className="text-cyan-400 hover:text-cyan-300 transition-colors">
            Privacy Policy
          </button>
        </motion.p>
      </div>
    </div>
  );
}


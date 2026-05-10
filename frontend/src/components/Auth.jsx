import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Mail, Lock, AlertCircle, Loader2, ArrowRight, Sparkles } from 'lucide-react';

export default function Auth({ supabase }) {
  const [authMode, setAuthMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      if (authMode === 'login') {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
      } else {
        const { error: authError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { emailRedirectTo: window.location.origin }
        });
        if (authError) throw authError;
        setSuccess("Check your email to verify your account.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#05070a] overflow-hidden font-['Inter']">
      {/* Dynamic Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 blur-[150px] rounded-full animate-pulse" />
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-purple-600/5 blur-[120px] rounded-full" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md px-6 relative z-10"
      >
        <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
          
          <div className="text-center mb-12">
            <motion.div 
              whileHover={{ rotate: 5, scale: 1.1 }}
              className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-500 p-[1px] mb-8 shadow-2xl shadow-indigo-500/30"
            >
              <div className="w-full h-full bg-[#05070a] rounded-[1.9rem] flex items-center justify-center">
                <span className="text-4xl font-black text-white italic">J</span>
              </div>
            </motion.div>
            <h1 className="text-4xl font-black text-white mb-3 tracking-tighter flex items-center justify-center">
              AI PRO <Sparkles size={20} className="ml-2 text-blue-500 animate-pulse" />
            </h1>
            <p className="text-slate-500 text-sm font-medium tracking-wide uppercase">
              {authMode === 'login' ? 'Secure Login Access' : 'Create Master Account'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-2">
              <input 
                name="email" 
                type="email" 
                placeholder="Email Address" 
                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-white placeholder-slate-600 outline-none focus:ring-1 focus:ring-blue-500/50 focus:bg-white/[0.05] transition-all duration-300"
                required 
              />
            </div>
            
            <div className="space-y-2">
              <input 
                name="password" 
                type="password" 
                placeholder="Password" 
                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-white placeholder-slate-600 outline-none focus:ring-1 focus:ring-blue-500/50 focus:bg-white/[0.05] transition-all duration-300"
                required 
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-4 rounded-2xl flex items-center"
                >
                  <AlertCircle size={14} className="mr-2 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full group relative bg-white text-black font-bold py-5 rounded-2xl transition-all duration-300 hover:bg-blue-500 hover:text-white disabled:opacity-50 overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center">
                {loading ? <Loader2 className="animate-spin" /> : (authMode === 'login' ? 'ENTER SYSTEM' : 'INITIALIZE')}
              </span>
            </button>
          </form>

          <div className="mt-10 text-center">
            <button
              onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setError(null); }}
              className="text-xs text-slate-500 hover:text-white font-bold tracking-widest uppercase transition-all"
            >
              {authMode === 'login' ? "Access Request →" : "← Back to Login"}
            </button>
          </div>
        </div>
        
        <p className="mt-8 text-center text-[10px] text-slate-700 font-black uppercase tracking-[0.4em]">
          End-to-End Encrypted Neural Network v4.0.2
        </p>
      </motion.div>
    </div>
  );
}

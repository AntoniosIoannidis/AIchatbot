import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Mail, Lock, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

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
          options: {
            emailRedirectTo: window.location.origin
          }
        });
        if (authError) throw authError;
        setSuccess("Success! Check your email to verify your account.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f1a] p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-slate-900/50 backdrop-blur-2xl border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600" />
          
          <div className="text-center mb-10">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 mb-6 text-blue-500 border border-blue-500/20"
            >
              <Bot size={40} className="text-blue-400" />
            </motion.div>
            <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">AI Pro</h1>
            <p className="text-slate-400 font-medium">
              {authMode === 'login' ? 'Welcome back to the future' : 'Start your AI journey today'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 ml-1 flex items-center">
                <Mail size={14} className="mr-2 text-slate-500" /> Email Address
              </label>
              <input 
                name="email" 
                type="email" 
                placeholder="name@company.com" 
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                required 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 ml-1 flex items-center">
                <Lock size={14} className="mr-2 text-slate-500" /> Password
              </label>
              <input 
                name="password" 
                type="password" 
                placeholder="••••••••" 
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                required 
              />
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start"
              >
                <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-start"
              >
                <ArrowRight size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                {success}
              </motion.div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin mr-2" />
              ) : (
                authMode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setError(null); setSuccess(null); }}
              className="text-sm text-slate-400 hover:text-white font-medium transition-colors"
            >
              {authMode === 'login' ? (
                <>New here? <span className="text-blue-400">Create an account</span></>
              ) : (
                <>Already have an account? <span className="text-blue-400">Sign in</span></>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

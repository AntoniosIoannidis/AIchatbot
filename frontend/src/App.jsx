/* 🚀 PRODUCTION AUTH BUILD 4.0 - MASTER VERSION */
import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { 
  Send, LogOut, Moon, Sun, MessageSquare, Plus, User, Bot, Loader2, ChevronLeft, ChevronRight, Mic, MicOff, Volume2, Globe, Image as ImageIcon, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Configuration ---
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [authError, setAuthError] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- Style Injection ---
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      html, body, #root { height: 100vh !important; width: 100vw !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; font-family: ui-sans-serif, system-ui, sans-serif; background: #0b0f1a; }
      body { transition: background-color 0.3s ease; }
      .dark body { background-color: #0b0f1a; color: #f8fafc; }
      * { box-sizing: border-box; }
    `;
    document.head.appendChild(style);
  }, []);

  // --- Session Management ---
  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
    });
    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  useEffect(() => { if (session) fetchHistory(); }, [session]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  const fetchHistory = async () => {
    try {
      const { data } = await axios.get(`/api/history`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      setHistory(data.history || []);
    } catch (err) { console.error("History fetch failed"); }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError(null);
    const email = e.target.email.value;
    const password = e.target.password.value;

    if (authMode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setAuthError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setAuthError(error.message);
      else alert("Sign up successful! Please check your email for the verification link.");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!input.trim() && !selectedImage) || isTyping) return;
    const currentInput = input;
    const currentImage = imagePreview;
    setMessages(prev => [...prev, { role: 'user', content: currentInput, image: currentImage }]);
    setInput(''); setSelectedImage(null); setImagePreview(null); setIsTyping(true);

    try {
      const response = await fetch(`/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ message: currentInput, image_data: currentImage })
      });
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiContent = '';
      setMessages(prev => [...prev, { role: 'bot', content: '' }]);
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                aiContent += data.text;
                setMessages(prev => {
                  const n = [...prev]; n[n.length-1].content = aiContent; return n;
                });
              }
            } catch (e) {}
          }
        }
      }
      fetchHistory();
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', content: "AI Connection lost." }]);
    } finally { setIsTyping(false); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#0b0f1a] text-white"><Loader2 className="animate-spin text-blue-500 mr-2" /> Initializing AI Pro...</div>;

  if (!SUPABASE_URL) return <div className="h-screen flex items-center justify-center bg-[#0b0f1a] text-white">Missing VITE_SUPABASE keys. Check Vercel Settings.</div>;

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-10">
            <div className="inline-flex p-3 rounded-2xl bg-blue-500/10 mb-4 text-blue-500"><Bot size={32} /></div>
            <h1 className="text-3xl font-bold text-white mb-2">AI Pro</h1>
            <p className="text-slate-400">{authMode === 'login' ? 'Sign in to your account' : 'Create your pro account'}</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email</label>
              <input name="email" type="email" placeholder="name@domain.com" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
              <input name="password" type="password" placeholder="••••••••" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" required />
            </div>

            {authError && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{authError}</div>}

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all mt-4">
              {authMode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthError(null); }}
              className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              {authMode === 'login' ? "New here? Create an account" : "Already have an account? Sign in"}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-[#0b0f1a]">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside initial={{ width: 0 }} animate={{ width: 280 }} exit={{ width: 0 }} className="flex flex-col border-r dark:border-slate-800 bg-slate-50 dark:bg-[#080b14]">
            <div className="p-4">
              <button onClick={() => setMessages([])} className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/10">
                <Plus size={18} /><span>New Chat</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              <h3 className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Chat History</h3>
              {history.map((chat, idx) => (
                <button key={idx} onClick={() => setMessages([{role: 'user', content: chat.user_message}, {role: 'bot', content: chat.ai_response}])} className="w-full flex items-center space-x-3 p-3 rounded-xl text-left text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all truncate">
                  <MessageSquare size={14} className="flex-shrink-0" /><span className="truncate">{chat.user_message}</span>
                </button>
              ))}
            </div>
            <div className="p-4 border-t dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3 truncate">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white uppercase">{session.user.email[0]}</div>
                <span className="text-xs font-bold text-slate-500 truncate max-w-[120px]">{session.user.email}</span>
              </div>
              <button onClick={() => supabase.auth.signOut()} className="text-slate-400 hover:text-red-500 p-1 transition-colors"><LogOut size={18} /></button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <main className="relative flex-1 flex flex-col overflow-hidden">
        <header className="h-16 flex items-center justify-between px-6 border-b dark:border-slate-800 bg-white/50 dark:bg-[#0b0f1a]/50 backdrop-blur-xl">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all">
              {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
            <h2 className="text-sm font-black uppercase tracking-widest dark:text-white">AI Assistant Pro</h2>
          </div>
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all">
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
              <Bot size={64} className="text-blue-500 mb-6" />
              <h2 className="text-2xl font-black dark:text-white mb-2">PRO AI TERMINAL</h2>
              <p className="text-xs font-bold text-slate-500">KNOWLEDGE RETRIEVAL ACTIVE</p>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-3xl shadow-sm ${
                msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-slate-100 dark:bg-slate-800 dark:text-white rounded-tl-none'
              }`}>
                {msg.image && <img src={msg.image} className="max-w-full rounded-2xl mb-4 border border-white/10" alt="input" />}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-3xl rounded-tl-none flex space-x-1 items-center">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-6 border-t dark:border-slate-800 bg-white dark:bg-[#0b0f1a]">
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center space-x-3 bg-slate-100 dark:bg-slate-800 p-2 rounded-2xl border dark:border-slate-700 shadow-xl focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
            <button type="button" onClick={toggleListening} className={`p-2.5 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'}`}>
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Send a message..." className="flex-1 bg-transparent p-2 text-sm outline-none dark:text-white" />
            <button disabled={(!input.trim() && !selectedImage) || isTyping} className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20">
              <Send size={20} />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

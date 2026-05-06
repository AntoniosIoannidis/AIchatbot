import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { 
  Send, LogOut, Moon, Sun, MessageSquare, Plus, User, Bot, Loader2, ChevronLeft, ChevronRight, Mic, MicOff, Volume2, Globe, Image as ImageIcon, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Configuration (Safe Access) ---
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
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [authError, setAuthError] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- Inject Base Styles ---
  useEffect(() => {
    try {
      const style = document.createElement('style');
      style.innerHTML = `
        html, body, #root { height: 100vh !important; width: 100vw !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; font-family: sans-serif; background: #0f172a; }
        body { transition: background-color 0.2s, color 0.2s; }
        .dark body { background-color: #0f172a; color: #f8fafc; }
        * { box-sizing: border-box; }
        input::placeholder { color: #94a3b8; }
      `;
      document.head.appendChild(style);
    } catch (e) {}
  }, []);

  // --- Auth & Session ---
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    }).catch(() => setLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
    if (!session) return;
    try {
      const { data } = await axios.get(`/api/history`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      setHistory(data.history || []);
    } catch (err) { console.error("History fail:", err); }
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
      else alert("Check your email for a confirmation link!");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() && !selectedImage || isTyping) return;
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
      setMessages(prev => [...prev, { role: 'bot', content: "Connection error." }]);
    } finally { setIsTyping(false); }
  };

  if (loading) return <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0f172a', color:'white'}}><Loader2 className="animate-spin text-blue-500 mr-3" /> Loading...</div>;

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-white">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-2xl bg-slate-900 p-8 shadow-2xl border border-slate-800">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">AI Pro</h1>
            <p className="text-slate-400">{authMode === 'login' ? 'Welcome back' : 'Create your account'}</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
              <input name="email" type="email" placeholder="name@example.com" className="w-full rounded-lg bg-slate-800 border border-slate-700 p-3 outline-none focus:ring-2 focus:ring-blue-500 text-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
              <input name="password" type="password" placeholder="••••••••" className="w-full rounded-lg bg-slate-800 border border-slate-700 p-3 outline-none focus:ring-2 focus:ring-blue-500 text-white" required />
            </div>

            {authError && <div className="text-red-400 text-sm bg-red-400/10 p-2 rounded border border-red-400/20">{authError}</div>}

            <button type="submit" className="w-full rounded-lg bg-blue-600 p-3 font-bold text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
              {authMode === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-slate-500">
              {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}
            </span>
            <button 
              onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthError(null); }}
              className="ml-2 font-bold text-blue-400 hover:text-blue-300 underline"
            >
              {authMode === 'login' ? 'Create Account' : 'Log In'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-slate-900">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 300, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="flex flex-col border-r border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
            <div className="p-4 border-b dark:border-slate-800">
              <button onClick={() => setMessages([])} className="flex w-full items-center justify-center space-x-2 rounded-lg bg-blue-600 p-2 text-white font-bold hover:bg-blue-700 transition-colors">
                <Plus size={18} /><span>New Chat</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Your History</h3>
              {history.map((chat, idx) => (
                <button key={idx} onClick={() => setMessages([{role: 'user', content: chat.user_message}, {role: 'bot', content: chat.ai_response}])} className="flex w-full items-center space-x-3 rounded-lg p-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 group transition-all">
                  <MessageSquare size={14} className="flex-shrink-0" />
                  <span className="truncate">{chat.user_message}</span>
                </button>
              ))}
            </div>
            <div className="p-4 border-t dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2 truncate">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white uppercase">{session.user.email[0]}</div>
                <span className="text-xs text-slate-500 truncate max-w-[140px] font-medium">{session.user.email}</span>
              </div>
              <button onClick={() => supabase.auth.signOut()} className="text-slate-500 hover:text-red-500 p-1 rounded-md transition-colors"><LogOut size={16} /></button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <main className="relative flex flex-1 flex-col overflow-hidden bg-white dark:bg-[#0b0f1a]">
        <header className="flex h-16 items-center justify-between border-b px-6 dark:border-slate-800 bg-white/80 dark:bg-[#0b0f1a]/80 backdrop-blur-md z-10">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">{sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}</button>
            <h2 className="text-lg font-bold dark:text-white">AI Assistant Pro</h2>
          </div>
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">{darkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-3xl bg-blue-500/10 flex items-center justify-center mb-6">
                <Bot className="text-blue-500" size={48} />
              </div>
              <h2 className="text-3xl font-bold dark:text-white mb-2">How can I help you?</h2>
              <p className="text-slate-500 max-w-sm">I'm your Pro AI. Ask me about your PDFs, websites, or images.</p>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-5 py-3 shadow-sm ${
                msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-slate-100 dark:bg-slate-800 dark:text-slate-100 rounded-tl-none border dark:border-slate-700'
              }`}>
                {msg.image && <img src={msg.image} className="max-w-full rounded-lg mb-3 border border-white/20" alt="upload" />}
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-5 py-3 flex space-x-1 items-center rounded-tl-none border dark:border-slate-700">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-6 bg-white dark:bg-[#0b0f1a] border-t dark:border-slate-800">
          <form onSubmit={handleSendMessage} className="mx-auto max-w-4xl flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 rounded-2xl p-2 border dark:border-slate-700 shadow-lg focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
            <button type="button" onClick={toggleListening} className={`p-2 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type your message here..." className="flex-1 bg-transparent p-2 text-sm outline-none dark:text-white" />
            <button disabled={(!input.trim() && !selectedImage) || isTyping} className="bg-blue-600 p-2.5 rounded-xl text-white hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all shadow-md shadow-blue-600/20">
              <Send size={18} />
            </button>
          </form>
          <p className="text-[10px] text-center mt-3 text-slate-500 font-medium">Enterprise AI powered by Gemini 1.5 Flash</p>
        </div>
      </main>
    </div>
  );
}

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

// Initialize Supabase only if keys exist to prevent early crash
let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
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
      `;
      document.head.appendChild(style);
    } catch (e) {}
  }, []);

  // --- Auth & Session (With Safety) ---
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

  // --- Voice Integration (Safe initialization) ---
  const recognition = useRef(null);
  useEffect(() => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognition.current = new SpeechRecognition();
        recognition.current.onresult = (e) => setInput(e.results[0][0].transcript);
        recognition.current.onend = () => setIsListening(false);
      }
    } catch (e) { console.warn("Voice not supported"); }
  }, []);

  const toggleListening = () => {
    if (!recognition.current) return alert("Speech recognition not supported in this browser.");
    if (isListening) recognition.current.stop();
    else { setIsListening(true); recognition.current.start(); }
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
      setMessages(prev => [...prev, { role: 'bot', content: "Lost connection to AI brain." }]);
    } finally { setIsTyping(false); }
  };

  if (loading) return <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0f172a', color:'white'}}>Loading AI Assistant...</div>;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0f172a', color:'white'}}>Configuration Error: Missing VITE_SUPABASE keys in Vercel.</div>;

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-white">
        <div className="w-full max-w-md rounded-2xl bg-slate-900 p-8 shadow-xl border border-slate-800">
          <h1 className="text-3xl font-bold text-center mb-8">AI Assistant</h1>
          <form onSubmit={(e) => {
            e.preventDefault();
            supabase.auth.signInWithPassword({ email: e.target.email.value, password: e.target.password.value });
          }} className="space-y-4 text-slate-900">
            <input name="email" type="email" placeholder="Email" className="w-full rounded-lg bg-white p-3 outline-none" required />
            <input name="password" type="password" placeholder="Password" className="w-full rounded-lg bg-white p-3 outline-none" required />
            <button type="submit" className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700">Sign In</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-slate-900">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside initial={{ width: 0 }} animate={{ width: 300 }} exit={{ width: 0 }} className="flex flex-col border-r border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
            <div className="p-4 space-y-4">
              <button onClick={() => setMessages([])} className="flex w-full items-center justify-center space-x-2 rounded-lg bg-blue-600 p-2 text-white"><Plus size={18} /><span>New Chat</span></button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
              {history.map((chat, idx) => (
                <button key={idx} onClick={() => setMessages([{role: 'user', content: chat.user_message}, {role: 'bot', content: chat.ai_response}])} className="flex w-full items-center space-x-3 rounded-lg p-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800">
                  <MessageSquare size={14} /><span className="truncate">{chat.user_message}</span>
                </button>
              ))}
            </div>
            <div className="p-4 border-t dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500 truncate max-w-[150px]">{session.user.email}</span>
              <button onClick={() => supabase.auth.signOut()} className="text-slate-500"><LogOut size={16} /></button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
      <main className="relative flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b px-6 dark:border-slate-800">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">{sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}</button>
          <h2 className="text-lg font-bold dark:text-white">AI Assistant Pro</h2>
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">{darkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
        </header>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && <div className="h-full flex flex-col items-center justify-center"><Bot className="text-blue-500 mb-4" size={64} /><h2 className="text-2xl font-bold dark:text-white text-slate-900">How can I help?</h2></div>}
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 dark:text-white text-slate-900'}`}>
                {msg.image && <img src={msg.image} className="max-w-full rounded-lg mb-2" alt="upload" />}
                <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-6 border-t dark:border-slate-800">
          <form onSubmit={handleSendMessage} className="mx-auto max-w-4xl flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 rounded-xl p-2 border dark:border-slate-700 shadow-sm">
            <button type="button" onClick={toggleListening} className="p-2 text-slate-400 hover:bg-slate-200"><Mic size={20} /></button>
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message..." className="flex-1 bg-transparent p-2 text-sm outline-none dark:text-white" />
            <button disabled={(!input.trim() && !selectedImage) || isTyping} className="bg-blue-600 p-2 rounded-lg text-white disabled:opacity-50"><Send size={20} /></button>
          </form>
        </div>
      </main>
    </div>
  );
}

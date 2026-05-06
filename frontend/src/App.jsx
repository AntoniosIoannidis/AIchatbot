import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { 
  Send, 
  LogOut, 
  Moon, 
  Sun, 
  MessageSquare, 
  Plus, 
  User, 
  Bot,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Mic,
  MicOff,
  Volume2,
  Globe,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Configuration ---
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const BACKEND_URL = '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

  // --- Voice Integration ---
  const recognition = useRef(null);

  useEffect(() => {
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };
      recognition.current.onerror = () => setIsListening(false);
      recognition.current.onend = () => setIsListening(false);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) recognition.current?.stop();
    else { setIsListening(true); recognition.current?.start(); }
  };

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  // --- Image Handling ---
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Auth & Session ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  useEffect(() => { if (session) fetchHistory(); }, [session]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  const fetchHistory = async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/history`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      setHistory(data.history || []);
    } catch (err) { console.error(err); }
  };

  // --- Streaming Chat Logic ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() && !selectedImage || isTyping) return;

    const userMessage = { role: 'user', content: input, image: imagePreview };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    const currentImage = imagePreview;
    
    setInput('');
    removeImage();
    setIsTyping(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          message: currentInput,
          image_data: currentImage
        })
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
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1].content = aiContent;
                  return newMsgs;
                });
              }
            } catch (e) { /* partial chunk */ }
          }
        }
      }
      fetchHistory();
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', content: "Error connecting to server." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleScrape = async () => {
    if (!scrapeUrl.trim()) return;
    setIsScraping(true);
    try {
      await axios.post(`${BACKEND_URL}/api/scrape`, 
        { url: scrapeUrl },
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      setScrapeUrl('');
      alert("Website successfully learned!");
    } catch (err) { alert("Failed to scrape website."); }
    finally { setIsScraping(false); }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-900"><Loader2 className="animate-spin text-blue-500" size={48} /></div>;

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md rounded-2xl bg-slate-900 p-8 shadow-xl border border-slate-800">
          <h1 className="text-3xl font-bold text-center mb-8 text-white">AI Assistant</h1>
          <form onSubmit={(e) => {
            e.preventDefault();
            supabase.auth.signInWithPassword({ email: e.target.email.value, password: e.target.password.value });
          }} className="space-y-4">
            <input name="email" type="email" placeholder="Email" className="w-full rounded-lg bg-slate-800 p-3 text-white outline-none focus:ring-2 focus:ring-blue-500 border border-slate-700" required />
            <input name="password" type="password" placeholder="Password" className="w-full rounded-lg bg-slate-800 p-3 text-white outline-none focus:ring-2 focus:ring-blue-500 border border-slate-700" required />
            <button type="submit" className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700 transition-colors">Sign In</button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-slate-900 transition-colors duration-200">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 300, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="flex flex-col border-r border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
            <div className="p-4 space-y-4 border-b border-slate-200 dark:border-slate-800">
              <button onClick={() => setMessages([])} className="flex w-full items-center justify-center space-x-2 rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700 transition-colors"><Plus size={18} /><span>New Chat</span></button>
              
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase">Scrape Website</label>
                <div className="flex space-x-2">
                  <input value={scrapeUrl} onChange={e => setScrapeUrl(e.target.value)} placeholder="https://..." className="flex-1 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500" />
                  <button onClick={handleScrape} disabled={isScraping} className="p-1.5 bg-slate-200 dark:bg-slate-700 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600">
                    {isScraping ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
              <h3 className="text-xs font-semibold uppercase text-slate-500">History</h3>
              {history.map((chat, idx) => (
                <button key={idx} onClick={() => setMessages([{role: 'user', content: chat.user_message}, {role: 'bot', content: chat.ai_response}])} className="flex w-full items-center space-x-3 rounded-lg p-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                  <MessageSquare size={14} />
                  <span className="truncate">{chat.user_message}</span>
                </button>
              ))}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500 truncate max-w-[150px]">{session.user.email}</span>
              <button onClick={() => supabase.auth.signOut()} className="text-slate-500 hover:text-red-500"><LogOut size={16} /></button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <main className="relative flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 px-6 dark:border-slate-800">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">{sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}</button>
            <h2 className="text-lg font-bold dark:text-white">AI Assistant Pro</h2>
          </div>
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">{darkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-slate-900">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center">
              <Bot className="text-blue-500 mb-4" size={64} />
              <h2 className="text-2xl font-bold dark:text-white">Ready for your prompt.</h2>
              <p className="text-slate-500 mt-2">I can read PDFs, scrape websites, see images, and remember our chat.</p>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`relative group max-w-[80%] space-y-2`}>
                {msg.image && (
                  <img src={msg.image} alt="User upload" className="max-w-full rounded-xl shadow-md border border-slate-200 dark:border-slate-700" />
                )}
                <div className={`rounded-2xl px-4 py-3 shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'}`}>
                  {msg.role === 'bot' && (
                    <button onClick={() => speak(msg.content)} className="absolute -right-8 top-1 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-blue-500"><Volume2 size={16} /></button>
                  )}
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <AnimatePresence>
            {imagePreview && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="relative mb-4 inline-block">
                <img src={imagePreview} className="h-24 w-24 object-cover rounded-lg border-2 border-blue-500 shadow-lg" alt="Preview" />
                <button onClick={removeImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"><X size={12} /></button>
              </motion.div>
            )}
          </AnimatePresence>
          
          <form onSubmit={handleSendMessage} className="mx-auto max-w-4xl flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 rounded-xl p-2 border border-slate-200 dark:border-slate-700 shadow-sm">
            <button type="button" onClick={toggleListening} className={`p-2 rounded-lg transition-colors ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg">
              <ImageIcon size={20} />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
            
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type, speak, or upload an image..." className="flex-1 bg-transparent p-2 text-sm outline-none dark:text-white" />
            <button disabled={(!input.trim() && !selectedImage) || isTyping} className="bg-blue-600 p-2 rounded-lg text-white hover:bg-blue-700 disabled:opacity-50"><Send size={20} /></button>
          </form>
        </div>
      </main>
    </div>
  );
}

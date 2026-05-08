import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { Loader2, AlertCircle } from 'lucide-react';

// Components
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';

// --- Configuration ---
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fail-safe client initialization
let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    console.error("Supabase initialization failed:", e);
  }
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState(!SUPABASE_URL || !SUPABASE_ANON_KEY);
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (configError || !supabase) { 
      setLoading(false); 
      return; 
    }
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    
    return () => subscription?.unsubscribe();
  }, [configError]);

  useEffect(() => {
    // Basic body styles are now in App.css
    document.body.className = 'custom-scrollbar';
  }, []);

  useEffect(() => {
    if (session) fetchHistory();
  }, [session]);

  const fetchHistory = async () => {
    try {
      const { data } = await axios.get(`/api/history`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      setHistory(data.history || []);
    } catch (err) {
      console.error("Failed to fetch history:", err);
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
      if (!response.ok) throw new Error('API request failed');
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
                  const updated = [...prev];
                  updated[updated.length - 1].content = aiContent;
                  return updated;
                });
              }
            } catch (e) {}
          }
        }
      }
      fetchHistory();
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', content: "Connection lost." }]);
    } finally { setIsTyping(false); }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#212121]">
       <div className="w-12 h-12 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );

  if (configError) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#212121] text-center p-6">
      <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20">
        <AlertCircle className="text-red-500" size={32} />
      </div>
      <h1 className="text-xl font-bold text-white mb-2">Configuration Missing</h1>
      <p className="text-slate-400 max-w-sm text-sm mb-8 leading-relaxed">
        The VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables are missing. 
        Please check your local .env or Vercel settings and redeploy.
      </p>
      <button 
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-emerald-600 hover:text-white transition-all text-xs tracking-widest uppercase"
      >
        Retry Connection
      </button>
    </div>
  );

  if (!session) return <Auth supabase={supabase} />;

  return (
    <div className="flex h-screen overflow-hidden bg-[#212121]">
      <Sidebar 
        history={history} 
        setMessages={setMessages} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        session={session} 
        supabase={supabase}
        fetchHistory={fetchHistory}
      />
      
      <ChatArea 
        messages={messages}
        input={input}
        setInput={setInput}
        handleSendMessage={handleSendMessage}
        isTyping={isTyping}
        isListening={isListening}
        toggleListening={() => setIsListening(!isListening)}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        selectedImage={selectedImage}
        setSelectedImage={setSelectedImage}
        imagePreview={imagePreview}
        setImagePreview={setImagePreview}
        fileInputRef={fileInputRef}
      />
    </div>
  );
}

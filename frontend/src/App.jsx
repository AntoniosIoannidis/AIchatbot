import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

// Components
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';

// --- Configuration ---
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

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
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // --- Auth Session ---
  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription?.unsubscribe();
  }, []);

  // --- Styles & Dark Mode ---
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    
    const style = document.createElement('style');
    style.innerHTML = `
      body { margin: 0; padding: 0; background: #0b0f1a; color: #f8fafc; overflow: hidden; font-family: 'Inter', sans-serif; }
      .custom-scrollbar::-webkit-scrollbar { width: 5px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
    `;
    document.head.appendChild(style);
  }, [darkMode]);

  // --- Fetch History ---
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
    setInput('');
    setSelectedImage(null);
    setImagePreview(null);
    setIsTyping(true);

    try {
      const response = await fetch(`/api/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${session.access_token}` 
        },     
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
            } catch (e) {
              // Silently handle parse errors for partial chunks
            }
          }
        }
      }
      fetchHistory();
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, { role: 'bot', content: "Connection lost. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleListening = () => {
    // Voice implementation placeholder or use SpeechRecognition API
    setIsListening(!isListening);
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#0b0f1a] text-white">
        <div className="relative">
          <Loader2 className="animate-spin text-blue-500 w-12 h-12 mb-4" />
          <div className="absolute inset-0 blur-xl bg-blue-500/20 animate-pulse" />
        </div>
        <span className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Initializing Intelligence</span>
      </div>
    );
  }

  if (!supabase) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0b0f1a] text-white p-8 text-center">
        <div className="max-w-md p-10 bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl">
          <h2 className="text-2xl font-bold mb-4">Configuration Error</h2>
          <p className="text-slate-400">Supabase environment variables are missing. Please check your project setup.</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth supabase={supabase} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0b0f1a]">
      <Sidebar 
        history={history} 
        setMessages={setMessages} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        session={session} 
        supabase={supabase} 
      />
      
      <ChatArea 
        messages={messages}
        input={input}
        setInput={setInput}
        handleSendMessage={handleSendMessage}
        isTyping={isTyping}
        isListening={isListening}
        toggleListening={toggleListening}
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

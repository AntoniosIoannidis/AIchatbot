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
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default closed for minimalism
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

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

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      body { margin: 0; padding: 0; background: #05070a; color: #f8fafc; overflow: hidden; font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
      .custom-scrollbar::-webkit-scrollbar { width: 4px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      ::selection { background: rgba(59, 130, 246, 0.3); color: white; }
    `;
    document.head.appendChild(style);
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
    <div className="h-screen flex items-center justify-center bg-[#05070a]">
       <div className="w-12 h-12 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  if (!session) return <Auth supabase={supabase} />;

  return (
    <div className="flex h-screen overflow-hidden bg-[#05070a]">
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

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { Loader2, AlertCircle } from 'lucide-react';

// Styles
import './App.css';

// Components
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
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
      setMessages(prev => [...prev, { role: 'bot', content: "JimyAI Connection Error. Please try again." }]);
    } finally { setIsTyping(false); }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#020617]">
       <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
    </div>
  );

  if (configError) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#020617] text-white p-10 text-center">
      <AlertCircle className="text-red-500 w-16 h-16 mb-4" />
      <h1 className="text-2xl font-bold">System Configuration Missing</h1>
      <p className="text-slate-400 mt-2">Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.</p>
    </div>
  );

  if (!session) return <Auth supabase={supabase} />;

  return (
    <div className="app-container">
      <div className="luxury-bg"></div>
      
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

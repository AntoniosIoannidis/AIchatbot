import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { Loader2, AlertCircle } from 'lucide-react';
import { Toaster, toast } from 'sonner';

// Styles
import './App.css';

// Components
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Initialize Supabase only once
const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

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
  const abortControllerRef = useRef(null);

  // Initialize Auth
  useEffect(() => {
    if (configError || !supabase) { 
      setLoading(false); 
      return; 
    }

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription?.unsubscribe();
  }, [configError]);

  // Fetch History
  const fetchHistory = useCallback(async () => {
    if (!session) return;
    try {
      const { data } = await axios.get(`/api/history`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      setHistory(data.history || []);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  }, [session]);

  useEffect(() => {
    if (session) fetchHistory();
  }, [session, fetchHistory]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!input.trim() && !selectedImage) || isTyping) return;

    const currentInput = input;
    const currentImage = imagePreview;

    // Add user message to UI
    const userMsg = { role: 'user', content: currentInput, image: currentImage };
    setMessages(prev => [...prev, userMsg]);
    
    // Reset inputs
    setInput('');
    setSelectedImage(null);
    setImagePreview(null);
    setIsTyping(true);

    // Cancel any existing request
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`/api/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${session.access_token}` 
        },     
        body: JSON.stringify({ message: currentInput, image_data: currentImage }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) throw new Error('API request failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiContent = '';
      
      // Initialize bot message
      setMessages(prev => [...prev, { role: 'bot', content: '' }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;
            
            try {
              const data = JSON.parse(jsonStr);
              if (data.text) {
                aiContent += data.text;
                setMessages(prev => {
                  const updated = [...prev];
                  const lastMsg = updated[updated.length - 1];
                  if (lastMsg && lastMsg.role === 'bot') {
                    lastMsg.content = aiContent;
                  }
                  return [...updated];
                });
              }
            } catch (e) {
              console.warn("JSON parse error in stream:", e);
            }
          }
        }
      }
      
      // Refresh history after successful message
      fetchHistory();
    } catch (err) {
      if (err.name === 'AbortError') return;
      
      console.error("Chat error:", err);
      toast.error("JimyAI Connection Error. Please try again.");
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: "I'm having trouble connecting to the neural network. Please check your connection and try again." 
      }]);
    } finally { 
      setIsTyping(false); 
      abortControllerRef.current = null;
    }
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

  if (!session) return (
    <>
      <Toaster position="top-center" theme="dark" />
      <Auth supabase={supabase} />
    </>
  );

  return (
    <div className={`app-container ${sidebarOpen ? 'sidebar-visible' : ''}`}>
      <Toaster position="top-center" theme="dark" richColors />
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

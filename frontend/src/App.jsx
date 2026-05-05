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
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Configuration ---
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

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
  const messagesEndRef = useRef(null);

  // Auth & Session Management
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

  // Dark Mode Toggle
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Fetch History
  useEffect(() => {
    if (session) {
      fetchHistory();
    }
  }, [session]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const fetchHistory = async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/history`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      setHistory(data.history || []);
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const { data } = await axios.post(`${BACKEND_URL}/chat`, 
        { message: input },
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );

      const aiMessage = { role: 'bot', content: data.answer };
      setMessages(prev => [...prev, aiMessage]);
      fetchHistory(); // Update history sidebar
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, { role: 'bot', content: "Sorry, something went wrong. Check your connection." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert("Check your email for confirmation!");
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
      <Loader2 className="animate-spin text-blue-500" size={48} />
    </div>
  );

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-slate-900"
        >
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">AI Chatbot</h1>
            <p className="text-slate-500 dark:text-slate-400">Sign in to start chatting</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              name="email" 
              type="email" 
              placeholder="Email" 
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              required 
            />
            <input 
              name="password" 
              type="password" 
              placeholder="Password" 
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              required 
            />
            <button 
              type="submit"
              className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white transition-hover hover:bg-blue-700"
            >
              Sign In
            </button>
          </form>
          <div className="mt-6 flex items-center justify-center space-x-2 text-sm text-slate-500">
            <span>Don't have an account?</span>
            <button onClick={() => alert("Registration logic: Use handleSignUp with the form data.")} className="font-semibold text-blue-600 hover:underline">Sign Up</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-slate-900">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="flex flex-col border-r border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="p-4">
              <button 
                onClick={() => setMessages([])}
                className="flex w-full items-center justify-center space-x-2 rounded-lg border border-slate-300 bg-white p-2 font-medium text-slate-700 transition-hover hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Plus size={18} />
                <span>New Chat</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
              <h3 className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Past Conversations</h3>
              {history.map((chat, idx) => (
                <button 
                  key={idx}
                  onClick={() => setMessages([{role: 'user', content: chat.user_message}, {role: 'bot', content: chat.ai_response}])}
                  className="flex w-full items-center space-x-3 rounded-lg p-2 text-left text-sm text-slate-600 transition-hover hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <MessageSquare size={16} />
                  <span className="truncate">{chat.user_message}</span>
                </button>
              ))}
            </div>

            <div className="border-t border-slate-200 p-4 dark:border-slate-800">
              <div className="flex items-center space-x-3 rounded-lg p-2">
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                  <User size={16} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium dark:text-white">{session.user.email}</p>
                </div>
                <button onClick={() => supabase.auth.signOut()} className="text-slate-500 hover:text-red-500 dark:text-slate-400">
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <main className="relative flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 px-6 dark:border-slate-800">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
            <h2 className="text-lg font-bold dark:text-white">AI Assistant</h2>
          </div>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-full bg-blue-100 p-4 dark:bg-blue-900/30">
                <Bot className="text-blue-600 dark:text-blue-400" size={48} />
              </div>
              <h3 className="text-xl font-semibold dark:text-white">How can I help you today?</h3>
              <p className="mt-2 text-slate-500 dark:text-slate-400">Ask me anything about your documents or start a general chat.</p>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100 shadow-sm'
              }`}>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-3 flex space-x-1 items-center">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t border-slate-200 p-6 dark:border-slate-800">
          <form onSubmit={handleSendMessage} className="mx-auto max-w-4xl flex items-center space-x-4 bg-slate-50 dark:bg-slate-800 rounded-xl p-2 shadow-inner border border-slate-200 dark:border-slate-700">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message AI Assistant..."
              className="flex-1 bg-transparent p-2 text-slate-800 dark:text-white outline-none"
            />
            <button 
              disabled={!input.trim() || isTyping}
              className="rounded-lg bg-blue-600 p-2 text-white shadow-md transition-hover hover:bg-blue-700 disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </form>
          <p className="mt-3 text-center text-[10px] text-slate-400">
            AI can make mistakes. Check important info.
          </p>
        </div>
      </main>
    </div>
  );
}

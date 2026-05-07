import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, LogOut, X, User, Bot, Globe, Loader2, CheckCircle, Compass } from 'lucide-react';
import axios from 'axios';

export default function Sidebar({ history, setMessages, sidebarOpen, setSidebarOpen, session, supabase, fetchHistory }) {
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);

  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear your chat history?")) return;
    try {
      await axios.delete('/api/history', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      fetchHistory();
      setMessages([]);
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  };

  const handleScrape = async (e) => {
    e.preventDefault();
    if (!scrapeUrl) return;
    setIsScraping(true);
    try {
      await axios.post('/api/scrape', { url: scrapeUrl }, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      setScrapeUrl('');
      alert("Context injected successfully!");
    } catch (err) {
      alert("Failed to inject context.");
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <motion.aside
          initial={{ x: -350, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -350, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          className="fixed inset-y-0 left-0 w-[320px] bg-[#05070a]/90 backdrop-blur-2xl border-r border-white/5 z-50 flex flex-col p-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Compass size={18} className="text-white" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Navigator</span>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)} 
              className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-full transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* New Chat */}
          <button
            onClick={() => { setMessages([]); setSidebarOpen(false); }}
            className="group w-full flex items-center justify-between bg-white text-black p-4 rounded-2xl font-bold text-xs mb-10 hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-[0_8px_30px_rgb(255,255,255,0.1)]"
          >
            <span className="tracking-widest">NEW SESSION</span>
            <Plus size={16} className="group-hover:rotate-90 transition-transform" />
          </button>

          {/* History */}
          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Recent Archive</h3>
              {history.length > 0 && (
                <button 
                  onClick={handleClearHistory}
                  className="text-[9px] font-bold text-slate-600 hover:text-red-500 transition-colors uppercase tracking-widest"
                >
                  Clear
                </button>
              )}
            </div>
            {history.map((chat, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setMessages([{role: 'user', content: chat.user_message}, {role: 'bot', content: chat.ai_response}]);
                  setSidebarOpen(false);
                }}
                className="w-full text-left p-3.5 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-white/[0.03] transition-all group border border-transparent hover:border-white/5"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare size={14} className="group-hover:text-blue-500 transition-colors" />
                  <span className="truncate font-medium">{chat.user_message}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Bottom Tools */}
          <div className="mt-6 pt-6 border-t border-white/5 space-y-5">
            <form onSubmit={handleScrape} className="relative group">
               <input 
                  value={scrapeUrl}
                  onChange={e => setScrapeUrl(e.target.value)}
                  placeholder="Inject URL..."
                  className="w-full bg-white/[0.02] border border-white/10 rounded-xl py-3.5 pl-4 pr-10 text-[11px] text-white outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-700"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-blue-500 transition-colors">
                  {isScraping ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
                </button>
            </form>

            <div className="flex items-center justify-between bg-white/[0.02] p-3 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-[10px] font-black text-white shadow-lg">
                  {session.user.email[0].toUpperCase()}
                </div>
                <div className="flex flex-col">
                   <span className="text-[11px] font-bold text-white truncate max-w-[120px]">{session.user.email.split('@')[0]}</span>
                   <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Active</span>
                   </div>
                </div>
              </div>
              <button onClick={() => supabase.auth.signOut()} className="p-2.5 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

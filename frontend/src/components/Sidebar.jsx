import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, LogOut, X, User, Bot, Globe, Loader2, CheckCircle, Compass } from 'lucide-react';
import axios from 'axios';

export default function Sidebar({ history, setMessages, sidebarOpen, setSidebarOpen, session, supabase, fetchHistory }) {
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState(null);

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
    setScrapeStatus(null);
    try {
      await axios.post('/api/scrape', { url: scrapeUrl }, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      setScrapeStatus('success');
      setScrapeUrl('');
      setTimeout(() => setScrapeStatus(null), 3000);
    } catch (err) {
      setScrapeStatus('error');
      setTimeout(() => setScrapeStatus(null), 3000);
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <motion.aside
          initial={{ x: -400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -400, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-y-0 left-0 w-[350px] bg-[#05070a]/80 backdrop-blur-3xl border-r border-white/5 z-50 flex flex-col p-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center space-x-3 text-white">
              <Compass size={24} className="text-blue-500" />
              <span className="text-xs font-black uppercase tracking-[0.4em]">Navigator</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="text-slate-500 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* New Chat */}
          <button
            onClick={() => { setMessages([]); setSidebarOpen(false); }}
            className="w-full flex items-center justify-between bg-white text-black p-5 rounded-3xl font-bold text-sm mb-12 hover:bg-blue-500 hover:text-white transition-all duration-300"
          >
            <span>NEW SESSION</span>
            <Plus size={18} />
          </button>

          {/* History */}
          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em]">Archive</h3>
              {history.length > 0 && (
                <button 
                  onClick={handleClearHistory}
                  className="text-[9px] font-bold text-slate-500 hover:text-red-500 transition-colors uppercase tracking-widest"
                >
                  Clear All
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
                className="w-full text-left p-4 rounded-2xl text-xs text-slate-500 hover:text-white hover:bg-white/[0.03] transition-all group border border-transparent hover:border-white/5"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare size={14} className="group-hover:text-blue-500 transition-colors" />
                  <span className="truncate font-medium">{chat.user_message}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Bottom Tools */}
          <div className="mt-8 pt-8 border-t border-white/5 space-y-6">
            <form onSubmit={handleScrape} className="relative group">
               <input 
                  value={scrapeUrl}
                  onChange={e => setScrapeUrl(e.target.value)}
                  placeholder="Inject Context URL..."
                  className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-4 pr-12 text-[11px] text-white outline-none focus:border-blue-500/50 transition-all"
                />
                <button className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-blue-500 transition-colors">
                  {isScraping ? <Loader2 size={16} className="animate-spin" /> : <Globe size={16} />}
                </button>
            </form>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-xs font-black text-white">
                  {session.user.email[0].toUpperCase()}
                </div>
                <div className="flex flex-col">
                   <span className="text-xs font-bold text-white">{session.user.email.split('@')[0]}</span>
                   <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Active session</span>
                </div>
              </div>
              <button onClick={() => supabase.auth.signOut()} className="p-3 text-slate-700 hover:text-red-500 transition-colors">
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

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
          initial={{ x: -280, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -280, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-y-0 left-0 w-[280px] bg-[#020617] z-50 flex flex-col p-4 border-r border-white/5"
        >
          {/* Logo / Brand */}
          <div className="flex items-center gap-3 px-2 mb-8">
             <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                <Bot size={18} className="text-white" />
             </div>
             <span className="text-lg font-bold text-white tracking-tight">JimyAI</span>
          </div>

          {/* New Chat Button */}
          <button
            onClick={() => { setMessages([]); setSidebarOpen(false); }}
            className="flex items-center gap-3 w-full p-4 rounded-2xl text-white text-sm bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/10 transition-all mb-6 group"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            <span className="font-semibold">New Session</span>
          </button>

          {/* History */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="mt-4 mb-2 px-3 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#b4b4b4] uppercase tracking-wider">Recent</span>
              {history.length > 0 && (
                <button 
                  onClick={handleClearHistory}
                  className="text-[11px] font-medium text-[#b4b4b4] hover:text-white transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="space-y-1">
              {history.map((chat, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setMessages([{role: 'user', content: chat.user_message}, {role: 'bot', content: chat.ai_response}]);
                    setSidebarOpen(false);
                  }}
                  className="w-full text-left p-3 rounded-md text-sm text-[#ececec] hover:bg-[#2f2f2f] transition-all group flex items-center gap-3 truncate"
                >
                  <MessageSquare size={16} className="shrink-0 text-[#b4b4b4]" />
                  <span className="truncate">{chat.user_message}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Tools & User */}
          <div className="mt-auto pt-3 border-t border-white/10 space-y-2">
            <form onSubmit={handleScrape} className="relative">
               <input 
                  value={scrapeUrl}
                  onChange={e => setScrapeUrl(e.target.value)}
                  placeholder="Inject URL..."
                  className="w-full bg-transparent border border-white/10 rounded-md py-2 pl-3 pr-8 text-sm text-white outline-none focus:border-emerald-500/50 transition-all placeholder:text-[#676767]"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 text-[#b4b4b4] hover:text-white">
                  {isScraping ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
                </button>
            </form>

            <div className="flex items-center justify-between p-2 rounded-md hover:bg-[#2f2f2f] transition-colors group cursor-pointer">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {session.user.email[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium text-white truncate">{session.user.email}</span>
              </div>
              <button onClick={() => supabase.auth.signOut()} className="p-2 text-[#b4b4b4] hover:text-red-400 rounded-md transition-all">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

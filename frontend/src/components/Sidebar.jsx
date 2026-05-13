import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, MessageSquare, LogOut, X, Globe, Loader2, 
  Trash2, ChevronLeft, User, Sparkles, LayoutDashboard, History 
} from 'lucide-react';
import axios from 'axios';
import { format, isToday, isYesterday, subDays, isAfter } from 'date-fns';
import { toast } from 'sonner';

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
      toast.success("History cleared");
    } catch (err) {
      toast.error("Failed to clear history");
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
      toast.success("Context injected successfully!");
    } catch (err) {
      toast.error("Failed to inject context.");
    } finally {
      setIsScraping(false);
    }
  };

  const groupedHistory = useMemo(() => {
    const groups = {
      Today: [],
      Yesterday: [],
      'Last 7 Days': [],
      Older: []
    };

    history.forEach(chat => {
      const date = new Date(chat.created_at || Date.now());
      if (isToday(date)) groups.Today.push(chat);
      else if (isYesterday(date)) groups.Yesterday.push(chat);
      else if (isAfter(date, subDays(new Date(), 7))) groups['Last 7 Days'].push(chat);
      else groups.Older.push(chat);
    });

    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  }, [history]);

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          {/* Background Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="sidebar-overlay"
          />

          {/* Sidebar Drawer */}
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 240 }}
            className="sidebar-container flex flex-col p-4"
          >
            {/* Logo / Brand */}
            <div className="flex items-center justify-between px-2 mb-8 mt-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-white/10">
                    <span className="text-xl font-black text-white italic">J</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-white tracking-tight leading-none">JimyAI</span>
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Intelligence</span>
                </div>
              </div>
              
              <button 
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-slate-500 hover:text-white transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
            </div>

            {/* New Chat Button */}
            <button
              onClick={() => { setMessages([]); setSidebarOpen(false); }}
              className="flex items-center gap-3 w-full p-4 rounded-2xl text-white text-sm bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all mb-8 group"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
              <span className="font-bold">New Session</span>
            </button>

            {/* History Section */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
              {groupedHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 opacity-20 text-center px-4">
                  <History size={32} className="mb-2" />
                  <span className="text-xs font-medium">Your intelligence history will appear here</span>
                </div>
              ) : (
                <div className="space-y-8">
                  {groupedHistory.map(([group, items]) => (
                    <div key={group}>
                      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 px-3 flex items-center gap-2">
                        <span className="w-1 h-1 bg-indigo-500 rounded-full" />
                        {group}
                      </h3>
                      <div className="space-y-2">
                        {items.map((chat, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setMessages([
                                {role: 'user', content: chat.user_message}, 
                                {role: 'bot', content: chat.ai_response}
                              ]);
                              setSidebarOpen(false);
                            }}
                            className="history-card group"
                          >
                            <div className="history-card-icon">
                              <MessageSquare size={14} />
                            </div>
                            <div className="history-card-content">
                              <div className="history-card-title">{chat.user_message}</div>
                              <div className="history-card-subtitle">
                                {format(new Date(chat.created_at || Date.now()), 'h:mm a')}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Section */}
            <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
              <form onSubmit={handleScrape} className="relative group">
                <input 
                    value={scrapeUrl}
                    onChange={e => setScrapeUrl(e.target.value)}
                    placeholder="Inject knowledge URL..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-3 pr-10 text-xs text-white outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-600"
                  />
                  <button 
                    disabled={isScraping}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-400 transition-colors"
                  >
                    {isScraping ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
                  </button>
              </form>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 group">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-xs font-black text-white shrink-0 shadow-lg border border-white/10">
                    {session.user.email[0].toUpperCase()}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[11px] font-bold text-white truncate">{session.user.email}</span>
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Premium Node</span>
                  </div>
                </div>
                <button 
                  onClick={() => supabase.auth.signOut()} 
                  className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>

              <button 
                onClick={handleClearHistory}
                className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-black text-slate-600 hover:text-red-400 transition-colors uppercase tracking-[0.3em]"
              >
                <Trash2 size={12} />
                Clear Core Memory
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

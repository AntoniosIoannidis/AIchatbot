import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, LogOut, ChevronLeft, User, Bot, Globe, Loader2, CheckCircle } from 'lucide-react';
import axios from 'axios';

export default function Sidebar({ history, setMessages, sidebarOpen, setSidebarOpen, session, supabase }) {
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState(null);

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
    <AnimatePresence mode="wait">
      {sidebarOpen && (
        <motion.aside
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          className="flex flex-col border-r border-slate-800 bg-[#080b14] w-[300px] h-screen fixed lg:relative z-50 shadow-2xl"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                <Bot size={20} />
              </div>
              <span className="font-black tracking-widest text-xs text-white uppercase">AI Control</span>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400"
            >
              <ChevronLeft size={20} />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMessages([])}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white p-4 rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20 group"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              <span>New Conversation</span>
            </motion.button>
          </div>

          {/* Scrape Tool */}
          <div className="px-6 mb-6">
            <form onSubmit={handleScrape} className="space-y-2">
              <div className="relative">
                <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  value={scrapeUrl}
                  onChange={e => setScrapeUrl(e.target.value)}
                  placeholder="Scrape URL for context..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
                />
              </div>
              <button 
                disabled={isScraping || !scrapeUrl}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-300 transition-all flex items-center justify-center disabled:opacity-50"
              >
                {isScraping ? <Loader2 size={12} className="animate-spin mr-2" /> : (scrapeStatus === 'success' ? <CheckCircle size={12} className="mr-2 text-emerald-500" /> : null)}
                {isScraping ? 'Indexing...' : (scrapeStatus === 'success' ? 'Indexed' : 'Inject Context')}
              </button>
            </form>
          </div>

          {/* History List */}
          <div className="flex-1 overflow-y-auto px-4 space-y-1 custom-scrollbar">
            <h3 className="px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Recent Intelligence</h3>
            {history.map((chat, idx) => (
              <motion.button
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setMessages([{role: 'user', content: chat.user_message}, {role: 'bot', content: chat.ai_response}])}
                className="w-full flex items-center space-x-3 p-4 rounded-2xl text-left text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent hover:border-slate-700/50 transition-all group"
              >
                <MessageSquare size={16} className="flex-shrink-0 text-slate-600 group-hover:text-blue-400 transition-colors" />
                <span className="truncate font-medium">{chat.user_message}</span>
              </motion.button>
            ))}
          </div>

          {/* User Profile */}
          <div className="p-6 border-t border-slate-800/50 bg-slate-900/20 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-black text-white shadow-lg">
                  {session.user.email[0].toUpperCase()}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-bold text-white truncate">{session.user.email.split('@')[0]}</span>
                  <span className="text-[10px] font-medium text-slate-500 truncate">Pro Account</span>
                </div>
              </div>
              <button 
                onClick={() => supabase.auth.signOut()}
                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, Image as ImageIcon, X, ChevronRight, Sun, Moon, Bot, Sparkles, Command } from 'lucide-react';
import Message from './Message';

export default function ChatArea({ 
  messages, input, setInput, handleSendMessage, isTyping, 
  isListening, toggleListening, darkMode, setDarkMode, 
  sidebarOpen, setSidebarOpen, selectedImage, setSelectedImage,
  imagePreview, setImagePreview, fileInputRef
}) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <main className="relative flex-1 flex flex-col h-screen overflow-hidden bg-[#0f172a]">
      {/* Premium Header */}
      <header className="h-16 flex items-center justify-between px-6 z-20 shrink-0 border-b border-white/5 bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {!sidebarOpen && (
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
              <Command size={20} />
            </button>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white tracking-tight">JimyAI</span>
            <span className="text-[10px] text-blue-400 font-medium uppercase tracking-widest">Premium Intelligence</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase tracking-tighter">
             Active
           </div>
        </div>
      </header>

      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 scroll-smooth px-4">
        <div className="max-w-3xl mx-auto w-full pt-8 pb-32">
          <AnimatePresence mode="popLayout">
            {messages.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-[60vh] flex flex-col items-center justify-center text-center px-6"
              >
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-8 shadow-2xl shadow-blue-500/20 rotate-3">
                  <Sparkles size={40} className="text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-3">Welcome to JimyAI</h2>
                <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
                  Your secure, high-performance intelligence engine. How can we innovate today?
                </p>
              </motion.div>
            ) : (
              messages.map((msg, idx) => (
                <Message key={idx} {...msg} />
              ))
            )}
          </AnimatePresence>
          {isTyping && <Message role="bot" content="" />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/90 to-transparent z-30">
        <div className="max-w-3xl mx-auto relative">
          {imagePreview && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="absolute -top-28 left-0"
            >
              <div className="relative group">
                <img src={imagePreview} className="h-20 w-20 object-cover rounded-2xl border-2 border-blue-500/30 shadow-2xl shadow-blue-500/20" alt="preview" />
                <button 
                  onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                  className="absolute -top-2 -right-2 bg-blue-500 text-white p-1.5 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            </motion.div>
          )}
          
          <form 
            onSubmit={handleSendMessage} 
            className="group flex flex-col bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-3xl focus-within:border-blue-500/50 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all duration-500 shadow-2xl"
          >
            <div className="flex items-end p-3 gap-3">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setSelectedImage(file);
                    const reader = new FileReader();
                    reader.onloadend = () => setImagePreview(reader.result);
                    reader.readAsDataURL(file);
                  }
                }} 
                className="hidden" 
                accept="image/*" 
              />
              
              <button 
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all shrink-0"
              >
                <ImageIcon size={22} />
              </button>
              
              <textarea 
                rows="1"
                value={input} 
                onChange={e => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }} 
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="Ask JimyAI anything..." 
                className="flex-1 bg-transparent px-2 py-3 text-base md:text-sm outline-none text-white placeholder-slate-500 resize-none max-h-60 overflow-y-auto"
              />

              <button 
                disabled={(!input.trim() && !selectedImage) || isTyping}
                className="p-3 rounded-2xl bg-blue-600 text-white hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 transition-all shadow-lg shadow-blue-600/20 shrink-0"
              >
                <Send size={20} />
              </button>
            </div>
          </form>
          <div className="flex justify-center mt-4">
             <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                <Sparkles size={10} className="text-blue-400" />
                <span className="text-[10px] text-slate-500 font-medium tracking-tight">Protected by JimyAI Security. Encrypted End-to-End.</span>
             </div>
          </div>
        </div>
      </div>
    </main>
  );
}

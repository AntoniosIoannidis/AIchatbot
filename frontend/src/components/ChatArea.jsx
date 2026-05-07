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
    <main className="relative flex-1 flex flex-col h-screen overflow-hidden bg-[#05070a]">
      {/* Centered Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full bg-blue-600/[0.03] blur-[120px] pointer-events-none" />

      {/* Ultra-Minimal Header */}
      <header className="h-24 flex items-center justify-between px-12 z-20">
        <div className="flex items-center space-x-6">
          {!sidebarOpen && (
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-3 text-slate-500 hover:text-white transition-colors"
            >
              <Command size={20} />
            </button>
          )}
          <div className="flex flex-col">
            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">
              System Active
            </h2>
            <span className="text-sm font-bold text-white mt-1">Intelligence Core</span>
          </div>
        </div>
        
        <button 
          onClick={() => setDarkMode(!darkMode)}
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/[0.03] border border-white/5 text-slate-400 hover:text-white transition-all"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto px-12 space-y-2 custom-scrollbar relative z-10 scroll-smooth">
        <div className="max-w-3xl mx-auto w-full pt-10">
          <AnimatePresence mode="popLayout">
            {messages.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-[60vh] flex flex-col items-center justify-center text-center"
              >
                <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center mb-12 relative">
                  <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse" />
                  <Bot size={40} className="text-blue-500 relative z-10" />
                </div>
                <h2 className="text-5xl font-black text-white mb-6 tracking-tighter">How can I help?</h2>
                <p className="text-slate-500 font-medium max-w-sm leading-relaxed">
                  Your private neural assistant is ready for complex tasks and creative inquiries.
                </p>
              </motion.div>
            ) : (
              messages.map((msg, idx) => (
                <Message key={idx} {...msg} />
              ))
            )}
          </AnimatePresence>
          {isTyping && <Message role="bot" content="" />}
          <div ref={messagesEndRef} className="h-32" />
        </div>
      </div>

      {/* Minimal Floating Input */}
      <div className="absolute bottom-0 left-0 w-full p-12 bg-gradient-to-t from-[#05070a] via-[#05070a]/90 to-transparent z-30">
        <div className="max-w-3xl mx-auto relative">
          {imagePreview && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="absolute -top-24 left-0"
            >
              <div className="relative group">
                <img src={imagePreview} className="h-20 w-20 object-cover rounded-2xl border border-white/10 shadow-2xl" alt="preview" />
                <button 
                  onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                  className="absolute -top-2 -right-2 bg-white text-black p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X size={12} />
                </button>
              </div>
            </motion.div>
          )}
          
          <form 
            onSubmit={handleSendMessage} 
            className="group flex items-center bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-2 rounded-[2.5rem] focus-within:border-blue-500/50 focus-within:bg-white/[0.05] transition-all duration-500"
          >
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
              className="p-4 text-slate-500 hover:text-white transition-colors"
            >
              <ImageIcon size={20} />
            </button>
            
            <input 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              placeholder="Type a message..." 
              className="flex-1 bg-transparent px-4 py-4 text-sm outline-none text-white placeholder-slate-600"
            />

            <button 
              disabled={(!input.trim() && !selectedImage) || isTyping}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white text-black hover:bg-blue-500 hover:text-white disabled:opacity-0 disabled:scale-90 transition-all duration-300 shadow-xl"
            >
              <Send size={18} />
            </button>
          </form>
          <div className="flex justify-center mt-6">
             <span className="text-[9px] font-bold text-slate-800 uppercase tracking-[0.6em]">Secure Protocol Active</span>
          </div>
        </div>
      </div>
    </main>
  );
}

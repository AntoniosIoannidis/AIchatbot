import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Image as ImageIcon, X, ArrowDown, Sparkles, Command, Menu } from 'lucide-react';
import Message from './Message';

export default function ChatArea({ 
  messages, input, setInput, handleSendMessage, isTyping, 
  sidebarOpen, setSidebarOpen, selectedImage, setSelectedImage,
  imagePreview, setImagePreview, fileInputRef
}) {
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isAtBottom && messages.length > 0);
  };

  return (
    <main className="chat-stage">
      {/* Sidebar Toggle Button (Top Left) */}
      <button 
        onClick={() => setSidebarOpen(true)}
        className="menu-toggle-btn"
        title="Open Sidebar"
      >
        <Menu size={20} />
      </button>

      {/* Brand Identity */}
      <div className="brand-header">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40 border border-white/10 mb-2"
        >
           <span className="text-2xl font-black text-white italic">J</span>
        </motion.div>
        <span className="brand-name">JimyAI</span>
        <span className="brand-tag">Premium Intelligence</span>
      </div>

      <div className="content-mount h-full">
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="message-list custom-scrollbar h-full"
        >
          <AnimatePresence mode="popLayout">
            {messages.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col items-center justify-center text-center px-4"
              >
                <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-8 border border-white/10">
                   <Sparkles className="w-10 h-10 text-indigo-400" />
                </div>
                <h2 className="text-4xl font-extrabold text-white tracking-tighter mb-4">What's the vision?</h2>
                <p className="text-slate-400 font-medium max-w-sm leading-relaxed">
                  JimyAI is an advanced neural engine designed to architect your next breakthrough.
                </p>
                <div className="flex gap-3 mt-8">
                   <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Logic V2.0</div>
                   <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Real-time Parsing</div>
                </div>
              </motion.div>
            ) : (
              messages.map((msg, idx) => (
                <Message key={idx} {...msg} />
              ))
            )}
          </AnimatePresence>
          {isTyping && <Message role="bot" content="" />}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Floating Scroll Button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={scrollToBottom}
            className="absolute bottom-32 right-12 p-3 rounded-full bg-indigo-600 text-white shadow-2xl shadow-indigo-600/40 hover:bg-indigo-500 transition-all z-50 border border-white/20"
          >
            <ArrowDown size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input Dock */}
      <div className="input-dock">
        {imagePreview && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute -top-24 left-6"
          >
            <div className="relative p-1.5 bg-[#0f172a]/80 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl">
              <img src={imagePreview} className="h-16 w-16 object-cover rounded-xl" alt="preview" />
              <button 
                onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-xl hover:scale-110 transition-transform"
              >
                <X size={10} />
              </button>
            </div>
          </motion.div>
        )}
        
        <form onSubmit={handleSendMessage} className="input-pill">
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
            style={{ display: 'none' }} 
            accept="image/*" 
          />
          
          <button 
            type="button"
            onClick={() => fileInputRef.current.click()}
            className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full text-slate-500 hover:text-white hover:bg-white/5 transition-all"
            title="Upload Knowledge"
          >
            <ImageIcon size={20} />
          </button>
          
          <textarea 
            rows="1"
            value={input} 
            onChange={e => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
            }} 
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            placeholder="Engineer a message..." 
            className="input-field"
          />

          <button 
            type="submit"
            disabled={(!input.trim() && !selectedImage) || isTyping}
            className="action-btn send-btn"
          >
            <Send size={18} />
          </button>
        </form>
        
        <div className="flex justify-center mt-4 mb-2">
          <div className="flex items-center gap-2 opacity-20 hover:opacity-40 transition-opacity cursor-default">
             <Command size={10} className="text-slate-500" />
             <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Neural Link Secure</span>
          </div>
        </div>
      </div>
    </main>
  );
}

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Image as ImageIcon, X, Command } from 'lucide-react';
import Message from './Message';

export default function ChatArea({ 
  messages, input, setInput, handleSendMessage, isTyping, 
  sidebarOpen, setSidebarOpen, selectedImage, setSelectedImage,
  imagePreview, setImagePreview, fileInputRef
}) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <main className="chat-stage">
      {/* Brand Identity */}
      <div className="brand-header">
        <span className="brand-name">JimyAI</span>
        <span className="brand-tag">Premium Intelligence</span>
      </div>

      {!sidebarOpen && (
        <button 
          onClick={() => setSidebarOpen(true)}
          className="absolute top-[34px] left-8 p-2 text-slate-400 hover:text-white transition-all z-50 bg-white/5 rounded-xl border border-white/5 backdrop-blur-md"
        >
          <Command size={18} />
        </button>
      )}

      <div className="content-mount">
        <div className="message-list custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {messages.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col items-center justify-center text-center opacity-60"
              >
                <h2 className="text-4xl font-extrabold text-white tracking-tighter mb-4">What's the vision?</h2>
                <p className="text-slate-400 font-medium max-w-sm">JimyAI is ready to engineer your next big idea.</p>
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

      {/* Input Dock */}
      <div className="input-dock">
        {imagePreview && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-20 left-4"
          >
            <div className="relative p-1 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
              <img src={imagePreview} className="h-14 w-14 object-cover rounded-xl" alt="preview" />
              <button 
                onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                className="absolute -top-2 -right-2 bg-indigo-600 text-white p-1 rounded-full shadow-xl"
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
            className="hidden" 
            accept="image/*" 
          />
          
          <button 
            type="button"
            onClick={() => fileInputRef.current.click()}
            className="text-slate-400 hover:text-white transition-all"
          >
            <ImageIcon size={20} />
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
            placeholder="Message JimyAI..." 
            className="input-field"
          />

          <button 
            disabled={(!input.trim() && !selectedImage) || isTyping}
            className="action-btn send-btn"
          >
            <Send size={18} />
          </button>
        </form>
        
        <div className="flex justify-center mt-4">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-30">JimyAI Secure Architecture</span>
        </div>
      </div>
    </main>
  );
}

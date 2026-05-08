import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Image as ImageIcon, X, Sparkles, Command, User as UserIcon } from 'lucide-react';
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
    <main className="flex-1 flex flex-col relative z-10">
      {/* Centered Floating Header */}
      <header className="absolute top-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50">
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl h-14 flex items-center justify-between px-6 shadow-2xl">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-400 hover:text-white transition-all">
                <Command size={18} />
              </button>
            )}
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
               <span className="text-sm font-bold tracking-tight text-white/90">JimyAI</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <span className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">Private Node</span>
          </div>
        </div>
      </header>

      {/* Main Centered Chat Container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pt-28 pb-40 px-4">
        <div className="max-w-3xl mx-auto flex flex-col space-y-6">
          <AnimatePresence mode="popLayout">
            {messages.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-[50vh] flex flex-col items-center justify-center text-center"
              >
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 animate-pulse"></div>
                  <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center relative shadow-2xl">
                    <Sparkles size={44} className="text-white" />
                  </div>
                </div>
                <h1 className="text-4xl font-black text-white mb-4 tracking-tighter">JimyAI</h1>
                <p className="text-slate-400 text-lg max-w-sm font-medium leading-relaxed">
                  Next-generation intelligence. <br/> Truly personal.
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

      {/* Floating Pill Input */}
      <div className="absolute bottom-8 left-0 right-0 px-4 z-40">
        <div className="max-w-2xl mx-auto relative">
          {imagePreview && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="absolute -top-24 left-6"
            >
              <div className="relative group p-1 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl">
                <img src={imagePreview} className="h-16 w-16 object-cover rounded-xl" alt="preview" />
                <button 
                  onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                  className="absolute -top-2 -right-2 bg-blue-600 text-white p-1.5 rounded-full hover:bg-red-500 transition-colors shadow-lg"
                >
                  <X size={10} />
                </button>
              </div>
            </motion.div>
          )}
          
          <form onSubmit={handleSendMessage} className="input-pill group">
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
              className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
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
              placeholder="Type your message..." 
              className="flex-1 bg-transparent py-3 text-base outline-none text-white placeholder-slate-500 resize-none max-h-60 overflow-y-auto"
            />

            <button 
              disabled={(!input.trim() && !selectedImage) || isTyping}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white text-black hover:bg-blue-500 hover:text-white disabled:bg-slate-800 disabled:text-slate-600 transition-all duration-300 shadow-xl"
            >
              <Send size={18} />
            </button>
          </form>
          
          <div className="flex justify-center mt-4">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] opacity-50">Secure JimyAI Connection</span>
          </div>
        </div>
      </div>
    </main>
  );
}

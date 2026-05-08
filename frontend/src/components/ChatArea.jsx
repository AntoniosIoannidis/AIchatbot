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
    <main className="relative flex-1 flex flex-col h-screen overflow-hidden bg-[#212121]">
      {/* Minimal Header */}
      <header className="h-14 flex items-center justify-between px-4 z-20 shrink-0">
        <div className="flex items-center gap-2">
          {!sidebarOpen && (
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-[#b4b4b4] hover:text-white transition-colors"
            >
              <Command size={20} />
            </button>
          )}
          <span className="text-sm font-semibold text-white ml-2">ChatGPT 4o</span>
        </div>
      </header>

      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 scroll-smooth">
        <div className="max-w-3xl mx-auto w-full pt-4 pb-32">
          <AnimatePresence mode="popLayout">
            {messages.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-[60vh] flex flex-col items-center justify-center text-center px-6"
              >
                <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mb-6">
                  <Bot size={24} className="text-white" />
                </div>
                <h2 className="text-2xl font-semibold text-white mb-2">How can I help you today?</h2>
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
      <div className="absolute bottom-0 left-0 w-full p-4 md:p-6 bg-gradient-to-t from-[#212121] via-[#212121] to-transparent z-30">
        <div className="max-w-3xl mx-auto relative">
          {imagePreview && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="absolute -top-24 left-0"
            >
              <div className="relative group">
                <img src={imagePreview} className="h-16 w-16 object-cover rounded-lg border border-white/10 shadow-2xl" alt="preview" />
                <button 
                  onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                  className="absolute -top-2 -right-2 bg-white text-black p-1 rounded-full shadow-lg"
                >
                  <X size={10} />
                </button>
              </div>
            </motion.div>
          )}
          
          <form 
            onSubmit={handleSendMessage} 
            className="group flex flex-col bg-[#2f2f2f] border border-white/10 rounded-2xl focus-within:border-white/20 transition-all duration-300"
          >
            <div className="flex items-end p-2 gap-2">
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
                className="p-2 text-[#b4b4b4] hover:text-white transition-colors shrink-0"
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
                placeholder="Message ChatGPT" 
                className="flex-1 bg-transparent px-2 py-2 text-base md:text-sm outline-none text-white placeholder-[#676767] resize-none max-h-60 overflow-y-auto"
              />

              <button 
                disabled={(!input.trim() && !selectedImage) || isTyping}
                className="p-2 rounded-lg bg-white text-black hover:bg-[#ececec] disabled:bg-[#3d3d3d] disabled:text-[#676767] transition-all shrink-0"
              >
                <Send size={18} />
              </button>
            </div>
          </form>
          <div className="flex justify-center mt-2">
             <span className="text-[11px] text-[#b4b4b4]">ChatGPT can make mistakes. Check important info.</span>
          </div>
        </div>
      </div>
    </main>
  );
}

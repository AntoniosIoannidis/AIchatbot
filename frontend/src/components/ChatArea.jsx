import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, Image as ImageIcon, X, ChevronRight, Sun, Moon, Bot, Sparkles } from 'lucide-react';
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

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <main className="relative flex-1 flex flex-col h-screen overflow-hidden bg-[#0b0f1a]">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-blue-600/5 blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="h-20 flex items-center justify-between px-8 border-b border-slate-800/50 bg-[#0b0f1a]/80 backdrop-blur-2xl z-20">
        <div className="flex items-center space-x-4">
          {!sidebarOpen && (
            <motion.button 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setSidebarOpen(true)}
              className="p-2.5 hover:bg-slate-800 rounded-xl transition-all text-slate-400 border border-slate-800"
            >
              <ChevronRight size={20} />
            </motion.button>
          )}
          <div className="flex flex-col">
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white flex items-center">
              Intelligence Engine <Sparkles size={14} className="ml-2 text-blue-400" />
            </h2>
            <span className="text-[10px] font-bold text-blue-500/80 uppercase tracking-widest mt-0.5">Gemini 1.5 Pro Active</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-wider mr-4">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-2" />
            System Secure
          </div>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2.5 hover:bg-slate-800 rounded-xl transition-all text-slate-400 border border-slate-800"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-2 custom-scrollbar relative z-10">
        <AnimatePresence>
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full flex flex-col items-center justify-center text-center px-4"
            >
              <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center mb-8 border border-blue-500/20 shadow-2xl">
                <Bot size={48} className="text-blue-400" />
              </div>
              <h2 className="text-3xl font-black text-white mb-4 tracking-tight">How can I assist you today?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full mt-8">
                {[
                  "Explain quantum computing in simple terms",
                  "Write a clean FastAPI endpoint for auth",
                  "How do I secure my React application?",
                  "Analyze this image for architectural details"
                ].map((suggestion, i) => (
                  <button 
                    key={i}
                    onClick={() => setInput(suggestion)}
                    className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/50 text-left text-sm text-slate-400 hover:text-white transition-all group"
                  >
                    {suggestion}
                    <ChevronRight size={14} className="inline ml-2 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </button>
                ))}
              </div>
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

      {/* Input Area */}
      <div className="p-8 bg-gradient-to-t from-[#0b0f1a] via-[#0b0f1a] to-transparent relative z-20">
        <div className="max-w-4xl mx-auto">
          {imagePreview && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 inline-block relative group"
            >
              <img src={imagePreview} className="h-20 w-20 object-cover rounded-2xl border-2 border-blue-500 shadow-xl" alt="preview" />
              <button 
                onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all"
              >
                <X size={12} />
              </button>
            </motion.div>
          )}
          
          <form 
            onSubmit={handleSendMessage} 
            className="flex items-center space-x-2 bg-slate-900/80 backdrop-blur-xl p-2 rounded-[2rem] border border-slate-800 shadow-2xl focus-within:ring-2 focus-within:ring-blue-500/30 transition-all"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={onFileChange} 
              className="hidden" 
              accept="image/*" 
            />
            <button 
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="p-3 rounded-2xl text-slate-500 hover:text-blue-400 hover:bg-slate-800 transition-all"
            >
              <ImageIcon size={22} />
            </button>
            
            <button 
              type="button" 
              onClick={toggleListening} 
              className={`p-3 rounded-2xl transition-all ${isListening ? 'bg-red-500/20 text-red-500' : 'text-slate-500 hover:text-blue-400 hover:bg-slate-800'}`}
            > 
              {isListening ? <MicOff size={22} className="animate-pulse" /> : <Mic size={22} />}
            </button>

            <input 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              placeholder="Enter your prompt here..." 
              className="flex-1 bg-transparent px-4 py-3 text-sm outline-none text-white placeholder-slate-500"
            />

            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={(!input.trim() && !selectedImage) || isTyping}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white p-4 rounded-[1.5rem] transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50 disabled:shadow-none"
            >
              <Send size={20} />
            </motion.button>
          </form>
          <p className="text-[10px] text-center text-slate-600 mt-4 font-bold uppercase tracking-widest">
            End-to-end encrypted session • Neural Engine v4.0
          </p>
        </div>
      </div>
    </main>
  );
}

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { User, Bot, Copy, Check, Volume2, VolumeX } from 'lucide-react';

export default function Message({ role, content, image }) {
  const isUser = role === 'user';
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (!content) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(content);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`w-full py-8 ${!isUser ? 'bg-white/5 border-y border-white/5' : ''} group`}
    >
      <div className="max-w-3xl mx-auto flex gap-4 md:gap-6 px-6">
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border ${
          isUser ? 'bg-white text-black' : 'bg-blue-600 text-white border-blue-400/20 shadow-lg shadow-blue-500/20'
        }`}>
          {isUser ? <User size={18} /> : <Bot size={20} />}
        </div>
        
        <div className="flex-1 flex flex-col min-w-0">
          <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${isUser ? 'text-slate-400' : 'text-blue-400'}`}>
            {isUser ? 'You' : 'JimyAI'}
          </div>

          {image && (
            <div className="mb-4">
              <img src={image} className="max-w-full md:max-w-sm rounded-lg border border-white/10 shadow-lg" alt="attachment" />
            </div>
          )}
          
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>

          {!isUser && content === '' && (
            <div className="flex space-x-1.5 items-center mt-2">
              <div className="w-1.5 h-1.5 bg-[#ececec] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-[#ececec] rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
              <div className="w-1.5 h-1.5 bg-[#ececec] rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
            </div>
          )}

          {!isUser && content && (
            <div className="flex items-center gap-1 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={handleCopy}
                className="p-1.5 text-[#b4b4b4] hover:text-[#ececec] transition-colors rounded-md hover:bg-[#2f2f2f]"
                title="Copy"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              </button>
              <button 
                onClick={handleSpeak}
                className="p-1.5 text-[#b4b4b4] hover:text-[#ececec] transition-colors rounded-md hover:bg-[#2f2f2f]"
                title="Read aloud"
              >
                {isSpeaking ? <VolumeX size={14} className="text-emerald-500" /> : <Volume2 size={14} />}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

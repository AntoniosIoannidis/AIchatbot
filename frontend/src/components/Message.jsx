import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { Copy, Check, Volume2, VolumeX, Sparkles } from 'lucide-react';

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
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
    >
      <div className={`msg-bubble ${isUser ? 'msg-user' : 'msg-bot'}`}>
        {!isUser && (
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={12} className="text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400/80">JimyAI</span>
          </div>
        )}

        {image && (
          <div className="mb-4">
            <img src={image} className="max-w-full rounded-2xl border border-white/10 shadow-lg" alt="attachment" />
          </div>
        )}
        
        <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:my-4">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>

        {!isUser && content === '' && (
          <div className="flex space-x-2 items-center mt-2 py-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
          </div>
        )}

        {!isUser && content && (
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
            <button 
              onClick={handleCopy}
              className="p-1.5 text-slate-400 hover:text-white transition-colors"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>
            <button 
              onClick={handleSpeak}
              className="p-1.5 text-slate-400 hover:text-white transition-colors"
            >
              {isSpeaking ? <VolumeX size={14} className="text-red-400" /> : <Volume2 size={14} />}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
